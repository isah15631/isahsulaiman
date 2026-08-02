"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect, type MutableRefObject } from "react";
import * as THREE from "three";
import { BEAT, FLOOR_Y } from "@/lib/descent";

// The powder the moon throws up when it hits the snow.
//
// A one-shot burst flung up and out from the impact on the frame it lands: fine
// crystals and billowing puffs together, arcing under gravity, falling back and
// settling onto the snow, gone inside a couple of seconds. It is the whole of
// what says the ground was SNOW rather than concrete, and it lands on the beat
// the rock does.
//
// Purely a function of (now - impact) in the vertex shader, so there is nothing
// to step and the harness can seek to any instant of the blast and hold it still.

const COUNT = 260;
const NARROW = 120;
const LIFE = 1.9; // seconds the burst is alive
const GRAVITY = 8.5;

const VERT = /* glsl */ `
  uniform float uT;
  attribute vec3 aVel;
  attribute vec2 aData; // size, phase
  varying float vFade;

  void main(){
    float t = max(uT, 0.0);
    // ballistic, then settle onto the snow once it falls back to the ground
    vec3 pos = position + aVel * t + vec3(0.0, -0.5 * ${GRAVITY.toFixed(
      1
    )} * t * t, 0.0);
    pos.y = max(pos.y, ${FLOOR_Y.toFixed(3)} + 0.02);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // Puffs swell a little as the powder expands, capped so a near one cannot
    // fill the frame.
    float grow = 1.0 + t * 0.9;
    gl_PointSize = min(aData.x * grow * (150.0 / max(0.5, -mv.z)), 42.0);

    // Snaps on with the impact, then thins out over the long tail.
    float tin = smoothstep(0.0, 0.03, t);
    float tout = 1.0 - smoothstep(0.55, ${LIFE.toFixed(1)}, t);
    vFade = tin * tout;
  }
`;

const FRAG = /* glsl */ `
  varying float vFade;
  void main(){
    // A soft round puff out of the square point sprite.
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.04, r) * vFade * 0.62;
    if (a < 0.01) discard;
    gl_FragColor = vec4(0.96, 0.98, 1.0, a);
  }
`;

export default function SnowBurst({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const narrow = size.width < 640;
  const count = narrow ? NARROW : COUNT;

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const data = new Float32Array(count * 2);
    // Deterministic, so it is the same burst every mount.
    let seed = 90827;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < count; i++) {
      // spawned in a tight ring at the point of contact
      const ang = rand() * Math.PI * 2;
      const r = rand() * 0.6;
      pos[i * 3] = Math.cos(ang) * r;
      pos[i * 3 + 1] = FLOOR_Y + 0.1 + rand() * 0.2;
      pos[i * 3 + 2] = Math.sin(ang) * r;

      // most of it is a fast upward plume; the rest skirts low and wide
      const skirt = rand();
      const out = 1.0 + skirt * 4.5;
      const up = 3.0 + (1.0 - skirt) * 6.0 + rand() * 1.5;
      const va = rand() * Math.PI * 2;
      vel[i * 3] = Math.cos(va) * out;
      vel[i * 3 + 1] = up;
      vel[i * 3 + 2] = Math.sin(va) * out;

      // a skewed size spread: mostly fine crystals, a few big billowing puffs
      const s = rand();
      data[i * 2] = 1.2 + s * s * 5.5;
      data[i * 2 + 1] = rand() * 6.283;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("aData", new THREE.BufferAttribute(data, 2));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const t = nowRef.current - BEAT.impact;
    const live = t >= 0 && t <= LIFE;
    if (points.current) points.current.visible = live;
    if (mat.current) mat.current.uniforms.uT.value = t;
  });

  return (
    <points ref={points} geometry={geometry} renderOrder={4} frustumCulled={false} visible={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        uniforms={{ uT: { value: -1 } }}
      />
    </points>
  );
}
