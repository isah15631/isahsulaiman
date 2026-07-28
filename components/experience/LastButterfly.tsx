"use client";

import { motion } from "framer-motion";
import { SWARM } from "@/lib/palette";
import Butterfly from "./Butterfly";

// The three seconds of dark after the swarm has gone are not empty. One of
// them is still leaving.
//
// It rises rather than crosses, because rising is what the eruption did, and a
// straggler on the same path reads as the tail of that rather than as a new
// event starting. It is the only thing on screen, so it can be slow.
//
// Bone white on purpose: moments later a bone white butterfly comes back
// carrying "hello.", and it should be possible to believe it is the same one
// that thought better of leaving.

export default function LastButterfly() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30" aria-hidden>
      <motion.div
        className="absolute left-1/2 top-[62%]"
        initial={{ x: -46, y: "0vh", opacity: 0, rotate: -9 }}
        animate={{
          // wanders across as it climbs; a straight ascent reads as a balloon
          x: [-46, -8, 26, 6],
          y: ["0vh", "-16vh", "-34vh", "-52vh"],
          rotate: [-9, 7, -6, 4],
          opacity: [0, 0.85, 0.7, 0],
        }}
        // Just inside the silence, which is 3s. Finishing early leaves the dark
        // to settle; finishing late would have it cut off mid-air when the
        // welcome mounts over the top of it.
        transition={{ duration: 2.8, ease: "easeOut", times: [0, 0.3, 0.68, 1] }}
      >
        <Butterfly color={SWARM[4]} size={20} flapDuration={0.42} />
      </motion.div>
    </div>
  );
}
