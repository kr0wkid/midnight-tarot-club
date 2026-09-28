import { generate } from "./llm";
import { clearLore, loadLore, saveLore } from "./lore";
import { getSky } from "./astro";
import { sanitizeLore, sanitizePacket, sanitizeVerdict } from "./validate";
import { POSITIONS, type DrawnCard, type TopicId } from "./tarot";
import type { CardBrief, GenRequest, LoreBible, Packet, VerdictOut } from "./types";

/* ------------------------------------------------------------------ */
/*  Director — decides what gets written tonight.                      */
/*  All calls are guarded: no duplicate in-flight requests, and every  */
/*  failure quietly returns null so the scene keeps running.           */
/* ------------------------------------------------------------------ */

const TOPIC_LABEL: Record<TopicId, string> = {
  love: "someone i like",
  future: "what's next for me",
  vibes: "just read me",
};

/** last few topics so they don't reopen the same conversation twice */
const recentTopics: string[] = [];
export const recentReplies: string[] = [];

let loreInFlight: Promise<LoreBible | null> | null = null;
let packetInFlight: Promise<Packet | null> | null = null;

/** the bible: cached for 24h, fetched on first boot of the day */
export function ensureLore(): Promise<LoreBible | null> {
  // `?newnight` wipes today's history — handy when you want to see them start over
  if (typeof window !== "undefined" && window.location.search.includes("newnight")) clearLore();

  const cached = loadLore();
  if (cached) return Promise.resolve(cached);
  if (loreInFlight) return loreInFlight;

  loreInFlight = (async () => {
    try {
      const req: GenRequest = { action: "lore", sky: getSky() };
      const data = await generate<unknown>(req, 23000); // server budgets 18s for this one
      const bible = data ? sanitizeLore(data) : null;
      if (bible) saveLore(bible);
      return bible;
    } finally {
      loreInFlight = null;
    }
  })();
  return loreInFlight;
}

/** one generated exchange, drawn from the bible */
export function nextPacket(opts: { reply?: string } = {}): Promise<Packet | null> {
  if (packetInFlight) return packetInFlight;

  packetInFlight = (async () => {
    try {
      const lore = loadLore();
      const sky = getSky();
      const req: GenRequest = {
        action: "packet",
        sky,
        lore,
        recent: recentTopics.slice(-5),
        ...(opts.reply ? { reply: opts.reply.slice(0, 200) } : {}),
      };
      const data = await generate<unknown>(req, 25000);
      const packet = data ? sanitizePacket(data) : null;
      if (packet) {
        recentTopics.push(packet.topic);
        if (recentTopics.length > 12) recentTopics.shift();
      }
      return packet;
    } finally {
      packetInFlight = null;
    }
  })();
  return packetInFlight;
}

export function buildCardBriefs(picked: DrawnCard[]): CardBrief[] {
  return picked.map((p, i) => ({
    position: POSITIONS[i]?.label ?? `card ${i + 1}`,
    name: p.card.name,
    orientation: p.reversed ? "reversed" : "upright",
    meaning: p.reversed ? p.card.rev : p.card.up,
    element: p.card.element,
    arcana: p.card.arcana,
  }));
}

/** the synthesis of all three cards, in Jetta's voice */
export async function getVerdict(
  picked: DrawnCard[],
  topic: TopicId | null
): Promise<VerdictOut | null> {
  try {
    const req: GenRequest = {
      action: "verdict",
      sky: getSky(),
      cards: buildCardBriefs(picked),
      topic: topic ? TOPIC_LABEL[topic] : null,
    };
    const data = await generate<unknown>(req, 25000);
    return data ? sanitizeVerdict(data) : null;
  } catch {
    return null;
  }
}

/** start of a session: make sure they have history, then a topic to open with */
export async function warmSession(): Promise<void> {
  await ensureLore();
}

export function noteReply(reply: string) {
  recentReplies.push(reply);
  if (recentReplies.length > 6) recentReplies.shift();
}
