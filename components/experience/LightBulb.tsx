"use client";

import { animate, motion, useMotionValue, type MotionValue, type PanInfo } from "framer-motion";
import { useRef } from "react";
import { playClick } from "@/lib/audio";

// A bulb on a cord with a pull-chain. Pull it and light falls over the menu;
// pull it again and the menu goes back into the dark.
//
// Kept deliberately analog: a drawn filament, a cord that sways a little when
// you tug it, and a soft cone of light. No switches, no chrome, no glow that
// looks like a dashboard.
//
// The chain is not a button with a canned wobble, it is a thing you can take
// hold of. Drag it and the fixture leans with you and the chain stretches;
// let go and it swings itself out on a spring loose enough to overshoot
// several times, which is what a pendulum does. The light cone and the pool
// beneath it live inside the fixture, so all of that sweeps across the room
// for free.

/** Degrees the fixture will lean at full pull. The room divides by it. */
export const MAX_LEAN = 16;
/** Pixels of horizontal drag per degree of lean. */
const LEVERAGE = 0.075;
/** How far down you have to pull before it counts as a pull. */
const PULL = 22;
const CHAIN_REST = 40;
const CHAIN_MAX = 34;

// Loose and heavy: it should cross zero four or five times before it gives up.
const SWING = { type: "spring", stiffness: 42, damping: 3.4, mass: 1 } as const;

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

type Props = {
  on: boolean;
  onToggle: () => void;
  /**
   * The fixture's lean, in degrees, written every frame while it swings. The
   * room reads it to dim the menu as the light travels off the words. Passed
   * in rather than reported by callback because this changes at 60fps and
   * must never go through React state.
   */
  lean?: MotionValue<number>;
};

export default function LightBulb({ on, onToggle, lean }: Props) {
  const ownLean = useMotionValue(0);
  const angle = lean ?? ownLean;
  const chain = useMotionValue(CHAIN_REST);
  // A pan ends before the click fires, so without this a drag-to-pull would
  // toggle twice.
  const dragged = useRef(false);

  const release = () => {
    animate(angle, 0, SWING);
    animate(chain, CHAIN_REST, { type: "spring", stiffness: 380, damping: 22 });
  };

  const onPan = (_: unknown, info: PanInfo) => {
    dragged.current = true;
    angle.set(clamp(info.offset.x * LEVERAGE, -MAX_LEAN, MAX_LEAN));
    chain.set(CHAIN_REST + clamp(info.offset.y, 0, CHAIN_MAX));
  };

  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > PULL) {
      playClick();
      onToggle();
    }
    release();
  };

  const onClick = () => {
    // swallowed if this was the tail of a drag; the pan already decided
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    playClick();
    onToggle();
    // a tug still sets it swinging, just a small one
    angle.set(on ? 5.5 : -5.5);
    animate(angle, 0, SWING);
  };
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
      {/* The fixture is lowered into the room rather than found already there.
          This is the arrival: you have just walked in, and the light comes down
          out of the dark before there is anything to read. A spring with a
          little overshoot, because a cord on a ceiling rose bounces once and
          settles, and the sway below then catches the same motion.

          Every time the menu mounts, not just the first. Coming back from a
          section the room is already sliding down, and the lamp arriving a
          beat behind it reads as being lowered in after you rather than as a
          duplicate move. */}
      <motion.div
        initial={{ y: "-115%" }}
        animate={{ y: 0 }}
        transition={{
          type: "spring",
          stiffness: 90,
          damping: 11,
          mass: 1,
          delay: 0.25,
        }}
      >
        {/* The whole fixture hangs from the ceiling rose and leans from there.
            Everything below is inside it, the cone and the pool included, so
            swinging the lamp swings the light. */}
        <motion.div
          className="relative flex flex-col items-center"
          style={{ transformOrigin: "50% 0%", rotate: angle }}
        >
          {/* cord down from the ceiling */}
          <div
            className="w-px"
            style={{
              height: "clamp(56px, 12vh, 130px)",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.42))",
            }}
          />

          {/* bulb */}
          <svg
            width="76"
            height="104"
            viewBox="0 0 76 104"
            fill="none"
            aria-hidden
            style={{
              filter: on
                ? "drop-shadow(0 0 18px rgba(255,178,92,0.55)) drop-shadow(0 0 46px rgba(255,150,60,0.35))"
                : "none",
              transition: "filter 600ms ease",
            }}
          >
            {/* cap */}
            <path
              d="M30 6h16v9H30zM29 15h18v7a4 4 0 0 1-4 4H33a4 4 0 0 1-4-4z"
              fill="rgba(196,190,180,0.55)"
            />
            {/* glass */}
            <path
              d="M38 26c-12.2 0-22 9.6-22 21.4 0 8.4 4.6 13.6 8.6 18.2 3 3.4 4.6 6.6 5 10.4h16.8c.4-3.8 2-7 5-10.4 4-4.6 8.6-9.8 8.6-18.2C60 35.6 50.2 26 38 26z"
              fill={on ? "rgba(255,196,116,0.30)" : "rgba(255,255,255,0.045)"}
              stroke={on ? "rgba(255,214,150,0.72)" : "rgba(232,226,214,0.42)"}
              strokeWidth="1.3"
              style={{ transition: "fill 600ms ease, stroke 600ms ease" }}
            />
            {/* filament */}
            <path
              d="M31 62c0-8 2.5-9 3.5-14 .6-3-.5-5.5-.5-5.5M45 62c0-8-2.5-9-3.5-14-.6-3 .5-5.5.5-5.5M34 42.5c1.4 3 2.6 4.6 4 4.6s2.6-1.6 4-4.6"
              stroke={on ? "rgba(255,226,168,0.95)" : "rgba(232,226,214,0.38)"}
              strokeWidth="1.4"
              strokeLinecap="round"
              style={{ transition: "stroke 600ms ease" }}
            />
            {/* the glow sitting inside the glass */}
            {on && (
              <circle cx="38" cy="50" r="15" fill="rgba(255,190,110,0.28)" />
            )}
            {/* A short arm off the socket ending in a lug. The chain hangs from
                the lug, which puts it clear of the glass (widest at x=60) instead
                of cutting across the bulb, and still reads as part of the
                fixture rather than floating beside it. */}
            <path
              d="M46 19 L62.5 28.5"
              stroke="rgba(196,190,180,0.7)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="64" cy="29.5" r="2.3" fill="rgba(196,190,180,0.8)" />
          </svg>

          {/* pull chain — the thing you actually take hold of */}
          <motion.button
            type="button"
            onClick={onClick}
            onPan={onPan}
            onPanEnd={onPanEnd}
            aria-label={on ? "Turn the light off" : "Turn the light on"}
            aria-pressed={on}
            // Hangs from the socket lug at (64, 29.5) in the svg's viewBox. The
            // svg is a fixed 76px wide, and p-3 adds 12px, hence these offsets.
            // touch-none so dragging the chain on a phone pulls the chain
            // instead of scrolling the room out from under it.
            className="pointer-events-auto group absolute left-[52px] top-[calc(clamp(56px,12vh,130px)+18px)] flex cursor-grab touch-none select-none flex-col items-center p-3 active:cursor-grabbing"
          >
            <span className="flex flex-col items-center">
              <motion.span
                className="block w-px"
                style={{
                  height: chain,
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0.50), rgba(255,255,255,0.26))",
                }}
              />
              <motion.span
                className="relative block h-[7px] w-[7px] rounded-full"
                style={{ background: "rgba(226,220,208,0.75)" }}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
                {/* a breathing hint, only while the room is dark */}
                {!on && (
                  <motion.span
                    className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: "rgba(242,181,68,0.5)" }}
                    animate={{ opacity: [0, 0.55, 0], scale: [0.6, 1.9, 0.6] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.span>
            </span>
          </motion.button>

          {/* The light it throws down over the menu.
              Note the split: the OUTER div owns the centring transform and the
              INNER one owns the animation. Framer Motion writes an inline
              transform, which would otherwise overwrite Tailwind's
              -translate-x-1/2 and shove the cone off to one side. */}
          <div
            className="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2"
            style={{
              top: "calc(clamp(56px, 12vh, 130px) + 74px)",
              // capped at the viewport: any wider and the cone just spills off
              // both edges, costing layout width and a blur pass for pixels
              // nobody can see
              width: "min(100vw, 1100px)",
              height: "min(95vh, 780px)",
            }}
          >
            <motion.div
              className="h-full w-full"
              style={{
                clipPath: "polygon(47.6% 0%, 52.4% 0%, 100% 100%, 0% 100%)",
                background:
                  "linear-gradient(to bottom, rgba(255,196,120,0.22) 0%, rgba(255,176,96,0.10) 34%, rgba(255,160,80,0.035) 62%, rgba(255,150,70,0) 88%)",
                // generous blur — a crisp-edged wedge reads as a painted triangle
                // rather than as light falling through air
                filter: "blur(16px)",
                transformOrigin: "50% 0%",
              }}
              initial={false}
              animate={{ opacity: on ? 1 : 0 }}
              transition={{ duration: on ? 0.75 : 0.45, ease: "easeOut" }}
            />
          </div>

          {/* a warm pool where the light lands */}
          <div
            className="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2"
            style={{
              top: "calc(clamp(56px, 12vh, 130px) + 430px)",
              width: "min(100vw, 900px)",
              height: "340px",
            }}
          >
            <motion.div
              className="h-full w-full rounded-[50%]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,170,90,0.16), rgba(255,150,70,0.05) 45%, transparent 72%)",
                filter: "blur(18px)",
              }}
              initial={false}
              animate={{ opacity: on ? 1 : 0 }}
              transition={{ duration: on ? 0.9 : 0.4, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
