// Content for the three sections: About, Projects, Contact.
//
// The projects, their categories, the two live URLs and the tech stack are all
// REAL, carried over from the previous portfolio (legacy/vite-app/src/data.js).
// The bio and role are Isah's own, and the Edustute Suite, Edustute Nexus and
// agriFIMS write-ups are condensed from his own proposal documents.
//
// Still mine rather than his, and marked TODO below:
//   • the Sprimart story, the last invented one
//
// House style: no em dashes anywhere in copy.
//
// Deliberately NOT carried over: the old EXPERIENCE array, which was template
// filler ("Acme Corp", "Startup Labs") and never real.

export const ABOUT = {
  photo: "/assets/isah-hero.png",
  name: "Isah Sulaiman",
  role: "Full-Stack Developer & AI Enthusiast",
  bio: "Honestly, all there is to know is that I am really passionate about building solutions.",
  socials: [
    { label: "Email", href: "mailto:isah15631@gmail.com" },
    { label: "GitHub", href: "https://github.com/isah15631" },
    { label: "X", href: "https://x.com/isahsulaiman27" },
  ],
};

/** Isah's own stack listing, given verbatim. */
export const STACK: { group: string; items: string[] }[] = [
  {
    group: "Languages",
    items: [
      "JavaScript",
      "TypeScript",
      "Python",
      "PHP",
      "SQL",
      "HTML5",
      "CSS3",
    ],
  },
  {
    group: "Frontend",
    items: [
      "React",
      "Next.js",
      "Vite",
      "Tailwind CSS",
      "PWAs",
      "Offline-first",
      "Responsive Design",
    ],
  },
  {
    group: "Backend & Cloud",
    items: [
      "Supabase",
      "PostgreSQL",
      "MySQL",
      "AWS",
      "REST APIs",
      "RPC",
      "Row-Level Security",
      "Edge Functions",
      "IndexedDB",
    ],
  },
  {
    group: "Practices & Tools",
    items: [
      "Software Architecture",
      "Multi-tenant SaaS",
      "RBAC",
      "Git/GitHub",
      "VS Code",
      "AI-assisted Development",
    ],
  },
];

export type Project = {
  title: string;
  tag: string;
  year?: string;
  story: string;
  stack?: string[];
  notes?: string;
  href?: string;
};

// The flagship builds. Drawn from Isah's own proposal documents, so the
// substance is his. Only Sprimart is still my draft.
export const PROJECTS: Project[] = [
  {
    title: "This Portfolio",
    tag: "Interactive · Live",
    year: "2026",
    story:
      "The site you are reading this on. A hand-built world you walk through rather than scroll: a moon that falls into a daylit grassy plain, a lone door, and dark rooms where the torch you carry lights each parchment as you reach it. Built in the open with WebGL and a lot of stubbornness.",
    stack: ["Next.js", "React", "TypeScript", "WebGL", "Tailwind CSS"],
    href: "https://isahsulaiman.vercel.app",
  },
  {
    title: "Edustute Suite",
    tag: "Education SaaS",
    year: "2025",
    story:
      "Nigerian universities, polytechnics and colleges run their day to day on a patchwork of paper forms, spreadsheets, standalone desktop tools and manual bank reconciliation. Service is slow, revenue leaks, nobody fully trusts the data, and the admin burden grows every session. Edustute replaces the patchwork with one connected system: admissions, student records, fees, academics, SIWES, hostels, human resources and timetabling, with self service portals for applicants, students and staff.",
    notes:
      "Sold as a managed service rather than a one off licence. Hosted, secured, continuously updated and supported for as long as the institution subscribes, so it always runs the current version with no capital outlay and no in house IT team.",
    stack: ["Vite", "React", "Supabase", "Tailwind CSS"],
  },
  {
    title: "Edustute Nexus",
    tag: "Computer-Based Testing",
    year: "2025",
    story:
      "Offline first computer based testing, built to run at scale. Nexus sits the whole exam offline in the hall, so a dropped connection cannot stop it, syncs records to the cloud the moment a connection appears, and verifies every candidate by QR code and photo, with no biometric hardware to buy.",
    notes: "Priced per candidate, per exam.",
    stack: ["React", "Supabase", "PHP", "SQL", "Tailwind CSS"],
  },
  {
    title: "agriFIMS",
    tag: "AgriTech · Live",
    story:
      "The comprehensive platform bridging the gap between farmers and markets through data-driven intelligence.",
    stack: ["React", "Supabase", "Geospatial"],
    href: "https://www.agrifims.ng/",
  },
  {
    title: "Dan Iya Global POS",
    tag: "Retail · POS · Live",
    year: "2024",
    story:
      "Point of sale for a working shop floor: tills, stock and receipts, running in a browser on whatever hardware is already on the counter.",
    href: "https://daniyaglobalenterprise.netlify.app/login",
  },
  {
    title: "ABUTH Health Records",
    tag: "Healthcare",
    year: "2019",
    story:
      "Patient records for Ahmadu Bello University Teaching Hospital, where the cost of a lost file is measured in something other than time.",
  },
  {
    // TODO(isah): the only story still invented. Tell me what Sprimart is and
    // I will replace this the way I did the others.
    title: "Sprimart",
    tag: "E-commerce & Logistics",
    story:
      "A storefront with the delivery problem taken seriously. Ordering at the front, logistics behind it, treated as one system rather than two.",
  },
];

export const CONTACT = {
  email: "isah15631@gmail.com",
  // Written the way it is dialled locally; the tel: link carries the country
  // code, so a phone abroad still gets it right.
  phone: "08068787469",
  phoneHref: "tel:+2348068787469",
  // LinkedIn deliberately left out.
  socials: [
    { label: "GitHub", href: "https://github.com/isah15631" },
    { label: "X", href: "https://x.com/isahsulaiman27" },
  ],
  invitation:
    "For collaborations, commissions, or a conversation about something you would like to bring to life, I would love to hear from you.",
};
