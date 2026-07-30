"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { SWARM } from "@/lib/palette";
import Butterfly from "./Butterfly";

// One of them comes down with you.
//
// Opening a section is a drop: the menu leaves through the top of the frame and
// the section rushes up from underneath. Nothing in the room ever registered
// that it happened, so the fall was a transition rather than an event. This is
// what registers it. One leaves the swarm as you go, descends the way you did,
// and arrives a beat after you, because it has wings and you were only falling.
//
// Then it climbs back out while you read, and that is not an afterthought. A
// butterfly that stayed would be parked in the corner of a page, which is a
// mascot. This one came down to see where you went and then went back up.
//
// Nothing here is measured from the window. The path is written in vh and vw, so
// it keeps its shape on any viewport without reading a single dimension, and the
// room's own overflow-hidden crops it off frame at both ends, which is why it
// needs no fade in or out.

/** Seconds: the way down, the long hover, the climb out. */
const DOWN = 1.9;
const HOVER = 6.4;
const UP = 4.8;
const TOTAL = DOWN + HOVER + UP;

/** Wings work on the way down and idle once it is with you. */
const FLAP_FLYING = 0.4;
const FLAP_HOVERING = 0.95;

export default function Companion({ lit }: { lit: boolean }) {
  const reduced = useReducedMotion();

  // Whichever one of them happened to come. Rolled once, in a state
  // initialiser: re-rolling on a re-render would change its colour mid-flight,
  // and the light toggling is a re-render.
  const [look] = useState(() => ({
    color: SWARM[Math.floor(Math.random() * SWARM.length)],
    size: 17 + Math.random() * 5,
    /** Which side of the reading it takes, so two visits are not one visit. */
    side: Math.random() > 0.5 ? 1 : -1,
  }));

  // The wings slow when it stops travelling. Swapping flapDuration restarts the
  // CSS animation, which is invisible here precisely because it happens on the
  // beat the descent ends.
  const [landed, setLanded] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setLanded(true), DOWN * 1000);
    return () => window.clearTimeout(t);
  }, [reduced]);

  // An ambient companion is exactly the kind of motion someone turns off.
  if (reduced) return null;

  const lane = look.side > 0 ? 72 : 20; // vw
  const drift = 5 * look.side;

  // Never a straight line down. It sinks, catches itself, sinks again, hangs
  // there while you read, and then lifts away on the side it came down.
  const x = [
    `${lane - drift}vw`,
    `${lane + drift}vw`,
    `${lane}vw`,
    `${lane + drift * 0.4}vw`,
    `${lane + drift * 2.2}vw`,
  ];
  const y = ["-14vh", "13vh", "28vh", "33vh", "-18vh"];
  const rotate = [12, -7, 4, 0, -14].map((d) => d * look.side);
  const times = [0, (DOWN * 0.55) / TOTAL, DOWN / TOTAL, (DOWN + HOVER) / TOTAL, 1];

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden
      initial={false}
      // The lamp reveals it, exactly as it reveals the swarm it came out of.
      // Brighter than the swarm because this one is in the room with you rather
      // than crossing the far end of it.
      animate={{ opacity: lit ? 0.62 : 0.14 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      <motion.div
        className="absolute left-0 top-0"
        initial={{ x: x[0], y: y[0], rotate: rotate[0] }}
        animate={{ x, y, rotate }}
        transition={{
          duration: TOTAL,
          times,
          // falling in, settling, hanging, then gathering itself to leave
          ease: ["linear", "easeOut", "easeInOut", "easeIn"],
        }}
        onAnimationComplete={() => setGone(true)}
      >
        {/* Once it is off frame the butterfly goes, because its wings are a CSS
            animation that would otherwise keep beating behind the crop for as
            long as you read.

            The wrapper stays. This whole thing is inside an AnimatePresence, and
            a presence child that renders null has no node left to fade out, so
            the exit can never finish: framer keeps waiting for a component that
            is not there any more. Dropping the drawing and keeping the element
            is the difference between a butterfly that left and a room whose
            animations have quietly stopped working. */}
        {!gone && (
          <Butterfly
            color={look.color}
            size={look.size}
            flapDuration={landed ? FLAP_HOVERING : FLAP_FLYING}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
