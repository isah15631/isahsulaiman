// Content for the four sections.
//
// The projects, their categories, the two live URLs and the tech stack are all
// REAL — carried over from the previous portfolio (legacy/vite-app/src/data.js).
//
// What is still mine rather than Isah's, and marked TODO below:
//   • the one-line story under each project — drafted from its name and
//     category, so the shape is right but the details need his eye
//   • the bio, the philosophy quote and the job title
//   • every social URL
//
// Deliberately NOT carried over: the old EXPERIENCE array, which was template
// filler ("Acme Corp", "Startup Labs") and never real.

export const ABOUT = {
  photo: "/assets/isah_sulaiman_new.png",
  name: "Isah Sulaiman",
  // TODO(isah): your actual title
  role: "Full-Stack Developer",
  // TODO(isah): replace with your own words — this is invented
  bio: "I build software for the places most people never see: schools, clinics, cooperatives, farms and shopfronts. Systems that have to work on a slow connection, on someone's only device, on a day when nothing else is going right. The craft I care about is the quiet kind — the form that doesn't lose your work, the screen that loads before you doubt it.",
  // TODO(isah): invented — replace or delete
  philosophy:
    "Less, but better. If a thing doesn't add beauty, clarity, or meaning, it doesn't belong. I'd rather build one moment that stays with you than a hundred that don't.",
  // TODO(isah): real URLs — these go nowhere
  socials: [
    { label: "Email", href: "mailto:isah15631@gmail.com" },
    { label: "GitHub", href: "#" },
    { label: "Twitter / X", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],
};

/** Real, from the previous portfolio. */
export const STACK: { group: string; items: string[] }[] = [
  {
    group: "Frontend",
    items: ["React", "TypeScript", "JavaScript (ES6+)", "Tailwind CSS", "Vite"],
  },
  { group: "Backend", items: ["PHP", "Node.js", "REST APIs"] },
  { group: "Database", items: ["Supabase / Postgres", "MySQL", "PDO"] },
  { group: "Tooling", items: ["Git & GitHub", "PWA", "Netlify"] },
];

export type Project = {
  title: string;
  tag: string;
  story: string;
  stack?: string[];
  notes?: string;
  href?: string;
};

// The flagship builds. Titles, tags, stacks and live links are real.
// TODO(isah): the `story` lines are my drafts — correct anything I got wrong.
export const PROJECTS: Project[] = [
  {
    title: "Edustute Suite",
    tag: "Education SaaS",
    story:
      "A school runs on paperwork long after the bell goes. Edustute pulls records, assessment and reporting into one place, with Gemini folded into the parts that are pure repetition.",
    stack: ["React", "Supabase", "Gemini AI"],
  },
  {
    title: "agriFIMS",
    tag: "AgriTech · Live",
    story:
      "Farm information management with geography at its centre — holdings, land and records tied to where they actually are, rather than to a spreadsheet row.",
    stack: ["React", "Supabase", "Geospatial"],
    href: "https://www.agrifims.ng/",
  },
  {
    title: "Nexus Cloud",
    tag: "Assessment SaaS",
    story:
      "Setting, sitting and marking assessments without the paper — built so a whole cohort can be examined at once without the system flinching.",
    stack: ["React", "Supabase", "Vite"],
  },
  {
    title: "Dan Iya Global POS",
    tag: "Retail · POS · Live",
    story:
      "Point of sale for a working shop floor: tills, stock and receipts, running in a browser on whatever hardware is already on the counter.",
    href: "https://daniyaglobalenterprise.netlify.app/login",
  },
  {
    title: "Sprimart",
    tag: "E-commerce & Logistics",
    story:
      "A storefront with the delivery problem taken seriously — ordering at the front, logistics behind it, treated as one system rather than two.",
  },
  {
    title: "ABUTH Health Records",
    tag: "Healthcare",
    story:
      "Patient records for a teaching hospital, where the cost of a lost file is measured in something other than time.",
  },
];

export type Experiment = {
  title: string;
  tag: string;
  blurb: string;
  href?: string;
};

// Smaller real builds. Framed as explorations rather than flagships —
// TODO(isah): move any of these up into PROJECTS if they deserve it, and tell
// me which are genuinely playful experiments versus commissioned work.
export const EXPERIMENTS: Experiment[] = [
  {
    title: "Expense Tracker",
    tag: "Finance · PWA",
    blurb: "Personal spending, installable and working offline.",
  },
  {
    title: "E-Voting System",
    tag: "Civic Tech",
    blurb: "Casting and counting, with a trail you can audit afterwards.",
  },
  {
    title: "Shika NAPRI Cooperative",
    tag: "Fintech",
    blurb: "Savings and loans for a cooperative society.",
  },
  {
    title: "Farmers' Record System",
    tag: "AgriTech",
    blurb: "Field records kept by the people actually in the field.",
  },
  {
    title: "Inventory & Invoicing",
    tag: "Business",
    blurb: "Stock in, invoice out, nothing in between to forget.",
  },
  {
    title: "Cement Plant Sales",
    tag: "Business · ERP",
    blurb: "Orders and dispatch tracked from weighbridge to gate.",
  },
];

export const CONTACT = {
  email: "isah15631@gmail.com",
  // TODO(isah): real URLs — these go nowhere
  socials: [
    { label: "GitHub", href: "#" },
    { label: "Twitter / X", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],
  // TODO(isah): invented copy
  invitation:
    "For collaborations, commissions, or a conversation about something you'd like to bring to life — I'd love to hear from you.",
};
