"use client";

import { useEffect, useRef, useState } from "react";

// The portrait does not load, it arrives.
//
// The photo is cut into a grid of tiles. Each tile flies in from off screen as
// a butterfly, and as it nears its place the butterfly crossfades into the
// piece of photograph it was carrying. They settle into the picture.
//
// Drawn on ONE canvas, for the same reason the eruption is: a few hundred
// transformed blits per frame is cheap, a few hundred animated DOM nodes is
// not. Reduced motion and a failed image both fall back to the plain photo.

const COLORS = ["#c9304a", "#f2b544", "#2fa980", "#4fd1e0", "#f7f3ea", "#8b6bd1"];
const FOREWING = "M50,44 C54,26 66,10 80,6 C92,3 97,14 94,28 C90,44 72,54 56,52 Z";
const HINDWING = "M54,54 C68,54 82,62 84,74 C86,86 74,92 64,84 C56,77 52,64 54,54 Z";
const SPRITE_PX = 44;

const FLIGHT = 2.3; // seconds a single piece spends in the air
const STAGGER = 1.7; // seconds between the first piece leaving and the last

function seeded(i: number, s: number) {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// easeOutCubic, so pieces arrive settling rather than braking hard
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

function makeButterflySprite(color: string, px: number) {
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
  // right, then mirrored left
  wings();
  g.save();
  g.translate(100, 0);
  g.scale(-1, 1);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const img = new Image();
    img.decoding = "async";

    let raf = 0;
    let cancelled = false;

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
          });
        }
      }

      const sprites = COLORS.map((c) =>
        makeButterflySprite(c, Math.round(SPRITE_PX * dpr))
      );

      const drawSettled = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, offX, offY, drawW, drawH);
      };

      if (reduced) {
        drawSettled();
        return;
      }

      const start = performance.now();
      const total = (STAGGER + FLIGHT) * 1000;

      const frame = (now: number) => {
        const elapsed = (now - start) / 1000;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        for (const p of pieces) {
          const t = Math.max(0, Math.min(1, (elapsed - p.delay) / FLIGHT));
          if (t <= 0) continue;
          const e = ease(t);
          const x = p.fromX + (p.dx - p.fromX) * e;
          const y = p.fromY + (p.dy - p.fromY) * e;

          if (t >= 1) {
            // landed: just the photo tile, no transform, no seams
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalAlpha = 1;
            ctx.drawImage(img, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, tileW, tileH);
            continue;
          }

          // in flight: butterfly holding its shape, then handing over to the
          // photo tile only in the last quarter of the approach
          const settle = Math.max(0, (t - 0.74) / 0.26);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(x + tileW / 2, y + tileH / 2);
          ctx.rotate(p.spin * (1 - e));

          if (settle < 1) {
            const s = sprites[p.color];
            // a shade larger in the air, folding down to tile size as it lands
            const size = Math.max(tileW, tileH) * (1.9 - 0.5 * e);
            ctx.globalAlpha = (1 - settle) * Math.min(1, t / 0.12);
            ctx.drawImage(s, -size / 2, -size / 2, size, size);
          }
          if (settle > 0) {
            ctx.globalAlpha = settle;
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

        if (elapsed * 1000 < total) {
          raf = requestAnimationFrame(frame);
        } else {
          drawSettled();
          settled = true;
        }
      };
      raf = requestAnimationFrame(frame);
    };

    img.src = src;

    // Once assembled the canvas holds a fixed-resolution bitmap, so rotating a
    // phone would leave it stretched. Re-fit and redraw the finished portrait.
    let settled = false;
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
    />
  );
}
