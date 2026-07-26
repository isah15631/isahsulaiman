# Isah Sulaiman — Portfolio

A single-page portfolio with a black / bold-uppercase aesthetic (hero, project
carousel, featured grid, tech-stack chips, experience list, contact).

Built with **React + Vite** (plain JSX, no TypeScript).

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## Build for production

```bash
npm run build
```

Outputs a static site to `dist/` — host it anywhere (Netlify, Vercel, GitHub
Pages, Cloudflare Pages, any static host).

## Project structure

```
index.html              Vite entry (loads fonts + /src/main.jsx)
public/assets/          Images (hero photo, etc.) served at /assets/...
src/
  main.jsx              React root
  App.jsx               Page composition
  index.css             All styles (design system, sections, responsive)
  data.js               ← YOUR CONTENT lives here (projects, featured, stack, experience)
  hooks/useReveal.js    Scroll-reveal animation
  components/
    Header.jsx          Social icons · signature name · nav
    Hero.jsx            Full-bleed portrait on black
    Projects.jsx        Horizontal carousel (side arrows)
    Featured.jsx        Flagship grid
    Stack.jsx           Tech-stack chips
    Experience.jsx      Role/company rows
    Contact.jsx         Email form (demo)
    Footer.jsx          Signature · socials · copyright
legacy/                 The pre-React static version (index.html, styles.css, script.js) — kept for reference
```

## Make it yours

- **Content:** edit the arrays in [`src/data.js`](src/data.js) — `PROJECTS`,
  `FEATURED`, `STACK`, `EXPERIENCE`. Each project's `url` makes its card link out
  (a real URL shows a "Visit Live" button and opens in a new tab).
- **Name / socials:** the signature is in `Header.jsx` and `Footer.jsx`; social
  icon links (`href`) are the `SOCIALS` array in `Header.jsx`.
- **Hero photo:** replace `public/assets/isah-hero.png` (keep the same name, or
  update the `src` in `Hero.jsx`).
- **Colors:** the CSS variables at the top of `src/index.css` (`--accent`, `--bg`,
  `--tile`, etc.).
- **Contact form:** it's a front-end demo. Wire the `onSubmit` in `Contact.jsx`
  to a service like Formspree/Getform or your own backend.

The signature font (Dancing Script) loads from Google Fonts, declared in
`index.html`.
