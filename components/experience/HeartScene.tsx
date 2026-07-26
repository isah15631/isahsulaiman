"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { createHeartGeometry, sampleSurface } from "@/lib/heartGeometry";
import Heart from "./Heart";
import StoneMotes from "./StoneMotes";

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
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      // The heart shader is fragment-heavy; capping the pixel ratio at 1.5
      // keeps retina displays from quadrupling the cost for no visible gain.
      dpr={[1, 1.5]}
    >
      <Contents {...props} />
    </Canvas>
  );
}
