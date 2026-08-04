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
  /**
   * Identity only, now: the react key, the layoutId the object flies on, and
   * which palette slot it is lent.
   *
   * It used to be a closed union because HobbyObject drew a different glyph for
   * every one of them and an unknown key would have had nothing to draw. That
   * component is gone — they are all the same winged scroll in a different
   * colour — so adding a digression is a line of content again, which was the
   * whole point of collapsing the drawings.
   */
  key: string;
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
    title: "Literary Exploration",
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
    title: "Thought Journaling",
    intro: "Putting it down in words, which is a different kind of thinking.",
  },
  {
    key: "football",
    title: "The Beautiful Game",
    intro: "The game.",
    lists: [{ label: "Club", items: ["Real Madrid"] }],
  },
  {
    key: "gaming",
    title: "Virtual Odysseys",
    intro:
      "Long campaigns, mostly. The ones you finish and then miss for a week.",
    lists: [
      {
        label: "Prince of Persia",
        items: [
          "The Sands of Time (2003)",
          "Warrior Within (2004)",
          "The Two Thrones (2005)",
          "The Forgotten Sands (2010)",
          "The Shadow and the Flame",
          "The Lost Crown",
        ],
      },
      {
        label: "Assassin's Creed",
        items: [
          "Assassin's Creed",
          "Assassin's Creed II",
          "Brotherhood",
          "Revelations",
          "Assassin's Creed III",
          "Black Flag",
        ],
      },
      {
        label: "God of War",
        items: ["Ghost of Sparta", "Chains of Olympus", "Betrayal"],
      },
      {
        label: "Pitch and track",
        items: ["FIFA", "EA Sports FC", "Car racing"],
      },
    ],
  },
  {
    key: "systems",
    title: "Architecting Systems",
    intro:
      "Boxes and arrows, moved around until the whole thing holds together.",
  },
  {
    key: "reflection",
    title: "Inner Dialogues",
    intro: "Sitting with the day before it turns into the next one.",
  },
  {
    key: "movies",
    title: "Cinematic Inclinations",
    intro:
      "Two hours, in the dark, with the phone face down. Mind bending, psychological, adventure packed: the kind you are still turning over on the walk home.",
    lists: [
      {
        label: "The Lord of the Rings",
        items: [
          "The Fellowship of the Ring",
          "The Two Towers",
          "The Return of the King",
        ],
      },
      {
        label: "Pirates of the Caribbean",
        items: [
          "The Curse of the Black Pearl",
          "Dead Man's Chest",
          "At World's End",
          "On Stranger Tides",
          "Dead Men Tell No Tales",
        ],
      },
      {
        label: "Harry Potter",
        items: [
          "The Philosopher's Stone",
          "The Chamber of Secrets",
          "The Prisoner of Azkaban",
          "The Goblet of Fire",
          "The Order of the Phoenix",
          "The Half-Blood Prince",
          "The Deathly Hallows: Part 1",
          "The Deathly Hallows: Part 2",
        ],
      },
      {
        label: "Jason Bourne",
        items: [
          "The Bourne Identity",
          "The Bourne Supremacy",
          "The Bourne Ultimatum",
          "The Bourne Legacy",
          "Jason Bourne",
        ],
      },
      {
        label: "Christopher Nolan",
        items: [
          "Following",
          "Memento",
          "Insomnia",
          "Batman Begins",
          "The Prestige",
          "The Dark Knight",
          "Inception",
          "The Dark Knight Rises",
          "Interstellar",
          "Dunkirk",
          "Tenet",
          "Oppenheimer",
        ],
      },
      {
        label: "Marvel",
        items: [
          "Iron Man",
          "The Incredible Hulk",
          "Iron Man 2",
          "Thor",
          "Captain America: The First Avenger",
          "The Avengers",
          "Iron Man 3",
          "Thor: The Dark World",
          "Captain America: The Winter Soldier",
          "Guardians of the Galaxy",
          "Avengers: Age of Ultron",
          "Ant-Man",
          "Captain America: Civil War",
          "Doctor Strange",
          "Guardians of the Galaxy Vol. 2",
          "Spider-Man: Homecoming",
          "Thor: Ragnarok",
          "Black Panther",
          "Avengers: Infinity War",
          "Ant-Man and the Wasp",
          "Captain Marvel",
          "Avengers: Endgame",
          "Spider-Man: Far From Home",
          "Black Widow",
          "Shang-Chi and the Legend of the Ten Rings",
          "Eternals",
          "Spider-Man: No Way Home",
          "Doctor Strange in the Multiverse of Madness",
          "Thor: Love and Thunder",
          "Black Panther: Wakanda Forever",
          "Ant-Man and the Wasp: Quantumania",
          "Guardians of the Galaxy Vol. 3",
          "The Marvels",
          "Deadpool & Wolverine",
          "Captain America: Brave New World",
          "Thunderbolts",
          "The Fantastic Four: First Steps",
        ],
      },
    ],
  },
  {
    key: "anime",
    title: "Animated Realms",
    intro: "Drawn, and somehow the more real for it.",
    lists: [
      {
        label: "Series",
        items: [
          "One Piece",
          "Death Note",
          "Arcane",
          "Attack on Titan",
          "Jujutsu Kaisen",
          "Demon Slayer",
          "Mob Psycho 100",
          "Spy x Family",
          "Vinland Saga",
          "Tokyo Ghoul",
        ],
      },
    ],
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
