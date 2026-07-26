"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { ABOUT, PROJECTS, EXPERIMENTS, CONTACT, STACK } from "@/lib/content";
import LightBulb from "./LightBulb";

type SectionKey = "about" | "projects" | "experiments" | "contact";
const MENU: { key: SectionKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "projects", label: "Projects" },
  { key: "experiments", label: "Experiments" },
  { key: "contact", label: "Contact" },
];

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.7, ease: "easeInOut" as const },
};

export default function Sections() {
  const [selected, setSelected] = useState<SectionKey | null>(null);
  // The room starts dark. Finding the switch is the point.
  const [lightOn, setLightOn] = useState(false);

  // Only the menu lives in the dark; once you are inside a section you can read.
  const lit = lightOn || selected !== null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070504] text-neutral-200">
      {/* warm vignette so sections feel like the world the butterflies made */}
      <motion.div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(255,120,60,0.08), transparent 55%)",
        }}
        initial={false}
        animate={{ opacity: lit ? 1 : 0.25 }}
        transition={{ duration: 0.6 }}
      />

      <AnimatePresence mode="wait">
        {selected === null ? (
          <motion.div
            key="menu"
            {...fade}
            className="relative flex min-h-[100dvh] flex-col items-center justify-center"
          >
            <LightBulb on={lightOn} onToggle={() => setLightOn((v) => !v)} />

            {/* The menu only exists while the light is on. Off, the room is
                dark and there is nothing to read or click. */}
            <nav
              className="relative z-10 mt-[26vh] flex flex-col items-center gap-6"
              aria-hidden={!lightOn}
            >
              {MENU.map((m, i) => (
                <motion.button
                  key={m.key}
                  onClick={() => setSelected(m.key)}
                  tabIndex={lightOn ? 0 : -1}
                  initial={false}
                  animate={{
                    opacity: lightOn ? 1 : 0,
                    y: lightOn ? 0 : 8,
                    filter: lightOn ? "blur(0px)" : "blur(3px)",
                  }}
                  transition={{
                    duration: lightOn ? 0.55 : 0.3,
                    delay: lightOn ? 0.12 + i * 0.09 : 0,
                    ease: "easeOut",
                  }}
                  className={`font-serif text-3xl font-light tracking-wide text-neutral-200 transition-colors duration-500 hover:text-ember md:text-5xl ${
                    lightOn ? "" : "pointer-events-none"
                  }`}
                >
                  {m.label}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        ) : (
          <motion.section
            key={selected}
            {...fade}
            className="relative mx-auto min-h-screen w-full max-w-3xl px-6 py-24"
          >
            <button
              onClick={() => setSelected(null)}
              className="mb-16 font-sans text-sm tracking-widest text-neutral-500 transition-colors hover:text-ember"
            >
              ← back
            </button>

            {selected === "about" && <About />}
            {selected === "projects" && <Projects />}
            {selected === "experiments" && <Experiments />}
            {selected === "contact" && <Contact />}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-10 font-serif text-4xl font-light tracking-wide text-neutral-100 md:text-5xl">
      {children}
    </h2>
  );
}

function About() {
  return (
    <div>
      <Heading>About</Heading>
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        {/* The portrait carries the same idea as the heart: colour returning to
            something that began without it. It warms out of grayscale as it
            arrives, and its lower edge dissolves into the page instead of
            stopping at a hard rectangle, which on a phone was the flattest
            thing on the site. */}
        <div className="relative mx-auto w-[min(78%,17rem)] shrink-0 md:mx-0 md:w-44">
          {/* warm light pooling behind him, echoing the bulb */}
          <div
            className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, rgba(255,150,80,0.18), rgba(255,130,60,0.05) 55%, transparent 78%)",
            }}
          />
          <motion.div
            className="relative aspect-[3/4] overflow-hidden rounded-sm"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 58%, rgba(0,0,0,0.55) 82%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, #000 58%, rgba(0,0,0,0.55) 82%, transparent 100%)",
            }}
            initial={{ opacity: 0, filter: "grayscale(1) brightness(0.7)" }}
            animate={{ opacity: 1, filter: "grayscale(0) brightness(1)" }}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
          >
            <Image
              src={ABOUT.photo}
              alt={ABOUT.name}
              fill
              sizes="(max-width: 768px) 78vw, 180px"
              priority
              className="object-cover object-top"
            />
          </motion.div>
        </div>
        <div className="font-sans text-[15px] leading-relaxed text-neutral-300">
          <p className="mb-1 font-serif text-2xl text-neutral-100">{ABOUT.name}</p>
          <p className="mb-6 text-sm uppercase tracking-widest text-ember/80">
            {ABOUT.role}
          </p>
          <p className="mb-8">{ABOUT.bio}</p>

          {/* expertise: label above its list, so a long group name like
              "Practices & Tools" cannot squeeze the items into a narrow column */}
          <div className="mb-8 flex flex-col gap-4">
            {STACK.map((g) => (
              <div key={g.group}>
                <p className="mb-1 font-sans text-[11px] uppercase tracking-[0.18em] text-neutral-600">
                  {g.group}
                </p>
                <p className="font-sans text-[13px] leading-relaxed text-neutral-400">
                  {g.items.join(" · ")}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm tracking-wide">
            {ABOUT.socials.map((s) => {
              const external = s.href.startsWith("http");
              return (
                <a
                  key={s.label}
                  href={s.href}
                  {...(external
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                  className="text-neutral-400 transition-colors hover:text-ember"
                >
                  {s.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Projects() {
  return (
    <div>
      <Heading>Projects</Heading>
      <div className="flex flex-col gap-14">
        {PROJECTS.map((p) => (
          <article key={p.title}>
            <p className="mb-2 font-sans text-[11px] uppercase tracking-[0.2em] text-ember/70">
              {p.tag}
              {p.year && <span className="text-neutral-600"> · {p.year}</span>}
            </p>
            <h3 className="mb-3 font-serif text-2xl text-neutral-100">{p.title}</h3>
            <p className="mb-4 max-w-2xl font-sans text-[15px] leading-relaxed text-neutral-300">
              {p.story}
            </p>
            {p.notes && (
              <p className="mb-4 max-w-2xl font-sans text-sm leading-relaxed text-neutral-500">
                {p.notes}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {/* stack is only listed where it is actually known */}
              {p.stack?.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-neutral-800 px-3 py-1 font-sans text-xs tracking-wide text-neutral-400"
                >
                  {t}
                </span>
              ))}
              {/* and a link only where one really exists */}
              {p.href && (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ml-2 font-sans text-xs tracking-widest text-ember transition-opacity hover:opacity-70"
                >
                  visit →
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Experiments() {
  return (
    <div>
      <Heading>Experiments</Heading>
      <p className="-mt-6 mb-10 font-sans text-[11px] uppercase tracking-[0.2em] text-neutral-600">
        Earlier work, 2015 to 2020
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {EXPERIMENTS.map((e, i) => (
          <motion.div
            key={e.title}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            className="rounded-md border border-neutral-800 bg-white/[0.02] p-6"
            style={{
              boxShadow: `0 0 60px -30px ${
                ["#c9304a", "#2fa980", "#4fd1e0", "#8b6bd1"][i % 4]
              }`,
            }}
          >
            <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              {e.tag}
            </p>
            <h3 className="mb-2 font-serif text-xl text-neutral-100">{e.title}</h3>
            <p className="font-sans text-sm leading-relaxed text-neutral-400">
              {e.blurb}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (insecure context, or the user said no) — the
      // mailto link beside it still works, so this stays silent.
    }
  };

  return (
    <div>
      <Heading>Contact</Heading>
      <p className="mb-12 max-w-xl font-sans text-[15px] leading-relaxed text-neutral-300">
        {CONTACT.invitation}
      </p>

      {/* No form: the address itself is the invitation. */}
      <a
        href={`mailto:${CONTACT.email}`}
        className="group inline-block font-serif text-2xl font-light tracking-wide text-neutral-100 transition-colors duration-500 hover:text-ember sm:text-4xl"
      >
        {CONTACT.email}
        <span className="mt-2 block h-px w-full origin-left scale-x-100 bg-neutral-700 transition-colors duration-500 group-hover:bg-ember" />
      </a>

      <div className="mt-4 h-5">
        <button
          onClick={copy}
          className="font-sans text-xs tracking-widest text-neutral-500 transition-colors hover:text-ember"
        >
          {copied ? "copied." : "copy address"}
        </button>
      </div>

      <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3 font-sans text-sm">
        {CONTACT.socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-neutral-400 transition-colors hover:text-ember"
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
