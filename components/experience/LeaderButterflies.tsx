"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { SWARM } from "@/lib/palette";
import { FLOOR_Y } from "@/lib/descent";
import { leadP, throughQ } from "@/lib/approach";
import { FOREWING, HINDWING } from "./Butterfly";

// The swarm that flies off to the distant point and into the mirror.
//
// The mirror is already standing there by the time they arrive; they do not make
// it. They pour off to the far spot and stream into the glass, winking out at its
// surface, so the camera has the swarm to follow and then something to go through.
//
// They are the same butterflies as everywhere else, but here they live in the 3D
// scene rather than as sprites over it, because the shot itself is moving: a DOM
// sprite would have to be chased across the screen frame by frame as the camera
// swings, and a thing standing in the world just stays where it is put and is
// framed for free. It is the same reason the stars are geometry and the doorway
// moves a camera rather than scaling a door.
//
// Each one is a single quad that turns to face the camera and flaps by squashing
// its own width, which is exactly how the flat SVG one flaps: a wingbeat seen
// head on is a horizontal foreshortening, not a rotation. The wing shape is the
// swarm's own outline, baked once to a texture and tinted per butterfly.

// The swarm's wings, painted once to a stamp we can tint and scatter. White wing
// membrane and a dark body on a clear ground, so a plain material colour tints
// the wing and leaves the body dark.
function useWingTexture() {
  return useMemo(() => {
    const S = 128;
    const cv = document.createElement("canvas");
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext("2d");
    if (!ctx) return null;
    ctx.scale(S / 100, S / 100);

    const fore = new Path2D(FOREWING);
    const hind = new Path2D(HINDWING);

    ctx.fillStyle = "#ffffff";
    ctx.fill(fore);
    ctx.fill(hind);
    ctx.save();
    ctx.translate(100, 0);
    ctx.scale(-1, 1);
    ctx.fill(fore);
    ctx.fill(hind);
    ctx.restore();

    // A little dark pooled at the wing roots, the same depth the SVG one carries,
    // so it does not read as a flat paper cutout at size.
    const wash = ctx.createRadialGradient(50, 46, 4, 50, 46, 40);
    wash.addColorStop(0, "rgba(10,12,28,0.55)");
    wash.addColorStop(1, "rgba(10,12,28,0)");
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, 100, 100);
    ctx.globalCompositeOperation = "source-over";

    // the body
    ctx.fillStyle = "rgba(24,16,14,0.95)";
    ctx.fill(
      new Path2D(
        "M50,28 C52,30 53,36 53,50 C53,64 51,73 50,78 C49,73 47,64 47,50 C47,36 48,30 50,28 Z"
      )
    );

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }, []);
}

// The swarm that goes to the door. Enough of them to read as "all of them"
// rather than a chosen few, generated with a fixed seed so the flight is the
// same every load.
//
// They leave the crater spread out and all funnel to the one point, each on its
// own slightly different line and its own slightly different clock, so they arrive
// as a stream rather than a block. And they end AT the mirror and wink out there:
// the butterflies fly into the glass, they do not disperse over the grass.
const COUNT = 42;

type Flyer = {
  color: string;
  size: number;
  start: [number, number, number];
  ctrl: [number, number, number]; // burst point the flight bends through
  end: [number, number, number];
  phase: number;
  flap: number;
  swirl: number; // how wide it corkscrews mid-flight
  turns: number; // how many times it winds around on the way in
  startAt: number; // fraction of the lead when it sets off
  arriveBy: number; // fraction of the lead by which it is inside the door
};

function rand(i: number) {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return x - Math.floor(x);
}

// Built in a function, not at module scope: it reads FLOOR_Y, and a top-level
// const that touches an imported binding is at the mercy of module init order.
// Called from a useMemo, by which point every module is up.
//
// The opening is worked out from the door's OWN position rather than hardcoded,
// because the door does not stand in the same place in the live scene and the
// scratch harness. It sits up on the heap of ice in the live scene, so its mouth
// is well above the sand; aiming at a fixed low point sent the swarm INTO the
// heap under the door instead of through the doorway. DOOR_MID matches the
// opening centre in DesertDoor (H/2 - 0.2) and ApproachCam.
function makeFlyers(doorPos: [number, number, number]): Flyer[] {
  const DOOR_X = doorPos[0];
  const OPEN_MID = doorPos[1] + 0.87;
  const OPEN_Z = doorPos[2] + 0.08; // just in front of the plane, in the mouth
  return Array.from({ length: COUNT }, (_, i) => {
    const a = rand(i + 1);
    const b = rand(i + 53);
    const c = rand(i + 131);
    const d = rand(i + 211);
    const e = rand(i + 307);
    const ang = a * Math.PI * 2;
    const rad = 0.15 + b * 0.35; // tight at the crater, as one burst
    const sx = Math.cos(ang) * rad;
    const sy = -0.6 + b * 0.7;
    const sz = c * 0.5;
    return {
      color: SWARM[i % SWARM.length],
      size: 0.26 + c * 0.16,
      // out of the crater
      start: [sx, sy, sz],
      // Thrown up and WIDE first: the burst fans out into a tall dome all around
      // the crater — some pieces even flung back toward the camera — before the
      // flight curls in toward the door, so the moon reads as bursting open rather
      // than spouting a tidy column.
      ctrl: [
        Math.cos(ang) * (2.2 + c * 2.6) + (d - 0.5) * 0.8,
        1.8 + e * 2.6,
        Math.sin(ang) * (1.7 + b * 2.2) + sz + (a - 0.5) * 0.6,
      ],
      // gathered into the mouth of the opening, kept inside the leaf so the whole
      // stream funnels through the doorway rather than spilling around its edges
      end: [DOOR_X + (c - 0.5) * 0.7, OPEN_MID + (d - 0.5) * 1.3, OPEN_Z + (a - 0.5) * 0.25],
      phase: a * 6.283,
      flap: 8.2 + b * 2.4,
      swirl: 0.5 + b * 0.8,
      turns: 0.5 + c * 1.0,
      startAt: a * 0.22,
      arriveBy: 0.7 + b * 0.28,
    };
  });
}

export default function LeaderButterflies({
  nowRef,
  doorPos,
}: {
  nowRef: MutableRefObject<number>;
  doorPos: [number, number, number];
}) {
  const tex = useWingTexture();
  const { camera } = useThree();
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const flyers = useMemo(
    () => makeFlyers(doorPos),
    [doorPos]
  );

  useEffect(
    () => () => {
      tex?.dispose();
    },
    [tex]
  );

  useFrame((state) => {
    const now = nowRef.current;
    const p = leadP(now);
    const t = state.clock.getElapsedTime();
    const gone = 1 - throughQ(now);

    for (let i = 0; i < flyers.length; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const f = flyers[i];

      // this one's own clock: it sets off at startAt and is inside the door by
      // arriveBy, so the swarm streams in rather than arriving as a block
      const raw = (p - f.startAt) / (f.arriveBy - f.startAt);
      const ep = raw <= 0 ? 0 : raw >= 1 ? 1 : raw * raw * (3 - 2 * raw);

      // a bezier from the crater, up through the burst point, down into the mouth
      // of the door: it fountains out of the break and pours into the opening. The
      // wander damps out as it homes in so the arrival is clean.
      const it = 1 - ep;
      const bx = it * it * f.start[0] + 2 * it * ep * f.ctrl[0] + ep * ep * f.end[0];
      const by = it * it * f.start[1] + 2 * it * ep * f.ctrl[1] + ep * ep * f.end[1];
      const bz = it * it * f.start[2] + 2 * it * ep * f.ctrl[2] + ep * ep * f.end[2];
      // A corkscrew along the flight: widest in the middle and unwinding to
      // nothing at both ends, so each one spirals in and still arrives clean in
      // the mouth of the door. The slow drift on t keeps the whole swarm turning.
      const spin = Math.sin(ep * Math.PI) * f.swirl;
      const sa = ep * f.turns * 6.283 + f.phase + t * 0.6;
      const x = bx + Math.cos(sa) * spin;
      const y = by + Math.sin(sa) * spin * 0.55;
      const z = bz + Math.sin(sa * 0.7) * spin * 0.4;
      m.position.set(x, y, z);

      // face the camera, then flap by squashing width. The wings only ever fold
      // to a bit past half, not to a sliver, so at any instant each one still
      // reads as an open butterfly rather than an edge-on line.
      m.quaternion.copy(camera.quaternion);
      const beat = 0.58 + 0.42 * (0.5 + 0.5 * Math.sin(t * f.flap + f.phase));
      m.scale.set(f.size * beat, f.size, 1);

      // appear leaving the crater, wink out AS it reaches the mirror: the
      // butterflies fly into the glass rather than fading over the grass
      const op =
        Math.min(1, ep / 0.12) * (1 - Math.max(0, (ep - 0.86) / 0.14)) * gone;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = op;
      m.visible = op > 0.01;
    }
  });

  if (!tex) return null;

  return (
    <>
      {flyers.map((f, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          renderOrder={5}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={tex}
            color={f.color}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}
