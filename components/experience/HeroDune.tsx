"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { FLOOR_Y, dayLight } from "@/lib/descent";
import { DOOR_POS } from "@/lib/approach";

// The rise the door stands on.
//
// A single smooth mound raised under the door, so it sits back on a crest rather
// than out on the flat where the moon lands. The crest is lifted to exactly the
// door's base, and the sheet fades out at its rim into the surrounding grass, so
// there is no seam between the rise and the floor: one field, one green.
//
// Lit by the same low sun as everything else, so the slope that faces the sun is
// a warm lit green and the slope toward the camera falls into a cooler shadow,
// which is what gives the mound its shape: grass out of the sun is lit by the
// sky, not black.

const SUN = "normalize(vec3(-0.22, 0.085, -1.0))";

const VERT = /* glsl */ `
  uniform float uAmp;
  uniform float uWidth;
  varying vec3 vN;
  varying float vR;

  float hump(vec2 p){
    float r = length(p);
    float h = uAmp * exp(-(r * r) / (uWidth * uWidth));
    // a little roll on the flanks so it is not a perfect bell
    h += 0.05 * uAmp * sin(p.x * 0.7) * cos(p.y * 0.6);
    return h;
  }

  void main(){
    vec2 p = position.xy;
    float h = hump(p);
    float e = 0.15;
    float hx = hump(p + vec2(e, 0.0)) - h;
    float hy = hump(p + vec2(0.0, e)) - h;
    vec3 nLocal = normalize(vec3(-hx / e, -hy / e, 1.0));
    vN = mat3(modelMatrix) * nLocal;
    vR = length(p);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p.x, p.y, h, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uFade;
  uniform float uWidth;
  uniform vec3 uGrass;
  varying vec3 vN;
  varying float vR;

  void main(){
    vec3 n = normalize(vN);
    float sun = max(dot(n, ${SUN}), 0.0);
    // Sunlit grass over a cool sky fill, so the shaded flank stays green not dark.
    vec3 col = uGrass * (0.5 + 0.66 * sun)
             + uGrass * vec3(0.26, 0.40, 0.34) * 0.34 * (1.0 - sun);
    // melt the rim into the flat grass around it
    float edge = 1.0 - smoothstep(uWidth * 1.4, uWidth * 2.5, vR);
    float a = edge * uFade;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`;

export default function HeroDune({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const grass = useMemo(() => new THREE.Color(0.24, 0.42, 0.15), []);

  // Crest lifted to exactly the door's base, so the door sits on top of it.
  const amp = DOOR_POS[1] - FLOOR_Y;

  useFrame(() => {
    if (mat.current) mat.current.uniforms.uFade.value = dayLight(nowRef.current);
  });

  return (
    <mesh
      position={[DOOR_POS[0], FLOOR_Y, DOOR_POS[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={1}
    >
      <planeGeometry args={[30, 30, 100, 100]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        uniforms={{
          uAmp: { value: amp },
          uWidth: { value: 4.6 },
          uFade: { value: 0 },
          uGrass: { value: grass },
        }}
      />
    </mesh>
  );
}
