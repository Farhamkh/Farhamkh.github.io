const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f32_1-MLC"; // small, WebLLM-prebuilt
const WEBLLM_ESM = "https://esm.run/@mlc-ai/web-llm";

/** Create the runtime adapter used by AI Companion UI. */
export async function createAdapter({ onProgress } = {}) {
    // Environment guard 
    if (!('gpu' in navigator)) return null;

    // 1) Load the library lazily
    onProgress?.(5, "Loading runtime…");
    let webllm;
    try {
        webllm = await import(WEBLLM_ESM); // ESM dynamic import, no globals
    } catch (e) {
        throw new Error("Failed to load WebLLM ESM: " + (e?.message || e));
    }

    const { CreateMLCEngine } = webllm;
    if (typeof CreateMLCEngine !== "function") {
        throw new Error("WebLLM not available (CreateMLCEngine missing).");
    }

    // 2) Initialize the engine with progress
    const progressCb = (info = {}) => {
        const pct = Math.round(((info.progress ?? 0) * 100));
        onProgress?.(pct, info.text || statusFromStage(pct));
    };

    let engine;
    try {
        engine = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback: progressCb,
            logLevel: "warn",
        });
    } catch (e) {
        throw new Error("Engine init failed: " + (e?.message || e));
    }

    return {
        supportsStreaming: true,
        /**
         * @param {string} userText
         * @param {{ onToken?: (t:string)=>void, systemPrompt?: string, signal?: AbortSignal }} opts
         */

        async generate(userText, { onToken, systemPrompt, signal } = {}) {
            const messages = [];
            if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
            messages.push({ role: "user", content: userText });

            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
            const onAbort = () => {
                try {
                    // Some WebLLM builds expose interrupt APIs; call if present
                    engine.interruptGenerate?.();
                    engine.reset_chat?.();
                } catch { }
            };

            signal?.addEventListener('abort', onAbort, { once: true });


            try {
            if (onToken) {
                const stream = await engine.chat.completions.create({
                    messages,
                    stream: true,
                    stream_options: { include_usage: false },
                });

                for await (const chunk of stream) {
                    if (signal?.aborted) break;
                    const t = chunk?.choices?.[0]?.delta?.content ?? "";
                    if (t) onToken(t);
                }
                return ""; // streamed
            } else {
                if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
                const r = await engine.chat.completions.create({ messages });
                return r?.choices?.[0]?.message?.content ?? "";
            }
        } finally {
            signal?.removeEventListener('abort', onAbort);
        }
        },
        dispose() {
            try { engine.unload(); } catch { }
        }
    };
}

/* ----- helpers ----- */
function statusFromStage(pct) {
    if (pct < 10) return "Fetching weights…";
    if (pct < 40) return "Downloading…";
    if (pct < 70) return "Compiling kernels…";
    if (pct < 95) return "Warming up…";
    return "Almost ready…";
}
