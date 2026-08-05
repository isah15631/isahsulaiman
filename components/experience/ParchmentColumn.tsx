"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// A column of open parchments hanging in the dark, lit only by the one fixed
// torch — the shared reading body behind About, Projects and Contact.
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
// whatever pages you hand it, so each section fills them with its own reading and
// they all read under the same flame.

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
const LIFT = "0 34px 64px -34px rgba(0,0,0,0.92)";

/** Wet slate: a cool near-black stone slab, mottled, with a faint sheen top-left
 *  where it catches the light. The reading warmth is the torch layers' job, so the
 *  base stays dark. It belongs in the grotto the way aged paper never could. */
const SLATE =
  "radial-gradient(120% 80% at 28% 8%, rgba(120,140,155,0.16), transparent 55%)," +
  "radial-gradient(90% 70% at 82% 92%, rgba(4,8,12,0.55), transparent 58%)," +
  "linear-gradient(178deg, #262d34 0%, #1c232a 48%, #141a20 80%, #0f151a 100%)";

/** Carved, not inked: a dark cut below each letter and a faint lit lip above, so
 *  the words read as incised into the stone and caught by the fire. Inherited by
 *  every bit of text on the slab. */
const CARVE =
  "0 1px 1px rgba(0,0,0,0.6), 0 -1px 0.5px rgba(255,232,196,0.14)";

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
        {/* the slab: cool stone tone, a wet top catch and dark hewn edges */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: RADIUS,
            background: SLATE,
            border: "1px solid rgba(150,170,185,0.14)",
            boxShadow:
              "inset 0 1px 0 rgba(180,200,215,0.16)," +
              "inset 0 -26px 34px -24px rgba(0,0,0,0.75)," +
              "inset 0 24px 30px -26px rgba(0,0,0,0.5)," +
              "inset 22px 0 26px -22px rgba(0,0,0,0.5)," +
              "inset -22px 0 26px -22px rgba(0,0,0,0.5)",
          }}
        />
        {/* the stone pitting */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: GRAIN,
            backgroundSize: "170px 170px",
            mixBlendMode: "multiply",
            opacity: 0.14,
          }}
        />

        {/* the torch's light on the stone, screen-blended so it lifts the dark
            slate into warm firelight in the reading band. A wash of amber that
            fades to nothing off the pool, so only the band under the flame warms. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 100% 60% at 50% ${gy}%, ` +
              "rgba(255,196,120,0.80) 0%, rgba(255,150,70,0.50) 34%, " +
              "rgba(230,110,40,0.22) 62%, transparent 82%)",
            mixBlendMode: "screen",
            opacity: amount,
          }}
        />
        {/* a hotter gold core, tight, so the very middle of the band glows the way
            firelit wet stone does rather than merely brightening flat. Screen, not
            overlay: overlay only darkens a base this dark. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 70% 42% at 50% ${gy}%, ` +
              "rgba(255,226,172,0.55) 0%, rgba(255,196,120,0.18) 45%, transparent 72%)",
            mixBlendMode: "screen",
            opacity: amount,
          }}
        />

        {/* the reading itself, carved into the stone by default */}
        <div
          className="relative px-8 py-10 sm:px-11"
          style={{ textShadow: CARVE }}
        >
          {children}
        </div>

        {/* Even the page under the torch is only lit where the light falls: this
            clears a readable pool at the flame's height and lets the rest of the
            sheet fall away, so as you scroll a tall page the readable band travels
            down it under the fixed flame. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 104% 72% at 50% ${gy}%, ` +
              "transparent 0%, transparent 44%, rgba(6,10,14,0.55) 68%, " +
              "rgba(5,8,11,0.86) 90%)",
            opacity: amount,
          }}
        />
        {/* a slab the torch is not over at all is fully dark — wet stone still
            there in the gloom, waiting for the fire. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[#0a0f13]"
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
