import type { GirlId } from "./dialogue";
import type { LoreBible, LoreEntry, LoreTag, Packet, Sky, VerdictOut } from "./types";

/* ------------------------------------------------------------------ */
/*  Validation for everything the model returns.                       */
/*  Server validates before sending, client validates again on arrival */
/*  — so a mangled or hostile response can never break the scene.      */
/* ------------------------------------------------------------------ */

const GIRDS: GirlId[] = ["anya", "mila", "kira"];
const TAGS: LoreTag[] = [
  "school",
  "home",
  "street",
  "sibling",
  "childhood",
  "competition",
  "friendship",
  "family",
  "romance",
  "future",
];

const clean = (s: unknown, max: number): string =>
  typeof s === "string" ? s.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/* ---------------------------- LORE ------------------------------- */

function asEntries(raw: unknown, who: GirlId | "shared", limit: number): LoreEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: LoreEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (out.length >= limit) break;
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const text = clean(rec.text, 320);
    if (text.length < 24) continue;
    const id = slug(clean(rec.id, 60)) || `e${out.length}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const tags = Array.isArray(rec.tags)
      ? (rec.tags.filter((t) => typeof t === "string").map((t) => (t as string).toLowerCase()) as string[])
          .filter((t): t is LoreTag => (TAGS as string[]).includes(t))
          .slice(0, 3)
      : [];
    out.push({ id, who, tags: tags.length ? tags : ["school"], text });
  }
  return out;
}

export function sanitizeLore(raw: unknown): LoreBible | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const tonight = clean(rec.tonight, 300);
  const entries = [
    ...asEntries(rec.shared, "shared", 6),
    ...asEntries(rec.anya, "anya", 8),
    ...asEntries(rec.mila, "mila", 8),
    ...asEntries(rec.kira, "kira", 8),
  ];
  if (entries.length < 6 || !tonight) return null;
  return { v: 1, createdAt: Date.now(), tonight, entries };
}

/* --------------------------- PACKET ------------------------------ */

export function sanitizePacket(raw: unknown): Packet | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const topic = clean(rec.topic, 120);
  const loreIds = Array.isArray(rec.loreIds)
    ? rec.loreIds.filter((x): x is string => typeof x === "string").map((x) => slug(x)).slice(0, 4)
    : [];

  const lines: { who: GirlId; text: string }[] = [];
  if (Array.isArray(rec.lines)) {
    for (const item of rec.lines) {
      if (lines.length >= 12) break;
      if (!item || typeof item !== "object") continue;
      const l = item as Record<string, unknown>;
      const who = typeof l.who === "string" ? (l.who as string).toLowerCase().trim() : "";
      const text = clean(l.text, 240);
      if (!(GIRDS as string[]).includes(who) || text.length < 2) continue;
      lines.push({ who: who as GirlId, text });
    }
  }
  if (lines.length < 4) return null;

  const choices = Array.isArray(rec.choices)
    ? rec.choices
        .filter((c): c is string => typeof c === "string")
        .map((c) => clean(c, 60))
        .filter((c) => c.length >= 3)
        .slice(0, 3)
    : [];

  return {
    id: `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    topic: topic || "tonight",
    lines,
    choices,
    loreIds,
  };
}

/* --------------------------- VERDICT ----------------------------- */

export function sanitizeVerdict(raw: unknown): VerdictOut | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const title = clean(rec.title, 70).replace(/["“”*✦☆★]/g, "").trim();
  const text = clean(rec.text, 700);
  if (!title || text.length < 80) return null;
  return { title, text };
}

/* ---------------------------- SKY -------------------------------- */

export function sanitizeSky(raw: unknown): Sky {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    dateLabel: clean(r.dateLabel, 40) || "tonight",
    weekday: clean(r.weekday, 20) || "tonight",
    sunSign: clean(r.sunSign, 20) || "virgo",
    moonSign: clean(r.moonSign, 20) || "pisces",
    moonPhase: clean(r.moonPhase, 30) || "waning crescent",
    moonIllum: typeof r.moonIllum === "number" ? Math.max(0, Math.min(100, Math.round(r.moonIllum))) : 40,
  };
}
