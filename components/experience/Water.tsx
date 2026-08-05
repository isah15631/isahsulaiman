"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { BEAT, FLOOR_Y, dayLight, orbY } from "@/lib/descent";
import { SPLASH } from "@/lib/approach";

// A still black lake, and the one ring it lets go of when the moon touches it.
//
// This is what the moon comes down onto now: not concrete, not a field, but a
// sheet of dark water lying flat under the twilight. There is no crash. The
// surface holds the sky upside down, the moon lays a road of light across it as
// it falls, and at the instant of contact a single ripple runs out and dies. The
// moon breaks into the swarm at the waterline (that is the Orb's business), so
// from here all that happens is the water is disturbed once and settles.
//
// There is no reflection pass. The mirror is faked the honest way a still lake
// is: the surface reflects a stylised twilight (a paler band at the grazing
// horizon over a near-black straight down), brightened toward the edges by
// fresnel, with the moon read as a moving glint along the reflected ray. All of
// it fades up on dayLight, the same latch the rest of the world under the cloud
// uses, so above the deck the frame is still the black of space.

// How far the water runs. Large enough to read as reaching the horizon under a
// camera that never climbs far above it.
const REACH = 1200;
// How fast the impact ring travels outward, world units per second.
const RIPPLE_SPEED = 5.5;

const VERT = /* glsl */ `
  varying vec3 vWorld;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG = /* glsl */ `
  uniform float uDay;     // fades the whole surface in under the cloud deck
  uniform float uTime;    // seconds, for the living micro-chop
  uniform float uRipple;  // seconds since the moon touched, negative before
  uniform float uFall;    // seconds since the plume fell back, negative before
  uniform vec3  uMoon;    // world position of the moon, for its road of light
  varying vec3 vWorld;

  float hash(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main(){
    vec3 up = vec3(0.0, 1.0, 0.0);
    float r = length(vWorld.xz);

    // The living surface: a low, slow chop so the mirror breathes rather than
    // sitting dead flat, faded out with distance so the far water settles to
    // glass and never boils into moire.
    float detail = 1.0 / (1.0 + r * 0.05);
    float chopA = vnoise(vWorld.xz * 0.9 + vec2(uTime * 0.10, uTime * 0.07));
    float chopB = vnoise(vWorld.xz * 2.3 - vec2(uTime * 0.13, 0.0));
    float chop = (chopA - 0.5) * 0.6 + (chopB - 0.5) * 0.3;
    vec3 n = normalize(up + vec3(chop, 0.0, chop * 0.7) * 0.12 * detail);

    // The one ring. It expands from the point the moon went in (the origin) and
    // decays as it goes, and it tips the surface normal along its radial slope so
    // the crest catches the sky and the trough darkens.
    float ripple = 0.0;
    if (uRipple > 0.0) {
      float front = uRipple * ${RIPPLE_SPEED.toFixed(2)};
      float band = r - front;
      float crest = sin(band * 3.0);
      float env = exp(-band * band * 0.5) * exp(-uRipple * 0.55);
      ripple = crest * env;
      vec2 rd = r > 0.001 ? vWorld.xz / r : vec2(0.0);
      n = normalize(n + vec3(rd.x, 0.0, rd.y) * ripple * 0.8);
    }

    // The gentler ring where the plume falls back into the lake, from the same
    // point the moon went in. Tighter and quicker than the moon ring, so it reads
    // as the water settling rather than a second crash.
    if (uFall > 0.0) {
      float front = uFall * 3.0;
      float band = r - front;
      float cr = sin(band * 4.0) * exp(-band * band * 1.2) * exp(-uFall * 0.9);
      ripple += cr * 0.6;
      vec2 rd2 = r > 0.001 ? vWorld.xz / r : vec2(0.0);
      n = normalize(n + vec3(rd2.x, 0.0, rd2.y) * cr * 0.5);
    }

    vec3 V = normalize(vWorld - cameraPosition);
    float cosTheta = max(dot(-V, n), 0.0);
    // Fresnel: straight down the water is near-black, at a grazing angle it turns
    // to a mirror and hands back the sky.
    float fres = 0.03 + 0.97 * pow(1.0 - cosTheta, 4.0);

    // The reflected twilight, read off how skyward the bounced ray points.
    vec3 R = reflect(V, n);
    float e = clamp(R.y, 0.0, 1.0);
    vec3 horizon = vec3(0.20, 0.24, 0.34);
    vec3 zenith  = vec3(0.028, 0.043, 0.075);
    vec3 skyRef = mix(horizon, zenith, e);

    // The deep body colour of the water itself, seen where it is not reflecting.
    vec3 body = vec3(0.012, 0.022, 0.038);
    vec3 col = mix(body, skyRef, fres);

    // The moon's road of light: a bright glint wherever the reflected ray meets
    // the moon's direction, so as the moon falls the light runs down the water to
    // meet it. Plus a soft pool of moonlight resting on the point it comes down.
    vec3 toMoon = normalize(uMoon - vWorld);
    float glint = pow(max(dot(R, toMoon), 0.0), 48.0);
    col += vec3(0.86, 0.90, 0.99) * glint * 1.3;
    col += vec3(0.42, 0.52, 0.74) * exp(-r * r * 0.06) * 0.22;

    // The ripple crest catches the pale sky as it runs out.
    col += vec3(0.62, 0.72, 0.95) * max(ripple, 0.0) * 0.5;

    // A hair of dither so the wide dark gradient does not band.
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

    float a = uDay;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`;

export default function Water({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uDay: { value: 0 },
      uTime: { value: 0 },
      uRipple: { value: -1 },
      uFall: { value: -1 },
      uMoon: { value: new THREE.Vector3(0, 0, 0) },
    }),
    []
  );

  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    const now = nowRef.current;
    m.uniforms.uDay.value = dayLight(now);
    m.uniforms.uTime.value = state.clock.getElapsedTime();
    // The ring is a function of the one clock: nothing before the moon lands, then
    // seconds since. No impact flag to plumb through, the same as the rest.
    m.uniforms.uRipple.value = now - BEAT.impact;
    m.uniforms.uFall.value = now - SPLASH.end;
    m.uniforms.uMoon.value.set(0, orbY(now), 0);
  });

  useEffect(() => {
    const m = mat.current;
    return () => m?.dispose();
  }, []);

  return (
    <mesh
      position={[0, FLOOR_Y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={0}
      // Grown large about the origin; it is always under the camera, so never let
      // a stale bounding sphere cull it out of frame.
      frustumCulled={false}
    >
      <planeGeometry args={[REACH, REACH]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
      />
    </mesh>
  );
}
