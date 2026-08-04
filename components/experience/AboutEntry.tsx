"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ABOUT, STACK } from "@/lib/content";
import BrickWall from "./BrickWall";
import PassageTorch from "./PassageTorch";
import PortraitAssembly from "./PortraitAssembly";

// Beat one of the way in to About.
//
// The torch is strapped to the wall by an iron band. Click About and that band
// comes clean off the handle, lifts, and unfolds into a pair of wings, and the
// torch is a floating thing now rather than a fixture: it drifts free and beats
// its new wings. Pressing back folds them away, sets the band back on the
// handle, and hangs the torch up again.
//
// The rest of the passage (the wall splitting, the way through, the perched
// swarm becoming the page) gets built on top of this. For now it is just the
// unhinge, over the real wall and menu, which stay where they are.
//
// Everything lives in ONE svg on the torch's 96x132 body box, so the band and
// the wings share the handle's exact coordinates and the morph lines up with no
// layout maths: the band sits at (48,82), and that is where the wings hinge.

// The rubble thrown off the seam as the wall breaks open: a scatter of brick
// chunks that burst out, arc, and fall, and soft billows of dust that bloom off
// the crack and settle. It plays once, on mount — it is rendered only while the
// wall is open, so parting the wall spawns it and closing it takes it away.
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

// A few angular silhouettes, so a chunk reads as broken stone rather than a box.
const CHUNKS = [
  "polygon(0% 22%, 62% 0%, 100% 42%, 78% 100%, 16% 84%)",
  "polygon(12% 0%, 100% 26%, 84% 88%, 30% 100%, 0% 48%)",
  "polygon(0% 34%, 48% 0%, 100% 30%, 88% 100%, 22% 92%)",
  "polygon(6% 10%, 90% 0%, 100% 64%, 54% 100%, 0% 72%)",
];
const STONES = ["#3a2e24", "#2c231c", "#453626", "#241d17", "#33291f"];

function Rubble() {
  // Rolled once. Both bursts leave the same seam (screen centre), the debris
  // falling under gravity. The soft dust billows are gone — their big blurred
  // radials were the expensive part, and dropping them keeps the break sharp and
  // cheap.
  const [bits] = useState(() => ({
    debris: Array.from({ length: 20 }, (_, i) => {
      const dir = Math.random() < 0.5 ? -1 : 1;
      return {
        id: i,
        top: rand(6, 74),
        size: rand(4, 12),
        out: dir * rand(40, 190),
        rise: rand(6, 40),
        fall: rand(80, 320),
        rot: rand(160, 620) * (Math.random() < 0.5 ? -1 : 1),
        dur: rand(0.9, 1.8),
        delay: rand(0, 0.32),
        stone: pick(STONES),
        clip: pick(CHUNKS),
      };
    }),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
      {bits.debris.map((p) => (
        <motion.div
          key={`deb-${p.id}`}
          className="absolute left-1/2"
          style={{
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            background: `linear-gradient(140deg, ${p.stone}, #17110c)`,
            clipPath: p.clip,
            boxShadow: "0 1px 2px rgba(0,0,0,0.6)",
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
          // burst out and up, then arc down under its own weight
          animate={{
            x: [0, p.out * 0.6, p.out],
            y: [0, -p.rise, p.fall],
            rotate: [0, p.rot],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            ease: [0.3, 0.1, 0.2, 1],
            times: [0, 0.28, 1],
            opacity: { duration: p.dur, delay: p.delay, times: [0, 0.08, 0.7, 1] },
          }}
        />
      ))}
    </div>
  );
}

// The little room the doorway opens into, in CSS 3D. PERSP is the lens; ROOM_DEPTH
// is how deep the room runs from the doorway to the back wall the parchment hangs
// on; NEAR_Z is how far of that depth we dolly forward as we walk in. The parchment
// rides the SAME perspective and dolly (a plane at -ROOM_DEPTH), so it stays glued
// to the back wall and grows exactly as the wall does — never faster, which would
// read as the sheet coming to us rather than us walking to it.
const PERSP = 1000;
const ROOM_DEPTH = 900;
const NEAR_Z = ROOM_DEPTH * 0.82;
const DOLLY = { duration: 2.1, ease: [0.5, 0, 0.2, 1] } as const;

// The room the doorway opens into, built in CSS 3D so moving in reads as walking
// through it. A back wall of brick (the parchment hangs against it) with
// a side wall running back to it on the left and the right; the whole box is
// dollied toward the camera on `near`, so the side walls sweep past us instead of
// the far wall growing onto us. A heavy vignette (applied by the caller) sinks the
// room's edges into black, which also hides where the planes meet.
function RoomWall({ tint }: { tint: string }) {
  return (
    <div className="absolute inset-[-40%]" style={{ opacity: 0.6, filter: tint }}>
      <BrickWall />
    </div>
  );
}

function RoomWalls({ near }: { near: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ perspective: `${PERSP}px`, perspectiveOrigin: "50% 40%" }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        // walk in: bring the whole room forward by most of its depth, so the back
        // wall comes to hand and the side walls slide out past us.
        animate={{ z: near ? NEAR_Z : 0 }}
        transition={near ? DOLLY : { duration: 1.4, ease: [0.5, 0, 0.2, 1] }}
      >
        {/* the back wall, deep in the room, lit by the torch's pool */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateZ(-${ROOM_DEPTH}px)` }}
        >
          <RoomWall tint="brightness(0.52) saturate(0.85)" />
        </div>
        {/* the left wall, hinged at the screen's left edge and running back to the
            far wall; darker, since the torch is off toward the middle */}
        <div
          className="absolute inset-y-[-45%] left-0"
          style={{
            width: `${ROOM_DEPTH}px`,
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
          }}
        >
          <RoomWall tint="brightness(0.32) saturate(0.8)" />
        </div>
        {/* the right wall */}
        <div
          className="absolute inset-y-[-45%] right-0"
          style={{
            width: `${ROOM_DEPTH}px`,
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
          }}
        >
          <RoomWall tint="brightness(0.32) saturate(0.8)" />
        </div>
      </motion.div>
    </div>
  );
}

// The parchment: one sheet, hung on the wall by an iron bail, that carries the
// About beat from blank paper to inked page.
//
// It is simply already there — we find it hanging on the wall when we step into
// the room, softly resolving in with the rest of it rather than being assembled
// out of anything. Once the camera has dollied in, the reading inks itself
// straight onto that same sheet. The bail bolted to the brick, the tack at each
// top corner, the deckled edge, worn border, grain and torch-warmth are the same
// reading as the section parchments (see ParchmentColumn).

/** Uneven, as a hand-trimmed sheet is. */
const P_RADIUS = "8px 12px 9px 11px / 12px 8px 13px 10px";
/** The lift off the wall, cast by the box behind the ragged sheet. */
const P_LIFT = "0 30px 56px -30px rgba(0,0,0,0.92)";
/** Aged paper: a warm, mottled tone. */
const PAPER =
  "radial-gradient(120% 80% at 26% 10%, rgba(255,251,232,0.55), transparent 58%)," +
  "radial-gradient(90% 70% at 82% 88%, rgba(120,88,48,0.20), transparent 55%)," +
  "radial-gradient(70% 60% at 88% 16%, rgba(150,116,66,0.16), transparent 60%)," +
  "linear-gradient(178deg, #efe1bd 0%, #e7d4a6 46%, #dbc492 78%, #cdb47f 100%)";
/** A faint paper grain, as a static inline-SVG noise. */
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";
/** The ragged, torn outline of the sheet, as a static mask. */
const P_DECKLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='520' viewBox='0 0 400 520' preserveAspectRatio='none'%3E%3Cfilter id='d' x='-20' y='-20' width='440' height='560' filterUnits='userSpaceOnUse'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.028' numOctaves='2' seed='7' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='10'/%3E%3C/filter%3E%3Crect x='6' y='6' width='388' height='508' rx='8' fill='%23fff' filter='url(%23d)'/%3E%3C/svg%3E\")";

// The torch's light on the page, as in the section parchments but hung the other
// way up: the flame is carried ABOVE the sheet (the torch leans up and aside), so
// the pool falls on the TOP of the parchment and the page sinks into dark toward
// its foot, rather than the ParchmentColumn's fixed band lit from a torch that
// sits below. The pool is biased a touch left, toward where the torch is carried.
//
// WARM is screen-blended firelight caught in the fibres; AMBER is an overlay wash
// so the paper turns honey-warm rather than merely brighter; DARK_FOOT is the
// dark the page falls into below the lit band, painted OVER the reading so text
// scrolled below the pool reads as being out of the light.
const P_WARM_TOP =
  "radial-gradient(ellipse 92% 54% at 42% 3%, " +
  "rgba(255,201,120,0.82) 0%, rgba(255,160,74,0.5) 34%, " +
  "rgba(255,120,40,0.2) 62%, transparent 82%)";
const P_AMBER_TOP =
  "radial-gradient(ellipse 104% 60% at 42% 1%, " +
  "rgba(255,112,28,0.85) 0%, rgba(222,98,26,0.55) 40%, " +
  "rgba(180,80,24,0.2) 66%, transparent 84%)";
const P_DARK_FOOT =
  "radial-gradient(ellipse 122% 78% at 42% 0%, " +
  "transparent 0%, transparent 44%, rgba(8,6,4,0.58) 74%, rgba(8,6,4,0.9) 94%)";

// The iron bail bolted to the brick, that the sheet hangs from: a nail driven
// into the wall, a hooked ring off it, and the pin that ring carries through the
// top of the parchment.
function Bail() {
  return (
    <svg
      width="46"
      height="72"
      viewBox="0 0 46 72"
      fill="none"
      aria-hidden
      style={{ overflow: "visible", filter: "drop-shadow(2px 5px 4px rgba(0,0,0,0.6))" }}
    >
      <defs>
        <linearGradient id="bail-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b6b74" />
          <stop offset="0.4" stopColor="#2c2c33" />
          <stop offset="0.62" stopColor="#4a4a53" />
          <stop offset="1" stopColor="#131317" />
        </linearGradient>
      </defs>
      {/* the nail driven into the brick */}
      <circle cx="23" cy="8" r="5" fill="#3a3a42" stroke="#111115" strokeWidth="1.4" />
      <circle cx="21" cy="6" r="1.6" fill="#8f8f99" />
      {/* the hooked ring hanging off it */}
      <path d="M23 12 C12 22 12 44 23 52 C34 44 34 22 23 12 Z" fill="none" stroke="url(#bail-iron)" strokeWidth="4.5" />
      {/* the pin the ring carries through the top of the sheet */}
      <circle cx="23" cy="54" r="3.6" fill="url(#bail-iron)" stroke="#111115" strokeWidth="1" />
    </svg>
  );
}

// A small iron tack pinning a top corner of the sheet to the wall.
function Tack() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden style={{ overflow: "visible" }}>
      <circle cx="6" cy="6" r="3" fill="#3a3a42" stroke="#141418" strokeWidth="1" />
      <circle cx="5" cy="5" r="0.9" fill="#8f8f99" />
    </svg>
  );
}

function WallParchment({ near, gone }: { near: boolean; gone: boolean }) {
  // The sheet is already there, hung on the wall, when the doors split — but it is
  // deep in the room and there is no light on it yet, so all we catch is a faint
  // hint of paper in the dark. As the camera walks up to it (`near`), the torch is
  // carried up over it and its light climbs the sheet from the TOP, the near-black
  // veil lifting as the warm pool arrives. No reading lives here: once we have
  // arrived the ReadingPanel takes over on a clean 2D layer (which, unlike this 3D
  // plane, scrolls properly under a finger), and this sheet hands off to it —
  // fading out on `gone` so the two are never on screen together with the torch
  // caught between them, then coming back on the way out.
  return (
    <motion.div
      className="absolute left-1/2 top-[44%] z-10 w-[34rem] max-w-[88vw] -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={{ opacity: gone ? 0 : 1 }}
      transition={{ duration: gone ? 0.6 : 0.5, ease: "easeOut" }}
    >
      {/* the bail it hangs from, bolted to the brick above the sheet — barely
          there in the dark, resolving as the light reaches it */}
      <motion.div
        className="pointer-events-none absolute -top-[3.4rem] left-1/2 -translate-x-1/2"
        initial={false}
        animate={{ opacity: near ? 1 : 0.18 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      >
        <Bail />
      </motion.div>
      {/* and a tack pinning each top corner */}
      <motion.div
        className="pointer-events-none absolute -top-1 left-7"
        initial={false}
        animate={{ opacity: near ? 1 : 0.18 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      >
        <Tack />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute -top-1 right-7"
        initial={false}
        animate={{ opacity: near ? 1 : 0.18 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      >
        <Tack />
      </motion.div>

      <div className="relative h-[42rem] max-h-[84vh] w-full">
        <div
          className="absolute inset-0"
          style={{
            borderRadius: P_RADIUS,
            boxShadow: P_LIFT,
            isolation: "isolate",
            WebkitMaskImage: P_DECKLE,
            maskImage: P_DECKLE,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        >
          {/* the paper: tone, worn border and darkened aged edges */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: P_RADIUS,
              background: PAPER,
              border: "1px solid rgba(96,70,38,0.55)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,246,222,0.25)," +
                "inset 0 26px 40px -26px rgba(74,52,26,0.7)," +
                "inset 0 -26px 40px -26px rgba(74,52,26,0.7)," +
                "inset 26px 0 34px -26px rgba(74,52,26,0.6)," +
                "inset -26px 0 34px -26px rgba(74,52,26,0.6)",
            }}
          />
          {/* the grain */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: PAPER_GRAIN,
              backgroundSize: "170px 170px",
              mixBlendMode: "multiply",
              opacity: 0.05,
            }}
          />
          {/* the torch's warmth caught in the fibres off the top — off until we are
              near, then arriving with the walk-in as the light climbs the sheet */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: P_WARM_TOP, mixBlendMode: "screen" }}
            initial={false}
            animate={{ opacity: near ? 1 : 0 }}
            transition={{ duration: 1.7, delay: near ? 0.4 : 0, ease: "easeOut" }}
          />
          {/* the honey wash, so the lit top turns warm rather than merely brighter */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: P_AMBER_TOP, mixBlendMode: "overlay" }}
            initial={false}
            animate={{ opacity: near ? 1 : 0 }}
            transition={{ duration: 1.7, delay: near ? 0.4 : 0, ease: "easeOut" }}
          />
          {/* the dark the page falls into below the lit band, once the light is on it */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: P_DARK_FOOT }}
            initial={false}
            animate={{ opacity: near ? 1 : 0 }}
            transition={{ duration: 1.7, delay: near ? 0.4 : 0, ease: "easeOut" }}
          />
          {/* the near-black veil the whole sheet sits under while it is still deep in
              the room: not quite opaque, so only a faint hint of paper shows, then
              lifting as we walk up and the torch reaches it */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: "#080604" }}
            initial={false}
            animate={{ opacity: near ? 0 : 0.9 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// The reading itself, on its own 2D layer over the arrived room — NOT inside the
// 3D dolly. That is deliberate: a scroll container nested under `perspective` /
// `preserve-3d` / `translateZ` scrolls wrongly under a finger on mobile (the touch
// jumps the page the moment it lands), so once we have walked up to the sheet the
// text lives on a plain, un-transformed sheet that scrolls cleanly.
//
// It is lit exactly like the wall sheet: the torch's pool warms the TOP of the
// page (WARM/AMBER, under the ink so the fibres glow) and the foot falls away into
// dark (DARK_FOOT, over the ink so words scrolled below the pool sit out of the
// light) — the section's firelit page, hung the other way up.
function ReadingPanel() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[45] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="pointer-events-auto relative h-[84vh] w-[34rem] max-w-[92vw]" style={{ boxShadow: P_LIFT }}>
        {/* The lit paper itself — tone, grain and the torch's warmth — painted ONCE
            on a static layer that never moves. It alone carries the deckled mask,
            the isolation and the two blend layers, so all of that cost is paid a
            single time and cached as one texture. The scrolling text above it never
            touches the mask or the blends, which is what keeps the scroll smooth:
            with the scroller nested UNDER them, every scroll frame had to repaint
            the whole masked, blended sheet on the main thread (and that repaint,
            racing the torch's animating light pool, is what made the light trail). */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: P_RADIUS,
            isolation: "isolate",
            WebkitMaskImage: P_DECKLE,
            maskImage: P_DECKLE,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        >
          {/* the paper */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: P_RADIUS,
              background: PAPER,
              border: "1px solid rgba(96,70,38,0.55)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,246,222,0.25)," +
                "inset 0 26px 40px -26px rgba(74,52,26,0.7)," +
                "inset 0 -26px 40px -26px rgba(74,52,26,0.7)," +
                "inset 26px 0 34px -26px rgba(74,52,26,0.6)," +
                "inset -26px 0 34px -26px rgba(74,52,26,0.6)",
            }}
          />
          {/* the grain */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: PAPER_GRAIN,
              backgroundSize: "170px 170px",
              mixBlendMode: "multiply",
              opacity: 0.05,
            }}
          />
          {/* the torch's firelight warming the top of the page */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: P_WARM_TOP, mixBlendMode: "screen" }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: P_AMBER_TOP, mixBlendMode: "overlay" }}
          />
        </div>

        {/* The reading, on its OWN compositor layer over the cached paper. No mask,
            no blend, no isolation here — just text — so a scroll is a straight GPU
            slide of this layer, not a repaint of the sheet beneath it. The words sit
            well inside the padding, so the ragged deckle edge the paper layer already
            carries never needs to clip them. `translateZ(0)` promotes it so the
            browser hands scrolling to the compositor. */}
        <div
          className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar"
          style={{
            touchAction: "pan-y",
            overscrollBehavior: "contain",
            transform: "translateZ(0)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <InkContent />
        </div>
      </div>
    </motion.div>
  );
}

export default function AboutEntry({
  onBack,
}: {
  lit: boolean;
  onBack: () => void;
}) {
  // The torch is winged and floating from the start; `unhinged` just marks that
  // the passage has begun, pacing the reveal and gating the reading panel.
  const [unhinged, setUnhinged] = useState(false);
  // Once the torch is free the wall it hung on splits down the middle and the
  // dark behind it opens up.
  const [split, setSplit] = useState(false);
  // ...and then the torch leads us through the opening into the room, where the
  // blank parchment is already hanging on the wall — we simply find it there.
  const [entered, setEntered] = useState(false);
  // ...and then we dolly the last of the way into the wall until the sheet fills
  // the frame (the wall still showing to either side of it).
  const [inking, setInking] = useState(false);
  // ...and once we have arrived, the entire About reading inks itself onto that
  // same sheet — the words writing on and the portrait coming up as an etched
  // drawing. Held back until the move is nearly done, so the text is never being
  // scaled while it draws (that is what stutters), only revealed at rest.
  const [reveal, setReveal] = useState(false);
  const [closing, setClosing] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    // A beat, so the swap from the real torch to this one is invisible before it
    // starts to move.
    timers.current.push(window.setTimeout(() => setUnhinged(true), 120));
    // ...then the wall opens behind the drifting torch.
    timers.current.push(window.setTimeout(() => setSplit(true), 120 + 700 + 560));
    // ...and once the wall is open we are led through it into the room, where the
    // blank parchment is already hanging on the wall.
    timers.current.push(window.setTimeout(() => setEntered(true), 120 + 700 + 560 + 1500));
    // ...a beat to take in the sheet on the far wall, then we dolly the rest of the
    // way into it.
    timers.current.push(window.setTimeout(() => setInking(true), 120 + 700 + 560 + 1500 + 1900));
    // ...and, once we have nearly arrived, the reading inks itself onto the sheet.
    timers.current.push(window.setTimeout(() => setReveal(true), 120 + 700 + 560 + 1500 + 1900 + 1500));
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const back = () => {
    setClosing(true);
    // Reverse order: the ink fades, we pull back out of the wall, the sheet comes
    // apart, the wall closes over the opening, then the torch folds its wings and
    // hangs itself back up.
    setReveal(false);
    setInking(false);
    setEntered(false);
    timers.current.push(window.setTimeout(() => setSplit(false), 1100));
    timers.current.push(window.setTimeout(() => setUnhinged(false), 1950));
    timers.current.push(window.setTimeout(onBack, 2860));
  };

  return (
    // Transparent: the real wall and menu stay behind, only the torch changes.
    <div className="fixed inset-0 z-[60]">
      {/* Utter darkness, waiting behind the wall. It is hidden while the wall is
          whole and opens up as the two halves part. */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={false}
        animate={{ opacity: split ? 1 : 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* The room the doorway opens onto. The walls of the room are their own 3D
          layer (RoomWalls) — a back wall with a side wall running to it left and
          right, dollied toward us on `inking` so we WALK in, the side walls sweeping
          past, rather than the outer wall enlarging onto us.

          Over the room, a heavy vignette sinks its edges into black (and hides
          where the planes meet). And over that, the parchment already hanging on
          the wall, on a plane that rides the SAME lens and dolly as the room, so
          the sheet is fixed to the back wall and grows exactly as the wall does as
          we approach. */}
      {split && (
        <>
          {/* The room's walls and their vignette. They carry the walk-in — the
              side walls sweeping past as we dolly — and then sink ALL the way to
              black as we arrive at the sheet, so once we are truly in there is
              nothing of the room left to either side, only the lit parchment on the
              dark, exactly like the doorway portal. They come back on the way out. */}
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: inking ? 0 : 1 }}
            transition={{
              duration: inking ? 1.0 : 1.0,
              delay: inking ? 1.2 : 0,
              ease: "easeOut",
            }}
          >
            <RoomWalls near={inking} />
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background:
                  "radial-gradient(66% 58% at 50% 40%, transparent, rgba(0,0,0,0.86) 78%)",
              }}
            />
          </motion.div>
          {/* the back wall's own contents — the swarm and the parchment it packs
              into — on a plane that rides the SAME lens and dolly as the room, so
              the sheet is fixed to the wall and we walk up to it. On top of the
              vignette so the reading stays clean and lit. */}
          <div
            className="absolute inset-0"
            style={{ perspective: `${PERSP}px`, perspectiveOrigin: "50% 40%" }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
              initial={false}
              animate={{ z: inking ? NEAR_Z : 0 }}
              transition={inking ? DOLLY : { duration: 1.4, ease: [0.5, 0, 0.2, 1] }}
            >
              <div
                className="absolute inset-0"
                style={{ transform: `translateZ(-${ROOM_DEPTH}px)` }}
              >
                {/* The parchment: already hanging on the wall behind the doors, so
                    it is there as they split — only a faint hint of paper deep in
                    the dark, then lit from the top as we walk up to it. */}
                <WallParchment near={inking} gone={reveal} />
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* The wall the torch hung on, split right down the middle. Each half is a
          full copy of the room's brick wall clipped to its side, so while they
          are closed they are the same wall you were just looking at; then they
          slide apart and the dark shows between them. The room's own BrickWall is
          hidden underneath while this plays (see Sections), so there is only ever
          one wall on screen. */}
      <div className="pointer-events-none absolute inset-0">
        {/* left half. Promoted to its own layer (will-change / translateZ) so the
            slide is a straight GPU composite rather than re-rasterising a big
            masked wall every frame — that re-raster is what made the split hitch. */}
        <motion.div
          className="absolute inset-y-0 left-0 w-1/2 overflow-hidden"
          initial={false}
          animate={{ x: split ? "-72%" : "0%" }}
          transition={{ duration: 0.68, ease: [0.5, 0, 0.15, 1] }}
          style={{ willChange: "transform", transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        >
          {/* a full-viewport wall, pinned to the screen so the coursing lines up
              across the seam while it is shut */}
          <div className="absolute inset-y-0 left-0" style={{ width: "100vw" }}>
            <BrickWall />
          </div>
          {/* the thickness of the wall, caught along the opening edge */}
          <div
            className="absolute inset-y-0 right-0 w-16"
            style={{ background: "linear-gradient(to right, transparent, rgba(0,0,0,0.9))" }}
          />
        </motion.div>

        {/* right half */}
        <motion.div
          className="absolute inset-y-0 right-0 w-1/2 overflow-hidden"
          initial={false}
          animate={{ x: split ? "72%" : "0%" }}
          transition={{ duration: 0.68, ease: [0.5, 0, 0.15, 1] }}
          style={{ willChange: "transform", transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-y-0 right-0" style={{ width: "100vw" }}>
            <BrickWall />
          </div>
          <div
            className="absolute inset-y-0 left-0 w-16"
            style={{ background: "linear-gradient(to left, transparent, rgba(0,0,0,0.9))" }}
          />
        </motion.div>
      </div>

      {/* the stone thrown off the seam as it breaks, and the dust off it. Mounted
          only while the wall is open, so parting it spawns the burst and closing
          it clears it. */}
      {split && <Rubble />}

      {/* Once we have walked up to the sheet, the reading fades up on its own 2D
          layer over the arrived room (out of the 3D dolly, so it scrolls cleanly
          under a finger), lit from the top by the torch just as the wall sheet is. */}
      <AnimatePresence>{reveal && <ReadingPanel key="reading" />}</AnimatePresence>

      {/* The torch that led us in — shared with the Projects passage. Upright and
          centred on the wall so the swap from the real fixture torch is invisible,
          then it leans aside on `entered` to light the page. */}
      <PassageTorch lean={entered} zClassName="z-[48]" />

      {/* back, so this beat can be left while the rest is still being built */}
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

// The About reading, inked onto the parchment as we arrive at it. The sheet is
// the same aged paper the swarm formed, now filling the frame; the words write
// themselves on in ink and the portrait comes up as an etched drawing, so the
// whole page reads as one hand-inked manuscript rather than a photo with a
// caption beside it.

/** The ink, on the aged paper: a near-black brown, and two lighter hands of it. */
const INK = "#2a2017";
const INK_SOFT = "#5b4a33";
const INK_FAINT = "#8a7248";

/** The portrait's shape: a dome above, gently rounded below. */
const ARCH = "50% 50% 44% 44% / 52% 52% 16% 16%";

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
      transition={{ duration: 0.75, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// The portrait as an ink drawing on the sheet: the photograph pushed toward a
// sepia etching and multiplied into the paper, so its lights become the paper and
// its darks become ink, then drawn on top-to-bottom as if it were being inked in.
function InkPortrait() {
  return (
    <motion.div
      className="relative mx-auto w-[min(56%,11rem)] shrink-0 md:mx-0 md:w-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
    >
      <div
        className="relative aspect-[3/4] overflow-hidden"
        style={{ borderRadius: ARCH }}
      >
        {/* the portrait assembles out of the grey swarm — the ONE thing here the
            butterflies still make — pushed toward a sepia etching on the paper */}
        <div
          className="h-full w-full"
          style={{
            filter: "grayscale(0.5) sepia(0.55) contrast(1.5) brightness(1.05)",
            mixBlendMode: "multiply",
            opacity: 0.94,
          }}
        >
          <PortraitAssembly src={ABOUT.photo} alt={ABOUT.name} cols={7} rows={9} />
        </div>
        {/* an ink line traced round the arch */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ borderRadius: ARCH, border: `1px solid ${INK_SOFT}`, opacity: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

// The reading itself, inked onto the sheet WallParchment provides (so there is no
// paper of its own here — just the words and the etched portrait, each writing on
// in ink). The heading first, then the portrait draws in beside the words.
function InkContent() {
  return (
    <div className="relative px-7 py-12 sm:px-12 sm:py-16">
      <Ink>
        <h2
          className="mb-9 font-serif text-4xl font-light tracking-wide md:text-5xl"
          style={{ color: INK }}
        >
          About
        </h2>
      </Ink>
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        <InkPortrait />
        <div className="min-w-0 flex-1 font-serif">
          <Ink delay={0.35}>
            <p className="mb-1 text-2xl" style={{ color: INK }}>
              {ABOUT.name}
            </p>
          </Ink>
          <Ink delay={0.55}>
            <p
              className="mb-6 font-sans text-xs uppercase tracking-[0.2em]"
              style={{ color: INK_FAINT }}
            >
              {ABOUT.role}
            </p>
          </Ink>
          <Ink delay={0.8}>
            <p className="mb-8 text-[15px] italic leading-relaxed" style={{ color: INK_SOFT }}>
              {ABOUT.bio}
            </p>
          </Ink>
          <div className="mb-8 flex flex-col gap-4">
            {STACK.map((g, i) => (
              <Ink key={g.group} delay={1.05 + i * 0.18}>
                <div>
                  <p
                    className="mb-1 font-sans text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: INK_FAINT }}
                  >
                    {g.group}
                  </p>
                  <p className="text-[14px] leading-relaxed" style={{ color: INK }}>
                    {g.items.join(" · ")}
                  </p>
                </div>
              </Ink>
            ))}
          </div>
          <Ink delay={1.05 + STACK.length * 0.18 + 0.15}>
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm tracking-wide">
              {ABOUT.socials.map((s) => {
                const external = s.href.startsWith("http");
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    className="underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-70"
                    style={{ color: INK_SOFT }}
                  >
                    {s.label}
                  </a>
                );
              })}
            </div>
          </Ink>
        </div>
      </div>
    </div>
  );
}
