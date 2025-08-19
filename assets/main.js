/* ---------- Site Data (Edit here, not the HTML) ---------- */
const SITE = {
    name: "Farham Khademi",
    title: "Software Engineer & IT Consultant",
    bio:
        "With expertise in Business and Computer Science, I design practical digital solutions that reduce IT costs, improve productivity, and put the power of technology directly into the hands of business owners.",
    location: "USA, NY",

    // avoid scraping
    emailUser: "farham.dev",
    emailDomain: "outlook.com",

    links: {
        github: "https://github.com/Farhamkh",
        linkedin: "https://www.linkedin.com/in/farham-khademi-3895a61a4/"
        // Links here
    },

    // can also be toggled
    color: {
        accent: "#4f46e5",
        mode: "dark"
    },

    // Skills render as badges
    skills: [
        "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "Python",
        "Scikit-learn", "NLTK", "Pandas", "TailwindCSS", "OpenAI API", "Mistral (Together.ai)", "Ollama",
        "Java", "Git/GitHub"
    ]
};

// Project list 
const PROJECTS = [
    {
        name: "Quest",
        blurb:
            "AI-driven, interactive web novel that lets users make choices shaping the narrative. Includes a dice-roll mechanic to determine success/failure.",
        stack: ["JavaScript", "React", "Express", "Node.js", "OpenAI API", "MongoDB"],
        repo: "https://github.com/htmw/2025S-Codesaurus",
        demo: "https://www.youtube.com/watch?v=d6yMG30LYsQ&t=2503s",
        featured: true
    },
    {
        name: "ChicAI",
        blurb:
            "Smart wardrobe assistant that organizes clothing and suggests outfits. Features outfit tracking, laundry status, and creative suggestions.",
        stack: ["JavaScript", "React", "Express", "Node.js", "OpenAI API", "MongoDB"],
        repo: "https://github.com/Farhamkh/chicAI",
        design: "https://www.figma.com/design/va9fmxwlI1FC69PtacQ9qk/Chic-AI?node-id=0-1&p=f",
        demo: null,
        featured: true
    },
    {
        name: "AI-Chat-Hub",
        blurb:
            "Next.js app to chat with multiple AI models—OpenAI, Mistral (Together.ai), and local Ollama (e.g., Gemma 2B). Great for comparing models and building AI tools.",
        stack: ["Next.js", "React", "TypeScript", "TailwindCSS", "Node.js", "OpenAI API", "Mistral (Together.ai)", "Ollama (Gemma 2B)"],
        repo: "https://github.com/Farhamkh/ai-chat-hub",
        demo: "Coming Soon",
        featured: true
    },
    {
        name: "Folder-Code-Scraper",
        blurb:
            "Python tool that converts project directories into clean, LLM-friendly Markdown snapshots while filtering secrets/binaries and adding metadata.",
        stack: ["Python"],
        repo: "https://github.com/Farhamkh/folder-code-scraper",
        demo: "Coming Soon",
        featured: false
    },
    {
        name: "Dijkstra’s Algorithm in Java",
        blurb:
            "Implements Dijkstra’s shortest-path algorithm in Java for weighted graphs—useful for routing, mapping, and network optimization.",
        stack: ["Java"],
        repo: "https://github.com/Farhamkh/cs608Project-Team3",
        notes: "Includes PPTX analysis",
        featured: false
    },
    {
        name: "Text Classification with Machine Learning",
        blurb:
            "NLP pipeline with tokenization, stopwords, lemmatization/stemming; evaluates LinearSVC & Logistic Regression with TF-IDF and CountVectorizer.",
        stack: ["Python", "Scikit-learn", "Pandas", "NLTK", "Matplotlib"],
        repo: "https://github.com/Farhamkh/NLP-Project",
        notes: "Includes Excel analysis",
        featured: false
    }
];

/* ---------- Utilities ---------- */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

function createEl(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text) el.textContent = text;
    return el;
}

/* ---------- Render: Projects ---------- */
function renderProjects(container, opts = {}) {
  if (!container) return;
  const { featuredOnly = false } = opts;

  container.innerHTML = "";
  PROJECTS
    .filter(p => !featuredOnly || p.featured)
    .forEach(p => {
      const card = createEl("article", "card");
      card.setAttribute("role", "listitem");

      const h3 = createEl("h3", null);
      const titleLink = createEl("a", null, p.name);
      titleLink.href = p.demo && p.demo !== "Coming Soon" ? p.demo : (p.repo || "#");
      titleLink.target = "_blank"; titleLink.rel = "noopener";
      h3.append(titleLink);

      const blurb = createEl("p", null, p.blurb);

      const stack = createEl("div", "stack");
      (p.stack || []).forEach(s => stack.append(createEl("span", "badge", s)));

      const links = createEl("div", "links");
      if (p.repo) {
        const a = createEl("a", null, "Repo ↗");
        a.href = p.repo; a.target = "_blank"; a.rel = "noopener";
        links.append(a);
      }
      if (p.demo) {
        const a = createEl("a", null, typeof p.demo === "string" ? "Demo ↗" : "Demo");
        if (p.demo === "Coming Soon") {
          a.href = "#";
          a.setAttribute("aria-disabled","true");
          a.style.opacity = .6; a.style.pointerEvents = "none"; a.title = "Coming Soon";
        } else {
          a.href = p.demo; a.target = "_blank"; a.rel = "noopener";
        }
        links.append(a);
      }
      if (p.design) {
        const a = createEl("a", null, "Design ↗");
        a.href = p.design; a.target = "_blank"; a.rel = "noopener";
        links.append(a);
      }

      card.append(h3, blurb, stack, links);
      container.append(card);
    });
}


/* ---------- Render: Skills ---------- */
function renderSkills(container) {
    if (!container) return;
    container.innerHTML = "";
    SITE.skills.forEach(skill => {
        const chip = createEl("span", "chip", skill);
        chip.setAttribute("role", "listitem");
        container.append(chip);
    });
}

/* ---------- Email handling (obfuscated display, functional mailto) ---------- */
function setupEmailLinks() {
    const contact = $("#contact-link");
    const footerContact = $("#footer-contact");
    const email = `${SITE.emailUser}@${SITE.emailDomain}`;
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Hello Farham")}`;
    if (contact) contact.href = mailto;
    if (footerContact) footerContact.href = mailto;
}

/* ---------- Theme toggle ---------- */
function applyTheme(mode) {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);

    // Update toggle button state + icon
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
        toggle.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
        toggle.textContent = mode === "dark" ? "🌙" : "☀️";
    }

    // Update browser UI color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute("content", mode === "dark" ? "#0b0b0f" : "#fcfcfe");
    }

    // Accessibility live region update
    const announce = document.getElementById("announce");
    if (announce) announce.textContent = `Theme set to ${mode}`;
}

function initTheme() {
    const saved = localStorage.getItem("theme");
    const initial = saved || SITE.color.mode || "dark";
    applyTheme(initial);
    const toggle = $("#theme-toggle");
    if (toggle) {
        toggle.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme") || "dark";
            const next = current === "dark" ? "light" : "dark";
            localStorage.setItem("theme", next);
            applyTheme(next);
        });
    }
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // Year
  const y = new Date().getFullYear();
  $$("#year").forEach(e => e.textContent = y);

  // Projects
  const grid = document.getElementById("projects-grid");
  if (grid) {
    const isProjectsPage = /\/projects\.html$/.test(location.pathname);
    // index.html → featured only; projects.html → all
    renderProjects(grid, { featuredOnly: !isProjectsPage });
  }

  // Skills (index only; safe no-op on projects page)
  renderSkills(document.getElementById("skills-wrap"));

  // Email + Theme
  setupEmailLinks();
  initTheme();
});

