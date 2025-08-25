// Reusing existing PROJECTS array if it already exists on window
// (so we don't duplicate/maintain in two places).
const projectsFromWindow = typeof window !== "undefined" && window.PROJECTS ? window.PROJECTS : [];

export const THEMES = ["AI-assist","Automation","Creativity"];
export const TECH   = ["React","Node","OpenAI","Mistral","Ollama","Tailwind","Python","JS"];

// If window.PROJECTS exists, map it into a light data shape for the graph.
// We'll tag the three featured items by name to keep things consistent.
const FEATURED_NAMES = new Set(["Quest","ChicAI","AI-Chat-Hub"]);

export const PROJECTS_DATA = (projectsFromWindow.length ? projectsFromWindow : [
  { name: "Quest",          blurb: "AI narrative engine.", stack:["JS","Node","OpenAI"] },
  { name: "ChicAI",         blurb: "Wardrobe recommender.", stack:["React","OpenAI","Tailwind"] },
  { name: "AI-Chat-Hub",    blurb: "Switchable LLMs.", stack:["Node","Ollama","Mistral","OpenAI"] },
]).map(p => ({
  id: (p.name || "").toLowerCase().replace(/\s+/g, "-"),
  title: p.name,
  blurb: p.blurb || "",
  tech: (p.stack || []).slice(0, 5),
  themes: ["AI-assist"], // simple default; refine later per project
  links: { repo: p.repo || "#", demo: p.demo || null },
  featured: FEATURED_NAMES.has(p.name)
}));
