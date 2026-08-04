"use client";

import { useId } from "react";

// A single butterfly, drawn as SVG so the silhouette reads clearly even at ~14px.
// The flap is a horizontal scale hinged at the body — cheap, and it stays
// legible at small sizes (a 3D rotation just squashes them into slivers).
//
// Note the nesting: the mirror lives on an OUTER <g> and the animated flap on an
// INNER <g>. A CSS transform would otherwise override the SVG transform
// attribute and collapse the mirrored wing onto its twin.
//
// The wings hold a piece of the sky they came out of. Not a starfield: these are
// fourteen to twenty-two pixels across on screen, and a tiled field of stars at
// that size is sub-pixel noise that reads as dirt. What reads is the thing a
// night sky actually does at a distance — it goes deep and dark toward the
// middle, keeps its colour at the edges where the light catches it, and has a
// few points in it bright enough to survive being small. So: a dark wash pooled
// at the wing root, the swarm's colour left alone out at the rim, and four
// glints. On the big ones, the pair carrying the greeting or the one sitting on
// the door handle, it reads as sky. On the small ones it reads as depth, which is
// what small things need.

type ButterflyProps = {
  color: string;
  size?: number;
  flapDuration?: number; // seconds
  flapOffset?: number; // negative delay, so a swarm doesn't beat in unison
  // The night sky inside the membrane is worth it on the big, hero butterflies,
  // but on a swarm of tiny ones it is sub-pixel noise AND a clip + gradient + four
  // circles per instance, redrawn every frame. On by default (nothing regresses);
  // dense swarms of small ones pass sky={false} to shed that cost.
  sky?: boolean;
};

// Right-hand wings, drawn in a 100×100 box with the body along x = 50.
//
// Exported because the room butterflies, the leaders, the torches and the fire
// butterfly all wear these too. A winged thing only works if the wings are
// recognisably the swarm's and not a second, similar pair.
export const FOREWING =
  "M50,44 C54,26 66,10 80,6 C92,3 97,14 94,28 C90,44 72,54 56,52 Z";
export const HINDWING =
  "M54,54 C68,54 82,62 84,74 C86,86 74,92 64,84 C56,77 52,64 54,54 Z";

/**
 * Where the stars sit, in the wing's own 100-unit space.
 *
 * Hand-placed rather than scattered, because at this size there is room for
 * exactly four and every one of them has to land somewhere the wing is actually
 * wide. A random scatter puts half of them off the membrane.
 */
const GLINTS: [number, number, number, number][] = [
  // x, y, radius, opacity
  [78, 16, 2.6, 0.95],
  [88, 30, 1.7, 0.72],
  [66, 33, 1.9, 0.85],
  [72, 71, 1.8, 0.7],
];

export function Wings({ color, night }: { color: string; night?: string }) {
  return (
    <>
      <path d={FOREWING} fill={color} />
      <path d={HINDWING} fill={color} opacity="0.88" />
      {night && (
        // Clipped to the wings themselves, so the sky is inside the membrane and
        // not a smudge floating over it.
        <g clipPath={`url(#${night}-clip)`}>
          <rect x="44" y="0" width="60" height="100" fill={`url(#${night}-wash)`} />
          {GLINTS.map(([x, y, r, o]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" opacity={o} />
          ))}
        </g>
      )}
    </>
  );
}

export default function Butterfly({
  color,
  size = 22,
  flapDuration = 0.28,
  flapOffset = 0,
  sky = true,
}: ButterflyProps) {
  // Unique per instance. Two of these on a page sharing an id would both resolve
  // to whichever one mounted first, and the sky would vanish out of every wing
  // the moment that one left.
  const id = useId().replace(/:/g, "");
  const night = sky ? id : undefined;

  const style = {
    ["--flap" as string]: `${flapDuration}s`,
    ["--flap-offset" as string]: `-${flapOffset}s`,
    color,
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="butterfly"
      style={style}
      aria-hidden
    >
      {night && (
        <defs>
          <clipPath id={`${night}-clip`}>
            <path d={FOREWING} />
            <path d={HINDWING} />
          </clipPath>
          {/* Deep at the root, gone by the rim. The colour survives where the wing
              is thin and the light is passing through it, which is the edge. */}
          <radialGradient
            id={`${night}-wash`}
            gradientUnits="userSpaceOnUse"
            cx="56"
            cy="46"
            r="46"
          >
            <stop offset="0" stopColor="#080a1c" stopOpacity="0.68" />
            <stop offset="0.45" stopColor="#0d1230" stopOpacity="0.42" />
            <stop offset="1" stopColor="#131a3c" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}

      {/* right wings */}
      <g>
        <g className="butterfly__wing">
          <Wings color={color} night={night} />
        </g>
      </g>
      {/* left wings — the same shapes, mirrored about the body */}
      <g transform="translate(100,0) scale(-1,1)">
        <g className="butterfly__wing">
          <Wings color={color} night={night} />
        </g>
      </g>
      {/* body */}
      <path
        d="M50,28 C52,30 53,36 53,50 C53,64 51,73 50,78 C49,73 47,64 47,50 C47,36 48,30 50,28 Z"
        fill="rgba(24,16,14,0.9)"
      />
    </svg>
  );
}
