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

/** One of the two butterflies carrying the word up, and its flight away. */
function Carrier({
  color,
  size,
  flap,
  away,
  className,
}: {
  color: string;
  size: number;
  flap: number;
  away: { x: number; y: number };
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
        duration: RELEASE_AT + 1.9,
        ease: "easeInOut",
        times: [0, LIFT_DELAY / (RELEASE_AT + 1.9), RELEASE_AT / (RELEASE_AT + 1.9), (RELEASE_AT + 0.9) / (RELEASE_AT + 1.9), 1],
      }}
    >
      <Butterfly color={color} size={size} flapDuration={flap} />
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
                  className="-top-6 left-1 md:-top-8"
                  color="#f2b544"
                  size={22}
                  flap={0.26}
                  away={{ x: -150, y: -110 }}
                />
                <Carrier
                  className="-top-7 right-1 md:-top-9"
                  color="#f7f3ea"
                  size={20}
                  flap={0.31}
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
