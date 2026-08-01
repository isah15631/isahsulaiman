"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { dayLight } from "@/lib/descent";

// The day the moon brings down with it: a cold winter afternoon over snow.
//
// A dome around the camera rather than a sheet in front of it, so the sun and
// the clouds sit in the world and slide the right way as the camera turns for
// the door. It is centred on the camera every frame and never rotated with it,
// which is the whole difference: a screen-locked sun would stay glued to the
// middle of the frame while everything under it moved, and read as painted on
// the lens.
//
// It used to be a Sahara at golden hour. It is snow now, so the light is wrung
// of its heat: a wan low sun with no fire to it, a pale cold wash at the horizon
// climbing to a deep winter blue, and clouds that are the flat grey-white of an
// overcast rather than lit embers. The bones of the sky are the same; only the
// blood has run cold.
//
// The whole thing fades up from nothing on dayLight, so above the cloud deck the
// frame is still the black of space and its stars, and it is only under the deck
// that there is a sky at all. Colour is baked into the dome; only the opacity
// rides the descent, the same discipline the rest of the piece keeps.

// Where the sun sits, low and a little to the left of the way we are heading, so
// it is off to one side of the door rather than straight behind it.
const SUN_DIR = "normalize(vec3(-0.22, 0.085, -1.0))";

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
    vec3 sun = ${SUN_DIR};
    float sd = max(dot(dir, sun), 0.0);

    // The vertical wash: a pale, cold band at the horizon, faintly warmed only
    // right around the low sun, climbing through a soft periwinkle to a deep
    // winter blue overhead. Nothing here is hot: the warmth term barely lifts a
    // touch of rose into the haze around the disc and no further, so the sky
    // reads as a cold clear afternoon rather than a sunset.
    float warmth = pow(sd, 2.4);
    vec3 horizon = mix(vec3(0.80, 0.85, 0.92), vec3(0.96, 0.90, 0.86), warmth);
    vec3 midSky  = vec3(0.52, 0.64, 0.82);
    vec3 highSky = vec3(0.18, 0.30, 0.56);
    vec3 col = mix(horizon, midSky, smoothstep(0.0, 0.22, y));
    col = mix(col, highSky, smoothstep(0.16, 0.70, y));

    // The sun itself: a wan winter disc and a tight cold bloom, deliberately NOT
    // a wide haze, so the light stays a weak source low in the sky and never
    // floods the frame. Paler and dimmer than the desert sun: it has no fire.
    float haze = pow(sd, 30.0) * 0.5 + pow(sd, 260.0) * 1.0;
    float disc = smoothstep(0.9990, 0.9996, sd);
    col += vec3(0.86, 0.90, 0.98) * haze;
    col += vec3(0.97, 0.98, 1.0) * disc * 2.2;

    // Burst rays around the sun. A basis across the sun direction, the angle
    // around it broken into uneven spokes that reach out from the disc. Kept
    // faint and cold, a pale glare through thin air rather than warm shafts.
    vec3 up = abs(sun.y) < 0.98 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 t1 = normalize(cross(up, sun));
    vec3 t2 = cross(sun, t1);
    float ang = atan(dot(dir, t2), dot(dir, t1));
    float rays = 0.5 + 0.5 * sin(ang * 14.0);
    rays *= 0.5 + 0.5 * sin(ang * 5.0 + 1.7);
    col += vec3(0.84, 0.88, 0.96) * rays * pow(sd, 9.0) * 0.10;

    // Clouds: a flat overcast bank across the low-mid sky. Cold grey-white bodies
    // with only the faintest cool lift along the edges that face the sun, so they
    // read as winter cloud rather than lit embers. Two octaves of the field are
    // used, one for the mass and one for the torn rim.
    float band = smoothstep(-0.06, 0.08, y) * (1.0 - smoothstep(0.34, 0.74, y));
    float n = fbm(dir * 3.2 + vec3(0.0, 0.0, 3.1));
    float cloud = smoothstep(0.47, 0.70, n) * band;
    float rim = clamp(smoothstep(0.40, 0.52, n) - smoothstep(0.52, 0.68, n), 0.0, 1.0);
    vec3 cloudBody = vec3(0.60, 0.66, 0.76);
    vec3 cloudLit = mix(vec3(0.82, 0.86, 0.92), vec3(0.98, 0.97, 0.96), warmth);
    vec3 cloudCol = mix(cloudBody, cloudLit, clamp(sd * 1.2 + 0.20, 0.0, 1.0));
    cloudCol += cloudLit * rim * band * (0.4 + sd) * 0.6;
    col = mix(col, cloudCol, cloud);

    // A hair of dither, broken up per pixel. The sky is a wide, smooth, low
    // contrast gradient, which is exactly where 8-bit steps show as banded
    // contours (and read as a faint rainbow once the display and any compression
    // tint the steps). One least-significant bit of noise scatters the step so
    // the gradient stays smooth.
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
