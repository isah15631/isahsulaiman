"use client";

import { motion } from "framer-motion";
import { playClick } from "@/lib/audio";

// A bulb on a cord with a pull-chain. Pull it and light falls over the menu;
// pull it again and the menu goes back into the dark.
//
// Kept deliberately analog: a drawn filament, a cord that sways a little when
// you tug it, and a soft cone of light. No switches, no chrome, no glow that
// looks like a dashboard.

type Props = {
  on: boolean;
  onToggle: () => void;
};

export default function LightBulb({ on, onToggle }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
      {/* the whole fixture sways gently when tugged */}
      <motion.div
        className="relative flex flex-col items-center"
        style={{ transformOrigin: "50% 0%" }}
        animate={{ rotate: on ? [0, 1.6, -1.1, 0.5, 0] : [0, -1.4, 0.9, -0.4, 0] }}
        transition={{ duration: 2.4, ease: "easeOut" }}
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

        {/* pull chain — the thing you actually click */}
        <button
          type="button"
          onClick={() => {
            playClick();
            onToggle();
          }}
          aria-label={on ? "Turn the light off" : "Turn the light on"}
          aria-pressed={on}
          // Hangs from the socket lug at (64, 29.5) in the svg's viewBox. The
          // svg is a fixed 76px wide, and p-3 adds 12px, hence these offsets.
          className="pointer-events-auto group absolute left-[52px] top-[calc(clamp(56px,12vh,130px)+18px)] flex cursor-pointer flex-col items-center p-3"
        >
          <span className="flex flex-col items-center">
            <motion.span
              className="block w-px"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.50), rgba(255,255,255,0.26))",
              }}
              animate={{ height: 40 }}
              whileHover={{ height: 46 }}
              whileTap={{ height: 56 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
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
        </button>

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
    </div>
  );
}
