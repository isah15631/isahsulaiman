"use client";

import { motion } from "framer-motion";
import type { Hobby } from "@/lib/content";

// A hobby, before you have read it: the thing itself, winged, hanging in the
// dark.
//
// The wings are FEATHERED, not the butterfly's. That is a different drawing
// problem and worth saying why: a butterfly wing is one membrane, so a single
// silhouette with a colour in it is the whole truth of it. A bird's wing is a
// stack of separate blades on a curved spar, and the only thing that reads as
// one is the EDGES BETWEEN THE FEATHERS. So the geometry here is generated
// rather than drawn: a quadratic spar, sampled, with a blade hung off the
// normal at each step, raked back and lengthening toward the tip. Fourteen
// paths that each catch the light slightly differently.
//
// The objects are rendered objects, not pictograms, and the difference is not
// detail, it is light. Every one is lit from above and slightly to the left, by
// the same bulb hanging in this room, and built the same way: a silhouette,
// the planes that catch the light, the shadow where one plane tucks under
// another, then one specular edge.
//
// Nothing is labelled. The name of the hobby is not drawn, captioned, or
// written anywhere until the scroll unrolls, because working out what you are
// holding is the point of picking it up.

/** The composition, in the viewBox's own units. */
const HINGE_X = 70;
const HINGE_Y = 70;
const WING = 0.62;
const OBJ_X = 70;
const OBJ_Y = 76;
const OBJ = 0.6;

/**
 * Cropped to what is actually drawn. A winged object is far wider than it is
 * tall, and centring it in a square box spent half of every one of these on
 * empty air — which at the size they render is the difference between an object
 * you can read and a smudge.
 */
const VIEW_BOX = "12 26 116 78";
const VIEW_ASPECT = 78 / 116;

const f = (n: number) => n.toFixed(2);

// ---------------------------------------------------------------------------
// the wing
// ---------------------------------------------------------------------------

/**
 * The spar, as a quadratic bezier with the shoulder at the origin. Everything
 * about the wing is derived from this curve, so its shape IS the wing's
 * character: this one leaves the shoulder steeply, then flattens as it sweeps
 * out and up.
 */
const SPAR: [number, number][] = [
  [0, 0],
  [26, -46],
  [74, -64],
];

function sparAt(t: number) {
  const mt = 1 - t;
  const [a, b, c] = SPAR;
  const x = mt * mt * a[0] + 2 * mt * t * b[0] + t * t * c[0];
  const y = mt * mt * a[1] + 2 * mt * t * b[1] + t * t * c[1];
  let dx = 2 * mt * (b[0] - a[0]) + 2 * t * (c[0] - b[0]);
  let dy = 2 * mt * (b[1] - a[1]) + 2 * t * (c[1] - b[1]);
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  // Rotated a quarter turn in screen space, where y runs down: this is the side
  // the feathers hang from.
  return { x, y, tx: dx, ty: dy, nx: -dy, ny: dx };
}

/**
 * One blade, as a path. Shared by the primaries and the coverts, which differ
 * only in how long and how many they are.
 */
function blade(t: number, len: number, half: number, rakeK: number) {
  const s = sparAt(t);
  const rake = -rakeK * len;
  const px = (n: number, along: number) => s.x + n * s.nx + along * s.tx;
  const py = (n: number, along: number) => s.y + n * s.ny + along * s.ty;

  // A blunt tip rather than a point: two points a little apart with a cap
  // between them. Feathers taper, they do not come to a spike, and a wing of
  // spikes reads as a leaf or a saw blade.
  const cap = 1.9;
  const tipX = px(len, rake);
  const tipY = py(len, rake);

  return {
    t,
    tipX,
    tipY,
    // Where the sheet behind the feathers stops: short of the tips, so each one
    // protrudes and the trailing edge is scalloped.
    innerX: px(len * 0.84, rake * 0.84),
    innerY: py(len * 0.84, rake * 0.84),
    d:
      `M${f(px(0, half))},${f(py(0, half))}` +
      ` Q${f(px(0.55 * len, half * 1.15 + rake * 0.45))},${f(py(0.55 * len, half * 1.15 + rake * 0.45))}` +
      ` ${f(px(len, rake + cap))},${f(py(len, rake + cap))}` +
      ` Q${f(px(len * 1.05, rake))},${f(py(len * 1.05, rake))} ${f(px(len, rake - cap))},${f(py(len, rake - cap))}` +
      ` Q${f(px(0.58 * len, -half * 0.8 + rake * 0.5))},${f(py(0.58 * len, -half * 0.8 + rake * 0.5))}` +
      ` ${f(px(0, -half))},${f(py(0, -half))} Z`,
    // the shaft, which is what makes a blade read as a feather and not a petal
    quill:
      `M${f(px(2, 0))},${f(py(2, 0))}` +
      ` Q${f(px(0.55 * len, rake * 0.35))},${f(py(0.55 * len, rake * 0.35))}` +
      ` ${f(tipX)},${f(tipY)}`,
  };
}

const FEATHERS = 14;

/**
 * One blade per step along the spar, raked back and longer toward the tip.
 *
 * The half-width is the number that matters and it is deliberately about twice
 * the spacing between roots, so consecutive feathers OVERLAP heavily. Sized to
 * their own slot they sit edge to edge with slivers of background showing
 * between them, and the wing comes out as a comb: a row of separate blades with
 * light leaking through. Overlapped, they read as one mass whose only visible
 * divisions are the notches along the trailing edge, which is what a wing
 * actually is.
 */
const FEATHER = Array.from({ length: FEATHERS }, (_, i) =>
  blade(
    0.08 + (i / (FEATHERS - 1)) * 0.92,
    14 + 24 * Math.pow(0.08 + (i / (FEATHERS - 1)) * 0.92, 0.8),
    7.4 - 1.8 * (0.08 + (i / (FEATHERS - 1)) * 0.92),
    0.32
  )
);

/**
 * The coverts: a second, shorter row lying OVER the roots of the primaries.
 *
 * This is the single thing that stops a wing reading as a flat cut-out. One row
 * of blades, however well shaded, is a sheet — it has an outline and a fill and
 * nothing behind it. Two rows have an overlap, and an overlap has a near thing
 * and a far thing and a shadow between them, which is depth you cannot get from
 * a gradient. They are darker than the primaries because the leading edge is
 * over them, and shorter and blunter because that is what coverts are.
 */
const COVERTS = 11;
const COVERT = Array.from({ length: COVERTS }, (_, i) => {
  const t = 0.05 + (i / (COVERTS - 1)) * 0.74;
  return blade(t, (14 + 24 * Math.pow(t, 0.8)) * 0.46, 6.4 - 1.5 * t, 0.24);
});

/** The outer edge of the spar, sampled. Both the spar and the membrane use it. */
const SPAR_EDGE = (() => {
  const steps = 18;
  const over: string[] = [];
  const under: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s = sparAt(t);
    const w = 5.4 - 4.3 * t;
    over.push(`${f(s.x - w * s.nx)},${f(s.y - w * s.ny)}`);
    under.push(`${f(s.x + w * 0.45 * s.nx)},${f(s.y + w * 0.45 * s.ny)}`);
  }
  return { over, under };
})();

/** The leading edge, thick at the shoulder and drawn to nothing at the tip. */
const SPAR_PATH = `M${SPAR_EDGE.over.join(" L")} L${[...SPAR_EDGE.under]
  .reverse()
  .join(" L")} Z`;

/**
 * A solid sheet under the feathers, from the leading edge back to a line
 * through the tips. Belt and braces: even overlapped, the seams between blades
 * can hairline against a dark page at some sizes, and this guarantees the wing
 * is one opaque mass no matter what the rasteriser does with the edges.
 */
const MEMBRANE = `M${SPAR_EDGE.over.join(" L")} L${[...FEATHER]
  .reverse()
  .map((ft) => `${f(ft.innerX)},${f(ft.innerY)}`)
  .join(" L")} Z`;

/**
 * A sheen running ACROSS the feathers, parallel to the spar.
 *
 * This is the last thing that separates a row of individually shaded blades
 * from one sculpted surface. Shade each feather on its own and the wing stays a
 * collection of objects, however good each one is; run a single highlight over
 * all of them at once and the eye reads a continuous form underneath, because
 * only a continuous form could catch the light in one unbroken band. Offset
 * from the spar by a fraction of the local feather length, so it follows the
 * wing as it widens.
 */
function sheen(offset: number) {
  const steps = 16;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = 0.08 + (i / steps) * 0.88;
    const s = sparAt(t);
    const len = 14 + 24 * Math.pow(t, 0.8);
    pts.push(`${f(s.x + len * offset * s.nx)},${f(s.y + len * offset * s.ny)}`);
  }
  return `M${pts.join(" L")}`;
}
const SHEEN_NEAR = sheen(0.26);
const SHEEN_FAR = sheen(0.62);

// ---------------------------------------------------------------------------
// colour
// ---------------------------------------------------------------------------

function mix(hex: string, to: [number, number, number], amt: number) {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `#${c
    .map((v, i) => Math.round(v + (to[i] - v) * amt).toString(16).padStart(2, "0"))
    .join("")}`;
}
const lit = (hex: string, amt: number) => mix(hex, [255, 248, 236], amt);
const dim = (hex: string, amt: number) => mix(hex, [16, 13, 10], amt);

/**
 * Every gradient needs an id, ids are global to the document, and two objects
 * sharing one would quietly steal each other's shading. Namespaced by hobby.
 */
const id = (key: string, name: string) => `ho-${key}-${name}`;

function Materials({ k, color }: { k: string; color: string }) {
  return (
    <defs>
      {/* The wing, in the wing's OWN coordinates, so both wings light
          consistently and the mirrored one comes out symmetrical. */}
      <linearGradient
        id={id(k, "wing")}
        gradientUnits="userSpaceOnUse"
        x1="4"
        y1="-62"
        x2="52"
        y2="8"
      >
        <stop offset="0" stopColor={lit(color, 0.46)} />
        <stop offset="0.42" stopColor={color} />
        <stop offset="1" stopColor={dim(color, 0.62)} />
      </linearGradient>
      {/* The coverts sit under the leading edge and in its shadow, so they are
          a full step darker than the primaries they lie over. That step IS the
          depth: same hue, two values, one overlapping the other. */}
      <linearGradient
        id={id(k, "covert")}
        gradientUnits="userSpaceOnUse"
        x1="4"
        y1="-56"
        x2="44"
        y2="4"
      >
        <stop offset="0" stopColor={dim(color, 0.12)} />
        <stop offset="1" stopColor={dim(color, 0.72)} />
      </linearGradient>
      <linearGradient
        id={id(k, "spar")}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="-64"
        x2="40"
        y2="6"
      >
        <stop offset="0" stopColor={lit(color, 0.8)} />
        <stop offset="1" stopColor={lit(color, 0.2)} />
      </linearGradient>
      {/* What the object throws back onto the wings behind it. Nothing says
          "in front of" like something else being darker because of it. */}
      <radialGradient id={id(k, "occlude")} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.6" />
        <stop offset="0.5" stopColor="#000" stopOpacity="0.36" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>

      {/* dark bound cover: leather, or anything else that takes a low sheen */}
      <linearGradient id={id(k, "cover")} x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stopColor="#5c5347" />
        <stop offset="0.45" stopColor="#3a342c" />
        <stop offset="1" stopColor="#1d1a15" />
      </linearGradient>
      {/* paper, warm because the only light in here is tungsten */}
      <linearGradient id={id(k, "paper")} x1="0.1" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor="#f6f0e2" />
        <stop offset="0.55" stopColor="#e6dcc6" />
        <stop offset="1" stopColor="#cabfa5" />
      </linearGradient>
      {/* turned metal: brass, steel, the ferrule of a pen */}
      <linearGradient id={id(k, "metal")} x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0" stopColor="#efe6d2" />
        <stop offset="0.3" stopColor="#b8a882" />
        <stop offset="0.55" stopColor="#7d7057" />
        <stop offset="0.8" stopColor="#b6a781" />
        <stop offset="1" stopColor="#4e4636" />
      </linearGradient>
      {/* a curved body, lit from the upper left and bounced into on the far side */}
      <radialGradient id={id(k, "sphere")} cx="0.34" cy="0.28" r="0.85">
        <stop offset="0" stopColor="#fbf6ea" />
        <stop offset="0.42" stopColor="#cdc4b0" />
        <stop offset="0.78" stopColor="#5d564a" />
        <stop offset="1" stopColor="#2a2620" />
      </radialGradient>
      {/* the object's lent colour, for the one accent each of them is allowed */}
      <linearGradient id={id(k, "accent")} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor={lit(color, 0.3)} />
        <stop offset="1" stopColor={dim(color, 0.35)} />
      </linearGradient>
      {/* In the OBJECT's own space, not each petal's. Per-shape gradients rotate
          with the shape, so five petals turned about a centre each get lit from
          their own private direction and the flower comes out perfectly even
          and perfectly flat. One light across the whole thing means the near
          petals are lit and the far ones are not, which is the only reason a
          flower has a front and a back. */}
      <linearGradient
        id={id(k, "petal")}
        gradientUnits="userSpaceOnUse"
        x1="26"
        y1="18"
        x2="78"
        y2="82"
      >
        <stop offset="0" stopColor={lit(color, 0.5)} />
        <stop offset="0.45" stopColor={color} />
        <stop offset="1" stopColor={dim(color, 0.62)} />
      </linearGradient>
    </defs>
  );
}

function Wing({ k }: { k: string }) {
  return (
    <g className="wingbeat">
      <path d={MEMBRANE} fill={`url(#${id(k, "wing")})`} />
      <g
        fill={`url(#${id(k, "wing")})`}
        stroke="rgba(18,14,10,0.42)"
        strokeWidth="0.45"
      >
        {FEATHER.map((ft, i) => (
          // A touch of alternation, so the surface undulates instead of being
          // one even sweep of a gradient.
          <path key={ft.t} d={ft.d} opacity={i % 2 ? 1 : 0.93} />
        ))}
      </g>
      {/* the sheen, over all the primaries at once */}
      <g fill="none" strokeLinecap="round">
        <path d={SHEEN_FAR} stroke="rgba(255,250,238,0.1)" strokeWidth="7" />
        <path d={SHEEN_NEAR} stroke="rgba(255,250,238,0.17)" strokeWidth="5" />
        <path d={SHEEN_NEAR} stroke="rgba(255,252,244,0.14)" strokeWidth="1.8" />
      </g>
      {/* the shafts, catching a little of the light along their length */}
      <g
        fill="none"
        stroke="rgba(255,250,240,0.3)"
        strokeWidth="0.7"
        strokeLinecap="round"
      >
        {FEATHER.map((ft) => (
          <path key={ft.t} d={ft.quill} />
        ))}
      </g>
      {/* the coverts, lying over the primaries' roots — the overlap that makes
          the wing a stack of things rather than one sheet */}
      <g
        fill={`url(#${id(k, "covert")})`}
        stroke="rgba(14,11,8,0.5)"
        strokeWidth="0.45"
      >
        {COVERT.map((ft) => (
          <path key={ft.t} d={ft.d} />
        ))}
      </g>
      {/* and the shadow they cast down onto the primaries below them */}
      <g
        fill="none"
        stroke="rgba(10,8,6,0.32)"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path
          d={`M${f(COVERT[0].tipX)},${f(COVERT[0].tipY)} ${COVERT.slice(1)
            .map((ft) => `L${f(ft.tipX)},${f(ft.tipY)}`)
            .join(" ")}`}
        />
      </g>
      {/* leading edge, over everything, catching the most light */}
      <path d={SPAR_PATH} fill={`url(#${id(k, "spar")})`} />
      <ellipse cx="6" cy="-6" rx="9" ry="7" fill={`url(#${id(k, "spar")})`} transform="rotate(-34 6 -6)" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// the objects
// ---------------------------------------------------------------------------

function Body({ hobby, k }: { hobby: Hobby["key"]; k: string }) {
  const cover = `url(#${id(k, "cover")})`;
  const paper = `url(#${id(k, "paper")})`;
  const metal = `url(#${id(k, "metal")})`;
  const sphere = `url(#${id(k, "sphere")})`;
  const accent = `url(#${id(k, "accent")})`;
  const edge = "rgba(247,243,234,0.5)";
  const shade = "rgba(12,10,8,0.42)";

  switch (hobby) {
    /**
     * A closed hardback, seen from slightly above and to the right. Built back
     * to front: the block of leaves, then the board over it inset on every
     * side, then the spine turning away to the left.
     *
     * The whole object rests on two things. The board is SMALLER than the
     * block, so the fore edge and the tail show as a pale sliver all the way
     * round — that overhang is what says "bound" rather than "slab". And the
     * head of the block is visible as a band along the top, because you are
     * looking down on it, which is the only depth cue it gets.
     */
    case "reading":
      return (
        <>
          {/* The ribbon first, so it comes out from UNDER the tail. */}
          <path d="M56,88 L64,90 L62,102 L55,96 Z" fill={accent} />
          <path d="M56,88 L64,90 L62,102 L55,96 Z" fill="#000" opacity="0.25" />

          {/* THE HEAD, the top face. Brightest of the three, because it is the
              only one pointing at the bulb. */}
          <path d="M38,28 L78,36 L64,26 L24,18 Z" fill="#fbf6e8" />
          {/* the leaves on it, running spine to fore edge */}
          <g stroke="rgba(96,80,54,0.3)" strokeWidth="0.6">
            <path d="M32,24 L72,32" />
            <path d="M35,26 L75,34" />
          </g>
          {/* the board standing proud of the block: the square, and the reason
              a hardback looks bound rather than sawn */}
          <path d="M38,28 L78,36 L76.5,34.4 L36.5,26.4 Z" fill="#100e0b" opacity="0.8" />

          {/* THE SPINE, the left face. Turned toward the light, so a step
              brighter than the board. The fore edge is on the far side and
              cannot be seen from here, which is the whole point: drawing the
              spine AND the fore edge at once is geometrically impossible, and
              it was why this read as a sticker rather than a solid. */}
          <path d="M38,28 L38,86 L24,76 L24,18 Z" fill={cover} />
          <path d="M38,28 L38,86 L24,76 L24,18 Z" fill="#fff6e6" opacity="0.1" />
          {/* raised bands, across the spine rather than along it */}
          <g stroke="rgba(240,234,222,0.2)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M25.5,32 L37,42" />
            <path d="M25.5,58 L37,68" />
          </g>

          {/* THE FRONT BOARD, facing us. Darkest of the three: it faces the
              viewer, not the light. */}
          <path d="M38,28 L78,36 L78,94 L38,86 Z" fill={cover} />
          <path d="M38,28 L78,36 L78,94 L38,86 Z" fill="#000" opacity="0.22" />
          {/* the hinge groove where the board turns over the spine */}
          <path d="M38,28 L38,86" stroke="#0b0a08" strokeWidth="1.4" opacity="0.75" />
          {/* the label, and the rules tooled above and below it */}
          <path d="M46,44 L70,48.8 L70,58 L46,53.2 Z" fill={accent} />
          <g stroke={edge} strokeWidth="0.7" opacity="0.42">
            <path d="M45,38 L71,43.2" />
            <path d="M45,63 L71,68.2" />
            <path d="M45,66.5 L71,71.7" />
          </g>
          {/* the lit edge along the head, where the board turns over */}
          <path d="M24,18 L64,26" stroke={edge} strokeWidth="1.1" opacity="0.5" />
          <path d="M38,28 L78,36" stroke={edge} strokeWidth="1.2" opacity="0.55" />
        </>
      );

    /**
     * A fountain pen, lying at an angle. Drawn straight along x and rotated as
     * a whole, because a pen is a body of revolution and the highlight has to
     * run down its length, not across it.
     */
    case "writing":
      return (
        <g transform="rotate(-38 50 50)">
          <path d="M44,42 L86,42 A6,8 0 0 1 86,58 L44,58 Z" fill={cover} />
          {/* the highlight that makes it round rather than flat */}
          <path d="M46,45 L85,45 A2.5,3 0 0 1 85,49 L46,49 Z" fill="#8e8271" opacity="0.55" />
          <path d="M46,55 L85,55 A1.6,1.6 0 0 0 85,57 L46,57 Z" fill="#000" opacity="0.3" />
          <rect x="39" y="41" width="6" height="18" rx="1.6" fill={metal} />
          <path d="M39,41 L28,44 L28,56 L39,59 Z" fill={cover} />
          {/* nib */}
          <path d="M28,44 L10,49 L10,51 L28,56 Z" fill={metal} />
          <path d="M28,45.5 L14,49.6 L14,50.4 L28,54.5 Z" fill="#f4ecd8" opacity="0.45" />
          <path d="M10,50 L24,50" stroke="#241f17" strokeWidth="1" strokeLinecap="round" />
          <circle cx="24" cy="50" r="2.1" fill="#241f17" />
          <path
            d="M78,42 L78,34 A3,3 0 0 1 84,34 L84,42"
            fill="none"
            stroke={metal}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* wet ink */}
          <path d="M10,50 L4,50.6 L4,49.4 Z" fill={accent} />
        </g>
      );

    /**
     * A ball. The whole job here is the radial gradient: panels drawn flat on a
     * flat disc read as a logo, and the same panels over a shaded sphere read
     * as leather. The panels near the silhouette are squeezed horizontally,
     * because that is what a sphere does to anything painted on it.
     */
    case "football":
      return (
        <>
          <circle cx="50" cy="50" r="33" fill={sphere} />
          <g fill="#1e1b16" opacity="0.88">
            <path d="M50,30 L64,40 L59,57 L41,57 L36,40 Z" />
            <path d="M50,17 C56,17 61,19 64,21 L60,29 L50,25 L40,29 L36,21 C39,19 44,17 50,17 Z" />
            <path d="M77,44 C78,50 77,56 75,60 L67,56 L69,45 L77,40 Z" />
            <path d="M23,44 C22,50 23,56 25,60 L33,56 L31,45 L23,40 Z" />
            <path d="M39,73 C44,76 56,76 61,73 L58,66 L42,66 Z" />
          </g>
          <g fill="none" stroke="#211d18" strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
            <path d="M50,30 L50,25" />
            <path d="M64,40 L69,45" />
            <path d="M36,40 L31,45" />
            <path d="M59,57 L58,66" />
            <path d="M41,57 L42,66" />
          </g>
          <ellipse cx="37" cy="33" rx="13" ry="9" fill="#fffaf0" opacity="0.3" transform="rotate(-28 37 33)" />
          <path
            d="M50,83 A33,33 0 0 0 82,56"
            fill="none"
            stroke={accent}
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      );

    /**
     * Three planes, stacked. The only object here that is the hobby itself
     * rather than a stand-in for it: this is what the drawing looks like.
     */
    case "systems": {
      const plate = (y: number, fill: string) => (
        <g key={y}>
          <path d={`M50,${y - 13} L84,${y} L50,${y + 13} L16,${y} Z`} fill={fill} />
          <path
            d={`M16,${y} L50,${y + 13} L84,${y} L84,${y + 4} L50,${y + 17} L16,${y + 4} Z`}
            fill="#15120e"
          />
          <path
            d={`M50,${y - 13} L84,${y} L50,${y + 13} L16,${y} Z`}
            fill="none"
            stroke={edge}
            strokeWidth="0.9"
            opacity="0.5"
          />
        </g>
      );
      // Bottom up, with each plate's shadow laid on the one below it first. The
      // skirt alone gives a plate thickness; it is the shadow landing on the
      // next plate down that gives the stack a gap between them.
      // Offset down and to the right, because the light is up and to the left.
      const cast = (y: number) => (
        <ellipse key={`s${y}`} cx="53" cy={y + 2} rx="23" ry="8" fill="#080705" opacity="0.45" />
      );
      return (
        <>
          {plate(76, "#2e2a23")}
          {cast(76)}
          {plate(52, "#4a453a")}
          {cast(52)}
          {plate(28, "#6d6656")}
          <g stroke={accent} strokeWidth="2" strokeLinecap="round">
            <path d="M50,41 L50,49" />
            <path d="M50,65 L50,73" />
          </g>
          <g fill={accent}>
            <circle cx="34" cy="28" r="2.6" />
            <circle cx="66" cy="28" r="2.6" />
            <circle cx="50" cy="52" r="2.8" />
            <circle cx="38" cy="76" r="2.4" />
            <circle cx="62" cy="76" r="2.4" />
          </g>
        </>
      );
    }

    /**
     * A hand mirror. The glass is the one surface here that is not lit but
     * reflecting, so it gets a hard diagonal sheen instead of a soft gradient,
     * and the colour sits INSIDE it, because what a mirror shows is not what a
     * mirror is.
     */
    case "reflection":
      return (
        <>
          <path d="M45,62 L55,62 L53,92 A3,3 0 0 1 47,92 Z" fill={cover} />
          <path d="M47.5,64 L50,64 L48.8,90 A1,1 0 0 1 47.6,90 Z" fill="#8e8271" opacity="0.4" />
          <ellipse cx="50" cy="63" rx="8" ry="4" fill={metal} />
          <ellipse cx="50" cy="38" rx="30" ry="33" fill={metal} />
          {/* the bevel: the frame turning down into the glass. Two rings rather
              than one edge, because a single hard line between frame and glass
              reads as two flat shapes butted together. */}
          <ellipse cx="50" cy="38" rx="27" ry="30" fill="#0d0b09" opacity="0.55" />
          <ellipse cx="50" cy="37" rx="26" ry="29" fill={metal} opacity="0.55" />
          <ellipse cx="50" cy="38" rx="25" ry="28" fill="#14120e" />
          <ellipse cx="50" cy="38" rx="25" ry="28" fill={accent} opacity="0.34" />
          <path d="M30,20 L44,14 L64,58 L50,64 Z" fill="#f7f3ea" opacity="0.16" />
          <path d="M52,15 L59,13 L74,46 L67,49 Z" fill="#f7f3ea" opacity="0.1" />
          <path
            d="M28,18 A30,33 0 0 1 68,12"
            fill="none"
            stroke={edge}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.65"
          />
        </>
      );

    /**
     * A reel, with the film coming off it. The strip is what does the work: it
     * curves, and it narrows as it goes, which is the only perspective cue in
     * the drawing and the thing that stops the reel reading as a wheel.
     */
    case "movies":
      return (
        <>
          <path d="M60,64 C74,70 82,76 88,88 L78,92 C73,82 66,77 55,73 Z" fill="#26221c" />
          <path
            d="M62,67 C73,72 79,78 84,87"
            fill="none"
            stroke={accent}
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <g fill="#0d0b09">
            <circle cx="66" cy="70" r="1.5" />
            <circle cx="73" cy="75" r="1.4" />
            <circle cx="79" cy="82" r="1.3" />
          </g>
          <circle cx="46" cy="44" r="31" fill={cover} />
          <circle cx="46" cy="44" r="26" fill="#191713" />
          <circle cx="46" cy="44" r="26" fill="none" stroke={metal} strokeWidth="2.4" />
          <g fill="#0b0a08">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="46" cy="27" rx="6.5" ry="9" transform={`rotate(${a} 46 44)`} />
            ))}
          </g>
          <circle cx="46" cy="44" r="6" fill={metal} />
          <circle cx="46" cy="44" r="2.2" fill="#0b0a08" />
          <path
            d="M24,26 A31,31 0 0 1 62,17"
            fill="none"
            stroke={edge}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </>
      );

    /**
     * Sakura. Five petals, each notched at the tip, with the ones behind
     * darkened so the flower has a front and a back.
     */
    case "anime":
      return (
        <>
          {/* Back petals first, then the front two over them, so the flower is
              a stack rather than a pinwheel. */}
          {[180, 252, 324, 36, 108].map((a) => (
            <g key={a} transform={`rotate(${a} 50 50)`}>
              <path
                d="M50,50 C41,44 38,32 42,23 C45,16 48,14 50,14 C52,14 55,16 58,23 C62,32 59,44 50,50 Z"
                fill={`url(#${id(k, "petal")})`}
                stroke="rgba(18,12,10,0.35)"
                strokeWidth="0.5"
              />
              {/* the notch at the tip */}
              <path d="M50,14 C51.6,17 51.6,19 50,21 C48.4,19 48.4,17 50,14 Z" fill="#14110e" opacity="0.5" />
              {/* the crease, and the shading either side of it that turns a flat
                  blade into a petal with a spine down the middle */}
              <path d="M50,48 C44,42 41,32 44,23 C46,17 48,15 50,15 L50,48 Z" fill="#000" opacity="0.13" />
              <path
                d="M50,47 C48,40 48,30 50,22"
                fill="none"
                stroke="#fff6f2"
                strokeWidth="0.9"
                opacity="0.32"
              />
            </g>
          ))}
          {/* the well at the centre, which the petals fall into */}
          <circle cx="50" cy="50" r="9" fill="#12100d" opacity="0.4" />
          <g stroke="#f0d9a0" strokeWidth="1.2" strokeLinecap="round" opacity="0.9">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path key={a} d="M50,50 L50,38" transform={`rotate(${a} 50 50)`} />
            ))}
          </g>
          <g fill="#f7e6bb">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <circle key={a} cx="50" cy="37" r="1.7" transform={`rotate(${a} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="3.4" fill="#e8d09a" />
        </>
      );
  }
}

/**
 * The object, floating.
 *
 * The bob is on a wrapper rather than the svg so it composes with the hover
 * lift instead of fighting it, and every one of them gets its own duration and
 * a negative delay, because seven things rising and falling in unison is a
 * carousel and not a swarm.
 */
export default function HobbyObject({
  hobby,
  color,
  size = 124,
  phase = 0,
  still = false,
}: {
  hobby: Hobby["key"];
  color: string;
  size?: number;
  /** index of this object, used to detune the float and the beat */
  phase?: number;
  /** parks the bob, for when the object is sitting at the head of a scroll */
  still?: boolean;
}) {
  const drift = 3.6 + (phase % 3) * 0.7;

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: Math.round(size * VIEW_ASPECT) }}
      animate={still ? { y: 0 } : { y: [0, -9, 0] }}
      transition={
        still
          ? { duration: 0.4, ease: "easeOut" }
          : {
              duration: drift,
              repeat: Infinity,
              ease: "easeInOut",
              delay: -phase * 0.9,
            }
      }
    >
      {/* The colour lives here, in a blurred wash behind the object, rather
          than in a drop-shadow on it. Same reason the swarm has no filter on
          it: a blur pass over live geometry is re-rasterised every frame, and
          this one is painted once and left alone. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
        style={{
          background: `radial-gradient(ellipse at 50% 55%, ${color}44, transparent 70%)`,
        }}
      />
      <svg
        viewBox={VIEW_BOX}
        width="100%"
        height="100%"
        className="block overflow-visible"
        // One stroke, not a cycle: the keyframes alternate, so a full beat is
        // twice this. It used to be 2.2s a stroke, which at four and a half
        // seconds up and down again was slower than something holding itself in
        // the air needs to be, and read as drifting rather than flying. Under a
        // second is a wingbeat you can see happening.
        //
        // Still nowhere near the swarm, and that difference is the point: a
        // butterfly flutters at a quarter of a second a stroke and these beat.
        // Each one is detuned off the others, because seven pairs of wings in
        // unison is a carousel.
        style={{
          ["--beat" as string]: `${0.85 + (phase % 4) * 0.15}s`,
          ["--beat-offset" as string]: `${-phase * 0.4}s`,
        }}
        aria-hidden
      >
        <Materials k={hobby} color={color} />

        {/* wings first, so the object sits in front of their roots */}
        <g transform={`translate(${HINGE_X},${HINGE_Y}) scale(${WING})`}>
          <Wing k={hobby} />
        </g>
        <g transform={`translate(${2 * HINGE_X},0) scale(-1,1)`}>
          <g transform={`translate(${HINGE_X},${HINGE_Y}) scale(${WING})`}>
            <Wing k={hobby} />
          </g>
        </g>

        {/* the object's own shadow, on the wings, before the object itself */}
        <ellipse
          cx={OBJ_X}
          cy={OBJ_Y - 4}
          rx={30}
          ry={24}
          fill={`url(#${id(hobby, "occlude")})`}
        />

        <g transform={`translate(${OBJ_X},${OBJ_Y}) scale(${OBJ}) translate(-50,-50)`}>
          <Body hobby={hobby} k={hobby} />
        </g>
      </svg>
    </motion.div>
  );
}
