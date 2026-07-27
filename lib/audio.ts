// Howler-based soundscape controller for The Dormant Heart.
// All sounds are soft and synthesized (see scripts/generate-audio.mjs).
import { Howl, Howler } from "howler";

let heartbeat: Howl | null = null;
let crackSound: Howl | null = null;
let shatterSound: Howl | null = null;
let swellSound: Howl | null = null;
let clickSound: Howl | null = null;
let initialised = false;

/**
 * A real heart sound is almost entirely sub-bass, and a handset speaker moves
 * almost no air down there — the beat was not quiet on iOS, it was absent,
 * while the broadband glass recordings came through fine. So there are two
 * mixes and the device picks one. The phone mix carries the beat on harmonics;
 * through real speakers that is a pitched buzz, and through a phone, which
 * filters the fundamental away and leaves only the overtones, it is a thump.
 *
 * Keyed on the input, not the screen: a narrow desktop window has full-range
 * speakers, and a tablet does not. Headphones on a phone will get the phone
 * mix, which is the one case this gets wrong and nothing can detect.
 */
function heartbeatSrc() {
  const handheld =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  return handheld ? "/audio/heartbeat-phone.wav" : "/audio/heartbeat.wav";
}

function init() {
  if (initialised) return;
  initialised = true;
  Howler.volume(0.9);

  heartbeat = new Howl({
    src: [heartbeatSrc()],
    loop: true,
    volume: 0,
    rate: 0.72,
  });
  // Real recordings, not synthesised: the heart is glass, and my stone knocks
  // never sounded like anything breaking.
  crackSound = new Howl({ src: ["/audio/glass-crack.mp3"], volume: 0.8 });
  shatterSound = new Howl({ src: ["/audio/glass-shatter.mp3"], volume: 0.9 });
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
