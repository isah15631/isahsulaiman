"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FOREWING, HINDWING } from "./Butterfly";

// The one butterfly that did not go grey with the rest of the world: it comes in
// with its wings already on fire, the last live ember of the swarm. It crosses
// the dark room, curls up to the hanging cresset, and the instant it touches the
// flame the torch catches — and its catching is what floods the colour back.
//
// It is rendered in a layer ABOVE the world's grayscale (portalled clear of the
// filtered tree by its caller), so the fire reads as the only colour there is
// until it spreads.
//
// Two moves laid end to end: fly IN to the torch, fire `onReach` the moment it
// arrives (that is the ignition), then drift UP into the dark and `onDone`. The
// beats are driven by timers rather than framer's onAnimationComplete, which
// fires early under a StrictMode double-mount and lit the torch on arrival.

const SIZE = 30;
const FLY_IN = 3.2; // seconds to reach the torch
const FLY_OUT = 1.6; // seconds to drift away after lighting it

function torchPoint() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const drop = Math.min(130, Math.max(56, vh * 0.12));
  return { x: vw / 2, y: drop + 20 };
}

export default function FireButterfly({
  onReach,
  onDone,
}: {
  onReach: () => void;
  onDone?: () => void;
}) {
  const grad = useId().replace(/:/g, "");
  const [arrived, setArrived] = useState(false);

  // Refs so the fly-in timer is set once and never reset by a new closure.
  const onReachRef = useRef(onReach);
  onReachRef.current = onReach;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = window.setTimeout(() => {
      onReachRef.current();
      setArrived(true);
    }, FLY_IN * 1000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!arrived) return;
    const t = window.setTimeout(() => onDoneRef.current?.(), FLY_OUT * 1000);
    return () => window.clearTimeout(t);
  }, [arrived]);

  const path = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const t = torchPoint();
    const startX = vw + 60;
    const startY = vh * 0.66;
    return {
      inX: [startX, vw * 0.62, vw * 0.5 + 90, t.x + 6],
      inY: [startY, vh * 0.4, vh * 0.24, t.y],
      inRot: [-90, -64, -30, -8],
      outX: [t.x + 6, t.x - 40, t.x - 20],
      outY: [t.y, t.y - vh * 0.22, -80],
      outRot: [-8, 18, 6],
    };
  }, []);

  const wings = (
    <svg viewBox="0 0 100 100" width={SIZE} height={SIZE} aria-hidden style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`${grad}-fire`} gradientUnits="userSpaceOnUse" cx="62" cy="52" r="42">
          <stop offset="0" stopColor="#fff6d8" />
          <stop offset="0.3" stopColor="#ffd452" />
          <stop offset="0.62" stopColor="#ff7a18" />
          <stop offset="1" stopColor="#b32403" />
        </radialGradient>
      </defs>
      <g>
        <g className="butterfly__wing" style={{ ["--flap" as string]: "0.22s" }}>
          <path d={FOREWING} fill={`url(#${grad}-fire)`} />
          <path d={HINDWING} fill={`url(#${grad}-fire)`} opacity="0.92" />
        </g>
      </g>
      <g transform="translate(100,0) scale(-1,1)">
        <g className="butterfly__wing" style={{ ["--flap" as string]: "0.22s" }}>
          <path d={FOREWING} fill={`url(#${grad}-fire)`} />
          <path d={HINDWING} fill={`url(#${grad}-fire)`} opacity="0.92" />
        </g>
      </g>
      <path
        d="M50,28 C52,30 53,36 53,50 C53,64 51,73 50,78 C49,73 47,64 47,50 C47,36 48,30 50,28 Z"
        fill="rgba(40,18,8,0.92)"
      />
    </svg>
  );

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[60]"
      style={{
        filter: "drop-shadow(0 0 10px rgba(255,140,50,0.9)) drop-shadow(0 0 22px rgba(255,90,20,0.55))",
      }}
      initial={{ x: path.inX[0], y: path.inY[0], rotate: path.inRot[0], opacity: 0 }}
      animate={
        arrived
          ? { x: path.outX, y: path.outY, rotate: path.outRot, opacity: [1, 1, 0] }
          : { x: path.inX, y: path.inY, rotate: path.inRot, opacity: [0, 1, 1, 1] }
      }
      transition={
        arrived
          ? { duration: FLY_OUT, ease: "easeIn", opacity: { duration: FLY_OUT, times: [0, 0.5, 1] } }
          : {
              duration: FLY_IN,
              ease: "easeInOut",
              opacity: { duration: FLY_IN, times: [0, 0.12, 0.9, 1] },
            }
      }
    >
      {wings}
    </motion.div>
  );
}
