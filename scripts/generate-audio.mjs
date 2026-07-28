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

// Two mixes of the same beat, because one file cannot serve both.
//
// A real heart sound is almost entirely sub-bass, and a handset speaker moves
// almost no air down there — which is why the beat was missing on iOS while
// the broadband glass recordings came through fine.
//
// The plain mix is the sound as it should be: essentially the bare sine it
// always was, plus a quiet 2nd and 3rd dying faster than the fundamental,
// which is roughly how a real heart sound is built.
//
// The phone mix carries the same beat on harmonics instead. Through real
// speakers it is a pitched buzz — you hear the fundamental fighting its own
// overtones, and it stops being a heart. Through a phone the hardware filters
// that fundamental away and only the overtones arrive, and they land as a
// thump. So it is only ever served to the device it was built for.
const MIX = {
  plain: {
    // [multiple, level, how much faster than the fundamental it dies]
    partials: [
      [1, 1.0, 0],
      [2, 0.2, 0.9],
      [3, 0.08, 1.8],
    ],
    gain: 0.86,
    // dark and quiet — felt under the tone rather than heard
    valve: [
      { amp: 0.11, decay: 60, lo: 130, hi: 620 },
      { amp: 0.075, decay: 70, lo: 130, hi: 560 },
    ],
  },
  phone: {
    partials: [
      [1, 0.62, 0],
      [2, 0.45, 0.6],
      [3, 0.28, 1.2],
      [4, 0.16, 1.8],
      [5, 0.1, 2.4],
      [7, 0.05, 3.6],
    ],
    // the fundamental is held back: it is a big slow wave that eats the peak
    // headroom without ever reaching the ear on the device this is for
    gain: 0.62,
    valve: [
      { amp: 0.44, decay: 55, lo: 220, hi: 1700 },
      { amp: 0.29, decay: 65, lo: 220, hi: 1500 },
    ],
  },
};

// A two-pole resonator: one ringing frequency, used to give noise or a pulse
// train the body of the thing it is supposed to be coming out of.
function resonator(data, fc, bw, gain) {
  const r = Math.exp((-Math.PI * bw) / SR);
  const b1 = 2 * r * Math.cos((2 * Math.PI * fc) / SR);
  const b2 = -r * r;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < data.length; i++) {
    const y = gain * data[i] + b1 * y1 + b2 * y2;
    y2 = y1;
    y1 = y;
    data[i] = y;
  }
  return data;
}

// A single low thump — the muscle contraction of a heartbeat.
function thump(data, start, freq, amp, decay, mix) {
  const s = Math.floor(start * SR);
  for (let i = 0; i < data.length - s; i++) {
    const t = i / SR;
    const env = Math.exp(-t * decay);
    if (env < 0.0005) break;
    // pitch drops slightly as it decays — gives it a "body" feel
    const f = freq * (1 - 0.3 * (1 - env));
    let v = 0;
    for (const [m, a, fade] of mix.partials) {
      v += Math.sin(2 * Math.PI * f * m * t) * a * Math.exp(-t * decay * fade);
    }
    data[s + i] += v * amp * env * mix.gain;
  }
}

// The sound of a valve closing — a brief band-limited noise burst under the
// tone. Dark and quiet in the plain mix; brighter and louder in the phone one,
// where it is most of what actually survives the speaker.
function thud(data, start, { amp, decay, lo, hi }) {
  const len = Math.floor(0.12 * SR);
  const n = new Float32Array(len);
  for (let i = 0; i < len; i++) n[i] = Math.random() * 2 - 1;
  lowpass(n, hi);
  highpass(n, lo);
  const s = Math.floor(start * SR);
  for (let i = 0; i < len && s + i < data.length; i++) {
    const t = i / SR;
    const env = Math.exp(-t * decay) * (t < 0.003 ? t / 0.003 : 1);
    data[s + i] += n[i] * env * amp;
  }
}

// ---- heartbeat: a soft lub-dub, room to breathe after ----
function heartbeat(mix) {
  const d = buffer(1.1);
  thump(d, 0.0, 62, 0.9, 22, mix); // lub
  thud(d, 0.0, mix.valve[0]);
  thump(d, 0.22, 55, 0.6, 26, mix); // dub (softer)
  thud(d, 0.22, mix.valve[1]);
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

// ---- door: a hinge complaining, then the door coming to rest ----
//
// The creak is stick-slip, not a tone. Friction grabs, gives, grabs again, a
// couple of hundred times a second, and every release is a tiny impulse. So it
// is built as a pulse train with irregular amplitudes, run through two wooden
// resonances, which gets far closer than sweeping a filter over noise does.
// The rate rises as the door picks up speed and falls as it slows, because
// that is what the hinge is reporting.
//
// Timed against the swing in Doorway.tsx: 0.95s of movement, then it meets the
// frame and stops.
const SWING = 0.95;

function door() {
  const d = buffer(1.4);

  const cn = Math.floor(SWING * SR);
  const pulses = new Float32Array(cn);
  let phase = 0;
  for (let i = 0; i < cn; i++) {
    const k = i / cn;
    const rate = 112 + 128 * Math.sin(Math.PI * Math.pow(k, 0.8));
    phase += rate / SR;
    if (phase >= 1) {
      phase -= 1;
      pulses[i] = 0.35 + Math.random() * 0.65; // the slip, never twice the same
    }
  }

  // Two formants in parallel rather than in series: in series the second only
  // ever hears what the first let through, and the wood loses its top.
  const lo = resonator(Float32Array.from(pulses), 780, 130, 1);
  const hi = resonator(Float32Array.from(pulses), 1560, 320, 0.5);

  // Levelled on its own before anything else goes in. A resonator has a lot of
  // gain at its own frequency, so the raw creak peaks around twenty; mixed in
  // first and normalised afterwards it flattened the settle to a peak of 0.01,
  // which is silence. The two parts have to be balanced against each other
  // here, not left to the normalise at the end.
  const creak = new Float32Array(cn);
  for (let i = 0; i < cn; i++) {
    const k = i / cn;
    // a hinge does not start at full complaint, and it tails off as it slows
    const env = Math.min(1, k / 0.12) * Math.min(1, (1 - k) / 0.3);
    creak[i] = (lo[i] + hi[i]) * env;
  }
  normalize(creak, 0.42);

  const start = Math.floor(0.06 * SR);
  for (let i = 0; i < cn; i++) d[start + i] += creak[i];

  // and the door reaching the end of its travel. Not a slam: it is being
  // pushed open, so this is the weight of it settling.
  thump(d, SWING + 0.07, 78, 0.7, 26, MIX.plain);
  thud(d, SWING + 0.07, { amp: 0.45, decay: 42, lo: 150, hi: 2600 });

  return normalize(d, 0.7);
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
save("heartbeat.wav", heartbeat(MIX.plain));
save("heartbeat-phone.wav", heartbeat(MIX.phone));
// crack() and shatter() are no longer emitted. The heart is glass now, and it
// uses real recordings: glass-crack.mp3 and glass-shatter.mp3. The synths are
// kept above for reference, and because they are how the rest of the
// soundscape was made.
// chime() is no longer emitted. It was a bell pair at 880 and 1175 Hz, which
// landed like a game pickup over the shatter. Kept above for reference only.
save("click.wav", click());
// door() is not emitted yet. The creak is built and timed against the swing,
// but it has not been signed off by ear, so nothing plays it and the asset is
// not shipped. Add the save back and re-wire playDoor in lib/audio.ts to pick
// it up again:  node scripts/generate-audio.mjs door
save("swell.wav", swell());
console.log("Done.");
