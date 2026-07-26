// Editable content for the four sections. Placeholder copy — refine anytime.
// Storytelling over buzzwords; keep everything concise.

export const ABOUT = {
  photo: "/assets/isah_sulaiman_new.png",
  name: "Isah Sulaiman",
  role: "Creative Developer & Designer",
  bio: "I make quiet, considered software — the kind that feels less like a product and more like a place. My work lives where engineering meets emotion: interfaces that breathe, motion that means something, and details most people feel before they notice.",
  philosophy:
    "Less, but better. If a thing doesn't add beauty, clarity, or meaning, it doesn't belong. I'd rather build one moment that stays with you than a hundred that don't.",
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

export const EXPERIMENTS: Experiment[] = [
  { title: "Shader Sketch #01", blurb: "A field of light that follows the cursor like it's shy." },
  { title: "Type in Motion", blurb: "Letters that assemble themselves from noise." },
  { title: "Generative Bloom", blurb: "Flowers grown from a single random seed." },
  { title: "Sound → Shape", blurb: "Turning a hum into a living silhouette." },
];

export const CONTACT = {
  email: "isah15631@gmail.com",
  socials: [
    { label: "GitHub", href: "#" },
    { label: "Twitter / X", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],
  invitation:
    "For collaborations, commissions, or a conversation about something you'd like to bring to life — I'd love to hear from you.",
};
