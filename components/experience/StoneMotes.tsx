"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// Stage Four: "small particles of stone slowly fall away."
//
// A few dozen flecks detach from the heart's surface and drift downward. All
// of the motion lives in the vertex shader — each mote's whole life is a
// function of time, so there is no per-frame CPU work and nothing to allocate.
// Deliberately sparse and slow: this is stone coming loose, not a particle
// effect.

const LIFE = 4.2; // seconds for one mote to fall and fade

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAwaken;
  uniform float uShatter;
  uniform float uLife;
  attribute vec3 aOrigin;
  attribute vec3 aDrift;
  attribute float aPhase;
  attribute float aSize;
  varying float vAlpha;

  void main(){
    // stagger each mote through its own loop of the same lifetime
    float t = fract(uTime / uLife + aPhase) * uLife;

    vec3 p = aOrigin;
    p += aDrift * t;                       // eases away from the surface
    p.y -= 0.22 * t * t;                   // and then gravity takes it
    p.x += sin(t * 0.9 + aPhase * 20.0) * 0.035 * t;  // a little air

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (1.0 - 0.25 * (t / uLife)) * (300.0 / max(0.001, -mv.z));

    float k = t / uLife;
    // Held long enough to actually drift clear of the heart and fall.
    vAlpha = smoothstep(0.0, 0.08, k) * (1.0 - smoothstep(0.62, 1.0, k));
    // they only begin to come loose once the heart is truly waking (stage four)
    vAlpha *= smoothstep(0.52, 0.70, uAwaken);
    // and they stop the instant it breaks — the shatter has its own debris
    vAlpha *= 1.0 - step(0.0001, uShatter);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  void main(){
    // soft round fleck
    float d = length(gl_PointCoord - vec2(0.5));
    float a = (1.0 - smoothstep(0.22, 0.5, d)) * vAlpha;
    if(a < 0.01) discard;
    // glass dust: cool and bright, catching the light it is falling away from
    gl_FragColor = vec4(vec3(0.74, 0.82, 0.92), a * 0.85);
  }
`;

function hash(i: number, s: number) {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type Props = {
  /** Spawn sites on the heart's surface. */
  origins: Float32Array;
  awaken: number;
  shattering: boolean;
};

export default function StoneMotes({ origins, awaken, shattering }: Props) {
  const count = origins.length / 3;

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const drift = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const size = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const ox = origins[i * 3];
      const oy = origins[i * 3 + 1];
      const oz = origins[i * 3 + 2];
      // drift outward along the surface normal-ish direction, very slowly
      const len = Math.hypot(ox, oy, oz) || 1;
      const speed = 0.06 + hash(i, 1) * 0.09;
      drift[i * 3] = (ox / len) * speed + (hash(i, 2) - 0.5) * 0.02;
      drift[i * 3 + 1] = (oy / len) * speed * 0.4;
      drift[i * 3 + 2] = (oz / len) * speed + (hash(i, 3) - 0.5) * 0.02;
      phase[i] = hash(i, 4);
      size[i] = 0.05 + hash(i, 5) * 0.07;
    }

    g.setAttribute("position", new THREE.BufferAttribute(origins.slice(), 3));
    g.setAttribute("aOrigin", new THREE.BufferAttribute(origins.slice(), 3));
    g.setAttribute("aDrift", new THREE.BufferAttribute(drift, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return g;
  }, [origins, count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uAwaken: { value: 0 },
          uShatter: { value: 0 },
          uLife: { value: LIFE },
        },
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const awakenRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    awakenRef.current += (awaken - awakenRef.current) * Math.min(1, dt * 2.2);
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    material.uniforms.uAwaken.value = awakenRef.current;
    material.uniforms.uShatter.value = shattering ? 1 : 0;
  });

  // renderOrder 1 draws the motes AFTER the heart. Without it they are painted
  // first, and the heart — which does write depth — covers every mote still
  // near its surface, which is all of them.
  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={1}
    />
  );
}
