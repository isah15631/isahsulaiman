"use client";

// A single butterfly, drawn as SVG so the silhouette reads clearly even at ~14px.
// The flap is a horizontal scale hinged at the body — cheap, and it stays
// legible at small sizes (a 3D rotation just squashes them into slivers).
//
// Note the nesting: the mirror lives on an OUTER <g> and the animated flap on an
// INNER <g>. A CSS transform would otherwise override the SVG transform
// attribute and collapse the mirrored wing onto its twin.

type ButterflyProps = {
  color: string;
  size?: number;
  flapDuration?: number; // seconds
  flapOffset?: number; // negative delay, so a swarm doesn't beat in unison
};

// Right-hand wings, drawn in a 100×100 box with the body along x = 50.
const FOREWING = "M50,44 C54,26 66,10 80,6 C92,3 97,14 94,28 C90,44 72,54 56,52 Z";
const HINDWING = "M54,54 C68,54 82,62 84,74 C86,86 74,92 64,84 C56,77 52,64 54,54 Z";

function Wings({ color }: { color: string }) {
  return (
    <>
      <path d={FOREWING} fill={color} />
      <path d={HINDWING} fill={color} opacity="0.88" />
    </>
  );
}

export default function Butterfly({
  color,
  size = 22,
  flapDuration = 0.28,
  flapOffset = 0,
}: ButterflyProps) {
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
      {/* right wings */}
      <g>
        <g className="butterfly__wing">
          <Wings color={color} />
        </g>
      </g>
      {/* left wings — the same shapes, mirrored about the body */}
      <g transform="translate(100,0) scale(-1,1)">
        <g className="butterfly__wing">
          <Wings color={color} />
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
