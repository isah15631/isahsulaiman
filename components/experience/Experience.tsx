"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { startAudio, playSwell } from "@/lib/audio";
import WelcomeSequence from "./WelcomeSequence";
import Sections from "./Sections";

// three.js must never render on the server.
const OrbScene = dynamic(() => import("./OrbScene"), { ssr: false });

type Phase = "fall" | "eruption" | "welcome" | "sections";

/**
 * When the canvas can be dropped, in ms after the impact.
 *
 * The canvas carries the whole outdoor act: the fall, the daylit landing, the
 * crash, the swarm streaming to the door, the pull back to the vista, the walk
 * in, and the push through the door. The approach and the through-to-black are
 * scripted on the same clock inside lib/approach (the through finishes about
 * impact+7s), so this only has to know when the black has closed and it is safe
 * to hand over to the dark interior.
 */
const THROUGH_DONE = 7200;

export default function Experience() {
  const [phase, setPhase] = useState<Phase>("fall");
  // Once we are through the door and the black has closed we drop the canvas
  // entirely, and the dark interior has the frame to itself.
  const [orbGone, setOrbGone] = useState(false);
  // The whole world is colourless until the fire-winged butterfly lights the
  // torch in the room. This is a one-way latch: once it catches, colour is back
  // for good — there is no turning it off again.
  const [ignited, setIgnited] = useState(false);

  const phaseRef = useRef<Phase>("fall");
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

  /**
   * Nobody taps any more, and that is a problem for sound: browsers will not
   * let a page make a noise until the visitor has done something, and this
   * piece never asks them to do anything.
   *
   * So: try immediately, in case this browser allows it, and also listen for
   * the first gesture of ANY kind and try again then.
   */
  useEffect(() => {
    startAudio();
    const unlock = () => startAudio();
    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  const onImpact = useCallback(() => {
    if (phaseRef.current !== "fall") return;
    goPhase("eruption");

    // the swell carries the moment; the butterflies, the daylight and the dust
    // are all the canvas's now
    after(200, () => playSwell());

    // through the door, the black closed over: drop the canvas and let the dark
    // interior speak
    after(THROUGH_DONE, () => {
      setOrbGone(true);
      goPhase("welcome");
    });
  }, [goPhase]);

  return (
    // 100dvh, not 100vh: on mobile browsers 100vh includes the address bar, so
    // vh crops the bottom of the frame and shifts as the chrome hides.
    //
    // The whole piece plays in grayscale — the moon, the snow, the swarm, the
    // door, all of it — and only warms back into colour when the torch is lit.
    // The fire-winged butterfly that lights it is portalled clear of this filter
    // by the room, so its flame is the one colour in the grey until it spreads.
    <main
      className="relative h-[100dvh] w-full overflow-hidden bg-black"
      style={{
        filter: ignited ? "grayscale(0)" : "grayscale(1)",
        transition: "filter 1.9s ease",
      }}
    >
      {/* Space, the fall, the daylit landing, the swarm out of the break and into
          the door, and the walk through it to black. All one scene and one
          camera: the only cut in the whole piece is the black at the threshold,
          where both sides are dark and nothing has to line up across it. */}
      {(phase === "fall" || phase === "eruption") && !orbGone && (
        <div className="absolute inset-0 z-10">
          <OrbScene onImpact={onImpact} />
        </div>
      )}

      {/* the whispered introduction, in the dark on the far side of the door */}
      {phase === "welcome" && (
        <WelcomeSequence onDone={() => goPhase("sections")} />
      )}

      {/* the lit room and the four sections */}
      {phase === "sections" && (
        <Sections ignited={ignited} onIgnite={() => setIgnited(true)} />
      )}
    </main>
  );
}
