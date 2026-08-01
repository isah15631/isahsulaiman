import { BEAT, FLOOR_Y } from "./descent";

/**
 * Where the door stands, shared by the scene that draws it and the camera that
 * goes to it so the two can never disagree. Off to one side and set back from
 * the crater, close enough to walk to inside the shot.
 */
export const DOOR_POS: [number, number, number] = [1.5, FLOOR_Y + 1.6, -9];

// What happens after it lands: the camera pulls back off the crater to reveal
// the whole desert at golden hour, holds on that vista while the swarm streams
// to the door, then goes to the door and through it. One clock, continuous with
// the fall, so any instant can be seeked and held still.
//
// The desert does NOT fade out any more. The sky and the dunes are wanted in
// frame the whole way, from the landing until the black of the doorway itself
// closes over the lens as we step through. Everything here is a function of
// `now` in seconds from the first frame.

/**
 * Land, HOLD on the crater a beat so the rock and its scattered debris are read
 * on the ground, then pull straight back off it to take in the vista. The hold
 * is the whole reason the debris is worth throwing: pull back the instant it
 * lands and it is gone off the bottom of the frame before it settles.
 */
export const REVEAL = {
  start: BEAT.impact + 1.3,
  end: BEAT.impact + 2.6,
};

/** Hold the vista a moment, then go in to the door. */
export const APPROACH = {
  start: BEAT.impact + 2.7,
  end: BEAT.impact + 5.7,
};

/** Straight on from the standoff, through the opening, into the dark. */
export const THROUGH = {
  start: APPROACH.end,
  end: APPROACH.end + 1.3,
};

/** When the leaf swings, part way in so it is wide before the swarm arrives. */
export const DOOR_OPENS = APPROACH.start + (APPROACH.end - APPROACH.start) * 0.26;

/**
 * The swarm's flight. It leaves the crater a beat AFTER the sphere breaks, once
 * the rock has landed and its debris has scattered across the snow, so the order
 * you read is: it hits, the pieces settle, and only then do they lift off as
 * butterflies and pour into the door. Gathered into the door by the time the
 * camera arrives, so the butterflies that come out of the moon are the same ones
 * that go into the door.
 */
export const LEAD = {
  start: BEAT.impact + 0.9,
  end: APPROACH.end - 0.3,
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Smoothstep: eased 0 to 1, flat at both ends so no move starts or stops hard. */
const ease = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/** 0 sitting on the crater, 1 pulled back on the vista. Eased. */
export function revealP(now: number) {
  return ease((now - REVEAL.start) / (REVEAL.end - REVEAL.start));
}

/**
 * 0 on the vista, 1 arrived at the door's threshold.
 *
 * Eased IN only (t*t): it leaves the held vista gently and arrives at the door
 * still MOVING, at its fastest. That is the fix for the little stall at the
 * threshold — the old smoothstep decelerated the camera to a dead stop right as
 * the push-through was also starting from a stop, so the shot paused at the door
 * before going in. Now the approach hands its momentum straight to the push.
 */
export function approachP(now: number) {
  const t = clamp01((now - APPROACH.start) / (APPROACH.end - APPROACH.start));
  return t * t;
}

/**
 * 0 at the threshold, 1 through the door and into the dark. This one fades the
 * black over the lens (BlackOut), so it keeps the gentle smoothstep: the black
 * should close smoothly, not snap.
 */
export function throughQ(now: number) {
  return ease((now - THROUGH.start) / (THROUGH.end - THROUGH.start));
}

/**
 * The camera's push through the doorway. Eased OUT only (t*(2-t)): it starts at
 * the speed the approach arrived at, so there is no dead stop at the threshold,
 * then eases to rest in the dark. Kept separate from throughQ so the camera can
 * flow through while the black still closes on its own gentle curve.
 */
export function throughCamQ(now: number) {
  const t = clamp01((now - THROUGH.start) / (THROUGH.end - THROUGH.start));
  return t * (2 - t);
}

/** 0 leaving the crater, 1 gathered into the door. Eased. */
export function leadP(now: number) {
  return ease((now - LEAD.start) / (LEAD.end - LEAD.start));
}

/** Whether the leaf should be open by now. */
export function doorOpen(now: number) {
  return now >= DOOR_OPENS;
}
