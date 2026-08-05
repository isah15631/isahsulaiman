"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import { createOrbGeometry } from "@/lib/orbGeometry";
import {
  EYE_Y,
  FOV,
  HALF_H,
  HALF_W,
  LOOK_Y,
  SPACE_Y,
  camY,
} from "@/lib/descent";
import BlackOut from "./BlackOut";
import DaySky from "./DaySky";
import Orb from "./Orb";
import Sky from "./Sky";
import Space from "./Space";
import Splash from "./Splash";
import Water from "./Water";

// One shot, from a moon hanging in space to a splash on a black lake.
//
// There is no cut in it and no second scene: the moon that meets the water is the
// moon that was hanging there, the lake it lands on was always underneath, and the
// camera falls the whole way down with it. Everything in here — where the camera
// is, where the moon is, how hard the air is tearing at it — comes out of one
// timeline in lib/descent, and nothing computes its own version of any of it.
//
// The camera does not swoop or lead or find anything. It rides beside the moon at
// a fixed distance, so the moon sits still in the frame and it is the universe
// that moves, and then it slows to a stop at exactly the height the landing was
// framed from and holds there on the water while the moon sinks, a plume rises
// into two butterflies, and they fall back in. That held shot is where the fall
// pays off, and it is the one bit of it that is solved rather than animated.

/**
 * How far back the camera sits.
 *
 * Fixed for the whole descent, so the moon is the same size on screen the entire
 * way down and the final framing is the final framing whatever the viewport is.
 * Fitted to hold the fall and a stretch of floor below the impact, and to keep
 * the sphere clear of the edges — but not every shard. On a portrait phone the
 * widest pieces leave the frame, which is fine: a moment later they are
 * butterflies and they were leaving anyway.
 */
export function fitDistance(width: number, height: number) {
  const tan = Math.tan((FOV * Math.PI) / 360);
  const aspect = width / Math.max(1, height);
  return Math.max(5, HALF_H / tan, HALF_W / tan / Math.max(0.0001, aspect));
}

/**
 * The one clock. Mounted first, so everything else reads a fresh value.
 *
 * Exported, with the rig, so a harness can compose this same scene with the frame
 * loop switched off and hold any instant of the descent still to be looked at.
 */
export function Clock({
  nowRef,
}: {
  nowRef: React.MutableRefObject<number>;
}) {
  const started = useRef<number | null>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (started.current === null) started.current = t;
    nowRef.current = t - started.current;
  }, -100);
  return null;
}

/**
 * Compile every shader before the fall, not during it.
 *
 * The cloud deck is a stack of eleven separate fbm shaders sitting far below the
 * moon, frustum-culled until the camera falls near them at atmosphere entry —
 * and three.js compiles a material's GPU program the first time it is actually
 * drawn. That put all eleven compiles in the single frame the deck came into
 * view, which is the hitch you feel entering the air. Compiling the whole scene
 * once at mount, while the moon is still just hanging there, moves that cost off
 * the timeline so nothing stalls the fall. Runs once; after mount everything is
 * already warm.
 */
function Warmup() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gl.compile(scene, camera);
  }, [gl, scene, camera]);
  return null;
}

export function Rig({ nowRef }: { nowRef: React.MutableRefObject<number> }) {
  const { camera, size } = useThree();
  const dist = useMemo(
    () => fitDistance(size.width, size.height),
    [size.width, size.height]
  );

  useFrame(() => {
    const cam = camera as PerspectiveCamera;
    const y = camY(nowRef.current);
    cam.position.set(0, y, dist);
    // Looking the same way the whole time: level with a tilt down the floor. The
    // amount it looks below itself is exactly the amount it looks below itself at
    // the landing, so the framing never has to be corrected at the end — it is
    // already right, and has been since space.
    cam.lookAt(0, y - (EYE_Y - LOOK_Y), 0);
    cam.updateProjectionMatrix();
  }, -50);

  return null;
}

type OrbSceneProps = {
  onImpact?: () => void;
};

function Contents({ onImpact }: OrbSceneProps) {
  // Seeded per mount so it never breaks the same way twice. Safe to call
  // Math.random here: the scene is loaded with ssr:false, so there is no
  // server render to disagree with.
  const geometry = useMemo(() => createOrbGeometry(Math.random() * 100), []);
  const nowRef = useRef(0);

  return (
    <>
      <Clock nowRef={nowRef} />
      <Warmup />
      <Rig nowRef={nowRef} />
      {/* No lights anywhere in here. Every material does its own shading, and
          until the moon meets the water there is nothing in this scene to light.
          The rig holds the landing framing on the water for the whole ending, so
          there is no separate approach camera any more. */}
      <DaySky nowRef={nowRef} />
      <Space nowRef={nowRef} />
      <Sky nowRef={nowRef} />
      {/* The still black lake, the ring the moon lets go of as it sinks, and the
          smaller rings where the butterflies fall back in. */}
      <Water nowRef={nowRef} />
      <Orb geometry={geometry} nowRef={nowRef} onImpact={onImpact} />
      {/* The plume that rises where the moon went in and becomes two butterflies
          that arc apart and fall back into the water. */}
      <Splash nowRef={nowRef} />
      {/* The dark that closes over the water once they have fallen back in. Last
          thing drawn, so it covers the whole shot. */}
      <BlackOut nowRef={nowRef} />
    </>
  );
}

export default function OrbScene(props: OrbSceneProps) {
  // Phones combine the highest pixel ratios with the weakest GPUs, so cap them
  // harder than desktop.
  const narrow = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <Canvas
      // Starts where the moon is, so the very first frame is already the shot
      // rather than a frame of the camera arriving at it.
      camera={{ position: [0, SPACE_Y, 8], fov: FOV, near: 0.1, far: 3000 }}
      gl={{ antialias: !narrow, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, narrow ? 1.25 : 1.5]}
    >
      <Contents {...props} />
    </Canvas>
  );
}
