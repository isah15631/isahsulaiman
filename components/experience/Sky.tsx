"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { ORB_RADIUS } from "@/lib/orbGeometry";
import {
  BEAT,
  CLOUD_BASE,
  CLOUD_TOP,
  airDensity,
  burn,
  orbY,
  throughCloud,
} from "@/lib/descent";

// The air, and what the air does to it.
//
// Three things: a deck of cloud you go through rather than past, the wash of
// atmosphere arriving before you reach it, and the fact that a body entering an
// atmosphere at speed catches fire. None of the three is drawn on: the burn is
// speed times density, the glow it throws lights the cloud it is tearing through,
// and both die away on their own as it slows and the air thins out under the deck.
//
// There was a wake behind it as well, twice, and it is gone at Isah's request.
// What is left is the fire on the thing itself, which is the sheath of shocked
// air it is pushing in front of it rather than anything trailing off the back.
//
// The deck is a stack of thin sheets, not one surface, because a single plane is
// invisible exactly when you pass through it and a cloud is the one thing that
// must not disappear at the moment you are inside it.

const LAYERS = 11;
const NARROW_LAYERS = 6;
const DECK_R = 78;

const NOISE = /* glsl */ `
  float hash(vec3 p){
    p = fract(p * 0.3183099 + vec3(0.37, 0.821, 0.146));
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
    float a = 0.55;
    float s = 0.0;
    for (int i = 0; i < 3; i++){
      s += a * vnoise(p);
      p *= 2.07;
      a *= 0.5;
    }
    return s;
  }
`;

const CLOUD_VERT = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vLocal;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vLocal = position.xy;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const CLOUD_FRAG = /* glsl */ `
  ${NOISE}
  uniform float uTime;
  uniform float uAlpha;
  uniform float uScale;
  uniform vec2 uOffset;
  uniform float uRadius;
  uniform vec3 uOrb;
  uniform float uGlow;
  uniform vec3 uBase;
  varying vec3 vWorld;
  varying vec2 vLocal;

  void main(){
    // Fade out well before the geometry stops, or the sheet has a visible rim and
    // a cloud with an edge is a plate.
    float rim = 1.0 - smoothstep(0.42, 1.0, length(vLocal) / uRadius);
    if (rim <= 0.001) discard;

    float n = fbm(vec3(vWorld.xz * uScale + uOffset, uTime * 0.015));
    float body = smoothstep(0.38, 0.82, n) * rim;
    if (body <= 0.004) discard;

    // Lit by the thing falling through it and by nothing else. Inverse square,
    // because that is what light does, and it is why the deck lights up as it
    // arrives and goes out again behind it.
    float d = distance(vWorld, uOrb);
    float lit = uGlow * 26.0 / (d * d + 6.0);

    vec3 col = uBase + vec3(1.0, 0.58, 0.28) * lit;
    gl_FragColor = vec4(col, clamp(body * uAlpha, 0.0, 1.0));
  }
`;

function Deck({ nowRef }: { nowRef: MutableRefObject<number> }) {
  const { size } = useThree();
  const narrow = size.width < 640;
  const count = narrow ? NARROW_LAYERS : LAYERS;
  const mats = useRef<(THREE.ShaderMaterial | null)[]>([]);

  const sheets = useMemo(() => {
    const out: { y: number; offset: [number, number]; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const k = i / (count - 1);
      out.push({
        y: CLOUD_TOP + (CLOUD_BASE - CLOUD_TOP) * k,
        // each sheet reads the noise somewhere else, so the stack has depth
        offset: [i * 13.37, i * -7.11],
        scale: 0.075 + (i % 3) * 0.03,
      });
    }
    return out;
  }, [count]);

  useFrame((state) => {
    const now = nowRef.current;
    const orb = orbY(now);
    const b = burn(now);
    const density = airDensity(now);
    for (const m of mats.current) {
      if (!m) continue;
      m.uniforms.uTime.value = state.clock.getElapsedTime();
      m.uniforms.uOrb.value.set(0, orb, 0);
      m.uniforms.uGlow.value = b;
      // thin at the top of the deck, thick in the middle of it
      m.uniforms.uAlpha.value = 0.34 * Math.min(1, density * 1.4);
    }
  });

  return (
    <group>
      {sheets.map((s, i) => (
        <mesh key={i} position={[0, s.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[DECK_R, 48]} />
          <shaderMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            vertexShader={CLOUD_VERT}
            fragmentShader={CLOUD_FRAG}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            uniforms={{
              uTime: { value: 0 },
              uAlpha: { value: 0 },
              uScale: { value: s.scale },
              uOffset: { value: new THREE.Vector2(...s.offset) },
              uRadius: { value: DECK_R },
              uOrb: { value: new THREE.Vector3() },
              uGlow: { value: 0 },
              uBase: { value: new THREE.Color(0.055, 0.065, 0.095) },
            }}
          />
        </mesh>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------ the burn

const BURN_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vView;
  void main(){
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const BURN_FRAG = /* glsl */ `
  uniform float uBurn;
  varying vec3 vN;
  varying vec3 vView;

  void main(){
    // The underside is what is hitting the air, so that is what is white.
    float lead = max(0.0, dot(vN, vec3(0.0, -1.0, 0.0)));
    float limb = pow(1.0 - max(0.0, dot(vN, vView)), 2.2);
    // The limb term MULTIPLIES the leading face rather than being added to it.
    // Added, it lit the whole silhouette equally and drew a golden ring right
    // the way around the moon — which is a halo, and a halo is the one thing
    // atmospheric entry does not look like. The air is only being hit on one
    // side, so only one side is allowed to glow.
    float a = uBurn * pow(lead, 1.3) * (0.70 + 0.85 * limb);
    if (a < 0.004) discard;
    vec3 col = mix(vec3(1.0, 0.34, 0.08), vec3(1.0, 0.96, 0.88), pow(lead, 3.0));
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

function Burn({ nowRef }: { nowRef: MutableRefObject<number> }) {
  const shell = useRef<THREE.Mesh>(null);
  const shellMat = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    const now = nowRef.current;
    // Out cold before it lands, and hard off at the impact. The sheath used to
    // still be lit on the frame it hit, which left a glowing cap sitting on the
    // floor underneath the break.
    const b = now < BEAT.impact ? burn(now) : 0;
    if (shell.current) {
      shell.current.position.y = orbY(now);
      shell.current.visible = b > 0.004;
    }
    if (shellMat.current) shellMat.current.uniforms.uBurn.value = b;
  });

  return (
    <mesh ref={shell} renderOrder={2}>
      <sphereGeometry args={[ORB_RADIUS * 1.22, 40, 28]} />
      <shaderMaterial
        ref={shellMat}
        vertexShader={BURN_VERT}
        fragmentShader={BURN_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uBurn: { value: 0 } }}
      />
    </mesh>
  );
}

// -------------------------------------------------------------------- the wash

/**
 * Arriving at an atmosphere from outside it.
 *
 * Held in front of the camera, so it is a wash over the frame rather than a thing
 * in the world: the sky lifting off black as there starts to be something out
 * there, and gone again by the time we are down inside the cloud, because from in
 * there the only thing lighting anything is the fire.
 */
function Wash({ nowRef }: { nowRef: MutableRefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const now = nowRef.current;
    const cam = state.camera;
    if (mesh.current) {
      mesh.current.position.copy(cam.position);
      mesh.current.quaternion.copy(cam.quaternion);
      mesh.current.translateZ(-9);
    }
    if (mat.current) {
      mat.current.opacity =
        0.5 * airDensity(now) * (1 - throughCloud(now)) * (1 - throughCloud(now));
    }
  });

  return (
    <mesh ref={mesh} renderOrder={-1}>
      <planeGeometry args={[46, 28]} />
      <meshBasicMaterial
        ref={mat}
        color="#2c4a6e"
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function Sky({ nowRef }: { nowRef: MutableRefObject<number> }) {
  return (
    <>
      <Wash nowRef={nowRef} />
      <Deck nowRef={nowRef} />
      <Burn nowRef={nowRef} />
    </>
  );
}
