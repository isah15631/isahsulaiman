"use client";

import { motion } from "framer-motion";

// The floating torch that leads a passage in — shared by About and Projects so
// the fixture behaves identically wherever it appears.
//
// The torch is a winged, floating thing by default: a pair of wings grown from
// the handle, always out, and it drifts free and beats them the whole time it is
// on screen. Once we are through into the room it leans aside (`lean`) to light
// the page from the side rather than hanging over it. Closing reverses the lean.
//
// Two layers, so each motion is clean and never fights the next: the OUTER owns
// the pose (centred, then carried aside and tilted) and the INNER owns the
// perpetual drift. The wings live in the 96x132 body svg so they share the
// handle's coordinates and sit exactly on it: the hinge is at (48,82).

const FLAME_OUTER =
  "M20,4 C25,24 34,30 34,48 C34,64 28,74 20,74 C12,74 6,64 6,48 C6,30 15,24 20,4 Z";
const FLAME_MID =
  "M20,20 C23,34 30,38 30,52 C30,64 25,71 20,71 C15,71 10,64 10,52 C10,38 17,34 20,20 Z";
const FLAME_CORE =
  "M20,36 C22,44 26,47 26,55 C26,63 23,68 20,68 C17,68 14,63 14,55 C14,47 18,44 20,36 Z";

// One wing, drawn in the body's own 96x132 space with its root at the band,
// (48,82). A forewing sweeping up and out and a smaller hindwing under it.
const FOREWING = "M48,80 C50,56 66,38 82,41 C94,43 92,59 81,69 C69,80 56,82 48,82 Z";
const HINDWING = "M48,84 C58,82 77,85 81,95 C84,103 74,110 64,103 C55,97 50,90 48,84 Z";

// The stars the wings carry, out where the light catches the membrane rather than
// in the dark pooled at the root.
const GLINTS: [number, number, number, number][] = [
  [72, 51, 2.3, 0.95],
  [80, 58, 1.5, 0.68],
  [65, 60, 1.8, 0.85],
  [73, 95, 1.5, 0.6],
];

// Where the torch is carried to once we are inside, and how far it leans there.
// Off to one side of the sheet, tilted so the flame points up and in over the
// page and the body no longer hangs across the reading; its light pool rides with
// it, so it reads as a torch held UP to the page rather than a lamp above it.
const POSE_X = -190;
const POSE_Y = -6;
const POSE_TILT = 26;

function Wing() {
  return (
    <>
      <path d={FOREWING} fill="url(#strap-iron)" />
      <path d={HINDWING} fill="url(#strap-iron)" opacity="0.85" />
      {/* the night sky inside the membrane: deep and dark at the root, its colour
          left alone at the rim, with a few glints. Painted straight onto the wing
          shapes rather than a clipped rectangle — a wider rect inflated the wing
          group's bounding box, and since the flap hinges on that box's left edge,
          it pushed the pivot off the handle and split the wings apart mid-beat. */}
      <path d={FOREWING} fill="url(#wing-night)" />
      <path d={HINDWING} fill="url(#wing-night)" />
      {GLINTS.map(([x, y, r, o]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" opacity={o} />
      ))}
    </>
  );
}

export default function PassageTorch({
  lean,
  poseX = POSE_X,
  poseY = POSE_Y,
  poseTilt = POSE_TILT,
  zClassName = "z-40",
}: {
  /** carried aside and tilted to light the page */
  lean: boolean;
  poseX?: number;
  poseY?: number;
  poseTilt?: number;
  /** stacking of the whole torch, so it can be carried ABOVE the page it lights
      (About) or left on the wall layer (Projects) */
  zClassName?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 ${zClassName} flex justify-center`}>
      <motion.div
        style={{ marginTop: 30 }}
        initial={false}
        animate={
          lean
            ? { x: poseX, y: poseY, rotate: poseTilt }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={{ duration: 1.7, ease: [0.5, 0, 0.2, 1] }}
      >
        <motion.div
          initial={false}
          animate={{ y: [-4, -13, -4], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
        >
          <div className="relative flex flex-col items-center">
            {/* the flame */}
            <div
              className="relative z-10"
              data-torch-flame
              style={{ width: 40, height: 86, marginBottom: "-22px" }}
            >
              <svg
                width="40"
                height="86"
                viewBox="0 0 40 86"
                fill="none"
                aria-hidden
                style={{ filter: "drop-shadow(0 0 12px rgba(255,150,60,0.75))" }}
              >
                <g className="torch-flame">
                  <path d={FLAME_OUTER} fill="#ff6a14" opacity="0.92" />
                  <path d={FLAME_MID} fill="#ffb02a" />
                  <path d={FLAME_CORE} fill="#ffe9b0" />
                </g>
              </svg>
            </div>

            {/* the body, and over it the band-that-becomes-wings on the same box */}
            <div className="relative">
              <svg
                width="96"
                height="132"
                viewBox="0 0 96 132"
                fill="none"
                aria-hidden
                style={{ filter: "drop-shadow(4px 8px 7px rgba(0,0,0,0.55))" }}
              >
                <defs>
                  <linearGradient id="strap-wood" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#1f130c" />
                    <stop offset="0.26" stopColor="#573c28" />
                    <stop offset="0.5" stopColor="#7c5a3d" />
                    <stop offset="0.72" stopColor="#4f371f" />
                    <stop offset="1" stopColor="#190f09" />
                  </linearGradient>
                  <radialGradient id="strap-head" cx="0.42" cy="0.3" r="0.8">
                    <stop offset="0" stopColor="#4a382a" />
                    <stop offset="0.55" stopColor="#2b201a" />
                    <stop offset="1" stopColor="#140d09" />
                  </radialGradient>
                </defs>

                {/* handle */}
                <path
                  d="M41 44 L55 44 L52 118 C52 121 49 123 48 123 C47 123 44 121 44 118 Z"
                  fill="url(#strap-wood)"
                  stroke="#150c07"
                  strokeWidth="1"
                />
                <path d="M45 46 L45 116" stroke="rgba(255,170,90,0.5)" strokeWidth="1.6" strokeLinecap="round" />
                {/* pitch head */}
                <ellipse cx="48" cy="30" rx="16" ry="22" fill="url(#strap-head)" stroke="#120b07" strokeWidth="1.2" />
                <path d="M33 18 Q48 24 63 18" stroke="#0e0906" strokeWidth="1.6" fill="none" />
                <path d="M32 28 Q48 34 64 28" stroke="#0e0906" strokeWidth="1.6" fill="none" />
                <path d="M33 38 Q48 44 63 38" stroke="#0e0906" strokeWidth="1.6" fill="none" />
                <path d="M37 12 Q48 6 59 12 Q54 22 48 22 Q42 22 37 12 Z" fill="rgba(255,150,60,0.5)" />
                <ellipse cx="42" cy="22" rx="4.5" ry="7" fill="rgba(150,150,160,0.12)" />
              </svg>

              {/* The band and the wings, on their own overlaid svg sharing the
                  same 96x132 box so they sit exactly on the handle. */}
              <svg
                className="absolute inset-0"
                width="96"
                height="132"
                viewBox="0 0 96 132"
                fill="none"
                aria-hidden
                style={{ overflow: "visible" }}
              >
                <defs>
                  <linearGradient id="strap-iron" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#63636c" />
                    <stop offset="0.34" stopColor="#2a2a30" />
                    <stop offset="0.52" stopColor="#4a4a53" />
                    <stop offset="1" stopColor="#141418" />
                  </linearGradient>
                  {/* deep at the root (the band), gone by the rim */}
                  <radialGradient
                    id="wing-night"
                    gradientUnits="userSpaceOnUse"
                    cx="54"
                    cy="80"
                    r="46"
                  >
                    <stop offset="0" stopColor="#080a1c" stopOpacity="0.72" />
                    <stop offset="0.45" stopColor="#0d1230" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#131a3c" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* The wings, always out, hinged at (48,82) and held at their
                    resting bloom. Each beats on the shared CSS flap class. */}
                <g style={{ transformOrigin: "48px 82px", transform: "scale(0.78)" }}>
                  <g className="butterfly__wing" style={{ ["--flap" as string]: "0.5s" }}>
                    <Wing />
                  </g>
                  <g transform="translate(96,0) scale(-1,1)">
                    <g className="butterfly__wing" style={{ ["--flap" as string]: "0.5s" }}>
                      <Wing />
                    </g>
                  </g>
                </g>
              </svg>
            </div>

            {/* The light it throws, guttering with the flame. The pool is a plain
                radial gradient — no blur filter. It used to carry a blur(30px), but
                on a surface this large (up to 1000x1200) that blur had to be
                re-rasterised every frame as the torch drifts and its opacity
                gutters, which is what dragged the whole room's performance down. A
                radial gradient that fades to transparent is already this soft, so
                the blur bought nothing the stops do not, and dropping it makes the
                glow essentially free. */}
            <div
              className="torch-glow pointer-events-none absolute left-1/2 -z-10"
              style={{
                top: 92,
                width: "min(120vw, 1000px)",
                height: "min(150vh, 1200px)",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(ellipse 46% 44% at 50% 50%, rgba(255,198,120,0.55) 0%, rgba(255,172,90,0.3) 24%, rgba(255,150,66,0.12) 46%, rgba(255,140,60,0) 72%)",
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
