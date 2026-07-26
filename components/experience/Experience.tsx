"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { STAGES, FINAL_TAP, type Phase } from "@/lib/stages";
import {
  startAudio,
  setHeartbeat,
  playCrack,
  playShatter,
  playSwell,
  playChime,
  stopHeartbeat,
} from "@/lib/audio";
import Butterflies from "./Butterflies";
import WelcomeSequence from "./WelcomeSequence";
import Sections from "./Sections";

// three.js must never render on the server.
const HeartScene = dynamic(() => import("./HeartScene"), { ssr: false });

export default function Experience() {
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [glow, setGlow] = useState(0); // warmth radiating from the heart
  const [world, setWorld] = useState(0); // warmth filling the whole screen
  // Once the last fragment fades we drop the WebGL canvas entirely, so the
  // butterflies have the frame to themselves.
  const [heartGone, setHeartGone] = useState(false);

  // refs mirror state so rapid taps accumulate synchronously (no stale closures)
  const tapsRef = useRef(0);
  const phaseRef = useRef<Phase>("intro");
  const timers = useRef<number[]>([]);

  const goPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const erupt = useCallback(() => {
    goPhase("eruption");
    playShatter();
    setGlow(1);
    // one last swell of the heartbeat, then it softly fades as life takes flight
    const s = STAGES[FINAL_TAP];
    setHeartbeat(s.beatRate, s.beatVolume);
    stopHeartbeat();

    after(200, () => {
      playSwell();
      setWorld(1); // the darkness becomes a warm, beautiful environment
    });
    after(900, () => playChime());

    // butterflies leave → return to stillness
    after(7200, () => {
      goPhase("silence");
      setWorld(0);
      setGlow(0);
    });
    // ~3 seconds of silence, then the whispered welcome
    after(10200, () => goPhase("welcome"));
  }, [goPhase]);

  const handleTap = useCallback(() => {
    if (phaseRef.current !== "intro") return;
    startAudio();

    const next = tapsRef.current + 1;
    tapsRef.current = next;
    setTaps(next);

    if (next < FINAL_TAP) {
      playCrack();
      const s = STAGES[next];
      setHeartbeat(s.beatRate, s.beatVolume);
      setGlow(s.glow);
    } else if (next === FINAL_TAP) {
      erupt();
    }
  }, [erupt]);

  const stage = STAGES[Math.min(taps, FINAL_TAP)];
  const shattering = phase === "eruption";

  return (
    // 100dvh, not 100vh: on mobile browsers 100vh includes the address bar, so
    // vh crops the bottom of the frame and shifts as the chrome hides.
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
      {/* warm glow radiating from the heart */}
      <div
        className="pointer-events-none fixed inset-0 transition-opacity duration-[1500ms] ease-out"
        style={{
          opacity: glow,
          background:
            "radial-gradient(45% 45% at 50% 52%, rgba(255,110,60,0.55), rgba(255,80,40,0.12) 45%, transparent 70%)",
        }}
      />
      {/* the whole world turning warm during the eruption */}
      <div
        className="pointer-events-none fixed inset-0 transition-opacity duration-[2500ms] ease-in-out"
        style={{
          opacity: world * 0.9,
          background:
            "radial-gradient(120% 120% at 50% 45%, rgba(60,20,10,0.9), rgba(20,8,6,0.96) 60%, rgba(6,4,4,1))",
        }}
      />

      {/* the heart itself (present only while it lives / breaks) */}
      {(phase === "intro" || phase === "eruption") && !heartGone && (
        <div className="absolute inset-0 z-10">
          <HeartScene
            targetAwaken={stage.awaken}
            beatRate={stage.beatRate}
            shattering={shattering}
            onTap={handleTap}
            onShatterDone={() => setHeartGone(true)}
          />
        </div>
      )}

      {/* the single word — the only instruction, dormant stage only */}
      <AnimatePresence>
        {phase === "intro" && taps === 0 && (
          <motion.p
            // Sat at 18% it landed on the heart's own dark underside and was
            // effectively invisible. Lower, brighter, and lifted clear of the
            // silhouette — it is the only instruction in the whole piece.
            className="pointer-events-none absolute inset-x-0 bottom-[9%] z-20 text-center font-serif text-2xl font-light lowercase tracking-[0.35em] text-neutral-100/90 sm:text-3xl"
            style={{ textShadow: "0 0 18px rgba(0,0,0,0.9)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0.6, 0.95] }}
            exit={{ opacity: 0, transition: { duration: 0.8, delay: 0 } }}
            transition={{
              duration: 5.4,
              delay: 0.8,
              ease: "easeInOut",
              times: [0, 0.3, 0.65, 1],
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            tap.
          </motion.p>
        )}
      </AnimatePresence>

      {/* the eruption */}
      {phase === "eruption" && <Butterflies count={140} />}

      {/* the whispered introduction */}
      {phase === "welcome" && (
        <WelcomeSequence onDone={() => goPhase("explore")} />
      )}

      {/* explore — a single button, nothing else */}
      <AnimatePresence>
        {phase === "explore" && (
          <motion.div
            key="explore"
            className="fixed inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          >
            <button
              onClick={() => goPhase("sections")}
              className="font-serif text-2xl font-light tracking-[0.15em] text-neutral-300 transition-colors duration-500 hover:text-ember md:text-3xl"
            >
              Explore →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the four sections */}
      {phase === "sections" && <Sections />}
    </main>
  );
}
