# The Dormant Heart

A quiet cinematic portfolio experience by Isah Sulaiman.

The full creative brief and build contract lives in **[SPEC.md](SPEC.md)** — read it first.

## Stack

Next.js (App Router) · TypeScript · TailwindCSS · React Three Fiber / three.js
(the heart only) · Framer Motion · GSAP · Howler.js

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
npm start
```

## Structure

```
app/
  layout.tsx        Root layout · loads serif (Cormorant Garamond) + sans (Inter)
  page.tsx          Entry (currently the scaffold check)
  globals.css       Tailwind + base styles
components/
  ScaffoldCanvas.tsx  Placeholder R3F canvas — proves the pipeline; not the heart
public/assets/      Photos (portraits, etc.)
legacy/             The previous Vite/React portfolio + old static site (reference only)
SPEC.md             The creative brief — the source of truth
```

> Note: the `npm audit` warnings are advisories against `postcss`/`sharp`
> bundled inside Next.js itself (build-time only). The suggested `--force` fix
> downgrades Next to v9 and should not be run.
