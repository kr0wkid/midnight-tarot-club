import { create } from "zustand";
import { AFTER, GREET, IGNORED, nextAmbientLine, sceneJustEnded, SHUFFLE_LINE, SPREAD_LINE, TOPIC_LINES, VERDICT_LEAD, type GirlId } from "./dialogue";
import { buildSpread, POSITIONS, type DrawnCard, type TopicId } from "./tarot";
import { audio } from "./audio";
import { ensureLore, getVerdict, nextPacket, noteReply } from "./director";
import { aiState } from "./llm";
import type { Packet } from "./types";

export type Toast = { id: number; text: string; x: number; y: number };
export type Phase = "ambient" | "talk" | "shuffle" | "spread" | "reading" | "after";
export type VerdictState = { status: "idle" | "pending" | "ready" | "failed"; title?: string; text?: string };

export interface ActiveLine {
  who: GirlId;
  text: string;
  key: number;
}

let lineKey = 1;
const mkLine = (who: GirlId, text: string): ActiveLine => ({ who, text, key: lineKey++ });

type GameState = {
  started: boolean;
  muted: boolean;
  /** minutes since midnight */
  clock: number;
  phase: Phase;
  line: ActiveLine;
  lineAt: number;
  talkStep: number;
  topic: TopicId | null;
  spread: DrawnCard[];
  picked: DrawnCard[];
  revealIdx: number;
  afterIdx: number;
  toasts: Toast[];
  /** generated exchanges waiting to play, oldest first */
  packetQ: Packet[];
  /** buttons offered at the end of a generated exchange */
  choices: string[] | null;
  verdict: VerdictState;

  start: () => void;
  toggleMute: () => void;
  tick: (minutes: number) => void;
  toast: (text: string) => void;
  dropToast: (id: number) => void;

  sayAs: (who: GirlId, text: string) => void;
  /** returns false when nothing new could be said (scene frozen on a question) */
  nextAmbient: () => boolean;
  enqueuePacket: (p: Packet) => void;
  join: () => void;
  advanceTalk: () => void;
  chooseTopic: (t: TopicId) => void;
  pickCard: (uid: number) => void;
  unpickCard: (uid: number) => void;
  nextReveal: () => void;
  pullAgain: () => void;
  hang: () => void;
  answerChoice: (text: string) => void;
};

/** timestamp of the intro zoom — used to swallow the input that triggered it */
export let startedAt = 0;
export const justStarted = () => Date.now() - startedAt < 450;
let readingTimer: number | undefined;
/** each card gets a beat before it can be clicked / mashed past */
let revealAt = 0;
const REVEAL_DWELL = 4500;
/** true once the current card has been on screen long enough to move on */
export const revealReady = () => Date.now() - revealAt >= REVEAL_DWELL;

/* ---------------- generated dialogue plumbing ---------------- */
let fetching = false;
let queuedReply: string | null = null;
let toldDown = false;
/** handwritten lines played since the last generated exchange */
let scriptedSincePacket = 0;
let choiceTimer: number | undefined;

function sayOffline() {
  if (toldDown) return;
  toldDown = true;
  useGame.getState().toast("the wire's down tonight — same old lines");
}

/** ask for a new exchange; a reply always jumps the queue */
function pullPacket(reply?: string) {
  if (reply) queuedReply = reply;
  if (fetching) return;
  fetching = true;  const wanted = queuedReply ?? undefined;
  queuedReply = null;
  void nextPacket(wanted ? { reply: wanted } : {}).then((packet) => {
    fetching = false;
    if (packet) useGame.getState().enqueuePacket(packet);
    else sayOffline();
    if (queuedReply) pullPacket();
  });
}

/** they'll drop the question if the player never answers */
function armChoiceTimer() {
  window.clearTimeout(choiceTimer);
  choiceTimer = window.setTimeout(() => {
    const g = useGame.getState();
    if (!g.choices) return;
    const line = IGNORED[(Math.random() * IGNORED.length) | 0];
    g.sayAs(line.who, line.text);
    setChoices(null);
  }, 45_000);
}

function setChoices(next: string[] | null) {
  if (next) armChoiceTimer();
  else window.clearTimeout(choiceTimer);
  useGame.setState({ choices: next });
}

export const useGame = create<GameState>((set, get) => ({
  started: false,
  muted: false,
  clock: 2 * 60 + 6,
  phase: "ambient",
  line: mkLine("cole", "...and that's why i don't trust anyone who puts ketchup on eggs."),
  lineAt: Date.now(),
  talkStep: 0,
  topic: null,
  spread: [],
  picked: [],
  revealIdx: 0,
  afterIdx: 0,
  toasts: [],
  packetQ: [],
  choices: null,
  verdict: { status: "idle" },

  start: () => {
    if (get().started) return;
    audio.unlock();
    startedAt = Date.now();
    set({ started: true });
    // their history first, then tonight's opening topic
    void ensureLore().then((lore) => {
      if (!lore && aiState() === "down") {
        sayOffline();
        return;
      }
      pullPacket();
    });
  },
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  tick: (minutes) => set((s) => ({ clock: (s.clock + minutes) % 1440 })),
  toast: (text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, text, x: 30 + Math.random() * 40, y: 40 + Math.random() * 15 }] }));
    setTimeout(() => get().dropToast(id), 1900);
  },
  dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  sayAs: (who, text) => set({ line: mkLine(who, text), lineAt: Date.now() }),

  enqueuePacket: (p) => set((s) => ({ packetQ: [...s.packetQ, p] })),

  nextAmbient: () => {
    const { phase, choices, packetQ } = get();
    if (phase !== "ambient" && phase !== "after") return false;
    // they asked the player something — nobody talks until it's answered or dropped
    if (choices) return false;

    if (phase === "after" && get().afterIdx < AFTER.length) {
      const l = AFTER[get().afterIdx];
      set({ line: mkLine(l.who, l.text), lineAt: Date.now(), afterIdx: get().afterIdx + 1 });
      return true;
    }
    if (phase === "after" && get().afterIdx !== 999) set({ afterIdx: 999 });

    // generated exchanges play first — that's tonight's topic
    if (packetQ.length > 0) {
      const [current, ...rest] = packetQ;
      const [line, ...tail] = current.lines;
      if (tail.length > 0) {
        set({ packetQ: [{ ...current, lines: tail }, ...rest], line: mkLine(line.who, line.text), lineAt: Date.now() });
      } else {
        // last line of the exchange — put their question to the player
        scriptedSincePacket = 0;
        set({ packetQ: rest, line: mkLine(line.who, line.text), lineAt: Date.now() });
        if (current.choices.length) setChoices(current.choices);
      }
      return true;
    }

    const l = nextAmbientLine();
    scriptedSincePacket++;
    set({ line: mkLine(l.who, l.text), lineAt: Date.now() });
    // a beat or two of handwritten chatter, then someone brings up something new
    // (never retry mid-session once the wire has gone down — the script carries the night)
    if (sceneJustEnded() && scriptedSincePacket >= 6 && aiState() !== "down") pullPacket();
    return true;
  },

  join: () => {
    const { phase, started } = get();
    if (!started || justStarted()) return;
    if (phase !== "ambient" && phase !== "after") return;
    window.clearTimeout(readingTimer);
    if (get().choices) setChoices(null);
    set({ phase: "talk", talkStep: 0, topic: null, picked: [], revealIdx: 0, line: mkLine(GREET[0].who, GREET[0].text), lineAt: Date.now() });
  },

  advanceTalk: () => {
    const { phase, talkStep, topic } = get();
    if (phase !== "talk") return;
    if (talkStep < 3) {
      const next = talkStep + 1;
      set({ talkStep: next, line: mkLine(GREET[next].who, GREET[next].text), lineAt: Date.now() });
    } else if (talkStep === 3 && topic) {
      // topic chosen → shuffle
      set({ phase: "shuffle" });
      audio.shuffle();
      window.setTimeout(() => {
        if (useGame.getState().phase !== "shuffle") return;
        set({
          phase: "spread",
          spread: buildSpread(7),
          line: mkLine("jetta", SPREAD_LINE),
          lineAt: Date.now(),
        });
      }, 1500);
    }
  },

  chooseTopic: (t) => {
    const { phase, talkStep } = get();
    if (phase !== "talk" || talkStep !== 3) return;
    audio.blip(660, 0.09, 0.12);
    set({
      topic: t,
      line: mkLine("jetta", `${TOPIC_LINES[t]} ${SHUFFLE_LINE}`),
      lineAt: Date.now(),
    });
  },

  pickCard: (uidPicked) => {
    const { phase, spread, picked } = get();
    if (phase !== "spread" || picked.length >= 3) return;
    const found = spread.find((c) => c.uid === uidPicked);
    if (!found || picked.some((c) => c.uid === uidPicked)) return;
    audio.flip();
    const next = [...picked, found];
    const posLabel = POSITIONS[next.length - 1].label;
    set({
      picked: next,
      line: mkLine("jetta", next.length === 3 ? "okay. putting them down. let's see how bad it is." : `${posLabel.toLowerCase()}. ${3 - next.length === 2 ? "two" : "one"} more.`),
      lineAt: Date.now(),
    });
    if (next.length === 3) {
      window.clearTimeout(readingTimer);
      readingTimer = window.setTimeout(() => {
        const st = useGame.getState();
        if (st.phase !== "spread") return;
        const first = st.picked[0];
        audio.shimmer();
        revealAt = Date.now();
        set({
          phase: "reading",
          revealIdx: 0,
          line: mkLine("jetta", first.reversed ? first.card.rev : first.card.up),
          lineAt: Date.now(),
        });
      }, 900);
    }
  },

  unpickCard: (uidPicked) => {
    const { phase, picked } = get();
    if (phase !== "spread") return;
    window.clearTimeout(readingTimer);
    set({ picked: picked.filter((c) => c.uid !== uidPicked) });
  },

  nextReveal: () => {
    const { phase, revealIdx, picked } = get();
    if (phase !== "reading") return;
    revealAt = Date.now(); // the next card's dwell starts here; inputs check revealReady()
    if (revealIdx < 2) {
      const next = picked[revealIdx + 1];
      audio.flip();
      set({
        revealIdx: revealIdx + 1,
        line: mkLine("jetta", next.reversed ? next.card.rev : next.card.up),
        lineAt: Date.now(),
      });
    } else if (revealIdx === 2) {
      audio.shimmer();
      set({ revealIdx: 3, line: mkLine("jetta", VERDICT_LEAD), lineAt: Date.now(), verdict: { status: "pending" } });
      // jetta reads all three together — this is the one live call in a reading
      void getVerdict(picked, get().topic).then((v) => {
        set({
          verdict: v
            ? { status: "ready", title: v.title, text: v.text }
            : { status: "failed" },
        });
      });
    }
  },

  pullAgain: () => {
    set({
      phase: "shuffle",
      picked: [],
      revealIdx: 0,
      verdict: { status: "idle" },
      line: mkLine("jetta", "again? greedy. fine, shuffling."),
      lineAt: Date.now(),
    });
    audio.shuffle();
    window.setTimeout(() => {
      if (useGame.getState().phase !== "shuffle") return;
      set({
        phase: "spread",
        spread: buildSpread(7),
        line: mkLine("jetta", SPREAD_LINE),
        lineAt: Date.now(),
      });
    }, 1500);
  },

  hang: () => {
    set({ phase: "after", afterIdx: 0, picked: [], revealIdx: 0, verdict: { status: "idle" }, line: mkLine(AFTER[0].who, AFTER[0].text), lineAt: Date.now() });
  },

  answerChoice: (text) => {
    if (!get().choices) return;
    audio.blip(660, 0.09, 0.12);
    noteReply(text);
    setChoices(null);
    // they answer straight away — queue it so the reply lands within a line or two
    pullPacket(text);
  },
}));

export function formatClock(clock: number) {
  const h24 = Math.floor(clock / 60) % 24;
  const m = Math.floor(clock % 60);
  const ampm = h24 < 12 ? "am" : "pm";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}
