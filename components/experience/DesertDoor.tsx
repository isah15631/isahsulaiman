"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { FLOOR_Y } from "@/lib/descent";
import { doorOpen } from "@/lib/approach";

// A doorway standing alone in the snow, with no house around it and nothing
// behind it but more desert. It is the one made thing in the whole shot:
// everything else is moon, sand, snow and sky, and then this, waiting.
//
// But there is no door in it. Where the leaf should be there is a PORTAL — an
// opaque, faintly liquid dark that fills the opening, shimmering and churning
// like a standing pool of obsidian with a warm heart breathing at its centre.
// It does not open and it does not show you a far side: it is the end of sight.
// You reach it, it swells to fill the lens, and you are through. A door promises
// a reveal; this refuses one, which is the whole point — the introduction says
// "you found the door" and then shows you a threshold it will not explain.
//
// The frame is still the pale sandstone one, lit by the same high sun the ground
// is, so the made thing reads as solid and of this world. Only the thing it holds
// is not.
//
// No lights in this scene, so every surface shades itself: a plain Lambert wrap
// against one fixed sun for the frame, and the portal lights itself.

// One sun for the whole frame, high and raked a little off to the side so the
// front face and one jamb both catch it and the thing reads as solid.
const SUN = "normalize(vec3(-0.32, 0.86, 0.40))";

const SURFACE_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec2 vUv;
  void main(){
    // World-space normal, so the sun is a direction in the world.
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

  void main(){
    vec3 n = normalize(vN);
    float lambert = 0.34 + 0.78 * max(dot(n, ${SUN}), 0.0);
    gl_FragColor = vec4(uColor * lambert, 1.0);
  }
`;

// The portal itself. Opaque: alpha is always 1, and the frame's jambs crop it to
// the opening. It churns on domain-warped noise so it reads as a pool being
// stirred rather than a texture sliding past, cool veins catching the snow-light
// and a warm ember heart that only comes up as it wakes.
const PORTAL_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uWake;
  varying vec2 vUv;

  float hash(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p){
    float s = 0.0;
    float a = 0.55;
    for (int i = 0; i < 4; i++){
      s += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return s;
  }

  void main(){
    vec2 uv = vUv;
    float t = uTime * 0.08;

    // domain warp, so the surface folds into itself like a slow liquid
    vec2 warp = vec2(
      fbm(uv * 2.5 + vec2(0.0, t)),
      fbm(uv * 2.5 + vec2(4.7, -t))
    );
    float n = fbm(uv * 3.2 + warp * 0.8 + vec2(t * 0.6, -t * 0.4));
    float n2 = fbm(uv * 6.0 - warp * 0.5 + vec2(-t * 0.3, t * 0.5));

    // obsidian base, a faint cool depth in the churn
    vec3 col = mix(vec3(0.015, 0.020, 0.035), vec3(0.05, 0.07, 0.11), n);

    // cool veins catching the light along the crests, alive even dormant and
    // brighter as it wakes
    float veins = smoothstep(0.60, 0.80, n2);
    col += vec3(0.30, 0.42, 0.60) * veins * (0.18 + 0.55 * uWake);

    // the warm heart, low and central, breathing, coming up only as it wakes
    vec2 pc = (uv - vec2(0.5, 0.32)) * vec2(1.15, 1.0);
    float core = smoothstep(0.62, 0.0, length(pc));
    float breathe = 0.82 + 0.18 * sin(uTime * 1.6) * sin(uTime * 0.7 + 1.0);
    col += vec3(1.0, 0.52, 0.22) * core * uWake * breathe * (0.55 + 0.45 * n);

    // a tight bright glint at the very centre, so the dark has a point of light
    float heart = smoothstep(0.16, 0.0, length(pc));
    col += vec3(1.0, 0.74, 0.42) * heart * uWake * 0.55;

    // cold rim, the snow-light catching the surface where it meets the frame
    float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float rim = smoothstep(0.14, 0.0, edge);
    col += vec3(0.34, 0.44, 0.58) * rim * 0.20;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Surface({
  args,
  position,
  color,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow={false}>
      <boxGeometry args={args} />
      <shaderMaterial
        vertexShader={SURFACE_VERT}
        fragmentShader={SURFACE_FRAG}
        uniforms={{
          uColor: { value: new THREE.Color(...color) },
          uPanel: { value: 0 },
        }}
      />
    </mesh>
  );
}

// The opening the portal fills, in world units.
const W = 1.02;
const H = 2.14;
// Frame members.
const JAMB = 0.16;
const DEPTH = 0.26;

type DesertDoorProps = {
  /** World position of the threshold centre. */
  position?: [number, number, number];
  /** Dormant or woken. Animated toward internally. Ignored when nowRef is given. */
  open?: boolean;
  /**
   * The descent clock. When present the portal wakes itself on the beat the
   * approach reaches it, rather than being told to from outside.
   */
  nowRef?: MutableRefObject<number>;
};

export default function DesertDoor({
  position = [0, FLOOR_Y, 0],
  open = false,
  nowRef,
}: DesertDoorProps) {
  // How awake the portal is: 0 a dim dark pool, 1 shimmering with its warm heart
  // up. Eased toward its target so it comes alive rather than switching on.
  const wake = useRef(0);

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
            // A soft pool under the frame, raked out the way the low sun throws
            // it. Cool blue-grey, the colour a shadow on snow is.
            vec2 p = (vUv - vec2(0.42, 0.34)) * vec2(1.0, 2.4);
            float a = smoothstep(0.5, 0.0, length(p)) * 0.6;
            gl_FragColor = vec4(0.30, 0.38, 0.52, a);
          }
        `,
      }),
    []
  );

  // The portal's own surface.
  const portalMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERT,
        fragmentShader: PORTAL_FRAG,
        side: THREE.DoubleSide,
        uniforms: { uWake: { value: 0 }, uTime: { value: 0 } },
      }),
    []
  );

  // The warm light the woken portal spills onto the cold snow in front of it: the
  // one warm thing in the whole world, and the reason the eye goes to it.
  // Additive, so it lifts the blue snow toward amber, and it grows as the portal
  // wakes so it arrives with the shimmer.
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uOpen: { value: 0 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpen;
          uniform float uTime;
          varying vec2 vUv;
          void main(){
            float d = length((vUv - 0.5) * vec2(1.0, 0.82)) * 2.0;
            float pool = 1.0 - smoothstep(0.1, 1.0, d);
            float flick = 0.86 + 0.14 * sin(uTime * 6.1) * sin(uTime * 2.7 + 1.3);
            float a = pow(pool, 1.3) * uOpen * flick * 0.7;
            if (a < 0.003) discard;
            gl_FragColor = vec4(vec3(1.0, 0.6, 0.27) * a, a);
          }
        `,
      }),
    []
  );

  useFrame((state, dt) => {
    // Ease wake toward its target rather than snapping. Framerate aware, so it
    // wakes at the same pace on any machine.
    const wantOpen = nowRef ? doorOpen(nowRef.current) : open;
    const target = wantOpen ? 1 : 0;
    const k = 1 - Math.pow(0.0025, Math.min(dt, 0.05));
    wake.current += (target - wake.current) * k;

    const now = state.clock.getElapsedTime();
    portalMat.uniforms.uWake.value = wake.current;
    portalMat.uniforms.uTime.value = now;
    // The spill follows the wake, and breathes on the lantern's flicker.
    glowMat.uniforms.uOpen.value = wake.current;
    glowMat.uniforms.uTime.value = now;
  });

  const half = W / 2;
  const post = H + JAMB * 1.4;

  return (
    <group position={position}>
      {/* contact shadow on the snow, laid flat just above the ground */}
      <mesh
        position={[0.05, 0.02, 0.15]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[W * 2.4, DEPTH * 6]} />
        <primitive object={shadowMat} attach="material" />
      </mesh>

      {/* the warm light the woken portal pours out onto the snow in front of it,
          laid flat on the ground and reaching forward toward the camera */}
      <mesh
        position={[0, FLOOR_Y - position[1] + 0.04, 2.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[3.4, 4.8]} />
        <primitive object={glowMat} attach="material" />
      </mesh>

      {/* the frame: two jambs, a lintel, and a threshold half sunk in the snow.
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

      {/* the portal, filling the opening. Set at the middle of the frame's depth
          so the jambs crop it cleanly on both sides, double-sided so it still
          reads as the camera pushes through it into the dark. */}
      <mesh position={[0, H / 2 - 0.2, 0]}>
        <planeGeometry args={[W, H]} />
        <primitive object={portalMat} attach="material" />
      </mesh>
    </group>
  );
}
