"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SWARM } from "@/lib/palette";
import Butterfly from "./Butterfly";

// The way on is a door, and you open it.
//
// It used to be the words "Explore →", which was the only piece of interface
// in the whole piece and read as a button on a website rather than as part of
// the world. A door does the same job and belongs here.
//
// It opens onto black. The room on the other side is the one with the lamp in
// it, and that room is dark until you find the chain, so a doorway spilling
// warm light would be promising something that is not there. Opening onto
// nothing and walking through anyway is the better beat, and it also makes the
// handoff invisible: both sides of the cut are already black.
//
// The move through it is translateZ against a perspective, not scale. Scale
// fakes getting closer and reads as a zoom; moving a camera through a
// perspective is getting closer, so the open door sweeps past you on the way
// rather than simply getting bigger.

const PERSPECTIVE = 1400;
// Stops just short of the camera plane. Magnification is p / (p - z), so this
// is a little over nine times, which is enough for the opening to swallow the
// frame from any viewport.
const THROUGH = 1250;

const WARM = "rgba(226,196,150,";
/** The slab's depth. About what a door is, against its width. */
const THICKNESS = 11;

// Depths, in px, inside the panel's own 3D space.
//
// Everything in here used to sit at z = 0, which left the browser to break the
// tie between coplanar layers however it liked. Safari broke it by painting
// the opaque face last, over the top of the handle, the hinges and the
// butterfly. Giving each layer a real depth makes the order a fact rather than
// a preference. Against a 1400px perspective these are around a thousandth of
// a scale change, so nothing moves.
const Z_BEYOND = -8;
const Z_LIGHT = -4;
const Z_TRIM = 1;
const Z_MOTH = 2;

// Not ninety. A face turned exactly perpendicular to the screen has zero area,
// and a degenerate plane inside a preserve-3d context is the other half of why
// this whole panel disappeared on iOS. Two degrees off is invisible on a dark
// sliver and keeps the geometry non-degenerate.
const EDGE_TURN = 88;

// The panel is held one pixel in front of the doorway it fills, which is both
// true of a door leaf and the reason it is here: `rotateY: 0` alone collapses
// to `transform: none`, and a preserve-3d element with no transform of its own
// does not reliably establish a 3D rendering context in Safari, which takes
// every one of its children down with it. A rotation small enough to be
// invisible is also small enough to round back to the identity matrix, so it
// has to be a real offset rather than a token one.
const Z_PANEL = 1;

export default function Doorway({ onThrough }: { onThrough: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ perspective: PERSPECTIVE }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: "easeInOut" }}
    >
      {/* the camera, moving forward through the opening */}
      <motion.div
        style={{ transformStyle: "preserve-3d" }}
        initial={{ z: 0 }}
        animate={{ z: open ? THROUGH : 0 }}
        // Starts before the door has finished swinging, so it reads as walking
        // at it rather than waiting politely for it to finish. Accelerating,
        // because you are leaning in by the end.
        transition={{ duration: 1.15, delay: 0.55, ease: [0.45, 0, 0.9, 0.6] }}
        onAnimationComplete={() => {
          if (open) onThrough();
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={open}
          aria-label="Open the door"
          className="relative block cursor-pointer"
          // Sized by height, not width. A door is a portrait shape, and on a
          // short landscape window a width-driven one grows taller than the
          // screen and loses its frame off both ends.
          style={{
            height: "min(62vh, 440px)",
            aspectRatio: "5 / 8",
            transformStyle: "preserve-3d",
          }}
        >
          {/* the dark beyond */}
          <div
            className="absolute inset-0 bg-black"
            style={{
              transform: `translateZ(${Z_BEYOND}px)`,
              boxShadow: "inset 0 28px 44px rgba(0,0,0,0.95)",
            }}
          />

          {/* Your own light, falling through the opening onto the floor in
              there. You are standing in what is left of the eruption's glow
              and the room ahead has nothing in it, so this is the only light
              that reaches the floor, which is also the reason you will have to
              go and find the lamp.

              Wide at the threshold and narrowing as it recedes, because that
              is what a receding plane does in perspective. It grows from the
              right, since a door hinged on the left uncovers its opening from
              the free edge inward.

              Four pixels clear of the floor behind it and four in front of it.
              It used to sit one pixel off the backdrop, which is inside the
              depth buffer's noise once the camera has travelled a thousand
              pixels toward it, and the two flickered against each other for
              the whole walk through. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: "46%",
              transformOrigin: "100% 100%",
              transform: `translateZ(${Z_LIGHT}px)`,
              clipPath: "polygon(0% 100%, 100% 100%, 74% 0%, 26% 0%)",
              background:
                "linear-gradient(to top, rgba(255,176,104,0.34), rgba(255,152,84,0.07) 55%, transparent 88%)",
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={open ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.95, ease: [0.2, 0.8, 0.3, 1] }}
          />

          {/* the frame, sitting proud of the opening */}
          <div
            className="pointer-events-none absolute -inset-[7px] border"
            style={{
              borderColor: `${WARM}0.22)`,
              boxShadow: `0 0 40px -14px ${WARM}0.45)`,
            }}
          />

          {/* the panel, hinged on the left */}
          <motion.div
            className="absolute inset-0"
            style={{
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
            }}
            initial={{ rotateY: 0, z: Z_PANEL }}
            animate={{ rotateY: open ? -84 : 0, z: Z_PANEL }}
            // ajar on hover: the affordance is the door itself moving, so it
            // needs no cursor hint or label to say it can be opened
            whileHover={open ? undefined : { rotateY: -6, z: Z_PANEL }}
            transition={
              open
                ? { duration: 0.95, ease: [0.2, 0.8, 0.3, 1] }
                : { type: "spring", stiffness: 190, damping: 20 }
            }
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(100deg, rgba(28,21,17,0.99) 0%, rgba(17,13,11,0.99) 55%, rgba(24,18,15,0.99) 100%)",
                border: `1px solid ${WARM}0.16)`,
                boxShadow: "inset 0 0 50px rgba(0,0,0,0.75)",
              }}
            >
              <span
                className="font-serif text-lg font-light lowercase tracking-[0.34em] text-neutral-300"
                style={{ textShadow: `0 0 14px ${WARM}0.3)` }}
              >
                explore
              </span>
            </div>

            {/* The slab itself. This used to be a two-pixel bright line down
                the free edge, faking thickness, and a fake is exactly what
                stops working when the camera passes within inches of it on the
                way through. It is a real face now: hinged along the panel's
                right edge and turned ninety degrees out of its plane, so it
                runs back from the front face and you watch it turn as the door
                swings. Darker than the face, because it is the one surface
                nothing is lighting. */}
            <div
              className="pointer-events-none absolute top-0"
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
              className="pointer-events-none absolute right-[10px] top-1/2 block h-[9px] w-[9px] rounded-full"
              style={{
                transform: `translateY(-50%) translateZ(${Z_TRIM}px)`,
                background: `${WARM}0.72)`,
                boxShadow: `0 0 9px ${WARM}0.45)`,
              }}
            />

            {/* Resting on the handle, and it is the whole invitation. There
                used to be a glow here that breathed on a three second loop,
                which is a UI hint wearing a costume and the only thing in the
                piece that admitted to being one. A living thing sitting on a
                handle needs no explaining, and it says what the glow could
                not: they went through this door ahead of you, and one came
                back to fetch you.

                Slow wings while it waits. The moment you push, it goes. */}
            <motion.div
              // Placed with plain layout rather than a percentage translate in
              // `style`. Both land it in the same spot, but `translate` is a
              // transform key, and leaving transform half-owned by the style
              // prop and half by `animate` is a trap worth not setting. The
              // handle is 9px wide at right-[10px], so its centre sits 14.5px
              // in and half the butterfly's 17px off that centres it on the
              // knob; bottom at half the panel plus the knob's radius stands it
              // on top of the handle rather than through it.
              className="pointer-events-none absolute right-[6px] origin-bottom"
              style={{ bottom: "calc(50% + 4px)" }}
              // initial={false}: it is already there when the door fades up,
              // rather than arriving a second later on its own delay. It is
              // sitting on a handle, not making an entrance, and it fades in
              // with the doorway around it because it is part of the picture.
              //
              // One fewer delayed animation is also one fewer thing that has
              // to have run for the handle to look right.
              initial={false}
              animate={
                open
                  ? { x: 30, y: -86, z: Z_MOTH, opacity: 0, rotate: -20 }
                  : { x: 0, y: 0, z: Z_MOTH, opacity: 1, rotate: 0 }
              }
              transition={{ duration: 0.85, ease: "easeOut" }}
            >
              <Butterfly color={SWARM[4]} size={17} flapDuration={1.15} />
            </motion.div>

            {/* hinges, so the side it swings from is never in doubt */}
            {[18, 74].map((top) => (
              <span
                key={top}
                className="pointer-events-none absolute left-0 block w-[3px]"
                style={{
                  top: `${top}%`,
                  height: "8%",
                  transform: `translateZ(${Z_TRIM}px)`,
                  background: `${WARM}0.42)`,
                }}
              />
            ))}
          </motion.div>
        </button>
      </motion.div>
    </motion.div>
  );
}
