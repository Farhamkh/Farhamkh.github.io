import { createAdapter } from './llm-adapter.js';
import { PROJECTS, SKILLS } from './data.js';

const STORAGE_KEY = 'ai:history:v1';
const MAX_HISTORY = 20;

// ---- Built content within data.js ----
const SYSTEM_BASE = `You are an AI companion for Farham Khademi’s portfolio.
Farham is a freelancer who bridges business goals and software execution.
From web apps to AI-assisted tools, his focus is building pragmatic systems
that are maintainable, secure, and cost-effective.

Answer questions concisely and helpfully. If asked about projects, skills, or tech,
use the details below. If you don't know, say so and suggest visiting the repo or projects page.`;

function buildPortfolioContext(projects, skills) {
  const skillsLine = skills && skills.length
    ? `Skills: ${skills.join(', ')}\n\n`
    : '';

  const projLines = (projects || []).map(p => {
    const tech = (p.tech || []).join(', ');
    return `• ${p.title}: ${p.blurb} [Tech: ${tech}]`;
  }).join('\n');

  // keep small for tiny models
  const ctx = `${skillsLine}Projects:\n${projLines}`;
  return ctx.length > 3000 ? ctx.slice(0, 3000) + '\n…' : ctx;
}

function getSystemPrompt() {
  return `${SYSTEM_BASE}\n\n${buildPortfolioContext(PROJECTS, SKILLS)}`;
}

export function initAICompanion(rootSel = '#ai-companion') {
  const root = document.querySelector(rootSel);
  if (!root) return;

  const el = {
    intro:        root.querySelector('#ai-intro'),
    start:        root.querySelector('#ai-start'),
    progWrap:     root.querySelector('#ai-progress'),
    progBar:      root.querySelector('#ai-bar'),
    progText:     root.querySelector('#ai-status'),
    chatWrap:     root.querySelector('#ai-chat'),
    log:          root.querySelector('#ai-log'),
    chips:        root.querySelector('#ai-chips'),
    form:         root.querySelector('#ai-form'),
    input:        root.querySelector('#ai-input'),
    send:         root.querySelector('#ai-send'),
    clear:        root.querySelector('#ai-clear'),
    unsupported:  root.querySelector('#ai-unsupported'),
    card:         root.querySelector('.ai-card')
  };

  let adapter = null;
  let busy = false;
  let history = loadHistory();

  // WebGPU gate
  if (!navigator.gpu) {
    el.unsupported.hidden = false;
    el.card?.classList.add('is-disabled');
    if (el.start) el.start.disabled = true;
    return;
  }

  // Restore history
  if (history.length) {
    showChat();
    history.forEach(msg => appendBubble(msg.role, msg.content));
  }

  // Start -> lazy-load model
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

      if (!adapter) throw new Error('Adapter did not initialize.');
      showChat();
    } catch (err) {
      console.error('[AI] load error:', err);
      el.progText.textContent = 'Load failed.';
      const p = document.createElement('p');
      p.style.color = 'var(--muted)';
      p.style.marginTop = '.5rem';
      p.textContent = `Reason: ${err?.message || String(err)}`;
      el.progWrap.appendChild(p);
      el.intro.hidden = false;
      el.start.disabled = false;
    } finally {
      busy = false;
    }
  });

  // Chips -> fill input
  el.chips?.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    el.input.value = b.getAttribute('data-prompt') || '';
    el.input.focus();
  });

  // Clear chat
  el.clear?.addEventListener('click', () => {
    history = [];
    saveHistory(history);
    el.log.innerHTML = '';
    el.input.value = '';
    el.input.focus();
  });

  // Send
  el.form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!adapter || busy) return;
    const text = el.input.value.trim();
    if (!text) return;

    appendBubble('user', text);
    history.push({ role: 'user', content: text });
    saveHistory(history);
    el.input.value = '';
    el.input.focus();

    busy = true;
    el.log.setAttribute('aria-busy', 'true');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let botEl = appendBubble('assistant', '');
    let out = '';
    const SYSTEM_PROMPT = getSystemPrompt(); // always fresh from data.js

    try {
      if (adapter.supportsStreaming && !reduceMotion) {
        await adapter.generate(text, {
          systemPrompt: SYSTEM_PROMPT,
          onToken: (t) => {
            out += t;
            botEl.textContent = out;
            scrollLogToBottom(el.log);
          }
        });
      } else {
        out = await adapter.generate(text, { systemPrompt: SYSTEM_PROMPT });
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

  // Helpers
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

function scrollLogToBottom(box) { box.scrollTop = box.scrollHeight; }
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(arr) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-MAX_HISTORY))); }
  catch {}
}
