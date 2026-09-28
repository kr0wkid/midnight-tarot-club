import type { LoreBible } from "./types";

/* ------------------------------------------------------------------ */
/*  The bible persists for 24h: their history survives refreshes, and  */
/*  a day later they've had new things happen to them.                 */
/* ------------------------------------------------------------------ */

const KEY = "mtc.lore.v2";
export const LORE_TTL = 24 * 60 * 60 * 1000;

export function loadLore(): LoreBible | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LoreBible;
    if (!parsed || typeof parsed.createdAt !== "number" || !Array.isArray(parsed.entries)) return null;
    if (Date.now() - parsed.createdAt > LORE_TTL) return null;
    if (parsed.entries.length < 6) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLore(bible: LoreBible) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bible));
  } catch {
    /* private mode — they get fresh lore every visit, no harm done */
  }
}

export function clearLore() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
