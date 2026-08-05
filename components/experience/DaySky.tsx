"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { dayLight } from "@/lib/descent";

// The twilight the moon comes down into: a still dusk hanging over black water.
//
// A dome around the camera rather than a sheet in front of it, so the moon and
// the clouds sit in the world and slide the right way as the camera turns for
// the door. It is centred on the camera every frame and never rotated with it,
// which is the whole difference: a screen-locked moon would stay glued to the
// middle of the frame while everything under it moved, and read as painted on
// the lens.
//
// It is a clear dusk: a cool pale band low at the horizon climbing through a dusk
// blue to a deep near-black indigo overhead, with the moon hanging low and its
// light laid across the lake below. Nothing warm anywhere in it, so the piece
// stays the cool grey it wants until the torch is lit indoors.
//
// The whole thing fades up from nothing on dayLight, so above the cloud deck the
// frame is still the black of space and its stars, and it is only under the deck
// that there is a sky at all. Colour is baked into the dome; only the opacity
// rides the descent, the same discipline the rest of the piece keeps.

// Where the moon hangs, low and a little to the left of the way we are heading,
// so its light lies across the water off to one side of the door.
const MOON_DIR = "normalize(vec3(-0.22, 0.085, -1.0))";

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main(){
    // Direction from the dome's centre (the camera) out to this vertex. The dome
    // is centred on the camera, so the local position IS that direction.
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uDay;
  varying vec3 vDir;

  // Compact value noise, for the clouds.
  float hash(vec3 p){
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x){
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p){
    float a = 0.55, s = 0.0;
    for (int i = 0; i < 5; i++){ s += a * vnoise(p); p *= 2.02; a *= 0.5; }
    return s;
  }

  void main(){
    vec3 dir = normalize(vDir);
    float y = dir.y;
    vec3 moon = ${MOON_DIR};
    float md = max(dot(dir, moon), 0.0);

    // The vertical wash of a clear dusk: a cool pale band low at the horizon,
    // climbing through a dusk blue to a deep near-black indigo overhead. Nothing
    // warm anywhere in it; the only light in this sky is the moon.
    vec3 horizon = vec3(0.30, 0.35, 0.45);
    vec3 midSky  = vec3(0.10, 0.15, 0.26);
    vec3 highSky = vec3(0.02, 0.035, 0.075);
    vec3 col = mix(horizon, midSky, smoothstep(0.0, 0.22, y));
    col = mix(col, highSky, smoothstep(0.18, 0.72, y));

    // The moon itself: a soft cool disc hanging low over the water with a gentle
    // bloom, the one source in the sky. It is the same moon that fell, back where
    // it came from, so its light still lies across the lake below.
    float bloom = pow(md, 40.0) * 0.6 + pow(md, 900.0) * 1.2;
    float disc = smoothstep(0.9992, 0.9997, md);
    col += vec3(0.72, 0.78, 0.90) * bloom;
    col += vec3(0.95, 0.97, 1.0) * disc * 2.0;

    // Thin drifts of dark cloud across the low sky, catching only the faintest
    // cool edge from the moon so they read as night cloud rather than an overcast.
    float band = smoothstep(0.02, 0.16, y) * (1.0 - smoothstep(0.40, 0.78, y));
    float n = fbm(dir * 2.6 + vec3(0.0, 0.0, 3.1));
    float cloud = smoothstep(0.62, 0.86, n) * band * 0.55;
    vec3 cloudCol = mix(vec3(0.10, 0.13, 0.20), vec3(0.34, 0.38, 0.48),
                        clamp(md * 1.5, 0.0, 1.0));
    col = mix(col, cloudCol, cloud);

    // A hair of dither, broken up per pixel. The sky is a wide, smooth, low
    // contrast gradient, which is exactly where 8-bit steps show as banded
    // contours. One least-significant bit of noise scatters the step so the
    // gradient stays smooth.
    col += (hash(vec3(gl_FragCoord.xy, 0.5)) - 0.5) / 255.0;

    gl_FragColor = vec4(col, uDay);
  }
`;

export default function DaySky({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  useFrame(() => {
    // Follow the camera's position so it is always centred on the eye, but never
    // its rotation, so the sky stays put in the world as the camera turns.
    if (mesh.current) mesh.current.position.copy(camera.position);
    if (mat.current) mat.current.uniforms.uDay.value = dayLight(nowRef.current);
  });

  return (
    <mesh ref={mesh} renderOrder={-10}>
      <sphereGeometry args={[900, 32, 24]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        depthTest={true}
        uniforms={{ uDay: { value: 0 } }}
      />
    </mesh>
  );
}
