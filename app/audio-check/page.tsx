"use client";

// TEMPORARY diagnostic route. Open this on the phone that has no sound and tap
// each button in turn. It tests three independent audio paths so we can tell
// which one iOS is actually blocking, instead of guessing.
//
// Delete once the audio question is settled.

import { useEffect, useState } from "react";
import { Howl, Howler } from "howler";

type Line = { label: string; value: string; ok?: boolean };

export default function AudioCheck() {
  const [env, setEnv] = useState<Line[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const say = (m: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${m}`, ...l].slice(0, 14));

  const readEnv = () => {
    const ctx = Howler.ctx as AudioContext | undefined;
    setEnv([
      { label: "user agent", value: navigator.userAgent.slice(0, 72) },
      {
        label: "Howler using Web Audio",
        value: String(Howler.usingWebAudio),
        ok: Howler.usingWebAudio,
      },
      { label: "Howler noAudio", value: String(Howler.noAudio), ok: !Howler.noAudio },
      {
        label: "AudioContext state",
        value: ctx ? ctx.state : "no context yet",
        ok: ctx?.state === "running",
      },
      { label: "context time", value: ctx ? ctx.currentTime.toFixed(2) : "n/a" },
      { label: "master volume", value: String(Howler.volume()) },
      {
        label: "device volume note",
        value: "iOS mutes Web Audio when the side switch is on silent",
      },
    ]);
  };

  useEffect(() => {
    readEnv();
    const id = setInterval(readEnv, 1000);
    return () => clearInterval(id);
  }, []);

  // 1. exactly what the site does
  const testHowler = () => {
    const ctx = Howler.ctx as AudioContext | undefined;
    if (ctx && ctx.state !== "running") {
      void ctx.resume().then(() => say("ctx.resume() resolved"));
    }
    const h = new Howl({
      src: ["/audio/chime.wav"],
      volume: 1,
      onplayerror: (_id, e) => say(`HOWLER play error: ${String(e)}`),
      onloaderror: (_id, e) => say(`HOWLER load error: ${String(e)}`),
      onplay: () => say("HOWLER onplay fired"),
      onend: () => say("HOWLER finished"),
    });
    const id = h.play();
    say(`HOWLER play() returned id ${id}`);
  };

  // 2. raw Web Audio, no library
  const testRawWebAudio = async () => {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AC();
      await ctx.resume();
      say(`RAW ctx state after resume: ${ctx.state}`);
      const res = await fetch("/audio/chime.wav");
      const buf = await res.arrayBuffer();
      say(`RAW fetched ${buf.byteLength} bytes`);
      const decoded = await ctx.decodeAudioData(buf);
      say(`RAW decoded ${decoded.duration.toFixed(2)}s @ ${decoded.sampleRate}Hz`);
      const node = ctx.createBufferSource();
      node.buffer = decoded;
      node.connect(ctx.destination);
      node.start(0);
      say("RAW started, you should hear it now");
    } catch (e) {
      say(`RAW failed: ${(e as Error).message}`);
    }
  };

  // 3. plain HTML5 audio element, a completely different pipeline
  const testHtml5 = () => {
    const a = new Audio("/audio/chime.wav");
    a.volume = 1;
    a.play()
      .then(() => say("HTML5 play() resolved, you should hear it now"))
      .catch((e) => say(`HTML5 rejected: ${e.name}: ${e.message}`));
  };

  const btn =
    "w-full rounded border border-neutral-600 px-4 py-5 text-left text-base active:bg-neutral-800";

  return (
    <main className="min-h-[100dvh] bg-black px-5 py-8 font-sans text-neutral-200">
      <h1 className="mb-1 text-xl">Audio check</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Turn the volume up and take the phone off silent. Tap each button and
        note which ones you can actually hear.
      </p>

      <div className="mb-6 flex flex-col gap-3">
        <button className={btn} onClick={testHowler}>
          1. Howler, Web Audio
          <span className="block text-xs text-neutral-500">
            what the site itself uses
          </span>
        </button>
        <button className={btn} onClick={testRawWebAudio}>
          2. Raw Web Audio
          <span className="block text-xs text-neutral-500">
            no library, decoded by hand
          </span>
        </button>
        <button className={btn} onClick={testHtml5}>
          3. HTML5 audio element
          <span className="block text-xs text-neutral-500">
            a completely separate pipeline
          </span>
        </button>
      </div>

      <h2 className="mb-2 text-sm uppercase tracking-widest text-neutral-500">
        Environment
      </h2>
      <div className="mb-6 flex flex-col gap-1 text-xs">
        {env.map((e) => (
          <div key={e.label} className="flex gap-2">
            <span className="w-40 shrink-0 text-neutral-500">{e.label}</span>
            <span
              className={
                e.ok === undefined
                  ? "text-neutral-300"
                  : e.ok
                    ? "text-emerald-400"
                    : "text-red-400"
              }
            >
              {e.value}
            </span>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm uppercase tracking-widest text-neutral-500">
        Log
      </h2>
      <div className="flex flex-col gap-1 font-mono text-[11px] text-neutral-400">
        {log.length === 0 ? (
          <span className="text-neutral-600">nothing yet</span>
        ) : (
          log.map((l, i) => <span key={i}>{l}</span>)
        )}
      </div>
    </main>
  );
}
