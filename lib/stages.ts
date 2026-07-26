// The five-tap awakening. Index = number of taps taken (0 = dormant).
// `awaken` drives the heart shader (0 = stone, 1 = fully alive).
// `beatRate` scales the heartbeat playback (slower → stronger).
// `beatVolume` grows as life returns.

export type StageConfig = {
  awaken: number;
  beatRate: number;
  beatVolume: number;
  glow: number; // how much warmth bleeds into the surrounding darkness (0..1)
};

// 0: dormant · 1: first awakening · 2: light returns · 3: vitality · 4: metamorphosis · 5: eruption
export const STAGES: StageConfig[] = [
  { awaken: 0.0, beatRate: 0.0, beatVolume: 0.0, glow: 0.0 }, // dormant — no beat
  { awaken: 0.2, beatRate: 0.72, beatVolume: 0.35, glow: 0.08 }, // ~20% colour, slow soft beat
  { awaken: 0.45, beatRate: 0.85, beatVolume: 0.5, glow: 0.18 }, // more colour, light escapes
  { awaken: 0.68, beatRate: 1.0, beatVolume: 0.65, glow: 0.32 }, // gentle pulse, warm interior
  { awaken: 0.9, beatRate: 1.12, beatVolume: 0.78, glow: 0.5 }, // almost fully alive, vibrant
  { awaken: 1.0, beatRate: 1.2, beatVolume: 0.85, glow: 0.7 }, // eruption
];

export const FINAL_TAP = 5;

// Phases of the whole experience.
export type Phase = "intro" | "eruption" | "silence" | "welcome" | "explore" | "sections";
