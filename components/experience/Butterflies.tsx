"use client";

import { useEffect, useRef } from "react";
import type { ShardLaunch } from "@/lib/shards";
import { SWARM } from "@/lib/palette";

// The eruption swarm, drawn on ONE 2D canvas.
//
// Nothing escapes from inside the sphere. Every butterfly here IS a piece of it: the
// 3D scene hands over each piece's screen position and velocity at the moment
// it flares out, and one butterfly opens in its place, carrying that same
// momentum before it settles into flight of its own.
//
// It used to be one animated SVG per butterfly. At this many of them the
// browser had to re-rasterise every wing every frame, which is what made the
// eruption stutter. Here each colour/flap pose is rendered to a small sprite
// once, and the frame loop only blits them — so the cost is a few hundred
// textured quads instead of hundreds of live DOM nodes.
//
// (three.js stays reserved for the sphere; this is plain canvas 2D.)

const COLORS = SWARM;
const FLAP_FRAMES = 7; // ping-ponged, so 12 distinct poses
const SPRITE_PX = 56;
/** How long the shard's momentum takes to bleed off into a butterfly's own flight. */
const DAMP = 0.42;
/** Slack around the frame — a butterfly born just outside still flies into view. */
const EDGE = 60;

// Wings drawn in a 100×100 design space with the body along x = 50.
const FOREWING = "M50,44 C54,26 66,10 80,6 C92,3 97,14 94,28 C90,44 72,54 56,52 Z";
const HINDWING = "M54,54 C68,54 82,62 84,74 C86,86 74,92 64,84 C56,77 52,64 54,54 Z";
const BODY =
  "M50,28 C52,30 53,36 53,50 C53,64 51,73 50,78 C49,73 47,64 47,50 C47,36 48,30 50,28 Z";

type Spec = {
  color: number;
  size: number;
  /** when the shard it came from turned, in seconds after the break */
  born: number;
  life: number;
  flapPeriod: number;
  flapOffset: number;
  /** the shard's parting position and momentum */
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  /** its own cruise, once the throw has bled off */
  fx: number;
  fy: number;
  /** lateral drift across the line of flight */
  px: number;
  py: number;
  wander: number;
  wanderW: number;
  wanderPh: number;
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

  // Where the stars sit in the wing, in its own 100-unit space. The same four
  // the svg butterflies wear, so the swarm that erupts and the swarm that
  // crosses the room later are recognisably the same creature.
  const GLINTS: [number, number, number, number][] = [
    [78, 16, 2.6, 0.95],
    [88, 30, 1.7, 0.72],
    [66, 33, 1.9, 0.85],
    [72, 71, 1.8, 0.7],
  ];

  // Deep at the root and gone by the rim, so the colour survives out at the edge
  // where a wing is thin and the light is coming through it.
  const wash = g.createRadialGradient(56, 46, 0, 56, 46, 46);
  wash.addColorStop(0, "rgba(8,10,28,0.82)");
  wash.addColorStop(0.45, "rgba(13,18,48,0.55)");
  wash.addColorStop(1, "rgba(19,26,60,0)");

  const wings = () => {
    g.fillStyle = color;
    g.globalAlpha = 0.95;
    g.fill(fore);
    g.globalAlpha = 0.85;
    g.fill(hind);
    g.globalAlpha = 1;

    // The sky inside the membrane. Clipped to the wings so it cannot spill, and
    // baked into the sprite, so a few hundred of these cost exactly what a few
    // hundred flat ones did.
    g.save();
    g.beginPath();
    g.clip(fore);
    g.fillStyle = wash;
    g.fillRect(40, 0, 64, 100);
    g.restore();
    g.save();
    g.clip(hind);
    g.fillStyle = wash;
    g.fillRect(40, 0, 64, 100);
    g.restore();

    g.save();
    g.beginPath();
    g.fillStyle = "#ffffff";
    for (const [x, y, r, a] of GLINTS) {
      g.globalAlpha = a;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
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

/**
 * The sprite table: one small canvas per colour per wing position.
 *
 * Cached at module scope and warmed long before it is wanted. Six colours and
 * seven poses is forty-two canvases to allocate and draw, and it used to happen
 * inside the effect that mounts this component — which mounts on the frame the
 * sphere hits the floor. Forty-two allocations, several hundred path fills and a
 * gradient each, all synchronous, on the one frame of the piece that everything
 * else is also happening on.
 *
 * Nothing about it needs to wait for the impact. It only depends on the pixel
 * ratio, so it is built during the fall instead, while there is nothing else to
 * do, and by the time the glass breaks it is already sitting here.
 */
const TABLES = new Map<number, HTMLCanvasElement[][]>();

/**
 * The one clamp. Both the canvas and the sprite table have to agree on it, or
 * the table is warmed under one key and asked for under another, and all the
 * warming buys is a second copy built at the worst possible moment.
 */
export function swarmDpr() {
  return Math.min(window.devicePixelRatio || 1, 1.5);
}

export function spriteTable(dpr = swarmDpr()) {
  const key = Math.round(dpr * 100);
  const cached = TABLES.get(key);
  if (cached) return cached;
  const table = COLORS.map((c) =>
    Array.from({ length: FLAP_FRAMES }, (_, f) => {
      const k = f / (FLAP_FRAMES - 1);
      const eased = 0.5 - 0.5 * Math.cos(k * Math.PI); // ease in/out
      return makeSprite(c, 1 - eased * 0.58, Math.round(SPRITE_PX * dpr));
    })
  );
  TABLES.set(key, table);
  return table;
}

export default function Butterflies({ launch }: { launch: ShardLaunch }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = swarmDpr();
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

    const sprites = spriteTable(dpr);

    // One butterfly per shard, at that shard's own moment and heading.
    const specs: Spec[] = launch.shards.map((sh, i) => {
      const r1 = seeded(i + 1);
      const r2 = seeded(i + 101);
      const r3 = seeded(i + 251);

      // It keeps going roughly the way it was thrown, but a wing has a mind of
      // its own — so the heading bends, and the flight lifts.
      const angle = Math.atan2(sh.vy, sh.vx) + (r1 - 0.5) * 0.85;
      const cruise = 95 + r2 * 115;

      return {
        color: Math.min(COLORS.length - 1, Math.floor(sh.seed * COLORS.length)),
        size: (16 + r1 * 17) * (0.78 + Math.min(1.6, sh.scale) * 0.3),
        born: sh.t,
        life: 4.4 + r3 * 2.3,
        flapPeriod: 0.42 + r2 * 0.44,
        flapOffset: r3,
        x0: sh.x,
        y0: sh.y,
        vx: sh.vx,
        vy: sh.vy,
        fx: Math.cos(angle) * cruise,
        fy: Math.sin(angle) * cruise - (60 + r1 * 85),
        px: -Math.sin(angle),
        py: Math.cos(angle),
        wander: 16 + r2 * 26,
        wanderW: 1.3 + r3 * 1.7,
        wanderPh: r1 * Math.PI * 2,
      };
    })
      // On a portrait phone the spray of glass reaches past the sides, so some
      // pieces have crossed the edge by the time their moment comes. Their
      // butterflies would be born outside the frame and fly further out —
      // never seen, and never worth a sprite on the device that can least
      // afford one.
      // On whichever axis it is already off the frame, it has to be heading
      // back in to be worth drawing.
      .filter((s) => {
        const okX =
          s.x0 >= -EDGE && s.x0 <= vw + EDGE ? true : s.x0 < 0 ? s.fx > 0 : s.fx < 0;
        const okY =
          s.y0 >= -EDGE && s.y0 <= vh + EDGE ? true : s.y0 < 0 ? s.fy > 0 : s.fy < 0;
        return okX && okY;
      });

    const start = launch.launchAt;
    let raf = 0;

    const draw = (nowMs: number) => {
      const t = (nowMs - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      let alive = false;
      for (let i = 0; i < specs.length; i++) {
        const s = specs[i];
        const age = t - s.born;
        if (age <= 0 || age >= s.life) {
          if (age <= 0) alive = true; // its shard is still in the air
          continue;
        }
        alive = true;

        // The throw bleeds off exponentially while the butterfly's own flight
        // takes over, so the first moments still read as the shard's arc.
        const e = Math.exp(-age / DAMP);
        const carry = DAMP * (1 - e);
        const ramp = Math.min(1, age / 0.5); // no wobble until the wings are open
        const w = Math.sin(age * s.wanderW + s.wanderPh) * s.wander * ramp;
        const x = s.x0 + s.vx * carry + s.fx * age + s.px * w;
        const y = s.y0 + s.vy * carry + s.fy * age + s.py * w;

        // tangent → banking along the flight path
        const wd = Math.cos(age * s.wanderW + s.wanderPh) * s.wander * s.wanderW * ramp;
        const dx = s.vx * e + s.fx + s.px * wd;
        const dy = s.vy * e + s.fy + s.py * wd;
        const rot = Math.atan2(dy, dx) + Math.PI / 2;

        // open out of the flare, hold, then fade as they leave
        const p = age / s.life;
        const a = Math.min(1, age / 0.13) * Math.min(1, (1 - p) / 0.25);
        const scale = 0.35 + Math.min(1, age / 0.24) * 0.65;

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
  }, [launch]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-30"
      aria-hidden
    />
  );
}
