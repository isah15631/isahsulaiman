"use client";

import { motion } from "framer-motion";
import RoomButterflies from "./RoomButterflies";

// The surface the room is made of.
//
// Everything after the door happens against black, which is fine for a void and
// wrong for a room: you cannot hang a lamp on nothing, and the light it throws
// has to land somewhere. This is what it lands on.
//
// Four layers, all of them static. The lamp does not move any more, so nothing
// here is computed from anything: the browser paints each one once and caches
// it, and the pane can then be translated around during a fall for free. That
// matters more than it sounds. The last thing this room needs is another
// per-frame repaint.
//
// The plaster is lit from the top centre because that is where the bulb is,
// and it falls away downward and into both corners, which is what stops a flat
// fill from reading as a backdrop rather than as a wall.

/**
 * Fractal noise, desaturated, tiled at 160px.
 *
 * A wall with no grain is a gradient. This is rasterised once by the browser
 * and repeated, so it costs a texture upload and nothing after that. The
 * colour matrix matters: raw feTurbulence is full-range RGB and speckles
 * colour across a near-black wall.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** Bare plaster, and the corners the wall turns at. */
const PLASTER =
  "linear-gradient(to bottom, #0d0a08 0%, #0a0806 46%, #060404 100%)";
const CORNERS =
  "linear-gradient(to right, rgba(0,0,0,0.6), transparent 16%, transparent 84%, rgba(0,0,0,0.6))";
/** What the bulb puts on it. */
const LAMPLIGHT =
  "radial-gradient(120% 74% at 50% 0%, rgba(255,152,82,0.15), rgba(255,130,60,0.05) 46%, transparent 68%)";

type Props = {
  lit: boolean;
  /** The bulb is on and hanging in front of THIS wall, so moths can come to it. */
  lamp: boolean;
};

export default function Wall({ lit, lamp }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: PLASTER }} />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: GRAIN,
          backgroundSize: "160px 160px",
          opacity: 0.055,
        }}
      />

      {/* Only this one changes, and only when the chain is pulled. */}
      <motion.div
        className="absolute inset-0"
        style={{ background: LAMPLIGHT }}
        initial={false}
        animate={{ opacity: lit ? 1 : 0.22 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      <div className="absolute inset-0" style={{ background: CORNERS }} />

      {/* The skirting board, and it is doing most of the work. A wall is a
          flat surface until it meets a floor; one horizontal line near the
          bottom is the whole difference between a dark backdrop and a room you
          are standing in. */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: 26 }}>
        <div
          className="absolute inset-x-0 top-0"
          style={{ height: 1, background: "rgba(228,198,152,0.13)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,214,170,0.045), rgba(0,0,0,0.55))",
          }}
        />
      </div>

      {/* And they fly in front of it.
          They belong to the wall rather than to the room's root because the
          wall is opaque: painted at the root they would render first and the
          plaster would cover them completely. Here they are above the surface
          and still below everything the pane hangs on it, which is where a
          thing flying through a room ought to be. */}
      <RoomButterflies lit={lit} lamp={lamp} />
    </div>
  );
}
