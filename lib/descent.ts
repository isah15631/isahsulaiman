import { ORB_RADIUS } from "./orbGeometry";

// The fall, as one clock, and the only place that knows how far down we are.
//
// It is a moon until it is not. It hangs in the dark with the stars, and then it
// goes: out of vacuum, into air, through a cloud deck, and into concrete hard
// enough to leave a hole. One shot, one camera, no cut anywhere in it, because the
// thing that lands is the same mesh that was hanging there and the scene it lands
// in is the scene it started in.
//
// Everything reads its state from here. The moon's height, the camera's height,
// how hard the stars are streaking, how thick the cloud is, how brightly the
// air is tearing at it: all of it is a function of one number. That is not
// tidiness for its own sake. The two intros before this one both broke because
// two files each worked out the same quantity and quietly disagreed, and both
// times it took measuring the DOM to find out which one was lying.

/** Where the floor is, and so where everything else is measured from. */
export const FLOOR_Y = -1.6;
/** The sphere's centre when it is sitting on the concrete. */
export const REST_Y = FLOOR_Y + ORB_RADIUS;

/**
 * How far up it hangs, in world units.
 *
 * There is a ceiling on this and it is not taste. The frame is five and a half
 * units tall, so a fall of five hundred of them arrives doing a hundred and fifty
 * a second, crosses the whole shot between two frames, and cannot be watched or
 * caught up with. What sets the limit is the speed at the BOTTOM, not the height
 * at the top.
 *
 * Which is why this can be doubled and still land at a walking pace: the air does
 * the work. It leaves twice as high, gets going nearly twice as fast, and is then
 * braked to a sixth of that by the time it is through the cloud. The extra height
 * is spent on the part of the fall that is supposed to feel long — the vacuum, the
 * streaking, the deck coming up — and none of it is spent on the landing.
 */
export const SPACE_Y = 150;

// The camera's final framing, which is the framing the landing was composed in
// and is not up for negotiation: above the floor, looking slightly down it, with
// the impact in the lower third and empty dark above.
export const EYE_Y = 2.8;
export const LOOK_Y = -0.2;
export const HALF_H = 2.75;
export const HALF_W = 1.75;
export const FOV = 42;

/**
 * How far above the moon the camera rides on the way down.
 *
 * The camera falls WITH it, which is the whole trick: the moon sits still in the
 * frame and it is the universe that moves, exactly the way the doorway works by
 * moving a camera through a perspective rather than scaling a door. Chase it and
 * it shrinks away from you; ride alongside and the stars do the falling.
 *
 * It rides high in the frame, about a quarter down, and that is not composition:
 * it is the room the ending needs. The landing is framed with the sphere well
 * below centre, so the gap between where it rides and where it lands is exactly
 * how far it gets to drop away from the camera at the end. Ride it at the height
 * it lands at and the last beat of the fall has nowhere to happen.
 */
export const RIDE = 1.6;

/** Seconds from the first frame. */
export const BEAT = {
  /** it hangs there, alive */
  hang: 0,
  /** and then it lets go */
  release: 0.9,
  /** the top of the air, where the fall onto the snow begins */
  entry: 2.7,
  /** into the deck */
  cloud: 3.3,
  /** out of the bottom of it, into the open air above the snow */
  clear: 4.0,
  /** and lands */
  impact: 5.4,
};

/**
 * The shape of the fall, as speed against time.
 *
 * Speed rather than position, because a fall is defined by how it accelerates
 * and because integrating this gives continuous velocity for free: no join in
 * here can jolt. The numbers are relative and get scaled at load so the total
 * distance comes out at exactly the height it has to fall, which means the shape
 * can be re-tuned without re-deriving where anything ends up.
 *
 * It starts from rest, builds through vacuum, and then the air takes it: by the
 * cloud it is doing a quarter of what it did up top, and it comes down through
 * the last of it at about the speed the original drop landed at.
 *
 * The old note here said nothing in the piece decelerates into the floor, because
 * a falling object is fastest at the moment it lands. That is true of a stone
 * dropped in a room and false of anything arriving through an atmosphere, which is
 * the entire reason re-entry looks the way it does. The brake IS the shot now, and
 * it is also the only thing that makes the landing slow enough to watch.
 */
const SHAPE: [number, number][] = [
  [0, 0],
  [0.5, 0.09],
  [1.4, 0.46],
  [3.0, 1],
  [3.5, 0.82],
  [4.2, 0.42],
  [4.9, 0.22],
  [5.4, 0.17],
  [5.8, 0.15],
];

const FALL_FOR = BEAT.impact - BEAT.release;
const DROP = SPACE_Y - REST_Y;

/** Cumulative distance under the shape, so position is a lookup and a bit. */
const KEYS = (() => {
  const span = SHAPE[SHAPE.length - 1][0];
  const t = SHAPE.map(([k]) => (k / span) * FALL_FOR);
  const v = SHAPE.map(([, s]) => s);
  const d: number[] = [0];
  for (let i = 1; i < t.length; i++) {
    d.push(d[i - 1] + ((v[i - 1] + v[i]) / 2) * (t[i] - t[i - 1]));
  }
  // scale the speeds so the area under them is exactly the height of the fall
  const k = DROP / d[d.length - 1];
  return { t, v: v.map((s) => s * k), d: d.map((s) => s * k) };
})();

/** Speed of the fall, world units per second. Zero until it lets go. */
export function fallSpeed(now: number) {
  const t = now - BEAT.release;
  if (t <= 0) return 0;
  const { t: ts, v } = KEYS;
  if (t >= ts[ts.length - 1]) return v[v.length - 1];
  let i = 0;
  while (ts[i + 1] < t) i++;
  const f = (t - ts[i]) / (ts[i + 1] - ts[i]);
  return v[i] + (v[i + 1] - v[i]) * f;
}

/** How far it has fallen by now. */
function fallen(now: number) {
  const t = now - BEAT.release;
  if (t <= 0) return 0;
  const { t: ts, v, d } = KEYS;
  if (t >= ts[ts.length - 1]) return d[d.length - 1];
  let i = 0;
  while (ts[i + 1] < t) i++;
  const dt = t - ts[i];
  const a = (v[i + 1] - v[i]) / (ts[i + 1] - ts[i]);
  return d[i] + v[i] * dt + 0.5 * a * dt * dt;
}

/** Where the moon is. */
export function orbY(now: number) {
  return SPACE_Y - fallen(now);
}

/**
 * When the camera gives up chasing it.
 *
 * Solved rather than chosen. The camera rides at RIDE above the moon and then has
 * to be standing still, at eye height, by the time the thing lands: so it needs a
 * window long enough to shed all its speed and travel exactly the distance left
 * between where it is and where it has to be. Decelerating linearly, that
 * distance is half the speed times the window, and there is one moment where that
 * comes out right. Find it by scanning, once, at load.
 *
 * Everything the last stretch feels like falls out of this. The camera stops, the
 * moon does not, and what you see is the difference: it drops away from you into
 * the frame it lands in.
 */
const STOP_BY = BEAT.impact - 0.22;
const SETTLE = (() => {
  let best = BEAT.release;
  let err = Infinity;
  for (let i = 0; i <= 4000; i++) {
    const t = BEAT.release + (FALL_FOR * i) / 4000;
    const window = STOP_BY - t;
    if (window <= 0.05) break;
    const need = orbY(t) + RIDE - EYE_Y;
    const can = 0.5 * fallSpeed(t) * window;
    const e = Math.abs(need - can);
    if (e < err) {
      err = e;
      best = t;
    }
  }
  return best;
})();

/** Where the camera is. Alongside, then arriving, then still. */
export function camY(now: number) {
  if (now <= SETTLE) return orbY(now) + RIDE;
  const window = STOP_BY - SETTLE;
  const t = Math.min(now - SETTLE, window);
  const v = fallSpeed(SETTLE);
  // linear deceleration to a stop: distance is v·t minus half the ramp
  const gone = v * t - (v * t * t) / (2 * window);
  return Math.max(EYE_Y, orbY(SETTLE) + RIDE - gone);
}

/** 0 while it is still riding alongside, 1 once the camera has stopped. */
export function settled(now: number) {
  const window = STOP_BY - SETTLE;
  return Math.min(1, Math.max(0, (now - SETTLE) / window));
}

// The air, in world units. Derived from the fall rather than chosen, so the deck
// is wherever the moon actually is on the beat it is supposed to be entering it.
// Move a beat in BEAT and the sky moves with it.
export const ATMO_TOP = orbY(BEAT.entry);
export const CLOUD_TOP = orbY(BEAT.cloud);
export const CLOUD_BASE = orbY(BEAT.clear);

const span = (a: number, b: number, y: number) =>
  Math.min(1, Math.max(0, (a - y) / (a - b)));

/** 0 in vacuum, 1 by the time the air is thick. Drives the burn and the glow. */
export function airDensity(now: number) {
  return span(ATMO_TOP, CLOUD_BASE, orbY(now));
}

/**
 * How hard it is burning: the air it is hitting times how fast it is hitting it.
 *
 * Not a curve drawn by hand. A thing entering an atmosphere lights up because it
 * is moving quickly through something thick, and it stops when either of those
 * stops being true, which is why this dies away under the cloud without needing
 * to be told to.
 */
export function burn(now: number) {
  return burnAt(orbY(now), fallSpeed(now));
}

/** Where the fire is out. It has to be well clear of the floor. */
const COLD_Y = REST_Y + 2.4;

/**
 * How hard it is burning at a given height.
 *
 * Written against height rather than time so the trail can ask what the fire was
 * doing at any point it passed through, which is the only honest way to draw
 * something that was left behind: the streak is a record, not a shape.
 *
 * It is out before it lands, and that is not a convenience. A body slows as the
 * air thickens, and the fire is speed times density — once it has been braked to
 * a fifth of what it entered at, there is nothing left to burn. What used to
 * happen was that it arrived still lit and parked a glowing cone on the floor.
 */
export function burnAt(y: number, v = speedAtHeight(y)) {
  const d = span(ATMO_TOP, CLOUD_BASE, y);
  const hot = Math.min(1, d * (v / KEYS.v[KEYS.v.length - 1]) * 1.35);
  return hot * (1 - span(CLOUD_BASE, COLD_Y, y));
}

/** Binary search back through the fall for the speed it had at a height. */
function speedAtHeight(y: number) {
  let lo = BEAT.release;
  let hi = BEAT.impact;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (orbY(mid) > y) lo = mid;
    else hi = mid;
  }
  return fallSpeed((lo + hi) / 2);
}

/** How far into the cloud deck we are, 0 above it and 1 below. */
export function throughCloud(now: number) {
  return span(CLOUD_TOP, CLOUD_BASE, orbY(now));
}

/**
 * Night on the way down, day at the bottom.
 *
 * The moon carries the day with it. Above the deck it is hanging in the dark
 * with the stars; it is passing THROUGH the deck that turns the sky over, and by
 * the time it is under the cloud the sun is up and it lands in the open. 0 in
 * space, 1 on the ground.
 *
 * Tied to the deck rather than to the clock, the same way the air is, so if a
 * beat in BEAT moves, the dawn moves with it. It is deliberately the same band
 * the burn dies across: the fire on the way in becomes the daylight it lands in,
 * rather than one fading out and a second thing fading up beside it.
 *
 * Smoothstepped so the horizon does not snap on: it is a dawn breaking over a
 * couple of world units of fall, not a light switch.
 */
export function dayLight(now: number) {
  const t = span(CLOUD_TOP, CLOUD_BASE, orbY(now));
  return t * t * (3 - 2 * t);
}
