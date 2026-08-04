"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PROJECTS } from "@/lib/content";
import Parchment from "./Parchment";
import PassageTorch from "./PassageTorch";

// The way in to Projects. The torch peels off the wall and floats free exactly as
// it does for About; and against the brick wall the parchment is already hanging —
// but FOLDED, a compact packet. The torch leans in to light it and it unfolds
// carefully, leaf by leaf, laying itself flat, and the Projects reading inks on.

// Where the torch is carried to light the centred sheet: a little up and to the
// left of it, tilted so the flame points down and in over the page.
const TORCH_X = -150;
const TORCH_Y = 34;
const TORCH_TILT = 22;

// The torch-lit pool the folded sheet hangs in, seating it against the brick and
// sinking the wall to black toward the edges.
const POOL =
  "radial-gradient(ellipse 96% 104% at 50% 42%, #000 0%, #000 52%, rgba(0,0,0,0.86) 74%, transparent 96%)";

// The brick wall the sheet hangs on — the same dark running-bond course as the
// room's, tiled straight so it fills the frame and is lit only by POOL above.
const BRICK_TILE =
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'>" +
  "<rect width='120' height='60' fill='#181310'/>" +
  "<rect x='2' y='2' width='56' height='26' rx='1.5' fill='#332a22' stroke='#0c0806' stroke-width='1.4'/>" +
  "<rect x='62' y='2' width='56' height='26' rx='1.5' fill='#2e2620' stroke='#0c0806' stroke-width='1.4'/>" +
  "<rect x='-28' y='32' width='56' height='26' rx='1.5' fill='#2f2720' stroke='#0c0806' stroke-width='1.4'/>" +
  "<rect x='32' y='32' width='56' height='26' rx='1.5' fill='#352c23' stroke='#0c0806' stroke-width='1.4'/>" +
  "<rect x='92' y='32' width='56' height='26' rx='1.5' fill='#2e2620' stroke='#0c0806' stroke-width='1.4'/>" +
  "</svg>";
const BRICK_URL = `url("data:image/svg+xml,${encodeURIComponent(BRICK_TILE)}")`;

/** The ink, on the aged paper. */
const INK = "#2a2017";
const INK_SOFT = "#5b4a33";
const INK_FAINT = "#8a7248";

// A block of ink that writes itself on, revealed left-to-right as if drawn by a
// hand crossing the page.
function Ink({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.35 }}
      animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// The Projects reading, inked onto the sheet the wall's centre turned into. Each project
// is a lead-in rule and tag, its title, the story, and its stack — the same hand
// as the Digressions and About parchments.
function ProjectsInk() {
  return (
    <div className="relative px-7 py-12 sm:px-10 sm:py-14">
      <Ink>
        <h2
          className="mb-9 font-serif text-4xl font-light tracking-wide md:text-5xl"
          style={{ color: INK }}
        >
          Projects
        </h2>
      </Ink>
      <div className="flex flex-col gap-9">
        {PROJECTS.map((p, i) => (
          <div key={p.title}>
            <Ink delay={0.15 + i * 0.14}>
              <div className="mb-1 flex items-center gap-3">
                <span
                  className="block h-px w-6 shrink-0"
                  style={{ background: INK_FAINT }}
                />
                <p
                  className="font-sans text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: INK_FAINT }}
                >
                  {p.tag}
                  {p.year && <span> · {p.year}</span>}
                </p>
              </div>
            </Ink>
            <Ink delay={0.24 + i * 0.14}>
              <h3 className="mb-2 font-serif text-2xl" style={{ color: INK }}>
                {p.title}
              </h3>
            </Ink>
            <Ink delay={0.33 + i * 0.14}>
              <p
                className="mb-2 text-[14px] italic leading-relaxed"
                style={{ color: INK_SOFT }}
              >
                {p.story}
              </p>
            </Ink>
            {p.notes && (
              <Ink delay={0.4 + i * 0.14}>
                <p
                  className="mb-2 text-[13px] leading-relaxed"
                  style={{ color: INK_SOFT, opacity: 0.82 }}
                >
                  {p.notes}
                </p>
              </Ink>
            )}
            <Ink delay={0.46 + i * 0.14}>
              <div className="flex flex-wrap items-center gap-2">
                {p.stack?.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 font-sans text-[11px] tracking-wide"
                    style={{ color: INK_SOFT, border: `1px solid ${INK_FAINT}` }}
                  >
                    {t}
                  </span>
                ))}
                {p.href && (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ml-1 font-sans text-[11px] tracking-widest transition-opacity hover:opacity-70"
                    style={{ color: INK }}
                  >
                    visit →
                  </a>
                )}
              </div>
            </Ink>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsEntry({
  onBack,
}: {
  lit: boolean;
  onBack: () => void;
}) {
  // the torch is winged and floating from the start; `unhinged` just marks that
  // the passage has begun, pacing the reveal and gating the reading panel.
  const [unhinged, setUnhinged] = useState(false);
  // the folded parchment resolves in on the wall...
  const [formed, setFormed] = useState(false);
  // ...the torch leans in to light it...
  const [leaning, setLeaning] = useState(false);
  // ...it unfolds, leaf by leaf, laying itself flat...
  const [unfold, setUnfold] = useState(false);
  // ...and, once open, the reading inks on.
  const [reveal, setReveal] = useState(false);
  const [closing, setClosing] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    // Same opening beats as About: a breath, then the winged torch drifts and the
    // folded sheet resolves in on the wall.
    timers.current.push(window.setTimeout(() => setUnhinged(true), 120));
    // the folded packet resolves in on the wall, and the torch leans in to light it
    timers.current.push(window.setTimeout(() => setFormed(true), 120 + 1250 + 780));
    timers.current.push(window.setTimeout(() => setLeaning(true), 120 + 1250 + 900));
    // a beat to take in the folded sheet, then it unfolds carefully
    timers.current.push(window.setTimeout(() => setUnfold(true), 120 + 1250 + 780 + 900));
    // ...and once it has laid itself flat, the reading inks on
    timers.current.push(
      window.setTimeout(() => setReveal(true), 120 + 1250 + 780 + 900 + 1600)
    );
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const back = () => {
    setClosing(true);
    // the ink clears, the sheet folds back up, the torch un-leans, then drifts off
    setReveal(false);
    setUnfold(false);
    setLeaning(false);
    timers.current.push(window.setTimeout(() => setFormed(false), 650));
    timers.current.push(window.setTimeout(() => setUnhinged(false), 800));
    timers.current.push(window.setTimeout(onBack, 1700));
  };

  return (
    <div className="fixed inset-0 z-[60]">
      {/* the brick wall the folded sheet hangs on, lit to a pool around its centre.
          Faded on the way back so the room's own wall can take over without a pop */}
      <motion.div
        className="absolute inset-0"
        aria-hidden
        initial={false}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          backgroundImage: BRICK_URL,
          backgroundSize: "120px 60px",
          WebkitMaskImage: POOL,
          maskImage: POOL,
        }}
      />

      {/* the parchment already hanging on the wall — folded, then unfolding to lay
          itself flat, and the reading inks onto it */}
      <Parchment show={formed && !closing} unfold={unfold}>
        {reveal && (
          <div
            className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar"
            style={{
              pointerEvents: "auto",
              touchAction: "pan-y",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            <ProjectsInk />
          </div>
        )}
      </Parchment>

      {/* the torch that led us in — leans over to light the centred sheet */}
      <PassageTorch
        lean={leaning}
        poseX={TORCH_X}
        poseY={TORCH_Y}
        poseTilt={TORCH_TILT}
      />

      <motion.button
        onClick={back}
        className="absolute left-6 top-6 z-50 font-sans text-sm tracking-widest text-neutral-500 transition-colors hover:text-ember"
        initial={false}
        animate={{ opacity: unhinged && !closing ? 1 : 0 }}
        transition={{ duration: 0.5, delay: unhinged ? 0.6 : 0 }}
        style={{ pointerEvents: unhinged && !closing ? "auto" : "none" }}
      >
        ← back
      </motion.button>
    </div>
  );
}
