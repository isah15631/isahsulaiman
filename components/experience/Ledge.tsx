"use client";

import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// SHELVED. This is the boy on the ledge: he ran, tripped, and lost the sphere
// over an edge, and the shot below picked it up mid-fall. It is superseded by the
// moon in space, which needs no handover at all because it never leaves the scene
// it lands in. Nothing imports this any more.
//
// It used to read the handover contract straight out of OrbScene, which is gone
// along with the seam it described, so the numbers it was matching are frozen here
// instead. That keeps the file standing on its own if it is ever wanted back, and
// keeps it from holding the live scene's shape hostage.
function orbEntry(_vw: number, vh: number) {
  const px = vh / 5.5;
  return {
    size: 1.8 * px,
    centreY: vh / 2 - 3.65 * px,
    speed: 2.6458 * 1.62 * px,
    gravity: 2.6458 * px,
  };
}

// Before the fall, someone was carrying it.
//
// A boy runs a ledge with the thing in his arms, trips, and it goes over the edge
// without him. Then the camera goes over after it, and keeps going, and hands the
// sphere to the shot below still falling. There is no cut in here anywhere: the
// second half of this fall is the WebGL scene, and the only reason you cannot see
// the join is that it happens above the top of the frame, at a matching size and
// a matching speed, while the camera is still moving.
//
// Everything is in ONE coordinate system: one svg, one viewBox that is the
// viewport in css pixels, and every object placed in it by number. The first
// version of this hung an svg figure and two divs off a shared css anchor, and
// the ledge and the boy ended up in different boxes and disagreed about where the
// world ended: `right: 0` resolved against a wrapper zero pixels wide, so the
// ledge stopped a third of a screen short of the drop and he ran off the end of
// it. In here the edge is a number and his position is a number in the same
// space, and they cannot argue.
//
// The run is a function rather than a set of poses. One phase angle in, ten joint
// angles out, so cadence and stride and bounce are things you turn rather than
// twelve numbers to re-pose. The trip is hand-posed, because it happens once and
// it is the part you watch, and it starts from the gait's own contact frame: the
// foot that stops is the foot the cycle had just put down.
//
// The sphere is not animated at all. It is released out of his hands with what
// speed he had, and from there it is arcs and a bounce and a roll with friction,
// solved once at mount, then a fall. That is the difference between a drop that
// was keyframed to look natural and one that has nowhere else to be.

/** Nothing in here is measured except the viewport. All of it scales off that. */
const SURFACE_VH = 0.34;

/** Crown to sole, px. Bigger than it was: he was hard to see. */
const BOY_H = 68;
/** The rig is drawn 50px tall in its own units. */
const RIG = BOY_H / 50;
/** In his arms it is about the size of his head, which is how you carry a thing. */
const ORB_R = 7.5;

const RUN_FROM = 0.35;
/** Seconds for one full cycle: two steps. */
const STRIDE = 0.46;
const STRIDES = 3;
/** He is tripped on a contact frame, which is the only frame it can happen on. */
const TRIP = RUN_FROM + STRIDE * STRIDES;
/** His arms come out of it and it is gone a beat later. */
const RELEASE = TRIP + 0.05;
/** It reaches the lip here, and the roll is solved backwards from it. */
const LIP = 3.5;
/**
 * How long the camera waits before it goes after it, measured from the frame it
 * leaves the lip. A beat late, because that is what makes it a camera and not a
 * rail: it watches the thing teeter, and only when it is gone does it follow.
 */
const CAM_LAG = 0.06;

/** One stride carries him a bit over two of his own heights. */
const STRIDE_LEN = BOY_H * 2.2;
/**
 * How far short of the drop he goes down, px.
 *
 * Not optional and not a taste decision: the run has to END here, so the start is
 * this plus the whole run laid out backwards from it. Deriving the start from the
 * stride alone put his hip exactly on the lip at the moment he tripped, so he ran
 * off the ledge and sprawled over thin air, which is the second time this scene
 * has done that to me from a different direction.
 *
 * It also has to leave the sphere somewhere to go: what is left between him and
 * the edge is the roll, and the roll is the beat where he is down and it is still
 * leaving.
 */
const TRIP_BACK = 165;

type Pose = {
  lean: number;
  drop: number;
  hipR: number;
  kneeR: number;
  hipL: number;
  kneeL: number;
  shR: number;
  elR: number;
  shL: number;
  elL: number;
};

// Degrees, clockwise, and a limb hangs straight down at zero. He runs to the
// right, so NEGATIVE swings a limb forward.
//
// The four numbers each joint is fitted to are the four moments of a stride:
// contact, mid-stance, toe-off, and the swing through. A hip is a plain cosine
// between forward and back. A knee is not: it only bends one way, it is nearly
// straight when it lands, it folds deeply as it comes through, and that is a
// cosine plus a sine plus a second harmonic. Hence the shape below, which is
// those four values solved rather than three coefficients guessed.
const HIP_SWING = 30;

function gait(p: number): Pose {
  const leg = (phase: number) => ({
    hip: -HIP_SWING * Math.cos(phase),
    knee:
      33 -
      Math.cos(phase) -
      25 * Math.sin(phase) -
      20 * Math.cos(2 * phase),
  });
  const r = leg(p);
  const l = leg(p + Math.PI);

  return {
    lean: 9 + 0.8 * Math.sin(p),
    // Lowest at mid-stance, highest in flight, twice a cycle.
    drop: -1.7 * Math.cos(2 * p),
    hipR: r.hip,
    kneeR: r.knee,
    hipL: l.hip,
    kneeL: l.knee,
    // Both arms are around the sphere, so they barely move. That, more than the
    // legs, is what makes him read as carrying something.
    shR: -34 + 2 * Math.sin(p),
    elR: -76 - 2 * Math.sin(p),
    shL: -30 + 2 * Math.sin(p + 1),
    elL: -80 - 2 * Math.sin(p + 1),
  };
}

// The trip. Angles solved for where the ends of him have to be, not for numbers
// that look reasonable: a limb's angle on screen is the lean plus its own, so at
// a lean of 84 an arm hanging at -100 is still pointing at the floor.
//
// His leading foot stops and the hip goes over it. That is a trip. A figure that
// simply folds is a swoon.
const CATCH: Pose = { lean: 24, drop: 1, hipR: -49, kneeR: 10, hipL: 30, kneeL: 40, shR: -60, elR: -30, shL: -50, elL: -36 };
const DIVE_P: Pose = { lean: 54, drop: 8, hipR: 18, kneeR: 48, hipL: 42, kneeL: 26, shR: -88, elR: -14, shL: -80, elL: -20 };
/** Hands down. At this lean the arm reaches the surface exactly as he does. */
const BRACE: Pose = { lean: 74, drop: 13, hipR: 26, kneeR: 66, hipL: 34, kneeL: 44, shR: -100, elR: -26, shL: -94, elL: -30 };
/** Prone: the arms go to -174 because that is what lies them flat at this lean. */
const DOWN: Pose = { lean: 84, drop: 18, hipR: 8, kneeR: -2, hipL: 2, kneeL: 26, shR: -174, elR: 0, shL: -170, elL: -4 };

const mix = (a: number, b: number, f: number) => a + (b - a) * f;
const smooth = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function blend(a: Pose, b: Pose, f: number): Pose {
  return {
    lean: mix(a.lean, b.lean, f),
    drop: mix(a.drop, b.drop, f),
    hipR: mix(a.hipR, b.hipR, f),
    kneeR: mix(a.kneeR, b.kneeR, f),
    hipL: mix(a.hipL, b.hipL, f),
    kneeL: mix(a.kneeL, b.kneeL, f),
    shR: mix(a.shR, b.shR, f),
    elR: mix(a.elR, b.elR, f),
    shL: mix(a.shL, b.shL, f),
    elL: mix(a.elL, b.elL, f),
  };
}

/** The trip, as times and poses, starting from the gait frame it interrupts. */
const FALLING: { t: number; pose: Pose }[] = [
  { t: TRIP, pose: gait(0) },
  { t: TRIP + 0.1, pose: CATCH },
  { t: TRIP + 0.28, pose: DIVE_P },
  { t: TRIP + 0.44, pose: BRACE },
  { t: TRIP + 0.68, pose: DOWN },
];

function poseAt(t: number): Pose {
  if (t < TRIP) return gait(((t - RUN_FROM) / STRIDE) * Math.PI * 2);
  const last = FALLING.length - 1;
  if (t >= FALLING[last].t) return FALLING[last].pose;
  let i = 0;
  while (FALLING[i + 1].t < t) i++;
  const f = (t - FALLING[i].t) / (FALLING[i + 1].t - FALLING[i].t);
  return blend(FALLING[i].pose, FALLING[i + 1].pose, smooth(f));
}

/** Rotating a point by a clockwise angle, which is what svg means by rotate. */
function rot(x: number, y: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: x * c - y * s, y: x * s + y * c };
}

/**
 * Where his hands are, in rig units, off the pose.
 *
 * Worked through the same joints the drawing uses rather than guessed at, so the
 * sphere is in his hands instead of near them, and it stays there through the
 * bounce of the run without anything having to be kept in step by hand.
 */
function handAt(p: Pose) {
  const upper = rot(0, 9, p.shR);
  const fore = rot(0, 8, p.shR + p.elR);
  const local = { x: upper.x + fore.x, y: -15 + upper.y + fore.y };
  const held = rot(local.x, local.y, p.lean);
  return { x: held.x, y: held.y + p.drop };
}

/** A stretch of flight, roll or fall. Position is closed form inside it. */
type Arc = {
  kind: "arc";
  t0: number;
  x0: number;
  vx: number;
  ax: number;
  y0: number;
  vy: number;
  g: number;
  spin0: number;
  spinV: number;
  spinA: number;
};

/** Turning about the lip of the ledge rather than travelling past it. */
type Pivot = {
  kind: "pivot";
  t0: number;
  cx: number;
  cy: number;
  r: number;
  w0: number;
  alpha: number;
  spin0: number;
};

type Seg = Arc | Pivot;

const at = (s: Seg, t: number) => {
  const d = t - s.t0;
  if (s.kind === "pivot") {
    const th = s.w0 * d + 0.5 * s.alpha * d * d;
    return {
      x: s.cx + s.r * Math.sin(th),
      y: s.cy - s.r * Math.cos(th),
      // rolling over the corner rather than sliding across it
      spin: s.spin0 + (th * 180) / Math.PI,
      speed: (s.w0 + s.alpha * d) * s.r,
    };
  }
  return {
    x: s.x0 + s.vx * d + 0.5 * s.ax * d * d,
    y: s.y0 + s.vy * d + 0.5 * s.g * d * d,
    spin: s.spin0 + s.spinV * d + 0.5 * s.spinA * d * d,
    speed: Math.abs(s.vy + s.g * d),
  };
};

/**
 * The sphere's whole journey, solved once.
 *
 * Gravity is not chosen for looks: it is set so that when this shot hands over,
 * the sphere is falling at exactly the speed the shot below picks it up at. That
 * one number is what makes a div and a WebGL mesh the same object.
 *
 * The roll is the other way round. Its distance and its arrival at the lip are
 * fixed, so the friction is solved from them: fast enough off the bounce to get
 * there, slow enough by the lip to look like it is deciding.
 */
function trajectory(vw: number, vh: number) {
  const entry = orbEntry(vw, vh);
  const surface = vh * SURFACE_VH;
  const edge = vw / 2;
  // One gravity for the whole piece. This used to be solved so the handover
  // speed came out right, which made the level above fall nearly twice as hard
  // as the level below, and a sphere that changes how heavily it falls halfway
  // down is the other half of why the drop read as wrong.
  const g = entry.gravity;

  const runSpeed = (STRIDE_LEN * STRIDES) / (TRIP - RUN_FROM);
  const startX = edge - TRIP_BACK - STRIDE_LEN * STRIDES;

  // where it leaves his hands
  const p = poseAt(RELEASE);
  const hip = { x: startX + runSpeed * (RELEASE - RUN_FROM), y: surface - 22 * RIG };
  const hand = handAt(p);
  const x0 = hip.x + hand.x * RIG;
  const y0 = hip.y + hand.y * RIG;

  // He does not throw it. His arms come out from under it and it goes down with
  // about a third of what he had, which is also the only reason it stays on the
  // ledge long enough for him to watch it leave.
  //
  // A third rather than a half because the arcs are slower now: at the piece's
  // own gravity it hangs in the air longer out of his hands and on the bounce, so
  // the same sideways speed carried it most of the way to the lip on its own and
  // left nothing to roll. The roll is the beat where he is down and it is still
  // going, and it is worth protecting.
  const segs: Seg[] = [];
  const rest = surface - ORB_R;
  let vx = runSpeed * 0.32;
  let vy = 0;
  let t0 = RELEASE;
  let x = x0;
  let y = y0;
  let spin = 0;
  let spinV = 40;

  // two arcs: the drop out of his hands, and one bounce
  for (let i = 0; i < 2; i++) {
    // solve y0 + vy·d + ½g·d² = rest
    const d =
      (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * (rest - y)))) / g;
    segs.push({ kind: "arc", t0, x0: x, vx, ax: 0, y0: y, vy, g, spin0: spin, spinV, spinA: 0 });
    t0 += d;
    x += vx * d;
    y = rest;
    spin += spinV * d;
    vy = -(vy + g * d) * 0.42;
    // A bounce scuffs. Glass landing on stone loses a good part of its sideways
    // speed to the corner it hits, and this is also what leaves it something to
    // roll: without it the bounce carried it most of the way to the lip.
    vx *= 0.62;
    spinV *= 1.5;
    if (Math.abs(vy) < 12) break;
  }

  // then it rolls, and the friction is whatever gets it to the lip on time
  const T = Math.max(0.25, LIP - t0);
  const D = Math.max(1, edge - x);
  const v0 = (1.6 * D) / T;
  const ax = (2 * (v0 * T - D)) / (T * T);
  segs.push({
    kind: "arc",
    t0,
    x0: x,
    vx: v0,
    ax: -ax,
    y0: rest,
    vy: 0,
    g: 0,
    // A ball rolling without slipping turns through its own arc length.
    spin0: spin,
    spinV: (v0 / ORB_R) * (180 / Math.PI),
    spinA: (-ax / ORB_R) * (180 / Math.PI),
  });
  const rollSpin = spin + ((v0 * T - 0.5 * ax * T * T) / ORB_R) * (180 / Math.PI);

  // ---- over the lip ----
  //
  // This is the moment, and it was the one thing in here that was not physics.
  // The centre reached the edge, every bit of sideways speed vanished on that
  // frame, and it dropped from a standstill: it stopped, and then it fell. Two
  // things wrong with that. A ball does not become unsupported when its centre
  // passes a lip, it starts turning ABOUT the lip, so the centre swings out and
  // down through an arc while the ball is still touching. And it does not lose
  // its rotation, which is why it went from 190 degrees a second to 90 the frame
  // it left, when the one thing a ball leaving a ledge keeps is its spin.
  //
  // So it pivots. The angular acceleration is gravity's torque about the lip on a
  // solid sphere, 5g·sinθ over 7r, held at its mid-angle value rather than
  // integrated, which over twenty degrees of tip is a difference nobody can see.
  // It arrives already turning, so it has the nudge it needs to go over.
  const wRoll = (v0 - ax * T) / ORB_R;
  const alpha = (5 * g * Math.sin(Math.PI / 6)) / (7 * ORB_R);
  const LEAVE = (52 * Math.PI) / 180;
  const tip = (-wRoll + Math.sqrt(wRoll * wRoll + 2 * alpha * LEAVE)) / alpha;
  segs.push({
    kind: "pivot",
    t0: LIP,
    cx: edge,
    cy: surface,
    r: ORB_R,
    w0: wRoll,
    alpha,
    spin0: rollSpin,
  });

  // Off the lip with whatever the pivot gave it: down, and a little out, because
  // that is the direction it was travelling when it ran out of ledge. Most of the
  // sideways is scuffed off against the corner, so it drops close to the line it
  // lands on and takes a few pixels of the fall to drift back.
  const wLeave = wRoll + alpha * tip;
  const tangent = wLeave * ORB_R;
  const leftAt = LIP + tip;
  const lx = edge + ORB_R * Math.sin(LEAVE);
  const ly = surface - ORB_R * Math.cos(LEAVE);
  const vyLeave = tangent * Math.sin(LEAVE);
  const vxLeave = tangent * Math.cos(LEAVE) * 0.55;

  // How long the rest of the fall has to be is not a choice either: it is however
  // long this gravity needs to reach the speed the shot below picks it up at.
  const dive = Math.max(0.4, (entry.speed - vyLeave) / g);
  const swap = leftAt + dive;

  segs.push({
    kind: "arc",
    t0: leftAt,
    x0: lx,
    vx: vxLeave,
    ax: 0,
    y0: ly,
    vy: vyLeave,
    g,
    // its own spin, carried straight through
    spin0: rollSpin + (LEAVE * 180) / Math.PI,
    spinV: (wLeave * 180) / Math.PI,
    spinA: 0,
  });

  const endY = ly + vyLeave * dive + 0.5 * g * dive * dive;
  const camTo = endY - entry.centreY;

  return { entry, surface, edge, g, runSpeed, startX, segs, camTo, leftAt, swap, dive };
}

const RIM = "rgba(158,174,204,0.34)";

export default function Ledge({ onDropped }: { onDropped: () => void }) {
  const reduced = useReducedMotion();
  const t = useMotionValue(0);

  // The viewBox is the viewport in css pixels, so scene units are screen units
  // and a sphere 236px across is the number 236. Measured rather than assumed,
  // because the shot below sizes itself off the same viewport and the two have
  // to agree about how big the sphere is.
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const world = useRef<SVGGElement>(null);
  const haze = useRef<SVGRectElement>(null);
  const boy = useRef<SVGGElement>(null);
  const body = useRef<SVGGElement>(null);
  const legR = useRef<SVGGElement>(null);
  const shinR = useRef<SVGGElement>(null);
  const legL = useRef<SVGGElement>(null);
  const shinL = useRef<SVGGElement>(null);
  const armR = useRef<SVGGElement>(null);
  const foreR = useRef<SVGGElement>(null);
  const armL = useRef<SVGGElement>(null);
  const foreL = useRef<SVGGElement>(null);
  const orb = useRef<SVGGElement>(null);
  const trail = useRef<SVGGElement>(null);

  const plan = useMemo(() => (vp ? trajectory(vp.w, vp.h) : null), [vp]);

  useEffect(() => {
    if (reduced) {
      onDropped();
      return;
    }
    if (!plan || !vp) return;

    const set = (r: { current: SVGGraphicsElement | null }, v: string) =>
      r.current?.setAttribute("transform", v);

    // Everything after the lip is measured from the frame it actually left it,
    // not from the frame its centre crossed the edge. Those are a fifth of a
    // second apart and the whole tip happens in between: keying the camera and
    // the growth off the earlier one had the world starting to move, and the
    // sphere starting to come at you, while it was still balanced on the corner.
    const camFrom = plan.leftAt + CAM_LAG;
    const camFor = plan.swap - camFrom;

    const write = (now: number) => {
      const p = poseAt(now);

      // the camera, which is the whole world going up past you
      const cam = plan.camTo * smooth(clamp01((now - camFrom) / camFor));
      set(world, `translate(0,${-cam.toFixed(2)})`);
      // The light up here leaves with the level. What is under us is the shot
      // that opens on black, so this has to be gone by the time we arrive.
      haze.current?.setAttribute(
        "opacity",
        (
          clamp01((now - 0.05) / 0.85) *
          (1 - smooth(clamp01((now - camFrom) / (camFor - 0.15))))
        ).toFixed(3)
      );

      // him
      const hipX =
        plan.startX + plan.runSpeed * (Math.min(now, TRIP) - RUN_FROM) +
        // he carries on sliding after his hands land, which is the difference
        // between being tripped and falling over
        (now > TRIP ? 22 * smooth(clamp01((now - TRIP) / 0.6)) : 0);
      set(boy, `translate(${hipX.toFixed(2)},${(plan.surface - 22 * RIG).toFixed(2)}) scale(${RIG})`);
      set(body, `translate(0,${p.drop.toFixed(2)}) rotate(${p.lean.toFixed(2)})`);
      set(legR, `rotate(${p.hipR.toFixed(2)})`);
      set(shinR, `translate(0,11) rotate(${p.kneeR.toFixed(2)})`);
      set(legL, `rotate(${p.hipL.toFixed(2)})`);
      set(shinL, `translate(0,11) rotate(${p.kneeL.toFixed(2)})`);
      set(armR, `translate(0,-15) rotate(${p.shR.toFixed(2)})`);
      set(foreR, `translate(0,9) rotate(${p.elR.toFixed(2)})`);
      set(armL, `translate(0,-15) rotate(${p.shL.toFixed(2)})`);
      set(foreL, `translate(0,9) rotate(${p.elL.toFixed(2)})`);

      // it
      let ox: number;
      let oy: number;
      let spin: number;
      let speed = 0;
      if (now < RELEASE) {
        const hand = handAt(p);
        ox = hipX + hand.x * RIG;
        oy = plan.surface - 22 * RIG + hand.y * RIG;
        spin = 0;
      } else {
        let s = plan.segs[0];
        for (const seg of plan.segs) if (seg.t0 <= now) s = seg;
        const v = at(s, now);
        ox = v.x;
        oy = v.y;
        spin = v.spin;
        speed = v.speed;
      }

      // and it grows, because it is coming toward the camera. Settled at both
      // ends: it leaves his hands its own size and arrives the size the shot
      // below draws it, with nothing left to change on the frame they swap.
      const grow = smooth(clamp01((now - plan.leftAt) / plan.dive));
      const size = mix(ORB_R * 2, plan.entry.size, grow);
      set(orb, `translate(${ox.toFixed(2)},${oy.toFixed(2)}) scale(${(size / (ORB_R * 2)).toFixed(4)}) rotate(${spin.toFixed(1)})`);

      // The trail is speed made visible, so it is length, and the speed is the
      // one the sphere actually has rather than one worked out from the clock.
      // On the lip it is nothing, because on the lip it is barely moving.
      const fallen = clamp01((now - plan.leftAt) / plan.dive);
      const len = Math.max(0, (speed - 40) * 0.2);
      set(
        trail,
        `translate(${ox.toFixed(2)},${oy.toFixed(2)}) scale(${(size * 0.42).toFixed(2)},${len.toFixed(2)})`
      );
      trail.current?.setAttribute("opacity", (fallen * 0.55).toFixed(3));
    };

    write(0);
    const stop = t.on("change", write);
    const run = animate(t, plan.swap, {
      duration: plan.swap,
      ease: "linear",
      onComplete: onDropped,
    });
    return () => {
      stop();
      run.stop();
    };
    // onDropped is stable for the life of this shot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, plan, vp, t]);

  if (reduced || !vp || !plan) return null;

  const { surface, edge } = plan;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-20"
      width={vp.w}
      height={vp.h}
      viewBox={`0 0 ${vp.w} ${vp.h}`}
      aria-hidden
    >
      <defs>
        {/* What he is a silhouette against, and the only light in the piece
            before the impact. Cold, because nothing warm has happened yet, and
            pooled where he runs rather than spread over the frame: a silhouette
            is only as readable as the thing behind it. */}
        <radialGradient
          id="ledge-air"
          gradientUnits="userSpaceOnUse"
          cx={edge - BOY_H * 2.4}
          cy={surface - BOY_H * 0.5}
          r={Math.max(vp.w, vp.h) * 0.52}
        >
          <stop offset="0" stopColor="rgb(52,57,74)" stopOpacity="0.95" />
          <stop offset="0.34" stopColor="rgb(36,40,54)" stopOpacity="0.6" />
          <stop offset="0.72" stopColor="rgb(16,18,26)" stopOpacity="0.22" />
          <stop offset="1" stopColor="rgb(0,0,0)" stopOpacity="0" />
        </radialGradient>

        {/* Dead grey glass with one dull highlight. Nothing inside it: everything
            it has to give arrives at the bottom of the fall. */}
        <radialGradient id="ledge-glass" cx="0.34" cy="0.28" r="0.78">
          <stop offset="0" stopColor="#6b7079" />
          <stop offset="0.55" stopColor="#3a3e46" />
          <stop offset="1" stopColor="#15171c" />
        </radialGradient>

        <linearGradient id="ledge-wake" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="rgb(150,164,192)" stopOpacity="0.5" />
          <stop offset="1" stopColor="rgb(150,164,192)" stopOpacity="0" />
        </linearGradient>

        {/* the grazing light along the top of the ledge, so his feet have
            something to be on */}
        <linearGradient id="ledge-graze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(168,180,206)" stopOpacity="0.3" />
          <stop offset="1" stopColor="rgb(168,180,206)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* everything below moves as one, because it is one place and the camera
          is what is moving */}
      <g ref={world}>
        <rect
          ref={haze}
          x={-vp.w}
          y={-vp.h * 2}
          width={vp.w * 3}
          height={vp.h * 4}
          fill="url(#ledge-air)"
          opacity="0"
        />

        {/* The ledge: opaque black over the air, so the only thing you see of it
            is where it stops. Measured from the left with a width, never
            anchored with `right`, which is what broke it last time. */}
        <rect x={-vp.w * 2} y={surface} width={vp.w * 2 + edge} height={vp.h * 2} fill="#000" />
        <rect x={-vp.w * 2} y={surface - 7} width={vp.w * 2 + edge} height={7} fill="url(#ledge-graze)" />
        <rect x={-vp.w * 2} y={surface} width={vp.w * 2 + edge} height={1.2} fill="rgba(178,190,214,0.34)" />
        {/* the face of the drop, which is how you know the world ends here */}
        <rect x={edge - 1.4} y={surface} width={1.4} height={22} fill="url(#ledge-graze)" opacity="0.5" />

        <g ref={trail} opacity="0">
          <rect x={-0.5} y={-1} width={1} height={1} fill="url(#ledge-wake)" />
        </g>

        {/* A rim off the haze, one and a bit pixels up and to the left. It is the
            same figure referenced again underneath in a cold grey, so it costs no
            extra animation: `use` clones whatever the joints are doing this
            frame. A silhouette on black needs an edge or it is a hole. */}
        <use href="#boy" transform="translate(-1.3,-1.9)" color={RIM} />

        <g ref={boy} id="boy" color="#000">
          <g ref={body}>
            {/* far side first, so the near arm and leg cross in front of him */}
            <g opacity={0.66}>
              <g ref={legL}>
                <line x1={0} y1={0} x2={0} y2={11} stroke="currentColor" strokeWidth={5.5} strokeLinecap="round" />
                <g ref={shinL}>
                  <line x1={0} y1={0} x2={0} y2={11} stroke="currentColor" strokeWidth={4.4} strokeLinecap="round" />
                  <line x1={0} y1={11} x2={3.6} y2={11} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                </g>
              </g>
              <g ref={armL}>
                <line x1={0} y1={0} x2={0} y2={9} stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
                <g ref={foreL}>
                  <line x1={0} y1={0} x2={0} y2={8} stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" />
                </g>
              </g>
            </g>

            <line x1={0} y1={0} x2={0} y2={-15} stroke="currentColor" strokeWidth={9} strokeLinecap="round" />
            <circle cx={0} cy={-23} r={5.6} fill="currentColor" />

            <g ref={legR}>
              <line x1={0} y1={0} x2={0} y2={11} stroke="currentColor" strokeWidth={5.5} strokeLinecap="round" />
              <g ref={shinR}>
                <line x1={0} y1={0} x2={0} y2={11} stroke="currentColor" strokeWidth={4.4} strokeLinecap="round" />
                <line x1={0} y1={11} x2={3.6} y2={11} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
              </g>
            </g>
            <g ref={armR}>
              <line x1={0} y1={0} x2={0} y2={9} stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
              <g ref={foreR}>
                <line x1={0} y1={0} x2={0} y2={8} stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" />
              </g>
            </g>
          </g>
        </g>

        <g ref={orb}>
          <circle cx={0} cy={0} r={ORB_R} fill="url(#ledge-glass)" />
        </g>
      </g>
    </svg>
  );
}
