// assets/hero.js
import { qs, prefersReducedMotion } from './utils.js';

/**
 * Lightweight hero background animation:
 * - Canvas waves + gradient (GPU-friendly)
 * - Respects reduced motion (renders 1 static frame)
 * - Pauses when tab hidden
 * - Reacts to theme changes (reads CSS vars)
 * - ~30 FPS cap for low CPU usage
 */
export function initHero(selector = '.hero-canvas') {
  const host = qs(selector);
  if (!host) return;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  // Colors from CSS variables (update on theme change)
  let colors = readColors();
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    // Fallbacks keep it robust if vars aren’t found
    return {
      accent: cs.getPropertyValue('--accent').trim() || '#4f46e5',
      bg: cs.getPropertyValue('--bg').trim() || '#0b0b0f',
      elev: cs.getPropertyValue('--bg-elev').trim() || '#12121a',
      border: cs.getPropertyValue('--border').trim() || '#23232f',
      muted: cs.getPropertyValue('--muted').trim() || '#9aa0a6',
    };
  }

  // Resize canvas to host size (with DPR)
  function resize() {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    w = Math.max(800, Math.floor(rect.width));
    h = Math.max(320, Math.floor(rect.height));
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset transform for DPR scaling
  }

  // Simple seeded noise-ish function for subtle variety
  const noise = (x, t, k = 0.012, s = 0.8) =>
    Math.sin(x * k + t * s) * 0.6 + Math.sin(x * k * 0.5 + t * s * 1.7) * 0.4;

  // 30 FPS cap
  const FRAME_MS = 1000 / 30;
  let lastMs = 0;
  let raf = 0;

  function drawFrame(ms) {
    // FPS cap
    if (ms - lastMs < FRAME_MS) {
      raf = requestAnimationFrame(drawFrame);
      return;
    }
    lastMs = ms;

    const t = ms * 0.0015; // master time
    ctx.clearRect(0, 0, w, h);

    // Gradient background (accent → transparent)
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, hexToRgba(colors.accent, 0.20));
    g.addColorStop(1, hexToRgba(colors.accent, 0.05));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Two translucent wave layers
    drawWave({ yBase: h * 0.62, amp: 18, speed: 0.8, k: 0.012, fill: hexToRgba(colors.accent, 0.16), t });
    drawWave({ yBase: h * 0.70, amp: 28, speed: 0.6, k: 0.009,  fill: hexToRgba(colors.accent, 0.10), t: t * 0.9 + 5 });

    raf = requestAnimationFrame(drawFrame);
  }

  function drawStatic() {
    // Single still frame for reduced motion
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, hexToRgba(colors.accent, 0.18));
    g.addColorStop(1, hexToRgba(colors.accent, 0.06));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    drawWave({ yBase: h * 0.66, amp: 20, speed: 0, k: 0.011, fill: hexToRgba(colors.accent, 0.12), t: 8.3 });
  }

  function drawWave({ yBase, amp, speed, k, fill, t }) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y = yBase + noise(x, t, k, speed) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function play() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(drawFrame);
  }
  function stop() {
    cancelAnimationFrame(raf);
  }

  // Helpers
  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '').trim();
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Boot
  resize();
  if (prefersReducedMotion()) {
    drawStatic();
  } else {
    play();
  }

  // React to: resize, tab hide/show, theme change
  const onResize = () => { resize(); prefersReducedMotion() ? drawStatic() : null; };
  window.addEventListener('resize', onResize, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!prefersReducedMotion()) play();
  });

  // Observe theme changes (data-theme attribute toggled by your toggle)
  const mo = new MutationObserver(() => {
    colors = readColors();
    // repaint with new accent color
    prefersReducedMotion() ? drawStatic() : null;
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Expose controls (future hooks)
  window.hero = { play, stop, refresh: () => { colors = readColors(); resize(); prefersReducedMotion() ? drawStatic() : play(); } };
}
