"use client";

import { useEffect, useRef, useState } from "react";
import { FOREWING, HINDWING } from "./Butterfly";

// The portrait does not load, it arrives.
//
// The photo is cut into a grid of tiles, and each tile flies in as a BUTTERFLY —
// the same swarm the rest of the room is made of — and as it nears its place the
// butterfly crossfades into the piece of photograph it was carrying. They settle
// into the picture.
//
// They come in grayscale, because everything in this room waits colourless for
// the one flame: a swarm of grey wings assembling a grey photograph, which then
// warms into colour only when the torch's light reaches the frame (that part is
// PortraitFrame's job, not this canvas's).
//
// They flap rather than twinkle: a small atlas of wing poses per shade, rendered
// once and ping-ponged, so nothing is ever drawn with a live path at frame time.
// The wing opens and folds instead of a flare breathing.
//
// And they will come apart again. Touch the portrait and the whole thing scatters
// back into the swarm it was made of, holds there, and settles again when you let
// go. That is why the assembly is driven by a clock that can run either direction
// rather than by elapsed time: there is one timeline, and hovering just points it
// backwards.
//
// Drawn on ONE canvas: a few hundred transformed blits per frame is cheap, a few
// hundred animated DOM nodes is not. Reduced motion and a failed image both fall
// back to the plain photo.

/**
 * Grey wings, in a narrow spread of shades.
 *
 * Not the swarm's six colours: a crimson butterfly is a butterfly, but this swarm
 * is the grey the room is in before the fire, so they run from a dim slate to a
 * near-white, weighted so the mass of them reads as pale movement against the
 * dark.
 */
const SHADES = [
  "#c7c7cd",
  "#b2b2ba",
  "#dcdce2",
  "#a0a0aa",
  "#cfcfd6",
  "#909099",
];

/** The dark they fly against, lifting as the photograph takes over. */
const SKY: [number, string][] = [
  [0, "#0b0b10"],
  [0.55, "#070709"],
  [1, "#040405"],
];

/** The butterfly body, along x = 50 in the 100-unit wing box. */
const BODY =
  "M50,28 C52,30 53,36 53,50 C53,64 51,73 50,78 C49,73 47,64 47,50 C47,36 48,30 50,28 Z";

const SPRITE_PX = 60;
const FLAP_FRAMES = 7; // ping-ponged, so 12 distinct poses

const FLIGHT = 2.3; // seconds a single piece spends in the air
const STAGGER = 1.7; // seconds between the first piece leaving and the last
const TOTAL = STAGGER + FLIGHT;

// Coming apart is faster than coming together. A swarm bursts and then takes its
// time reassembling, and reversing at the same rate feels like rewound footage.
const ASSEMBLE = 1;
const SCATTER = 2.4;

function seeded(i: number, s: number) {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// easeOutCubic, so pieces arrive settling rather than braking hard
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * One butterfly, at one point in its wingbeat.
 *
 * The flap is a horizontal squash of each wing hinged at the body, exactly the
 * cheap trick the live SVG butterflies use: legible at small sizes, where a real
 * 3D wing rotation just collapses into slivers. `flap` runs 0 (folded, edge-on)
 * to 1 (fully open). The hindwing is carried a shade fainter than the fore, and a
 * pool of shadow sits at the wing root so the membrane has depth rather than
 * reading as a flat cut-out.
 */
function makeButterflySprite(shade: string, px: number, flap: number) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d");
  if (!g) return c;

  const fore = new Path2D(FOREWING);
  const hind = new Path2D(HINDWING);
  const body = new Path2D(BODY);

  // put the 100-unit box centred in the sprite
  const s = px / 100;
  g.translate(px / 2 - 50 * s, px / 2 - 50 * s);
  g.scale(s, s);

  const open = 0.28 + 0.72 * flap;

  const wing = () => {
    // shadow pooled at the root, so the wing is not a flat shade
    const wash = g.createRadialGradient(56, 46, 4, 56, 46, 48);
    wash.addColorStop(0, "rgba(10,10,14,0.5)");
    wash.addColorStop(0.5, "rgba(10,10,14,0.16)");
    wash.addColorStop(1, "rgba(10,10,14,0)");
    g.fillStyle = shade;
    g.fill(fore);
    g.globalAlpha = 0.86;
    g.fill(hind);
    g.globalAlpha = 1;
    g.fillStyle = wash;
    g.fill(fore);
    g.fill(hind);
  };

  // right wings, hinged at the body
  g.save();
  g.translate(50, 0);
  g.scale(open, 1);
  g.translate(-50, 0);
  wing();
  g.restore();

  // left wings: the same shapes mirrored about the body, then flapped
  g.save();
  g.translate(100, 0);
  g.scale(-1, 1);
  g.translate(50, 0);
  g.scale(open, 1);
  g.translate(-50, 0);
  wing();
  g.restore();

  // the body
  g.fillStyle = "rgba(18,16,18,0.92)";
  g.fill(body);
  return c;
}

type Piece = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  fromX: number;
  fromY: number;
  spin: number;
  delay: number;
  color: number;
  /** idle drift while it is off its mark, so a held swarm is never static */
  w1: number;
  w2: number;
  ph: number;
  /** seconds for one full wingbeat of this one */
  flap: number;
};

type Props = {
  src: string;
  alt: string;
  /** grid resolution; cols x rows pieces */
  cols?: number;
  rows?: number;
};

export default function PortraitAssembly({
  src,
  alt,
  cols = 9,
  rows = 12,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);
  // Read by the frame loop rather than by React: this changes on every pointer
  // event and must not re-render a canvas mid-flight.
  const heldRef = useRef(false);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const img = new Image();
    img.decoding = "async";

    let raf = 0;
    let cancelled = false;
    let settled = false;

    img.onerror = () => setFallback(true);
    img.onload = () => {
      if (cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setFallback(true);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = canvas.getBoundingClientRect();
      const w = box.width;
      const h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // cover-fit the photo into the box, exactly like object-cover
      const scale = Math.max(w / img.width, h / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offX = (w - drawW) / 2;
      const offY = 0; // object-top, matching the still version

      const tileW = w / cols;
      const tileH = h / rows;
      const reach = Math.hypot(w, h);

      const pieces: Piece[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const dx = c * tileW;
          const dy = r * tileH;
          // which part of the source image this tile shows
          const sx = (dx - offX) / scale;
          const sy = (dy - offY) / scale;
          const angle = seeded(i, 1) * Math.PI * 2;
          // The canvas clips anything outside the frame, so a piece starting a
          // full diagonal away is invisible for most of its flight. Starting
          // closer means you actually watch them come in.
          const dist = reach * (0.3 + seeded(i, 2) * 0.5);
          pieces.push({
            sx,
            sy,
            sw: tileW / scale,
            sh: tileH / scale,
            dx,
            dy,
            fromX: dx + Math.cos(angle) * dist,
            fromY: dy + Math.sin(angle) * dist,
            // A little tumble on the way, shed as it lands upright into the tile.
            spin: (seeded(i, 3) - 0.5) * 1.1,
            // centre pieces land first, edges drift in after
            delay:
              STAGGER *
              (0.15 * seeded(i, 4) +
                0.85 *
                  (Math.hypot(dx + tileW / 2 - w / 2, dy + tileH / 2 - h / 2) /
                    (reach / 2))),
            color: i % SHADES.length,
            w1: 0.7 + seeded(i, 5) * 1.1,
            w2: 0.6 + seeded(i, 6) * 1.2,
            ph: seeded(i, 7) * Math.PI * 2,
            // Wingbeats are quick and emphatically not in time with each other.
            flap: 0.16 + seeded(i, 8) * 0.16,
          });
        }
      }

      // [shade][flap pose], rendered once
      const sprites = SHADES.map((c) =>
        Array.from({ length: FLAP_FRAMES }, (_, f) => {
          const k = f / (FLAP_FRAMES - 1);
          const eased = 0.5 - 0.5 * Math.cos(k * Math.PI);
          return makeButterflySprite(c, Math.round(SPRITE_PX * dpr), eased);
        })
      );

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      for (const [at, c] of SKY) sky.addColorStop(at, c);

      const drawSettled = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, offX, offY, drawW, drawH);
      };

      if (reduced) {
        drawSettled();
        settled = true;
        return;
      }

      // The single timeline. Everything else reads it.
      let clock = 0;
      let age = 0;
      let first = true;
      let last = performance.now();

      const frame = (now: number) => {
        // Clamped at both ends. rAF reports the frame's START time, which can
        // predate the performance.now() taken when the frame was scheduled in
        // wake(), so this arrives negative and would run the clock backwards.
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        age += dt;

        const target = heldRef.current ? 0 : TOTAL;
        if (clock < target) clock = Math.min(target, clock + dt * ASSEMBLE);
        else if (clock > target) clock = Math.max(target, clock - dt * SCATTER);

        settled = clock >= TOTAL;
        // Only the very first assembly fades up. After that the swarm is already
        // known to be there and fading it in again reads as a glitch.
        const intro = first ? clamp01(clock / 0.4) : 1;
        if (settled) first = false;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // The dark, under everything. It holds at full strength for most of the
        // assembly and only lifts at the end, so the ground does not start
        // draining away while there are still wings crossing it — and by the time
        // it is gone the photograph has covered it anyway.
        const night = 1 - clamp01((clock / TOTAL - 0.58) / 0.42);
        if (night > 0) {
          ctx.globalAlpha = night;
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = 1;
        }

        for (const p of pieces) {
          const t = clamp01((clock - p.delay) / FLIGHT);
          const e = ease(t);
          const loose = 1 - e;

          if (t >= 1) {
            // landed: just the photo tile, no transform, no seams
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalAlpha = 1;
            ctx.drawImage(img, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, tileW, tileH);
            continue;
          }

          // the further off its mark, the more it wanders on its own
          const x =
            p.fromX +
            (p.dx - p.fromX) * e +
            Math.sin(age * p.w1 + p.ph) * 10 * loose;
          const y =
            p.fromY +
            (p.dy - p.fromY) * e +
            Math.cos(age * p.w2 + p.ph * 1.7) * 8 * loose;

          // in flight: a butterfly holding the light, handing over to the photo
          // tile only in the last quarter of the approach
          const settleT = Math.max(0, (t - 0.74) / 0.26);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(x + tileW / 2, y + tileH / 2);
          // face the way it is travelling (head leads), shedding the heading as
          // it lands so it settles square onto its tile
          const heading = Math.atan2(p.dy - y, p.dx - x) + Math.PI / 2;
          ctx.rotate(
            heading * loose +
              p.spin * loose * 0.4 +
              Math.sin(age * p.w1 * 0.6 + p.ph) * 0.14 * loose
          );

          if (settleT < 1) {
            // JS % is a remainder, not a modulo: it keeps the sign of the
            // dividend. One negative frame delta plus a phase near zero used to
            // put this at -1, and sprites[shade][-1] is undefined, which
            // drawImage rejects. Wrapped into 0..2 before it is read.
            const cycle = ((((age + p.ph) / p.flap) % 2) + 2) % 2;
            const fi = Math.floor(
              (cycle < 1 ? cycle : 2 - cycle) * (FLAP_FRAMES - 1)
            );
            const s = sprites[p.color][fi];
            // A shade larger than the tile in flight, contracting toward tile
            // size as it lands so the wing folds down into the piece of photo it
            // becomes.
            const size = Math.max(tileW, tileH) * (1.75 - 0.55 * e);
            ctx.globalAlpha = (1 - settleT) * intro;
            // Opaque objects, not light: they occlude where they cross rather
            // than adding up like the stars did.
            ctx.drawImage(s, -size / 2, -size / 2, size, size);
          }
          if (settleT > 0) {
            ctx.globalAlpha = settleT * intro;
            ctx.drawImage(
              img,
              p.sx,
              p.sy,
              p.sw,
              p.sh,
              -tileW / 2,
              -tileH / 2,
              tileW,
              tileH
            );
          }
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = 1;

        // Keep going while there is anywhere to go, and while it is being held
        // apart, because a held swarm is still flying.
        if (!settled || heldRef.current) {
          raf = requestAnimationFrame(frame);
        } else {
          drawSettled();
          raf = 0;
        }
      };

      wakeRef.current = () => {
        if (raf || cancelled || reduced) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };

      raf = requestAnimationFrame(frame);
    };

    img.src = src;

    // Once assembled the canvas holds a fixed-resolution bitmap, so rotating a
    // phone would leave it stretched. Re-fit and redraw the finished portrait.
    const onResize = () => {
      if (!settled || cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx || !img.complete) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = canvas.getBoundingClientRect();
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      const scale = Math.max(box.width / img.width, box.height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, box.width, box.height);
      ctx.drawImage(img, (box.width - dw) / 2, 0, dw, dh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [src, cols, rows]);

  const hold = (v: boolean) => {
    heldRef.current = v;
    wakeRef.current();
  };

  if (fallback) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="h-full w-full object-cover object-top" />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      role="img"
      aria-label={alt}
      onPointerEnter={() => hold(true)}
      onPointerLeave={() => hold(false)}
      // A phone has no hover, so there it is press and release instead. Guarded
      // on pointerType: a mouse click would otherwise release on mouseup while
      // the cursor is still sitting on the portrait.
      onPointerDown={(e) => e.pointerType !== "mouse" && hold(true)}
      onPointerUp={(e) => e.pointerType !== "mouse" && hold(false)}
      onPointerCancel={() => hold(false)}
    />
  );
}
