// The bridge between the two canvases.
//
// The heart breaks in WebGL; the butterflies fly on a plain 2D canvas. For a
// shard to *become* a butterfly rather than be replaced by one, the 3D scene
// projects each piece to screen space at the instant it turns and hands over
// where it was and how fast it was travelling. The butterfly then picks the
// flight up from exactly there, carrying the shard's momentum with it.

/** One piece of the broken heart, measured in CSS pixels and seconds. */
export type ShardSeed = {
  /** where it is on screen at the moment it changes */
  x: number;
  y: number;
  /** how fast it was flying, in px/s — inherited momentum */
  vx: number;
  vy: number;
  /** seconds after the break at which it changes */
  t: number;
  /** perspective size, ~1 for a shard at the heart's centre plane */
  scale: number;
  /** stable per-shard random */
  seed: number;
};

export type ShardLaunch = {
  /** performance.now() at the instant the heart broke */
  launchAt: number;
  shards: ShardSeed[];
};
