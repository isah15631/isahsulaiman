"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

// What is behind the room when the light goes out.
//
// The piece opens in space, and this is the argument that you never actually left
// it: pull the chain and the walls stop mattering and the sky it fell out of is
// still there. It only exists in the dark, which is the whole point — turn the
// lamp back on and there is a room again.
//
// This is ONE element, and that is the whole design.
//
// It was three layers, each with its own drift and its own opacity beat, wrapped
// in a parent whose opacity was animated by the toggle. Every part of that is a
// cost. A parent animating opacity over several children cannot simply fade a
// layer: it has to render the whole subtree into an offscreen buffer and blend it
// on every frame, full screen. The children each had their OWN opacity animation
// inside that, so the group could never be flattened. All three were marked
// will-change, so all three were promoted to full-screen textures — on a phone at
// three times pixel density that is real memory and real upload time. And each
// one carried dozens of radial gradients to rasterise. Pulling the chain kicked
// all of it off at once, on top of everything else the lamp already animates, and
// it dropped frames badly enough to be the first thing you noticed.
//
// So: one node, one background image, one composited layer. The stars and the
// wash of galaxy behind them are gradients in the same list, and the only thing
// the toggle animates is the opacity of that one element, which is the cheapest
// animation there is.
//
// It does not move at all, either. There was a drift on it, and at the speed a
// sky is allowed to move without being noticed it worked out at a tenth of a
// pixel a second: a compositor layer animating forever, in exchange for nothing
// anyone could see. Stars do not move. This one does not either.
//
// What is lost is per-layer parallax and per-star twinkle. Neither survives being
// looked at anyway: at this brightness a still field is a sky, and a sky that
// stutters when you touch the light is not.

/** Deterministic, so it is the same sky every time and on both renders. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const STARS = 54;
/** Big enough that the repeat never announces itself at this brightness. */
const TILE = 940;

function sky() {
  const rand = rng(9137);
  const out: string[] = [];
  for (let i = 0; i < STARS; i++) {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * 100).toFixed(2);
    const r = (0.75 + rand() * 1.9).toFixed(2);
    const a = (0.34 + rand() * 0.56).toFixed(2);
    const w = rand();
    // Mostly white, some cold, a few warm. Nothing saturated: it is a sky.
    const tint =
      w > 0.86
        ? `rgba(198,214,255,${a})`
        : w > 0.7
          ? `rgba(255,228,198,${a})`
          : `rgba(255,255,255,${a})`;
    // Two stops. A star is a point of light and everything past the second one
    // is wasted rasterising.
    out.push(
      `radial-gradient(${r}px ${r}px at ${x}% ${y}%, ${tint} 0%, rgba(255,255,255,0) 62%)`
    );
  }
  return out;
}

/** The faintest wash of a galaxy, so the field does not read as even scatter. */
const GALAXY =
  "radial-gradient(120% 42% at 62% 38%, rgba(96,116,178,0.10), rgba(58,72,120,0.05) 45%, rgba(0,0,0,0) 74%)";

export default function NightSky({ lit }: { lit: boolean }) {
  // The stars tile; the galaxy does not, so it is listed first at its own size
  // and the star tile repeats underneath it.
  const image = useMemo(() => [GALAXY, ...sky()].join(", "), []);
  const size = useMemo(
    () => ["100% 100%", ...Array(STARS).fill(`${TILE}px ${TILE}px`)].join(", "),
    []
  );
  // One value per layer. Two values would cycle across fifty-five of them and
  // half the stars would quietly stop tiling.
  const repeat = useMemo(
    () => ["no-repeat", ...Array(STARS).fill("repeat")].join(", "),
    []
  );

  // Once it has faded out it stops existing as far as the compositor is
  // concerned. An opacity of zero is still a layer to blend on every frame, and
  // the lamp is on for most of the time anyone spends in here.
  const [hidden, setHidden] = useState(lit);
  useEffect(() => {
    if (!lit) setHidden(false);
  }, [lit]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      initial={false}
      style={{
        visibility: hidden ? "hidden" : "visible",
        backgroundImage: image,
        backgroundSize: size,
        backgroundRepeat: repeat,
      }}
      // Slower coming up than going down. Switching a lamp off in a dark room
      // does not reveal a sky instantly; your eyes take a moment, and the sky
      // arriving over a second and a half is that moment.
      animate={{ opacity: lit ? 0 : 1 }}
      transition={{ duration: lit ? 0.5 : 1.5, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (lit) setHidden(true);
      }}
    />
  );
}
