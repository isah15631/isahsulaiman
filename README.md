# The Dormant Heart

A quiet cinematic portfolio experience by Isah Sulaiman.

The creative brief and build contract live in **[SPEC.md](SPEC.md)**. Read it first.

## Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · React Three Fiber and
three.js (the heart only) · Framer Motion · GSAP · Howler.js

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and tap the heart five times.

## Build

```bash
npm run build
npm start
```

> Do not run `npm run build` while `npm run dev` is running. Both write to
> `.next`, and the dev server will start serving a build that no longer exists.
> Stop the dev server first.

## Deploying

The site is fully static (`○ prerendered as static content`), so any host will
serve it. Vercel is the least friction for Next.js.

**1. Create an empty repo on GitHub** (no README, no .gitignore, no licence).

**2. Push:**

```bash
git remote add origin https://github.com/isah15631/dormant-heart.git
```

```bash
git push -u origin main
```

The first push opens a browser window to authenticate.

**3. Deploy on Vercel:** sign in at vercel.com with GitHub, *Add New → Project*,
import the repo. Every setting is detected automatically; no environment
variables are needed. Later pushes to `main` redeploy on their own.

Netlify and Cloudflare Pages work too. Build command `npm run build`, and both
need their Next.js adapter.

## Structure

```
app/
  layout.tsx          Root layout, fonts, viewport
  page.tsx            Entry, loads the experience client-side
  globals.css         Tailwind and base styles
components/experience/
  Experience.tsx      Orchestrates the eight stages
  Heart.tsx           The heart: GLSL cracks, colour, chunked shatter
  HeartScene.tsx      R3F canvas, responsive camera fit
  StoneMotes.tsx      Stage four, stone falling away
  Butterflies.tsx     The eruption, sprites on one 2D canvas
  Butterfly.tsx       A single SVG butterfly (used for the two carriers)
  WelcomeSequence.tsx hello. carried in on threads by two butterflies
  LightBulb.tsx       The pull-switch over the menu
  Sections.tsx        About · Projects · Experiments · Contact
lib/
  content.ts          ALL COPY LIVES HERE
  heartGeometry.ts    Heart mesh, grouped into slabs for the shatter
  stages.ts           The five-tap progression
  audio.ts            Howler wiring
scripts/
  generate-audio.mjs  Synthesises the soundscape into public/audio
legacy/               The previous Vite portfolio and its assets, for reference
```

## Editing content

Everything a visitor reads is in [`lib/content.ts`](lib/content.ts). House
style: **no em dashes**.

## Regenerating the sound

```bash
node scripts/generate-audio.mjs
```

Every sound is synthesised, nothing is downloaded.

## Known gaps

- The Sprimart write-up is the only invented copy left.
- The contact form is front-end only. It sets a thank-you state and sends
  nothing. Wire it to Formspree, Resend or a route handler before relying on it.
- Nobody has yet confirmed how the audio actually sounds.
