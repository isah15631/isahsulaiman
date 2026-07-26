"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uAwaken;
  uniform float uPulse;
  uniform float uShatter;
  attribute vec3 aCentroid;
  attribute float aRandom;
  attribute vec3 aChunkCentre;
  attribute float aChunkRandom;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vRandom;
  varying float vChunk;

  mat3 rotAxis(vec3 axis, float angle){
    float s = sin(angle);
    float c = cos(angle);
    float t = 1.0 - c;
    axis = normalize(axis);
    return mat3(
      t*axis.x*axis.x + c,        t*axis.x*axis.y - s*axis.z, t*axis.x*axis.z + s*axis.y,
      t*axis.x*axis.y + s*axis.z, t*axis.y*axis.y + c,        t*axis.y*axis.z - s*axis.x,
      t*axis.x*axis.z - s*axis.y, t*axis.y*axis.z + s*axis.x, t*axis.z*axis.z + c
    );
  }

  void main(){
    vPos = position;
    vRandom = aRandom;
    vChunk = aChunkRandom;
    vec3 p = position;
    vec3 nrm = normal;

    // subtle living swell, synced to the heartbeat
    p += normalize(position) * (uPulse * uAwaken * 0.045);

    if(uShatter > 0.0001){
      // Rotate and translate about the CHUNK's centre, not the face's, so
      // every triangle in a chunk travels together as one slab of stone.
      vec3 dir = normalize(aChunkCentre + 0.0001);
      float r = aChunkRandom;
      vec3 axis = normalize(vec3(r - 0.5, r * 0.7 - 0.2, 0.5 - r));
      // slabs tumble slowly — fast spin reads as debris, not rock
      mat3 rot = rotAxis(axis, uShatter * (0.7 + r * 1.6));
      p = aChunkCentre + rot * (p - aChunkCentre);
      vec3 offset = dir * uShatter * (0.9 + r * 1.7);
      offset.y -= uShatter * uShatter * (0.9 + r * 1.1); // gentle gravity
      p += offset;
      nrm = rot * nrm;
    }

    vNormal = normalize(normalMatrix * nrm);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uAwaken;
  uniform float uPulse;
  uniform float uShatter;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vRandom;
  varying float vChunk;

  // Trig-free hash — cheap enough to call 27 times per fragment.
  vec3 hash3(vec3 p){
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  // 3D Voronoi. Returns (nearest distance, second nearest, cell random).
  // The gap between the two distances is ~0 exactly on a cell boundary, which
  // gives us irregular polygonal PLATES with seams between them — the way
  // stone actually fractures. Ridged noise gave thin splintery lines instead.
  vec3 voronoi(vec3 x){
    vec3 n = floor(x);
    vec3 f = x - n;
    float f1 = 8.0;
    float f2 = 8.0;
    float id = 0.0;
    for(int k=-1;k<=1;k++){
      for(int j=-1;j<=1;j++){
        for(int i=-1;i<=1;i++){
          vec3 b = vec3(float(i), float(j), float(k));
          vec3 h = hash3(n + b);
          vec3 r = b - f + h;
          float d = dot(r, r);
          if(d < f1){ f2 = f1; f1 = d; id = h.x; }
          else if(d < f2){ f2 = d; }
        }
      }
    }
    return vec3(sqrt(f1), sqrt(f2), id);
  }

  // --- Ashima 3D simplex noise ---
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  // Two octaves. A single octave is cheaper still, but it lets the simplex
  // lattice show through as a regular quilted pattern.
  float fbm2(vec3 p){
    return 0.5 * snoise(p) + 0.25 * snoise(p * 2.0);
  }

  void main(){
    vec3 nrm = normalize(vNormal);
    float fres = pow(1.0 - abs(nrm.z), 2.5);

    // ---- while shattering ----
    // The heart is fully alive by now, so skip the crack maths entirely and
    // settle for one octave — the pieces are flying apart and fading, so the
    // detail is invisible. This is the frame budget the butterflies need.
    if(uShatter > 0.0001){
      float tone = snoise(vPos * 1.8) * 0.5 + 0.5;

      // Read as STONE breaking, not warm confetti: mostly grey rock with the
      // heart's light caught on the broken edges.
      vec3 rock = vec3(0.30, 0.285, 0.265) * (0.75 + 0.5 * tone);
      vec3 lit = mix(vec3(1.0, 0.30, 0.16), vec3(1.0, 0.74, 0.32), tone);
      vec3 c = mix(rock, lit, 0.28);
      c += vec3(1.0, 0.5, 0.25) * fres * 0.5 * (0.6 + uPulse * 0.4);

      // Fade per CHUNK, so a slab dissolves as a whole rather than eroding
      // unevenly across its own faces.
      float a = 1.0 - smoothstep(0.45, 1.0, uShatter * (0.55 + vChunk * 0.85));
      if(a < 0.02) discard;
      gl_FragColor = vec4(c, a);
      return;
    }

    float grain = fbm2(vPos * 3.3);

    // ---- cracks (only while the heart is still whole) ----
    // Seams run along Voronoi cell boundaries, so the surface reads as
    // irregular slabs of rock divided by fissures — and the seams sit roughly
    // where the heart will actually break apart.
    // Raw Voronoi gives tidy convex cells, which reads as crazy-paving rather
    // than broken stone. Warping the space first makes the plates irregular and
    // organic; the high-frequency term then frays the seams so no edge is a
    // clean mathematical curve.
    float warp = fbm2(vPos * 1.7);
    vec3 q = vPos * 3.0 + vec3(warp, warp * 0.75, -warp) * 0.6;
    vec3 vor = voronoi(q);
    float seam = vor.y - vor.x;   // → 0 at a plate boundary
    seam += snoise(vPos * 15.0) * 0.020;  // ragged, chipped edges
    float plate = vor.z;          // per-plate random

    // Plates give way a few at a time: one fissure at first, the whole
    // surface by the final tap.
    float openT = mix(0.06, 1.08, uAwaken);
    float opened = smoothstep(openT + 0.09, openT - 0.09, plate);
    opened *= step(0.001, uAwaken);

    // Fissures widen as it wakes, and vary along their length — a crack of
    // constant width looks machined.
    float seamW = mix(0.05, 0.10, uAwaken) * (0.65 + 0.7 * (snoise(vPos * 5.5) * 0.5 + 0.5));
    float lip = (1.0 - smoothstep(seamW * 0.45, seamW, seam)) * opened;
    float core = (1.0 - smoothstep(0.0, seamW * 0.5, seam)) * opened;

    // A lit ridge just outside the fissure, where the broken edge catches the
    // light. Without it the crack is a flat dark line painted on a smooth
    // surface; with it the stone reads as having depth.
    float ridge = (smoothstep(seamW, seamW * 1.5, seam) *
                   (1.0 - smoothstep(seamW * 1.5, seamW * 2.6, seam))) * opened;

    // stone — desaturated grey, cool rim
    vec3 stone = vec3(0.26 + 0.15 * grain) + fres * 0.14;

    // living — warm core to gold
    vec3 living = mix(vec3(1.0, 0.30, 0.16), vec3(1.0, 0.74, 0.32), plate);

    // The light lives INSIDE the fissures, and the surface stays stone until
    // late. Filling each plate with flat colour reads as paint on a pebble;
    // rock with something burning behind it glows out of its cracks and only
    // spills a little onto the stone around them.
    float channel = (1.0 - smoothstep(0.0, seamW, seam)) * opened;
    float spill = (1.0 - smoothstep(0.0, seamW * 4.5, seam)) * opened;
    // only in the last stages does the interior itself flood with light
    float flood = opened * smoothstep(0.58, 1.0, uAwaken);
    float pulse = 1.0 + uPulse * 0.9;

    vec3 col = stone;
    col = mix(col, vec3(0.015, 0.012, 0.010), lip * 0.85);  // dark fissure walls
    col += vec3(0.55, 0.52, 0.48) * ridge * 0.30;           // lit broken edge
    col = mix(col, living * 0.85, clamp(flood * 0.8, 0.0, 1.0));

    col += living * channel * (0.55 + 0.85 * uAwaken) * pulse;   // light from within
    col += living * core * (0.35 + 0.6 * uAwaken) * pulse;       // hottest centre
    col += living * spill * (0.08 + 0.26 * uAwaken) * pulse;     // spill onto stone

    // warm rim once it is properly alight
    col += vec3(1.0, 0.5, 0.25) * fres * 0.45 * flood;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/** How long the heart takes to break apart, in real seconds. */
const SHATTER_SECONDS = 2.2;

// Double-bump (lub-dub) envelope for the visual pulse.
function beatEnv(phase: number) {
  const g = (x: number, c: number, w: number) =>
    Math.exp(-((x - c) * (x - c)) / (2 * w * w));
  const p = phase - Math.floor(phase);
  return Math.min(1, g(p, 0, 0.03) + g(p, 1, 0.03) + 0.6 * g(p, 0.2, 0.04));
}

type HeartProps = {
  /** Owned by the scene, so the falling stone can spawn from the same surface. */
  geometry: THREE.BufferGeometry;
  targetAwaken: number;
  beatRate: number; // 0 = no beat
  shattering: boolean;
  onTap?: () => void;
  /** Fired once, when the last fragment has faded — lets the parent unmount us. */
  onShatterDone?: () => void;
};

export default function Heart({
  geometry,
  targetAwaken,
  beatRate,
  shattering,
  onTap,
  onShatterDone,
}: HeartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const awakenRef = useRef(0);
  const shatterRef = useRef(0);
  const shatterStartRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        uniforms: {
          uAwaken: { value: 0 },
          uPulse: { value: 0 },
          uShatter: { value: 0 },
        },
      }),
    []
  );

  // We unmount once the shatter finishes; the geometry belongs to the scene.
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const now = state.clock.getElapsedTime();

    // ease awakening toward the current stage's target
    awakenRef.current += (targetAwaken - awakenRef.current) * Math.min(1, dt * 2.2);
    material.uniforms.uAwaken.value = awakenRef.current;

    // heartbeat-driven pulse
    if (beatRate > 0) {
      const interval = 1.15 / beatRate; // seconds per beat
      phaseRef.current += dt / interval;
      material.uniforms.uPulse.value = beatEnv(phaseRef.current);
    } else {
      material.uniforms.uPulse.value = 0;
    }

    // Shatter progression, driven by WALL-CLOCK time rather than accumulated
    // frame deltas. Deltas are clamped (above) to keep the pulse stable, but
    // using them here would stretch the shatter on slow hardware — the fewer
    // frames it renders, the longer it would drag. This way it always takes
    // SHATTER_SECONDS of real time; a slow device simply shows fewer frames.
    if (shattering && shatterRef.current < 1) {
      if (shatterStartRef.current === null) shatterStartRef.current = now;
      const t = Math.min(1, (now - shatterStartRef.current) / SHATTER_SECONDS);
      shatterRef.current = t;
      material.uniforms.uShatter.value = t;
      if (t >= 1 && !firedRef.current) {
        firedRef.current = true;
        onShatterDone?.();
      }
    }

    // gentle cinematic drift
    if (meshRef.current) {
      const t = phaseRef.current;
      meshRef.current.rotation.y = Math.sin(t * 0.15) * 0.25;
      meshRef.current.rotation.z = -0.08 + Math.sin(t * 0.1) * 0.03;
      const beat = material.uniforms.uPulse.value * awakenRef.current * 0.02;
      meshRef.current.scale.setScalar(1 + beat);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[0, 0, -0.08]}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (firedRef.current && shattering) return;
        onTap?.();
      }}
    />
  );
}
