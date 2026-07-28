"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SWARM } from "@/lib/palette";
import { sampleSurface } from "@/lib/heartGeometry";

// They were always in there.
//
// A dozen or so butterflies roaming inside the heart, seen through the glass.
// This is what the tapping is for: you can watch them before you have any way
// to reach them, which is a better reason to hit it than the word "tap".
//
// Placement is the only fiddly part. The heart is star-shaped about its own
// centre, meaning a straight line from the origin to any surface point stays
// inside the solid. So an interior point is just a surface sample pulled a
// fraction of the way back toward the middle, with no containment maths and
// nothing to clamp. Their wander is kept well inside that margin, so none of
// them can ever push through the shell.
//
// Sprites rather than meshes: they always face the camera, so a butterfly is
// legible from any angle the heart happens to have drifted to.

const COUNT = 16;
const FRAMES = 7; // ping-ponged, so 12 distinct poses
const CELL = 64;

const FOREWING = "M50,44 C54,26 66,10 80,6 C92,3 97,14 94,28 C90,44 72,54 56,52 Z";
const HINDWING = "M54,54 C68,54 82,62 84,74 C86,86 74,92 64,84 C56,77 52,64 54,54 Z";
const BODY =
  "M50,28 C52,30 53,36 53,50 C53,64 51,73 50,78 C49,73 47,64 47,50 C47,36 48,30 50,28 Z";

function seeded(i: number, s: number) {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** One strip of flap poses, drawn white so each sprite can be tinted. */
function makeAtlas() {
  const c = document.createElement("canvas");
  c.width = CELL * FRAMES;
  c.height = CELL;
  const g = c.getContext("2d");
  if (!g) return c;
  const fore = new Path2D(FOREWING);
  const hind = new Path2D(HINDWING);
  const body = new Path2D(BODY);

  for (let f = 0; f < FRAMES; f++) {
    const k = f / (FRAMES - 1);
    const eased = 0.5 - 0.5 * Math.cos(k * Math.PI);
    const wing = 1 - eased * 0.6;

    g.save();
    g.translate(f * CELL, 0);
    g.scale(CELL / 100, CELL / 100);

    const wings = () => {
      g.fillStyle = "#ffffff";
      g.globalAlpha = 0.95;
      g.fill(fore);
      g.globalAlpha = 0.78;
      g.fill(hind);
      g.globalAlpha = 1;
    };

    g.save();
    g.translate(50, 0);
    g.scale(wing, 1);
    g.translate(-50, 0);
    wings();
    g.restore();

    g.save();
    g.translate(100, 0);
    g.scale(-1, 1);
    g.translate(50, 0);
    g.scale(wing, 1);
    g.translate(-50, 0);
    wings();
    g.restore();

    g.fillStyle = "rgba(255,255,255,0.9)";
    g.fill(body);
    g.restore();
  }
  return c;
}

/** How hard a direct hit shoves one, and how far the shock carries. */
const SHOCK = 0.17;
const SHOCK_REACH = 0.85;

type Caged = {
  sprite: THREE.Sprite;
  tex: THREE.Texture;
  mat: THREE.SpriteMaterial;
  base: THREE.Vector3;
  amp: THREE.Vector3;
  freq: THREE.Vector3;
  phase: THREE.Vector3;
  flap: number;
  spin: number;
  /** decaying shove away from wherever the glass was last struck */
  push: THREE.Vector3;
};

type Props = {
  geometry: THREE.BufferGeometry;
  /** 0 dormant, 1 fully awake. They stir as it wakes. */
  awaken: number;
  shattering: boolean;
  /** the beat envelope, written by the heart each frame */
  pulse: React.MutableRefObject<number>;
  /** the last place the glass was struck, and a counter so it can be noticed */
  strike: React.MutableRefObject<{ point: THREE.Vector3; seq: number } | null>;
};

export default function CagedButterflies({
  geometry,
  awaken,
  shattering,
  pulse,
  strike,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const seenStrike = useRef(0);

  const caged = useMemo<Caged[]>(() => {
    const atlas = new THREE.CanvasTexture(makeAtlas());
    atlas.colorSpace = THREE.SRGBColorSpace;

    const surface = sampleSurface(geometry, COUNT);
    const out: Caged[] = [];

    for (let i = 0; i < COUNT; i++) {
      // Its own texture so it can hold its own frame offset, sharing the one
      // atlas image underneath.
      const tex = atlas.clone();
      tex.needsUpdate = true;
      tex.repeat.set(1 / FRAMES, 1);

      const mat = new THREE.SpriteMaterial({
        map: tex,
        color: new THREE.Color(SWARM[i % SWARM.length]),
        transparent: true,
        depthWrite: false,
        opacity: 0,
      });

      const sprite = new THREE.Sprite(mat);
      const size = 0.13 + seeded(i, 9) * 0.07;
      sprite.scale.setScalar(size);

      // a surface point, pulled back toward the middle
      const base = new THREE.Vector3()
        .fromArray(surface, i * 3)
        .multiplyScalar(0.26 + seeded(i, 1) * 0.34);

      out.push({
        sprite,
        tex,
        mat,
        base,
        amp: new THREE.Vector3(
          0.07 + seeded(i, 2) * 0.1,
          0.07 + seeded(i, 3) * 0.1,
          0.04 + seeded(i, 4) * 0.06
        ),
        freq: new THREE.Vector3(
          0.35 + seeded(i, 5) * 0.5,
          0.3 + seeded(i, 6) * 0.55,
          0.25 + seeded(i, 7) * 0.4
        ),
        phase: new THREE.Vector3(
          seeded(i, 10) * 6.28,
          seeded(i, 11) * 6.28,
          seeded(i, 12) * 6.28
        ),
        flap: 0.3 + seeded(i, 8) * 0.26,
        spin: (seeded(i, 13) - 0.5) * 0.6,
        push: new THREE.Vector3(),
      });
    }
    return out;
  }, [geometry]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    for (const c of caged) group.add(c.sprite);
    return () => {
      for (const c of caged) {
        group.remove(c.sprite);
        c.mat.dispose();
        c.tex.dispose();
      }
    };
  }, [caged]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    // ---- a new strike ----
    const hit = strike.current;
    if (hit && hit.seq !== seenStrike.current) {
      seenStrike.current = hit.seq;

      // Everything near the impact bolts away from it. The shock falls off
      // with distance, so a tap on one lobe barely disturbs the other.
      for (const c of caged) {
        const d = c.sprite.position.distanceTo(hit.point);
        if (d > SHOCK_REACH) continue;
        const force = SHOCK * (1 - d / SHOCK_REACH);
        c.push
          .copy(c.sprite.position)
          .sub(hit.point)
          .normalize()
          .multiplyScalar(force);
      }
    }

    for (const c of caged) {
      // The shove from the last strike, bleeding off. They drift back on their
      // own, because the wander is written against `base` rather than against
      // wherever they happen to have ended up.
      c.push.multiplyScalar(Math.exp(-dt * 2.6));
      const shocked = c.push.length() / SHOCK;

      // Awake, they range wider and beat faster. Asleep they barely stir.
      const stir = 0.55 + awaken * 0.75;
      // And the beat carries them: on every thump the whole swarm is pushed
      // outward from the middle together. It is the heart they are inside, so
      // when it moves, they move.
      const beat = pulse.current * (0.02 + awaken * 0.045);
      const out = c.base.length() || 1;

      c.sprite.position.set(
        c.base.x * (1 + beat / out) +
          Math.sin(t * c.freq.x * stir + c.phase.x) * c.amp.x * stir +
          c.push.x,
        c.base.y * (1 + beat / out) +
          Math.sin(t * c.freq.y * stir + c.phase.y) * c.amp.y * stir +
          c.push.y,
        c.base.z * (1 + beat / out) +
          Math.sin(t * c.freq.z * stir + c.phase.z) * c.amp.z * stir +
          c.push.z
      );
      c.mat.rotation = Math.sin(t * c.freq.x * 0.7 + c.phase.y) * c.spin;

      // startled wings beat far harder than idling ones
      const period = c.flap / (0.6 + awaken * 0.8 + shocked * 1.6);
      const cycle = ((t + c.phase.z) / period) % 2;
      const k = cycle < 1 ? cycle : 2 - cycle;
      c.tex.offset.x = Math.floor(k * (FRAMES - 1)) / FRAMES;

      // Behind glass they are never crisp, and they are gone the moment it
      // breaks: from there on the shards themselves are the butterflies.
      const want = shattering ? 0 : 0.3 + awaken * 0.45;
      c.mat.opacity += (want - c.mat.opacity) * 0.08;
    }
  });

  return <group ref={groupRef} />;
}
