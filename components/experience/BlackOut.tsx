"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { blackQ } from "@/lib/approach";

// The dark that closes over the water once the butterflies have fallen back in.
// Held right in front of the camera and drawn last, so it covers the whole frame
// however the shot is composed, and driven by the BLACK beat so it arrives as the
// last ripple settles.
//
// This IS the cut. Both sides of it are black: the lake ends here and the dark
// interior begins on the far side of it, so nothing has to line up across the
// join because there is nothing to see across it.

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
    // Driven by the BLACK beat: it starts closing as the butterflies settle back
    // into the water and is fully shut by the time the canvas hands over to the
    // dark interior.
    const q = blackQ(nowRef.current);
    if (mat.current) mat.current.opacity = q;
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
