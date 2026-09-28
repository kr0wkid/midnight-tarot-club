# midnight tarot club — AI layer

Three girls, one streetlight, one API key. The scene runs entirely on the handwritten script;
Gemini only ever *adds* to it, and the game never waits on it.

## What the LLM actually does

| call | when | what it produces |
|---|---|---|
| `lore` | first boot of the day (cached 24h in `localStorage`) | a character bible: 4–6 shared entries, 6–7 each for jetta/emi/cole, plus `tonight` |
| `packet` | on refresh, then after a beat or two of scripted chatter mid-session | a 6–9 line exchange built from that bible, ending maybe a third of the time in choice buttons |
| `verdict` | when the third card is revealed | Jetta's synthesis of all three cards → `{title, text}` |

Everything else — greetings, readings' card text, reactions, ambient scenes — is the script in
`src/game/dialogue.ts`. If the wire goes down you get a toast and the original game, unchanged.

### Guarantees
- the Gemini key lives only in `api/generate.ts` (server env). The browser posts a small
  structured payload; the prompt is composed server-side.
- every model response passes `src/game/validate.ts` **twice** (server, then client). Malformed
  output → 502 → silent fallback.
- per-IP token bucket on the function (12 requests, refilling one every 25s).
- lore persists for 24h, then they've "had new things happen". Append `?newnight` to the URL to
  wipe it and start the girls over.

## Files

```
api/generate.ts        the function: rate limit → prompt → gemini → validate → json
src/game/astro.ts      sun sign / moon sign / moon phase, computed locally (Meeus)
src/game/voices.ts     voice cards, canon, style rules, sample scenes
src/game/validate.ts   schema validation for lore / packet / verdict
src/game/lore.ts       24h localStorage cache
src/game/llm.ts        fetch wrapper: timeouts, one retry, never throws
src/game/director.ts   decides what gets fetched, dedupes in-flight requests
src/game/store.ts      packet queue, choice buttons, verdict state
```

## Setup

**1. Get a key** — <https://aistudio.google.com/apikey> (free tier is plenty; a packet costs a
fraction of a cent).

**2. Local**

```bash
npm install
cp .env.example .env.local      # paste your key
npm install -g vercel           # if you don't have it
vercel dev                      # serves the app AND /api/generate
```

Plain `npm run dev` still works — it just runs the handwritten script, since there's no
`/api` function without Vercel.

**3. Deploy**

```bash
vercel                          # first deploy
vercel env add GEMINI_API_KEY   # production value
vercel --prod
```

The key is never present in `dist/` — check by searching the built `dist/index.html` for `AIza`.

## Tuning

- **Model:** set `GEMINI_MODEL` env var (default `gemini-3.8-flash`). Cheaper:
  `gemini-3.5-flash-lite`.
- **How often they bring up a new topic:** `scriptedSincePacket >= 6` in `store.ts` — handwritten
  lines between generated exchanges.
- **How long a question waits before they drop it:** `45_000` in `store.ts` (`armChoiceTimer`).
- **Choices frequency:** the `about a third of the time` instruction in `packetPrompt`.
- **Lore length / life:** `LORE_TTL` in `lore.ts`, entry limits in `validate.ts`.

## Safety rails (already in the prompts)

teenage characters, pg-13, reflection rather than fate, no medical/legal/financial predictions,
no real-person-directed spells or curses, occult material framed as playful superstition, and a
hard rule against the model ever acknowledging it's a model.
