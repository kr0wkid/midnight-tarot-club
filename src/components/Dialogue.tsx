import { useEffect, useRef, useState } from "react";
import { GIRLS, TOPICS } from "../game/dialogue";
import { useGame } from "../game/store";
import { audio } from "../game/audio";

export default function Dialogue() {
  const line = useGame((s) => s.line);
  const phase = useGame((s) => s.phase);
  const talkStep = useGame((s) => s.talkStep);
  const topic = useGame((s) => s.topic);
  const choices = useGame((s) => s.choices);
  const [shown, setShown] = useState(0);
  const blipAt = useRef(0);

  // typewriter
  useEffect(() => {
    setShown(0);
    blipAt.current = 0;
  }, [line.key]);

  useEffect(() => {
    if (shown >= line.text.length) return;
    const id = window.setTimeout(() => {
      setShown((s) => s + 1);
      if (shown - blipAt.current >= 4) {
        blipAt.current = shown;
        audio.blip(GIRLS[line.who].pitch, 0.045, 0.035);
      }
    }, 18);
    return () => window.clearTimeout(id);
  }, [shown, line]);

  if (phase === "reading") return null;

  const girl = GIRLS[line.who];
  const text = line.text.slice(0, shown);
  const done = shown >= line.text.length;
  const compact = phase !== "talk";

  const advance = () => {
    const g = useGame.getState();
    if (g.phase !== "talk") return;
    if (!done) {
      setShown(g.line.text.length);
      return;
    }
    if (g.talkStep === 3 && !g.topic) return;
    g.advanceTalk();
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-16 sm:pb-[4.5rem]">
      <div
        onClick={advance}
        className={`pointer-events-auto w-[min(620px,92vw)] rounded-[4px] border bg-black/70 backdrop-blur-[2px] ${
          compact ? "border-white/10 px-4 py-2" : "vn-box px-4 py-3"
        }`}
        style={compact ? undefined : { borderColor: `${girl.color}55` }}
      >
        {compact ? (
          <div className="pixel text-[13px] leading-relaxed text-white/85">
            <span className="mr-2 text-[12px]" style={{ color: girl.color }}>
              {girl.name}
            </span>
            <span className="opacity-90">{text}</span>
            {!done && <span className="caret">▌</span>}

            {choices && done && (
              <div className="mt-2 flex flex-col items-start gap-1.5 border-t border-white/10 pt-2">
                <div className="text-[10px] tracking-widest text-[#e6c8ff]/70">they're waiting on you</div>
                <div className="flex flex-wrap gap-2">
                  {choices.map((c) => (
                    <button
                      key={c}
                      onClick={(e) => {
                        e.stopPropagation();
                        useGame.getState().answerChoice(c);
                      }}
                      className="pixel rounded-[3px] border border-[#c77dff]/60 bg-[#c77dff]/15 px-3 py-1.5 text-left text-[13px] text-[#e6c8ff] transition hover:bg-[#c77dff]/35"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="pixel rounded-[2px] px-1.5 py-0.5 text-[12px] text-black"
                style={{ background: girl.color }}
              >
                {girl.name}
              </span>
              <span className="pixel text-[10px] text-white/40">{girl.role}</span>
            </div>
            <div className="pixel min-h-[2.6em] text-[14px] leading-relaxed text-white/95">
              {text}
              {!done && <span className="caret">▌</span>}
            </div>

            {talkStep === 3 && !topic && done && (
              <div className="mt-2 flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      useGame.getState().chooseTopic(t.id);
                    }}
                    className="pixel rounded-[3px] border border-white/25 bg-white/10 px-3 py-1.5 text-[13px] text-white transition hover:bg-white/25"
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            )}
            {talkStep === 3 && topic && done && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  useGame.getState().advanceTalk();
                }}
                className="pixel blink-soft mt-2 rounded-[3px] border border-[#c77dff]/60 bg-[#c77dff]/15 px-3 py-1.5 text-[13px] text-[#e6c8ff] transition hover:bg-[#c77dff]/30"
              >
                🔮 touch the deck
              </button>
            )}
            {(talkStep < 3 || (talkStep === 3 && topic)) && (
              <div className="pixel mt-1 text-right text-[11px] text-white/35">
                {done ? "▼ continue [E]" : "…"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
