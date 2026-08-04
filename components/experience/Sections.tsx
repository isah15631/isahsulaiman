"use client";

import {
  AnimatePresence,
  motion,
  type Variants,
} from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ABOUT, PROJECTS, CONTACT, STACK } from "@/lib/content";
import BrickWall from "./BrickWall";
import Companion from "./Companion";
import FireButterfly from "./FireButterfly";
import { ParchmentColumn, type Sheet } from "./ParchmentColumn";
import PortraitFrame from "./PortraitFrame";
import RoomButterflies from "./RoomButterflies";
import Torch from "./Torch";

type SectionKey = "about" | "projects" | "contact";
const MENU: { key: SectionKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "projects", label: "Projects" },
  { key: "contact", label: "Contact" },
];

// The room is above and the sections are below it, and you move between them
// vertically. Opening one is a drop: it rushes up from under you while the
// menu rises out of the top of the frame. Going back is the climb, and because
// the lamp lives in the menu, the whole fixture descends into view again.
//
// Both panes are on screen together for the length of it, which is the whole
// point. Wait for one to leave before the other arrives and it stops being a
// fall and becomes two slides.
//
// Percentages, not viewport units: each pane is `absolute inset-0`, so 100% is
// exactly one screen however tall the phone chrome makes that today.
//
// GAP is the distance between the room and a section, and it is the whole
// reason this has any weight. At 100% they are flush, so nothing ever travels
// further than the screen you can already see and a fast transition just looks
// abrupt. Further apart, there is dark between the two, and for most of the
// drop that dark is all you can see. You fall past nothing to get somewhere.
const GAP = 170;
// A small settle at the end, as a fraction of a screen rather than of GAP, so
// the landing lands the same however far the fall was.
const OVER = 1.6;

// Both panes are rigid parts of one world and it is the camera that moves, so
// they share a curve exactly. Give them different easings and the world
// stretches between them, which is instantly wrong however good it looks
// frame by frame.
const TRAVEL: [number, number, number, number] = [0.5, 0, 0.15, 1];
const SETTLE: [number, number, number, number] = [0.4, 0, 0.4, 1];

const FALL = {
  duration: 0.62,
  times: [0, 0.85, 1],
  ease: [TRAVEL, SETTLE],
};
const RISE = {
  duration: 0.82,
  times: [0, 0.85, 1],
  ease: [TRAVEL, SETTLE],
};

// The overshoot runs against the direction of travel: falling, everything
// carries a little past where it stops and comes back.
const room: Variants = {
  enter: (down: boolean) => ({ y: `${down ? GAP : -GAP}%` }),
  center: (down: boolean) => ({
    y: down
      ? [`${GAP}%`, `${-OVER}%`, "0%"]
      : [`${-GAP}%`, `${OVER}%`, "0%"],
    transition: down ? FALL : RISE,
  }),
  leave: (down: boolean) => ({
    y: down
      ? ["0%", `${-GAP - OVER}%`, `${-GAP}%`]
      : ["0%", `${GAP + OVER}%`, `${GAP}%`],
    transition: down ? FALL : RISE,
  }),
};

/** Each pane owns its own scrolling, so neither can disturb the other's. */
const PANE = "absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar";

export default function Sections({
  ignited,
  onIgnite,
}: {
  ignited: boolean;
  onIgnite: () => void;
}) {
  const [selected, setSelected] = useState<SectionKey | null>(null);
  // Every section reads the same way now — a column of open parchments in the
  // pane, lit by the room's one torch. There are no passage cinematics that take
  // over the frame any more, so the wall and the torch simply stay put.
  // The room is lit once the torch has caught, and it never goes out again:
  // there is no switch any more. `lit` simply follows the world's one-way latch.
  const lit = ignited;
  // Which way we are travelling: into a section, or back up to the menu.
  const [down, setDown] = useState(true);

  // The fire-winged butterfly plays exactly once, the first time we arrive in a
  // room that has not been lit yet. It lights the torch (onIgnite) as it reaches
  // it, then drifts off and is gone.
  const [firePlaying, setFirePlaying] = useState(!ignited);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The lamp is overhead and it stays there, so this is a constant string and
  // not a value derived from anything.
  //
  // It used to be rebuilt from the fixture's lean on every frame of a swing.
  // Two chained drop-shadows recomputed over live text sixty times a second is
  // one of the more expensive things you can ask a browser for, and it was
  // costing the whole room its frame rate. Held still it is free: painted once
  // and cached.
  //
  // A warm glow just below the words, because the lamp is above them, and a
  // shadow thrown the same way. The shadow only reads at all because the cone
  // lays a wash down behind the menu for it to fall on; against the bare page
  // it would be black on black. Cast second, so it is thrown by the already
  // glowing text rather than the glow being smeared around the shadow.
  const LIT =
    "drop-shadow(0px 7px 10px rgba(255,176,96,0.5)) " +
    "drop-shadow(0px 9px 5px rgba(0,0,0,0.55))";

  const open = (key: SectionKey) => {
    setDown(true);
    setSelected(key);
  };
  const back = () => {
    setDown(false);
    setSelected(null);
  };

  return (
    // overflow-hidden here, and the scrolling moved onto the panes: while one
    // is falling past the other they would otherwise share a scrollbar and
    // fight over its height.
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#070504] text-neutral-200">
      {/* the wall the torch is strapped to, at the very back of the room. */}
      <BrickWall />

      {/* The torch is a fixture of the room, not of the menu. It is mounted here,
          at the room root and outside the panes that slide, so it stays nailed to
          exactly the same spot on the wall whether you are at the menu or dropped
          into a section. Every page is lit by this one flame. */}
      <Torch lit={lit} />

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

      {/* Placed before the content on purpose. Positioned siblings with no
          stacking of their own paint in DOM order, so they pass behind the
          words rather than across them. */}
      {/* lamp: the torch is lit AND you are in the room with it, so there is
          something to fly to. Down in a section it is above the ceiling. */}
      <RoomButterflies lit={lit} lamp={lit && selected === null} />

      {/* One of them comes down with you when you open a section, hangs there a
          while, and climbs back out. Keyed on the section so each drop gets its
          own, and mounted out here rather than in the pane so it does not travel
          with the fall: it is doing its own falling. */}
      <AnimatePresence>
        {selected !== null && <Companion key={selected} lit={lit} />}
      </AnimatePresence>

      {/* The one on fire. Portalled to the body so it burns ABOVE the world's
          grayscale — the single colour in the grey — then it lights the torch and
          colour spreads from there. It plays once and is gone. */}
      {mounted &&
        firePlaying &&
        selected === null &&
        createPortal(
          <FireButterfly
            onReach={onIgnite}
            onDone={() => setFirePlaying(false)}
          />,
          document.body
        )}

      {/* initial={false}: on the very first arrival the menu should simply be
          here, with the lamp lowering into it. Only later moves are falls. */}
      <AnimatePresence initial={false} custom={down}>
        {selected === null ? (
          <motion.div
            key="menu"
            custom={down}
            variants={room}
            initial="enter"
            animate="center"
            exit="leave"
            className={PANE}
          >
            <div className="relative flex min-h-full flex-col items-center justify-center">
              {/* The menu only exists once the torch is lit. Before that the room
                  is dark and there is nothing to read or click.

                  It is lit, not faded in. Light does not make a thing arrive, it
                  makes a thing visible, so the words brighten from almost unlit,
                  overshoot as the filament surges, and settle. The stagger runs
                  top to bottom because that is the direction the cone travels,
                  and the warm halo is the tungsten catching the letterforms
                  before it settles to a glow.

                  Brightness rather than colour on purpose: an inline `color`
                  would outrank the hover:text-ember class and kill the hover. */}
              <motion.nav
                className="relative z-10 mt-[26vh] flex flex-col items-center gap-6"
                aria-hidden={!lit}
                // the torchlight catching the letterforms
                style={{ filter: LIT }}
              >
                {MENU.map((m, i) => (
                  <motion.button
                    key={m.key}
                    onClick={() => open(m.key)}
                    tabIndex={lit ? 0 : -1}
                    initial={false}
                    animate={
                      lit
                        ? {
                            opacity: [0, 1, 1],
                            filter: [
                              "brightness(0.15)",
                              "brightness(1.18)",
                              "brightness(1)",
                            ],
                            textShadow: [
                              "0 0 0px rgba(255,190,110,0)",
                              "0 0 20px rgba(255,190,110,0.5)",
                              "0 0 9px rgba(255,190,110,0.16)",
                            ],
                          }
                        : {
                            opacity: 0,
                            filter: "brightness(0.15)",
                            textShadow: "0 0 0px rgba(255,190,110,0)",
                          }
                    }
                    transition={
                      lit
                        ? {
                            duration: 0.85,
                            times: [0, 0.35, 1],
                            delay: 0.1 + i * 0.12,
                            ease: "easeOut",
                          }
                        : { duration: 0.3, ease: "easeOut" }
                    }
                    className={`font-serif text-3xl font-light tracking-wide text-neutral-200 transition-colors duration-500 hover:text-ember md:text-5xl ${
                      lit ? "" : "pointer-events-none"
                    }`}
                  >
                    {m.label}
                  </motion.button>
                ))}
              </motion.nav>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={selected}
            custom={down}
            variants={room}
            initial="enter"
            animate="center"
            exit="leave"
            className={PANE}
          >
            {/* Kill the light in here and the reading goes with it. Opacity
                only: pointer events and the accessibility tree are left alone,
                because a screen reader turning off a lamp it cannot see should
                not lose the page. */}
            <motion.section
              className="relative mx-auto min-h-full w-full max-w-3xl px-6 py-24"
              initial={false}
              animate={{ opacity: lit ? 1 : 0.045 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <button
                onClick={back}
                className="mb-16 font-sans text-sm tracking-widest text-neutral-400 transition-colors hover:text-ember"
              >
                ← back
              </button>

              {selected === "about" && <About />}
              {selected === "projects" && <Projects />}
              {selected === "contact" && <Contact />}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// About reads like the rest now: one open parchment lit by the torch, the
// portrait at its head. The photo still warms out of grey into full colour as the
// flame's pool reaches it — that living-portrait behaviour lives in PortraitFrame,
// and it reads the same flame the parchment does, so the face colours in exactly
// as the page around it lights.
function About() {
  const sheets: Sheet[] = [{ key: "about", content: <AboutPage /> }];
  return <ParchmentColumn sheets={sheets} />;
}

function AboutPage() {
  return (
    <>
      {/* the portrait, centred at the head of the page; grey until the torch's
          pool reaches it, then colour */}
      <div className="mb-8 flex justify-center">
        <PortraitFrame src={ABOUT.photo} alt={ABOUT.name} />
      </div>

      <h3 className="font-serif text-3xl font-normal tracking-wide text-[#241a11]">
        {ABOUT.name}
      </h3>
      <p className="mt-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a3d10]">
        {ABOUT.role}
      </p>
      <p className="mt-5 max-w-prose font-serif text-[17px] leading-[1.75] text-[#2f2213]">
        {ABOUT.bio}
      </p>

      {/* expertise: label above its list, so a long group name cannot squeeze
          the items into a narrow column */}
      <div className="mt-8 flex flex-col gap-4">
        {STACK.map((g) => (
          <div key={g.group}>
            <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5c451c]">
              {g.group}
            </p>
            <p className="font-sans text-[15px] leading-relaxed text-[#2f2213]">
              {g.items.join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-sans text-[15px] tracking-wide">
        {ABOUT.socials.map((s) => {
          const external = s.href.startsWith("http");
          return (
            <a
              key={s.label}
              href={s.href}
              {...(external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
              className="text-[#3f2f1a] transition-colors hover:text-[#8a3f16]"
            >
              {s.label}
            </a>
          );
        })}
      </div>
    </>
  );
}

// Projects is a column of already-open parchments hanging down the wall, each
// build on its own sheet, and only the one scrolled under the torch is lit enough
// to read. No <Heading> and no reveal motion — the flame arriving on the page is
// the reveal.
function Projects() {
  const sheets: Sheet[] = PROJECTS.map((p) => ({
    key: p.title,
    content: <ProjectPage project={p} />,
  }));
  return <ParchmentColumn sheets={sheets} />;
}

function ProjectPage({ project: p }: { project: (typeof PROJECTS)[number] }) {
  return (
    <>
      {/* the tag it carries, on a lead-in rule, in ink rather than ember now
          that it lives on lit paper */}
      <div className="mb-3 flex items-center gap-3">
        <span className="block h-px w-7 bg-[#8a4a1f]/80" />
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5c451c]">
          {p.tag}
          {p.year && <span className="text-[#7a5f30]"> · {p.year}</span>}
        </p>
      </div>
      <h3 className="font-serif text-3xl font-normal tracking-wide text-[#241a11]">
        {p.title}
      </h3>
      <p className="mt-3 max-w-prose font-serif text-[17px] leading-[1.75] text-[#2f2213]">
        {p.story}
      </p>
      {p.notes && (
        <p className="mt-3 max-w-prose font-serif text-[15px] italic leading-relaxed text-[#4d3c24]">
          {p.notes}
        </p>
      )}
      {(p.stack?.length || p.href) && (
        <div className="mt-7 flex flex-wrap items-center gap-2">
          {/* stack is only listed where it is actually known */}
          {p.stack?.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[#2a2017]/40 px-3 py-1 font-sans text-[13px] tracking-wide text-[#3f2f1a]"
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
              className="ml-2 font-sans text-[13px] font-medium tracking-widest text-[#8a3f16] transition-opacity hover:opacity-70"
            >
              visit →
            </a>
          )}
        </div>
      )}
    </>
  );
}

// Contact reads like the rest now: one open parchment lit by the torch, the
// address inked on it. The carrier butterflies that used to hand the address in
// are gone here — on a masked, ragged sheet they would be clipped at the paper's
// edge mid-flight — so the address simply lives on the page under the flame.
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

  const content = (
    <>
      <p className="max-w-prose font-serif text-[17px] leading-[1.75] text-[#2f2213]">
        {CONTACT.invitation}
      </p>

      {/* No form: the address itself is the invitation. */}
      <div className="mt-10 inline-block font-serif text-2xl font-light sm:text-3xl">
        <a
          href={`mailto:${CONTACT.email}`}
          className="group block tracking-wide text-[#2a2017] transition-colors duration-500 hover:text-[#8a3f16]"
        >
          {CONTACT.email}
          {/* The rule stays; a warm one is drawn along it from the left on hover. */}
          <span className="relative mt-2 block h-px w-full bg-[#2a2017]/25">
            <span className="absolute inset-0 origin-left scale-x-0 bg-[#8a3f16] transition-transform duration-500 ease-out group-hover:scale-x-100" />
          </span>
        </a>
      </div>

      <div className="mt-4 h-5">
        <button
          onClick={copy}
          className="font-sans text-[12px] font-medium tracking-widest text-[#5c451c] transition-colors hover:text-[#8a3f16]"
        >
          {copied ? "copied." : "copy address"}
        </button>
      </div>

      {/* The number, under the address rather than beside it. It is the second
          way in, not a rival to the first: same serif, a size down. */}
      <p className="mt-8 font-serif text-lg font-light tracking-wide sm:text-xl">
        <a
          href={CONTACT.phoneHref}
          className="group inline-block text-[#2f2213] transition-colors duration-500 hover:text-[#8a3f16]"
        >
          {CONTACT.phone}
          <span className="relative mt-2 block h-px w-full bg-[#2a2017]/20">
            <span className="absolute inset-0 origin-left scale-x-0 bg-[#8a3f16] transition-transform duration-500 ease-out group-hover:scale-x-100" />
          </span>
        </a>
      </p>

      <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 font-sans text-[15px]">
        {CONTACT.socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[#5b4a33] transition-colors hover:text-[#8a3f16]"
          >
            {s.label}
          </a>
        ))}
      </div>
    </>
  );

  const sheets: Sheet[] = [{ key: "contact", content }];
  return <ParchmentColumn sheets={sheets} />;
}
