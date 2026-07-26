"use client";

import { useEffect, useRef } from "react";

// The eruption swarm, drawn on ONE 2D canvas.
//
// It used to be one animated SVG per butterfly. At this many of them the
// browser had to re-rasterise every wing every frame, which is what made the
// eruption stutter. Here each colour/flap pose is rendered to a small sprite
// once, and the frame loop only blits them — so the cost is a few hundred
// textured quads instead of hundreds of live DOM nodes.
//
// (three.js stays reserved for the heart; this is plain canvas 2D.)

const COLORS = ["#c9304a", "#f2b544", "#2fa980", "#4fd1e0", "#f7f3ea", "#8b6bd1"];
const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // even, non-clumping radial spread
const FLAP_FRAMES = 7; // ping-ponged, so 12 distinct poses
const SPRITE_PX = 56;

// Wings drawn in a 100×100 design space with the body along x = 50.
const FOREWING = "M50,44 C54,26 66,10 80,6 C92,3 97,14 94,28 C90,44 72,54 56,52 Z";
const HINDWING = "M54,54 C68,54 82,62 84,74 C86,86 74,92 64,84 C56,77 52,64 54,54 Z";
const BODY =
  "M50,28 C52,30 53,36 53,50 C53,64 51,73 50,78 C49,73 47,64 47,50 C47,36 48,30 50,28 Z";

type Spec = {
  color: number;
  size: number;
  delay: number;
  duration: number;
  flapPeriod: number;
  flapOffset: number;
  cx: number;
  cy: number;
  ex: number;
  ey: number;
};

function seeded(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Renders one colour at one wing position into an offscreen canvas. */
function makeSprite(color: string, wingScale: number, px: number) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d");
  if (!g) return c;
  const fore = new Path2D(FOREWING);
  const hind = new Path2D(HINDWING);
  const body = new Path2D(BODY);

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

  // left wings — mirrored about the body
  g.save();
  g.translate(100, 0);
  g.scale(-1, 1);
  g.translate(50, 0);
  g.scale(wingScale, 1);
  g.translate(-50, 0);
  wings();
  g.restore();

  g.fillStyle = "rgba(24,16,14,0.9)";
  g.fill(body);
  return c;
}

export default function Butterflies({ count = 160 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let vw = window.innerWidth;
    let vh = window.innerHeight;

    const resize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    // sprite table: [colour][flap pose], rendered once
    const sprites = COLORS.map((c) =>
      Array.from({ length: FLAP_FRAMES }, (_, f) => {
        const k = f / (FLAP_FRAMES - 1);
        const eased = 0.5 - 0.5 * Math.cos(k * Math.PI); // ease in/out
        return makeSprite(c, 1 - eased * 0.58, Math.round(SPRITE_PX * dpr));
      })
    );

    const reach = Math.hypot(vw, vh) * 0.8;
    const specs: Spec[] = Array.from({ length: count }, (_, i) => {
      const r1 = seeded(i + 1);
      const r2 = seeded(i + 101);
      const r3 = seeded(i + 251);
      const angle = i * GOLDEN + (r1 - 0.5) * 0.5;
      const dist = reach * (0.5 + r2 * 0.55);
      const ex = Math.cos(angle) * dist;
      // gentle upward bias — they lift as they carry the colour away
      const ey = Math.sin(angle) * dist - vh * 0.18;
      const perp = (r3 - 0.5) * dist * 0.55;
      return {
        color: i % COLORS.length,
        size: 15 + r1 * 19,
        delay: r1 * 1.3,
        duration: 4.2 + r3 * 2.4,
        flapPeriod: 0.44 + r2 * 0.44,
        flapOffset: r3,
        cx: ex * 0.5 - Math.sin(angle) * perp,
        cy: ey * 0.5 + Math.cos(angle) * perp,
        ex,
        ey,
      };
    });

    const originX = vw * 0.5;
    const originY = vh * 0.52;
    const start = performance.now();
    let raf = 0;

    const draw = (nowMs: number) => {
      const t = (nowMs - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      let alive = false;
      for (let i = 0; i < specs.length; i++) {
        const s = specs[i];
        const p = (t - s.delay) / s.duration;
        if (p <= 0 || p >= 1) {
          if (p <= 0) alive = true; // still waiting to emerge
          continue;
        }
        alive = true;

        // quadratic Bézier from the heart, bowed for a graceful arc
        const u = 1 - p;
        const x = originX + 2 * u * p * s.cx + p * p * s.ex;
        const y = originY + 2 * u * p * s.cy + p * p * s.ey;

        // tangent → banking along the flight path
        const dx = 2 * u * s.cx + 2 * p * (s.ex - s.cx);
        const dy = 2 * u * s.cy + 2 * p * (s.ey - s.cy);
        const rot = Math.atan2(dy, dx) + Math.PI / 2;

        // appear, hold, then fade as they leave
        const a = Math.min(1, p / 0.12) * Math.min(1, (1 - p) / 0.25);
        const scale = 0.45 + Math.min(1, p / 0.15) * 0.55;

        // ping-ponged flap pose
        const cycle = ((t + s.flapOffset) / s.flapPeriod) % 2;
        const fi = Math.floor(
          (cycle < 1 ? cycle : 2 - cycle) * (FLAP_FRAMES - 1)
        );
        const sprite = sprites[s.color][fi];

        const d = s.size * scale;
        ctx.globalAlpha = a;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.drawImage(sprite, -d / 2, -d / 2, d, d);
      }
      ctx.globalAlpha = 1;

      if (alive) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-30"
      aria-hidden
    />
  );
}
