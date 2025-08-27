const RAW_PROJECTS = [
  {
    id: "quest",
    title: "Quest",
    blurb: "AI-driven, interactive web novel with branching choices and dice-roll mechanics.",
    themes: ["Creativity", "AI-assist", "Accessibility"],
    tech: ["React", "Node.js", "Express Js", "OpenAI", "MongoDB", "Bootstrap CSS", "JavaScript"],
    links: {
      demo: "https://www.youtube.com/watch?v=d6yMG30LYsQ&t=2503s",
      repo: "https://github.com/htmw/2025S-Codesaurus",
      design: null
    },
    featured: true
  },
  {
    id: "questtwo",
    title: "Quest 2.0",
    blurb: "Remake of Quest. Coming Soon...",
    themes: ["Creativity", "AI-assist", "Accessibility"],
    tech: ["Next.js", "OpenAI", "MongoDB", "Tailwind CSS", "TypeScript"],
    links: { demo: null, repo: null, design: null },
    featured: false
  },
  {
    id: "chicai",
    title: "ChicAI",
    blurb: "Smart wardrobe assistant with outfit suggestions and tracking.",
    themes: ["AI-assist", "Automation", "Accessibility", "Creativity"],
    tech: ["React", "Node.js", "Express Js", "OpenAI", "MongoDB", "Bootstrap", "JavaScript"],
    links: {
      repo: "https://github.com/Farhamkh/chicAI",
      design: "https://www.figma.com/design/va9fmxwlI1FC69PtacQ9qk/Chic-AI?node-id=0-1&p=f"
    },
    featured: true
  },
  {
    id: "hub",
    title: "AI-Chat-Hub",
    blurb: "Chat with multiple LLMs (OpenAI, Mistral, local Ollama).",
    themes: ["AI-assist", "Creativity", "Accessibility"],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "OpenAI", "Mistral", "Ollama (Gemma 2B)"],
    links: { repo: "https://github.com/Farhamkh/ai-chat-hub", demo: "" },
    featured: true
  },
  {
    id: "scraper",
    title: "Folder-Code-Scraper",
    blurb: "Python tool that converts project directories into clean, LLM-friendly Markdown snapshots while filtering secrets/binaries and adding metadata.",
    themes: ["Automation", "Research", "Accessibility"],
    tech: ["Python"],
    links: { repo: "https://github.com/Farhamkh/folder-code-scraper", demo: "Coming Soon" },
    featured: false
  },
  {
    id: "dijkstra",
    title: "Dijkstra’s Algorithm in Java",
    blurb: "Implements Dijkstra’s shortest-path algorithm in Java for weighted graphs—useful for routing, mapping, and network optimization.",
    themes: ["Research"],
    tech: ["Java"],
    links: { repo: "https://github.com/Farhamkh/cs608Project-Team3", demo: "Coming Soon" },
    featured: false
  },
  {
    id: "textclassification",
    title: "Text Classification with Machine Learning",
    blurb: "NLP pipeline with tokenization, stopwords, lemmatization/stemming; evaluates LinearSVC & Logistic Regression with TF-IDF and CountVectorizer.",
    themes: ["Research", "Automation", "AI-assist"],
    tech: ["Python"],
    links: { repo: "https://github.com/Farhamkh/NLP-Project", demo: "Coming Soon" },
    featured: false
  }
];

// Normalize tech names so UI/graph stay consistent
const TECH_ALIASES = {
  "Express Js": "Express",
  "ExpressJS": "Express",
  "Tailwind CSS": "Tailwind",
  "Bootstrap CSS": "Bootstrap",
  "BootStrap": "Bootstrap",
  "Node": "Node.js",
  "OpenAI API": "OpenAI",
  "Ollama(Gemma 2B)": "Ollama (Gemma 2B)"
};
const norm = (t) => TECH_ALIASES[t] || t;
const dedupe = (arr) => [...new Set(arr)];

// Canonical projects (normalized tech)
export const PROJECTS = RAW_PROJECTS.map(p => ({
  ...p,
  tech: (p.tech || []).map(norm)
}));

// Derive themes + tech from projects (single source of truth)
export const THEMES = dedupe(PROJECTS.flatMap(p => p.themes || []));

export const TECH = dedupe(
  PROJECTS.flatMap(p => (p.tech || []).map(norm))
).sort((a, b) => a.localeCompare(b));
