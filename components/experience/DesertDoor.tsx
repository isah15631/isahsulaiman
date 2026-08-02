"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { FLOOR_Y } from "@/lib/descent";
import { doorOpen } from "@/lib/approach";

// A door standing alone in the sand, with no house around it and nothing behind
// it but more desert. It is the one made thing in the whole shot: everything
// else is moon, sand and sky, and then this, waiting.
//
// Closed, it is a dark paneled slab in a pale sandstone frame, lit by the same
// high sun the ground is. Opened, it does NOT show the desert on the far side of
// it: it shows the dark, because the far side of this door is the inside of the
// piece. The reveal is that a door in broad daylight opens onto night.
//
// No lights in this scene, so every surface shades itself: a plain Lambert wrap
// against one fixed sun, the same direction for the frame, the leaf and the
// handle, so the whole object agrees on where the light is.

// One sun for the whole door, high and raked a little off to the side so the
// front face and one jamb both catch it and the thing reads as solid rather than
// as a flat card.
const SUN = "normalize(vec3(-0.32, 0.86, 0.40))";

const SURFACE_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec2 vUv;
  void main(){
    // World-space normal, so the sun is a direction in the world and the leaf
    // catches the light differently as it swings open.
    vN = mat3(modelMatrix) * normal;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SURFACE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPanel;
  varying vec3 vN;
  varying vec2 vUv;

  // Signed box: negative inside the rectangle, positive outside, and the value
  // itself is the distance to the nearest edge, which is what the groove reads.
  float sbox(vec2 p, vec2 c, vec2 h){
    vec2 d = abs(p - c) - h;
    return max(d.x, d.y);
  }

  void main(){
    vec3 n = normalize(vN);
    float lambert = 0.34 + 0.78 * max(dot(n, ${SUN}), 0.0);
    vec3 col = uColor;

    // Panel detail lives only on the leaf, and only on its front face, so the
    // grain and the sunk panels do not wrap onto the edges or the frame.
    if (uPanel > 0.5 && n.z > 0.45) {
      float grain = 0.93 + 0.07 * sin(vUv.x * 70.0 + sin(vUv.y * 9.0) * 2.2);
      col *= grain;

      // Two stacked sunk panels, the classic joinery. One groove line around
      // each, and the sunk field a touch darker than the stiles around it.
      float upper = sbox(vUv, vec2(0.5, 0.71), vec2(0.29, 0.15));
      float lower = sbox(vUv, vec2(0.5, 0.30), vec2(0.29, 0.15));
      float panel = min(upper, lower);
      float groove = 1.0 - smoothstep(0.0, 0.02, abs(panel));
      col *= 1.0 - groove * 0.55;
      if (panel < 0.0) col *= 0.9;
    }

    gl_FragColor = vec4(col * lambert, 1.0);
  }
`;

// The dark on the far side of the door. Near black, with the faintest warm
// breath low and central: the lantern, already in there, waiting to be found.
const VOID_FRAG = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vec2 p = (vUv - vec2(0.5, 0.16)) * vec2(1.3, 1.0);
    float glow = smoothstep(0.62, 0.0, length(p));
    vec3 col = vec3(0.020, 0.016, 0.012) + vec3(1.0, 0.52, 0.22) * glow * 0.14;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Surface({
  args,
  position,
  color,
  panel = false,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: [number, number, number];
  panel?: boolean;
}) {
  return (
    <mesh position={position} castShadow={false}>
      <boxGeometry args={args} />
      <shaderMaterial
        vertexShader={SURFACE_VERT}
        fragmentShader={SURFACE_FRAG}
        uniforms={{
          uColor: { value: new THREE.Color(...color) },
          uPanel: { value: panel ? 1 : 0 },
        }}
      />
    </mesh>
  );
}

// The opening the leaf fills, in world units.
const W = 1.02;
const H = 2.14;
// Frame members.
const JAMB = 0.16;
const DEPTH = 0.26;
// How far the leaf swings, inward and away from the camera, into the dark.
const OPEN_ANGLE = -1.95;

type DesertDoorProps = {
  /** World position of the threshold centre. */
  position?: [number, number, number];
  /** Shut or open. Animated toward internally. Ignored when nowRef is given. */
  open?: boolean;
  /**
   * The descent clock. When present the leaf opens itself on the beat the
   * approach reaches it, rather than being told to from outside.
   */
  nowRef?: MutableRefObject<number>;
};

export default function DesertDoor({
  position = [0, FLOOR_Y, 0],
  open = false,
  nowRef,
}: DesertDoorProps) {
  const leaf = useRef<THREE.Group>(null);
  const swing = useRef(0);

  const shadowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {},
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          void main(){
            // A soft pool under the door, raked out the way the low sun throws it.
            // Cool blue-grey, the colour a shadow on snow is, not the warm near
            // black it was in the sand.
            vec2 p = (vUv - vec2(0.42, 0.34)) * vec2(1.0, 2.4);
            float a = smoothstep(0.5, 0.0, length(p)) * 0.6;
            gl_FragColor = vec4(0.30, 0.38, 0.52, a);
          }
        `,
      }),
    []
  );

  useFrame((_, dt) => {
    // Ease the swing toward its target rather than snapping. Framerate aware, so
    // it opens at the same pace on any machine.
    const wantOpen = nowRef ? doorOpen(nowRef.current) : open;
    const target = wantOpen ? 1 : 0;
    const k = 1 - Math.pow(0.001, Math.min(dt, 0.05));
    swing.current += (target - swing.current) * k;
    if (leaf.current) leaf.current.rotation.y = swing.current * OPEN_ANGLE;
  });

  const half = W / 2;
  const post = H + JAMB * 1.4;

  return (
    <group position={position}>
      {/* contact shadow on the sand, laid flat just above the ground */}
      <mesh
        position={[0.05, 0.02, 0.15]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[W * 2.4, DEPTH * 6]} />
        <primitive object={shadowMat} attach="material" />
      </mesh>

      {/* the frame: two jambs, a lintel, and a threshold half sunk in the sand.
          The sandstone is a shade darker than the dune so the doorway separates
          from the ground it stands in. */}
      <Surface
        args={[JAMB, post, DEPTH]}
        position={[-(half + JAMB / 2), post / 2 - 0.2, 0]}
        color={[0.72, 0.63, 0.49]}
      />
      <Surface
        args={[JAMB, post, DEPTH]}
        position={[half + JAMB / 2, post / 2 - 0.2, 0]}
        color={[0.72, 0.63, 0.49]}
      />
      <Surface
        args={[W + JAMB * 2, JAMB * 1.4, DEPTH]}
        position={[0, H + JAMB * 0.5 - 0.2, 0]}
        color={[0.78, 0.69, 0.55]}
      />
      <Surface
        args={[W + JAMB * 0.6, 0.12, DEPTH * 1.1]}
        position={[0, FLOOR_Y - position[1] + 0.04, 0]}
        color={[0.66, 0.57, 0.44]}
      />

      {/* the dark beyond, filling the opening, set back so the shut leaf hides
          it and an open one reveals it */}
      <mesh position={[0, H / 2 - 0.2, -DEPTH * 0.42]}>
        <planeGeometry args={[W, H]} />
        <shaderMaterial vertexShader={SURFACE_VERT} fragmentShader={VOID_FRAG} />
      </mesh>

      {/* the leaf, hinged on the left jamb so it swings inward from that edge */}
      <group ref={leaf} position={[-half, 0, 0]}>
        <Surface
          args={[W - 0.04, H, 0.08]}
          position={[(W - 0.04) / 2, H / 2 - 0.2, 0]}
          color={[0.22, 0.15, 0.10]}
          panel
        />
        {/* handle, on the swinging edge opposite the hinge */}
        <mesh position={[W - 0.16, H / 2 - 0.32, 0.09]}>
          <sphereGeometry args={[0.05, 16, 12]} />
          <shaderMaterial
            vertexShader={SURFACE_VERT}
            fragmentShader={SURFACE_FRAG}
            uniforms={{
              uColor: { value: new THREE.Color(0.78, 0.6, 0.28) },
              uPanel: { value: 0 },
            }}
          />
        </mesh>
      </group>
    </group>
  );
}
