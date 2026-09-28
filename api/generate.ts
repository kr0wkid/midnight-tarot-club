import {
  CANON,
  examplesBlock,
  JSON_RULE,
  SETTING,
  STYLE_RULES,
  VOICE_CARDS,
} from "../src/game/voices.js";
import {
  sanitizeLore,
  sanitizePacket,
  sanitizeSky,
  sanitizeVerdict,
} from "../src/game/validate.js";
import type { CardBrief, GenRequest, LoreBible, Packet, VerdictOut } from "../src/game/types";

/* ------------------------------------------------------------------ */
/*  /api/generate — the only place the Gemini key exists.              */
/*  The browser posts a small structured payload; the prompt is built  */
/*  here, the model's JSON is validated here, and nothing else gets    */
/*  through. Per-IP rate limiting keeps a public deploy from draining. */
/* ------------------------------------------------------------------ */

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface Res {
  status(code: number): Res;
  setHeader(key: string, value: string): void;
  json(body: unknown): void;
}

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/* ------------------------- rate limiting ------------------------- */
const CAPACITY = 12;
const REFILL_MS = 25_000;
const buckets = new Map<string, { tokens: number; ts: number }>();

function allow(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: CAPACITY, ts: now };
  b.tokens = Math.min(CAPACITY, b.tokens + (now - b.ts) / REFILL_MS);
  b.ts = now;
  if (buckets.size > 5000) buckets.clear();
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return true;
}

const clientIp = (req: Req): string => {
  const fwd = req.headers["x-forwarded-for"];
  const one = (Array.isArray(fwd) ? fwd[0] : fwd) ?? req.headers["x-real-ip"] ?? "local";
  const first = Array.isArray(one) ? one[0] : one;
  return String(first).split(",")[0].trim().slice(0, 60);
};

/* --------------------------- prompts ----------------------------- */

const SKY_LINE = (sky: ReturnType<typeof sanitizeSky>) =>
  `tonight is ${sky.weekday}, ${sky.dateLabel}. the sun is in ${sky.sunSign}. the moon is ${sky.moonPhase} and in ${sky.moonSign}, ${sky.moonIllum}% lit.`;

function lorePrompt(sky: ReturnType<typeof sanitizeSky>): string {
  return `Write tonight's lore bible for the scene.

${SKY_LINE(sky)}

THE CHARACTERS
${VOICE_CARDS.jetta}

${VOICE_CARDS.emi}

${VOICE_CARDS.cole}

CANON — established already, never contradict any of it:
${CANON.map((c) => `- ${c}`).join("\n")}

WRITE:
- "shared": 4-6 entries about the group together — how they met, where the hideout came from, an in-joke, a rule they hold each other to.
- "jetta", "emi", "cole": 6-7 entries each, drawn from her actual life: things happening at school, at home, on the street, with siblings, from childhood, a competition or audition or tryout, friendships, a part-time job, a crush, something she's hiding. entries must fit her voice card above.
- at least one entry per girl is unresolved — still in motion as of tonight.
- be concrete and specific, the way real teenage girls gossip: names, places, small humiliations, small wins. not archetypes, not a character sheet.
- text is 30-70 words, written in the lowercase, wry register of the show.
- tags chosen from: school, home, street, sibling, childhood, competition, friendship, family, romance, future.
- ids are short kebab-case and unique across the whole bible.
- "tonight": one sentence (15-30 words) about what specifically hangs over tonight for all three of them.

${JSON_RULE}
shape: {"tonight":"...","shared":[{"id":"...","tags":["school"],"text":"..."}],"jetta":[...],"emi":[...],"cole":[...]}`;
}

function packetPrompt(
  sky: ReturnType<typeof sanitizeSky>,
  lore: LoreBible | null,
  reply: string | null,
  recent: string[]
): string {
  const bible = lore
    ? `THE LORE BIBLE (their history — lean on 1 or 2 entries, don't dump them)
tonight: ${lore.tonight}
${lore.entries.map((e) => `- [${e.id}] ${e.who}: ${e.text}`).join("\n")}`
    : "no lore bible available — invent a small concrete detail about one of their lives instead.";

  const replyBlock = reply
    ? `THE PLAYER JUST TAPPED THIS REPLY: "${reply}"
The first 1 or 2 lines must react to it directly, then the conversation moves on. One of them should be pleased, unconcerned or irritated by it — never simply agree.`
    : "";

  const recentBlock = recent.length ? `RECENT TOPICS — do not reopen these: ${recent.join(" | ")}` : "";

  return `Write one exchange from tonight's scene. It will be played one line at a time, typed out under the speaker's name.

${SKY_LINE(sky)}

${bible}

${replyBlock}

${recentBlock}

REQUIREMENTS
- 6 to 9 lines. every one of the three speaks at least once, and somebody says something to the player standing there ("you" / "you're").
- one of them raises a specific subject and the others push back on it. the subject belongs to the world of the show: astrology, wicca, tarot, numerology, dreams, omens, school, the street, boys, girls, each other. keep it concrete, not abstract.
- reference a lore entry naturally, the way people actually bring things up — sideways, as evidence, as a jab. never "as you know".
- disagreement is mandatory: they should argue about it, one of them should be wrong, one should win the exchange by being funnier rather than right.
- ends somewhere that invites a shrug or a beat, and about a third of the time ends with a question pointed at the player.

CHOICES — include "choices" (2-3 strings) about a third of the time, otherwise an empty array.
- the final line must land on the player: a look, a dare, a question they'd want to answer.
- each choice is what the player could say back: <=40 characters, lowercase, no emoji.
- make them genuinely different in tone — one warm, one deflecting, one challenging or dumb.

STYLE
${STYLE_RULES}

HANDWRITTEN EXAMPLES — match this rhythm:
${examplesBlock(4)}

${JSON_RULE}
shape: {"topic":"...","loreIds":["entry-id"],"lines":[{"who":"jetta","text":"..."}],"choices":[]}
who must be exactly one of: jetta, emi, cole.`;
}

function verdictPrompt(
  sky: ReturnType<typeof sanitizeSky>,
  cards: CardBrief[],
  topic: string | null
): string {
  const list = cards
    .map(
      (c) =>
        `- ${c.position}: ${c.name} (${c.orientation}, ${c.element}, ${c.arcana}) — jetta's written meaning: "${c.meaning}"`
    )
    .join("\n");

  return `Jetta has just laid three cards in front of the player. Emi and Cole are watching. Write her final synthesis of the spread.

${SKY_LINE(sky)}

THE PLAYER CAME WITH: ${topic ? `"${topic}"` : "no question — they just asked to be read"}

THE THREE CARDS
${list}

JETTA
${VOICE_CARDS.jetta}

${STYLE_RULES}

RULES
- title: 2-5 lowercase words, plain text, no symbols, no quotes, no star characters.
- text: 45-95 words. one continuous paragraph in Jetta's voice.
- weave ALL THREE cards AND their positions (past / present / destiny) into one reading — not three separate mini-readings.
- a reversed card reads as the meaning turned inward or blocked; say that without being grim.
- answer the player's actual question if there was one.
- reflection, not fate: she reads what's there and hands them the choice. no medical, legal or financial predictions, no death, no curses on other people.
- end with something that sounds like her — dry, a little warm, never saccharine.

${JSON_RULE}
shape: {"title":"...","text":"..."}`;
}

/* -------------------------- gemini call -------------------------- */

function extractJson(text: string): unknown {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const s = stripped.indexOf("{");
    const e = stripped.lastIndexOf("}");
    if (s >= 0 && e > s) {
      try {
        return JSON.parse(stripped.slice(s, e + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/* Google's flash tiers answer 503 "high demand" often, and taking them
   one at a time loses the game its window — so the models are raced
   in parallel and the first usable answer wins. Losers get aborted; if
   the whole field drops, json mode is dropped and we go once more,
   always inside a budget the browser is still waiting for (23s for the
   bible, 25s for a packet or a verdict). */
const FALLBACKS = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3.1-flash-lite"];
const BUDGET_MS = 18_000;
/* the bible is ~1600 tokens of json — 2048 leaves no room for a
   verbose night, and a cut-off object fails validation outright */
const LORE_TOKENS = 3072;

async function callGemini(system: string, user: string, key: string, maxTokens = 2048): Promise<unknown | null> {
  const models = [MODEL, ...FALLBACKS.filter((m) => m !== MODEL)];
  const deadline = Date.now() + BUDGET_MS;
  const payload = (jsonMode: boolean) =>
    JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 1.05,
        maxOutputTokens: maxTokens,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    });

  for (const jsonMode of [true, false]) {
    const left = deadline - Date.now();
    if (left <= 0) break;

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), left);
    let badKey = false;
    let settled = false;

    try {
      const winner = await new Promise<unknown | null>((resolve) => {
        let outstanding = models.length;
        const finish = (value: unknown | null): void => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        for (const model of models) {
          const ask = async (): Promise<unknown | null> => {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
              {
                method: "POST",
                headers: { "content-type": "application/json", "x-goog-api-key": key },
                body: payload(jsonMode),
                signal: ctl.signal,
              },
            );
            if (res.status === 401 || res.status === 403) {
              badKey = true; // wrong key — no model or mode rescues this
              return null;
            }
            if (!res.ok) return null; // 404 / 429 / 5xx — this model's out
            const data = (await res.json()) as {
              candidates?: { content?: { parts?: { text?: string }[] } }[];
            };
            const parts = data?.candidates?.[0]?.content?.parts ?? [];
            const text = parts.map((p) => p.text ?? "").join("");
            const json = text ? extractJson(text) : null;
            return json && typeof json === "object" ? json : null;
          };

          ask()
            .catch(() => null)
            .then((json) => {
              outstanding -= 1;
              if (json) finish(json);
              else if (outstanding === 0) finish(null);
            });
        }
      });

      if (winner) return winner;
      if (badKey) return null;
    } finally {
      clearTimeout(timer);
      ctl.abort(); // stop whatever is still generating
    }
  }
  return null;
}

/* --------------------------- handler ----------------------------- */

const SYSTEM = `You are the dialogue engine for "midnight tarot club", a nocturnal slice-of-life scene.

${SETTING}

${VOICE_CARDS.jetta}

${VOICE_CARDS.emi}

${VOICE_CARDS.cole}

${STYLE_RULES}

CANON:
${CANON.map((c) => `- ${c}`).join("\n")}`;

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader("content-type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method not allowed" });
    return;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(503).json({ ok: false, error: "GEMINI_API_KEY is not set on this deployment" });
    return;
  }
  if (!allow(clientIp(req))) {
    res.status(429).json({ ok: false, error: "slow down a little" });
    return;
  }

  const body = req.body as GenRequest | undefined;
  if (!body || typeof body !== "object" || typeof body.action !== "string") {
    res.status(400).json({ ok: false, error: "bad payload" });
    return;
  }
  if (JSON.stringify(body).length > 60_000) {
    res.status(413).json({ ok: false, error: "payload too large" });
    return;
  }

  let user: string | null = null;

  if (body.action === "lore") {
    user = lorePrompt(sanitizeSky(body.sky));
  } else if (body.action === "packet") {
    const lore = sanitizeLore(body.lore ?? null);
    const reply = typeof body.reply === "string" && body.reply ? body.reply.slice(0, 200) : null;
    const recent = Array.isArray(body.recent)
      ? body.recent.filter((r): r is string => typeof r === "string").slice(0, 6)
      : [];
    user = packetPrompt(sanitizeSky(body.sky), lore, reply, recent);
  } else if (body.action === "verdict") {
    const cards = Array.isArray(body.cards)
      ? body.cards.filter((c) => c && typeof c === "object").slice(0, 3)
      : [];
    if (cards.length !== 3) {
      res.status(400).json({ ok: false, error: "a reading needs three cards" });
      return;
    }
    const topic = typeof body.topic === "string" ? body.topic.slice(0, 60) : null;
    user = verdictPrompt(sanitizeSky(body.sky), cards, topic);
  } else {
    res.status(400).json({ ok: false, error: "unknown action" });
    return;
  }

  const raw = await callGemini(SYSTEM, user, key, body.action === "lore" ? LORE_TOKENS : undefined);
  if (!raw) {
    res.status(502).json({ ok: false, error: "the model returned nothing usable" });
    return;
  }

  let data: LoreBible | Packet | VerdictOut | null = null;
  if (body.action === "lore") data = sanitizeLore(raw);
  else if (body.action === "packet") data = sanitizePacket(raw);
  else data = sanitizeVerdict(raw);

  if (!data) {
    res.status(502).json({ ok: false, error: "the model returned something malformed" });
    return;
  }

  res.status(200).json({ ok: true, data });
}
