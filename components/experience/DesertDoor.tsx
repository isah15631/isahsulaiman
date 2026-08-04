"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { FLOOR_Y } from "@/lib/descent";
import { formP, throughCamQ } from "@/lib/approach";

// The mirror the swarm flies into, out on the field.
//
// There is nothing here during the fall or the crash. It fades into being AFTER
// the landing, as the camera pulls back onto the vista, and then it simply stands
// there: a giant oval MIRROR, a sheet of polished glass reflecting the sky above
// and the grass below with a bright seam of horizon across its middle, a slow
// highlight sweeping over it and a lit lip around the rim. It is not made by the
// butterflies and they do not become it; they fly INTO it and are gone. It does
// not open and it does not show you a far side: it is the end of sight. You reach
// it, it swells to fill the lens, and you are through.

// The opening, an upright ellipse in world units. The camera drives through its
// centre, so its middle sits at DOOR_MID above the group base (matches the height
// ApproachCam aims and pushes through).
const RX = 0.95; // half width, metres
const RY = 1.6; // half height, metres
const DOOR_MID = 0.87;
// The plane the ellipse is cut out of, a little larger than the ellipse so the
// rim glow has room to bloom past the glass edge.
const PLANE_W = RX * 2.0 + 0.5;
const PLANE_H = RY * 2.0 + 0.5;
// The ellipse as a fraction of the plane's half-size, so the shader can test it
// straight off the 0..1 uv without knowing the metres.
const EX = RX / (PLANE_W / 2);
const EY = RY / (PLANE_H / 2);

const PORTAL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The mirror surface, cut to an ellipse. It reflects a stylised world rather than
// the real scene (there is no reflection pass): the sky up top, the grass at the
// foot, a bright horizon seam across the middle, over a silvery glass sheen. A
// faint ripple keeps the glass alive and a slow highlight sweeps across it, so it
// reads as a real mirror standing in the field and not a flat painted disc.
const PORTAL_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uForm;   // 0 not here yet, 1 fully present
  uniform vec2 uEllipse; // ellipse radii as a fraction of the plane half-size
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
    for (int i = 0; i < 5; i++){ s += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return s;
  }

  void main(){
    // Centre the uv and map it into the ellipse, so e is 0 at the middle and 1 on
    // the rim whatever the plane's aspect.
    vec2 p = (vUv - 0.5) * 2.0;
    vec2 ep = vec2(p.x / uEllipse.x, p.y / uEllipse.y);
    float e = length(ep);

    // A faint ripple across the glass, so the reflection breathes rather than
    // sitting dead still. It warps the coordinate the reflection is read from.
    float rip = fbm(ep * 3.5 + vec2(uTime * 0.05, -uTime * 0.04));
    float v = clamp(vUv.y + (rip - 0.5) * 0.05, 0.0, 1.0);

    // The reflected world: grass at the foot, a bright seam of horizon across the
    // middle, cool sky up top. A mirror standing in a field would show exactly
    // this, flipped, and it is what makes the oval read as reflective glass.
    vec3 grassRef  = vec3(0.26, 0.40, 0.22);
    vec3 horizon   = vec3(0.90, 0.94, 0.98);
    vec3 skyRef    = vec3(0.66, 0.76, 0.92);
    vec3 col = mix(grassRef, horizon, smoothstep(0.30, 0.50, v));
    col = mix(col, skyRef, smoothstep(0.52, 0.86, v));

    // Silvery finish: lift the whole surface toward a polished glass grey so it is
    // clearly a mirror and not just a painted landscape.
    col = mix(col, vec3(0.82, 0.88, 0.96), 0.34);

    // A slow diagonal highlight sweeping across, the tell-tale glare travelling
    // over a sheet of glass.
    float band = (p.x * 0.6 + p.y * 0.4) - sin(uTime * 0.22) * 1.3;
    col += vec3(1.0) * smoothstep(0.09, 0.0, abs(band)) * 0.22;

    // A sparse sparkle of reflected light riding the ripple crests.
    float glint = smoothstep(0.72, 0.95, fbm(ep * 6.0 - uTime * 0.08));
    col += vec3(0.92, 0.96, 1.0) * glint * 0.14;

    // A lit lip of glass right around the ellipse, catching the daylight.
    float rim = smoothstep(0.82, 1.0, e);
    col += vec3(0.85, 0.90, 1.0) * rim * 0.5;

    // The elliptical cutout, antialiased at the edge; nothing past the rim. It
    // simply fades in with uForm as the mirror appears after the crash.
    float a = (1.0 - smoothstep(0.99, 1.02, e)) * smoothstep(0.0, 1.0, uForm);
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
`;

type DesertDoorProps = {
  /** World position of the portal's rise. */
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
  // How awake the portal is: 0 a dim pool turning quietly, 1 shimmering with its
  // throat up. Eased toward its target so it comes alive rather than switching on.
  const wake = useRef(0);
  const portalRef = useRef<THREE.Mesh>(null);

  const portalMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PORTAL_VERT,
        fragmentShader: PORTAL_FRAG,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uForm: { value: 0 },
          uTime: { value: 0 },
          uEllipse: { value: new THREE.Vector2(EX, EY) },
        },
      }),
    []
  );

  // A soft dark pool on the grass right under the portal, so the oval does not
  // float: the ground it stands on reads as shadowed by the mass hanging over it.
  const shadowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uForm: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uForm;
          varying vec2 vUv;
          void main(){
            vec2 p = (vUv - vec2(0.5, 0.4)) * vec2(1.0, 2.0);
            // comes up with the portal, so there is no shade before there is a
            // portal to cast it
            float a = smoothstep(0.5, 0.0, length(p)) * 0.5 * uForm;
            gl_FragColor = vec4(0.10, 0.16, 0.10, a);
          }
        `,
      }),
    []
  );

  useFrame((state, dt) => {
    // How far the mirror has appeared: 0 nothing there, 1 fully present. Driven
    // straight off the clock as it fades in after the crash when we have one; eased
    // toward the open prop otherwise, so the scratch harness can bring it up by hand.
    let form: number;
    if (nowRef) {
      form = formP(nowRef.current);
    } else {
      const target = open ? 1 : 0;
      const k = 1 - Math.pow(0.0025, Math.min(dt, 0.05));
      wake.current += (target - wake.current) * k;
      form = wake.current;
    }

    const now = state.clock.getElapsedTime();
    portalMat.uniforms.uForm.value = form;
    portalMat.uniforms.uTime.value = now;
    shadowMat.uniforms.uForm.value = form;

    // Hold the oval at a steady on-screen size as the camera eases in. The final
    // move closes from STANDOFF to STOP_AT metres (it never crosses the plane), and
    // plain perspective would swell the oval on its own over that gap. Counter-scale
    // it by the same ratio the distance shrinks (about the mesh's own centre), so it
    // keeps its size the whole way in. STANDOFF and STOP_AT mirror ApproachCam.
    if (portalRef.current && nowRef) {
      const STANDOFF = 3.1;
      const STOP_AT = 1.5;
      const dist = STANDOFF - (STANDOFF - STOP_AT) * throughCamQ(nowRef.current);
      portalRef.current.scale.setScalar(dist / STANDOFF);
    }
  });

  return (
    <group position={position}>
      {/* the soft pool of shade under the portal, laid flat on the crest of the
          grassy rise it stands on (local y 0 is the mound top) */}
      <mesh
        position={[0, 0.03, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[RX * 3.0, RY * 1.6]} />
        <primitive object={shadowMat} attach="material" />
      </mesh>

      {/* the portal itself: an upright oval of turning water-glass, its centre at
          DOOR_MID so the camera drives straight through the middle of it, and
          double-sided so it still reads as the lens pushes through into the dark */}
      <mesh ref={portalRef} position={[0, DOOR_MID, 0]}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
        <primitive object={portalMat} attach="material" />
      </mesh>
    </group>
  );
}
