# THE DORMANT HEART

> The single source of truth for this build. If a feature does not contribute to
> **simplicity, beauty, or meaning — remove it.** Less is more.

---

## DESIGN PHILOSOPHY

Prioritise, in order:

- Simplicity over complexity
- Elegance over luxury
- Emotion over spectacle
- Minimalism over excessive animation

The user should feel **curious, calm, and contemplative** throughout.

### Never
- Flashy UI elements
- Excessive text
- Unnecessary particle effects
- Loud sounds or excessive transitions
- Gamer-like or futuristic aesthetics

### Always
The whole experience should feel **premium, minimal, cinematic, and artistic.**

### Emotional arc
`Curious → Wonder → Transformation → Warmth → Welcome → Discovery`

It must **never** feel like: a corporate portfolio · a futuristic dashboard · a
game · a technology showcase.

It **should** feel like: *a quiet cinematic story about bringing life, colour, and
beauty into the world before introducing the person who creates it.*

The goal: leave visitors smiling after they whisper — **"That was beautiful."**

---

## TECH STACK (mandated)

- **Next.js** + **TypeScript**
- **Framer Motion** (UI / text transitions)
- **GSAP** (timeline / sequence orchestration)
- **Three.js** — **ONLY for the heart** (via React Three Fiber)
- **React Three Fiber**
- **TailwindCSS**
- **Howler.js** (all sound)

> Three.js is scoped strictly to the heart render. Everything else (text,
> butterflies, sections) uses DOM / Framer Motion / GSAP unless a later decision
> explicitly revisits this.

---

## THE INTRO EXPERIENCE (Stages 1–8)

The intro is a **five-tap** sequence on the heart, then a silent welcome, then Explore.

### Stage 1 — The Dormant Heart (initial canvas)
- Completely **black** background.
- No navigation, no buttons, no music, no ambient sound.
- One word only, on screen.
- Centre: a **highly realistic anatomical human heart**, **stone-like**,
  **100% grayscale/desaturated**, **no pulse, no glow, no movement**.
- Beneath the heart, the word:

  > `tap.`

  - lowercase · elegant **serif** · small & subtle · **fades in slowly**
- The user must tap **directly on the heart**.

### Stage 2 — First Awakening (1st tap)
- Trigger: subtle **stone-cracking** sound + a **very soft heartbeat** begins.
- A small **crack** appears across the heart.
- A faint **warm glow** visible inside the crack.
- ~**20%** of the heart regains colour.
- Heartbeat begins **slowly**.
- **No text.** The user should just understand something inside is alive.

### Stage 3 — The Light Returns (2nd tap)
- Another crack forms **naturally**.
- Heartbeat becomes **slightly stronger**.
- More colour returns.
- Light begins **escaping** from within.
- The stone exterior slowly weakens.
- **No** explanatory text, **no** buttons, **no** percentages shown to user. Stay subtle.

### Stage 4 — Vitality (3rd tap)
- Heart begins **gently pulsing**.
- **Warm light** fills its interior.
- Small **particles of stone** slowly fall away.
- Surrounding darkness begins reacting **softly** to the heartbeat.
- Background stays **mostly black**.
- **No** background effects, **no** floating UI elements.

### Stage 5 — Metamorphosis (4th tap)
- Heart is **almost fully alive**.
- Warm light becomes **beautiful and vibrant**.
- Surrounding darkness now feels **warm** rather than empty.
- User should feel **something significant is about to happen**.
- Still: **no text, no buttons.** Anticipation carries it.

### Stage 6 — The Butterfly Eruption (5th tap)
- The heart **completely shatters**.
- Stone pieces gently fly **outward**.
- **Hundreds of butterflies** emerge **naturally** — organic, graceful, **not chaotic**.
- Butterfly colours may include: **Crimson · Gold · Emerald · Cyan · White · Purple**.
- Butterflies **fly across the screen**, **carry colour back into the world**,
  and **slowly illuminate the darkness**.
- The black canvas **gradually transforms into a warm, beautiful environment**.
- **Music:** a soft **orchestral swell** + **gentle chimes**. Nothing loud/dramatic.
- **No** counters, **no** butterfly count mentioned, **no** physics controls.
- This is **not** a butterfly simulator — it is a **cinematic moment**. Magical, not spectacular.

### Stage 7 — Silence
- After the butterflies leave: display **nothing** for **~3 seconds**
  (no text, no music, no movement). Let the user sit with it.
- Then slowly **fade in**, in sequence:

  1. `hello.`  → wait ~2s
  2. `welcome.`  → wait ~2s
  3. `I'm Isah Sulaiman.`  → wait ~3s
  4. `I build beautiful things.`

- All text: lowercase where appropriate · **fade in slowly** · elegant & minimal.
- **No** job titles, skill percentages, or achievements. This is **introduction, not self-promotion.**

  **The carried greeting:** `hello.` does not simply fade in — **two butterflies
  return and drag the word upward** into view, as though it has weight. They
  hold it a moment once it settles, then quietly let go and fly away in
  opposite directions. Only these two appear. They symbolise that though the
  transformation has ended, **beauty remains**.

  > Supersedes the original brief's "a single butterfly lands beside `hello.`
  > — only one butterfly." Changed at Isah's request.

### Stage 8 — Explore
- Display a single button:

  > `Explore →`

- Nothing else appears.
- Selecting Explore reveals four sections: **About · Projects · Experiments · Contact**.
- **Do not** auto-open any section. No unnecessary/flashy animations or transitions.

---

## SECTIONS

### About
- Professional photograph
- Short biography (concise)
- Current role & expertise
- Personal philosophy
- Social links

### Projects
- Featured projects
- Live demonstrations
- Technology stacks
- Architecture overviews
- Development notes
- **Prioritise storytelling over technical buzzwords.**

### Experiments
- Creative experiments
- Interactive ideas
- Small technical explorations
- Artistic software projects
- **The most playful section of the site.**

### Contact
- Email
- Social platforms
- Collaboration enquiries
- Future project discussions
- Keep the form **minimal and beautiful**.

---

## GLOBAL GUARDRAILS (apply everywhere)

- No text beyond what each stage specifies.
- No percentages, counters, or numbers surfaced to the user.
- No flashy transitions, no gratuitous particles, no futuristic/gamer styling.
- Sound is soft and sparse; nothing loud.
- When in doubt, **remove** it.

---

## KNOWN CONTEXT (not requirements — notes for the build)

- The repo currently contains an unrelated **React + Vite (plain JSX)** portfolio
  and a `legacy/` static version. Both predate this brief and will be replaced /
  set aside when the new Next.js app is built.
- Existing photo assets in `public/assets/` (e.g. `isah_sulaiman_new.png`) may be
  reused for the **About** photograph.
- Content details (bio text, real project list, social URLs, contact endpoint)
  are **TBD** and to be supplied by Isah.

---

*Above all else: Less is more.*
