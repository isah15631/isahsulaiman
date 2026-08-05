import { BEAT } from "./descent";

// What happens after the moon touches the lake.
//
// It sinks under whole and is gone. A single plume of water rises where it went
// in, peaks, and falls straight back into the lake, and the black closes over
// into the dark interior. That is the whole ending: no butterflies out here and
// no door — the moon goes in, the water answers once, and the dark takes over.
//
// One clock, continuous with the fall, so any instant can be seeked and held
// still. Everything here is a function of `now` in seconds from the first frame,
// laid out as offsets from the moment the moon meets the water (BEAT.impact).

// The moon sinks under FAST and short: it arrives with the speed of the fall and
// the water only slows it, so this is brief and its curve is eased-out.
export const SINK = { start: BEAT.impact, end: BEAT.impact + 0.8 };

/** The plume of water thrown up where it went in: rises fast, peaks, falls back. */
export const SPLASH = {
  start: BEAT.impact + 0.05,
  peak: BEAT.impact + 0.55,
  end: BEAT.impact + 1.7,
};

/** The black closes over the water into the dark interior. */
export const BLACK = { start: BEAT.impact + 1.9, end: BEAT.impact + 2.8 };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Smoothstep: eased 0 to 1, flat at both ends so no move starts or stops hard. */
const ease = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
/** Fast off the mark, decelerating: momentum carried in, then drag. */
const easeOut = (x: number) => {
  const t = clamp01(x);
  return 1 - (1 - t) * (1 - t) * (1 - t);
};
/** Slow to start, accelerating: gravity taking hold. */
const easeIn = (x: number) => {
  const t = clamp01(x);
  return t * t;
};

/**
 * 0 sitting on the surface, 1 fully sunk and gone.
 *
 * Eased OUT, not smoothed: the moon does not ease into the water, it hits it with
 * the speed the fall gave it and punches straight under, and the water only drags
 * that speed off as it goes deep. That is the difference between a thing dropped
 * and a thing lowered.
 */
export function sinkP(now: number) {
  return easeOut((now - SINK.start) / (SINK.end - SINK.start));
}

/**
 * The height of the plume: 0 flat, up to 1 at its peak, then back toward 0 as it
 * falls. Thrown up FAST off the impact (eased out) and pulled back down under
 * gravity (eased in), so the water leaps and then drops rather than wafting.
 */
export function splashRise(now: number) {
  if (now <= SPLASH.start) return 0;
  if (now <= SPLASH.peak) {
    return easeOut((now - SPLASH.start) / (SPLASH.peak - SPLASH.start));
  }
  return 1 - easeIn((now - SPLASH.peak) / (SPLASH.end - SPLASH.peak));
}

/** 0 clear, 1 fully black. Eased. */
export function blackQ(now: number) {
  return ease((now - BLACK.start) / (BLACK.end - BLACK.start));
}
