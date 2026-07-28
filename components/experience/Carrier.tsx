"use client";

import { motion } from "framer-motion";
import Butterfly from "./Butterfly";

/**
 * One of the two butterflies carrying a word, and the thread it holds it by.
 *
 * The thread is anchored by its BOTTOM, at a point just inside the letterforms,
 * and the butterfly hangs above it. Anchoring the other way round (hanging a
 * fixed-length thread down off the butterfly) left the loose end wherever the
 * arithmetic happened to put it, which drifted with every breakpoint, and the
 * lean rotated it further off the word. Rotating about the bottom instead means
 * the point of contact cannot move: the string is tied to the word and the
 * butterfly swings from it.
 *
 * Offsets are in `em` so they track the word at every text size.
 *
 * Lives in its own file because two things are carried in this piece: the first
 * word of the introduction, and the address at the end of it. They should be
 * carried identically, by the same butterflies on the same threads, so the last
 * thing you see rhymes with the first.
 */

/** The welcome's own timing, in seconds, and the default for anything else. */
const LIFT_DELAY = 0.35;
const RELEASE_AT = 4.3;
const TOTAL = 6.2;

type Props = {
  color: string;
  size: number;
  flap: number;
  away: { x: number; y: number };
  /** degrees the butterfly leans away from its anchor */
  tilt: number;
  /** thread length, in em of the word */
  threadEm: number;
  side: "left" | "right";
  /** how far in from that edge the thread grips the word, in em */
  insetEm: number;
  /**
   * How far down into the line box the thread ties on, in em.
   *
   * This used to be 0.26, which was an estimate of where the letterforms
   * start. Where they actually start depends on the font's own ascent and
   * half-leading, so the tip was ending in the empty space above the word and
   * the thread read as hovering near it rather than holding it. Deeper, so it
   * lands ON a glyph whatever the metrics turn out to be.
   */
  gripEm?: number;
  /** seconds: when it takes hold, when it lets go, and the whole span */
  liftDelay?: number;
  releaseAt?: number;
  total?: number;
};

export default function Carrier({
  color,
  size,
  flap,
  away,
  tilt,
  threadEm,
  side,
  insetEm,
  gripEm = 0.42,
  liftDelay = LIFT_DELAY,
  releaseAt = RELEASE_AT,
  total = TOTAL,
}: Props) {
  // Held together so the knot cannot drift from the thread's tip: both are
  // placed from this one number.
  const knot = { opacity: [0, 0.95, 0.95, 0] };

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ top: `${gripEm}em`, [side]: `${insetEm}em` }}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{
        // fade in with the lift, hold while carrying, then drift away
        opacity: [0, 1, 1, 1, 0],
        x: [0, 0, 0, away.x * 0.35, away.x],
        y: [0, 0, 0, away.y * 0.35, away.y],
      }}
      transition={{
        duration: total,
        ease: "easeInOut",
        times: [
          0,
          liftDelay / total,
          releaseAt / total,
          (releaseAt + 0.9) / total,
          1,
        ],
      }}
    >
      {/* Grows upward from the anchor. Plain CSS transform, not a motion prop:
          Framer writes its own inline transform and would wipe out a Tailwind
          translate class on the same element. */}
      <div
        className="absolute bottom-0 left-0 flex flex-col items-center"
        style={{
          transform: `translateX(-50%) rotate(${tilt}deg)`,
          transformOrigin: "50% 100%",
        }}
      >
        <Butterfly color={color} size={size} flapDuration={flap} />
        {/* The tail of the thread runs on past the anchor and into the word.
            Overlapping the glyph is the only way to be certain it touches it,
            since where a letter actually begins is the font's business and not
            something this can know. */}
        <motion.span
          className="block w-px"
          style={{
            height: `${threadEm}em`,
            marginBottom: "-0.16em",
            background:
              "linear-gradient(to bottom, rgba(245,242,236,0.20), rgba(245,242,236,0.85))",
          }}
          initial={{ opacity: 0 }}
          // gone by the moment of release, so it is never seen detaching
          animate={knot}
          transition={{
            duration: total,
            ease: "easeInOut",
            times: [
              0,
              liftDelay / total,
              (releaseAt - 0.2) / total,
              releaseAt / total,
            ],
          }}
        />
        {/* And it is tied off. A thread that simply stops reads as a line that
            happens to end near a word; a knot reads as a thread attached to
            one. It sits on the rotation origin, so leaning the butterfly can
            never drag the point of contact off the letter. */}
        <motion.span
          className="absolute bottom-0 left-1/2 block rounded-full"
          style={{
            width: "0.1em",
            height: "0.1em",
            transform: "translate(-50%, 50%)",
            background: "rgba(245,242,236,0.92)",
            boxShadow: "0 0 0.14em rgba(245,242,236,0.55)",
          }}
          initial={{ opacity: 0 }}
          animate={knot}
          transition={{
            duration: total,
            ease: "easeInOut",
            times: [
              0,
              liftDelay / total,
              (releaseAt - 0.2) / total,
              releaseAt / total,
            ],
          }}
        />
      </div>
    </motion.div>
  );
}
