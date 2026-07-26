/* ============================================================
   Portfolio interactions + content.
   Edit the DATA objects below to make this yours.
   ============================================================ */

/* ---------- 1. YOUR CONTENT ---------- */

// Projects → the horizontal carousel (like the "Music" row).
// "swatch" is just two colors for the placeholder gradient tile.
// To use a real image instead, add `img: 'images/foo.jpg'`.
const PROJECTS = [
  { title: "Edustute Suite", tag: "Education SaaS", swatch: ["#1a2a6c", "#3a7bd5"], initials: "ED", url: "#" },
  { title: "Nexus Cloud", tag: "Assessment SaaS", swatch: ["#360033", "#0b8793"], initials: "NX", url: "#" },
  { title: "agriFIMS", tag: "AgriTech · Live", swatch: ["#0b486b", "#1f9d55"], initials: "AF", url: "https://www.agrifims.ng/" },
  { title: "Sprimart", tag: "E-commerce & Logistics", swatch: ["#0f2027", "#2c5364"], initials: "SP", url: "#" },
  { title: "Dan Iya Global POS", tag: "Retail · POS · Live", swatch: ["#134e5e", "#71b280"], initials: "PS", url: "https://daniyaglobalenterprise.netlify.app/login" },
  { title: "Expense Tracker", tag: "Finance · PWA", swatch: ["#42275a", "#734b6d"], initials: "ET", url: "#" },
  { title: "Shika NAPRI Cooperative Society", tag: "Fintech", swatch: ["#141e30", "#243b55"], initials: "SN", url: "#" },
  { title: "ABUTH Health Records", tag: "Healthcare", swatch: ["#0b486b", "#f56217"], initials: "AB", url: "#" },
  { title: "Inventory & Invoicing", tag: "Business", swatch: ["#4b1248", "#f0c27b"], initials: "IN", url: "#" },
  { title: "Cement Plant Sales", tag: "Business · ERP", swatch: ["#2c3e50", "#4ca1af"], initials: "CP", url: "#" },
  { title: "E-Voting System", tag: "Civic Tech", swatch: ["#3a1c71", "#d76d77"], initials: "EV", url: "#" },
  { title: "Farmers' Record System", tag: "AgriTech", swatch: ["#232526", "#414345"], initials: "FR", url: "#" },
];

// Tech Stack → grouped chips in the Stack section.
const STACK = [
  { group: "Frontend", items: ["React", "TypeScript", "JavaScript (ES6+)", "Tailwind CSS", "HTML5", "CSS3", "Vite"] },
  { group: "Backend", items: ["PHP", "Node.js", "REST APIs"] },
  { group: "Database", items: ["Supabase / Postgres", "MySQL", "PDO"] },
  { group: "Tooling & Deploy", items: ["Git & GitHub", "PWA", "Netlify", "FPDF", "XAMPP"] },
];

// Featured → the grid (like the "Videos" section).
const FEATURED = [
  { title: "Edustute Suite", tag: "React · Supabase · Gemini AI", swatch: ["#1a2a6c", "#3a7bd5"], url: "#" },
  { title: "agriFIMS", tag: "React · Supabase · Geospatial", swatch: ["#0b486b", "#1f9d55"], url: "https://www.agrifims.ng/" },
  { title: "Nexus Cloud", tag: "React · Supabase · Vite", swatch: ["#360033", "#0b8793"], url: "#" },
];

// Experience → the row list (like the "Tour" dates).
const EXPERIENCE = [
  { year: "2024", month: "NOW", role: "Senior Engineer", org: "Acme Corp", url: "#" },
  { year: "2022", month: "", role: "Full-Stack Developer", org: "Startup Labs", url: "#" },
  { year: "2020", month: "", role: "Frontend Developer", org: "Studio Nine", url: "#" },
  { year: "2018", month: "", role: "Junior Developer", org: "Webworks", url: "#" },
];

/* ---------- 2. RENDER ---------- */

function gradient(c) { return `linear-gradient(135deg, ${c[0]} 0%, ${c[1]} 100%)`; }

function ext(url) { return url && url !== "#" ? ' target="_blank" rel="noopener"' : ""; }

function renderProjects() {
  const el = document.getElementById("carousel");
  el.innerHTML = PROJECTS.map(p => {
    const live = p.url && p.url !== "#";
    return `
    <article class="tile reveal">
      <a class="tile-art" href="${p.url}"${ext(p.url)}>
        <div class="swatch" style="background:${gradient(p.swatch)}">${p.initials}</div>
      </a>
      <div class="tile-meta">
        <div class="tile-title">${p.title}</div>
        <div class="tile-tag">${p.tag}</div>
        <a class="btn tile-btn" href="${p.url}"${ext(p.url)}>${live ? "Visit Live" : "View Project"}</a>
      </div>
    </article>`;
  }).join("");
}

function renderFeatured() {
  const el = document.getElementById("featuredGrid");
  el.innerHTML = FEATURED.map(f => `
    <a href="${f.url || "#"}" class="feature reveal"${ext(f.url)}>
      <div class="swatch" style="background:${gradient(f.swatch)}"></div>
      <div class="play">&#9658;</div>
      <div class="feature-body">
        <div class="feature-tag">${f.tag}</div>
        <div class="feature-title">${f.title}</div>
      </div>
    </a>`).join("");
}

function renderStack() {
  const el = document.getElementById("stackGrid");
  if (!el) return;
  el.innerHTML = STACK.map(g => `
    <div class="stack-col reveal">
      <h3 class="stack-label">${g.group}</h3>
      <ul class="stack-chips">
        ${g.items.map(i => `<li class="chip">${i}</li>`).join("")}
      </ul>
    </div>`).join("");
}

function renderExperience() {
  const el = document.getElementById("expList");
  el.innerHTML = EXPERIENCE.map(e => `
    <li class="exp-row reveal">
      <div class="exp-date">${e.year}<small>${e.month}</small></div>
      <div class="exp-role">${e.role}</div>
      <div class="exp-org">${e.org}</div>
      <a href="${e.url}" class="btn">Details</a>
    </li>`).join("");
}

/* ---------- 3. INTERACTIONS ---------- */

function initCarousel() {
  const track = document.getElementById("carousel");
  const step = () => Math.min(track.clientWidth * 0.8, 360);
  document.getElementById("nextBtn").addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  document.getElementById("prevBtn").addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
}

function initHeader() {
  const header = document.getElementById("siteHeader");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  });
}

function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const note = document.getElementById("contactNote");
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    // Placeholder handler: wire this to your email service / backend.
    note.textContent = "Thanks! This is a demo form. Connect it to your email service to receive messages.";
    form.reset();
  });
}

/* ---------- 4. BOOT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderProjects();
  renderFeatured();
  renderStack();
  renderExperience();
  initCarousel();
  initHeader();
  initMobileNav();
  initContactForm();
  initReveal();
  document.getElementById("year").textContent = new Date().getFullYear();
});
