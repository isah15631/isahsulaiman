"use client";

// Scratch harness for looking at the drop. Not linked from anywhere.
//
// The real thing plays once, on its own clock, and is over in three seconds,
// which makes it almost impossible to inspect a particular instant. This
// renders the same scene with the frame loop switched off and hands the step
// function to window, so any moment can be held still and looked at.

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { createOrbGeometry, ORB_RADIUS } from "@/lib/orbGeometry";
import Floor from "@/components/experience/Floor";
import Orb from "@/components/experience/Orb";

const FLOOR_Y = -1.6;
const REST_Y = FLOOR_Y + ORB_RADIUS;

declare global {
  interface Window {
    __orb?: {
      probe: () => Record<string, unknown>;
      /** Jump to an absolute time, in seconds since the scene mounted. */
      seek: (seconds: number) => void;
      struck: () => boolean;
    };
  }
}

let cursor = 0;

function Expose({
  struck,
  nowRef,
}: {
  struck: boolean;
  nowRef: React.MutableRefObject<number>;
}) {
  const advance = useThree((s) => s.advance);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    window.__orb = {
      probe: () => {
        const out: Record<string, unknown> = {
          cam: camera.position.toArray().map((n) => +n.toFixed(2)),
          struck,
        };
        scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          const mat = m.material as THREE.ShaderMaterial;
          if (mat.uniforms?.uFlash) {
            out.flash = +mat.uniforms.uFlash.value.toFixed(3);
            out.dust = +mat.uniforms.uDust.value.toFixed(3);
            out.floorY = +m.position.y.toFixed(2);
          }
          if (mat.uniforms?.uShatter) {
            out.shatter = +mat.uniforms.uShatter.value.toFixed(3);
            out.orbY = +m.position.y.toFixed(2);
          }
        });
        return out;
      },
      seek: (seconds) => {
        // Stepped rather than jumped: the orb and the floor both work from
        // elapsed time, and the impact is detected on the frame it happens, so
        // skipping straight there would skip past it. Forward only, from
        // wherever it got to last time — replaying from zero would send the
        // clock backwards past an impact that has already been recorded.
        const step = 1 / 60;
        let t = cursor;
        while (t <= seconds + 1e-6) {
          // The scene reads its own position out of the shared descent clock
          // now, so stepping it means stepping that too.
          nowRef.current = t;
          advance(t);
          t += step;
        }
        cursor = t;
      },
      struck: () => struck,
    };
  }, [advance, struck, scene, camera, nowRef]);
  return null;
}

export default function DevOrb() {
  const geometry = useMemo(() => createOrbGeometry(4), []);
  const [struck, setStruck] = useState(false);
  const nowRef = useRef(0);

  return (
    // Fills the viewport, exactly like the real thing. A fixed-size box gets
    // cropped by whatever window this is being looked at in, which quietly
    // invalidates every judgement about where in the frame anything sits.
    <div style={{ width: "100vw", height: "100dvh", background: "#000" }}>
      <Canvas
        frameloop="never"
        camera={{ position: [0, 2.8, 7.2], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        dpr={1}
        onCreated={({ camera }) => camera.lookAt(0, -0.2, 0)}
      >
        <Expose struck={struck} nowRef={nowRef} />
        <Floor y={FLOOR_Y} struck={struck} />
        <Orb geometry={geometry} nowRef={nowRef} onImpact={() => setStruck(true)} />
      </Canvas>
    </div>
  );
}
