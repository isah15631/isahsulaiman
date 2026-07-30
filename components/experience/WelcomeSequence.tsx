"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Carrier from "./Carrier";

// The whispered introduction. One line at a time, slow and elegant.
// The first line is carried into view by two butterflies, who then let go.
const LINES = [
  { text: "hello.", hold: 5150 },
  { text: "i'm Isah Sulaiman.", hold: 3200 },
  { text: "i build cool things.", hold: 3600 },
];

// It is carried up from off the bottom of the frame, not from a little way
// down. It used to start 104px below centre, which on any real screen is
// nowhere near the bottom: the word simply appeared in the lower middle of an
// empty page and rose a short way, so there was nothing to suggest it had been
// brought from anywhere.
//
// vh, not pixels, because the distance has to be the height of the screen it
// is actually on. The word is centred, so 52vh puts it just past the bottom
// edge and the butterflies come up into frame carrying it.
const FROM = "52vh";
const LIFT_DELAY = 0.35;
// Longer than it was, because it is now travelling most of a screen rather
// than a hundred pixels.
const LIFT_SECONDS = 3.4;
// The carriers hold on a moment after the word settles, then leave.
const RELEASE_AT = LIFT_DELAY + LIFT_SECONDS + 0.4;

// Has to stay inside the first line's hold, or the word changes while they are
// still drifting away from it — so this number and the hold above move
// together. Kept short: once they have let go the moment is over, and the two
// seconds they used to spend drifting off were two seconds of nothing
// happening with the whole introduction waiting behind them. They leave
// quickly now, which also reads better — a decision rather than a fade.
const TOTAL = RELEASE_AT + 0.8;

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
            // The first line is carried up from off the bottom of the frame;
            // the rest simply breathe in.
            initial={isFirst ? { opacity: 0, y: FROM } : { opacity: 0, y: 6 }}
            animate={
              isFirst
                ? // a slight sway, as if the word has weight
                  {
                    opacity: 1,
                    y: [FROM, "31vh", "14vh", "4vh", "0vh"],
                    x: [0, -5, 4, -1, 0],
                  }
                : { opacity: 1, y: 0 }
            }
            // The exit carries its OWN transition. Without one it inherits the
            // block below, and for the first line that is the lift: 3.4s plus
            // a 0.35s delay. So "hello." spent nearly four seconds fading out
            // — with AnimatePresence in "wait" mode holding the entire rest of
            // the introduction behind it — and the whole sequence stalled
            // right after the butterflies let go of it.
            exit={{
              opacity: 0,
              y: -6,
              transition: { duration: 0.45, ease: "easeInOut" },
            }}
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
                  liftDelay={LIFT_DELAY}
                  releaseAt={RELEASE_AT}
                  total={TOTAL}
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
                  liftDelay={LIFT_DELAY}
                  releaseAt={RELEASE_AT}
                  total={TOTAL}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
