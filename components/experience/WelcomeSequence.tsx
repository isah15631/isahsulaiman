"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Butterfly from "./Butterfly";

// The whispered introduction. One line at a time, slow and elegant.
// The first line is carried into view by two butterflies, who then let go.
const LINES = [
  { text: "hello.", hold: 5800 },
  { text: "welcome.", hold: 2200 },
  { text: "i'm Isah Sulaiman.", hold: 3200 },
  { text: "i build beautiful things.", hold: 3600 },
];

const LIFT_DELAY = 0.35;
const LIFT_SECONDS = 2.8;
// The carriers hold on a moment after the word settles, then leave.
const RELEASE_AT = LIFT_DELAY + LIFT_SECONDS + 0.55;

const TOTAL = RELEASE_AT + 1.9;

/**
 * One of the two butterflies carrying the word, and the thread it holds it by.
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
 */
function Carrier({
  color,
  size,
  flap,
  away,
  tilt,
  threadEm,
  side,
  insetEm,
}: {
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
}) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      // 0.26em down from the top of the line box lands on the letterforms
      // themselves rather than in the ascender space above them.
      style={{ top: "0.26em", [side]: `${insetEm}em` }}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{
        // fade in with the lift, hold while carrying, then drift away
        opacity: [0, 1, 1, 1, 0],
        x: [0, 0, 0, away.x * 0.35, away.x],
        y: [0, 0, 0, away.y * 0.35, away.y],
      }}
      transition={{
        duration: TOTAL,
        ease: "easeInOut",
        times: [
          0,
          LIFT_DELAY / TOTAL,
          RELEASE_AT / TOTAL,
          (RELEASE_AT + 0.9) / TOTAL,
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
        <motion.span
          className="block w-px"
          style={{
            height: `${threadEm}em`,
            background:
              "linear-gradient(to bottom, rgba(245,242,236,0.20), rgba(245,242,236,0.70))",
          }}
          initial={{ opacity: 0 }}
          // gone by the moment of release, so it is never seen detaching
          animate={{ opacity: [0, 0.95, 0.95, 0] }}
          transition={{
            duration: TOTAL,
            ease: "easeInOut",
            times: [
              0,
              LIFT_DELAY / TOTAL,
              (RELEASE_AT - 0.2) / TOTAL,
              RELEASE_AT / TOTAL,
            ],
          }}
        />
      </div>
    </motion.div>
  );
}

export default function WelcomeSequence({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= LINES.length) {
      const t = window.setTimeout(onDone, 400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), LINES[index].hold);
    return () => window.clearTimeout(t);
  }, [index, onDone]);

  const current = LINES[index];
  const isFirst = index === 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={index}
            // The text size lives here, not only on the span, so the carriers'
            // em-based offsets resolve against the word rather than the 16px
            // root and stay glued to it at every breakpoint.
            className="relative font-serif text-[7.5vw] leading-tight sm:text-4xl md:text-6xl"
            // The first line is dragged upward into place; the rest simply breathe in.
            initial={isFirst ? { opacity: 0, y: 104 } : { opacity: 0, y: 6 }}
            animate={
              isFirst
                ? // a slight sway, as if the word has weight
                  { opacity: 1, y: [104, 68, 36, 13, 0], x: [0, -4, 3, -1, 0] }
                : { opacity: 1, y: 0 }
            }
            exit={{ opacity: 0, y: -6 }}
            transition={
              isFirst
                ? { duration: LIFT_SECONDS, delay: LIFT_DELAY, ease: "easeOut" }
                : { duration: 1.3, ease: "easeInOut" }
            }
          >
            <span className="block whitespace-nowrap text-center font-light tracking-wide text-neutral-100">
              {current.text}
            </span>

            {/* Two butterflies carry "hello." up, then quietly let go —
                the transformation is over, but beauty remains. */}
            {isFirst && (
              <>
                {/* gripping the h, and the o near the end */}
                <Carrier
                  side="left"
                  insetEm={0.42}
                  color="#f2b544"
                  size={22}
                  flap={0.26}
                  tilt={-13}
                  threadEm={0.8}
                  away={{ x: -150, y: -110 }}
                />
                <Carrier
                  side="right"
                  insetEm={0.62}
                  color="#f7f3ea"
                  size={20}
                  flap={0.31}
                  tilt={13}
                  threadEm={1.0}
                  away={{ x: 160, y: -128 }}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
