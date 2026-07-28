"use client";

import { useEffect, useRef, useState } from "react";
import { SWARM } from "@/lib/palette";

// The portrait does not load, it arrives.
//
// The photo is cut into a grid of tiles. Each tile flies in from off screen as
// a butterfly, and as it nears its place the butterfly crossfades into the
// piece of photograph it was carrying. They settle into the picture.
//
// And they will come apart again. Touch the portrait and the whole thing
// scatters back into the swarm it was made of, holds there, and settles again
// when you let go. That is why the assembly is driven by a clock that can run
// in either direction rather than by elapsed time: there is one timeline, and
// hovering just points it backwards.
//
// Drawn on ONE canvas, for the same reason the eruption is: a few hundred
// transformed blits per frame is cheap, a few hundred animated DOM nodes is
// not. Reduced motion and a failed image both fall back to the plain photo.

const COLORS = SWARM;
const FOREWING = "M50,44 C54,26 66,10 80,6 C92,3 97,14 94,28 C90,44 72,54 56,52 Z";
const HINDWING = "M54,54 C68,54 82,62 84,74 C86,86 74,92 64,84 C56,77 52,64 54,54 Z";
const SPRITE_PX = 44;
const FLAP_FRAMES = 7; // ping-ponged, so 12 distinct poses

const FLIGHT = 2.3; // seconds a single piece spends in the air
const STAGGER = 1.7; // seconds between the first piece leaving and the last
const TOTAL = STAGGER + FLIGHT;

// Coming apart is faster than coming together. A swarm bursts and then takes
// its time reassembling, and reversing at the same rate feels like rewound
// footage.
const ASSEMBLE = 1;
const SCATTER = 2.4;

function seeded(i: number, s: number) {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// easeOutCubic, so pieces arrive settling rather than braking hard
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function makeButterflySprite(color: string, px: number, wingScale: number) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d");
  if (!g) return c;
  const fore = new Path2D(FOREWING);
  const hind = new Path2D(HINDWING);
  g.scale(px / 100, px / 100);
  const wings = () => {
    g.fillStyle = color;
    g.globalAlpha = 0.95;
    g.fill(fore);
    g.globalAlpha = 0.85;
    g.fill(hind);
    g.globalAlpha = 1;
  };
  // right wings, hinged at the body
  g.save();
  g.translate(50, 0);
  g.scale(wingScale, 1);
  g.translate(-50, 0);
  wings();
  g.restore();
  // left wings, mirrored about the body
  g.save();
  g.translate(100, 0);
  g.scale(-1, 1);
  g.translate(50, 0);
  g.scale(wingScale, 1);
  g.translate(-50, 0);
  wings();
  g.restore();
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
            spin: (seeded(i, 3) - 0.5) * 2.4,
            // centre pieces land first, edges drift in after
            delay:
              STAGGER *
              (0.15 * seeded(i, 4) +
                0.85 *
                  (Math.hypot(dx + tileW / 2 - w / 2, dy + tileH / 2 - h / 2) /
                    (reach / 2))),
            color: i % COLORS.length,
            w1: 0.7 + seeded(i, 5) * 1.1,
            w2: 0.6 + seeded(i, 6) * 1.2,
            ph: seeded(i, 7) * Math.PI * 2,
            flap: 0.26 + seeded(i, 8) * 0.22,
          });
        }
      }

      // [colour][flap pose], rendered once
      const sprites = COLORS.map((c) =>
        Array.from({ length: FLAP_FRAMES }, (_, f) => {
          const k = f / (FLAP_FRAMES - 1);
          const eased = 0.5 - 0.5 * Math.cos(k * Math.PI);
          return makeButterflySprite(
            c,
            Math.round(SPRITE_PX * dpr),
            1 - eased * 0.58
          );
        })
      );

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
        // Only the very first assembly fades up. After that the swarm is
        // already known to be there and fading it in again reads as a glitch.
        const intro = first ? clamp01(clock / 0.4) : 1;
        if (settled) first = false;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

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

          // in flight: butterfly holding its shape, then handing over to the
          // photo tile only in the last quarter of the approach
          const settleT = Math.max(0, (t - 0.74) / 0.26);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(x + tileW / 2, y + tileH / 2);
          ctx.rotate(
            p.spin * loose + Math.sin(age * p.w1 * 0.6 + p.ph) * 0.22 * loose
          );

          if (settleT < 1) {
            // JS % is a remainder, not a modulo: it keeps the sign of the
            // dividend. One negative frame delta plus a phase near zero used
            // to put this at -1, and sprites[colour][-1] is undefined, which
            // drawImage rejects. Wrapped into 0..2 before it is read.
            const cycle = ((((age + p.ph) / p.flap) % 2) + 2) % 2;
            const fi = Math.floor(
              (cycle < 1 ? cycle : 2 - cycle) * (FLAP_FRAMES - 1)
            );
            const s = sprites[p.color][fi];
            // a shade larger in the air, folding down to tile size as it lands
            const size = Math.max(tileW, tileH) * (1.9 - 0.5 * e);
            ctx.globalAlpha = (1 - settleT) * intro;
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
