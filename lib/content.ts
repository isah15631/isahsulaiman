// Content for the four sections: About, Projects, Hobbies, Contact.
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
    items: ["JavaScript", "Python", "PHP", "SQL", "HTML5", "CSS3"],
  },
  {
    group: "Frontend",
    items: [
      "React",
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

/**
 * A hobby is an object before it is a list.
 *
 * Each one is drawn as a small winged thing floating in the dark, and only
 * becomes readable when you open it: the object unrolls into a scroll and the
 * contents are what is written on it. So the copy here is deliberately thin.
 * `intro` is the one line at the head of the scroll, and everything else is a
 * labelled list, because a list of writers reads as a list and should look
 * like one.
 */
export type Hobby = {
  /** picks the glyph in HobbyObject, so these keys are not free-form */
  key:
    | "reading"
    | "writing"
    | "football"
    | "systems"
    | "reflection"
    | "movies"
    | "anime";
  title: string;
  intro: string;
  lists?: { label: string; items: string[] }[];
};

// Reading is Isah's own, given verbatim, with the titles and names spelled the
// way their covers spell them. Two of them were worth a second look:
//   • "the man underground" is almost certainly Notes from Underground, the
//     Dostoevsky. Say the word if you meant something else.
//   • "windsmil of the gods" is Windmills of the Gods, the Sidney Sheldon.
//
// TODO(isah): the other six intros are mine, not yours. They claim nothing
// beyond the name of the hobby itself, and they are placeholders. Tell me what
// belongs on each scroll (the teams, the films, the series, what you write,
// which systems you like thinking about) and I will replace them the way I
// filled in reading.
export const HOBBIES: Hobby[] = [
  {
    key: "reading",
    title: "Reading",
    intro: "The writers I keep going back to, and the books that sent me back.",
    lists: [
      {
        label: "Writers",
        items: [
          "Franz Kafka",
          "Fyodor Dostoevsky",
          "Danielle Steel",
          "Sidney Sheldon",
          "Albert Camus",
        ],
      },
      {
        label: "Read",
        items: [
          "The Metamorphosis",
          "The Stranger",
          "White Nights",
          "Notes from Underground",
          "Crime and Punishment",
          "Lone Eagle",
          "If Tomorrow Comes",
          "Windmills of the Gods",
          "Tell Me Your Dreams",
          "Bloodline",
          "Master of the Game",
        ],
      },
    ],
  },
  {
    key: "writing",
    title: "Writing",
    intro: "Putting it down in words, which is a different kind of thinking.",
  },
  {
    key: "football",
    title: "Football",
    intro: "The game.",
  },
  {
    key: "systems",
    title: "System Design",
    intro:
      "Boxes and arrows, moved around until the whole thing holds together.",
  },
  {
    key: "reflection",
    title: "Self Reflection",
    intro: "Sitting with the day before it turns into the next one.",
  },
  {
    key: "movies",
    title: "Movies",
    intro: "Two hours, in the dark, with the phone face down.",
  },
  {
    key: "anime",
    title: "Anime",
    intro: "Drawn, and somehow the more real for it.",
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
