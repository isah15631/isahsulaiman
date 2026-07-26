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
 * One of the two butterflies carrying the word up, with the thread it holds it
 * by. The thread hangs from the butterfly down to the top of the word; when the
 * butterfly lets go it goes slack and fades, and only the butterfly flies on.
 */
function Carrier({
  color,
  size,
  flap,
  away,
  tilt,
  threadLength,
  className,
}: {
  color: string;
  size: number;
  flap: number;
  away: { x: number; y: number };
  /** degrees — leans the thread in toward the word */
  tilt: number;
  threadLength: number;
  className: string;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
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
      <Butterfly color={color} size={size} flapDuration={flap} />

      {/* the thread it carries the word by — taut while lifting, gone once released */}
      <motion.span
        className="absolute left-1/2 top-full block w-px origin-top"
        style={{
          height: threadLength,
          background:
            "linear-gradient(to bottom, rgba(245,242,236,0.55), rgba(245,242,236,0.12))",
        }}
        initial={{ opacity: 0, rotate: tilt, scaleY: 0.7 }}
        animate={{ opacity: [0, 0.9, 0.9, 0], scaleY: [0.7, 1, 1, 1] }}
        transition={{
          duration: TOTAL,
          ease: "easeInOut",
          times: [0, LIFT_DELAY / TOTAL, RELEASE_AT / TOTAL, (RELEASE_AT + 0.5) / TOTAL],
        }}
      />
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
            className="relative"
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
            <span className="block whitespace-nowrap text-center font-serif text-[7.5vw] font-light leading-tight tracking-wide text-neutral-100 sm:text-4xl md:text-6xl">
              {current.text}
            </span>

            {/* Two butterflies carry "hello." up, then quietly let go —
                the transformation is over, but beauty remains. */}
            {isFirst && (
              <>
                <Carrier
                  className="-top-12 left-2 md:-top-16"
                  color="#f2b544"
                  size={22}
                  flap={0.26}
                  tilt={14}
                  threadLength={30}
                  away={{ x: -150, y: -110 }}
                />
                <Carrier
                  className="-top-14 right-2 md:-top-[4.5rem]"
                  color="#f7f3ea"
                  size={20}
                  flap={0.31}
                  tilt={-14}
                  threadLength={36}
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
