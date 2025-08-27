// Radial knowledge graph: themes, projects, tech

import { PROJECTS, TECH, THEMES } from "./data.js";

// Public entry
export function initGraph(root = document) {
  const svg = root.querySelector("#graph-svg");
  const panel = root.querySelector("#project-panel");
  if (!svg) return;

  const data = buildGraphData(PROJECTS, TECH, THEMES);
  const layout = layoutColumns(data); 
  renderGraph(svg, layout, data, panel);
  attachGraphInteractions(svg, panel, data);
}

/* ---------- Build graph (nodes + edges) ---------- */
function buildGraphData(projects, techList, themes) {
  const nodes = [];
  const edges = [];

  // Theme nodes
  themes.forEach((t) => nodes.push({ id: `theme:${t}`, type: "theme", label: t }));

  // Project nodes
  projects.forEach((p) => nodes.push({ id: `proj:${p.id}`, type: "project", label: p.title }));

  // Tech nodes (only those actually used by at least one project)
  const usedTech = new Set();
  projects.forEach((p) => (p.tech || []).forEach((t) => usedTech.add(t)));
  techList
    .filter((t) => usedTech.has(t))
    .forEach((t) => nodes.push({ id: `tech:${t}`, type: "tech", label: t }));

  // Edges: project ↔ theme (dotted)
  projects.forEach((p) => {
    (p.themes || []).forEach((th) => {
      if (!themes.includes(th)) return;
      edges.push({
        id: `e:${p.id}->${th}`,
        type: "theme",
        source: `proj:${p.id}`,
        target: `theme:${th}`
      });
    });
  });

  // Edges: project ↔ tech (solid)
  projects.forEach((p) => {
    (p.tech || []).forEach((t) => {
      if (!usedTech.has(t)) return;
      edges.push({
        id: `e:${p.id}~${t}`,
        type: "tech",
        source: `proj:${p.id}`,
        target: `tech:${t}`
      });
    });
  });

  // Lookup maps for quick panel fill
  const projMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  return { nodes, edges, projMap };
}

// Column layout: Themes (L) — Projects (C) — Tech (R)
export function layoutColumns(data) {
  const { nodes, edges } = data;
  const w = 1000, h = 700;

  // Column X positions
  const PAD_X = 80;           // side padding
  const colGap = (w - PAD_X * 2) / 2;     // L, C, R spacing
  const xTheme = PAD_X;                   // left column
  const xProj  = PAD_X + colGap;          // center column
  const xTech  = PAD_X + colGap * 2;      // right column

  // Vertical spacing helpers
  const PAD_Y = 50;            // top/bottom padding
  const usableH = h - PAD_Y * 2;

  const themes  = nodes.filter(n => n.type === "theme");
  const projects = nodes.filter(n => n.type === "project");
  const techs    = nodes.filter(n => n.type === "tech");

  // Map: project -> first theme (primary)
  const projPrimaryTheme = new Map();
  projects.forEach(p => {
    const e = edges.find(e => e.type === "theme" && e.source === p.id);
    if (e) projPrimaryTheme.set(p.id, e.target);
  });

  // Order themes as they appear in data 
  // themes.sort((a,b) => a.label.localeCompare(b.label));

  // Order projects by their primary theme, then by label
  const themeIndex = new Map(themes.map((t, i) => [t.id, i]));
  projects.sort((a, b) => {
    const ta = themeIndex.get(projPrimaryTheme.get(a.id)) ?? 0;
    const tb = themeIndex.get(projPrimaryTheme.get(b.id)) ?? 0;
    if (ta !== tb) return ta - tb;
    return a.label.localeCompare(b.label);
  });

  // For tech: compute the (average) project row index they connect to
  const projRowIndex = new Map(projects.map((p, i) => [p.id, i]));
  const techScore = new Map();
  techs.forEach(t => {
    const linkedRows = edges
      .filter(e => e.type === "tech" && e.target === t.id)
      .map(e => projRowIndex.get(e.source))
      .filter(i => i !== undefined);
    const avg = linkedRows.length
      ? linkedRows.reduce((s, v) => s + v, 0) / linkedRows.length
      : Number.POSITIVE_INFINITY;
    techScore.set(t.id, avg);
  });
  techs.sort((a, b) => techScore.get(a.id) - techScore.get(b.id));

  // Vertical positions for each column
  const yForIndex = (i, count) => {
    if (count <= 1) return PAD_Y + usableH / 2;
    const step = usableH / (count - 1);
    return PAD_Y + step * i;
  };

  const pos = {};
  themes.forEach((n, i)   => { pos[n.id] = { x: xTheme, y: yForIndex(i, themes.length)   }; });
  projects.forEach((n, i) => { pos[n.id] = { x: xProj,  y: yForIndex(i, projects.length) }; });
  techs.forEach((n, i)    => { pos[n.id] = { x: xTech,  y: yForIndex(i, techs.length)    }; });

  // Keep inside bounds (account for label to the right of tech/project)
  const PAD = 24, LABEL_PAD = 90;
  nodes.forEach(n => {
    const p = pos[n.id];
    if (!p) return;
    const r = (n.type === "theme") ? 42 : (n.type === "project" ? 24 : 16);
    const extraRight = (n.type === "theme") ? 0 : LABEL_PAD;
    const minX = PAD + r;
    const maxX = w - PAD - r - extraRight;
    const minY = PAD + r;
    const maxY = h - PAD - r;
    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.y = Math.max(minY, Math.min(maxY, p.y));
  });

  return { w, h, pos };
}


/* ---------- Layout (pure-ish) ---------- */
export function layoutRadial(data) {
  const { nodes, edges } = data;
  const w = 1000, h = 700;
  const cx = w / 2, cy = h / 2;

  // ---- 1) THEMES ----
  const themeRadius = Math.min(w, h) * 0.1;       // further out
  const themeAnglesDeg = [-25, 95, 215];
  const themePos = {};
  let tIdx = 0;
  const themes = nodes.filter(n => n.type === "theme");
  themes.forEach(n => {
    const a = (themeAnglesDeg[tIdx++ % themeAnglesDeg.length] * Math.PI) / 180;
    themePos[n.id] = { x: cx + Math.cos(a) * themeRadius, y: cy + Math.sin(a) * themeRadius, a };
  });

  // Build quick lookups
  const projects = nodes.filter(n => n.type === "project");
  const techs = nodes.filter(n => n.type === "tech");

  const projectsByTheme = new Map();
  projects.forEach(p => {
    const e = edges.find(e => e.type === "theme" && e.source === p.id);
    const themeId = e?.target;
    if (!themeId) return;
    (projectsByTheme.get(themeId) || projectsByTheme.set(themeId, []).get(themeId)).push(p.id);
  });

  // ---- 2) PROJECTS around each theme (wider arc & bigger radius) ----
  const projPos = {};
  const projectRadius = 230;            
  const arcSpread = Math.PI / 1.6;      
  themes.forEach(th => {
    const list = projectsByTheme.get(th.id) || [];
    const n = list.length;
    if (!n) return;
    const base = Math.atan2(themePos[th.id].y - cy, themePos[th.id].x - cx);
    list.forEach((pid, i) => {
      const rel = (n === 1) ? 0 : (i - (n - 1) / 2) / ((n - 1) / 2); // -1..+1
      const ang = base + (rel * arcSpread) / 2;
      projPos[pid] = {
        x: themePos[th.id].x + Math.cos(ang) * projectRadius,
        y: themePos[th.id].y + Math.sin(ang) * projectRadius
      };
    });
  });

  // ---- 3) TECH: centroid of linked projects, pushed outward more ----
  const techPos = {};
  const techOutward = 300;  // was 100
  const jitterMag = 24;   // slightly bigger
  const hashToUnit = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h % 2000) / 1000 - 1; };

  techs.forEach(t => {
    const linked = edges
      .filter(e => e.type === "tech" && e.target === t.id)
      .map(e => projPos[e.source])
      .filter(Boolean);

    let x = cx, y = cy;
    if (linked.length) {
      x = linked.reduce((s, p) => s + p.x, 0) / linked.length;
      y = linked.reduce((s, p) => s + p.y, 0) / linked.length;
    }
    const dx = x - cx, dy = y - cy, mag = Math.hypot(dx, dy) || 1;
    x += (dx / mag) * techOutward;
    y += (dy / mag) * techOutward;

    const jitter = hashToUnit(t.id) * Math.PI / 5;
    const a = Math.atan2(y - cy, x - cx) + jitter;
    x += Math.cos(a) * jitterMag;
    y += Math.sin(a) * jitterMag;

    techPos[t.id] = { x, y };
  });

  // ---- 4) Compose + light collision for projects+tech ----
  const pos = {};
  nodes.forEach(n => {
    if (n.type === "theme") pos[n.id] = { x: themePos[n.id].x, y: themePos[n.id].y };
    else if (n.type === "project") pos[n.id] = projPos[n.id];
    else pos[n.id] = techPos[n.id];
  });

  // One quick separation pass so labels aren’t on top of each other
  const ids = nodes.filter(n => n.type !== "theme").map(n => n.id);
  const minDist = (aId, bId) => {
    // bigger bubbles for projects than tech
    const aType = nodes.find(n => n.id === aId)?.type;
    const bType = nodes.find(n => n.id === bId)?.type;
    const ra = (aType === "project") ? 34 : 24;
    const rb = (bType === "project") ? 34 : 24;
    return ra + rb + 6; // padding
  };

  for (let iter = 0; iter < 8; iter++) { // small, fast
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos[ids[i]], b = pos[ids[j]];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const m = minDist(ids[i], ids[j]);
        if (d < m) {
          const push = (m - d) / 2;
          const ux = dx / d, uy = dy / d;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
        }
      }
    }
  }
  // Keep nodes inside the SVG (leave room for labels on the right)
  const PAD = 28;          
  const LABEL_PAD = 90;    

  nodes.forEach(n => {
    const p = pos[n.id];
    if (!p) return;

    // match the radii you use when rendering
    const r = (n.type === "theme") ? 42 : (n.type === "project" ? 24 : 16);

    // allow extra space on the right for non-theme labels (they're right-aligned)
    const extraRight = (n.type === "theme") ? 0 : LABEL_PAD;

    const minX = PAD + r;
    const maxX = w - PAD - r - extraRight;
    const minY = PAD + r;
    const maxY = h - PAD - r;

    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.y = Math.max(minY, Math.min(maxY, p.y));
  });


  return { w, h, pos };
}


/* ---------- Render ---------- */
function renderGraph(svg, layout, data, panel) {
  const { w, h, pos } = layout;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.innerHTML = ""; // reset

  const NS = "http://www.w3.org/2000/svg";

  // Edges behind nodes
  const gEdges = document.createElementNS(NS, "g");
  gEdges.setAttribute("class", "edges");
  data.edges.forEach((e) => {
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", pos[e.source].x);
    line.setAttribute("y1", pos[e.source].y);
    line.setAttribute("x2", pos[e.target].x);
    line.setAttribute("y2", pos[e.target].y);
    line.setAttribute("class", `edge edge--${e.type}`);
    line.setAttribute("data-edge-id", e.id);
    line.setAttribute("stroke", "var(--border)");
    line.setAttribute("stroke-linecap", "round");
    if (e.type === "theme") line.setAttribute("stroke-dasharray", "4 4");
    gEdges.appendChild(line);
  });
  svg.appendChild(gEdges);

  // Nodes
  const gNodes = document.createElementNS(NS, "g");
  gNodes.setAttribute("class", "nodes");

  data.nodes.forEach((n) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", `node node--${n.type}`);
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `${titleFor(n)} node`);
    g.setAttribute("data-node-id", n.id);
    g.setAttribute("transform", `translate(${pos[n.id].x},${pos[n.id].y})`);

    const r =
      n.type === "theme" ? 42 :
        n.type === "project" ? 24 : 16;

    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("r", r);
    circle.setAttribute("fill", "var(--bg-elev)");
    circle.setAttribute("stroke", "var(--border)");
    circle.setAttribute("stroke-width", "1.5");
    g.appendChild(circle);

    const label = document.createElementNS(NS, "text");
    label.textContent = n.label;
    label.setAttribute("fill", "var(--muted)");
    label.setAttribute("font-size", "12.5");
    label.setAttribute("style", "pointer-events:none;");

    // Position by type:
    // - themes: centered *below* the big circle
    // - projects/tech: left-aligned, nudged to the right of the node
    if (n.type === "theme") {
      label.setAttribute("x", 0);
      label.setAttribute("y", r + 16);
      label.setAttribute("text-anchor", "middle");
    } else {
      label.setAttribute("x", r + 12);  // ≈ “x + 18” but relative to the group
      label.setAttribute("y", 4);       // slight vertical centering
      label.setAttribute("text-anchor", "start");
    }

    g.appendChild(label);


    gNodes.appendChild(g);
  });

  svg.appendChild(gNodes);
}

function titleFor(n) {
  if (n.type === "project") return `Project ${n.label}`;
  if (n.type === "theme") return `Theme ${n.label}`;
  return `Tech ${n.label}`;
}

/* ---------- Interactions ---------- */
function attachGraphInteractions(svg, panel, data) {
  const byId = Object.fromEntries(data.nodes.map(n => [n.id, n]));

  function relatedEdgeIds(nodeId) {
    return data.edges
      .filter(e => e.source === nodeId || e.target === nodeId)
      .map(e => e.id);
  }

  function highlight(nodeId) {
    svg.querySelectorAll(".edge, .node").forEach(el => el.classList.add("is-dimmed"));
    // active node
    svg.querySelector(`[data-node-id="${css(nodeId)}"]`)?.classList.add("is-active");
    // neighbors
    relatedEdgeIds(nodeId).forEach(eid => {
      const e = data.edges.find(e => e.id === eid);
      svg.querySelector(`[data-edge-id="${css(eid)}"]`)?.classList.remove("is-dimmed");
      svg.querySelector(`[data-node-id="${css(e.source)}"]`)?.classList.remove("is-dimmed");
      svg.querySelector(`[data-node-id="${css(e.target)}"]`)?.classList.remove("is-dimmed");
    });
  }
  function clearHighlight() {
    svg.querySelectorAll(".is-dimmed, .is-active").forEach(el => el.classList.remove("is-dimmed", "is-active"));
  }

  svg.addEventListener("mouseover", (e) => {
    const g = e.target.closest(".node");
    if (!g) return;
    highlight(g.dataset.nodeId);
  });
  svg.addEventListener("mouseout", clearHighlight);

  svg.addEventListener("click", (e) => {
    const g = e.target.closest(".node");
    if (!g) return;
    const id = g.dataset.nodeId;
    fillPanel(panel, id, data);
  });

  svg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const g = e.target.closest(".node");
      if (!g) return;
      e.preventDefault();
      fillPanel(panel, g.dataset.nodeId, data);
    }
    if (e.key === "Escape") {
      clearHighlight();
      if (panel) panel.innerHTML = "";
    }
  });
}

function fillPanel(panel, nodeId, data) {
  if (!panel) return;
  const projId = nodeId.startsWith("proj:") ? nodeId.replace("proj:", "") : null;
  if (!projId) return; 

  const p = data.projMap[projId];
  if (!p) return;

  const chips = (list, label) =>
    list?.length ? `<div class="chips" aria-label="${label}">` +
      list.map(s => `<span class="chip">${s}</span>`).join("") + "</div>" : "";

  panel.innerHTML = `
    <h3 id="panel-title" style="margin:0 0 .5rem">${p.title}</h3>
    <p style="margin:0 0 .8rem;color:var(--muted)">${p.blurb}</p>
    ${chips(p.tech, "Tech")}
    ${chips(p.themes, "Themes")}
    <div class="links" style="margin-top:.8rem;display:flex;gap:.8rem;">
      ${p.links?.demo ? `<a href="${p.links.demo}" target="_blank" rel="noopener">Live ↗</a>` : ""}
      ${p.links?.repo ? `<a href="${p.links.repo}" target="_blank" rel="noopener">Repo ↗</a>` : ""}
      ${p.links?.design ? `<a href="${p.links.design}" target="_blank" rel="noopener">Design ↗</a>` : ""}
    </div>
  `;
  panel.focus?.();
}

function css(id) { return id.replace(/"/g, '\\"'); }
