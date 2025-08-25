import { qs } from './utils.js';
import { PROJECTS_DATA, THEMES } from './data.js';

export function initGraph() {
  const svg = qs('#graph-svg');
  if (!svg) return;

  // basic radial placement: themes top-left/top-right/bottom
  svg.setAttribute('viewBox', '0 0 1000 700');
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // edges group
  const gEdges = document.createElementNS('http://www.w3.org/2000/svg','g');
  gEdges.setAttribute('stroke', 'currentColor');
  gEdges.setAttribute('stroke-opacity', '0.35');
  svg.appendChild(gEdges);

  // nodes group
  const gNodes = document.createElementNS('http://www.w3.org/2000/svg','g');
  svg.appendChild(gNodes);

  // Theme anchors
  const themePositions = [
    { x: 250, y: 180 },
    { x: 750, y: 180 },
    { x: 500, y: 520 }
  ];
  THEMES.slice(0,3).forEach((t, i) => {
    const n = nodeCircle(themePositions[i].x, themePositions[i].y, 38, 'theme', t);
    gNodes.appendChild(n);
  });

  // Place featured projects near themes (very simple mapping)
  const featured = PROJECTS_DATA.filter(p => p.featured);
  const ringR = 120;
  featured.forEach((p, i) => {
    const anchor = themePositions[i % themePositions.length];
    const angle = (-Math.PI/4) + i * (Math.PI/6);
    const x = anchor.x + ringR * Math.cos(angle);
    const y = anchor.y + ringR * Math.sin(angle);

    // edge
    gEdges.appendChild(edgeLine(anchor.x, anchor.y, x, y));

    // node
    const proj = nodeCircle(x, y, 26, 'project', p.title);
    proj.setAttribute('tabindex', '0');
    proj.setAttribute('role', 'button');
    proj.setAttribute('aria-label', `Project ${p.title}. ${p.blurb}`);
    proj.addEventListener('click', () => openPanel(p));
    proj.addEventListener('keypress', e => { if (e.key === 'Enter') openPanel(p); });
    gNodes.appendChild(proj);
  });

  // simple info panel filler
  function openPanel(p) {
    const panel = qs('#project-panel');
    if (!panel) return;
    panel.innerHTML = `
      <h3 id="panel-title">${p.title}</h3>
      <p>${p.blurb || ''}</p>
      <p>${(p.tech || []).map(t => `<span class="badge">${t}</span>`).join(' ')}</p>
      <p class="links">
        ${p.links?.demo ? `<a href="${p.links.demo}" target="_blank" rel="noopener">Live ↗</a>` : ''}
        ${p.links?.repo ? `<a href="${p.links.repo}" target="_blank" rel="noopener">Repo ↗</a>` : ''}
      </p>
    `;
  }
}

function nodeCircle(x, y, r, kind, label) {
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns,'g');
  g.setAttribute('transform', `translate(${x},${y})`);

  const c = document.createElementNS(ns,'circle');
  c.setAttribute('r', r);
  c.setAttribute('class', `node node--${kind}`);
  c.setAttribute('fill', kind === 'project' ? 'var(--bg-elev)' : 'transparent');
  c.setAttribute('stroke', 'var(--border)');
  g.appendChild(c);

  const text = document.createElementNS(ns,'text');
  text.setAttribute('fill', 'var(--muted)');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dy', r + 18);
  text.setAttribute('font-size', '12');
  text.textContent = label;
  g.appendChild(text);

  return g;
}

function edgeLine(x1, y1, x2, y2) {
  const ns = 'http://www.w3.org/2000/svg';
  const l = document.createElementNS(ns,'line');
  l.setAttribute('x1', x1); l.setAttribute('y1', y1);
  l.setAttribute('x2', x2); l.setAttribute('y2', y2);
  l.setAttribute('class', 'edge edge--theme');
  return l;
}
