import { GIRLS, MOOD, MOOD_LABEL } from "../game/dialogue";
import { formatClock, useGame } from "../game/store";

const HINTS: Record<string, string> = {
  ambient: "click a girl — or press [E] — to join them",
  after: "click a girl — or press [E] — for another reading",
  talk: "click the box or [E] to keep talking",
  shuffle: "the cards are waking up…",
  spread: "pick the 3 cards that call to you",
  reading: "[E] for the next card",
};

export default function HUD() {
  const clock = useGame((s) => s.clock);
  const phase = useGame((s) => s.phase);
  const line = useGame((s) => s.line);
  const toasts = useGame((s) => s.toasts);
  const choices = useGame((s) => s.choices);
  const speaker = GIRLS[line.who];

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast pixel hud-shadow absolute text-[15px] text-amber-200"
          style={{ left: `${t.x}%`, top: `${t.y}%` }}
        >
          {t.text}
        </div>
      ))}

      {/* location label */}
      <div className="fade-in absolute right-[6%] top-[5%] text-right">
        <div className="pixel hud-shadow text-[15px] tracking-wide text-white/95">гараж</div>
        <div className="pixel hud-shadow mt-1 text-[9px] text-white/45">midnight tarot club</div>
        <div className="pixel hud-shadow mt-1 text-[9px] italic text-white/35">{MOOD_LABEL[MOOD]}</div>
      </div>

      {/* who's talking */}
      <div className="absolute left-[5%] top-[5%] flex items-center gap-2">
        <span className="talk-dot inline-block h-2 w-2 rounded-full" style={{ background: speaker.color }} />
        <span className="pixel hud-shadow text-[11px]" style={{ color: speaker.color }}>
          {speaker.name}
        </span>
      </div>

      {/* bottom-left readout */}
      <div className="absolute bottom-[7%] left-[5%] flex flex-col gap-[6px]">
        <span className="pixel hud-shadow text-[11px] leading-none text-white/90">!</span>
        <div className="pixel hud-shadow text-[15px] leading-tight text-white">☽ {formatClock(clock)}</div>
      </div>

      {/* hint */}
      <div className="absolute bottom-[7%] right-[5%] max-w-[45vw] text-right">
        <div className="pixel hud-shadow text-[10px] leading-relaxed text-white/50">
          {choices ? "they asked you something ↓" : HINTS[phase]}
        </div>
      </div>
    </div>
  );
}
