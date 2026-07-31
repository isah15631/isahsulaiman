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
  /**
   * Which way the sun is, in the moon's OWN space.
   *
   * Object space rather than view space, because the crater relief is computed
   * in object space and there is no way to get it out of there from in here:
   * normalMatrix is a vertex shader built-in and does not exist in a fragment
   * shader. Rather than smuggle a matrix across, the light comes the other way —
   * turned into the moon's frame on the cpu, once a frame, which is a quaternion
   * multiply against a rotation we already have.
   */
  uniform vec3 uLightObj;
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

  vec3 hash3(vec3 p){
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453);
  }

  // Craters, as cells rather than as noise.
  //
  // This was ridged noise before — the field folded at zero and sharpened, which
  // gives you rims, and rims are not craters. Ridges are a connected network:
  // they wander, they branch, they run into each other, and the result reads as
  // cracked mud or crumpled foil. What actually makes a crater is that it is
  // ROUND and it is ISOLATED, and the only cheap thing that gives you round and
  // isolated is a cell.
  //
  // So: nearest feature point, and everything is measured from that. The distance
  // to it is where you are in the crater, the direction to it is which way the
  // ground is tilted, and the cell's own random number sets how wide and how deep
  // that particular one is — so they vary and some cells barely dent at all.
  void craterAt(vec3 p, out float dist, out vec3 dir, out float rand){
    vec3 ip = floor(p);
    vec3 fp = fract(p);
    float best = 9.0;
    vec3 bestR = vec3(0.0, 0.0, 1.0);
    float bestH = 0.0;
    for (int x = -1; x <= 1; x++){
      for (int y = -1; y <= 1; y++){
        for (int z = -1; z <= 1; z++){
          vec3 g = vec3(float(x), float(y), float(z));
          vec3 h = hash3(ip + g);
          vec3 r = g + h - fp;
          float d2 = dot(r, r);
          if (d2 < best){ best = d2; bestR = r; bestH = h.x; }
        }
      }
    }
    dist = sqrt(best);
    // r points from here to the middle of the crater, so out of it is the other
    // way. This is the direction the ground falls away in.
    dir = -bestR / max(0.0001, dist);
    rand = bestH;
  }

  /**
   * The shape of one, and its slope, in one pass.
   *
   * A bowl and the lip of rock thrown out around it, both as gaussians, because a
   * gaussian differentiates to something you can write down — and the slope is
   * the entire point. Height alone would only darken the floors; it is the slope
   * that decides which wall of a crater faces the sun.
   */
  void craterShape(float u, float depth, out float h, out float slope){
    float bowl = exp(-2.6 * u * u);
    float lipU = (u - 1.0) / 0.30;
    float lip = exp(-lipU * lipU);
    h = -depth * bowl + depth * 0.42 * lip;
    slope = depth * 5.2 * u * bowl - depth * 0.42 * 2.0 * lipU / 0.30 * lip;
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
      vec3 L = normalize(uLightObj);

      // Broad dark plains, the flat old floods. Low frequency and soft edged,
      // because their edges are where lava stopped, not where anything broke.
      float mare = smoothstep(0.44, 0.74, snoise(sp * 0.82) * 0.5 + 0.5);

      // The nearest crater, and which way its ground tilts.
      float cd;
      vec3 cdir;
      float crand;
      craterAt(sp * 3.1, cd, cdir, crand);

      // Every one is a different size and depth, and some barely happened. That
      // spread is what stops a cellular field reading as a honeycomb.
      float radius = 0.26 + crand * 0.30;
      float depth = 0.35 + fract(crand * 7.31) * 0.75;
      float u = cd / radius;
      float h;
      float slope;
      craterShape(u, depth, h, slope);
      // Beyond the rim there is nothing: flat ground until the next one.
      float reach = 1.0 - smoothstep(1.25, 1.65, u);
      h *= reach;
      slope *= reach;

      // This is a sphere, so its object-space normal is just where you are on it.
      // The crater tilts that normal along the direction the ground falls away
      // in, which is what makes one wall of a hole face the sun and the other
      // face away — the single thing that separates a crater from a grey ring
      // painted on a ball.
      vec3 nObj = normalize(vPos);
      vec3 fallAway = cdir - nObj * dot(cdir, nObj);
      vec3 tilted = normalize(nObj - fallAway * slope * 0.55 / max(0.35, radius));

      // and the pitting between them, which is albedo only: too small to catch
      // light, big enough to stop the ground being smooth.
      float dust = snoise(sp * 34.0) * 0.5 + 0.5;
      float grit = snoise(sp * 11.0) * 0.5 + 0.5;

      vec3 rock = mix(vec3(0.58, 0.565, 0.535), vec3(0.30, 0.30, 0.315), mare);
      rock *= 0.90 + 0.20 * dust;
      rock *= 0.94 + 0.12 * grit;
      // Fresh material thrown out of a crater is brighter than what it landed on,
      // and the floor of one is in its own shadow.
      rock *= 1.0 + 0.30 * max(0.0, h) - 0.34 * max(0.0, -h);

      float lam = max(0.0, dot(tilted, L));
      // The terminator is hard. There is no air out here to soften it and no
      // second surface to bounce anything back.
      vec3 col = rock * (0.03 + lam * 1.16);

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
/** Where the sun is, in world space, and two scratch objects for moving it. */
const SUN = new THREE.Vector3(0.86, 0.26, 0.44).normalize();
const sunTmp = new THREE.Vector3();
const spinTmp = new THREE.Quaternion();

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
        uLightObj: { value: new THREE.Vector3(0.86, 0.26, 0.44).normalize() },
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

      // The sun does not turn with it. The surface is lit in the moon's own
      // frame, so the light has to be carried into that frame every time the
      // moon moves, or the terminator rotates with the rock and the whole thing
      // reads as a lamp bolted to the surface.
      sunTmp.copy(SUN).applyQuaternion(spinTmp.copy(mesh.quaternion).invert());
      material.uniforms.uLightObj.value.copy(sunTmp);

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
