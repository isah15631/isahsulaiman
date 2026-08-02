"use client";

import { motion } from "framer-motion";

// A medieval torch strapped to the wall: a pitch-soaked head on a short wooden
// handle, held to the brick by an iron band and two bolts, with a live flame
// rising off it. It replaces the pull-switch entirely — there is no turning it on
// or off any more. It hangs dark and colourless until the fire-winged butterfly
// reaches it; from that instant it burns, and its burning is what floods the world
// back into colour.
//
// It is drawn to sit OFF the wall rather than painted flat on it: the wood is
// shaded round like a cylinder, the head like a ball, the iron band catches a
// metal highlight, and the whole thing throws a soft shadow onto the brick behind
// it. One boolean, `lit`, drives the flame and the radial pool of light, and it
// only ever goes one way.

const FLAME_OUTER =
  "M20,4 C25,24 34,30 34,48 C34,64 28,74 20,74 C12,74 6,64 6,48 C6,30 15,24 20,4 Z";
const FLAME_MID =
  "M20,20 C23,34 30,38 30,52 C30,64 25,71 20,71 C15,71 10,64 10,52 C10,38 17,34 20,20 Z";
const FLAME_CORE =
  "M20,36 C22,44 26,47 26,55 C26,63 23,68 20,68 C17,68 14,63 14,55 C14,47 18,44 20,36 Z";

const SPARKS = [
  { left: "44%", delay: "0s", dur: "1.5s", drift: "7px" },
  { left: "56%", delay: "0.5s", dur: "1.9s", drift: "-8px" },
  { left: "50%", delay: "1.0s", dur: "1.6s", drift: "4px" },
  { left: "60%", delay: "1.4s", dur: "2.1s", drift: "-5px" },
];

// Where the flame sits from the top of the fixture, so the light pools can be
// centred on it.
const FLAME_TOP = 76;

export default function Torch({ lit }: { lit: boolean }) {
  return (
    // isolate, not z-20: the torch is a fixture ON THE WALL, so it must sit
    // BEHIND the parchments and section content, not paint over them. `isolate`
    // gives it its own stacking context (so its own -z-10 light pools stay
    // contained and do not sink behind the brick) while leaving it at the room's
    // base layer, under the panes that render after it.
    <div className="pointer-events-none absolute inset-x-0 top-0 isolate flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        style={{ marginTop: 30 }}
      >
        <div className="relative flex flex-col items-center">
          {/* soft warm glow around the flame, guttering with it */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{
              top: `${FLAME_TOP - 74}px`,
              width: "160px",
              height: "160px",
              opacity: lit ? 1 : 0,
              transition: "opacity 700ms ease",
            }}
          >
            <div
              className="torch-glow h-full w-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,170,70,0.6), rgba(255,140,50,0.16) 42%, transparent 70%)",
                filter: "blur(6px)",
              }}
            />
          </div>

          {/* the flame */}
          <div
            className="relative z-10"
            // Marked so the parchments can measure exactly where the fire is on
            // screen and light whichever page is passing in front of it.
            data-torch-flame
            style={{
              width: 40,
              height: 86,
              marginBottom: "-22px",
              opacity: lit ? 1 : 0,
              transition: "opacity 500ms ease",
            }}
          >
            {SPARKS.map((s, i) => (
              <span
                key={i}
                className="absolute block rounded-full"
                style={{
                  left: s.left,
                  top: "30px",
                  width: "2px",
                  height: "2px",
                  background: "rgba(255,214,140,0.95)",
                  ["--drift" as string]: s.drift,
                  animation: lit
                    ? `torch-spark ${s.dur} linear ${s.delay} infinite`
                    : "none",
                }}
              />
            ))}
            <svg
              width="40"
              height="86"
              viewBox="0 0 40 86"
              fill="none"
              aria-hidden
              style={{
                filter: lit ? "drop-shadow(0 0 12px rgba(255,150,60,0.75))" : "none",
              }}
            >
              <g className="torch-flame">
                <path d={FLAME_OUTER} fill="#ff6a14" opacity="0.92" />
                <path d={FLAME_MID} fill="#ffb02a" />
                <path d={FLAME_CORE} fill="#ffe9b0" />
              </g>
            </svg>
          </div>

          {/* the torch body, shaded round and throwing a shadow onto the brick */}
          <svg
            width="96"
            height="132"
            viewBox="0 0 96 132"
            fill="none"
            aria-hidden
            style={{ filter: "drop-shadow(4px 8px 7px rgba(0,0,0,0.55))" }}
          >
            <defs>
              {/* wood shaded across its width so the handle reads as a cylinder */}
              <linearGradient id="torch-wood" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#1f130c" />
                <stop offset="0.26" stopColor="#573c28" />
                <stop offset="0.5" stopColor="#7c5a3d" />
                <stop offset="0.72" stopColor="#4f371f" />
                <stop offset="1" stopColor="#190f09" />
              </linearGradient>
              {/* the pitch head, shaded like a ball lit from the flame above */}
              <radialGradient id="torch-head" cx="0.42" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#4a382a" />
                <stop offset="0.55" stopColor="#2b201a" />
                <stop offset="1" stopColor="#140d09" />
              </radialGradient>
              {/* iron band, a vertical metal highlight */}
              <linearGradient id="torch-iron" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#63636c" />
                <stop offset="0.34" stopColor="#2a2a30" />
                <stop offset="0.52" stopColor="#4a4a53" />
                <stop offset="1" stopColor="#141418" />
              </linearGradient>
            </defs>

            {/* the wooden handle, tapering down, ending in a short stub */}
            <path
              d="M41 44 L55 44 L52 118 C52 121 49 123 48 123 C47 123 44 121 44 118 Z"
              fill="url(#torch-wood)"
              stroke="#150c07"
              strokeWidth="1"
            />
            {/* a warm rim down the flame-lit side of the handle */}
            {lit && (
              <path
                d="M45 46 L45 116"
                stroke="rgba(255,170,90,0.5)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            )}

            {/* the pitch-soaked head where it burns */}
            <ellipse cx="48" cy="30" rx="16" ry="22" fill="url(#torch-head)" stroke="#120b07" strokeWidth="1.2" />
            {/* binding rings, curved round the head so they wrap it */}
            <path d="M33 18 Q48 24 63 18" stroke="#0e0906" strokeWidth="1.6" fill="none" />
            <path d="M32 28 Q48 34 64 28" stroke="#0e0906" strokeWidth="1.6" fill="none" />
            <path d="M33 38 Q48 44 63 38" stroke="#0e0906" strokeWidth="1.6" fill="none" />
            {/* the flame licking warm light onto the top of the head when lit */}
            {lit && (
              <path
                d="M37 12 Q48 6 59 12 Q54 22 48 22 Q42 22 37 12 Z"
                fill="rgba(255,150,60,0.5)"
              />
            )}
            {/* a cool metal highlight on the head's upper-left, to round it */}
            <ellipse cx="42" cy="22" rx="4.5" ry="7" fill="rgba(150,150,160,0.12)" />

            {/* the iron band wrapping the handle, curved to sit round the cylinder */}
            <path
              d="M30 74 Q48 70 66 74 L66 90 Q48 94 30 90 Z"
              fill="url(#torch-iron)"
              stroke="#111115"
              strokeWidth="1"
            />
            {/* its bolts into the wall, domed */}
            <circle cx="24" cy="82" r="4" fill="#4c4c54" stroke="#111115" strokeWidth="1" />
            <circle cx="22.6" cy="80.6" r="1.4" fill="#7c7c86" />
            <circle cx="72" cy="82" r="4" fill="#4c4c54" stroke="#111115" strokeWidth="1" />
            <circle cx="70.6" cy="80.6" r="1.4" fill="#7c7c86" />
            {/* short mounting arms from the bolts to the band */}
            <path d="M28 82 L34 82 M62 82 L68 82" stroke="#2a2a30" strokeWidth="3" strokeLinecap="round" />
          </svg>

          {/* The light it throws — a soft radial pool around the flame that falls
              off in every direction, the way real torchlight lifts a wall out of
              the dark. Centred on the flame and big enough to reach the menu. */}
          <div
            className="pointer-events-none absolute left-1/2 -z-10"
            style={{
              top: `${FLAME_TOP}px`,
              width: "min(130vw, 1150px)",
              height: "min(165vh, 1300px)",
              transform: "translate(-50%, -50%)",
            }}
          >
            <motion.div
              className="h-full w-full"
              initial={false}
              animate={{ opacity: lit ? 1 : 0 }}
              transition={{ duration: lit ? 0.9 : 0.45, ease: "easeOut" }}
            >
              <div
                className="torch-glow h-full w-full"
                style={{
                  background:
                    "radial-gradient(ellipse 42% 40% at 50% 50%, rgba(255,190,112,0.36) 0%, rgba(255,166,86,0.17) 26%, rgba(255,146,64,0.06) 48%, rgba(255,140,60,0) 70%)",
                  filter: "blur(30px)",
                }}
              />
            </motion.div>
          </div>

          {/* a tighter, slower core pool right at the flame */}
          <div
            className="pointer-events-none absolute left-1/2 -z-10"
            style={{
              top: `${FLAME_TOP}px`,
              width: "min(80vw, 620px)",
              height: "min(80vh, 640px)",
              transform: "translate(-50%, -50%)",
            }}
          >
            <motion.div
              className="h-full w-full"
              initial={false}
              animate={{ opacity: lit ? 1 : 0 }}
              transition={{ duration: lit ? 1.0 : 0.4, ease: "easeOut" }}
            >
              <div
                className="torch-glow torch-glow--slow h-full w-full"
                style={{
                  background:
                    "radial-gradient(ellipse 46% 44% at 50% 50%, rgba(255,196,120,0.34), rgba(255,160,80,0.10) 42%, transparent 68%)",
                  filter: "blur(22px)",
                }}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
