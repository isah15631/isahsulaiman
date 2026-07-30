"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { SPACE_Y, REST_Y, airDensity, fallSpeed } from "@/lib/descent";

// What it was hanging in.
//
// Stars, and nothing else. There were two planets and a black hole out here and
// they are gone at Isah's request: a moon with a gas giant behind it is a poster
// of space, and the shot is about one object and the dark it is hanging in.
//
// Still geometry, all of it. Nothing in here moves at all — the camera falls past
// it, and that is the entire effect. It is the same reason the doorway moves a
// camera through a perspective instead of scaling a door: parallax you get for
// free by moving is worth more than any amount of animation, and something that
// is genuinely further away behaves like it.
//
// Alive, though, which is a different thing from moving. They breathe at their
// own rates, the slowest of them almost steady, and then they smear into lines
// when the fall gets quick enough to smear them.
//
// It all goes out as the air comes in: by the time there is cloud there are no
// stars, because that is what an atmosphere does to a sky.

const STAR_COUNT = 1500;
const NEAR_STARS = 0.34;

/** Deterministic, so the sky is the same sky on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------- stars

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aRate;
  attribute vec3 aTint;
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  varying vec3 vTint;

  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // Not a uniform flicker. Each one has its own rate, and the slowest of them
    // are almost steady, which is what stops the sky looking like it is wired up.
    float tw = 0.62 + 0.38 * sin(uTime * aRate + aPhase);
    gl_PointSize = clamp(aSize * uScale * tw / max(1.0, -mv.z), 0.7, 4.2);
    vAlpha = tw;
    vTint = aTint;
  }
`;

const STAR_FRAG = /* glsl */ `
  uniform float uFade;
  varying float vAlpha;
  varying vec3 vTint;

  void main(){
    // round, and soft at the edge, so they are points of light and not squares
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    float a = smoothstep(0.5, 0.06, r) * vAlpha * uFade;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vTint, a);
  }
`;

/** The second vertex of each streak, offset along the fall by how fast we go. */
const STREAK_VERT = /* glsl */ `
  attribute float aEnd;
  attribute vec3 aTint;
  attribute float aSize;
  uniform float uStreak;
  varying float vAlpha;
  varying vec3 vTint;

  void main(){
    vec3 p = position;
    p.y += aEnd * uStreak;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vAlpha = aSize;
    vTint = aTint;
  }
`;

const STREAK_FRAG = /* glsl */ `
  uniform float uFade;
  varying float vAlpha;
  varying vec3 vTint;
  void main(){
    gl_FragColor = vec4(vTint, vAlpha * uFade * 0.5);
  }
`;

function Stars({ nowRef }: { nowRef: MutableRefObject<number> }) {
  const dots = useRef<THREE.ShaderMaterial>(null);
  const lines = useRef<THREE.ShaderMaterial>(null);

  const { points, streaks } = useMemo(() => {
    const rand = rng(20260730);
    const pos = new Float32Array(STAR_COUNT * 3);
    const size = new Float32Array(STAR_COUNT);
    const phase = new Float32Array(STAR_COUNT);
    const rate = new Float32Array(STAR_COUNT);
    const tint = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      // A third of them are close enough to rip past; the rest are far enough
      // to barely move, which is the only reason the fall reads as fast.
      //
      // Both the spread and the height of the field are scaled by how far away
      // the star is, because a frame is a cone: a box that fills the shot at
      // thirty units is a thin column of it at a hundred and fifty, and the sky
      // goes empty at exactly the moment the fall is supposed to be at its
      // most violent.
      const near = rand() < NEAR_STARS;
      const z = near ? -8 - rand() * 38 : -55 - rand() * 130;
      const away = 7.2 - z;
      pos[i * 3] = (rand() - 0.5) * 1.7 * away;
      pos[i * 3 + 1] = REST_Y - 18 + rand() * (SPACE_Y + 24 + away);
      pos[i * 3 + 2] = z;
      size[i] = (near ? 22 : 15) * (0.45 + rand() * 0.9);
      phase[i] = rand() * 6.283;
      rate[i] = 0.25 + rand() * 2.1;
      // mostly white, some cold, a few warm. Nothing saturated: it is a sky.
      const w = rand();
      const c =
        w > 0.86
          ? [1, 0.86, 0.72]
          : w > 0.62
            ? [0.78, 0.85, 1]
            : [0.95, 0.96, 1];
      tint[i * 3] = c[0];
      tint[i * 3 + 1] = c[1];
      tint[i * 3 + 2] = c[2];
    }

    const points = new THREE.BufferGeometry();
    points.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    points.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    points.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    points.setAttribute("aRate", new THREE.BufferAttribute(rate, 1));
    points.setAttribute("aTint", new THREE.BufferAttribute(tint, 3));

    // the same stars again as two-vertex segments, for when they start to smear
    const lpos = new Float32Array(STAR_COUNT * 6);
    const lend = new Float32Array(STAR_COUNT * 2);
    const ltint = new Float32Array(STAR_COUNT * 6);
    const lsize = new Float32Array(STAR_COUNT * 2);
    for (let i = 0; i < STAR_COUNT; i++) {
      for (let k = 0; k < 2; k++) {
        lpos[i * 6 + k * 3] = pos[i * 3];
        lpos[i * 6 + k * 3 + 1] = pos[i * 3 + 1];
        lpos[i * 6 + k * 3 + 2] = pos[i * 3 + 2];
        ltint[i * 6 + k * 3] = tint[i * 3];
        ltint[i * 6 + k * 3 + 1] = tint[i * 3 + 1];
        ltint[i * 6 + k * 3 + 2] = tint[i * 3 + 2];
        lend[i * 2 + k] = k;
        lsize[i * 2 + k] = Math.min(1, size[i] / 26);
      }
    }
    const streaks = new THREE.BufferGeometry();
    streaks.setAttribute("position", new THREE.BufferAttribute(lpos, 3));
    streaks.setAttribute("aEnd", new THREE.BufferAttribute(lend, 1));
    streaks.setAttribute("aTint", new THREE.BufferAttribute(ltint, 3));
    streaks.setAttribute("aSize", new THREE.BufferAttribute(lsize, 1));

    return { points, streaks };
  }, []);

  useFrame((state) => {
    const now = nowRef.current;
    const air = 1 - airDensity(now);
    const v = fallSpeed(now);
    // A streak is how far the thing moved while the shutter was open, so it is
    // speed times a frame, which means it appears exactly when it should and
    // never has to be faded in by hand.
    // Nothing smears until it is genuinely moving, so the threshold is a speed
    // and not a time: below a walking pace they are points, and by the time the
    // air arrives they are lines the height of the sphere.
    const smear = Math.max(0, v - 4.5) * 0.115;
    if (dots.current) {
      dots.current.uniforms.uTime.value = state.clock.getElapsedTime();
      dots.current.uniforms.uFade.value = air * Math.max(0, 1 - smear / 0.85);
      dots.current.uniforms.uScale.value = state.size.height * 0.55;
    }
    if (lines.current) {
      lines.current.uniforms.uStreak.value = smear;
      lines.current.uniforms.uFade.value = air * Math.min(1, smear / 0.6);
    }
  });

  return (
    <>
      <points geometry={points} frustumCulled={false}>
        <shaderMaterial
          ref={dots}
          vertexShader={STAR_VERT}
          fragmentShader={STAR_FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uFade: { value: 1 },
            uScale: { value: 400 },
          }}
        />
      </points>
      <lineSegments geometry={streaks} frustumCulled={false}>
        <shaderMaterial
          ref={lines}
          vertexShader={STREAK_VERT}
          fragmentShader={STREAK_FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uStreak: { value: 0 }, uFade: { value: 0 } }}
        />
      </lineSegments>
    </>
  );
}

export default function Space({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  return <Stars nowRef={nowRef} />;
}
