import { SCENES, type GirlId, type Line } from "./dialogue.js";

/* ------------------------------------------------------------------ */
/*  PROMPT MATERIAL — shared by the browser and the /api/generate      */
/*  function. Every generated line is judged against this.             */
/* ------------------------------------------------------------------ */

export const SETTING = `three teenage girls — jetta, emi and cole — hang out under a sodium streetlight
outside a boarded-up garage they call the hideout. it's around 2am on a school night, cold,
the city humming behind them. the player is a fourth person standing a few feet away: a
stranger who wandered over. the player NEVER speaks as text — they only ever tap one of a
couple of short buttons you offer, or say nothing at all. write like a screenplay being
overheard, not like a chatbot answering a query.`;

export const VOICE_CARDS: Record<GirlId, string> = {
  jetta: `JETTA (scorpio sun · scorpio moon · aquarius rising) — the witch of the group. keeps
candles by colour, puts people's names in the freezer, leaves water on the roof for the full
moon, reads tarot for anyone who stands still. dry, dark, speaks in short declaratives, will
joke about hexing you and mean it a little. deadpan, no exclamation marks ever, never raises
her voice. underneath it she's the softest of the three and hides it with irony. she knows
correspondences by heart — herbs, days, planets, stones — and drops them casually. she is
almost always right and never needs you to know that.`,
  emi: `EMI (gemini sun · libra rising) — the astrology girl. knows everyone's big three,
blames and credits every event in her life to placements, runs on gossip and enthusiasm.
talks fast, runs sentences together, peppers lines with "ok but", "honestly", "no because",
"like". loud, warm, first to be nice and first to judge your sign. she asks questions, she
finishes other people's sentences, she changes the subject sideways. she believes all of it
completely and gets defensive when challenged.`,
  cole: `COLE (capricorn sun · cancer moon, which she hates) — insists she doesn't believe in
any of it. deadpan, cynical, weaponises short replies: "sure.", "cool.", "must be nice." the
meanest of the three and the one who always shows up. but she keeps a dream journal, counts
numbers on everything, and quietly knows what a master number is. she deflects with insults
and is secretly the group's conscience. never enthusiastic, never long-winded.`,
};

/** things already established by the handwritten script — generated lore must not contradict these */
export const CANON: string[] = [
  "they are roughly 17, in the same year at the same school, and meet under this lamp most nights.",
  "jetta has an older sister who steals her eyeliner. jetta has already put dylan's name in the freezer for calling her hair a crime scene.",
  "jetta keeps moon water on the roof; a pigeon drank it once and now he's thriving and blessed.",
  "emi's mother found her tarot deck and called it 'a door for demons'.",
  "emi runs the group chat. chloe left it. tyler is her ex (leo rising). jordan from bio is a libra.",
  "cole's little brother once grew a science fair plant playing nickelback; it died.",
  "cole's mom has a new boyfriend who is a gemini. cole failed her driving test twice and went straight through a roundabout.",
  "cole got detention for yawning too loudly, and she lies about her mile time.",
  "mr. haddad (virgo) teaches chemistry. ms. park (aries) whistles. mrs. dolan lost her voice for a week.",
  "the player is a stranger who showed up tonight — they have no established history with the girls.",
  "the girls are under a streetlight next to a boarded-up garage. it is roughly 2am.",
];

export const STYLE_RULES = `STYLE — this is non-negotiable:
- everything lowercase. no capitals, not even for i.
- no emojis, no asterisks, no stage directions, no speaker names inside the text — the app prints the name itself.
- 1 to 3 sentences a line, hard ceiling of ~150 characters. punchy over complete.
- sound like teenagers talking at 2am, not a writer performing teenagers. contractions always.
- the three disagree. never let all three land on the same opinion.
- a line may address the player standing there ("you" / "you're"), but never ask them to type anything.
- keep it pg-13: no sex, no self-harm, no real cruelty. if something gets heavy, let one of them deflect with a joke.
- occult topics stay playful and specific — correspondences, card meanings, moon phases, dream symbols —
  never scary, never framed as literally true in a threatening way. this is a game about teenage
  superstition, not a warning.
- never break the fourth wall: no mention of being an ai, a model, a game, dialogue, or the word "player".`;

/**
 * real excerpts from the handwritten script — the model imitates this rhythm.
 * looked up by a fragment of the opening line rather than by index, so
 * reordering or adding scenes can't silently break prompt building.
 */
const EXAMPLE_MARKS: string[] = [
  "mercury goes retrograde thursday",
  "i put dylan's name in the freezer",
  "making a big three chart",
  "a door for demons",
  "i don't believe in any of this",
  "teeth falling out dream",
];

function sceneBy(fragment: string): Line[] | null {
  const scene = SCENES.find((s) => s.some((l) => l.text.includes(fragment)));
  return scene ?? null;
}

export function examplesBlock(maxScenes = 5): string {
  const scenes = EXAMPLE_MARKS.map(sceneBy).filter((s): s is Line[] => s !== null).slice(0, maxScenes);
  return scenes.map((scene) => scene.map((l) => `${l.who}: ${l.text}`).join("\n")).join("\n\n");
}

export const JSON_RULE = `reply with ONLY one JSON object. no markdown fences, no commentary before or after it.`;
