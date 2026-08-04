"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HOBBIES, type Hobby } from "@/lib/content";

// A column of open parchments hanging in the dark, lit only by the one fixed
// torch — the shared body behind both Digressions and Projects.
//
// There are no winged scrolls to pick from. Every page is already open and they
// are simply lined up down the wall, and all but one of them is dark — because
// the only light in the room is the one torch fixed to the brick, and it sits
// BEHIND the parchments and throws its light DOWN onto the page below it. A page
// is dark until you have scrolled it under the flame; then the torch's pool falls
// on it and, in the band the light reaches, it can be read. Scroll on and the
// pool slides down onto the next page and this one falls back into dark.
//
// So the lighting is not keyed to an arbitrary line — it is measured against the
// torch itself. Each frame we read where the flame actually is on screen (the
// Torch marks it with data-torch-flame), drop to the reading zone just beneath
// it, and light whichever page that pool falls on, clearing a readable band at
// exactly that height.
//
// The sheet and the lighting are content-agnostic: ParchmentColumn lights
// whatever pages you hand it, so Digressions fills them with hobbies and Projects
// fills them with builds, both reading under the same flame.

/** Per-page lighting: how far out of the dark it is, and where the pool falls on
 *  it (as a percentage down the page, so the band can be placed there). */
export type Lit = { amount: number; gy: number };

// How softly a page fades as the pool nears its edge, in px. Bigger is a gentler
// hand-off, so the next page is warming before this one is fully cold and the
// column never drops to long stretches of flat black.
const FALLOFF = 190;

/** Uneven, as a hand-trimmed sheet is. */
const RADIUS = "8px 12px 9px 11px / 12px 8px 13px 10px";

/** The lift off the wall, cast by the container box behind the ragged sheet. */
const LIFT = "0 34px 64px -34px rgba(0,0,0,0.9)";

/** Aged paper: a warm, mottled tone. The lighting is the glow/warmth layers'
 *  job, so the base is not baked dark on one side. */
const PAPER =
  "radial-gradient(120% 80% at 26% 10%, rgba(255,251,232,0.55), transparent 58%)," +
  "radial-gradient(90% 70% at 82% 88%, rgba(120,88,48,0.20), transparent 55%)," +
  "radial-gradient(70% 60% at 88% 16%, rgba(150,116,66,0.16), transparent 60%)," +
  "linear-gradient(178deg, #efe1bd 0%, #e7d4a6 46%, #dbc492 78%, #cdb47f 100%)";

// A faint paper grain, as a static inline-SVG noise. Cheap: one small tiled
// image, not a live filter.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

// The ragged, torn outline of the sheet, as a MASK rather than a live filter.
// A little turbulence displaces a white rectangle into a deckled edge; the SVG
// is rendered once by the browser and cached, then used to clip the whole
// parchment. This is the performance fix: the old build ran this displacement as
// a filter on layers whose opacity changed every scroll frame, forcing the
// filter to recompute constantly. As a static mask it is computed once and the
// animated light layers underneath are plain, cheap gradients.
const DECKLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='520' viewBox='0 0 400 520' preserveAspectRatio='none'%3E%3Cfilter id='d' x='-20' y='-20' width='440' height='560' filterUnits='userSpaceOnUse'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.028' numOctaves='2' seed='7' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='10'/%3E%3C/filter%3E%3Crect x='6' y='6' width='388' height='508' rx='8' fill='%23fff' filter='url(%23d)'/%3E%3C/svg%3E\")";

export function Parchment({ lit, children }: { lit: Lit; children: ReactNode }) {
  const { amount, gy } = lit;
  return (
    <div
      className="relative w-full"
      // The lift sits on this outer box (unmasked, a soft blur), so the mask on
      // the sheet within does not clip the shadow away.
      style={{ borderRadius: RADIUS, boxShadow: LIFT }}
    >
      <div
        className="relative"
        style={{
          borderRadius: RADIUS,
          // blend the light against the paper, not the dark room behind it
          isolation: "isolate",
          // the one ragged clip for the whole sheet
          WebkitMaskImage: DECKLE,
          maskImage: DECKLE,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      >
        {/* the paper: tone, worn border and darkened aged edges */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: RADIUS,
            background: PAPER,
            border: "1px solid rgba(96,70,38,0.55)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,246,222,0.25)," +
              "inset 0 22px 30px -22px rgba(74,52,26,0.7)," +
              "inset 0 -22px 30px -22px rgba(74,52,26,0.7)," +
              "inset 22px 0 26px -22px rgba(74,52,26,0.65)," +
              "inset -22px 0 26px -22px rgba(74,52,26,0.65)",
          }}
        />
        {/* the grain */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: GRAIN,
            backgroundSize: "170px 170px",
            mixBlendMode: "multiply",
            opacity: 0.05,
          }}
        />

        {/* the torch's light on the paper, screen-blended so it reads as
            firelight in the fibres. Kept a warm amber, NOT a pale near-white
            core — a whiter highlight bleaches the paper and reads cold. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 96% 56% at 50% ${gy}%, ` +
              "rgba(255,198,116,0.82) 0%, rgba(255,158,72,0.55) 34%, " +
              "rgba(255,120,40,0.24) 60%, transparent 80%)",
            mixBlendMode: "screen",
            opacity: amount,
          }}
        />
        {/* a deep amber wash over the paper itself, so the sheet turns the honey
            warmth of firelit paper rather than merely getting brighter. Overlay
            pushes the cream tone toward orange instead of washing it out; run a
            little hotter than the glow so the warmth wins over the brightness. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 106% 64% at 50% ${gy}%, ` +
              "rgba(255,112,28,0.9) 0%, rgba(222,98,26,0.6) 40%, " +
              "rgba(180,80,24,0.24) 66%, transparent 82%)",
            mixBlendMode: "overlay",
            opacity: amount,
          }}
        />

        <div className="relative px-8 py-10 sm:px-11">{children}</div>

        {/* Even the page under the torch is only lit where the light falls: this
            clears a readable pool at the flame's height and lets the rest of the
            sheet fall away, so as you scroll a tall page the readable band travels
            down it under the fixed flame. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 100% 62% at 50% ${gy}%, ` +
              "transparent 0%, transparent 32%, rgba(8,6,4,0.62) 60%, " +
              "rgba(8,6,4,0.9) 84%)",
            opacity: amount,
          }}
        />
        {/* a page the torch is not over at all is fully dark — still there in the
            gloom, waiting for the fire. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[#080604]"
          style={{ opacity: 0.9 * (1 - amount) }}
        />
      </div>
    </div>
  );
}

/** smoothstep, so a page eases out of the dark rather than ramping linearly. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/** A page to hang on the wall: its own key, and the reading that goes on it. */
export type Sheet = { key: string; content: ReactNode };

// The scrolling column itself: it owns the torch-measuring lighting and lays a
// set of already-open sheets down the wall, lighting whichever one the flame's
// pool falls on. What is written on each sheet is the caller's business.
export function ParchmentColumn({ sheets }: { sheets: Sheet[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [lits, setLits] = useState<Lit[]>(() =>
    sheets.map(() => ({ amount: 0, gy: 50 }))
  );

  useEffect(() => {
    let raf = 0;
    const update = () => {
      // Where the fire actually is on screen. The Torch marks it; if for any
      // reason it is not there, fall back to just under the top of the frame,
      // which is where it hangs.
      const vh = window.innerHeight;
      const flame = document.querySelector("[data-torch-flame]");
      const fr = flame?.getBoundingClientRect();
      const flameY = fr ? fr.top + fr.height / 2 : vh * 0.08;
      // The torch throws its light DOWN onto the page beneath it, so the pool
      // that decides which page is readable sits below the flame, in the natural
      // reading zone under the torch — not up at the flame itself.
      const lightY = flameY + vh * 0.26;

      setLits(
        refs.current.map((el) => {
          if (!el) return { amount: 0, gy: 50 };
          const r = el.getBoundingClientRect();
          // How far the pool is from falling on this page. A page directly under
          // the torch (its top just below the flame) catches it; scrolled well
          // above or still far below, it does not.
          let a: number;
          if (lightY < r.top) a = 1 - (r.top - lightY) / FALLOFF;
          else if (lightY > r.bottom) a = 1 - (lightY - r.bottom) / FALLOFF;
          else a = 1;
          a = Math.max(0, Math.min(1, a));
          // Where on the page (top 0% .. bottom 100%) the pool falls, so the
          // readable band and glow can be placed there. Clamped a little past the
          // edges so the light can arrive from just off the sheet.
          const gy = Math.max(
            -12,
            Math.min(112, ((lightY - r.top) / r.height) * 100)
          );
          return { amount: smooth(a), gy };
        })
      );
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    // Capture, so it catches the scroll whichever ancestor is the scroller.
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [sheets.length]);

  return (
    <div className="flex flex-col items-center gap-[30vh] py-[20vh]">
      {sheets.map((s, i) => (
        <div
          key={s.key}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="w-full max-w-[34rem]"
        >
          <Parchment lit={lits[i] ?? { amount: 0, gy: 50 }}>{s.content}</Parchment>
        </div>
      ))}
    </div>
  );
}

// Digressions: the hobbies, each on its own sheet down the wall.
export default function Digressions() {
  const sheets: Sheet[] = HOBBIES.map((h) => ({
    key: h.key,
    content: <HobbyPage hobby={h} />,
  }));
  return <ParchmentColumn sheets={sheets} />;
}

function HobbyPage({ hobby }: { hobby: Hobby }) {
  return (
    <>
      <h3 className="font-serif text-3xl font-light tracking-wide text-[#2a2017]">
        {hobby.title}
      </h3>
      <p className="mt-3 max-w-prose font-serif text-[15px] italic leading-relaxed text-[#5b4a33]">
        {hobby.intro}
      </p>

      {hobby.lists?.map((list) => (
        <div key={list.label} className="mt-8">
          <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.24em] text-[#8a7248]">
            {list.label}
          </p>
          <ul className="flex flex-col">
            {list.items.map((item) => (
              <li
                key={item}
                className="border-b border-[#2a2017]/10 py-[7px] font-serif text-[16px] leading-snug text-[#33271b] last:border-b-0"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
