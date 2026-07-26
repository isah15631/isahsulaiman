// Content for the four sections.
//
// ⚠️  PLACEHOLDER — NOT ISAH'S WORDS OR WORK.
// Everything below marked TODO was written by Claude as scaffolding, including
// the bio, the philosophy quote, the role, every Experiment, and two of the
// three Projects. It reads as first-person but none of it is real. Replace it
// before this site is published — a portfolio that invents its own projects is
// worse than one with empty sections.
//
// Real as of now: the name, the email, the photo, and The Dormant Heart.
//
// Storytelling over buzzwords; keep everything concise.

export const ABOUT = {
  photo: "/assets/isah_sulaiman_new.png",
  name: "Isah Sulaiman",
  // TODO(isah): your actual title
  role: "Creative Developer & Designer",
  // TODO(isah): replace with your own words — this is invented
  bio: "I make quiet, considered software — the kind that feels less like a product and more like a place. My work lives where engineering meets emotion: interfaces that breathe, motion that means something, and details most people feel before they notice.",
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

export type Project = {
  title: string;
  story: string;
  stack: string[];
  notes?: string;
  href?: string;
};

export const PROJECTS: Project[] = [
  {
    title: "The Dormant Heart",
    story:
      "A portfolio that begins in silence. A stone heart, five quiet taps, and a slow return of colour before a single word is ever spoken. Built to make a stranger pause.",
    stack: ["Next.js", "Three.js", "GSAP", "Framer Motion"],
    notes:
      "The heart is sculpted procedurally and shatters face-by-face in a shader — no physics engine, no downloaded model.",
    href: "#",
  },
  // TODO(isah): these two are empty scaffolding. Give me the real projects —
  // what it is, why it mattered, the stack, and a link — and I'll write them.
  {
    title: "Project Two",
    story:
      "A short, human sentence about what this was and why it mattered — the problem, the feeling, the outcome.",
    stack: ["React", "TypeScript", "WebGL"],
    href: "#",
  },
  {
    title: "Project Three",
    story:
      "Another story-first description. What did people feel when they used it? Keep it warm and specific.",
    stack: ["Node", "Postgres", "Design Systems"],
    href: "#",
  },
];

export type Experiment = {
  title: string;
  blurb: string;
};

// TODO(isah): all four are invented. Replace with real sketches, however small.
export const EXPERIMENTS: Experiment[] = [
  { title: "Shader Sketch #01", blurb: "A field of light that follows the cursor like it's shy." },
  { title: "Type in Motion", blurb: "Letters that assemble themselves from noise." },
  { title: "Generative Bloom", blurb: "Flowers grown from a single random seed." },
  { title: "Sound → Shape", blurb: "Turning a hum into a living silhouette." },
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
