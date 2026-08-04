"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import PortraitAssembly from "./PortraitAssembly";

// The portrait, as a framed picture hanging on the wall of the room.
//
// It hangs in grayscale, the way everything in here waits colourless for the one
// flame. The torch is fixed at the top of the room and its light pool falls where
// you have scrolled to; when that pool reaches the frame the picture warms out of
// grey into colour and firelight catches the glass, and scrolling it back out of
// the light lets it fall to grey again. Same reading as the section parchments
// (see ParchmentColumn): one torch, and whatever it is over is the thing that lives.

// The portrait's shape: a dome at the top, gently rounded below — an arch rather
// than a locket-oval or a flat rectangle.
const ARCH = "50% 50% 44% 44% / 52% 52% 16% 16%";
const ARCH_INNER = "50% 50% 43% 43% / 51% 51% 15% 15%";

/** The lower edge sinks into the page rather than stopping at a hard rectangle. */
const DISSOLVE =
  "linear-gradient(to bottom, #000 58%, rgba(0,0,0,0.55) 82%, transparent 100%)";

/** How softly the picture warms as the torch pool nears it, in px. */
const FALLOFF = 260;
const smooth = (t: number) => t * t * (3 - 2 * t);

export default function PortraitFrame({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight;
      const flame = document.querySelector("[data-torch-flame]");
      const fr = flame?.getBoundingClientRect();
      const flameY = fr ? fr.top + fr.height / 2 : vh * 0.08;
      // the torch throws its light DOWN into the room, so the pool sits below the
      // flame, the same drop the parchments read against
      const lightY = flameY + vh * 0.26;
      const r = el.getBoundingClientRect();
      let a: number;
      if (lightY < r.top) a = 1 - (r.top - lightY) / FALLOFF;
      else if (lightY > r.bottom) a = 1 - (lightY - r.bottom) / FALLOFF;
      else a = 1;
      setLit(smooth(Math.max(0, Math.min(1, a))));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative mx-auto w-[min(58%,12.5rem)] shrink-0 md:mx-0 md:w-44"
    >
      {/* The living warmth: the torch's glow pooling behind the frame, and it
          breathes — the torch-glow class is the same irregular flicker the flame
          itself runs on, so the light on him guttering the way the fire does. It
          is faint until the pool reaches him, then it swells. */}
      <div
        className="torch-glow pointer-events-none absolute -inset-x-10 -inset-y-9 -z-10 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 44%, rgba(255,168,88,0.5), rgba(255,132,58,0.14) 54%, transparent 80%)",
          opacity: 0.16 + 0.84 * lit,
        }}
      />

      {/* An outer rule, standing off the picture. */}
      <div
        className="pointer-events-none absolute -inset-[9px]"
        style={{
          borderRadius: ARCH,
          border: "1px solid rgba(226,196,150,0.16)",
          WebkitMaskImage: DISSOLVE,
          maskImage: DISSOLVE,
        }}
      />

      <motion.div
        className="relative aspect-[3/4] p-px"
        style={{
          borderRadius: ARCH,
          background:
            "linear-gradient(to bottom, rgba(232,202,152,0.6), rgba(232,202,152,0.16) 45%, rgba(232,202,152,0) 78%)",
          WebkitMaskImage: DISSOLVE,
          maskImage: DISSOLVE,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div
          className="relative h-full w-full overflow-hidden"
          style={{ borderRadius: ARCH_INNER }}
        >
          {/* the photograph, grey and dim until the torchlight reaches it, then
              warming to full colour */}
          <div
            className="h-full w-full"
            style={{
              filter: `grayscale(${1 - lit}) brightness(${0.62 + 0.38 * lit}) contrast(${0.92 + 0.12 * lit})`,
            }}
          >
            <PortraitAssembly src={src} alt={alt} />
          </div>
          {/* firelight caught on him where the torch falls */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 120% 82% at 50% 40%, rgba(255,176,86,0.55), rgba(255,138,58,0.18) 54%, transparent 82%)",
              mixBlendMode: "soft-light",
              opacity: lit,
            }}
          />
          {/* the shadow he hangs in when the light is off him */}
          <div
            className="pointer-events-none absolute inset-0 bg-[#0a0806]"
            style={{ opacity: 0.5 * (1 - lit) }}
          />
        </div>
      </motion.div>
    </div>
  );
}
