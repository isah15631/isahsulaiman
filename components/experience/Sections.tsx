"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { ABOUT, PROJECTS, EXPERIMENTS, CONTACT } from "@/lib/content";

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0705] text-neutral-200">
      {/* warm vignette so sections feel like the world the butterflies made */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(255,120,60,0.08), transparent 55%)",
        }}
      />

      <AnimatePresence mode="wait">
        {selected === null ? (
          <motion.nav
            key="menu"
            {...fade}
            className="relative flex min-h-screen flex-col items-center justify-center gap-6"
          >
            {MENU.map((m, i) => (
              <motion.button
                key={m.key}
                onClick={() => setSelected(m.key)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.7 }}
                className="font-serif text-3xl font-light tracking-wide text-neutral-300 transition-colors duration-500 hover:text-ember md:text-5xl"
              >
                {m.label}
              </motion.button>
            ))}
          </motion.nav>
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
      <div className="flex flex-col gap-10 md:flex-row md:items-start">
        <div className="relative h-56 w-44 shrink-0 overflow-hidden rounded-sm grayscale-[15%]">
          <Image
            src={ABOUT.photo}
            alt={ABOUT.name}
            fill
            sizes="180px"
            className="object-cover"
          />
        </div>
        <div className="font-sans text-[15px] leading-relaxed text-neutral-300">
          <p className="mb-1 font-serif text-2xl text-neutral-100">{ABOUT.name}</p>
          <p className="mb-6 text-sm uppercase tracking-widest text-ember/80">
            {ABOUT.role}
          </p>
          <p className="mb-6">{ABOUT.bio}</p>
          <p className="mb-8 italic text-neutral-400">“{ABOUT.philosophy}”</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm tracking-wide">
            {ABOUT.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="text-neutral-400 transition-colors hover:text-ember"
              >
                {s.label}
              </a>
            ))}
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
            <h3 className="mb-3 font-serif text-2xl text-neutral-100">{p.title}</h3>
            <p className="mb-4 font-sans text-[15px] leading-relaxed text-neutral-300">
              {p.story}
            </p>
            {p.notes && (
              <p className="mb-4 font-sans text-sm leading-relaxed text-neutral-500">
                {p.notes}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {p.stack.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-neutral-800 px-3 py-1 font-sans text-xs tracking-wide text-neutral-400"
                >
                  {t}
                </span>
              ))}
              {p.href && (
                <a
                  href={p.href}
                  className="ml-2 font-sans text-xs tracking-widest text-ember transition-opacity hover:opacity-70"
                >
                  view →
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
  const [sent, setSent] = useState(false);
  return (
    <div>
      <Heading>Contact</Heading>
      <p className="mb-10 max-w-xl font-sans text-[15px] leading-relaxed text-neutral-300">
        {CONTACT.invitation}
      </p>

      {sent ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-serif text-2xl text-ember"
        >
          thank you — i’ll be in touch.
        </motion.p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // front-end demo only — wire to your email service when ready
            setSent(true);
          }}
          className="flex max-w-xl flex-col gap-5"
        >
          <input
            required
            placeholder="your name"
            className="border-b border-neutral-800 bg-transparent pb-2 font-sans text-neutral-200 placeholder:text-neutral-600 focus:border-ember focus:outline-none"
          />
          <input
            required
            type="email"
            placeholder="your email"
            className="border-b border-neutral-800 bg-transparent pb-2 font-sans text-neutral-200 placeholder:text-neutral-600 focus:border-ember focus:outline-none"
          />
          <textarea
            required
            rows={4}
            placeholder="your message"
            className="resize-none border-b border-neutral-800 bg-transparent pb-2 font-sans text-neutral-200 placeholder:text-neutral-600 focus:border-ember focus:outline-none"
          />
          <button
            type="submit"
            className="mt-4 self-start font-sans text-sm tracking-widest text-ember transition-opacity hover:opacity-70"
          >
            send →
          </button>
        </form>
      )}

      <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm">
        <a
          href={`mailto:${CONTACT.email}`}
          className="text-neutral-400 transition-colors hover:text-ember"
        >
          {CONTACT.email}
        </a>
        {CONTACT.socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="text-neutral-400 transition-colors hover:text-ember"
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
