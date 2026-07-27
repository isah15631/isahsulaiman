"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { HeartChunk } from "@/lib/heartGeometry";
import type { ShardLaunch, ShardSeed } from "@/lib/shards";

/** Time base for the flight maths — uShatter runs 0→1 over this many seconds. */
const SHATTER_SECONDS = 2.2;

// No shard outlives the break: each one flares and is gone at its own moment,
// because a butterfly is taking its place there. The first turns at
// CONVERT_MIN, the last at CONVERT_MIN + CONVERT_SPAN (in uShatter units).
const CONVERT_MIN = 0.16;
const CONVERT_SPAN = 0.34;
const CONVERT_FADE = 0.07;
/** Nothing of the heart is left after this — the scene can be torn down. */
const SHATTER_END = CONVERT_MIN + CONVERT_SPAN + 0.08;

const glsl = (n: number) => n.toFixed(4);

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

      // Just before it changes, the slab draws in on itself — it gathers to a
      // point of light, and the butterfly opens out of that same point.
      float sConv = ${glsl(CONVERT_MIN)} + r * ${glsl(CONVERT_SPAN)};
      float gather = smoothstep(sConv - 0.20, sConv + ${glsl(CONVERT_FADE)}, uShatter);
      p = mix(p, aChunkCentre + offset, gather * 0.7);
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

      // Read as GLASS breaking: a dark cool shard, a hard bright edge where it
      // catches the light, and the heart's warmth still burning through it.
      vec3 shard = vec3(0.09, 0.12, 0.16) * (0.7 + 0.6 * tone);
      shard += vec3(0.55, 0.68, 0.85) * fres * 1.05;
      vec3 lit = mix(vec3(1.0, 0.34, 0.16), vec3(1.0, 0.76, 0.34), tone);
      vec3 c = mix(shard, lit, 0.42);
      c += vec3(1.0) * pow(fres, 3.0) * 0.55;
      c += vec3(1.0, 0.55, 0.28) * 0.22 * (0.6 + uPulse * 0.4);

      // Each shard has its own moment. It catches the light, whites out, and is
      // gone — and the swarm has a butterfly opening at that exact spot.
      float sConv = ${glsl(CONVERT_MIN)} + vChunk * ${glsl(CONVERT_SPAN)};
      float flare = smoothstep(sConv - 0.22, sConv, uShatter);
      c += vec3(1.0, 0.82, 0.55) * flare * 0.9;
      c += vec3(1.0) * flare * flare * 0.7;

      // Per CHUNK, so a slab goes as a whole rather than eroding unevenly
      // across its own faces.
      float a = 1.0 - smoothstep(sConv - ${glsl(CONVERT_FADE)}, sConv + ${glsl(CONVERT_FADE)} * 0.4, uShatter);
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

    // ---- glass ----
    // Against a black page, transparency would only read as dimness, so the
    // body stays opaque and the glass is carried by its rim and its highlights
    // instead: a dark cool interior, a bright cold edge, and a hard specular
    // glint off a polished surface.
    vec3 body = vec3(0.055, 0.075, 0.098);
    // a broad wash so the form is legible, then a tight bright edge on top
    body += vec3(0.30, 0.40, 0.52) * pow(fres, 0.6) * 0.32;
    body += vec3(0.62, 0.78, 0.95) * fres * 1.15;
    body += vec3(0.10, 0.13, 0.16) * (grain * 0.5 + 0.5) * 0.30;

    // one tight glint and one softer sheen, so it looks polished rather than matte
    vec3 L = normalize(vec3(0.42, 0.68, 0.60));
    float ndl = max(dot(nrm, L), 0.0);
    body += vec3(1.0, 0.99, 0.96) * pow(ndl, 42.0) * 0.95;
    body += vec3(0.55, 0.68, 0.85) * pow(ndl, 7.0) * 0.22;

    // living — warm core to gold
    vec3 living = mix(vec3(1.0, 0.34, 0.16), vec3(1.0, 0.76, 0.34), plate);

    // The warmth lives behind the glass and comes out through the fractures,
    // flooding the interior only in the last stages.
    float channel = (1.0 - smoothstep(0.0, seamW, seam)) * opened;
    float spill = (1.0 - smoothstep(0.0, seamW * 4.5, seam)) * opened;
    float flood = opened * smoothstep(0.58, 1.0, uAwaken);
    float pulse = 1.0 + uPulse * 0.9;

    vec3 col = body;

    // A fracture in glass catches light along its faces, so it goes BRIGHT.
    // That is the whole difference from the stone, where the same seam was a
    // dark fissure with light escaping from behind it.
    col += vec3(0.80, 0.88, 1.00) * lip * 0.55;
    col += vec3(1.00, 1.00, 1.00) * core * (0.85 - 0.35 * uAwaken);
    col += vec3(0.75, 0.85, 1.00) * ridge * 0.55;

    // then warmth builds behind it and takes the fractures over
    col = mix(col, living * 0.9, clamp(flood * 0.85, 0.0, 1.0));
    col += living * channel * (0.45 + 0.90 * uAwaken) * pulse;
    col += living * core * (0.20 + 0.90 * uAwaken) * pulse;
    col += living * spill * (0.10 + 0.30 * uAwaken) * pulse;

    // warm rim once it is properly alight
    col += vec3(1.0, 0.5, 0.25) * fres * 0.45 * flood;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Double-bump (lub-dub) envelope for the visual pulse.
function beatEnv(phase: number) {
  const g = (x: number, c: number, w: number) =>
    Math.exp(-((x - c) * (x - c)) / (2 * w * w));
  const p = phase - Math.floor(phase);
  return Math.min(1, g(p, 0, 0.03) + g(p, 1, 0.03) + 0.6 * g(p, 0.2, 0.04));
}

// The shatter, replayed on the CPU for one chunk. Must match the vertex
// shader's slab motion above, or the butterflies will not appear where the
// shards actually were.
function shardAt(centre: THREE.Vector3, random: number, s: number, out: THREE.Vector3) {
  out.copy(centre).normalize().multiplyScalar(s * (0.9 + random * 1.7)).add(centre);
  out.y -= s * s * (0.9 + random * 1.1);
  return out;
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
  /**
   * Fired on the frame the heart breaks, with every shard's screen-space
   * trajectory. Each one becomes a butterfly.
   */
  onShardsLaunch?: (launch: ShardLaunch) => void;
};

export default function Heart({
  geometry,
  targetAwaken,
  beatRate,
  shattering,
  onTap,
  onShatterDone,
  onShardsLaunch,
}: HeartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const awakenRef = useRef(0);
  const shatterRef = useRef(0);
  const shatterStartRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const launchedRef = useRef(false);

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

  // Where each shard is on screen at the instant it turns, and how fast it was
  // going when it got there. The whole schedule is computed on the frame the
  // heart breaks, so the swarm can be handed the trajectories in one piece.
  const buildLaunch = (
    camera: THREE.Camera,
    canvas: HTMLCanvasElement
  ): ShardLaunch | null => {
    const chunks = geometry.userData.chunks as HeartChunk[] | undefined;
    const mesh = meshRef.current;
    if (!chunks?.length || !mesh) return null;

    mesh.updateWorldMatrix(true, false);
    const rect = canvas.getBoundingClientRect();
    const local = new THREE.Vector3();
    const world = new THREE.Vector3();
    const ndc = new THREE.Vector3();
    const camDist = camera.position.length() || 5; // the heart sits at the origin

    const project = (centre: THREE.Vector3, random: number, s: number) => {
      world.copy(shardAt(centre, random, s, local)).applyMatrix4(mesh.matrixWorld);
      const dist = Math.max(0.001, world.distanceTo(camera.position));
      ndc.copy(world).project(camera);
      return {
        x: (ndc.x * 0.5 + 0.5) * rect.width + rect.left,
        y: (-ndc.y * 0.5 + 0.5) * rect.height + rect.top,
        // a shard thrown towards us is nearer, so its butterfly is bigger
        scale: camDist / dist,
      };
    };

    const STEP = 0.02; // finite difference, in uShatter units
    const shards: ShardSeed[] = chunks.map((ch) => {
      const s = CONVERT_MIN + ch.random * CONVERT_SPAN;
      const a = project(ch.centre, ch.random, s);
      const b = project(ch.centre, ch.random, s + STEP);
      const dt = STEP * SHATTER_SECONDS;
      return {
        x: a.x,
        y: a.y,
        vx: (b.x - a.x) / dt,
        vy: (b.y - a.y) / dt,
        t: s * SHATTER_SECONDS,
        scale: a.scale,
        seed: ch.random,
      };
    });

    return { launchAt: performance.now(), shards };
  };

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
      if (shatterStartRef.current === null) {
        shatterStartRef.current = now;
        // Work out where every shard will be at the moment it turns, before it
        // has moved at all — the swarm needs the whole schedule up front.
        if (!launchedRef.current) {
          launchedRef.current = true;
          const launch = buildLaunch(state.camera, state.gl.domElement);
          if (launch) onShardsLaunch?.(launch);
        }
      }
      const t = Math.min(1, (now - shatterStartRef.current) / SHATTER_SECONDS);
      shatterRef.current = t;
      material.uniforms.uShatter.value = t;
      if (t >= SHATTER_END && !firedRef.current) {
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
