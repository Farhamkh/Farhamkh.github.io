import { createAdapter } from './llm-adapter.js';

const STORAGE_KEY = 'ai:history:v1';
const MAX_HISTORY = 20;

export function initAICompanion(rootSel = '#ai-companion') {
  const root = document.querySelector(rootSel);
  if (!root) return;

  const el = {
    intro:      root.querySelector('#ai-intro'),
    start:      root.querySelector('#ai-start'),
    progWrap:   root.querySelector('#ai-progress'),
    progBar:    root.querySelector('#ai-bar'),
    progText:   root.querySelector('#ai-status'),
    chatWrap:   root.querySelector('#ai-chat'),
    log:        root.querySelector('#ai-log'),
    chips:      root.querySelector('#ai-chips'),
    form:       root.querySelector('#ai-form'),
    input:      root.querySelector('#ai-input'),
    send:       root.querySelector('#ai-send'),
    clear:      root.querySelector('#ai-clear'),
    unsupported:root.querySelector('#ai-unsupported'),
  };

  let adapter = null;
  let busy = false;
  let history = loadHistory();

  // Render any stored history
  if (history.length) {
    showChat();
    history.forEach(msg => appendBubble(msg.role, msg.content));
  }

  // Events
  el.start?.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    el.progWrap.hidden = false;
    el.start.disabled = true;

    try {
      adapter = await createAdapter({
        onProgress: (pct, status) => {
          el.progBar.style.width = `${Math.round(pct)}%`;
          el.progText.textContent = status;
        }
      });

      if (!adapter) {
        // unsupported or load failed
        el.intro.hidden = true;
        el.chatWrap.hidden = true;
        el.unsupported.hidden = false;
        return;
      }

      showChat(); // switch UI
    } catch (err) {
      console.error(err);
      el.progText.textContent = 'Load failed. This device may not support in-browser models.';
      el.unsupported.hidden = false;
      el.intro.hidden = true;
    } finally {
      busy = false;
    }
  });

  el.chips?.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    el.input.value = b.getAttribute('data-prompt') || '';
    el.input.focus();
  });

  el.clear?.addEventListener('click', () => {
    history = [];
    saveHistory(history);
    el.log.innerHTML = '';
    el.input.value = '';
    el.input.focus();
  });

  el.form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!adapter || busy) return;
    const text = el.input.value.trim();
    if (!text) return;

    // add user message
    appendBubble('user', text);
    history.push({ role: 'user', content: text });
    saveHistory(history);
    el.input.value = '';
    el.input.focus();

    // get assistant response
    busy = true;
    el.log.setAttribute('aria-busy', 'true');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let botEl = appendBubble('assistant', reduceMotion ? '' : ''); // target element to stream into
    let out = '';

    try {
      if (adapter.supportsStreaming && !reduceMotion) {
        await adapter.generate(text, {
          onToken: (t) => {
            out += t;
            botEl.textContent = out;
            scrollLogToBottom(el.log);
          }
        });
      } else {
        const full = await adapter.generate(text, {});
        out = full;
        botEl.textContent = out;
      }
    } catch (err) {
      console.error(err);
      botEl.textContent = '⚠️ Error generating a response. Try again or clear chat.';
    } finally {
      history.push({ role: 'assistant', content: out });
      history = history.slice(-MAX_HISTORY);
      saveHistory(history);
      busy = false;
      el.log.setAttribute('aria-busy', 'false');
      scrollLogToBottom(el.log);
    }
  });

  function showChat() {
    el.intro.hidden = true;
    el.progWrap.hidden = true;
    el.chatWrap.hidden = false;
  }

  function appendBubble(role, content) {
    const b = document.createElement('div');
    b.className = `ai-bubble ${role === 'user' ? 'user' : 'bot'}`;
    b.textContent = content;
    el.log.appendChild(b);
    scrollLogToBottom(el.log);
    return b;
  }
}

function scrollLogToBottom(box) {
  box.scrollTop = box.scrollHeight;
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveHistory(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-MAX_HISTORY)));
  } catch { /* storage may be full/blocked */ }
}
