"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import type { Hobby } from "@/lib/content";
import HobbyObject from "./HobbyObject";

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
// writing still never stretches, because nothing is ever scaled. It also removes
// a drift nobody asked for, since the group used to slide upward as it grew.

/** Aged paper. Warm, because the only light in this room is a tungsten bulb. */
const PARCHMENT =
  "linear-gradient(158deg, #f0e6d1 0%, #e6d7b8 46%, #dcc9a5 78%, #d2bd96 100%)";

/** Turned wood, lit from above like everything else here. */
const ROD =
  "linear-gradient(to bottom, #8a7048 0%, #5f4a2e 38%, #3a2c1b 78%, #241b11 100%)";

function Rod({ width }: { width: string }) {
  return (
    <div
      className="relative z-10 flex shrink-0 items-center justify-center"
      style={{ width }}
    >
      <div
        className="h-[9px] w-full rounded-full"
        style={{ background: ROD, boxShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
      />
      {/* the knobs on the ends, which is most of what says "rod" and not "bar" */}
      <span
        className="absolute left-0 h-[15px] w-[15px] -translate-x-1/2 rounded-full"
        style={{ background: ROD }}
      />
      <span
        className="absolute right-0 h-[15px] w-[15px] translate-x-1/2 rounded-full"
        style={{ background: ROD }}
      />
    </div>
  );
}

const UNROLL = { duration: 0.72, ease: [0.32, 0.72, 0.24, 1] as const };
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
  // Escape closes it. The backdrop is clickable for the same purpose, but a
  // scroll that fills most of a phone leaves little backdrop to hit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // Above the sections pane, which is z-50. This is portalled onto the body
    // rather than left inside that pane, so it no longer inherits its stacking
    // and has to out-rank it on its own.
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
      <motion.button
        type="button"
        aria-label="Close"
        onClick={onClose}
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
        {/* The object itself, arriving from its place in the grid. Parked, so
            it stops bobbing once it has landed on the scroll. */}
        <motion.div
          layoutId={`hobby-${hobby.key}`}
          className="relative z-20 -mb-1"
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0.24, 1] }}
        >
          {/* Bigger than it looks in the grid, and wider than it is tall now
              that it has a wingspan: at the size the old square box wanted,
              this landed as a smudge on top of the rod. */}
          <HobbyObject hobby={hobby.key} color={color} size={132} phase={phase} still />
        </motion.div>

        <Rod width="calc(100% + 26px)" />

        <motion.div
          className="w-full overflow-hidden"
          // Revealed top down. `inset(0 0 100% 0)` hides all of it and 0% shows
          // all of it, and in between the paper appears out from under the rod.
          initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
          animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
          exit={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
          transition={UNROLL}
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
            <motion.div
              className="no-scrollbar relative max-h-[56vh] overflow-y-auto px-7 py-9 sm:px-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={INK}
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

        <Rod width="calc(100% + 26px)" />

        <motion.button
          type="button"
          onClick={onClose}
          className="mt-6 font-sans text-xs tracking-[0.2em] text-neutral-500 transition-colors hover:text-ember"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={INK}
        >
          roll it up
        </motion.button>
      </div>
    </div>
  );
}
