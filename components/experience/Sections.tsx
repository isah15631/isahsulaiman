"use client";

import {
  AnimatePresence,
  motion,
  type Variants,
} from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ABOUT,
  PROJECTS,
  HOBBIES,
  CONTACT,
  STACK,
  type Hobby,
} from "@/lib/content";
import { SWARM } from "@/lib/palette";
import { playClick } from "@/lib/audio";
import Carrier from "./Carrier";
import Companion from "./Companion";
import HobbyRoll from "./HobbyRoll";
import HobbyScroll from "./HobbyScroll";
import LightBulb from "./LightBulb";
import PortraitAssembly from "./PortraitAssembly";
import RoomButterflies from "./RoomButterflies";

type SectionKey = "about" | "projects" | "hobbies" | "contact";
const MENU: { key: SectionKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "projects", label: "Projects" },
  // The key stays "hobbies" — it is wired to a section, a palette slot and a
  // dev route, and none of those are what a visitor reads.
  { key: "hobbies", label: "Digressions" },
  { key: "contact", label: "Contact" },
];

// The room is above and the sections are below it, and you move between them
// vertically. Opening one is a drop: it rushes up from under you while the
// menu rises out of the top of the frame. Going back is the climb, and because
// the lamp lives in the menu, the whole fixture descends into view again.
//
// Both panes are on screen together for the length of it, which is the whole
// point. Wait for one to leave before the other arrives and it stops being a
// fall and becomes two slides.
//
// Percentages, not viewport units: each pane is `absolute inset-0`, so 100% is
// exactly one screen however tall the phone chrome makes that today.
//
// GAP is the distance between the room and a section, and it is the whole
// reason this has any weight. At 100% they are flush, so nothing ever travels
// further than the screen you can already see and a fast transition just looks
// abrupt. Further apart, there is dark between the two, and for most of the
// drop that dark is all you can see. You fall past nothing to get somewhere.
const GAP = 170;
// A small settle at the end, as a fraction of a screen rather than of GAP, so
// the landing lands the same however far the fall was.
const OVER = 1.6;

// Both panes are rigid parts of one world and it is the camera that moves, so
// they share a curve exactly. Give them different easings and the world
// stretches between them, which is instantly wrong however good it looks
// frame by frame.
const TRAVEL: [number, number, number, number] = [0.5, 0, 0.15, 1];
const SETTLE: [number, number, number, number] = [0.4, 0, 0.4, 1];

const FALL = {
  duration: 0.62,
  times: [0, 0.85, 1],
  ease: [TRAVEL, SETTLE],
};
const RISE = {
  duration: 0.82,
  times: [0, 0.85, 1],
  ease: [TRAVEL, SETTLE],
};

// The overshoot runs against the direction of travel: falling, everything
// carries a little past where it stops and comes back.
const room: Variants = {
  enter: (down: boolean) => ({ y: `${down ? GAP : -GAP}%` }),
  center: (down: boolean) => ({
    y: down
      ? [`${GAP}%`, `${-OVER}%`, "0%"]
      : [`${-GAP}%`, `${OVER}%`, "0%"],
    transition: down ? FALL : RISE,
  }),
  leave: (down: boolean) => ({
    y: down
      ? ["0%", `${-GAP - OVER}%`, `${-GAP}%`]
      : ["0%", `${GAP + OVER}%`, `${GAP}%`],
    transition: down ? FALL : RISE,
  }),
};

/** Each pane owns its own scrolling, so neither can disturb the other's. */
const PANE = "absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar";

// The portrait's shape: a dome at the top, gently rounded below. Not a full
// oval, which crops a head into a locket, and not a rectangle, which was the
// flattest thing on the page. The two radii per corner are what make it an
// arch rather than a stadium: 50% horizontally at the top so the curve starts
// from the centre line, but only about half that vertically, so it domes
// without ever reaching the crown of the head.
const ARCH = "50% 50% 44% 44% / 52% 52% 16% 16%";
const ARCH_INNER = "50% 50% 43% 43% / 51% 51% 15% 15%";

/** The lower edge goes into the page rather than stopping at an edge. */
const DISSOLVE =
  "linear-gradient(to bottom, #000 58%, rgba(0,0,0,0.55) 82%, transparent 100%)";

// Carrying the address in. Shorter than the welcome's lift: you have already
// seen this done once, and the second time it should be a nod rather than a
// performance. It waits for the fall to land before starting.
const MAIL_DELAY = 0.55;
const MAIL_LIFT = 2.2;
const MAIL_RELEASE = MAIL_DELAY + MAIL_LIFT + 0.5;
const MAIL_TOTAL = MAIL_RELEASE + 1.6;

/**
 * The same light, reachable from inside a section.
 *
 * You fell down into this room, so the lamp is above you and its cord comes
 * down out of the top of the frame. Pull it and the reading goes dark and the
 * only things left are the butterflies, which are faint precisely because the
 * lamp is off.
 *
 * It lives outside the panes, fixed to the frame, so it does not travel with
 * the fall. The light belongs to the room, not to the page you are on.
 */
function SectionCord({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        playClick();
        onToggle();
      }}
      aria-label={on ? "Turn the light off" : "Turn the light on"}
      aria-pressed={on}
      className="pointer-events-auto absolute right-5 top-0 z-30 flex cursor-pointer flex-col items-center p-3 sm:right-8"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
    >
      <motion.span
        className="block"
        style={{
          width: "1.5px",
          backgroundColor: "rgba(255,255,255,0.28)",
          backgroundImage:
            "linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.6))",
        }}
        animate={{ height: 52 }}
        whileHover={{ height: 60 }}
        whileTap={{ height: 72 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      />
      <motion.span
        className="relative block h-[7px] w-[7px] rounded-full"
        style={{ background: "rgba(226,220,208,0.75)" }}
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      >
        {/* Breathing while the room is dark. This is the only way back to the
            light from in here, so it has to announce itself. */}
        {!on && (
          <motion.span
            className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "rgba(242,181,68,0.5)" }}
            animate={{ opacity: [0, 0.55, 0], scale: [0.6, 1.9, 0.6] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.span>
    </motion.button>
  );
}

export default function Sections() {
  const [selected, setSelected] = useState<SectionKey | null>(null);
  // The room starts dark. Finding the switch is the point.
  const [lightOn, setLightOn] = useState(false);
  // Which way we are travelling: into a section, or back up to the menu.
  const [down, setDown] = useState(true);

  // The lamp is overhead and it stays there, so this is a constant string and
  // not a value derived from anything.
  //
  // It used to be rebuilt from the fixture's lean on every frame of a swing.
  // Two chained drop-shadows recomputed over live text sixty times a second is
  // one of the more expensive things you can ask a browser for, and it was
  // costing the whole room its frame rate. Held still it is free: painted once
  // and cached.
  //
  // A warm glow just below the words, because the lamp is above them, and a
  // shadow thrown the same way. The shadow only reads at all because the cone
  // lays a wash down behind the menu for it to fall on; against the bare page
  // it would be black on black. Cast second, so it is thrown by the already
  // glowing text rather than the glow being smeared around the shadow.
  const LIT =
    "drop-shadow(0px 7px 10px rgba(255,176,96,0.5)) " +
    "drop-shadow(0px 9px 5px rgba(0,0,0,0.55))";

  const open = (key: SectionKey) => {
    setDown(true);
    setSelected(key);
  };
  const back = () => {
    setDown(false);
    setSelected(null);
  };

  return (
    // overflow-hidden here, and the scrolling moved onto the panes: while one
    // is falling past the other they would otherwise share a scrollbar and
    // fight over its height.
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#070504] text-neutral-200">
      {/* warm vignette so sections feel like the world the butterflies made */}
      <motion.div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(255,120,60,0.08), transparent 55%)",
        }}
        initial={false}
        animate={{ opacity: lightOn ? 1 : 0.25 }}
        transition={{ duration: 0.6 }}
      />

      {/* Placed before the content on purpose. Positioned siblings with no
          stacking of their own paint in DOM order, so they pass behind the
          words rather than across them. */}
      {/* lamp: the bulb is lit AND you are in the room with it, so there is
          something to fly to. Down in a section it is above the ceiling. */}
      <RoomButterflies lit={lightOn} lamp={lightOn && selected === null} />

      {/* One of them comes down with you when you open a section, hangs there a
          while, and climbs back out. Keyed on the section so each drop gets its
          own, and mounted out here rather than in the pane so it does not travel
          with the fall: it is doing its own falling. */}
      <AnimatePresence>
        {selected !== null && <Companion key={selected} lit={lightOn} />}
      </AnimatePresence>

      {/* the cord, only once you are down here with the lamp above you */}
      <AnimatePresence>
        {selected !== null && (
          <SectionCord
            key="cord"
            on={lightOn}
            onToggle={() => setLightOn((v) => !v)}
          />
        )}
      </AnimatePresence>

      {/* initial={false}: on the very first arrival the menu should simply be
          here, with the lamp lowering into it. Only later moves are falls. */}
      <AnimatePresence initial={false} custom={down}>
        {selected === null ? (
          <motion.div
            key="menu"
            custom={down}
            variants={room}
            initial="enter"
            animate="center"
            exit="leave"
            className={PANE}
          >
            <div className="relative flex min-h-full flex-col items-center justify-center">
              <LightBulb
                on={lightOn}
                onToggle={() => setLightOn((v) => !v)}
              />

              {/* The menu only exists while the light is on. Off, the room is
                  dark and there is nothing to read or click.

                  It is lit, not faded in. Light does not make a thing arrive, it
                  makes a thing visible, so the words brighten from almost unlit,
                  overshoot as the filament surges, and settle. The stagger runs
                  top to bottom because that is the direction the cone travels,
                  and the warm halo is the tungsten catching the letterforms
                  before it settles to a glow.

                  Brightness rather than colour on purpose: an inline `color`
                  would outrank the hover:text-ember class and kill the hover. */}
              <motion.nav
                className="relative z-10 mt-[26vh] flex flex-col items-center gap-6"
                aria-hidden={!lightOn}
                // dims as the lamp swings off them; the per-item lighting below
                // is a separate filter and the two compose
                style={{ filter: LIT }}
              >
                {MENU.map((m, i) => (
                  <motion.button
                    key={m.key}
                    onClick={() => open(m.key)}
                    tabIndex={lightOn ? 0 : -1}
                    initial={false}
                    animate={
                      lightOn
                        ? {
                            opacity: [0, 1, 1],
                            filter: [
                              "brightness(0.15)",
                              "brightness(1.18)",
                              "brightness(1)",
                            ],
                            textShadow: [
                              "0 0 0px rgba(255,190,110,0)",
                              "0 0 20px rgba(255,190,110,0.5)",
                              "0 0 9px rgba(255,190,110,0.16)",
                            ],
                          }
                        : {
                            opacity: 0,
                            filter: "brightness(0.15)",
                            textShadow: "0 0 0px rgba(255,190,110,0)",
                          }
                    }
                    transition={
                      lightOn
                        ? {
                            duration: 0.85,
                            times: [0, 0.35, 1],
                            delay: 0.1 + i * 0.12,
                            ease: "easeOut",
                          }
                        : { duration: 0.3, ease: "easeOut" }
                    }
                    className={`font-serif text-3xl font-light tracking-wide text-neutral-200 transition-colors duration-500 hover:text-ember md:text-5xl ${
                      lightOn ? "" : "pointer-events-none"
                    }`}
                  >
                    {m.label}
                  </motion.button>
                ))}
              </motion.nav>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={selected}
            custom={down}
            variants={room}
            initial="enter"
            animate="center"
            exit="leave"
            className={PANE}
          >
            {/* Kill the light in here and the reading goes with it. Opacity
                only: pointer events and the accessibility tree are left alone,
                because a screen reader turning off a lamp it cannot see should
                not lose the page. */}
            <motion.section
              className="relative mx-auto min-h-full w-full max-w-3xl px-6 py-24"
              initial={false}
              animate={{ opacity: lightOn ? 1 : 0.045 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <button
                onClick={back}
                className="mb-16 font-sans text-sm tracking-widest text-neutral-500 transition-colors hover:text-ember"
              >
                ← back
              </button>

              {selected === "about" && <About />}
              {selected === "projects" && <Projects />}
              {selected === "hobbies" && <Hobbies />}
              {selected === "contact" && <Contact />}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-10 font-serif text-4xl font-light tracking-wide text-neutral-100 md:text-5xl">
      {children}
    </h2>
  );
}

function About() {
  return (
    <div>
      <Heading>About</Heading>
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        {/* The portrait carries the same idea as the heart: colour returning to
            something that began without it. It warms out of grayscale as it
            arrives, and its lower edge dissolves into the page instead of
            stopping at a hard rectangle, which on a phone was the flattest
            thing on the site. */}
        <div className="relative mx-auto w-[min(78%,17rem)] shrink-0 md:mx-0 md:w-44">
          {/* warm light pooling behind him, echoing the bulb */}
          <div
            className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, rgba(255,150,80,0.18), rgba(255,130,60,0.05) 55%, transparent 78%)",
            }}
          />
          {/* An outer rule, standing off the picture. Two lines at different
              distances is what separates a frame from a border. */}
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
            // The frame IS the padding: a one-pixel gradient behind the
            // picture, showing only at the edge. A plain border cannot do this
            // because a border takes one flat colour, and this one has to be
            // bright along the top and gone by the bottom. The lamp is above.
            className="relative aspect-[3/4] p-px"
            style={{
              borderRadius: ARCH,
              background:
                "linear-gradient(to bottom, rgba(232,202,152,0.6), rgba(232,202,152,0.16) 45%, rgba(232,202,152,0) 78%)",
              // Carries the dissolve for the frame as well as the photograph,
              // so the whole thing sinks into the page together rather than
              // the picture fading out inside a frame that does not.
              WebkitMaskImage: DISSOLVE,
              maskImage: DISSOLVE,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div
              className="h-full w-full overflow-hidden"
              style={{ borderRadius: ARCH_INNER }}
            >
              <PortraitAssembly src={ABOUT.photo} alt={ABOUT.name} />
            </div>
          </motion.div>
        </div>
        <div className="font-sans text-[15px] leading-relaxed text-neutral-300">
          <p className="mb-1 font-serif text-2xl text-neutral-100">{ABOUT.name}</p>
          <p className="mb-6 text-sm uppercase tracking-widest text-ember/80">
            {ABOUT.role}
          </p>
          <p className="mb-8">{ABOUT.bio}</p>

          {/* expertise: label above its list, so a long group name like
              "Practices & Tools" cannot squeeze the items into a narrow column */}
          <div className="mb-8 flex flex-col gap-4">
            {STACK.map((g) => (
              <div key={g.group}>
                <p className="mb-1 font-sans text-[11px] uppercase tracking-[0.18em] text-neutral-600">
                  {g.group}
                </p>
                <p className="font-sans text-[13px] leading-relaxed text-neutral-400">
                  {g.items.join(" · ")}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm tracking-wide">
            {ABOUT.socials.map((s) => {
              const external = s.href.startsWith("http");
              return (
                <a
                  key={s.label}
                  href={s.href}
                  {...(external
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                  className="text-neutral-400 transition-colors hover:text-ember"
                >
                  {s.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// A project assembles as you reach it, one part at a time: the thread first,
// then the tag it carries, then the title, then the words. The thread is the
// same idea as the one the butterflies held "hello." by, laid on its side and
// used as a lead-in rule.
//
// The scroll container is `fixed inset-0`, so its bounds are exactly the
// viewport and a plain IntersectionObserver sees these correctly. No custom
// root needed.
const article: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const rises: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const draws: Variants = {
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

function Projects() {
  return (
    <div>
      <Heading>Projects</Heading>
      <div className="flex flex-col gap-14">
        {PROJECTS.map((p) => (
          <motion.article
            key={p.title}
            variants={article}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.25 }}
          >
            <div className="mb-2 flex items-center gap-3">
              <motion.span
                variants={draws}
                className="block h-px w-7 origin-left bg-ember/60"
              />
              <motion.p
                variants={rises}
                className="font-sans text-[11px] uppercase tracking-[0.2em] text-ember/70"
              >
                {p.tag}
                {p.year && <span className="text-neutral-600"> · {p.year}</span>}
              </motion.p>
            </div>
            <motion.h3
              variants={rises}
              className="mb-3 font-serif text-2xl text-neutral-100"
            >
              {p.title}
            </motion.h3>
            <motion.p
              variants={rises}
              className="mb-4 max-w-2xl font-sans text-[15px] leading-relaxed text-neutral-300"
            >
              {p.story}
            </motion.p>
            {p.notes && (
              <motion.p
                variants={rises}
                className="mb-4 max-w-2xl font-sans text-sm leading-relaxed text-neutral-500"
              >
                {p.notes}
              </motion.p>
            )}
            <motion.div
              variants={rises}
              className="flex flex-wrap items-center gap-2"
            >
              {/* stack is only listed where it is actually known */}
              {p.stack?.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-neutral-800 px-3 py-1 font-sans text-xs tracking-wide text-neutral-400"
                >
                  {t}
                </span>
              ))}
              {/* and a link only where one really exists */}
              {p.href && (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ml-2 font-sans text-xs tracking-widest text-ember transition-opacity hover:opacity-70"
                >
                  visit →
                </a>
              )}
            </motion.div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

// Each object is lent one of the swarm's colours, cycled. The whole set, gold
// and bone included: the reason those two were kept off the old cards was that
// a coloured glow behind a panel of text stops reading as colour and starts
// reading as lamplight. Nothing here is a panel. The colour is a soft wash
// behind a drawn object and a fill in its wings, and at that job gold is one of
// the best of them.
const HOBBY_COLORS = SWARM;

/** Matches the object's own aspect, so the grid does not reflow when one leaves. */
const OBJECT_SIZE = 152;
const OBJECT_BOX = Math.round((OBJECT_SIZE * 78) / 116);

/**
 * The shelf.
 *
 * Scrolls hanging in the dark, each wearing the swarm's wings and each tied with
 * its own colour. They are all the same drawing, which is the point: a hobby is
 * now a line of content and a colour rather than a bespoke object somebody has
 * to draw, so the eighth one costs nothing.
 *
 * While one is open, its instance is deliberately NOT rendered here. Two
 * elements sharing a layoutId at the same time is a conflict, and the shared
 * transition works precisely by one unmounting as the other mounts — so the
 * grid keeps a same-sized hole where the object was, and the object itself is
 * now sitting at the top of the scroll.
 */
function Hobbies() {
  const [open, setOpen] = useState<Hobby["key"] | null>(null);
  // The scroll is a modal and has to be measured against the window, but every
  // ancestor it has here is transformed — the pane the sections ride in moves
  // on the y axis — and a transformed ancestor becomes the containing block for
  // anything `fixed` inside it. So it goes to the body instead. React portals
  // keep context, so the shared layout transition still finds its partner.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const openIndex = HOBBIES.findIndex((h) => h.key === open);
  const openHobby = openIndex >= 0 ? HOBBIES[openIndex] : null;

  return (
    <div>
      <Heading>Digressions</Heading>
      <p className="-mt-6 mb-12 font-sans text-[11px] uppercase tracking-[0.2em] text-neutral-600">
        Pick one up
      </p>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {HOBBIES.map((h, i) => (
          <li key={h.key} className="flex justify-center">
            <motion.button
              type="button"
              onClick={() => setOpen(h.key)}
              aria-label={`Open ${h.title}`}
              className="group flex flex-col items-center rounded-lg px-2 py-2 outline-none focus-visible:ring-1 focus-visible:ring-ember/60"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <span
                className="flex items-center justify-center"
                style={{ height: OBJECT_BOX, width: OBJECT_SIZE }}
              >
                {open !== h.key && (
                  <motion.span
                    layoutId={`hobby-${h.key}`}
                    className="block"
                    // Back to its place quickly. Going out it is being handed
                    // something and there is time to watch; coming back the
                    // reading is already over.
                    transition={{ duration: 0.34, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <HobbyRoll
                      color={HOBBY_COLORS[i % HOBBY_COLORS.length]}
                      size={OBJECT_SIZE}
                      phase={i}
                    />
                  </motion.span>
                )}
              </span>
              {/* No caption. The name is carried only by the button's accessible
                  label, which a screen reader needs and a visitor does not: it is
                  written across the top of the scroll the moment it opens, and
                  opening one is the only way anyone was ever going to read it. */}
            </motion.button>
          </li>
        ))}
      </ul>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {openHobby && (
              <HobbyScroll
                key={openHobby.key}
                hobby={openHobby}
                color={HOBBY_COLORS[openIndex % HOBBY_COLORS.length]}
                phase={openIndex}
                onClose={() => setOpen(null)}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (insecure context, or the user said no) — the
      // mailto link beside it still works, so this stays silent.
    }
  };

  return (
    <div>
      <Heading>Contact</Heading>
      <p className="mb-12 max-w-xl font-sans text-[15px] leading-relaxed text-neutral-300">
        {CONTACT.invitation}
      </p>

      {/* No form: the address itself is the invitation.

          And it is brought to you, by the same two butterflies on the same
          threads that carried "hello." in at the start. The piece opens with
          them handing you a word and closes with them handing you the way to
          reach him. Same component, different timing. */}
      <motion.div
        className="relative inline-block font-serif text-2xl font-light sm:text-4xl"
        initial={{ opacity: 0, y: 44 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MAIL_LIFT, delay: MAIL_DELAY, ease: "easeOut" }}
      >
        <a
          href={`mailto:${CONTACT.email}`}
          className="group block tracking-wide text-neutral-100 transition-colors duration-500 hover:text-ember"
        >
          {CONTACT.email}
          {/* The rule stays; an ember one is drawn along it from the left on
              hover. It used to carry `origin-left scale-x-100`, which is a
              no-op, so the draw that was clearly intended never happened and
              only the colour change survived. */}
          <span className="relative mt-2 block h-px w-full bg-neutral-700">
            <span className="absolute inset-0 origin-left scale-x-0 bg-ember transition-transform duration-500 ease-out group-hover:scale-x-100" />
          </span>
        </a>

        <Carrier
          side="left"
          insetEm={0.34}
          color="#f2b544"
          size={18}
          flap={0.27}
          tilt={-12}
          threadEm={0.7}
          away={{ x: -120, y: -96 }}
          liftDelay={MAIL_DELAY}
          releaseAt={MAIL_RELEASE}
          total={MAIL_TOTAL}
        />
        <Carrier
          side="right"
          insetEm={0.4}
          color="#f7f3ea"
          size={16}
          flap={0.32}
          tilt={12}
          threadEm={0.9}
          away={{ x: 128, y: -110 }}
          liftDelay={MAIL_DELAY}
          releaseAt={MAIL_RELEASE}
          total={MAIL_TOTAL}
        />
      </motion.div>

      <div className="mt-4 h-5">
        <button
          onClick={copy}
          className="font-sans text-xs tracking-widest text-neutral-500 transition-colors hover:text-ember"
        >
          {copied ? "copied." : "copy address"}
        </button>
      </div>

      {/* The number, under the address rather than beside it. It is the second
          way in, not a rival to the first: same serif, a size down, and no
          butterflies. */}
      <p className="mt-8 font-serif text-lg font-light tracking-wide sm:text-xl">
        <a
          href={CONTACT.phoneHref}
          className="group inline-block text-neutral-300 transition-colors duration-500 hover:text-ember"
        >
          {CONTACT.phone}
          <span className="relative mt-2 block h-px w-full bg-neutral-800">
            <span className="absolute inset-0 origin-left scale-x-0 bg-ember transition-transform duration-500 ease-out group-hover:scale-x-100" />
          </span>
        </a>
      </p>

      <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3 font-sans text-sm">
        {CONTACT.socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-neutral-400 transition-colors hover:text-ember"
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
