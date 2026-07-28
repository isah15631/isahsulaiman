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
            style={{ boxShadow: "inset 0 28px 44px rgba(0,0,0,0.95)" }}
          />

          {/* Your own light, falling through the opening onto the floor in
              there. You are standing in what is left of the eruption's glow
              and the room ahead has nothing in it, so this is the only light
              that reaches the floor, which is also the reason you will have to
              go and find the lamp.

              Wide at the threshold and narrowing as it recedes, because that
              is what a receding plane does in perspective. It grows from the
              right, since a door hinged on the left uncovers its opening from
              the free edge inward. Held a hair behind the panel so the two are
              never coplanar and cannot fight over which draws on top. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: "46%",
              transformOrigin: "100% 100%",
              transform: "translateZ(-1px)",
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
            animate={{ rotateY: open ? -84 : 0 }}
            // ajar on hover: the affordance is the door itself moving, so it
            // needs no cursor hint or label to say it can be opened
            whileHover={open ? undefined : { rotateY: -6 }}
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
                transform: "rotateY(90deg)",
                background:
                  "linear-gradient(100deg, rgba(20,15,12,0.99), rgba(11,8,7,0.99))",
                borderTop: `1px solid ${WARM}0.1)`,
                borderBottom: `1px solid ${WARM}0.1)`,
              }}
            />

            {/* handle */}
            <span
              className="pointer-events-none absolute right-[10px] top-1/2 block h-[9px] w-[9px] -translate-y-1/2 rounded-full"
              style={{
                background: `${WARM}0.6)`,
                boxShadow: `0 0 9px ${WARM}0.4)`,
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
              // The handle is 9px wide at right-[10px], so its centre sits
              // 14.5px in; half the butterfly's 17px off that centres it on
              // the knob. The y-translate stands it on top rather than through.
              className="pointer-events-none absolute right-[6px] top-1/2 origin-bottom"
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={
                open
                  ? { x: 30, y: -86, opacity: 0, rotate: -20 }
                  : { x: 0, y: 0, opacity: 1, rotate: 0 }
              }
              transition={
                open
                  ? { duration: 0.85, ease: "easeOut" }
                  : { duration: 1.1, delay: 0.9, ease: "easeOut" }
              }
              style={{ translate: "0 -126%" }}
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
                  background: `${WARM}0.32)`,
                }}
              />
            ))}
          </motion.div>
        </button>
      </motion.div>
    </motion.div>
  );
}
