"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { dayLight } from "@/lib/descent";

// The mountains behind the door: snow-clad ridges receding to the horizon, so
// the vista has the layered depth the reference does rather than one flat ground
// meeting the sky.
//
// Each ridge is a single standing sheet with its crest cut in the shader: the
// top edge is a jagged alpine profile and everything above it is discarded to
// sky. Below the line the face is snow, bright toward the lit crest and cold
// blue in the shadow at the foot, with dark rock breaking through on the steep
// upper faces where the snow cannot hold. The nearer ones are crisp and dark,
// the farther ones washed toward the cold sky by the haze, which is all
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

  // A ridged fold: sharp peaks and rounded valleys, which is the silhouette of a
  // mountain rather than the round swell of a dune.
  float ridged(float x){ return 1.0 - abs(sin(x)); }

  // The crest line: a few ridged octaves at rising rates, so several sharp peaks
  // and saddles cross the width without repeating. The frequencies are high on
  // purpose: uv.x runs 0..1 across the whole sheet, so a rate of one barely bends
  // it, and it takes tens of cycles to make a skyline of peaks rather than a
  // single swell. Returns the summit height as a fraction of the sheet.
  float crest(float x){
    float s = uSeed;
    return 0.40
      + 0.20 * ridged(x * 8.0 + s)
      + 0.10 * ridged(x * 19.0 + s * 1.7)
      + 0.05 * ridged(x * 43.0 + s * 2.9);
  }

  void main(){
    float c = crest(vUv.x);
    if (vUv.y > c) discard; // sky above the ridge
    float t = vUv.y / c;    // 0 at the foot, 1 at the crest

    // Snow: cold blue in the shadowed foot, climbing to a bright lit crest, with
    // a hard white line right along the ridge where the sun rakes the summit.
    vec3 snowShad = vec3(0.55, 0.64, 0.82);
    vec3 snowLit  = vec3(0.93, 0.96, 1.00);
    vec3 snow = mix(snowShad, snowLit, smoothstep(0.0, 1.0, t));
    float rim = smoothstep(0.88, 1.0, t);
    snow = mix(snow, vec3(1.0), rim * 0.6);

    // Rock breaking through the snow. A torn noise field, revealed on the steep
    // upper faces and pulled back under the very crest and down at the foot, so
    // the dark exposed stone sits in a band below the summit the way it does on a
    // real peak. Its own cold shading, lighter toward the light.
    float rockField = vnoise(vec2(vUv.x * 8.0 + uSeed, t * 4.5)) * 0.7
                    + vnoise(vec2(vUv.x * 21.0 + uSeed * 3.1, t * 11.0)) * 0.3;
    float band = smoothstep(0.24, 0.48, t) * (1.0 - smoothstep(0.90, 1.0, t));
    float rock = smoothstep(0.42, 0.58, rockField) * band;
    // Exposed stone: a mid grey rock, dark enough to read as bare stone against
    // the snow but not the near-black it was, so the peaks do not look scorched.
    vec3 rockCol = mix(vec3(0.15, 0.15, 0.18), vec3(0.36, 0.35, 0.38), t);
    vec3 col = mix(snow, rockCol, rock);

    // the farther the ridge, the more the air washes it toward the sky
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

// Nearest first. A whole range, set back behind the door and climbing to giants
// that haze out into the cold sky. The far ridges are deliberately huge and far:
// a distant peak that is genuinely enormous and genuinely far away is the entire
// trick of scale, because the eye reads the haze as distance and the height as
// size, and the door standing small in front of it inherits how big the world is.
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

  // The pale cold sky the far ridges dissolve into, matching the winter horizon
  // in DaySky, so the mountains recede into the same air the sky is made of.
  const sky = useMemo(() => new THREE.Color(0.80, 0.85, 0.92), []);

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
