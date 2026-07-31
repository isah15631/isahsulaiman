"use client";

import { useEffect, useRef, useState } from "react";
import { SWARM } from "@/lib/palette";

// The portrait does not load, it arrives.
//
// The photo is cut into a grid of tiles. Each tile flies in from off screen as
// a STAR, and as it nears its place the star crossfades into the piece of
// photograph it was carrying. They settle into the picture.
//
// They were butterflies, and the swarm is still what the rest of the room is
// made of. A butterfly here was doing the wrong job: it is an object with a
// body and a near wing and a far one, and at tile size, three dozen of them
// crossing each other, all that detail collapses into confetti. A star is the
// opposite kind of drawing — it has no silhouette to lose, it is a point of
// light with a flare on it, and it survives being small because that is the
// size it is supposed to be. The photo is being assembled out of the dark
// above it rather than out of the garden.
//
// So they twinkle instead of flapping, which is the same trick underneath: a
// small atlas of poses per colour, rendered once and ping-ponged, so nothing
// is ever drawn with a path at frame time. The flare breathes in and out
// instead of a wing folding.
//
// And they will come apart again. Touch the portrait and the whole thing
// scatters back into the sky it was made of, holds there, and settles again
// when you let go. That is why the assembly is driven by a clock that can run
// in either direction rather than by elapsed time: there is one timeline, and
// hovering just points it backwards.
//
// Drawn on ONE canvas, for the same reason the eruption is: a few hundred
// transformed blits per frame is cheap, a few hundred animated DOM nodes is
// not. Reduced motion and a failed image both fall back to the plain photo.

const COLORS = SWARM;
/**
 * Roomier than the butterfly's box was, and most of it is deliberately empty.
 *
 * A star is a small hot core and a flare reaching a long way out of it, and the
 * reach is the part that reads. Crop the box to the bright bit and you have
 * drawn a dot.
 */
const SPRITE_PX = 56;
const TWINKLE_FRAMES = 7; // ping-ponged, so 12 distinct poses

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

/** The palette is hex and every one of these needs an alpha on it. */
function rgba(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * One star, at one point in its twinkle.
 *
 * Three passes, and each is doing a job the others cannot:
 *
 * The HALO is what gives it colour. A star's own light is white at the centre
 * whatever colour it is — that is just what a bright thing does to a sensor, or
 * to an eye — so the colour has to live in the falloff around it, not in the
 * core. Hence white at 0 and the palette colour a few percent out.
 *
 * The SPIKES are what make it a star rather than a dot of light. Real ones are
 * an artefact of the lens, not of the object, which is exactly why they are the
 * convention: nobody has ever seen a star with points, and everybody draws them
 * that way. Four long on the axes and four short on the diagonals, added with
 * `lighter` so they brighten where they cross instead of painting over each
 * other, which is how light actually accumulates.
 *
 * The CORE goes on last and blows out to pure white, so there is one hard
 * bright point to hang all that softness on.
 *
 * `twinkle` runs 0..1 and only stretches the flare. Twinkling is not a change
 * of brightness at the source, it is the atmosphere smearing a point around,
 * and the flare growing and shrinking says that far better than a fade would.
 */
function makeStarSprite(color: string, px: number, twinkle: number) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d");
  if (!g) return c;
  const R = px / 2;
  g.translate(R, R);

  const halo = g.createRadialGradient(0, 0, 0, 0, 0, R);
  halo.addColorStop(0, "rgba(255,255,255,0.95)");
  halo.addColorStop(0.07, rgba(color, 0.8));
  halo.addColorStop(0.3, rgba(color, 0.2));
  halo.addColorStop(1, rgba(color, 0));
  g.fillStyle = halo;
  g.beginPath();
  g.arc(0, 0, R, 0, Math.PI * 2);
  g.fill();

  g.globalCompositeOperation = "lighter";
  // A leaf, not a triangle: waisted at the root so the four spikes meet in a
  // cross rather than in a square blob.
  const spike = (len: number, half: number, alpha: number) => {
    const grad = g.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.22, rgba(color, alpha * 0.55));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, -half);
    g.quadraticCurveTo(len * 0.3, -half * 0.28, len, 0);
    g.quadraticCurveTo(len * 0.3, half * 0.28, 0, half);
    g.closePath();
    g.fill();
  };
  const long = R * (0.7 + 0.3 * twinkle);
  for (let i = 0; i < 4; i++) {
    g.save();
    g.rotate((i * Math.PI) / 2);
    spike(long, R * 0.06, 0.9);
    g.restore();
  }
  for (let i = 0; i < 4; i++) {
    g.save();
    g.rotate(Math.PI / 4 + (i * Math.PI) / 2);
    spike(long * 0.4, R * 0.045, 0.5);
    g.restore();
  }

  const core = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.17);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.5, rgba(color, 0.7));
  core.addColorStop(1, rgba(color, 0));
  g.fillStyle = core;
  g.beginPath();
  g.arc(0, 0, R * 0.17, 0, Math.PI * 2);
  g.fill();
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
  /** seconds for one stroke of this one's twinkle */
  twinkle: number;
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
            // Barely any, and that is a change from the butterflies. A
            // butterfly tumbles; a star's spikes come from the lens, so they
            // are the one thing in the sky that does NOT turn. Enough to stop
            // three dozen identical crosses looking stamped, and no more.
            spin: (seeded(i, 3) - 0.5) * 0.5,
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
            // Slower than a wingbeat was, and more spread out. Stars are not in
            // a hurry and they are emphatically not in time with each other.
            twinkle: 0.7 + seeded(i, 8) * 1.3,
          });
        }
      }

      // [colour][twinkle pose], rendered once
      const sprites = COLORS.map((c) =>
        Array.from({ length: TWINKLE_FRAMES }, (_, f) => {
          const k = f / (TWINKLE_FRAMES - 1);
          const eased = 0.5 - 0.5 * Math.cos(k * Math.PI);
          return makeStarSprite(c, Math.round(SPRITE_PX * dpr), eased);
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

          // in flight: star holding its light, then handing over to the photo
          // tile only in the last quarter of the approach
          const settleT = Math.max(0, (t - 0.74) / 0.26);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(x + tileW / 2, y + tileH / 2);
          ctx.rotate(
            p.spin * loose + Math.sin(age * p.w1 * 0.6 + p.ph) * 0.1 * loose
          );

          if (settleT < 1) {
            // JS % is a remainder, not a modulo: it keeps the sign of the
            // dividend. One negative frame delta plus a phase near zero used
            // to put this at -1, and sprites[colour][-1] is undefined, which
            // drawImage rejects. Wrapped into 0..2 before it is read.
            const cycle = ((((age + p.ph) / p.twinkle) % 2) + 2) % 2;
            const fi = Math.floor(
              (cycle < 1 ? cycle : 2 - cycle) * (TWINKLE_FRAMES - 1)
            );
            const s = sprites[p.color][fi];
            // Bigger than the butterfly was, because most of a star sprite is
            // falloff: the bright part of it is a fraction of the box. It
            // shrinks toward tile size as it lands, so the light contracts into
            // the piece of photograph it becomes.
            const size = Math.max(tileW, tileH) * (2.4 - 0.9 * e);
            ctx.globalAlpha = (1 - settleT) * intro;
            // Added, not stacked. Two overlapping stars are two light sources
            // and the sky between them gets brighter; painted normally the
            // nearer one just occludes the further, which is what an opaque
            // object does and a star is not one. Where one passes over a tile
            // that has already landed it spills light onto it, which is also
            // what it should do.
            ctx.globalCompositeOperation = "lighter";
            ctx.drawImage(s, -size / 2, -size / 2, size, size);
            ctx.globalCompositeOperation = "source-over";
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
