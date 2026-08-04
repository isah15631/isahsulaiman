"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { dayLight } from "@/lib/descent";

// The hills behind the door: rolling green ridges receding to the horizon, so
// the vista has the layered depth the reference does rather than one flat ground
// meeting the sky, while still reading as open grassland rather than mountains.
//
// Each hill is a single standing sheet with its crest cut in the shader: the top
// edge is a soft rolling profile and everything above it is discarded to sky.
// Below the line the face is grass, a warm lit green toward the crest and a cool
// deep green in the shadow at the foot. The nearer ones are crisp and saturated,
// the farther ones washed toward the pale sky by the haze, which is all
// atmospheric perspective is. They belong to the daylit world, so they come up
// with the dawn and stay in frame until the black of the doorway closes over.

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uFade;
  uniform float uSeed;
  uniform float uHaze;
  uniform vec3 uSky;
  varying vec2 vUv;

  float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vnoise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // A rounded swell: smooth crests and broad valleys, the silhouette of a rolling
  // grass hill rather than the sharp saw-tooth of a mountain.
  float roll(float x){ return 0.5 + 0.5 * sin(x); }

  // The crest line: a few rounded octaves at rising rates, so several soft mounds
  // and saddles cross the width without repeating. The frequencies are lower than
  // a mountain skyline would take, so what crosses is a gentle roll rather than a
  // range of peaks. Returns the summit height as a fraction of the sheet.
  float crest(float x){
    float s = uSeed;
    return 0.32
      + 0.15 * roll(x * 3.0 + s)
      + 0.08 * roll(x * 7.0 + s * 1.7)
      + 0.04 * roll(x * 15.0 + s * 2.9);
  }

  void main(){
    float c = crest(vUv.x);
    if (vUv.y > c) discard; // sky above the hill
    float t = vUv.y / c;    // 0 at the foot, 1 at the crest

    // Grass: a cool deep green in the shadowed foot, climbing to a warm lit crest,
    // with a soft brighter line right along the ridge where the low sun rakes it.
    vec3 grassShad = vec3(0.14, 0.24, 0.12);
    vec3 grassLit  = vec3(0.42, 0.58, 0.24);
    vec3 grass = mix(grassShad, grassLit, smoothstep(0.0, 1.0, t));
    float rim = smoothstep(0.86, 1.0, t);
    grass = mix(grass, vec3(0.60, 0.72, 0.34), rim * 0.5);

    // A soft mottle of texture across the hillside, so the face is not a flat wash
    // of one green: broad patches of lighter and darker sward, faded under the
    // crest so the lit rim stays clean.
    float mottle = vnoise(vec2(vUv.x * 9.0 + uSeed, t * 4.0)) * 0.7
                 + vnoise(vec2(vUv.x * 24.0 + uSeed * 3.1, t * 10.0)) * 0.3;
    float band = smoothstep(0.10, 0.55, t) * (1.0 - smoothstep(0.88, 1.0, t));
    vec3 col = grass * (1.0 + (mottle - 0.5) * 0.28 * band);

    // the farther the hill, the more the air washes it toward the sky
    col = mix(col, uSky, uHaze);
    gl_FragColor = vec4(col, uFade);
  }
`;

type Ridge = {
  z: number;
  y: number;
  w: number;
  h: number;
  seed: number;
  haze: number;
};

// Nearest first. A whole run of hills, set back behind the door and receding to
// far swells that haze out into the pale sky. The far ones are deliberately large
// and distant: a swell that is genuinely big and genuinely far away is the whole
// trick of scale, because the eye reads the haze as distance and the height as
// size, and the door standing small in front of it inherits how wide the world is.
const RIDGES: Ridge[] = [
  { z: -18, y: -0.6, w: 66, h: 18, seed: 0.7, haze: 0.12 },
  { z: -28, y: 0.4, w: 100, h: 27, seed: 2.9, haze: 0.28 },
  { z: -42, y: 1.7, w: 146, h: 38, seed: 5.2, haze: 0.46 },
  { z: -62, y: 3.6, w: 212, h: 52, seed: 8.1, haze: 0.63 },
  { z: -88, y: 6.0, w: 300, h: 68, seed: 11.3, haze: 0.80 },
];

export default function DuneRidges({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const mats = useRef<(THREE.ShaderMaterial | null)[]>([]);

  // The pale sky the far hills dissolve into, matching the horizon in DaySky, so
  // the hills recede into the same air the sky is made of.
  const sky = useMemo(() => new THREE.Color(0.72, 0.82, 0.92), []);

  useFrame(() => {
    const now = nowRef.current;
    const fade = dayLight(now);
    for (const m of mats.current) {
      if (m) m.uniforms.uFade.value = fade;
    }
  });

  return (
    <group>
      {RIDGES.map((r, i) => (
        <mesh key={i} position={[0, r.y, r.z]} renderOrder={-5}>
          <planeGeometry args={[r.w, r.h]} />
          <shaderMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            vertexShader={VERT}
            fragmentShader={FRAG}
            transparent
            depthWrite={false}
            uniforms={{
              uFade: { value: 0 },
              uSeed: { value: r.seed },
              uHaze: { value: r.haze },
              uSky: { value: sky },
            }}
          />
        </mesh>
      ))}
    </group>
  );
}
