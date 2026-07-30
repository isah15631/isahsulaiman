"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ShardLaunch } from "@/lib/shards";
import { startAudio, playShatter, playSwell } from "@/lib/audio";
import Butterflies from "./Butterflies";
import Doorway from "./Doorway";
import LastButterfly from "./LastButterfly";
import WelcomeSequence from "./WelcomeSequence";
import Sections from "./Sections";

// three.js must never render on the server.
const OrbScene = dynamic(() => import("./OrbScene"), { ssr: false });

type Phase =
  | "fall"
  | "eruption"
  | "silence"
  | "welcome"
  | "explore"
  | "sections";

/**
 * How long after the landing the WebGL canvas can be dropped. Not when the last
 * piece of glass fades: the concrete is still lit for a good while after that,
 * and it is the light going out that ends the shot, not the glass.
 *
 * Longer than it was, because there is now something down there worth looking at
 * while the swarm leaves — a floor, and a hole in it.
 */
const CANVAS_OUT = 4600;


export default function Experience() {
  const [phase, setPhase] = useState<Phase>("fall");
  const [glow, setGlow] = useState(0); // warmth radiating from the impact
  const [world, setWorld] = useState(0); // warmth filling the whole screen
  // Once the floor has gone dark we drop the WebGL canvas entirely, so the
  // butterflies have the frame to themselves.
  const [orbGone, setOrbGone] = useState(false);
  // Every piece of the broken sphere, with the moment and the heading at which
  // it turns into a butterfly. Handed over on the frame it lands.
  const [launch, setLaunch] = useState<ShardLaunch | null>(null);

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
   * the first gesture of ANY kind — a click anywhere, a key, a touch — and try
   * again then. On a cold, untouched load the landing may well be silent. The
   * alternative is a "click to begin" gate, which is the interaction that was
   * just removed on purpose.
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
    playShatter();
    setGlow(1);

    after(200, () => {
      playSwell();
      setWorld(1); // the darkness becomes a warm, beautiful environment
    });
    // Nothing else. The break and the swell carry the moment between them; a
    // third sound on top read as a game pickup.

    after(CANVAS_OUT, () => setOrbGone(true));

    // butterflies leave → return to stillness
    after(7200, () => {
      goPhase("silence");
      setWorld(0);
      setGlow(0);
    });
    // ~3 seconds of silence, then the whispered welcome
    after(10200, () => goPhase("welcome"));
  }, [goPhase]);

  return (
    // 100dvh, not 100vh: on mobile browsers 100vh includes the address bar, so
    // vh crops the bottom of the frame and shifts as the chrome hides.
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
      {/* warm glow thrown out by the impact */}
      <div
        className="pointer-events-none fixed inset-0 transition-opacity duration-[1500ms] ease-out"
        style={{
          opacity: glow,
          background:
            "radial-gradient(45% 45% at 50% 62%, rgba(255,110,60,0.55), rgba(255,80,40,0.12) 45%, transparent 70%)",
        }}
      />
      {/* the whole world turning warm during the eruption */}
      <div
        className="pointer-events-none fixed inset-0 transition-opacity duration-[2500ms] ease-in-out"
        style={{
          opacity: world * 0.9,
          background:
            "radial-gradient(120% 120% at 50% 55%, rgba(60,20,10,0.9), rgba(20,8,6,0.96) 60%, rgba(6,4,4,1))",
        }}
      />

      {/* Space, the fall out of it, the air on the way down, the floor at the
          bottom and the light that arrives with the impact. All one scene and one
          camera: there is no cut anywhere in the intro now, because the moon that
          was hanging up there is the sphere that breaks down here. */}
      {(phase === "fall" || phase === "eruption") && !orbGone && (
        <div className="absolute inset-0 z-10">
          <OrbScene onImpact={onImpact} onShardsLaunch={setLaunch} />
        </div>
      )}

      {/* the eruption — the pieces themselves, once they turn */}
      {phase === "eruption" && launch && <Butterflies launch={launch} />}

      {/* the straggler, still leaving through the silence */}
      {phase === "silence" && <LastButterfly />}

      {/* the whispered introduction */}
      {phase === "welcome" && (
        <WelcomeSequence onDone={() => goPhase("explore")} />
      )}

      {/* the door. The room is not mounted until we are through it: the swing
          and the walk through carry the whole transition, and both sides of
          the cut are black, so the join cannot be seen. */}
      {phase === "explore" && <Doorway onThrough={() => goPhase("sections")} />}

      {/* the four sections */}
      {phase === "sections" && <Sections />}
    </main>
  );
}
