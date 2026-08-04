"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { dayLight } from "@/lib/descent";

// Pollen and seed motes drifting through the frame.
//
// A cloud of small motes kept in a box around the eye, so wherever the camera
// looks the air in front of it is alive with drift. The box is re-centred on the
// camera every frame but never rotated with it, so the motes always sink slowly
// down in the world no matter which way we are turned.
//
// It costs almost nothing: every mote carries its own phase and drift speed and
// does the sinking itself in the vertex shader against one clock, wrapping back
// to the top of the column when it reaches the floor of it, so there is no
// per-frame work on the CPU beyond following the camera. The whole field fades
// up on dayLight, the same as the sky and the ground, so there is nothing in the
// black of space on the way down: it arrives with the meadow it belongs to.

// Half-extents of the column of drifting motes around the eye. Wide and deep
// enough to fill a turning frame, tall enough that the wrap never shows.
const BOX = new THREE.Vector3(22, 16, 22);

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBox;
  attribute vec3 aData; // phase, fall speed, pixel size
  varying float vEdge;

  void main(){
    float phase = aData.x;
    float fall  = aData.y;

    // Fall, and wrap back to the top of the column when it runs off the bottom.
    float H = uBox.y * 2.0;
    float y = mod((position.y - uTime * fall) + uBox.y, H) - uBox.y;

    // A wide, slow sway, so each mote wanders on the air rather than dropping on
    // rails: the loose, buoyant drift of pollen rather than the fall of snow.
    float sx = sin(uTime * 0.4 + phase) * 1.2;
    float sz = cos(uTime * 0.33 + phase * 1.3) * 1.0;
    vec3 pos = vec3(position.x + sx, y, position.z + sz);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    // Nearer flakes are larger; the divide is the perspective doing it. Capped,
    // so a flake right at the lens cannot blow up into a soft wall across the
    // whole frame.
    gl_PointSize = min(aData.z * (200.0 / max(0.5, dist)), 22.0);

    // Fade near the top and bottom of the column so the wrap never pops, and fade
    // right at the eye so a flake crossing the lens vanishes instead of blurring
    // over everything.
    float ends = 1.0 - smoothstep(0.72, 1.0, abs(y) / uBox.y);
    float near = smoothstep(0.8, 4.0, dist);
    vEdge = ends * near;
  }
`;

const FRAG = /* glsl */ `
  uniform float uDay;
  varying float vEdge;

  void main(){
    // A soft round mote out of the square point sprite.
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, r) * vEdge * uDay * 0.8;
    if (a < 0.01) discard;
    // A warm, pale off-white, the colour of seed-down and pollen caught in the
    // sun rather than the cold blue-white of snow.
    gl_FragColor = vec4(vec3(1.0, 0.97, 0.80), a);
  }
`;

export default function Snowfall({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const narrow = size.width < 640;
  const count = narrow ? 260 : 600;

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const data = new Float32Array(count * 3);
    // Deterministic scatter, so it is the same field every mount and never
    // disagrees with a server render (there is none, but keep it honest).
    let seed = 1723;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() * 2 - 1) * BOX.x;
      pos[i * 3 + 1] = (rand() * 2 - 1) * BOX.y;
      pos[i * 3 + 2] = (rand() * 2 - 1) * BOX.z;
      data[i * 3] = rand() * 6.283; // phase
      data[i * 3 + 1] = 0.28 + rand() * 0.5; // drift speed, slow and buoyant
      data[i * 3 + 2] = 0.45 + rand() * 1.0; // size
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aData", new THREE.BufferAttribute(data, 3));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    // Sit the whole column on the eye, but never turn with it, so the snow falls
    // straight down in the world however the camera is pointed.
    if (points.current) points.current.position.copy(state.camera.position);
    if (mat.current) {
      mat.current.uniforms.uTime.value = state.clock.getElapsedTime();
      mat.current.uniforms.uDay.value = dayLight(nowRef.current);
    }
  });

  return (
    <points ref={points} geometry={geometry} renderOrder={3} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uDay: { value: 0 },
          uBox: { value: BOX },
        }}
      />
    </points>
  );
}
