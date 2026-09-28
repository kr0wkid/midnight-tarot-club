# ★ midnight tarot club ★

three girls, one streetlight, 02:06 am. a little PS1-flavoured 3D night scene where anya,
mila and kira hang out under a sodium lamp outside a boarded-up garage and talk about
astrology, wicca, tarot and each other — until you walk over and ask for a reading.

built with **react · three.js · @react-three/fiber · tailwind · zustand**, shipped as a
single self-contained `index.html`.

## playing

```bash
npm install
npm run dev
```

scroll to arrive, hold the mouse and drag to look around, click a girl or press **E** to join
them, **M** to mute.

## the AI layer

the scene runs entirely on a handwritten script in `src/game/dialogue.ts`. Gemini only ever
*adds* to it, and the game never waits on it:

- **lore bible** — on first boot of the day they each get a written history (persisted 24h),
  and everything they say afterwards is built on it.
- **scene packets** — on refresh and a few times mid-session, one of them picks a subject and
  the three of them argue about it. about a third of the time it ends with buttons for you.
- **final verdict** — when the third card lands, anya synthesises all three cards live.

no key in the browser, no typing, no waiting: the key lives in `api/generate.ts` (a Vercel
function), every response is validated twice, and if the endpoint is down you get a toast and
the original game, untouched.

`src/game/astro.ts` computes the real sun sign, moon sign and moon phase locally, so
"the moon's in scorpio tonight" is true on whatever day you load it.

full setup — including how to get a key and deploy — is in **[README-AI.md](./README-AI.md)**.

## structure

```
api/generate.ts     the only place the Gemini key exists: rate limit → prompt → model → validate
src/game/           scene, characters, tarot deck, audio, and the ai layer (see README-AI.md)
src/components/     HUD, dialogue box, tarot reading UI
```

## licence

the writing and the art are yours; do what you like with it.
