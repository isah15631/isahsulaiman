"use client";

import { motion } from "framer-motion";
import type { Ref } from "react";

// The door you came in by, still there.
//
// The room had no exit and, worse, no trace of how you got into it: you pushed a
// door in the dark and then the door stopped existing. This is that door from the
// inside, standing above the menu because above is where you came from. The
// sections are below, so the world already runs on one vertical axis and this is
// simply the top of it.
//
// It is not a button and there is nothing to click. A way out is what the tab
// close is for, and a second piece of navigation on a site with four words of it
// is the flashy thing the brief keeps saying no to. It is here so the room has a
// direction, which is something a room has and a page does not.
//
// Ajar, with black through the gap. Shut, it is a rectangle on a dark wall; open
// on the void the whole piece began in, it says there is an outside and you have
// been in it.
//
// No butterfly on the handle this time. One sat there to fetch you and you came.
// It does not need to ask twice.

const WARM = "rgba(226,196,150,";
/** The slab's depth. Same as the doorway you came through, because same door. */
const THICKNESS = 10;
/** Enough of a turn to open a real wedge of black, and not a degree more. */
const AJAR = -22;
/** Never a flat ninety: a degenerate plane inside preserve-3d is what kills iOS. */
const EDGE_TURN = 88;

// Depths in px inside the doorway's own 3D space, for the same reason the first
// door has them: coplanar layers leave the browser to break the tie however it
// likes, and Safari breaks it by painting the opaque face over everything.
const Z_BEYOND = -8;
const Z_TRIM = 1;

type Props = {
  lit: boolean;
  /**
   * The menu pane measures this block and pins its scroll to the bottom of it,
   * so the door is above the fold rather than on it.
   */
  ref?: Ref<HTMLDivElement>;
};

export default function DoorBehind({ lit, ref }: Props) {
  return (
    // The room it stands in, above the menu. Tall enough that nobody arrives on
    // the door by accident, short enough that one flick upward finds it.
    <div
      ref={ref}
      className="flex items-end justify-center"
      style={{ height: "64vh", paddingBottom: "7vh" }}
    >
      {/* the camera. Perspective belongs on the door's own box so the vanishing
          point is the middle of the door, not the middle of the empty room
          above it, which would have us looking up at it from the floor. */}
      <motion.div
        aria-hidden
        className="pointer-events-none"
        style={{ perspective: 1200 }}
        initial={false}
        // Lit by the same lamp as everything else in here, and with the chain
        // pulled it is a shape you can only just make out, like the swarm.
        animate={{ opacity: lit ? 1 : 0.12 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <div
          className="relative"
          // Smaller than the door in the intro, because it is across the room
          // now rather than in front of your face. Sized by height for the same
          // reason that one is: a door is a portrait shape, and a width-driven
          // one grows out of a short landscape window at both ends.
          style={{
            height: "min(44vh, 320px)",
            aspectRatio: "5 / 8",
            transformStyle: "preserve-3d",
          }}
        >
          {/* the dark beyond, which is the dark the piece opened in */}
          <div
            className="absolute inset-0 bg-black"
            style={{
              transform: `translateZ(${Z_BEYOND}px)`,
              boxShadow: "inset 0 24px 40px rgba(0,0,0,0.95)",
            }}
          />

          {/* the frame, sitting proud of the opening */}
          <div
            className="absolute -inset-[6px] border"
            style={{
              borderColor: `${WARM}0.18)`,
              boxShadow: `0 0 34px -16px ${WARM}0.4)`,
            }}
          />

          {/* the leaf, hinged on the left, exactly as it was hinged when you
              pushed it. Ajar rather than shut: a shut door is a panel, and the
              gap is the only thing here doing any work. */}
          <div
            className="absolute inset-0"
            style={{
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
              transform: `rotateY(${AJAR}deg)`,
            }}
          >
            {/* the same face as the first door, minus the word on it */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(100deg, rgba(28,21,17,0.99) 0%, rgba(17,13,11,0.99) 55%, rgba(24,18,15,0.99) 100%)",
                border: `1px solid ${WARM}0.16)`,
                boxShadow: "inset 0 0 50px rgba(0,0,0,0.75)",
              }}
            />

            {/* The slab itself, a real face turned out of the panel's plane
                rather than a bright line faking thickness. At this angle it is
                most of what says the door is open and not just dark down one
                edge. Darker than the face: nothing is lighting it. */}
            <div
              className="absolute top-0"
              style={{
                left: "100%",
                width: THICKNESS,
                height: "100%",
                transformOrigin: "left center",
                transform: `rotateY(${EDGE_TURN}deg)`,
                background:
                  "linear-gradient(100deg, rgba(20,15,12,0.99), rgba(11,8,7,0.99))",
                borderTop: `1px solid ${WARM}0.1)`,
                borderBottom: `1px solid ${WARM}0.1)`,
              }}
            />

            {/* handle */}
            <span
              className="absolute right-[9px] top-1/2 block h-[8px] w-[8px] rounded-full"
              style={{
                transform: `translateY(-50%) translateZ(${Z_TRIM}px)`,
                background: `${WARM}0.58)`,
                boxShadow: `0 0 7px ${WARM}0.28)`,
              }}
            />

            {/* hinges, so the side it swings from is never in doubt */}
            {[18, 74].map((top) => (
              <span
                key={top}
                className="absolute left-0 block w-[3px]"
                style={{
                  top: `${top}%`,
                  height: "8%",
                  transform: `translateZ(${Z_TRIM}px)`,
                  background: `${WARM}0.34)`,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
