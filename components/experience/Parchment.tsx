"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// A sheet of aged parchment, centred in the frame — the surface a passage's
// reading inks onto. It arrives on the wall already FOLDED, a compact packet,
// and then unfolds carefully — the head leaf swinging open first, then the foot —
// to lay itself flat before the reading inks on.
//
// The fold is a real tri-fold in CSS 3D: three leaves creased across the sheet.
// Each leaf carries a FULL-height copy of the one parchment, shifted up so only
// its own third shows through, so the three read as one unbroken sheet once laid
// flat. The head and foot leaves hinge on their creases and fold forward over the
// middle; `unfold` swings them back to rest.

/** Uneven, as a hand-trimmed sheet is. */
const P_RADIUS = "8px 12px 9px 11px / 12px 8px 13px 10px";
/** Aged paper: a warm, mottled tone. */
const PAPER =
  "radial-gradient(120% 80% at 26% 10%, rgba(255,251,232,0.55), transparent 58%)," +
  "radial-gradient(90% 70% at 82% 88%, rgba(120,88,48,0.20), transparent 55%)," +
  "radial-gradient(70% 60% at 88% 16%, rgba(150,116,66,0.16), transparent 60%)," +
  "linear-gradient(178deg, #efe1bd 0%, #e7d4a6 46%, #dbc492 78%, #cdb47f 100%)";
/** A faint paper grain, as a static inline-SVG noise. */
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";
/** The ragged, torn outline of the sheet, as a static mask. */
const P_DECKLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='520' viewBox='0 0 400 520' preserveAspectRatio='none'%3E%3Cfilter id='d' x='-20' y='-20' width='440' height='560' filterUnits='userSpaceOnUse'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.028' numOctaves='2' seed='7' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='10'/%3E%3C/filter%3E%3Crect x='6' y='6' width='388' height='508' rx='8' fill='%23fff' filter='url(%23d)'/%3E%3C/svg%3E\")";

// One continuous face of the WHOLE sheet, drawn full-box inside every leaf and
// shifted up by `offset` so each leaf shows only its own third. The leaf clips it,
// so the three slices recompose into one unbroken parchment once laid flat.
function SheetFace({ offset }: { offset: string }) {
  return (
    <div
      className="absolute left-0 w-full"
      style={{
        top: offset,
        height: "300%",
        WebkitMaskImage: P_DECKLE,
        maskImage: P_DECKLE,
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
          borderRadius: P_RADIUS,
          background: PAPER,
          border: "1px solid rgba(96,70,38,0.55)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,246,222,0.25)," +
            "inset 0 26px 40px -26px rgba(74,52,26,0.7)," +
            "inset 0 -26px 40px -26px rgba(74,52,26,0.7)," +
            "inset 26px 0 34px -26px rgba(74,52,26,0.6)," +
            "inset -26px 0 34px -26px rgba(74,52,26,0.6)",
        }}
      />
      {/* the grain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: PAPER_GRAIN,
          backgroundSize: "170px 170px",
          mixBlendMode: "multiply",
          opacity: 0.05,
        }}
      />
      {/* a little of the torch's warmth caught in the fibres, off the top */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 82% 58% at 44% 4%, " +
            "rgba(255,201,120,0.6) 0%, rgba(255,160,74,0.24) 42%, transparent 76%)",
          mixBlendMode: "screen",
        }}
      />
      {/* and the dark it sinks into away from the flame */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 128% 100% at 42% 4%, transparent 0%, transparent 44%, rgba(8,6,4,0.48) 88%)",
        }}
      />
    </div>
  );
}

// One leaf of the tri-fold. The middle leaf (index 1) is the packet's still face
// and never turns; the head (0) and foot (2) hinge on their creases and fold
// forward over it, then swing flat on `unfold`. A soft cast shadow along each
// leaf falls onto the one below, so the creases read even when laid flat.
function Leaf({
  index,
  unfold,
  folded,
  delay,
}: {
  index: number;
  unfold: boolean;
  /** the leaf's resting-folded rotation (0 for the still middle leaf) */
  folded: number;
  delay: number;
}) {
  const origin =
    index === 0 ? "center bottom" : index === 2 ? "center top" : "center";
  return (
    <motion.div
      className="absolute left-0 right-0 overflow-hidden"
      style={{
        top: `${index * (100 / 3)}%`,
        height: `${100 / 3}%`,
        transformOrigin: origin,
        transformStyle: "preserve-3d",
        backfaceVisibility: "visible",
        boxShadow: "0 16px 26px -18px rgba(0,0,0,0.85)",
      }}
      initial={false}
      animate={{ rotateX: unfold ? 0 : folded }}
      transition={{
        duration: 0.9,
        delay: unfold ? delay : 0,
        ease: [0.42, 0, 0.2, 1],
      }}
    >
      <SheetFace offset={`${-index * 100}%`} />
    </motion.div>
  );
}

export default function Parchment({
  show,
  unfold = false,
  children,
}: {
  /** the sheet resolves in, folded */
  show: boolean;
  /** the leaves swing open and lay the sheet flat */
  unfold?: boolean;
  /** the reading inked onto it — the caller gates when this appears */
  children?: ReactNode;
}) {
  return (
    <div className="absolute left-1/2 top-1/2 z-10 w-[34rem] max-w-[88vw] -translate-x-1/2 -translate-y-1/2">
      <div className="relative h-[42rem] max-h-[84vh] w-full">
        {/* the sheet, brought up folded then unfolding */}
        <motion.div
          className="absolute inset-0"
          style={{ perspective: "2200px", perspectiveOrigin: "50% 30%" }}
          initial={false}
          animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.94 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* the three creased leaves */}
          <div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* head leaf folds forward over the middle, opens first */}
            <Leaf index={0} unfold={unfold} folded={-178} delay={0} />
            {/* the still middle face of the packet */}
            <Leaf index={1} unfold={unfold} folded={0} delay={0} />
            {/* foot leaf folds forward over the middle, opens a beat later */}
            <Leaf index={2} unfold={unfold} folded={178} delay={0.5} />
          </div>

          {/* the reading, over the laid-flat sheet — clipped to the deckled edge.
              The caller only mounts children once the sheet is open. */}
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: P_DECKLE,
              maskImage: P_DECKLE,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
