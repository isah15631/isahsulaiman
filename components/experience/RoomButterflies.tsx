"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SWARM } from "@/lib/palette";
import Butterfly from "./Butterfly";

// The swarm did not disappear when the heart broke, it moved on. Now and then
// one of them crosses this room.
//
// The whole point is that you should not be sure you saw it. They are rare,
// slow, faint, and they pass behind the words rather than in front of them.
// One every ten to twenty five seconds, taking the better part of half a
// minute to cross, is the difference between a memory of the eruption and a
// screensaver.
//
// They are dim when the lamp is off and brighter when it is on, because they
// are in the room rather than painted on it. That is also what earns them:
// the light you switched on is what reveals them.

const MIN_WAIT = 9000;
const EXTRA_WAIT = 16000;
/** With the lamp lit and in the room, this many crossings become visits. */
const MOTH_SHARE = 0.45;

type Flight = {
  id: number;
  color: string;
  size: number;
  flap: number;
  /** vertical band, in percent of the viewport. Moths use 0 and absolute y. */
  top: number;
  x: number[];
  y: number[];
  rotate: number[];
  /** only the orbiting ones need custom spacing; a crossing is even */
  times?: number[];
  duration: number;
};

/**
 * Where the bulb's glass sits on screen.
 *
 * Mirrors the cord length in LightBulb, which is a Tailwind arbitrary value
 * and so cannot be shared as a constant without breaking the class scanner.
 * If that clamp changes, this has to change with it.
 */
function lampPoint(vw: number, vh: number) {
  const cord = Math.min(130, Math.max(56, vh * 0.12));
  return { x: vw / 2, y: cord + 50 }; // +50: the glass centre in a 104px svg
}

/** Tangent of the path at each point, unwrapped so it never spins backwards. */
function headings(pts: { x: number; y: number }[]) {
  const out: number[] = [];
  let prev = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.min(i + 1, pts.length - 1)];
    const b = pts[Math.max(i - 1, 0)];
    // +90 because the sprite is drawn pointing up, the same convention the
    // eruption's canvas uses
    let deg = (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI + 90;
    while (deg - prev > 180) deg -= 360;
    while (prev - deg > 180) deg += 360;
    out.push(deg);
    prev = deg;
  }
  return out;
}

function makeFlight(id: number): Flight {
  const rand = () => Math.random();
  const vw = window.innerWidth;
  // travelling right reads as rotate 90, left as -90: the sprite is drawn
  // pointing up, the same convention the eruption's canvas uses
  const rightward = rand() > 0.5;
  const base = rightward ? 90 : -90;
  const from = rightward ? -70 : vw + 70;
  const to = rightward ? vw + 70 : -70;
  const mid = (from + to) / 2;
  const rise = 26 + rand() * 46;

  return {
    id,
    color: SWARM[Math.floor(rand() * SWARM.length)],
    size: 14 + rand() * 10,
    flap: 0.34 + rand() * 0.22,
    top: 14 + rand() * 62,
    x: [from, mid - (to - from) * 0.18, mid + (to - from) * 0.16, to],
    // never a straight line: it lifts, sinks, and lifts again
    y: [0, -rise, rise * 0.55, -rise * 0.3],
    rotate: [base - 7, base + 9, base - 6, base + 5],
    duration: 17 + rand() * 9,
  };
}

/**
 * One that came for the light rather than passing through.
 *
 * It arrives from an edge, tightens onto the bulb, goes round it a couple of
 * times pulling closer and then drifting back out, and leaves. Moths do this,
 * and it is the only thing in the room that makes the lamp and the swarm feel
 * like they are in the same place rather than being two layers stacked up.
 */
function makeMoth(id: number): Flight {
  const rand = () => Math.random();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const lamp = lampPoint(vw, vh);

  const fromRight = rand() > 0.5;
  const startX = fromRight ? vw + 70 : -70;
  const startY = lamp.y + (rand() - 0.5) * vh * 0.45;

  const r0 = 120 + rand() * 70;
  const a0 = Math.atan2(startY - lamp.y, startX - lamp.x);
  const entry = {
    x: lamp.x + Math.cos(a0) * r0,
    y: lamp.y + Math.sin(a0) * r0,
  };

  const APPROACH = 5;
  const STEPS = 20;
  const EXIT = 4;
  const pts: { x: number; y: number }[] = [];

  // in, slowing as it commits to the light
  for (let i = 0; i <= APPROACH; i++) {
    const k = i / APPROACH;
    const e = 1 - Math.pow(1 - k, 2);
    pts.push({
      x: startX + (entry.x - startX) * e,
      y: startY + (entry.y - startY) * e,
    });
  }

  // round it, pulling in close at the halfway point and easing back out
  const dir = rand() > 0.5 ? 1 : -1;
  const turns = 2 + rand();
  for (let i = 1; i <= STEPS; i++) {
    const k = i / STEPS;
    const ang = a0 + dir * k * turns * Math.PI * 2;
    const r = r0 * (1 - 0.55 * Math.sin(Math.PI * k));
    pts.push({ x: lamp.x + Math.cos(ang) * r, y: lamp.y + Math.sin(ang) * r });
  }

  // and away, lifting as it goes
  const last = pts[pts.length - 1];
  const away = rand() > 0.5 ? vw + 90 : -90;
  const outY = lamp.y - vh * 0.12;
  for (let i = 1; i <= EXIT; i++) {
    const k = i / EXIT;
    pts.push({
      x: last.x + (away - last.x) * k,
      y: last.y + (outY - last.y) * k,
    });
  }

  const times = pts.map((_, i) => {
    if (i <= APPROACH) return (i / APPROACH) * 0.3;
    if (i <= APPROACH + STEPS) return 0.3 + ((i - APPROACH) / STEPS) * 0.5;
    return 0.8 + ((i - APPROACH - STEPS) / EXIT) * 0.2;
  });

  return {
    id,
    color: SWARM[Math.floor(rand() * SWARM.length)],
    size: 15 + rand() * 9,
    flap: 0.3 + rand() * 0.2,
    top: 0, // absolute y, unlike a crossing
    x: pts.map((p) => p.x),
    y: pts.map((p) => p.y),
    rotate: headings(pts),
    times,
    duration: 15 + rand() * 7,
  };
}

type Props = {
  lit: boolean;
  /** The bulb is on and actually in this room, so it can be flown to. */
  lamp: boolean;
};

export default function RoomButterflies({ lit, lamp }: Props) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const reduced = useReducedMotion();
  const nextId = useRef(0);
  // Read by the scheduler without restarting it every time the light changes.
  const lampRef = useRef(lamp);
  useEffect(() => {
    lampRef.current = lamp;
  }, [lamp]);

  useEffect(() => {
    // An ambient loop is exactly the kind of motion someone turns off.
    if (reduced) return;

    let timer = 0;
    const schedule = (wait: number) => {
      timer = window.setTimeout(() => {
        const toLamp = lampRef.current && Math.random() < MOTH_SHARE;
        setFlights((f) => [
          ...f,
          toLamp ? makeMoth(nextId.current++) : makeFlight(nextId.current++),
        ]);
        schedule(MIN_WAIT + Math.random() * EXTRA_WAIT);
      }, wait);
    };
    // not immediately: you should be settled in the room before the first one
    schedule(6000 + Math.random() * 6000);

    return () => window.clearTimeout(timer);
  }, [reduced]);

  // Turning the light on calls one in. Not instantly: it has to have noticed.
  useEffect(() => {
    if (reduced || !lamp) return;
    const t = window.setTimeout(
      () => setFlights((f) => [...f, makeMoth(nextId.current++)]),
      1400 + Math.random() * 1800
    );
    return () => window.clearTimeout(t);
  }, [lamp, reduced]);

  if (reduced) return null;

  return (
    <motion.div
      // absolute, not fixed: this lives inside a wall now, and a wall is
      // inside a pane that gets a transform during a fall. A fixed child of a
      // transformed ancestor is contained by it, so `fixed` would mean one
      // thing mid-fall and another at rest, and the swarm would jump at the
      // moment the transform cleared.
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden
      initial={false}
      // the lamp reveals them; dark, they are barely a suggestion
      animate={{ opacity: lit ? 0.4 : 0.11 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      {flights.map((f) => (
        <motion.div
          key={f.id}
          className="absolute left-0"
          style={{ top: `${f.top}%` }}
          initial={{ x: f.x[0], y: 0, opacity: 0, rotate: f.rotate[0] }}
          animate={{
            x: f.x,
            y: f.y,
            rotate: f.rotate,
            // fade at both edges so nothing pops in or out mid-frame
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: f.duration,
            ease: "linear",
            ...(f.times ? { times: f.times } : {}),
            opacity: { duration: f.duration, times: [0, 0.12, 0.85, 1] },
          }}
          onAnimationComplete={() =>
            setFlights((list) => list.filter((x) => x.id !== f.id))
          }
        >
          <Butterfly color={f.color} size={f.size} flapDuration={f.flap} />
        </motion.div>
      ))}
    </motion.div>
  );
}
