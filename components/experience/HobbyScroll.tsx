"use client";

import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Hobby } from "@/lib/content";
import HobbyRoll from "./HobbyRoll";

// What the object becomes.
//
// The object does not vanish and get replaced by a panel. It flies to the
// middle of the screen (framer's layoutId does that part, paired with the
// instance left behind in the grid) and the scroll unrolls out of it, so the
// two rods start together and are pushed apart by the parchment appearing
// between them.
//
// The unroll is not a scaleY. Scaling is cheaper and completely wrong here: it
// stretches the writing along with the paper, and a scroll's whole trick is that
// the words were always that size and were simply rolled up out of sight.
//
// It used to animate `height` instead, which honours that and was the reason this
// dragged. Height is a layout property, so every frame of it re-laid out the
// paper, the scrolling column inside it, every line of writing in that, and then
// re-centred the whole dialog — which moved the rod and the object, which forced
// the object's blurred colour wash to be re-blurred, and re-rasterised a sixty
// pixel drop shadow. All of that, sixty times a second, to reveal some text.
//
// It is a clip now. The paper is laid out once at its full size and revealed from
// the top down with an inset clip-path, which is a paint, not a layout: nothing
// reflows, nothing re-centres, the blur and the shadow are rasterised once. The
// writing still never stretches, because nothing is ever scaled.
//
// Which broke the lower rod, and that is worth writing down. The two rods start
// together and are pushed apart by the paper appearing between them, and the way
// that used to work was pure luck: the lower rod sat AFTER the paper in normal
// flow, so animating the paper's height dragged it along for free. Freeze the
// layout and it stops moving — the paper clipped away to nothing and left both
// rods sitting where they were, so it read as the scroll vanishing and the bars
// hanging around afterwards. Worst on a phone, where the paper is tallest.
//
// So the rod rides the edge deliberately now instead of by accident. It and the
// button under it are translated up by exactly the paper's height and slide back
// down as the reveal runs, on the same duration and the same curve as the clip,
// which puts the rod precisely on the edge of the paper at every frame of it.
// Transform only, so it is still nothing to draw.

/** Aged paper, warm, and darker toward the top: the light is under it now, so the
 *  far edge from the flame is the dim one. */
const PARCHMENT =
  "linear-gradient(0deg, #f3e6c2 0%, #e8d4a6 42%, #d8c290 74%, #b9a074 100%)";

// The flame that burns under the page, in a 40x86 box, base at the bottom.
const FLAME_OUTER =
  "M20,4 C25,24 34,30 34,48 C34,64 28,74 20,74 C12,74 6,64 6,48 C6,30 15,24 20,4 Z";
const FLAME_MID =
  "M20,20 C23,34 30,38 30,52 C30,64 25,71 20,71 C15,71 10,64 10,52 C10,38 17,34 20,20 Z";
const FLAME_CORE =
  "M20,36 C22,44 26,47 26,55 C26,63 23,68 20,68 C17,68 14,63 14,55 C14,47 18,44 20,36 Z";

/** The torch flame that lives under the page, licking up at its base. */
function BaseFlame() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{ top: -78, zIndex: -1 }}
      aria-hidden
    >
      <div className="relative" style={{ width: 74, height: 128 }}>
        <div
          className="torch-glow absolute left-1/2 top-4 -translate-x-1/2 rounded-full"
          style={{
            width: 230,
            height: 190,
            background:
              "radial-gradient(circle, rgba(255,176,76,0.8), rgba(255,140,50,0.22) 44%, transparent 68%)",
            filter: "blur(10px)",
          }}
        />
        <svg
          width="74"
          height="128"
          viewBox="0 0 40 86"
          fill="none"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 6, filter: "drop-shadow(0 0 14px rgba(255,150,60,0.85))" }}
        >
          <g className="torch-flame">
            <path d={FLAME_OUTER} fill="#ff6a14" opacity="0.92" />
            <path d={FLAME_MID} fill="#ffb02a" />
            <path d={FLAME_CORE} fill="#ffe9b0" />
          </g>
        </svg>
      </div>
    </div>
  );
}

/** Turned wood, lit from above like everything else here. */
const ROD =
  "linear-gradient(to bottom, #8a7048 0%, #5f4a2e 38%, #3a2c1b 78%, #241b11 100%)";

/**
 * How wide the rod is, in css pixels, while the scroll is still rolled.
 *
 * The rolled scroll draws its own rod inside the svg, and that one is the rod at
 * rest — it is part of the object on the shelf, not something that materialises
 * when the thing opens. So the html rod has to come into existence at exactly
 * that width and grow from there, or the swap reads as a second, longer bar
 * appearing from nowhere.
 *
 * From HobbyRoll's own units: the rod spans +/-34 with a knob of r 3.4 at each
 * end, at the object scale of 0.82, in a 116-unit viewBox rendered 150px wide.
 * (34 + 3.4) * 2 * 0.82 * (150 / 116).
 */
const ROD_SHORT = 79;

/**
 * The rod, which scales rather than resizes.
 *
 * scaleX and not width, because width is layout: growing it would re-lay out
 * the dialog and re-centre everything under it on every frame. The knobs are
 * counter-scaled on the same transition so they stay circular while the bar they
 * cap stretches, and they still ride the ends because the parent's scale moves
 * them there for free.
 */
function Rod({
  width,
  scale,
  visible,
  transition,
  onComplete,
}: {
  width: string;
  scale: number;
  visible: boolean;
  transition: typeof UNROLL | typeof GROW;
  onComplete?: () => void;
}) {
  const knob = { scaleX: 1 / scale };
  return (
    <motion.div
      className="relative z-10 flex shrink-0 items-center justify-center"
      style={{ width }}
      initial={{ scaleX: scale, opacity: 0 }}
      animate={{ scaleX: scale, opacity: visible ? 1 : 0 }}
      transition={{ ...transition, opacity: { duration: 0 } }}
      onAnimationComplete={onComplete}
    >
      <div
        className="h-[9px] w-full rounded-full"
        style={{ background: ROD, boxShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
      />
      {/* the knobs on the ends, which is most of what says "rod" and not "bar".
          The half-width shift has to be re-stated here: framer writes the whole
          transform, so a tailwind -translate-x-1/2 on the same element is gone
          the moment this animates. */}
      <motion.span
        className="absolute left-0 h-[15px] w-[15px] rounded-full"
        style={{ background: ROD, x: "-50%" }}
        initial={knob}
        animate={knob}
        transition={transition}
      />
      <motion.span
        className="absolute right-0 h-[15px] w-[15px] rounded-full"
        style={{ background: ROD, x: "50%" }}
        initial={knob}
        animate={knob}
        transition={transition}
      />
    </motion.div>
  );
}

const UNROLL = { duration: 0.72, ease: [0.32, 0.72, 0.24, 1] as const };
/** The rod drawing itself out to the width of the page it is about to hold. */
const GROW = { duration: 0.34, ease: [0.32, 0.72, 0.24, 1] as const };
/** Up to the top of the screen, and later back down again. */
const FLIGHT = { duration: 0.46, ease: [0.3, 0.7, 0.25, 1] as const };
/**
 * If the flight never reports finishing, unroll anyway.
 *
 * A layout animation only runs when something actually moved, and there are ways
 * to open one of these where nothing has to — so without this, the scroll would
 * sit there rolled up forever waiting for a callback that was never coming.
 */
const FLIGHT_FALLBACK = 700;
/** The writing is only legible once there is paper under it. */
const INK = { duration: 0.5, delay: 0.34, ease: "easeOut" as const };

export default function HobbyScroll({
  hobby,
  color,
  phase,
  onClose,
}: {
  hobby: Hobby;
  color: string;
  phase: number;
  onClose: () => void;
}) {
  // The thirds of it, in order.
  //
  // Clicking one used to fly it up and unroll it at the same time, which is two
  // things happening at once and reads as neither. Then it was a sequence of
  // two, and the rod cheated: it was already lying up there at its full length
  // before the scroll arrived, so what you watched was a bar appearing and the
  // scroll flying up to hang itself on it. The rod is part of the scroll. It is
  // short while the scroll is rolled, because that is how long a rod inside a
  // rolled scroll is.
  //
  // So: fly, still rolled and still short. Land, and the rod draws out to the
  // width of the page. Only then does the paper come down out of it. Closing
  // runs all three backwards — the paper rolls up, the rod pulls back in, and
  // only then does it leave, with its roll back in its hands.
  type Stage = "flying" | "growing" | "open" | "rolling" | "shrinking";
  const [stage, setStage] = useState<Stage>("flying");
  const open = stage === "open";
  /** rolled up, in the air: at both ends of the sequence */
  const rolled = stage === "flying" || stage === "shrinking";

  const land = () => setStage((s) => (s === "flying" ? "growing" : s));
  useEffect(() => {
    const t = window.setTimeout(land, FLIGHT_FALLBACK);
    return () => window.clearTimeout(t);
  }, []);

  // How tall the paper is, and how wide the rod has to end up, both fixed
  // numbers rather than things being animated. Measured before paint, and again
  // on a resize, because the page inside it is capped in viewport units and a
  // phone turning on its side changes what that means.
  const paper = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [short, setShort] = useState(0.15);
  useLayoutEffect(() => {
    const read = () => {
      const el = paper.current;
      setHeight(el?.offsetHeight ?? 0);
      // The rod overhangs the paper by 13px at each end, so the length it grows
      // to is the paper plus that. Ratio, because it grows by scaling.
      const full = (el?.offsetWidth ?? 0) + 26;
      setShort(full ? Math.min(1, ROD_SHORT / full) : 0.15);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [hobby.key]);

  const rodScale = rolled ? short : 1;
  const rodProps = {
    width: "calc(100% + 26px)",
    scale: rodScale,
    // Not while it is rolled: the rolled scroll draws its own rod inside the
    // svg, and a second one hanging under it is the very thing this sequence is
    // fixing. The handover is a cut and not a fade — the two are the same length
    // in the same place at that instant, so they are one rod, and crossfading a
    // thing with itself only makes it briefly transparent.
    visible: !rolled,
    transition: stage === "growing" || stage === "shrinking" ? GROW : UNROLL,
  };

  // Escape closes it. The backdrop is clickable for the same purpose, but a
  // scroll that fills most of a phone leaves little backdrop to hit.
  const close = () => setStage((s) => (s === "open" ? "rolling" : s));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    // Above the sections pane, which is z-50. This is portalled onto the body
    // rather than left inside that pane, so it no longer inherits its stacking
    // and has to out-rank it on its own.
    // Top of the screen, not the middle of it. It is flown up here and then
    // opened downward, so it needs the room below it to open INTO.
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-5 pt-[6vh]">
      <motion.button
        type="button"
        aria-label="Close"
        onClick={close}
        // No backdrop blur. It was three pixels of blur over the entire viewport,
        // which is a full-screen filter pass on every frame of the unroll for an
        // effect you cannot see behind a scrim this dark. The scrim does the
        // separating; it is one composited layer and costs nothing.
        className="absolute inset-0 cursor-default bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={hobby.title}
        className="relative flex w-full max-w-[34rem] flex-col items-center"
      >
        {/* The wings, arriving from the shelf with the scroll they were
            carrying. Parked, so they stop bobbing once they have landed.

            Only the wings. What they were holding is the paper below them now:
            it unrolled, so there is nothing left to be rolled up, and a small
            rolled scroll sitting on top of an open one is two of the same thing.
            They grip the top rod instead, which is what is actually holding this
            up. */}
        <motion.div
          layoutId={`hobby-${hobby.key}`}
          className="relative z-20 -mb-2"
          transition={FLIGHT}
          onLayoutAnimationComplete={land}
        >
          {/* Rolled while it is in the air, and only the wings once it is open:
              what it was carrying is the paper below them now, and a small rolled
              scroll sitting on top of an open one is two of the same thing. On
              the way out it takes the roll back, because it has to have something
              to fly home with. */}
          <HobbyRoll
            color={color}
            size={150}
            phase={phase}
            still
            wingsOnly={!rolled}
          />
        </motion.div>

        {/* Keyed on the measured ratio so the first painted frame is already at
            the short length: framer reads `initial` once, at mount, and at mount
            nothing has been measured yet. */}
        <Rod
          key={short}
          {...rodProps}
          onComplete={() => {
            if (stage === "growing") setStage("open");
            if (stage === "shrinking") onClose();
          }}
        />

        <motion.div
          ref={paper}
          className="w-full overflow-hidden"
          // Revealed top down. `inset(0 0 100% 0)` hides all of it and 0% shows
          // all of it, and in between the paper appears out from under the rod.
          initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
          animate={
            open
              ? { clipPath: "inset(0 0 0% 0)", opacity: 1 }
              : { clipPath: "inset(0 0 100% 0)", opacity: 0 }
          }
          transition={UNROLL}
          // Rolled all the way up. Now the rod can pull back in, and only after
          // that does it leave.
          onAnimationComplete={() => {
            if (stage === "rolling") setStage("shrinking");
          }}
        >
          <div
            className="relative"
            style={{
              background: PARCHMENT,
              boxShadow:
                "inset 0 14px 20px -14px rgba(70,50,25,0.55), inset 0 -14px 20px -14px rgba(70,50,25,0.55), 0 24px 60px -30px rgba(0,0,0,0.9)",
            }}
          >
            {/* The paper is one flat gradient underneath, so it gets a wash of
                the object's own colour laid over it. Faint on purpose: this is
                light bouncing off the thing at the top of the scroll, not a
                tint on the page. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${color}26, transparent 62%)`,
              }}
            />
            {/* The torch beneath the page. Its light soaks UP through the
                translucent parchment from the bottom, brightest where the flame
                is and guttering with it, so the page reads as paper held over a
                candle and the ink stays dark against the light coming through. */}
            <div
              className="torch-glow pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 74% 70% at 50% 106%, rgba(255,236,170,1) 0%, rgba(255,200,108,0.68) 26%, rgba(255,158,66,0.26) 54%, transparent 82%)",
                mixBlendMode: "screen",
              }}
            />
            <motion.div
              className="no-scrollbar relative max-h-[56vh] overflow-y-auto px-7 py-9 sm:px-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: open ? 1 : 0 }}
              transition={open ? INK : { duration: 0.16 }}
            >
              <h3 className="font-serif text-3xl font-light tracking-wide text-[#2a2017]">
                {hobby.title}
              </h3>
              <p className="mt-3 max-w-prose font-serif text-[15px] italic leading-relaxed text-[#5b4a33]">
                {hobby.intro}
              </p>

              {hobby.lists?.map((list) => (
                <div key={list.label} className="mt-8">
                  <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.24em] text-[#8a7248]">
                    {list.label}
                  </p>
                  {/* Ruled like a page, one entry per line. A wrapped run of
                      pill tags would be the house style everywhere else on the
                      site, and would look like tags on parchment. */}
                  <ul className="flex flex-col">
                    {list.items.map((item) => (
                      <li
                        key={item}
                        className="border-b border-[#2a2017]/10 py-[7px] font-serif text-[16px] leading-snug text-[#33271b] last:border-b-0"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* The lower rod and everything under it, riding the edge of the paper.
            Keyed on the measured height so that the first painted frame already
            has the right offset: framer reads `initial` once, at mount, and at
            mount there is nothing measured yet. */}
        <motion.div
          key={height}
          className="relative flex w-full flex-col items-center"
          initial={{ y: -height }}
          animate={{ y: open ? 0 : -height }}
          transition={UNROLL}
        >
          {/* the flame licking up under the base of the page, once it is open */}
          {open && <BaseFlame />}

          <Rod {...rodProps} />

          <motion.button
            type="button"
            onClick={close}
            className="mt-6 font-sans text-xs tracking-[0.2em] text-neutral-500 transition-colors hover:text-ember"
            initial={{ opacity: 0 }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={INK}
          >
            roll it up
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
