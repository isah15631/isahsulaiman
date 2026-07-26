// Howler-based soundscape controller for The Dormant Heart.
// All sounds are soft and synthesized (see scripts/generate-audio.mjs).
import { Howl, Howler } from "howler";

let heartbeat: Howl | null = null;
let crackSound: Howl | null = null;
let shatterSound: Howl | null = null;
let chimeSound: Howl | null = null;
let swellSound: Howl | null = null;
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
}

// Called on the first user gesture (the first tap) — unlocks audio.
export function startAudio() {
  init();
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
