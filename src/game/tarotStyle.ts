import type { TarotCard } from "./tarot";

/* ------------------------------------------------------------------ */
/*  Neon-punk deck theme — inspired by the reference photos:           */
/*  thick black borders, flat day-glo color, yellow title plate.       */
/*  One shared theme drives BOTH the 3D canvas textures and the DOM UI */
/*  so the table cards and the hand UI always match.                   */
/* ------------------------------------------------------------------ */

export interface CardTheme {
  /** main flat art background */
  bg: string;
  /** darker shade of bg for dots / shading */
  deep: string;
  /** contrasting neon for bolts / halo */
  accent: string;
  /** small badge color */
  badge: string;
}

export const NEON = {
  pink: "#ff2a7f",
  magenta: "#ff4fd8",
  lime: "#7dff2a",
  green: "#2aff7d",
  cyan: "#00e5ff",
  blue: "#2a7dff",
  yellow: "#ffe600",
  orange: "#ff6b1a",
  red: "#ff2a2a",
  purple: "#9b2aff",
  violet: "#c86bff",
  black: "#0a0a0e",
} as const;

// 22 bespoke duos for the majors — loud but each reads instantly
const MAJOR_THEMES: CardTheme[] = [
  { bg: "#00c8ff", deep: "#006b8a", accent: "#ffe600", badge: "#00c8ff" }, // 0 Fool — cyan sky
  { bg: "#ff2a7f", deep: "#8a1042", accent: "#00e5ff", badge: "#ff2a7f" }, // 1 Magician — hot pink
  { bg: "#2a1a6e", deep: "#150b3d", accent: "#c86bff", badge: "#5b2cff" }, // 2 Priestess — deep violet night
  { bg: "#ff8ab8", deep: "#a33c64", accent: "#7dff2a", badge: "#ff8ab8" }, // 3 Empress — soft pink
  { bg: "#ff6b1a", deep: "#8a2f00", accent: "#ffe600", badge: "#ff6b1a" }, // 4 Emperor — blaze orange
  { bg: "#d8d2c2", deep: "#8a8474", accent: "#ff2a7f", badge: "#8a8474" }, // 5 Hierophant — bone
  { bg: "#ff2a5e", deep: "#8a1030", accent: "#ffb3d9", badge: "#ff2a5e" }, // 6 Lovers — red-pink
  { bg: "#00b89a", deep: "#065e4e", accent: "#ffe600", badge: "#00b89a" }, // 7 Chariot — teal speed
  { bg: "#ffb14f", deep: "#8a4d12", accent: "#ff2a7f", badge: "#ffb14f" }, // 8 Strength — amber
  { bg: "#3d4a6e", deep: "#1c2338", accent: "#ffe600", badge: "#3d4a6e" }, // 9 Hermit — dusk blue
  { bg: "#00e5a0", deep: "#006b4a", accent: "#ff4fd8", badge: "#00e5a0" }, // 10 Wheel — mint
  { bg: "#e8e4da", deep: "#8f8a7c", accent: "#2a7dff", badge: "#8f8a7c" }, // 11 Justice — paper white
  { bg: "#4f7dff", deep: "#1e2f7a", accent: "#7dff2a", badge: "#4f7dff" }, // 12 Hanged — blue
  { bg: "#2b2140", deep: "#120d1e", accent: "#b14fff", badge: "#5b2c8a" }, // 13 Death — coffin purple-black
  { bg: "#00e5ff", deep: "#006b7a", accent: "#ff8ab8", badge: "#00e5ff" }, // 14 Temperance — cyan flow
  { bg: "#c81a1a", deep: "#5e0a0a", accent: "#ffb14f", badge: "#c81a1a" }, // 15 Devil — blood red
  { bg: "#ff2a7f", deep: "#6e0f36", accent: "#ffe600", badge: "#ff2a7f" }, // 16 Tower — shock pink
  { bg: "#0e2a6e", deep: "#060f33", accent: "#7df9ff", badge: "#2a7dff" }, // 17 Star — midnight blue
  { bg: "#3d2a8a", deep: "#1a1245", accent: "#ffb3d9", badge: "#6e4fd8" }, // 18 Moon — indigo fog
  { bg: "#ffb300", deep: "#8a5200", accent: "#ff2a2a", badge: "#ffb300" }, // 19 Sun — marigold
  { bg: "#ff4fd8", deep: "#7a1e63", accent: "#ffe600", badge: "#ff4fd8" }, // 20 Judgement — neon magenta
  { bg: "#2aff7d", deep: "#0b6e34", accent: "#ff2a7f", badge: "#2aff7d" }, // 21 World — acid green
];

const SUIT_THEMES: Record<string, CardTheme> = {
  wands: { bg: "#ff4a1f", deep: "#7a1600", accent: "#ffe600", badge: "#ff4a1f" },
  cups: { bg: "#00b8ff", deep: "#003f7a", accent: "#ff8ab8", badge: "#00b8ff" },
  swords: { bg: "#8b2cff", deep: "#2b0a5e", accent: "#00e5ff", badge: "#8b2cff" },
  pentacles: { bg: "#a8e10c", deep: "#3d5e00", accent: "#ff2a7f", badge: "#7ab800" },
};

export function getCardTheme(card: TarotCard): CardTheme {
  if (card.arcana === "major") {
    return MAJOR_THEMES[card.id % MAJOR_THEMES.length];
  }
  const base = SUIT_THEMES[card.suit ?? "wands"];
  // courts flip to dark card with neon art so they stand out in the fan
  const isCourt = card.numeral.length === 1 && /[PJQK]/.test(card.numeral);
  if (isCourt) {
    return { bg: "#14141c", deep: "#08080c", accent: base.bg, badge: base.badge };
  }
  return base;
}

/** short banner text: "XIII · DEATH" / "8 OF SWORDS" */
export function bannerText(card: TarotCard): string {
  const upper = card.name.toUpperCase();
  if (card.arcana === "major") return `${card.numeral} · ${upper.replace(/^THE /, "")}`;
  return upper;
}
