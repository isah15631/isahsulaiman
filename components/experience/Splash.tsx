"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { FLOOR_Y } from "@/lib/descent";
import { splashRise } from "@/lib/approach";

// The one splash.
//
// The moon has gone under. Where it went in, a single plume of water is thrown
// up: it rises fast, holds a droplet at its top for an instant, and falls
// straight back into the lake. No butterflies out here and nothing it turns into
// — the water simply answers the moon once and settles, and then the black takes
// the frame. It rides splashRise, so its height and its glow both come off the
// one clock.

// How high the plume reaches above the surface, in world units.
const APEX_RISE = 2.9;

// The plume: a soft column of water tapering to a droplet at its top, drawn on a
// bottom-anchored quad that stands up out of the surface. Faces the camera, which
// sits down the +z axis, so it needs no billboarding of its own.
const PLUME_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLUME_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main(){
    float x = vUv.x - 0.5;
    float y = vUv.y;                 // 0 at the surface, 1 at the top
    // A column that tapers as it climbs, faded in at the foot and out below the
    // head so it reads as thrown water and not a bar.
    float w = mix(0.17, 0.045, y);
    float body = smoothstep(w, 0.0, abs(x));
    body *= smoothstep(0.0, 0.09, y) * (1.0 - smoothstep(0.70, 1.0, y));
    // The droplet held at the top.
    float head = smoothstep(0.15, 0.0, length(vec2(x * 1.3, y - 0.82)));
    float a = max(body, head);
    if (a < 0.004) discard;
    // Pale moonlit water, brightest at the head.
    vec3 col = mix(vec3(0.52, 0.66, 0.90), vec3(0.86, 0.92, 1.0), head);
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

export default function Splash({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const plumeRef = useRef<THREE.Mesh>(null);
  const plumeMat = useRef<THREE.ShaderMaterial>(null);

  // A unit quad with its pivot at the bottom edge, so scaling it in y grows it
  // upward out of the surface rather than from its middle.
  const plumeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  useEffect(() => () => plumeGeo.dispose(), [plumeGeo]);

  useFrame(() => {
    const rise = splashRise(nowRef.current);
    if (plumeRef.current && plumeMat.current) {
      const h = Math.max(0.0001, APEX_RISE * rise);
      plumeRef.current.scale.set(0.85, h, 1);
      // Brightest at the peak, fading as it retracts, so it collapses back into
      // the surface rather than winking out in the air.
      plumeMat.current.uniforms.uOpacity.value = rise;
      plumeRef.current.visible = rise > 0.001;
    }
  });

  return (
    <mesh
      ref={plumeRef}
      geometry={plumeGeo}
      position={[0, FLOOR_Y, 0]}
      renderOrder={4}
      visible={false}
    >
      <shaderMaterial
        ref={plumeMat}
        vertexShader={PLUME_VERT}
        fragmentShader={PLUME_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uOpacity: { value: 0 } }}
      />
    </mesh>
  );
}
