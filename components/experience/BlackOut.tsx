"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { throughCamQ } from "@/lib/approach";

// The dark the door opens onto, closing over the lens as the camera goes
// through. Held right in front of the camera and drawn last, so it covers the
// whole frame however the shot is composed, and driven by the same through
// value as the camera move so the black arrives exactly as the doorway fills
// the view.
//
// This IS the cut. Both sides of it are black: the desert ends here and the
// dark interior begins on the far side of it, so nothing has to line up across
// the join because there is nothing to see across it.

export default function BlackOut({
  nowRef,
}: {
  nowRef: MutableRefObject<number>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (mesh.current) {
      mesh.current.position.copy(camera.position);
      mesh.current.quaternion.copy(camera.quaternion);
      mesh.current.translateZ(-0.4);
    }
    // Tied to the camera's own push (throughCamQ), and run ahead of it, so the
    // black is fully closed by the time the lens reaches the doorway's dark
    // interior plane. That is the fix for the flash of the snow world behind the
    // door: the push now outpaces a gentle fade, so the fade has to lead it.
    const q = throughCamQ(nowRef.current);
    if (mat.current) mat.current.opacity = Math.min(1, q * 1.5);
  });

  return (
    <mesh ref={mesh} renderOrder={999}>
      <planeGeometry args={[8, 6]} />
      <meshBasicMaterial
        ref={mat}
        color="#050303"
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
