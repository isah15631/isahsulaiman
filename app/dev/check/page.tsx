"use client";

// Temporary: the shelf and one scroll, so the flight and the unroll can be
// watched in order without playing the whole piece to reach them.
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { HOBBIES } from "@/lib/content";
import { SWARM } from "@/lib/palette";
import HobbyRoll from "@/components/experience/HobbyRoll";
import HobbyScroll from "@/components/experience/HobbyScroll";

export default function DevCheck() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="relative min-h-[100dvh] bg-[#070504] p-8 pt-[46vh]">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
        {HOBBIES.map((h, i) => (
          <li key={h.key} className="flex justify-center">
            <button
              id={`open-${i}`}
              onClick={() => setOpen(i)}
              className="group flex flex-col items-center"
              aria-label={`Open ${h.title}`}
            >
              {open !== i && (
                <motion.span
                  layoutId={`hobby-${h.key}`}
                  className="block"
                  transition={{ duration: 0.34, ease: [0.4, 0, 0.2, 1] }}
                >
                  <HobbyRoll color={SWARM[i % SWARM.length]} size={150} phase={i} />
                </motion.span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {open !== null && (
          <HobbyScroll
            key={HOBBIES[open].key}
            hobby={HOBBIES[open]}
            color={SWARM[open % SWARM.length]}
            phase={open}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
