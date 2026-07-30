"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { ORB_RADIUS, type OrbChunk } from "@/lib/orbGeometry";
import type { ShardLaunch, ShardSeed } from "@/lib/shards";
import { BEAT, REST_Y, orbY } from "@/lib/descent";

// It does not fall on its own clock any more.
//
// The whole descent, from hanging in space to hitting concrete, is one timeline
// in lib/descent, and the moon, the camera, the stars, the cloud deck and the
// fire around it all read their state out of that. Nothing in here decides when
// anything happens; it asks where it is supposed to be and goes there.

/** Time base for the break — uShatter runs 0→1 over this many seconds. */
const SHATTER_SECONDS = 2.0;

// Glass on concrete does not come apart gently. Every piece is gone inside a
// second, because a butterfly is taking its place.
const CONVERT_MIN = 0.16;
const CONVERT_SPAN = 0.34;
const CONVERT_FADE = 0.07;
/**
 * How long a piece spends catching the light before it goes. This has to be
 * shorter than CONVERT_MIN or the earliest pieces begin flaring at a negative
 * time — which is to say instantly, while they are still sitting in the shape
 * of a sphere, so the thing lights up before it has visibly broken.
 */
const FLARE_LEAD = 0.1;
/** Nothing of the sphere is left after this. */
const SHATTER_END = CONVERT_MIN + CONVERT_SPAN + 0.08;

/** How clear the glass is where you look straight through it. */
const BODY_ALPHA = 0.55;

const glsl = (n: number) => n.toFixed(4);

const vertexShader = /* glsl */ `
  uniform float uShatter;
  attribute vec3 aChunkCentre;
  attribute float aChunkRandom;
  varying vec3 vPos;
  varying vec3 vNormal;
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
    vChunk = aChunkRandom;
    vec3 p = position;
    vec3 nrm = normal;

    if(uShatter > 0.0001){
      float r = aChunkRandom;

      // Everything is thrown from the point that actually hit the floor: the
      // bottom of the sphere. Not from its centre. A burst from the middle
      // reads as something detonating in mid-air; a burst from the contact
      // point reads as something landing, because the far side of the sphere
      // gets pushed up and over rather than straight out at you.
      vec3 contact = vec3(0.0, ${glsl(-ORB_RADIUS)}, 0.0);
      vec3 dir = normalize(aChunkCentre - contact);
      // Nothing goes down: the floor is there. Glass on concrete sprays up and
      // outward, so the vertical component is folded up and given a floor.
      dir.y = abs(dir.y) * 0.55 + 0.35;
      dir = normalize(dir);

      vec3 offset = dir * uShatter * (0.9 + r * 1.9);
      offset.y -= uShatter * uShatter * 2.2; // and then gravity has it back

      // Tumbling fast: this was not released, it was hit.
      vec3 axis = normalize(vec3(r - 0.5, r * 0.7 - 0.2, 0.5 - r));
      mat3 spin = rotAxis(axis, uShatter * (1.4 + r * 2.4));
      p = aChunkCentre + spin * (p - aChunkCentre);
      nrm = spin * nrm;
      p += offset;

      // Just before it changes, the piece draws in on itself — it gathers to a
      // point of light, and the butterfly opens out of that same point.
      float sConv = ${glsl(CONVERT_MIN)} + r * ${glsl(CONVERT_SPAN)};
      float gather = smoothstep(sConv - ${glsl(FLARE_LEAD)}, sConv + ${glsl(CONVERT_FADE)}, uShatter);
      p = mix(p, aChunkCentre + offset, gather * 0.7);
    }

    vNormal = normalize(normalMatrix * nrm);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uShatter;
  // Where in the noise field this sphere is cut from, so the grain is not
  // identical on every visit.
  uniform vec3 uSeed;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vChunk;

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

  // Ridged noise: fold the field at zero and sharpen it, and what is left is
  // rims. Two scales, the second finer and shallower.
  float relief(vec3 p){
    float a = 1.0 - abs(snoise(p * 3.6));
    float b = 1.0 - abs(snoise(p * 8.4));
    return pow(a, 5.0) * 0.64 + pow(b, 4.0) * 0.36;
  }

  void main(){
    // Both faces are drawn once it breaks, and a back face's normal points
    // into the piece, so it has to be turned round.
    vec3 nrm = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    float fres = pow(1.0 - abs(nrm.z), 2.5);
    vec3 sp = vPos + uSeed;

    // The glass. Against a black page transparency would only read as dimness,
    // so the body stays nearly opaque and the material is carried by its rim
    // and its highlights instead: a dark cool interior, a bright cold edge, and
    // a hard specular glint off a polished surface.
    vec3 body = vec3(0.055, 0.075, 0.098);
    body += vec3(0.30, 0.40, 0.52) * pow(fres, 0.6) * 0.32;
    body += vec3(0.10, 0.13, 0.16) * (snoise(sp * 3.3) * 0.5 + 0.5) * 0.30;

    vec3 sheen = vec3(0.62, 0.78, 0.95) * fres * 1.15;
    vec3 L = normalize(vec3(0.42, 0.68, 0.60));
    float ndl = max(dot(nrm, L), 0.0);
    sheen += vec3(1.0, 0.99, 0.96) * pow(ndl, 42.0) * 0.95;
    sheen += vec3(0.55, 0.68, 0.85) * pow(ndl, 7.0) * 0.22;

    // ---- whole, and falling ----
    //
    // A moon. It was glass all the way down before this, and glass reads as a
    // marble however carefully it is shaded: a bright cold rim, a hard specular
    // dot and an even body, which are exactly the three things a rock does not
    // have. What makes a moon is relief and one hard terminator.
    //
    // So: maria, craters and dust, lit by a single distant sun with almost no
    // fill. The dark side is not black but nearly — starlight and nothing else.
    //
    // Fully opaque, on purpose. A part-transparent sphere lets you see its own
    // far side, and since this is one double-sided mesh whose triangles are
    // drawn in buffer order against a depth buffer, WHICH bits of the far side
    // survive depends on the order they happened to be drawn in.
    if(uShatter < 0.0001){
      vec3 L = normalize(vec3(0.86, 0.26, 0.44));

      // Broad dark plains, the flat old floods. Low frequency and soft edged,
      // because their edges are where lava stopped, not where anything broke.
      float mare = smoothstep(0.44, 0.74, snoise(sp * 0.82) * 0.5 + 0.5);

      // Craters, as ridged noise: turning the noise inside out at zero gives
      // rings, and rings are what a cratered surface is. Two scales of them, big
      // basins and the pitting between.
      float h = relief(sp);
      // Sampled a second time a short way toward the sun. Where the surface
      // rises toward the light the rim catches it and the floor behind it does
      // not, which is the whole reason a crater reads as a hole and not a ring
      // painted on a ball. It is a real relief term, from a real gradient.
      float hL = relief(sp + L * 0.075);
      float slope = (hL - h) * 7.0;

      float dust = snoise(sp * 36.0) * 0.5 + 0.5;

      vec3 rock = mix(vec3(0.56, 0.545, 0.515), vec3(0.285, 0.285, 0.30), mare);
      rock *= 0.88 + 0.24 * dust;
      rock *= 0.82 + 0.34 * h;

      float lam = max(0.0, dot(nrm, L));
      // The terminator is hard. There is no air out here to soften it and no
      // second surface to bounce anything back.
      float lit = clamp(lam + slope * lam * 1.6, 0.0, 1.6);
      vec3 col = rock * (0.035 + lit);

      // and it goes dark at the limb, the way a sphere of dust does
      col *= 1.0 - 0.42 * pow(1.0 - abs(nrm.z), 3.0);

      gl_FragColor = vec4(col, 1.0);
      return;
    }

    // ---- broken ----
    // The warmth was in there all along; it is only visible now there is a
    // broken edge for it to come out of.
    float tone = snoise(sp * 1.8) * 0.5 + 0.5;
    vec3 lit = mix(vec3(1.0, 0.34, 0.16), vec3(1.0, 0.76, 0.34), tone);
    vec3 c = body * 0.8;
    c += lit * (0.34 + 0.30 * tone);
    // The inside of a piece is the side the light was on.
    if(!gl_FrontFacing) c += lit * 0.5;
    c += sheen * 0.9;

    // Each piece has its own moment. It catches the light, whites out, and is
    // gone — and the swarm has a butterfly opening at that exact spot.
    float sConv = ${glsl(CONVERT_MIN)} + vChunk * ${glsl(CONVERT_SPAN)};
    float flare = smoothstep(sConv - ${glsl(FLARE_LEAD)}, sConv, uShatter);
    c += vec3(1.0, 0.82, 0.55) * flare * 0.9;
    c += vec3(1.0) * flare * flare * 0.7;

    float a = 1.0 - smoothstep(sConv - ${glsl(CONVERT_FADE)}, sConv + ${glsl(CONVERT_FADE)} * 0.4, uShatter);
    if(a < 0.02) discard;
    gl_FragColor = vec4(c, a);
  }
`;

/**
 * The break, replayed on the CPU for one piece. Must match the vertex shader
 * exactly, or the butterflies will not appear where the glass actually was.
 */
const dirTmp = new THREE.Vector3();
const contactTmp = new THREE.Vector3(0, -ORB_RADIUS, 0);
function shardAt(ch: OrbChunk, s: number, out: THREE.Vector3) {
  dirTmp.copy(ch.centre).sub(contactTmp).normalize();
  dirTmp.y = Math.abs(dirTmp.y) * 0.55 + 0.35;
  dirTmp.normalize();
  out.copy(ch.centre).addScaledVector(dirTmp, s * (0.9 + ch.random * 1.9));
  out.y -= s * s * 2.2;
  return out;
}

type OrbProps = {
  geometry: THREE.BufferGeometry;
  /** Seconds since the shot began, shared by everything in the descent. */
  nowRef: MutableRefObject<number>;
  /** Fired on the frame it lands: the sound, the light, the dust. */
  onImpact?: () => void;
  /** Fired on that same frame, with every piece's screen-space trajectory. */
  onShardsLaunch?: (launch: ShardLaunch) => void;
};

export default function Orb({
  geometry,
  nowRef,
  onImpact,
  onShardsLaunch,
}: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startRef = useRef<number | null>(null);
  const impactRef = useRef<number | null>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uShatter: { value: 0 },
          uSeed: {
            value: new THREE.Vector3(
              Math.random() * 40,
              Math.random() * 40,
              Math.random() * 40
            ),
          },
        },
      }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  // Where each piece is on screen at the instant it turns, and how fast it was
  // going when it got there. Computed on the frame of impact, before anything
  // has moved, so the swarm can be handed the whole schedule in one piece.
  const buildLaunch = (
    camera: THREE.Camera,
    canvas: HTMLCanvasElement
  ): ShardLaunch | null => {
    const chunks = geometry.userData.chunks as OrbChunk[] | undefined;
    const mesh = meshRef.current;
    if (!chunks?.length || !mesh) return null;

    mesh.updateWorldMatrix(true, false);
    const rect = canvas.getBoundingClientRect();
    const local = new THREE.Vector3();
    const world = new THREE.Vector3();
    const ndc = new THREE.Vector3();
    const camDist = camera.position.distanceTo(mesh.position) || 5;

    const project = (ch: OrbChunk, s: number) => {
      world.copy(shardAt(ch, s, local)).applyMatrix4(mesh.matrixWorld);
      const dist = Math.max(0.001, world.distanceTo(camera.position));
      ndc.copy(world).project(camera);
      return {
        x: (ndc.x * 0.5 + 0.5) * rect.width + rect.left,
        y: (-ndc.y * 0.5 + 0.5) * rect.height + rect.top,
        // a piece thrown towards us is nearer, so its butterfly is bigger
        scale: camDist / dist,
      };
    };

    const STEP = 0.02; // finite difference, in uShatter units
    const shards: ShardSeed[] = chunks.map((ch) => {
      const s = CONVERT_MIN + ch.random * CONVERT_SPAN;
      const a = project(ch, s);
      const b = project(ch, s + STEP);
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

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const now = state.clock.getElapsedTime();
    const t = nowRef.current;

    // ---- hanging, and then falling ----
    if (impactRef.current === null) {
      // It is a moon before it is anything else, so it is there from the first
      // frame. Where it is, and how fast, is the descent timeline's business.
      mesh.visible = true;
      mesh.position.y = orbY(t);
      // Turning, slowly, the whole time: on its own axis while it hangs, and
      // harder once the air has hold of it. This is what stops it reading as a
      // circle sliding down the screen.
      const spin = t * 0.045 + Math.max(0, t - BEAT.release) * 0.085;
      mesh.rotation.x = 0.35 + spin;
      mesh.rotation.z = 0.12 + spin * 0.4;

      if (t >= BEAT.impact) {
        impactRef.current = now;
        mesh.position.y = REST_Y;
        onImpact?.();
        const launch = buildLaunch(state.camera, state.gl.domElement);
        if (launch) onShardsLaunch?.(launch);
      }
      return;
    }

    // ---- the break ----
    // Driven by wall-clock rather than accumulated frame deltas, so it always
    // takes the same real time; a slow device simply shows fewer frames of it.
    const s = Math.min(1, (now - impactRef.current) / SHATTER_SECONDS);
    material.uniforms.uShatter.value = Math.max(s, 0.0002);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

/**
 * Published so the piece can be timed from the outside. `TO_LANDING` is how
 * long after mounting the sphere hits, and `GLASS_GONE` how long after that
 * the last piece has faded — which is NOT when the canvas can go, because the
 * floor is still lit for a good while longer.
 */
export const ORB_TIMING = {
  TO_LANDING: BEAT.impact * 1000,
  GLASS_GONE: SHATTER_END * SHATTER_SECONDS * 1000,
};
