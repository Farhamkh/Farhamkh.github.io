import { PROJECTS } from "./data.js";

/* ---------- SITE (local) ---------- */
const SITE = {
  name: "Farham Khademi",
  title: "Software Engineer & IT Consultant",
  bio:
    "With expertise in Business and Computer Science, I design practical digital solutions that reduce IT costs, improve productivity, and put the power of technology directly into the hands of business owners.",
  location: "USA, NY",
  emailUser: "farham.dev",
  emailDomain: "outlook.com",
  links: {
    github: "https://github.com/Farhamkh",
    linkedin: "https://www.linkedin.com/in/farham-khademi-3895a61a4/"
  },
  color: { accent: "#4f46e5", mode: "dark" },
  skills: [
    "JavaScript","TypeScript","React","Next.js","Node.js","Express","Python",
    "Scikit-learn","NLTK","Pandas","Tailwind","OpenAI","Mistral","Ollama",
    "Java","Git/GitHub"
  ]
};

/* ---------- Utilities ---------- */
const $  = (sel, parent=document) => parent.querySelector(sel);
const $$ = (sel, parent=document) => [...parent.querySelectorAll(sel)];
function createEl(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
}

/* ---------- Render Projects (uses imported PROJECTS) ---------- */
function renderProjects(container, { featuredOnly=false } = {}) {
  if (!container) return;
  container.innerHTML = "";

  PROJECTS
    .filter(p => !featuredOnly || p.featured)
    .forEach(p => {
      const card  = createEl("article","card");
      const h3    = createEl("h3");
      const live  = p.links?.demo && p.links.demo !== "Coming Soon";
      const aTit  = createEl("a", null, p.title);
      aTit.href   = live ? p.links.demo : (p.links?.repo || "#");
      aTit.target = "_blank"; aTit.rel = "noopener";
      h3.append(aTit);

      const blurb = createEl("p", null, p.blurb);

      const stack = createEl("div","stack");
      (p.tech || []).forEach(s => stack.append(createEl("span","badge", s)));

      const links = createEl("div","links");
      if (p.links?.repo) {
        const a = createEl("a", null, "Repo ↗");
        a.href = p.links.repo; a.target = "_blank"; a.rel = "noopener";
        links.append(a);
      }
      if (p.links?.demo) {
        const a = createEl("a", null, live ? "Live ↗" : "Demo");
        if (!live) {
          a.href = "#"; a.setAttribute("aria-disabled","true");
          a.style.opacity = .6; a.style.pointerEvents = "none"; a.title = "Coming Soon";
        } else {
          a.href = p.links.demo; a.target = "_blank"; a.rel = "noopener";
        }
        links.append(a);
      }
      if (p.links?.design) {
        const a = createEl("a", null, "Design ↗");
        a.href = p.links.design; a.target = "_blank"; a.rel = "noopener";
        links.append(a);
      }

      card.append(h3, blurb, stack, links);
      container.append(card);
    });
}

/* ---------- Skills ---------- */
function renderSkills(container) {
  if (!container) return;
  container.innerHTML = "";
  SITE.skills.forEach(skill => {
    const chip = createEl("span","chip",skill);
    chip.setAttribute("role","listitem");
    container.append(chip);
  });
}

/* ---------- Email ---------- */
function setupEmailLinks() {
  const contact = $("#contact-link");
  const footer  = $("#footer-contact");
  const email = `${SITE.emailUser}@${SITE.emailDomain}`;
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Hello Farham")}`;
  if (contact) contact.href = mailto;
  if (footer)  footer.href  = mailto;
}

/* ---------- Theme ---------- */
function applyTheme(mode) {
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  const toggle = $("#theme-toggle");
  if (toggle) {
    toggle.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
    toggle.textContent = mode === "dark" ? "🌙" : "☀️";
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", mode === "dark" ? "#0b0b0f" : "#fcfcfe");
  const announce = $("#announce");
  if (announce) announce.textContent = `Theme set to ${mode}`;
}
function initTheme() {
  const saved = localStorage.getItem("theme");
  const initial = saved || SITE.color.mode || "dark";
  applyTheme(initial);
  $("#theme-toggle")?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  $$("#year").forEach(e => e.textContent = new Date().getFullYear());

  const grid = $("#projects-grid");
  if (grid) {
    const isProjectsPage = /\/projects\.html$/.test(location.pathname);
    renderProjects(grid, { featuredOnly: !isProjectsPage });
  }

  renderSkills($("#skills-wrap"));
  setupEmailLinks();
  initTheme();
});
