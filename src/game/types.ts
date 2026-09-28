import type { GirlId, Line } from "./dialogue";

export type { Line };

/* ------------------------------------------------------------------ */
/*  SKY — computed locally so "the moon's in scorpio" is actually true  */
/* ------------------------------------------------------------------ */
export interface Sky {
  /** e.g. "28 sep 2026" */
  dateLabel: string;
  /** e.g. "monday" */
  weekday: string;
  /** "scorpio" */
  sunSign: string;
  /** "scorpio" */
  moonSign: string;
  /** "waxing gibbous" */
  moonPhase: string;
  /** 0–100 */
  moonIllum: number;
}

/* ------------------------------------------------------------------ */
/*  LORE — the girls' written history, generated once a day            */
/* ------------------------------------------------------------------ */
export type LoreTag =
  | "school"
  | "home"
  | "street"
  | "sibling"
  | "childhood"
  | "competition"
  | "friendship"
  | "family"
  | "romance"
  | "future";

export interface LoreEntry {
  id: string;
  who: GirlId | "shared";
  tags: LoreTag[];
  text: string;
}

export interface LoreBible {
  v: number;
  createdAt: number;
  /** the thread running through tonight (exam week, a party, a competition…) */
  tonight: string;
  entries: LoreEntry[];
}

/* ------------------------------------------------------------------ */
/*  PACKET — one generated exchange they play through line by line     */
/* ------------------------------------------------------------------ */
export interface Packet {
  id: string;
  topic: string;
  lines: Line[];
  /** button labels offered once the last line has typed out */
  choices: string[];
  loreIds: string[];
}

/* ------------------------------------------------------------------ */
/*  VERDICT — the LLM's synthesis of the three cards                   */
/* ------------------------------------------------------------------ */
export interface VerdictOut {
  title: string;
  text: string;
}

export interface CardBrief {
  position: string;
  name: string;
  orientation: string;
  meaning: string;
  element: string;
  arcana: string;
}

/* ------------------------------------------------------------------ */
/*  WIRE — what the browser posts to /api/generate                     */
/* ------------------------------------------------------------------ */
export type GenRequest =
  | { action: "lore"; sky: Sky }
  | { action: "packet"; sky: Sky; lore: LoreBible | null; reply?: string; recent: string[] }
  | { action: "verdict"; sky: Sky; cards: CardBrief[]; topic: string | null };

export type GenResponse = LoreBible | Packet | VerdictOut;
