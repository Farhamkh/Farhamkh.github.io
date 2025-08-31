// Can swap later without changing the UI/controller.
const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f32_1-MLC";

// CDN to lazy-load the library ONLY after Start Chat.
// If one fails in your environment, switch to the other.
const CDN_ESM = "https://esm.run/@mlc-ai/web-llm";

export async function createAdapter({ onProgress } = {}) {
  // Basic capability check (WebGPU)
  if (!('gpu' in navigator)) {
    return null;
  }

  // Inject the ESM script tag lazily (no preloading on page load)
  await loadScript(CDN_ESM);

  const webllm = globalThis.webllm || globalThis.WebLLM || globalThis['@mlc-ai/web-llm'];
  if (!webllm || !webllm.CreateMLCEngine) {
    // Couldn’t find the lib on the global after load
    return null;
  }

  // Progress helper
  const progressCb = (info) => {
    // info: { progress: 0..1, text: string }
    if (onProgress) {
      const pct = Math.round((info.progress ?? 0) * 100);
      onProgress(pct, info.text || statusFromStage(pct));
    }
  };

  // Create/initialize engine
  const engine = await webllm.CreateMLCEngine(MODEL_ID, {
    initProgressCallback: progressCb
  });

  // Return the adapter instance the UI expects
  return new WebLLMAdapter(engine);
}

class WebLLMAdapter {
  constructor(engine) {
    this.engine = engine;
    this.supportsStreaming = true;
  }

  async generate(userText, { onToken } = {}) {
    // Build minimal chat history for the model (stateless per prompt here).
    // If you want to pass full history, you can accumulate and pass it in.
    const messages = [{ role: 'user', content: userText }];

    if (onToken) {
      const r = await this.engine.chat.completions.create({
        messages,
        stream: true,
        stream_options: { include_usage: false }
      });

      for await (const chunk of r) {
        const t = chunk?.choices?.[0]?.delta?.content ?? '';
        if (t) onToken(t);
      }
      return ''; // streamed already
    } else {
      const r = await this.engine.chat.completions.create({ messages });
      return r?.choices?.[0]?.message?.content ?? '';
    }
  }

  dispose() {
    try { this.engine?.unload(); } catch {}
  }
}

/* utils */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.type = 'module'; // ESM
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}
function statusFromStage(pct) {
  if (pct < 10) return "Fetching weights…";
  if (pct < 40) return "Downloading…";
  if (pct < 70) return "Compiling kernels…";
  if (pct < 95) return "Warming up…";
  return "Almost ready…";
}
