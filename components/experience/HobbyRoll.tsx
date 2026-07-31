"use client";

import { useId } from "react";

// A hobby, before you have read it: a rolled scroll, winged, hanging in the dark.
//
// It used to be a different drawn object for every hobby — a closed hardback, a
// fountain pen, a shaded football, three isometric planes, a hand mirror, a reel
// with the film running off it, a cherry blossom — and the idea was that working
// out what you were holding was the point of picking it up. Seven bespoke
// drawings is also seven drawings to make every time a hobby is added, and an
// eighth interest with no obvious object is simply not addable.
//
// So they are all the same thing now, and the thing is what it turns into. A
// scroll rolled shut, which you open, and it unrolls into the page you were
// going to read anyway. Adding one is a line of content and a colour.
//
// The wings are unchanged and still FEATHERED, not the butterfly's. That is a
// different drawing problem and worth saying why: a butterfly wing is one
// membrane, so a single silhouette with a colour in it is the whole truth of it.
// A bird's wing is a stack of separate blades on a curved spar, and the only
// thing that reads as one is the EDGES BETWEEN THE FEATHERS. So the geometry
// here is generated rather than drawn: a quadratic spar, sampled, with a blade
// hung off the normal at each step, raked back and lengthening toward the tip.
//
// What each one is called is now written under it. That is a real loss and it is
// forced: seven identical scrolls tell a visitor nothing, so the name has to do
// the work the drawing used to.

/** The composition, in the viewBox's own units. */
const HINGE_X = 70;
const HINGE_Y = 70;
const WING = 0.62;
const OBJ_X = 70;
const OBJ_Y = 76;
const OBJ = 0.82;

/**
 * Cropped to what is actually drawn. A winged object is far wider than it is
 * tall, and centring it in a square box spent half of every one of these on
 * empty air — which at the size they render is the difference between an object
 * you can read and a smudge.
 */
const VIEW_BOX = "12 26 116 78";
const VIEW_ASPECT = 78 / 116;

/**
 * The same wings with the roll cropped out from under them.
 *
 * Used once the scroll is open, where the thing they are carrying is the page
 * itself. Leaving the box the full height would hang the wings above an empty
 * strip where the roll used to be, and they would not be touching what they are
 * supposed to be holding.
 */
const WINGS_BOX = "12 26 116 48";
const WINGS_ASPECT = 48 / 116;

const f = (n: number) => n.toFixed(2);

/**
 * Every pair of wings on the shelf is the same gold.
 *
 * They used to take the hobby's own colour, which made seven differently
 * coloured birds. The wings are not what distinguishes one of these from
 * another — the tie is, and the name under it is — and once they are all the
 * same drawing the colour was doing nothing but making the shelf noisy.
 */
const GOLD = "#e3b45c";

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
        x2="66"
        y2="-4"
      >
        <stop offset="0" stopColor={lit(GOLD, 0.42)} />
        <stop offset="0.45" stopColor={GOLD} />
        <stop offset="1" stopColor={dim(GOLD, 0.5)} />
      </linearGradient>

      {/* The coverts are darker: the leading edge is over them. */}
      <linearGradient
        id={id(k, "covert")}
        gradientUnits="userSpaceOnUse"
        x1="6"
        y1="-46"
        x2="52"
        y2="-2"
      >
        <stop offset="0" stopColor={dim(GOLD, 0.18)} />
        <stop offset="1" stopColor={dim(GOLD, 0.62)} />
      </linearGradient>

      {/* The spar catches the most light of anything on the wing. */}
      <linearGradient
        id={id(k, "spar")}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="-8"
        x2="60"
        y2="-56"
      >
        <stop offset="0" stopColor={lit(GOLD, 0.62)} />
        <stop offset="1" stopColor={lit(GOLD, 0.24)} />
      </linearGradient>

      {/* Aged paper, lit from above and to the left like everything else here.
          Down the SHORT axis, because the roll is a cylinder lying on its side
          and a cylinder is dark at both edges and bright along one line. */}
      <linearGradient id={id(k, "paper")} x1="0" y1="0" x2="0.12" y2="1">
        <stop offset="0" stopColor="#6f6047" />
        <stop offset="0.22" stopColor="#e8dcc0" />
        <stop offset="0.5" stopColor="#d6c6a4" />
        <stop offset="1" stopColor="#5d5039" />
      </linearGradient>

      {/* Turned wood, for the rod it is wound on. */}
      <linearGradient id={id(k, "rod")} x1="0" y1="0" x2="0.1" y2="1">
        <stop offset="0" stopColor="#8a7048" />
        <stop offset="0.4" stopColor="#5f4a2e" />
        <stop offset="1" stopColor="#241b11" />
      </linearGradient>

      {/* The one place the hobby's own colour lands on the object: the tie. */}
      <linearGradient id={id(k, "tie")} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor={lit(color, 0.45)} />
        <stop offset="0.55" stopColor={color} />
        <stop offset="1" stopColor={dim(color, 0.45)} />
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

/**
 * The scroll, rolled shut.
 *
 * Drawn in its own units around the origin and dropped into the composition, so
 * the wings and the thing they carry are laid out independently of each other.
 *
 * It is a cylinder seen side on, and a cylinder is one bright line with the
 * surface falling away to dark at both edges — which is the whole of why the
 * paper gradient runs down the SHORT axis and not the long one. Everything else
 * is what tells you it is rolled rather than folded: the spiral end, the loose
 * edge lying across it, and the rod it is wound on sticking out at both sides.
 */
function Roll({ k }: { k: string }) {
  return (
    <g>
      {/* the rod, behind, showing at both ends */}
      <rect x={-34} y={-2.4} width={68} height={4.8} rx={2.4} fill={`url(#${id(k, "rod")})`} />
      <circle cx={-34} cy={0} r={3.4} fill={`url(#${id(k, "rod")})`} />
      <circle cx={34} cy={0} r={3.4} fill={`url(#${id(k, "rod")})`} />

      {/* the body of it */}
      <rect x={-25} y={-10.5} width={50} height={21} rx={10.5} fill={`url(#${id(k, "paper")})`} />

      {/* The loose edge, lying across the roll. One line, and it is most of what
          says this is wound rather than solid. */}
      <path
        d="M-19,-9.8 C-13,-3.6 -13,3.8 -19,9.8"
        fill="none"
        stroke="rgba(74,58,34,0.42)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M-17.6,-9.5 C-11.8,-3.5 -11.8,3.7 -17.6,9.5"
        fill="none"
        stroke="rgba(255,246,224,0.34)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* the spiral end, where you can see it is a rolled sheet */}
      <ellipse cx={25} cy={0} rx={4.8} ry={10.5} fill="#c9b795" />
      <ellipse cx={25} cy={0} rx={4.8} ry={10.5} fill="rgba(58,44,26,0.45)" />
      <path
        d="M27.4,-4.6 C23.2,-3.4 23.2,3.4 27,4.4"
        fill="none"
        stroke="rgba(255,244,220,0.5)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* one bright line along the top, which is the light on a cylinder */}
      <path
        d="M-22,-7.6 C-8,-10.2 8,-10.2 21,-7.8"
        fill="none"
        stroke="rgba(255,248,228,0.5)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* and the tie: the one place the hobby's colour touches the object */}
      <rect x={-5.4} y={-11.2} width={7.4} height={22.4} rx={1.6} fill={`url(#${id(k, "tie")})`} />
      <path
        d="M-5.4,-3.2 L2,-3.2"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  );
}


export default function HobbyRoll({
  color,
  size = 124,
  phase = 0,
  still = false,
  wingsOnly = false,
}: {
  color: string;
  size?: number;
  /** index of this one, used to detune the bob and the beat */
  phase?: number;
  /** parks the bob, for when it is sitting at the head of an open scroll */
  still?: boolean;
  /**
   * Drops the roll and keeps the wings.
   *
   * For the open scroll. The roll does not survive being unrolled — it IS the
   * page you are now reading — so leaving a little rolled one sitting on top of
   * the open one is two scrolls where there should be one. The wings stay,
   * because something has to be holding it up.
   */
  wingsOnly?: boolean;
}) {
  // Every gradient needs an id and ids are global to the document, so two of
  // these sharing one would quietly steal each other's shading. They were keyed
  // by hobby when every object was different; now that they are all the same
  // drawing in different colours, the key has to come from the instance.
  const k = useId().replace(/:/g, "");
  const drift = 3.6 + (phase % 3) * 0.7;

  return (
    // The bob is a css animation rather than a javascript one. Several of these
    // sit on the shelf at once, and as framer animations that was several loops
    // writing an inline transform on every frame, forever, on the main thread —
    // while the page they are on is being scrolled and while the pane they are
    // in is being flown down the screen. On the compositor it is a transform and
    // no javascript at all.
    //
    // No paint containment here, tempting as it is. It would stop a wingbeat
    // dirtying anything outside its own box, and it also clips every drop of
    // paint to that box — which cut the colour wash off square and put a hard
    // rectangle behind every object on the shelf.
    <div
      className={still ? "relative" : "relative hobby-bob"}
      style={{
        width: size,
        height: Math.round(size * (wingsOnly ? WINGS_ASPECT : VIEW_ASPECT)),
        ["--bob" as string]: `${drift}s`,
        ["--bob-offset" as string]: `${-phase * 0.9}s`,
      }}
    >
      {/* The colour lives here, in a wash behind the object, rather than in a
          drop-shadow on it. Same reason the swarm has no filter on it.

          It is a soft gradient and NOT a blurred one. It used to carry blur-2xl,
          which is a forty pixel blur pass, several of them on a shelf, on
          elements that are moving — and a gradient with a wide feathered stop
          already looks exactly like a blurred gradient, because that is what a
          blurred gradient is. */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10"
        style={{
          background: `radial-gradient(ellipse at 50% 55%, ${color}3a, ${color}16 38%, transparent 72%)`,
        }}
      />
      <svg
        viewBox={wingsOnly ? WINGS_BOX : VIEW_BOX}
        width="100%"
        height="100%"
        className="block overflow-visible"
        // One stroke, not a cycle: the keyframes alternate, so a full beat is
        // twice this. Each one is detuned off the others, because a shelf of
        // wings beating in unison is a carousel.
        style={{
          ["--beat" as string]: `${0.85 + (phase % 4) * 0.15}s`,
          ["--beat-offset" as string]: `${-phase * 0.4}s`,
        }}
        aria-hidden
      >
        <Materials k={k} color={color} />

        {/* wings first, so the object sits in front of their roots */}
        <g transform={`translate(${HINGE_X},${HINGE_Y}) scale(${WING})`}>
          <Wing k={k} />
        </g>
        <g transform={`translate(${2 * HINGE_X},0) scale(-1,1)`}>
          <g transform={`translate(${HINGE_X},${HINGE_Y}) scale(${WING})`}>
            <Wing k={k} />
          </g>
        </g>

        {/* and the thing they are carrying, until it is what you are reading */}
        {!wingsOnly && (
          <g transform={`translate(${OBJ_X},${OBJ_Y}) scale(${OBJ})`}>
            <Roll k={k} />
          </g>
        )}
      </svg>
    </div>
  );
}
