// Generates the soft soundscape for The Dormant Heart as 16-bit PCM WAV files.
// All sounds are synthesized — no external assets. Deliberately gentle.
//   node scripts/generate-audio.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "audio");
mkdirSync(OUT, { recursive: true });

const SR = 44100;

function buffer(seconds) {
  return new Float32Array(Math.floor(SR * seconds));
}

// Simple one-pole low-pass to take the harshness off noise.
function lowpass(data, cutoff) {
  const dt = 1 / SR;
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = dt / (rc + dt);
  let prev = 0;
  for (let i = 0; i < data.length; i++) {
    prev = prev + alpha * (data[i] - prev);
    data[i] = prev;
  }
  return data;
}

// The matching one-pole high-pass — used to keep noise out of the sub-bass,
// where a phone cannot reproduce it and it only muddies the low tone.
function highpass(data, cutoff) {
  const dt = 1 / SR;
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = rc / (rc + dt);
  let prevIn = 0;
  let prevOut = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    prevOut = alpha * (prevOut + x - prevIn);
    prevIn = x;
    data[i] = prevOut;
  }
  return data;
}

function normalize(data, peak = 0.9) {
  let max = 0;
  for (const v of data) max = Math.max(max, Math.abs(v));
  if (max === 0) return data;
  const g = peak / max;
  for (let i = 0; i < data.length; i++) data[i] *= g;
  return data;
}

function encodeWav(float32) {
  const numSamples = float32.length;
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  let off = 44;
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, float32[i]));
    buf.writeInt16LE((s * 32767) | 0, off);
    off += 2;
  }
  return buf;
}

// Pass a name fragment to rewrite only that file — the noise-based sounds come
// out slightly different every run, so there is no reason to churn the ones
// you are not working on.
const only = process.argv[2];

function save(name, data) {
  if (only && !name.includes(only)) return;
  writeFileSync(join(OUT, name), encodeWav(data));
  console.log("  ✓", name, `(${(data.length / SR).toFixed(2)}s)`);
}

// A single low thump — the muscle contraction of a heartbeat.
//
// Not a bare sine. A 62 Hz tone played back at rate 0.72 sits around 45 Hz,
// which a phone speaker cannot move air at — the beat was simply missing on
// iOS. Given 2f, 3f, 4f instead, the ear reconstructs the missing fundamental
// and still hears it as low, while there is something up the band for a small
// speaker to actually reproduce.
function thump(data, start, freq, amp, decay) {
  const s = Math.floor(start * SR);
  // The fundamental is held back deliberately. It is a big slow wave that eats
  // the peak headroom without being reproducible on most speakers, so giving
  // some of it to the harmonics costs almost nothing where the low end is
  // audible and buys several dB where it is not.
  const partials = [
    [1, 0.62],
    [2, 0.45],
    [3, 0.28],
    [4, 0.16],
    [5, 0.1],
    [7, 0.05],
  ];
  for (let i = 0; i < data.length - s; i++) {
    const t = i / SR;
    const env = Math.exp(-t * decay);
    if (env < 0.0005) break;
    // pitch drops slightly as it decays — gives it a "body" feel
    const f = freq * (1 - 0.3 * (1 - env));
    let v = 0;
    // the upper partials die first, so it is bright at the strike and warm after
    for (const [m, a] of partials) {
      v += Math.sin(2 * Math.PI * f * m * t) * a * Math.exp(-t * decay * (m - 1) * 0.6);
    }
    data[s + i] += v * amp * env * 0.62;
  }
}

// The soft slap of a valve closing — a brief band-limited noise burst. This is
// the part of a heartbeat a handset can carry; the tone underneath is what
// makes it a heart rather than a knock.
function thud(data, start, amp, decay, lo, hi) {
  const len = Math.floor(0.12 * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) n[i] = Math.random() * 2 - 1;
  lowpass(n, hi);
  highpass(n, lo);
  const s = Math.floor(start * SR);
  for (let i = 0; i < len && s + i < data.length; i++) {
    const t = i / SR;
    const env = Math.exp(-t * decay) * (t < 0.002 ? t / 0.002 : 1);
    data[s + i] += n[i] * env * amp;
  }
}

// ---- heartbeat: a soft lub-dub, room to breathe after ----
function heartbeat() {
  const d = buffer(1.1);
  thump(d, 0.0, 62, 0.9, 22); // lub
  thud(d, 0.0, 0.44, 55, 220, 1700); // ...and the slap that carries it on a phone
  thump(d, 0.22, 55, 0.6, 26); // dub (softer)
  thud(d, 0.22, 0.29, 65, 220, 1500);
  return normalize(d, 0.85);
}

// ---- stone crack: a short, dry snap ----
function crack() {
  const d = buffer(0.5);
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 30) * (t < 0.004 ? t / 0.004 : 1);
    d[i] = (Math.random() * 2 - 1) * env;
  }
  lowpass(d, 3500);
  // a tiny low knock underneath
  thump(d, 0, 90, 0.5, 40);
  return normalize(d, 0.7);
}

// ---- shatter: the heart breaking — crumble of many small cracks ----
function shatter() {
  const d = buffer(1.6);
  const knocks = 26;
  for (let k = 0; k < knocks; k++) {
    const start = Math.random() * 0.7;
    const s = Math.floor(start * SR);
    const amp = 0.3 + Math.random() * 0.5;
    const dec = 25 + Math.random() * 25;
    for (let i = 0; i < 0.25 * SR && s + i < d.length; i++) {
      const t = i / SR;
      const env = Math.exp(-t * dec) * (t < 0.003 ? t / 0.003 : 1);
      d[s + i] += (Math.random() * 2 - 1) * env * amp;
    }
  }
  lowpass(d, 4000);
  thump(d, 0, 70, 0.8, 14); // deep opening boom
  return normalize(d, 0.8);
}

// ---- click: the pull-chain on the bulb ----
// A small mechanical tick, not a UI beep: a short resonant body with a little
// noise for the mechanism, and a second softer tick as the chain settles.
function click() {
  const d = buffer(0.16);
  const tick = (start, amp, decay, freq) => {
    const s = Math.floor(start * SR);
    for (let i = 0; i < 0.09 * SR && s + i < d.length; i++) {
      const t = i / SR;
      const env = Math.exp(-t * decay) * (t < 0.0006 ? t / 0.0006 : 1);
      const tone =
        Math.sin(2 * Math.PI * freq * t) * 0.6 +
        Math.sin(2 * Math.PI * freq * 1.6 * t) * 0.22;
      const noise = (Math.random() * 2 - 1) * 0.45;
      d[s + i] += (tone + noise) * env * amp;
    }
  };
  tick(0, 1.0, 120, 2100); // the catch
  tick(0.032, 0.42, 150, 1500); // the chain settling back
  lowpass(d, 5200);
  return normalize(d, 0.42);
}

// A bell partial with exponential decay.
function bell(data, start, freq, amp, decay) {
  const s = Math.floor(start * SR);
  const partials = [
    [1, 1],
    [2.01, 0.5],
    [2.76, 0.35],
    [5.4, 0.18],
  ];
  for (let i = 0; i < data.length - s; i++) {
    const t = i / SR;
    const env = Math.exp(-t * decay);
    if (env < 0.0004) break;
    let v = 0;
    for (const [mult, a] of partials) v += Math.sin(2 * Math.PI * freq * mult * t) * a;
    data[s + i] += v * amp * env;
  }
}

// ---- chime: a gentle two-note bell figure ----
function chime() {
  const d = buffer(2.4);
  bell(d, 0.0, 880, 0.5, 4);
  bell(d, 0.18, 1174.66, 0.4, 4.5); // a rising interval
  return normalize(d, 0.6);
}

// ---- swell: a soft, warm orchestral pad rising and settling ----
function swell() {
  const dur = 6;
  const d = buffer(dur);
  // a warm major chord (C E G + octave), slightly detuned for width
  const notes = [130.81, 164.81, 196.0, 261.63, 329.63];
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    // slow attack (2.2s), long gentle release
    const attack = Math.min(1, t / 2.2);
    const release = Math.min(1, (dur - t) / 2.5);
    const env = Math.pow(attack, 1.5) * Math.pow(release, 1.5);
    let v = 0;
    for (const n of notes) {
      v += Math.sin(2 * Math.PI * n * t);
      v += Math.sin(2 * Math.PI * n * 1.004 * t) * 0.6; // detune shimmer
    }
    // very slow amplitude vibrato for life
    const life = 1 + 0.06 * Math.sin(2 * Math.PI * 0.15 * t);
    d[i] = v * env * life;
  }
  lowpass(d, 2600);
  return normalize(d, 0.55);
}

console.log("Generating soundscape →", OUT);
save("heartbeat.wav", heartbeat());
// crack() and shatter() are no longer emitted. The heart is glass now, and it
// uses real recordings: glass-crack.mp3 and glass-shatter.mp3. The synths are
// kept above for reference, and because they are how the rest of the
// soundscape was made.
// chime() is no longer emitted. It was a bell pair at 880 and 1175 Hz, which
// landed like a game pickup over the shatter. Kept above for reference only.
save("click.wav", click());
save("swell.wav", swell());
console.log("Done.");
