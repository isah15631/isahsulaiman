// Howler-based soundscape controller for The Dormant Heart.
// All sounds are soft and synthesized (see scripts/generate-audio.mjs).
import { Howl, Howler } from "howler";

let heartbeat: Howl | null = null;
let crackSound: Howl | null = null;
let shatterSound: Howl | null = null;
let chimeSound: Howl | null = null;
let swellSound: Howl | null = null;
let clickSound: Howl | null = null;
let initialised = false;

function init() {
  if (initialised) return;
  initialised = true;
  Howler.volume(0.9);

  heartbeat = new Howl({
    src: ["/audio/heartbeat.wav"],
    loop: true,
    volume: 0,
    rate: 0.72,
  });
  crackSound = new Howl({ src: ["/audio/crack.wav"], volume: 0.7 });
  shatterSound = new Howl({ src: ["/audio/shatter.wav"], volume: 0.85 });
  chimeSound = new Howl({ src: ["/audio/chime.wav"], volume: 0.6 });
  swellSound = new Howl({ src: ["/audio/swell.wav"], volume: 0.6 });
  clickSound = new Howl({ src: ["/audio/click.wav"], volume: 0.35 });
}

/**
 * iOS and, increasingly, Android start the Web Audio context suspended and
 * only allow it to be resumed from inside a real user gesture. Howler's own
 * unlock does not always win, so resume explicitly on every gesture we get.
 * Cheap and idempotent when the context is already running.
 */
function resumeContext() {
  const ctx = Howler.ctx as AudioContext | undefined;
  if (ctx && ctx.state !== "running") {
    void ctx.resume().catch(() => {});
  }
}

// Called on the first user gesture (the first tap) — unlocks audio.
export function startAudio() {
  init();
  resumeContext();
}

export function setHeartbeat(rate: number, volume: number) {
  if (!heartbeat) return;
  if (volume <= 0) {
    heartbeat.fade(heartbeat.volume(), 0, 600);
    return;
  }
  if (!heartbeat.playing()) heartbeat.play();
  heartbeat.rate(rate);
  heartbeat.fade(heartbeat.volume(), volume, 500);
}

export function playCrack() {
  crackSound?.play();
}

export function playShatter() {
  shatterSound?.play();
}

export function playChime() {
  chimeSound?.play();
}

/** The pull-chain on the bulb. Self-initialises: by the time anyone reaches
 *  the menu the intro has already unlocked audio, but the switch should still
 *  make a sound if it is somehow the first thing they touch. */
export function playClick() {
  init();
  resumeContext();
  clickSound?.play();
}

export function playSwell() {
  swellSound?.play();
}

// The heartbeat softly fades out as the butterflies carry life away.
export function stopHeartbeat() {
  if (!heartbeat) return;
  heartbeat.fade(heartbeat.volume(), 0, 2500);
  window.setTimeout(() => heartbeat?.stop(), 2600);
}

export function fadeEverything() {
  Howler.volume(0.9);
}
