"use client";

// Scratch harness for the descent. Not linked from anywhere.
//
// Same scene the real thing builds, with the frame loop switched off and the
// step function handed to window, so any instant of the fall can be held still
// and looked at — and, since nothing here composites, measured in pixels.

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { createOrbGeometry } from "@/lib/orbGeometry";
import { BEAT, FLOOR_Y, FOV, SPACE_Y, camY, orbY, burn } from "@/lib/descent";
import { APPROACH, THROUGH } from "@/lib/approach";
import { Clock, Rig } from "@/components/experience/OrbScene";
import ApproachCam from "@/components/experience/ApproachCam";
import BlackOut from "@/components/experience/BlackOut";
import DaySky from "@/components/experience/DaySky";
import Debris from "@/components/experience/Debris";
import DesertDoor from "@/components/experience/DesertDoor";
import DuneRidges from "@/components/experience/DuneRidges";
import Floor from "@/components/experience/Floor";
import LeaderButterflies from "@/components/experience/LeaderButterflies";
import Orb from "@/components/experience/Orb";
import Sky from "@/components/experience/Sky";
import Snowfall from "@/components/experience/Snowfall";
import SnowBurst from "@/components/experience/SnowBurst";
import Space from "@/components/experience/Space";

declare global {
  interface Window {
    __dev?: {
      seek: (seconds: number) => void;
      look: () => Record<string, unknown>;
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
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    window.__dev = {
      seek: (seconds) => {
        // Stepped, not jumped: the impact is detected on the frame it happens.
        const step = 1 / 60;
        let t = cursor;
        while (t <= seconds + 1e-6) {
          nowRef.current = t;
          advance(t);
          t += step;
        }
        cursor = t;
      },
      look: () => {
        const c = gl.domElement;
        const ctx = gl.getContext();
        const w = c.width;
        const h = c.height;
        const px = new Uint8Array(w * h * 4);
        ctx.readPixels(0, 0, w, h, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
        // Rows are bottom-up out of GL, so band 0 is the bottom of the frame.
        const bands = [0, 0, 0, 0];
        const counts = [0, 0, 0, 0];
        let lit = 0;
        let peak = 0;
        for (let y = 0; y < h; y += 2) {
          const b = Math.min(3, Math.floor((y / h) * 4));
          for (let x = 0; x < w; x += 2) {
            const i = (y * w + x) * 4;
            const l = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
            bands[b] += l;
            counts[b]++;
            if (l > 8) lit++;
            if (l > peak) peak = l;
          }
        }
        return {
          t: +cursor.toFixed(2),
          orbY: +orbY(nowRef.current).toFixed(2),
          camY: +camY(nowRef.current).toFixed(2),
          burn: +burn(nowRef.current).toFixed(2),
          struck,
          // mean luminance from the bottom of the frame to the top
          bands: bands.map((s, i) => +(s / Math.max(1, counts[i])).toFixed(2)),
          litFraction: +(lit / (counts.reduce((a, b) => a + b, 0) || 1)).toFixed(4),
          peak,
          camPos: camera.position.toArray().map((n) => +n.toFixed(2)),
        };
      },
      struck: () => struck,
    };
  }, [advance, gl, camera, struck, nowRef]);

  return null;
}

const DOOR_POS: [number, number, number] = [1.5, FLOOR_Y, -3.5];

export default function DevSpace() {
  const geometry = useMemo(() => createOrbGeometry(7), []);
  const [struck, setStruck] = useState(false);
  const nowRef = useRef(0);

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#000" }}>
      <Canvas
        frameloop="never"
        camera={{ position: [0, SPACE_Y, 8], fov: FOV, near: 0.1, far: 3000 }}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        dpr={1}
      >
        <Expose struck={struck} nowRef={nowRef} />
        <Clock nowRef={nowRef} />
        <Rig nowRef={nowRef} />
        <DaySky nowRef={nowRef} />
        <DuneRidges nowRef={nowRef} />
        <Space nowRef={nowRef} />
        <Sky nowRef={nowRef} />
        <Snowfall nowRef={nowRef} />
        <Floor y={FLOOR_Y} struck={struck} nowRef={nowRef} />
        <Debris nowRef={nowRef} />
        <SnowBurst nowRef={nowRef} />
        <DesertDoor position={DOOR_POS} nowRef={nowRef} />
        <LeaderButterflies nowRef={nowRef} doorPos={DOOR_POS} />
        <ApproachCam nowRef={nowRef} doorPos={DOOR_POS} />
        <BlackOut nowRef={nowRef} />
        <Orb
          geometry={geometry}
          nowRef={nowRef}
          onImpact={() => setStruck(true)}
        />
      </Canvas>
      <div style={{ position: "fixed", bottom: 8, left: 8, color: "#556", font: "11px monospace" }}>
        impact {BEAT.impact}s · approach {APPROACH.start}-{APPROACH.end}s · through {THROUGH.end}s
      </div>
    </div>
  );
}
