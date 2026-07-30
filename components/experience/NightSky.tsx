"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

// What is behind the room when the light goes out.
//
// The piece opens in space, and this is the argument that you never actually left
// it: pull the chain and the walls stop mattering and the sky it fell out of is
// still there. It only exists in the dark, which is the whole point — turn the
// lamp back on and there is a room again.
//
// Three layers of stars, drawn as tiled background gradients rather than as
// elements. A hundred and twenty stars is a hundred and twenty things for the
// browser to lay out, paint and composite, and if each one twinkles on its own
// timer it is a hundred and twenty animations behind live text. As tiles it is
// three layers, each one image the browser rasterises once and repeats, and the
// only things moving are transform and opacity on those three — which the
// compositor does on its own and the main thread never hears about.
//
// The twinkle is per LAYER rather than per star: three fields breathing at
// different rates and drifting at different speeds read as a sky moving, because
// the eye cannot track which star is doing what. It is a cheat and it is
// indistinguishable at this brightness.

/** Deterministic, so the sky is the same sky every time and on both renders. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * One field, as a list of radial gradients on a repeating tile.
 *
 * The tile is big and the three of them are different sizes, so nothing lines up
 * and the repeat never announces itself at this scale.
 */
function field(seed: number, count: number, maxR: number, brightest: number) {
  const rand = rng(seed);
  const stars: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * 100).toFixed(2);
    const r = (0.75 + rand() * maxR).toFixed(2);
    const a = (0.34 + rand() * brightest).toFixed(2);
    // A hard-edged dot with one soft step out of it. Two stops, because a star
    // is a point of light and everything past the second stop is wasted pixels.
    const tint =
      rand() > 0.82
        ? `rgba(198,214,255,${a})`
        : rand() > 0.7
          ? `rgba(255,228,198,${a})`
          : `rgba(255,255,255,${a})`;
    stars.push(
      `radial-gradient(${r}px ${r}px at ${x}% ${y}%, ${tint} 0%, rgba(255,255,255,0) 62%)`
    );
  }
  return stars.join(", ");
}

const LAYERS = [
  { seed: 9137, count: 46, r: 1.0, bright: 0.5, tile: 620, drift: 190, beat: 7.5 },
  { seed: 5521, count: 34, r: 1.5, bright: 0.62, tile: 810, drift: 260, beat: 11 },
  { seed: 3313, count: 18, r: 2.1, bright: 0.72, tile: 1030, drift: 340, beat: 16 },
];

export default function NightSky({ lit }: { lit: boolean }) {
  const layers = useMemo(
    () =>
      LAYERS.map((l) => ({
        ...l,
        image: field(l.seed, l.count, l.r, l.bright),
      })),
    []
  );

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
      initial={false}
      // Slower coming up than going down. Switching a lamp off in a dark room
      // does not reveal a sky instantly; your eyes take a moment, and the sky
      // arriving over a second and a half is that moment.
      animate={{ opacity: lit ? 0 : 1 }}
      transition={{ duration: lit ? 0.5 : 1.5, ease: "easeOut" }}
    >
      {layers.map((l) => (
        <div
          key={l.seed}
          className="absolute"
          style={{
            // Taller than the frame and offset, so a layer can drift for a long
            // time without ever running out of sky.
            inset: `-${l.drift}px 0px`,
            backgroundImage: l.image,
            backgroundSize: `${l.tile}px ${l.tile}px`,
            backgroundRepeat: "repeat",
            animation: `nightsky-drift ${l.drift * 1.6}s linear infinite, nightsky-beat ${l.beat}s ease-in-out infinite`,
            willChange: "transform, opacity",
          }}
        />
      ))}

      {/* The faintest wash of the galaxy across the middle of it. One gradient,
          and it is what stops the field reading as evenly-scattered noise. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 42% at 62% 38%, rgba(96,116,178,0.10), rgba(58,72,120,0.05) 45%, transparent 74%)",
        }}
      />
    </motion.div>
  );
}
