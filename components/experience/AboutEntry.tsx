"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ABOUT, STACK } from "@/lib/content";
import BrickWall from "./BrickWall";
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

const FLAME_OUTER =
  "M20,4 C25,24 34,30 34,48 C34,64 28,74 20,74 C12,74 6,64 6,48 C6,30 15,24 20,4 Z";
const FLAME_MID =
  "M20,20 C23,34 30,38 30,52 C30,64 25,71 20,71 C15,71 10,64 10,52 C10,38 17,34 20,20 Z";
const FLAME_CORE =
  "M20,36 C22,44 26,47 26,55 C26,63 23,68 20,68 C17,68 14,63 14,55 C14,47 18,44 20,36 Z";

// One wing, drawn in the body's own 96x132 space with its root at the band,
// (48,82). A forewing sweeping up and out and a smaller hindwing under it.
const FOREWING = "M48,80 C50,56 66,38 82,41 C94,43 92,59 81,69 C69,80 56,82 48,82 Z";
const HINDWING = "M48,84 C58,82 77,85 81,95 C84,103 74,110 64,103 C55,97 50,90 48,84 Z";

// The stars the wings carry, in the wing's own space: a few points bright enough
// to survive being small, out where the light catches the membrane rather than
// in the dark pooled at the root. Same idea as the swarm's wings.
const GLINTS: [number, number, number, number][] = [
  // x, y, radius, opacity
  [72, 51, 2.3, 0.95],
  [80, 58, 1.5, 0.68],
  [65, 60, 1.8, 0.85],
  [73, 95, 1.5, 0.6],
];

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
  // falling under gravity and the dust lifting and spreading as it thins.
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
    dust: Array.from({ length: 11 }, (_, i) => {
      const dir = Math.random() < 0.5 ? -1 : 1;
      return {
        id: i,
        top: rand(4, 78),
        size: rand(50, 150),
        out: dir * rand(20, 120),
        lift: rand(20, 90),
        dur: rand(1.3, 2.4),
        delay: rand(0, 0.4),
      };
    }),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
      {bits.dust.map((d) => (
        <motion.div
          key={`dust-${d.id}`}
          className="absolute left-1/2 rounded-full"
          style={{
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            marginLeft: -d.size / 2,
            marginTop: -d.size / 2,
            background:
              "radial-gradient(circle, rgba(150,138,122,0.5), rgba(120,108,94,0.18) 46%, transparent 72%)",
            filter: "blur(5px)",
          }}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
          animate={{ x: d.out, y: -d.lift, scale: 2.3, opacity: [0, 0.55, 0] }}
          transition={{ duration: d.dur, delay: d.delay, ease: "easeOut", opacity: { duration: d.dur, delay: d.delay, times: [0, 0.2, 1] } }}
        />
      ))}
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

// Where the torch is carried to once we are inside, and how far it leans there.
// Off to the upper left of the sheet, tilted clockwise so the flame points up and
// in over the page and the body/handle no longer hangs across the reading. Its
// light pool (which rides with it) then falls across the paper from the side, so
// it reads as a torch being held up TO the page rather than a lamp bolted above it.
const TORCH_X = -190;
const TORCH_Y = -6;
const TORCH_TILT = 26;

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
// reading as the parchments in Digressions.

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

function WallParchment({ reveal }: { reveal: boolean }) {
  // The sheet is simply already there, hung on the wall, when we step into the
  // room — no swarm forms it any more. It just softly resolves in with the room
  // as we come through the doorway, and once the camera has walked up to it the
  // reading inks itself onto it.
  return (
    <div className="absolute left-1/2 top-[44%] z-10 w-[34rem] max-w-[88vw] -translate-x-1/2 -translate-y-1/2">
      {/* the bail it hangs from, bolted to the brick above the sheet */}
      <motion.div
        className="pointer-events-none absolute -top-[3.4rem] left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <Bail />
      </motion.div>
      {/* and a tack pinning each top corner */}
      <motion.div
        className="pointer-events-none absolute -top-1 left-7"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        <Tack />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute -top-1 right-7"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        <Tack />
      </motion.div>

      <div className="relative h-[42rem] max-h-[84vh] w-full">
        {/* the sheet: the crisp paper the reading inks onto, already hanging on the
            wall and resolving in with the room */}
        <motion.div
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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
          {/* a little of the torch's warmth caught in the fibres, off the top
              where the flame hangs above it */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 78% 64% at 34% 6%, " +
                "rgba(255,201,120,0.62) 0%, rgba(255,160,74,0.26) 40%, transparent 74%)," +
                "radial-gradient(ellipse 120% 90% at 40% 0%, " +
                "rgba(255,176,92,0.2) 0%, transparent 68%)",
              mixBlendMode: "screen",
            }}
          />
          {/* and the dark it sinks into away from the flame */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 130% 100% at 32% 4%, transparent 0%, transparent 42%, rgba(8,6,4,0.5) 88%)",
            }}
          />

          {/* the reading, inked onto the sheet once we have arrived. Held in its
              own scroll so a long page travels under the torch. */}
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
              <InkContent />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Wing() {
  return (
    <>
      <path d={FOREWING} fill="url(#strap-iron)" />
      <path d={HINDWING} fill="url(#strap-iron)" opacity="0.85" />
      {/* the night sky inside the membrane: deep and dark at the root, its colour
          left alone at the rim, with a few glints. Painted straight onto the wing
          shapes rather than a clipped rectangle — a wider rect inflated the wing
          group's bounding box, and since the flap hinges on that box's left edge,
          it pushed the pivot off the handle and split the wings apart mid-beat. */}
      <path d={FOREWING} fill="url(#wing-night)" />
      <path d={HINDWING} fill="url(#wing-night)" />
      {GLINTS.map(([x, y, r, o]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" opacity={o} />
      ))}
    </>
  );
}

export default function AboutEntry({
  onBack,
}: {
  lit: boolean;
  onBack: () => void;
}) {
  // The morph runs in order, so it reads as the band becoming the wings rather
  // than everything happening at once:
  //   unhinged  the band peels off (right half first, then left) and each half
  //             is replaced by a wing growing from it (right, then left)
  //   floating  only once both wings are out does the torch lift and drift
  const [unhinged, setUnhinged] = useState(false);
  const [floating, setFloating] = useState(false);
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
    // ...and it only leaves the wall after the second wing has finished growing.
    timers.current.push(window.setTimeout(() => setFloating(true), 120 + 1250));
    // ...and only once it is floating clear does the wall open behind it.
    timers.current.push(window.setTimeout(() => setSplit(true), 120 + 1250 + 880));
    // ...and once the wall is open we are led through it into the room, where the
    // blank parchment is already hanging on the wall.
    timers.current.push(window.setTimeout(() => setEntered(true), 120 + 1250 + 880 + 1500));
    // ...a beat to take in the sheet on the far wall, then we dolly the rest of the
    // way into it.
    timers.current.push(window.setTimeout(() => setInking(true), 120 + 1250 + 880 + 1500 + 1900));
    // ...and, once we have nearly arrived, the reading inks itself onto the sheet.
    timers.current.push(window.setTimeout(() => setReveal(true), 120 + 1250 + 880 + 1500 + 1900 + 1500));
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
    timers.current.push(
      window.setTimeout(() => {
        setFloating(false);
        setUnhinged(false);
      }, 1950)
    );
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
                    it is revealed as they split — not popped in after. Inked on
                    `reveal` once we have walked up to it. */}
                <WallParchment reveal={reveal} />
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
          transition={{ duration: 1.15, ease: [0.5, 0, 0.15, 1] }}
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
          transition={{ duration: 1.15, ease: [0.5, 0, 0.15, 1] }}
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

      {/* The floating torch, sitting exactly where the fixture torch was. The
          outermost wrapper owns the POSE (upright on the wall, then carried aside
          and tilted to read the sheet once we are in), the middle owns the perpetual
          drift, and the inner owns the unhinge. Keeping the pose out of the drift
          layer lets the torch ease smoothly into its held angle while it still
          breathes. On the wall it MUST stay upright and centred, so the swap from
          the real fixture torch to this one is invisible; only once we are through
          the doorway (`entered`) does it lean over to light the page. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center">
        <motion.div
          style={{ marginTop: 30 }}
          initial={false}
          animate={
            entered
              ? { x: TORCH_X, y: TORCH_Y, rotate: TORCH_TILT }
              : { x: 0, y: 0, rotate: 0 }
          }
          transition={{ duration: 1.7, ease: [0.5, 0, 0.2, 1] }}
        >
          <motion.div
            initial={false}
            animate={
              floating
                ? { y: [-4, -13, -4], rotate: [-1.5, 1.5, -1.5] }
                : { y: 0, rotate: 0 }
            }
            transition={
              floating
                ? { duration: 3.4, ease: "easeInOut", repeat: Infinity }
                : { duration: 0.7, ease: "easeOut" }
            }
          >
          <div className="relative flex flex-col items-center">
            {/* the flame */}
            <div
              className="relative z-10"
              data-torch-flame
              style={{ width: 40, height: 86, marginBottom: "-22px" }}
            >
              <svg
                width="40"
                height="86"
                viewBox="0 0 40 86"
                fill="none"
                aria-hidden
                style={{ filter: "drop-shadow(0 0 12px rgba(255,150,60,0.75))" }}
              >
                <g className="torch-flame">
                  <path d={FLAME_OUTER} fill="#ff6a14" opacity="0.92" />
                  <path d={FLAME_MID} fill="#ffb02a" />
                  <path d={FLAME_CORE} fill="#ffe9b0" />
                </g>
              </svg>
            </div>

            {/* the body, and over it the band-that-becomes-wings on the same box */}
            <div className="relative">
              <svg
                width="96"
                height="132"
                viewBox="0 0 96 132"
                fill="none"
                aria-hidden
                style={{ filter: "drop-shadow(4px 8px 7px rgba(0,0,0,0.55))" }}
              >
                <defs>
                  <linearGradient id="strap-wood" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#1f130c" />
                    <stop offset="0.26" stopColor="#573c28" />
                    <stop offset="0.5" stopColor="#7c5a3d" />
                    <stop offset="0.72" stopColor="#4f371f" />
                    <stop offset="1" stopColor="#190f09" />
                  </linearGradient>
                  <radialGradient id="strap-head" cx="0.42" cy="0.3" r="0.8">
                    <stop offset="0" stopColor="#4a382a" />
                    <stop offset="0.55" stopColor="#2b201a" />
                    <stop offset="1" stopColor="#140d09" />
                  </radialGradient>
                </defs>

                {/* handle */}
                <path
                  d="M41 44 L55 44 L52 118 C52 121 49 123 48 123 C47 123 44 121 44 118 Z"
                  fill="url(#strap-wood)"
                  stroke="#150c07"
                  strokeWidth="1"
                />
                <path d="M45 46 L45 116" stroke="rgba(255,170,90,0.5)" strokeWidth="1.6" strokeLinecap="round" />
                {/* pitch head */}
                <ellipse cx="48" cy="30" rx="16" ry="22" fill="url(#strap-head)" stroke="#120b07" strokeWidth="1.2" />
                <path d="M33 18 Q48 24 63 18" stroke="#0e0906" strokeWidth="1.6" fill="none" />
                <path d="M32 28 Q48 34 64 28" stroke="#0e0906" strokeWidth="1.6" fill="none" />
                <path d="M33 38 Q48 44 63 38" stroke="#0e0906" strokeWidth="1.6" fill="none" />
                <path d="M37 12 Q48 6 59 12 Q54 22 48 22 Q42 22 37 12 Z" fill="rgba(255,150,60,0.5)" />
                <ellipse cx="42" cy="22" rx="4.5" ry="7" fill="rgba(150,150,160,0.12)" />
              </svg>

              {/* The band and the wings, on their own overlaid svg sharing the
                  same 96x132 box so they sit exactly on the handle. */}
              <svg
                className="absolute inset-0"
                width="96"
                height="132"
                viewBox="0 0 96 132"
                fill="none"
                aria-hidden
                style={{ overflow: "visible" }}
              >
                <defs>
                  <linearGradient id="strap-iron" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#63636c" />
                    <stop offset="0.34" stopColor="#2a2a30" />
                    <stop offset="0.52" stopColor="#4a4a53" />
                    <stop offset="1" stopColor="#141418" />
                  </linearGradient>
                  {/* deep at the root (the band), gone by the rim */}
                  <radialGradient
                    id="wing-night"
                    gradientUnits="userSpaceOnUse"
                    cx="54"
                    cy="80"
                    r="46"
                  >
                    <stop offset="0" stopColor="#080a1c" stopOpacity="0.72" />
                    <stop offset="0.45" stopColor="#0d1230" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#131a3c" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* The strap, split at the handle's centre into two halves that
                    peel off one at a time. Each half lifts and fades exactly as
                    the wing on its side grows in its place, so the eye reads the
                    band turning into the wing rather than one thing swapped for
                    another. The right goes first, then the left. */}
                {/* right half of the band: right bolt, arm, and the 48..66 strap */}
                <motion.g
                  initial={false}
                  animate={
                    unhinged
                      ? { opacity: 0, y: -11, scale: 1.07 }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  transition={{ duration: 0.42, ease: "easeOut", delay: unhinged ? 0.05 : 0.42 }}
                  style={{ transformOrigin: "48px 82px" }}
                >
                  <circle cx="72" cy="82" r="4" fill="#4c4c54" stroke="#111115" strokeWidth="1" />
                  <circle cx="70.6" cy="80.6" r="1.4" fill="#7c7c86" />
                  <path d="M62 82 L68 82" stroke="#2a2a30" strokeWidth="3" strokeLinecap="round" />
                  <path
                    d="M48 72 Q57 71 66 74 L66 90 Q57 93 48 92 Z"
                    fill="url(#strap-iron)"
                    stroke="#111115"
                    strokeWidth="1"
                  />
                </motion.g>
                {/* left half of the band: left bolt, arm, and the 30..48 strap */}
                <motion.g
                  initial={false}
                  animate={
                    unhinged
                      ? { opacity: 0, y: -11, scale: 1.07 }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  transition={{ duration: 0.42, ease: "easeOut", delay: unhinged ? 0.5 : 0.05 }}
                  style={{ transformOrigin: "48px 82px" }}
                >
                  <circle cx="24" cy="82" r="4" fill="#4c4c54" stroke="#111115" strokeWidth="1" />
                  <circle cx="22.6" cy="80.6" r="1.4" fill="#7c7c86" />
                  <path d="M28 82 L34 82" stroke="#2a2a30" strokeWidth="3" strokeLinecap="round" />
                  <path
                    d="M30 74 Q39 71 48 72 L48 92 Q39 93 30 90 Z"
                    fill="url(#strap-iron)"
                    stroke="#111115"
                    strokeWidth="1"
                  />
                </motion.g>

                {/* The wings the strap became, hinged at the band (48,82), each
                    growing from its own half of the band. The bloom is a
                    scale/opacity on the outer group; the flap is the shared CSS
                    class, hinged at the wing's own inner edge like the swarm's.
                    Right grows first, left a beat later; closing, they fold in
                    the reverse order. */}
                <motion.g
                  initial={false}
                  animate={{ opacity: unhinged ? 1 : 0, scale: unhinged ? 0.78 : 0.2 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: unhinged ? 0.16 : 0.22 }}
                  style={{ transformOrigin: "48px 82px" }}
                >
                  <g className="butterfly__wing" style={{ ["--flap" as string]: "0.5s" }}>
                    <Wing />
                  </g>
                </motion.g>
                {/* left wing: the same shape mirrored about the hinge x = 48 */}
                <motion.g
                  initial={false}
                  animate={{ opacity: unhinged ? 1 : 0, scale: unhinged ? 0.78 : 0.2 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: unhinged ? 0.6 : 0 }}
                  style={{ transformOrigin: "48px 82px" }}
                >
                  <g transform="translate(96,0) scale(-1,1)">
                    <g className="butterfly__wing" style={{ ["--flap" as string]: "0.5s" }}>
                      <Wing />
                    </g>
                  </g>
                </motion.g>
              </svg>
            </div>

            {/* the light it throws, guttering with the flame */}
            <div
              className="torch-glow pointer-events-none absolute left-1/2 -z-10"
              style={{
                top: 92,
                width: "min(120vw, 1000px)",
                height: "min(150vh, 1200px)",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(ellipse 46% 44% at 50% 50%, rgba(255,198,120,0.55) 0%, rgba(255,172,90,0.3) 24%, rgba(255,150,66,0.12) 46%, rgba(255,140,60,0) 72%)",
                filter: "blur(30px)",
              }}
            />
          </div>
          </motion.div>
        </motion.div>
      </div>

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
