# THE DORMANT BUD

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
- **Three.js** — **ONLY for the bud** (via React Three Fiber)
- **React Three Fiber**
- **TailwindCSS**
- **Howler.js** (all sound)

> Three.js is scoped strictly to the bud render. Everything else (text,
> butterflies, sections) uses DOM / Framer Motion / GSAP unless a later decision
> explicitly revisits this.

---

## THE INTRO EXPERIENCE (Stages 1–4)

The intro is **one uninterrupted event that plays itself**: a sphere falls out
of the dark, breaks on a concrete floor, and the butterflies come out of it.
Then a silent welcome, then Explore.

**The visitor does nothing.** There is no tap, no click, no prompt, and no word
of instruction anywhere in the intro. Gravity does what five taps used to do.

### Stage 1 — The Fall
- Completely **black** background. No floor, no horizon, no navigation, no
  buttons, no music, no ambient sound. **No text of any kind** — the word
  `tap.` is gone, along with the thing it was asking for.
- After a held beat of pure black, a **glass sphere** falls into frame from
  above and drops out of shot's reach toward the bottom of the frame.
- It is **dead**: grey, cold, opaque, turning slowly. **No glow, no pulse, and
  nothing visible inside it.** Everything it has to give arrives in the same
  instant it lands.
- The fall is **slower than real gravity**, by roughly four times. This is not
  a cheat, it is what a camera does — at real speed anything dropped from far
  enough away to read as "out of the sky" crosses the visible frame in two or
  three frames and there is nothing to watch before the bang. It is in view,
  falling, for about a second.

### Stage 2 — The Landing
- The sphere hits **concrete** and breaks. There is no bounce, no wobble, and
  no anticipation — it is travelling fastest at the moment it lands.
- **The floor only exists for the length of the impact.** It is unlit before
  and after, and draws literally nothing, so the frame is pure black. What the
  landing lights is a **warm pool** centred on the point of contact, falling
  away with distance and decaying back to black over about two seconds, plus a
  **ring of dust** running outward across it.
- You never see the room. You see **the instant the room was lit** — and that
  is the only sense of place in the whole piece.
- The concrete must read as concrete: broad blotches for the pour, fine grain,
  and a sparse scatter of much brighter **specks of aggregate**. A smooth grey
  reads as fog; it is the glinting stone in it that reads as a floor.

### Stage 3 — The Butterfly Eruption
- The sphere breaks into a couple of hundred **irregular polygonal plates** —
  what glass actually does. Never a regular subdivision, which reads as a
  football coming apart.
- Every piece is thrown **from the point that hit the floor**, not from the
  sphere's centre. A burst from the middle reads as something detonating in
  mid-air; a burst from the contact point reads as something landing. Nothing
  is thrown downward: the floor is there.
- The pieces **tumble fast**. Unlike everything that came before it, this was
  not released — it was hit.
- **Hundreds of butterflies** emerge **naturally** — organic, graceful, **not chaotic**.
- Butterfly colours may include: **Crimson · Gold · Emerald · Cyan · White · Purple**.
- Butterflies **fly across the screen**, **carry colour back into the world**,
  and **slowly illuminate the darkness**.
- The black canvas **gradually transforms into a warm, beautiful environment**.
- **Music:** the **breaking glass**, then a soft **orchestral swell**. Nothing
  loud/dramatic, and **nothing else on top**.

  > Supersedes the original brief's "orchestral swell + gentle chimes". The
  > chime was a bell pair that landed like a game pickup over the shatter.
  > Removed at Isah's request; the break and the swell carry the moment.
- **No** counters, **no** butterfly count mentioned, **no** physics controls.
- This is **not** a butterfly simulator — it is a **cinematic moment**. Magical, not spectacular.
- The camera sits **a little above the floor and looks slightly down it**. Any
  lower and the concrete is edge-on and invisible; any higher and it stops
  being a floor and becomes a table being looked down at.
- The frame is fitted to hold the fall and a good stretch of floor below the
  impact, and to keep the sphere itself clear of the edges — but **not** every
  shard. On a portrait phone the widest pieces leave the frame, which is fine:
  a moment later they are butterflies, and they were leaving anyway.

### Stage 4 — Silence
- After the butterflies leave: display **nothing** for **~3 seconds**
  (no text, no music, no movement). Let the user sit with it.
- Then slowly **fade in**, in sequence:

  1. `hello.`  → wait ~2s
  2. `welcome.`  → wait ~2s
  3. `I'm Isah Sulaiman.`  → wait ~3s
  4. `I build cool things.`

- All text: lowercase where appropriate · **fade in slowly** · elegant & minimal.
- **No** job titles, skill percentages, or achievements. This is **introduction, not self-promotion.**

  **The carried greeting:** `hello.` does not simply fade in — **two butterflies
  return and drag the word upward** into view, as though it has weight. They
  hold it a moment once it settles, then quietly let go and fly away in
  opposite directions. Only these two appear. They symbolise that though the
  transformation has ended, **beauty remains**.

  > Supersedes the original brief's "a single butterfly lands beside `hello.`
  > — only one butterfly." Changed at Isah's request.

### Stage 5 — Explore
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

### Hobbies
- Seven of them: **Reading · Writing · Football · System Design · Self
  Reflection · Movies · Anime**.
- **A hobby is an object before it is a list.** Each one hangs in the dark on a
  pair of **feathered wings** and is lent one of the swarm's colours: the
  butterflies that carried colour into the world are the things he does with
  his time.
- The wings are **feathered, not the butterfly's**, and that is a different
  drawing problem. A butterfly wing is one membrane, so a silhouette with a
  colour in it is the whole truth of it. A bird's wing is a stack of separate
  blades on a curved spar, and what reads as one is **the edges between the
  feathers**. So the geometry is generated rather than drawn: a spar, sampled,
  with a blade hung off the normal at each step, raked back and lengthening
  toward the tip. Two rules matter. Each blade is about **twice as wide as the
  gap between roots**, so they overlap into one mass instead of standing apart
  like a comb. And the sheet behind them stops **short of the tips**, so each
  tip protrudes and the trailing edge is scalloped; run it out flush and it
  joins the tips with a straight line that irons the whole edge flat.
- They **beat rather than flutter**. A butterfly's flap folds to 0.42 of its
  width, which on a wing this size reads as the feathers collapsing shut, so
  these get a much shallower fold plus a little rotation about the shoulder.
- **Depth comes from overlap, not from gradients.** Three things do the work,
  and none of them is shading:
  - **Two rows of feathers.** A second, shorter, darker row of coverts lies
    over the roots of the primaries. One row of blades, however well shaded,
    is a sheet: it has an outline and a fill and nothing behind it. Two rows
    have an overlap, and an overlap has a near thing, a far thing and a shadow
    between them.
  - **One sheen across all the feathers**, parallel to the spar. Shade each
    feather on its own and the wing stays a collection of objects; run a single
    unbroken highlight over all of them and the eye infers a continuous form
    underneath, because only a continuous form could catch light that way.
  - **The object shadows the wings behind it.** Nothing says "in front of"
    like something else being darker because of it.
- Objects get their three faces at **three distinct values**, set by where each
  one points rather than by taste: the face pointing at the bulb is brightest,
  the face turned toward the light is next, and the face turned toward the
  viewer is darkest. Gradients within a face are the refinement; the value
  difference between faces is what makes it solid.
- Where a shape is repeated around a centre (petals), the gradient must be in
  the **object's** space, not each shape's. A per-shape gradient rotates with
  the shape, so every petal is lit from its own private direction and the
  flower comes out perfectly even and perfectly flat.
- **Nothing is named.** No caption, no label, no title anywhere on the shelf.
  Working out what you are holding is the point of picking it up, and the name
  arrives only when the scroll unrolls. The hobby's name lives solely in the
  button's accessible label, which a screen reader needs and a visitor does
  not get.
- The objects are **rendered objects, not pictograms**, and the difference is
  not detail, it is light. Every one is lit from above and slightly left, by
  the same bulb hanging in this room, and built the same way: a silhouette,
  the planes that catch the light, the shadow where one plane tucks under
  another, then one specular edge. A flat stroked outline says "book"; a board
  overhanging its own block of leaves, with the head showing along the top and
  the spine turning away, IS a book. Reading is a **closed** hardback, writing
  a fountain pen, football a shaded leather ball, system design three stacked
  isometric planes, self reflection a hand mirror, movies a reel with the film
  running off it, anime a cherry blossom.
- Materials are real and mostly neutral (paper, leather, brass), so the object
  reads as a thing rather than an icon. The lent colour goes to the **wings**,
  and to exactly **one accent** on each object where an object would naturally
  have one: the book's ribbon, the ink at the pen's nib, the glass in the
  mirror.
- Selecting one **transforms it**. The object flies to the middle of the screen
  and a **scroll unrolls out of it**, with the object resting at its head. The
  unroll is an animation on height, never a scaleY: scaling stretches the
  writing along with the paper, and a scroll's whole trick is that the words
  were always that size and were simply rolled up out of sight.
- The contents are **a short line and then labelled lists**, ruled one entry
  per line like a page. Not pill tags, which are the house style everywhere
  else and would look like tags on parchment.
- **The most playful section of the site.**

  > Supersedes the original brief's "Experiments: creative experiments,
  > interactive ideas, small technical explorations". Replaced wholesale at
  > Isah's request.

### Contact
- Email
- Social platforms
- Collaboration enquiries
- Future project discussions
- **No form.** The address itself is the invitation: a large `mailto:` link, a
  quiet "copy address" beside it, and the social links. Nothing to submit.

  > Supersedes the original brief's "keep the form minimal and beautiful".
  > Changed at Isah's request — a form that posts nowhere is worse than an
  > honest address, and this keeps the site dependency-free and hostable
  > anywhere.

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

> **Material change.** The object was originally specified as stone. It is
> glass, changed at Isah's request once he supplied real glass-cracking and
> shattering recordings. A fracture in glass catches light and reads bright,
> where a fissure in stone read dark, which inverts how the cracks are shaded.

> **Subject change.** It was a heart, then a closed flower bud, then a plain
> glass sphere. The rule that survived all three, and governs anything that
> replaces this one: **whatever sits here must be something the visitor cannot
> decode until it breaks.** A heart announces its own meaning on sight, so the
> arc skipped straight past *curious*, and then it glowed warm and released
> butterflies, saying the same thing three times over. A chrysalis fails the
> same test for the same reason — it gives the ending away in the first frame.
> A sphere says nothing at all, which is the point.

> **Interaction change.** The intro was a five-tap sequence on the object,
> through five staged awakenings. It is now a single event that plays itself,
> changed at Isah's request. Everything the taps used to buy — the cracking,
> the warmth arriving, the sense of something inside — now arrives at once, at
> the moment of impact, and the fall buys the anticipation the taps used to.
>
> **What this costs, and it is not nothing:** browsers will not let a page make
> a sound until the visitor has done something, and this piece never asks them
> to. On a cold load the landing may well be silent. The code tries to unlock
> audio on load and again on the first gesture of any kind, but the only
> guaranteed fix is a "click to begin" gate, which is exactly the interaction
> that was removed on purpose. **Open question, flagged rather than solved.**

*Above all else: Less is more.*
