/* ============================================================
   Portfolio content. Edit these arrays to update the site.
   ============================================================ */

export const gradient = (c) => `linear-gradient(135deg, ${c[0]} 0%, ${c[1]} 100%)`;

// Projects → the horizontal carousel.
// "swatch" is two colors for the placeholder gradient tile.
// Set a real "url" to make the card link out (opens in a new tab).
export const PROJECTS = [
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

// Featured → the grid, showing flagship builds with their tech stack.
export const FEATURED = [
  { title: "Edustute Suite", tag: "React · Supabase · Gemini AI", swatch: ["#1a2a6c", "#3a7bd5"], url: "#" },
  { title: "agriFIMS", tag: "React · Supabase · Geospatial", swatch: ["#0b486b", "#1f9d55"], url: "https://www.agrifims.ng/" },
  { title: "Nexus Cloud", tag: "React · Supabase · Vite", swatch: ["#360033", "#0b8793"], url: "#" },
];

// Tech Stack → grouped chips in the Stack section.
export const STACK = [
  { group: "Frontend", items: ["React", "TypeScript", "JavaScript (ES6+)", "Tailwind CSS", "HTML5", "CSS3", "Vite"] },
  { group: "Backend", items: ["PHP", "Node.js", "REST APIs"] },
  { group: "Database", items: ["Supabase / Postgres", "MySQL", "PDO"] },
  { group: "Tooling & Deploy", items: ["Git & GitHub", "PWA", "Netlify", "FPDF", "XAMPP"] },
];

// Experience → the row list.
export const EXPERIENCE = [
  { year: "2024", month: "NOW", role: "Senior Engineer", org: "Acme Corp", url: "#" },
  { year: "2022", month: "", role: "Full-Stack Developer", org: "Startup Labs", url: "#" },
  { year: "2020", month: "", role: "Frontend Developer", org: "Studio Nine", url: "#" },
  { year: "2018", month: "", role: "Junior Developer", org: "Webworks", url: "#" },
];
