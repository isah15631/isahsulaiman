"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { PerspectiveCamera } from "three";
import { createHeartGeometry, sampleSurface } from "@/lib/heartGeometry";
import Heart from "./Heart";
import StoneMotes from "./StoneMotes";

// The heart is ~2.4 units across. A perspective camera's fov is VERTICAL, so on
// a portrait phone the horizontal view is far narrower and the heart's sides get
// cropped. Pull the camera back until it fits on whichever axis is tighter.
const HALF_EXTENT = 1.45; // half the heart, plus breathing room

function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    const halfFov = (cam.fov * Math.PI) / 360;
    const aspect = size.width / Math.max(1, size.height);
    const forHeight = HALF_EXTENT / Math.tan(halfFov);
    const forWidth = forHeight / Math.max(0.0001, aspect);
    cam.position.z = Math.max(5, forHeight, forWidth);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

type HeartSceneProps = {
  targetAwaken: number;
  beatRate: number;
  shattering: boolean;
  onTap?: () => void;
  onShatterDone?: () => void;
};

function Contents(props: HeartSceneProps) {
  // 80 segments ≈ 12.8k faces, grouped into slabs by createHeartGeometry.
  // The scene owns the geometry so the falling stone can spawn from the very
  // same surface the heart is made of.
  const geometry = useMemo(() => createHeartGeometry(80), []);
  const origins = useMemo(() => sampleSurface(geometry, 90), [geometry]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <>
      <FitCamera />
      {/* deliberately restrained lighting — the heart lights itself as it wakes */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={0.7} />
      <pointLight position={[-4, -2, 3]} intensity={0.3} color="#ff7a4d" />
      <Heart geometry={geometry} {...props} />
      <StoneMotes
        origins={origins}
        awaken={props.targetAwaken}
        shattering={props.shattering}
      />
    </>
  );
}

export default function HeartScene(props: HeartSceneProps) {
  // Phones combine the highest pixel ratios with the weakest GPUs, and this is
  // a fragment-heavy shader — so cap them harder than desktop.
  const narrow = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      gl={{ antialias: !narrow, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, narrow ? 1.25 : 1.5]}
    >
      <Contents {...props} />
    </Canvas>
  );
}
