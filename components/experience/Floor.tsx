"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// The concrete, and the hole it puts in it.
//
// There is no light in this scene, so the floor is only ever as bright as the
// thing that broke on it. Before the landing it draws literally zero alpha and
// the frame is pure black: you never see the room, you see the instant the room
// was lit.
//
// What was wrong with it was that nothing said it was a surface. A pool of warm
// light on a flat plane, gone in under two seconds, reads as a glow rather than
// as ground — there was no relief anywhere in it for light to fall across, so
// there was nothing for the eye to call solid. Two things fix that and both are
// geometry rather than paint.
//
// It is dented. A real bowl with a raised lip, displaced in the vertex shader and
// lit through a normal worked out from the slope of that same profile, so the far
// wall of the crater catches the light and the near lip throws a shadow into it.
// That shadow is the entire difference between a mark on the floor and a hole in
// it.
//
// And it is lit from where the thing landed: a point just above the crater, with
// square-law falloff, rather than a painted circle. Which means the rim is lit
// because it faces the light and the ground beyond it goes dark because it does
// not, and all of that comes out of the same three lines.
//
// The mesh is a ring with its radius squared in the vertex shader, so the rings
// bunch up tightly at the centre and spread out toward the edge: all the detail
// is in the crater, where every one of these effects lives, and almost none of it
// is spent on the empty floor thirty units away.

/** Seconds for the light to fade back to black. The dent does not fade. */
const FLASH_SECONDS = 3.4;
/** Seconds for the ring of dust to run out across the floor. */
const DUST_SECONDS = 1.35;
/** Seconds for the hole to be punched. Not instant: it is worth seeing. */
const PUNCH_SECONDS = 0.16;

/** How far the floor runs, and how wide the damage is. */
const FLOOR_FAR = 26;
const CRATER_R = 2.4;
const CRATER_DEPTH = 0.72;

const vertexShader = /* glsl */ `
  uniform float uDent;
  uniform float uFar;
  uniform float uR;
  uniform float uDepth;
  varying vec2 vXY;
  varying vec3 vNormal;
  varying float vR;

  // The profile of the hole: a bowl, and the lip of material shoved up out of it
  // and dumped around the edge. Both fall off to nothing well inside the mesh, so
  // the floor is flat everywhere it is supposed to be.
  float dent(float r){
    float bowl = -uDepth * exp(-pow(r / (uR * 0.46), 2.0));
    float lip = uDepth * 0.52 * exp(-pow((r - uR * 0.64) / (uR * 0.26), 2.0));
    return (bowl + lip) * uDent;
  }

  void main(){
    // The ring is built with a unit radius and squared out to the far edge, so
    // the rings crowd into the middle where the crater is.
    vec2 dir = length(position.xy) > 0.0001 ? normalize(position.xy) : vec2(1.0, 0.0);
    float r = pow(length(position.xy), 2.0) * uFar;
    vec3 p = vec3(dir * r, dent(r));

    // The normal off the slope of the profile itself, which is what lets one
    // wall of the bowl be lit and the other be in shadow.
    float dr = 0.015 * uR;
    float slope = (dent(r + dr) - dent(r)) / dr;
    vec3 n = normalize(vec3(-slope * dir, 1.0));

    vXY = p.xy;
    vR = r;
    vNormal = normalize(normalMatrix * n);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uFlash;
  uniform float uDust;
  uniform float uDent;
  uniform float uR;
  varying vec2 vXY;
  varying vec3 vNormal;
  varying float vR;

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

  float fbm(vec2 p){
    return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1) + 0.125 * vnoise(p * 4.3);
  }

  void main(){
    float d = vR;

    // Concrete: broad blotches for the pour, fine grain for the aggregate, and
    // a sparse scatter of much brighter specks, which is what actually sells
    // it — a smooth grey noise reads as fog, and it is the glinting bits of
    // stone in it that read as a floor.
    float blotch = fbm(vXY * 0.55);
    float grain = fbm(vXY * 9.0);
    float speck = smoothstep(0.86, 1.0, hash(floor(vXY * 40.0)));
    float tone = 0.42 + blotch * 0.5 + grain * 0.22 + speck * 0.5;

    // The damage, and only where there is any. Everything below costs two more
    // noise fields per pixel, and the crater is a couple of units across on a
    // floor that runs for twenty-six — so outside it, skip the lot. The frame
    // this shader first draws anything on is the frame of the impact, which is
    // the single worst moment in the piece to be spending time.
    if (d < uR * 3.3) {
      // Broken concrete inside the crater: coarser, darker, freshly exposed.
      float dug = 1.0 - smoothstep(uR * 0.55, uR * 0.95, d);
      tone *= mix(1.0, 0.72 + fbm(vXY * 5.5) * 0.7, dug * uDent);

      // And cracks, running out from the hole and dying away. Angular noise
      // rather than spokes, so they wander and are not evenly spaced.
      float ang = atan(vXY.y, vXY.x);
      float crack = pow(abs(sin(ang * 2.7 + fbm(vXY * 0.9) * 5.0)), 26.0);
      crack *= smoothstep(uR * 0.5, uR * 0.8, d) * (1.0 - smoothstep(uR, uR * 3.2, d));
      tone *= 1.0 - crack * 0.75 * uDent;
    }

    // One light, sitting LOW over where the thing landed. A point, not a painted
    // circle: the far wall of the bowl faces it and lights up, the near lip turns
    // away from it and does not, and that is the dent.
    //
    // Low on purpose. It was up at head height and the crater came out almost
    // flat, because a light directly above a bowl reaches the whole of it —
    // relief is only visible in the shadows it throws, and a high light throws
    // none. This is the glow of the broken glass lying in the hole, which is
    // where it should have been all along.
    vec3 toLight = vec3(-vXY, 0.42);
    float dist = length(toLight);
    vec3 L = toLight / dist;
    float lam = max(dot(normalize(vNormal), L), 0.0);
    float fall = 1.0 / (1.0 + dist * dist * 0.22);
    // a little ambient off the burning glass so the floor does not go to pure
    // silhouette outside the pool
    float lit = lam * fall * 2.1 + fall * 0.16;

    vec3 warm = mix(vec3(1.0, 0.52, 0.24), vec3(0.55, 0.60, 0.72), smoothstep(0.0, 7.0, d));
    vec3 col = warm * tone * lit;

    // And the dust it kicked up, running outward as a ring and thinning as it
    // goes.
    float ring = exp(-pow((d - uDust * 6.5) / 0.75, 2.0));
    // Ramped in from zero as well as out. Without the leading edge the ring is
    // at full strength the instant uDust is zero — and at zero its radius is
    // zero too, so a bright disc of dust sat under the sphere for the whole
    // fall, before anything had touched anything.
    float dustFade =
      smoothstep(0.0, 0.05, uDust) * (1.0 - smoothstep(0.35, 1.0, uDust));
    col += vec3(0.85, 0.72, 0.60) * ring * dustFade * 0.55;

    float a = clamp(uFlash * lit * 1.5 + ring * dustFade * 0.5, 0.0, 1.0);
    if(a < 0.004) discard;
    gl_FragColor = vec4(col * uFlash + col * ring * dustFade * 0.4, a);
  }
`;

type FloorProps = {
  y: number;
  /** Set true on the frame of impact; the fade runs itself from there. */
  struck: boolean;
};

export default function Floor({ y, struck }: FloorProps) {
  const struckAtRef = useRef<number | null>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        // Nothing is behind it and it must never occlude a shard flying over
        // it, so it takes no part in the depth buffer at all.
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uFlash: { value: 0 },
          uDust: { value: 0 },
          uDent: { value: 0 },
          uFar: { value: FLOOR_FAR },
          uR: { value: CRATER_R },
          uDepth: { value: CRATER_DEPTH },
        },
      }),
    []
  );

  // Rings, not a grid: squared out to the far edge in the vertex shader, so the
  // resolution is spent on the crater and not on empty floor.
  const geometry = useMemo(
    () => new THREE.RingGeometry(0.0001, 1, 128, 72),
    []
  );

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry]
  );

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    if (!struck) return;
    if (struckAtRef.current === null) struckAtRef.current = now;
    const t = now - struckAtRef.current;

    // Hard on, then a long decay. The light arrives with the bang; it does not
    // ramp up to it. Longer than it was, because the whole point is to be able
    // to see the ground it landed on while the swarm is leaving it.
    const k = Math.max(0, 1 - t / FLASH_SECONDS);
    material.uniforms.uFlash.value = k * k;
    material.uniforms.uDust.value = Math.min(1, t / DUST_SECONDS);
    // The hole is punched over a couple of frames and then it stays. It is the
    // one thing in the shot that does not fade: something happened here.
    material.uniforms.uDent.value = Math.min(1, t / PUNCH_SECONDS);
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={0}
    />
  );
}
