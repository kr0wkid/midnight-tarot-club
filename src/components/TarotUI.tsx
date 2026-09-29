import { useEffect, useMemo, useState } from "react";
import { GIRLS, reactionFor } from "../game/dialogue";
import { revealReady, useGame } from "../game/store";
import { POSITIONS, SUIT_INFO, verdictFor, type TarotCard } from "../game/tarot";
import { cardSrc, CARD_BACK_SRC } from "../game/cardAssets";
import { bannerText } from "../game/tarotStyle";
import { audio } from "../game/audio";

/* Pixel card back — "The One-Sized Arcana" (50x70 art, scaled crisp) */
function CardBack({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#0a0a0e] ${
        small ? "rounded-[3px]" : "rounded-[5px]"
      }`}
    >
      <img
        src={CARD_BACK_SRC}
        alt=""
        draggable={false}
        className="h-full w-full object-fill [image-rendering:pixelated]"
      />
    </div>
  );
}

/* Pixel card face — "The One-Sized Arcana"; rotates 180° when reversed */
function CardFace({ card, reversed, big = false }: { card: TarotCard; reversed: boolean; big?: boolean }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#0a0a0e] ${
        big ? "rounded-[6px]" : "rounded-[3px]"
      }`}
      style={{ transform: reversed ? "rotate(180deg)" : undefined }}
    >
      <img
        src={cardSrc(card)}
        alt={card.name}
        draggable={false}
        className="h-full w-full object-fill [image-rendering:pixelated]"
      />
      {/* yellow name plate — kept from the old deck so the card is legible */}
      <div className="absolute inset-x-0 bottom-0 border-t border-black bg-[#ffe600] px-1 text-center">
        <div className={`pixel font-bold uppercase leading-none text-black ${big ? "py-[4px] text-[10px]" : "py-[2px] text-[6px]"}`}>
          {bannerText(card)}.
        </div>
      </div>
    </div>
  );
}

function Spread() {
  const spread = useGame((s) => s.spread);
  const picked = useGame((s) => s.picked);
  const isPicked = (uid: number) => picked.findIndex((p) => p.uid === uid);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-24 sm:pb-24">
      <div className="pixel hud-shadow mb-2 text-[13px] text-[#ffe600]">
        pick 3 — past · present · destiny <span className="text-white/60">({picked.length}/3)</span>
      </div>
      <div className="pointer-events-auto flex items-end justify-center gap-1.5 sm:gap-3">
        {spread.map((d, i) => {
          const pi = isPicked(d.uid);
          const sel = pi >= 0;
          const arc = (i - (spread.length - 1) / 2) * 5;
          const lift = Math.abs(i - (spread.length - 1) / 2) * 5;
          return (
            <button
              key={d.uid}
              onClick={() => {
                const g = useGame.getState();
                if (sel) g.unpickCard(d.uid);
                else g.pickCard(d.uid);
              }}
              className="spread-card relative h-[106px] w-[76px] transition-transform duration-200 hover:-translate-y-3 sm:h-[134px] sm:w-[96px]"
              style={{
                transform: sel ? `translateY(-18px) rotate(0deg)` : `translateY(${lift}px) rotate(${arc}deg)`,
              }}
            >
              <div className={`flip-inner h-full w-full ${sel ? "flipped" : ""}`}>
                <div className="flip-face overflow-hidden rounded-[5px] border-2 border-black shadow-[0_4px_12px_rgba(0,0,0,0.7),0_0_12px_rgba(255,42,127,0.35)]">
                  <CardBack small />
                </div>
                <div className="flip-face flip-back overflow-hidden rounded-[5px] border-2 border-black shadow-[0_4px_16px_rgba(255,230,0,0.35)]">
                  <CardFace card={d.card} reversed={d.reversed} />
                </div>
              </div>
              {sel && (
                <div className="pixel absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-[2px] bg-[#ffe600] px-1.5 py-0.2 text-[10px] font-bold text-black shadow">
                  {["I · PAST", "II · PRESENT", "III · DESTINY"][pi]}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="pixel hud-shadow mt-2.5 text-[11px] text-white/50">
        click card to draw · click again to put back into spread
      </div>
    </div>
  );
}

function Reading() {
  const picked = useGame((s) => s.picked);
  const revealIdx = useGame((s) => s.revealIdx);
  const topic = useGame((s) => s.topic);
  const verdict = useGame((s) => s.verdict);
  const [tab, setTab] = useState<"reading" | "symbolism">("reading");

  const reactions = useMemo(
    () => picked.map((p) => reactionFor(p.card.vibe, p.reversed)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [picked.map((p) => p.uid).join(",")]
  );

  // jetta voices the card, then the other girls chime in
  useEffect(() => {
    if (revealIdx > 2 || picked.length < 3) return;
    const r = reactions[revealIdx];
    if (!r) return;
    audio.say(GIRLS.jetta.pitch, 8);
    const id = window.setTimeout(() => {
      useGame.getState().sayAs(r.who, r.text);
      audio.say(GIRLS[r.who].pitch, r.text.length / 6);
      if (Math.random() < 0.3) window.setTimeout(() => audio.giggle(GIRLS[r.who].pitch), 1200);
    }, 3600);
    return () => window.clearTimeout(id);
  }, [revealIdx, picked.length, reactions]);

  // reset tab on card advance
  useEffect(() => {
    setTab("reading");
  }, [revealIdx]);

  // the reveal can't be mashed through — show the button as waiting its turn
  const [ready, setReady] = useState(true);
  useEffect(() => {
    setReady(revealReady());
    const id = window.setInterval(() => setReady(revealReady()), 250);
    return () => window.clearInterval(id);
  }, [revealIdx]);

  if (picked.length < 3) return null;

  // Final summary verdict
  if (revealIdx >= 3) {
    const fallback = verdictFor(picked, topic);
    const waiting = verdict.status === "pending";
    const title = verdict.status === "ready" && verdict.title ? verdict.title : fallback.title;
    const body =
      verdict.status === "ready" && verdict.text
        ? verdict.text
        : waiting
          ? "jetta is staring at them…"
          : fallback.text;
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <div className="vn-box pointer-events-auto max-h-[90vh] w-[min(540px,94vw)] overflow-y-auto rounded-[6px] border border-[#ff2a7f]/50 bg-black/85 p-5 text-center shadow-[0_0_35px_rgba(255,42,127,0.25)]">
          <div className="pixel text-[11px] tracking-widest text-[#ffe600]">✦ COMPLETE TAROT SPREAD ✦</div>

          {/* mini thumbnail triumvirate */}
          <div className="my-3 flex justify-center gap-2">
            {picked.map((p, i) => (
              <div
                key={p.uid}
                className="relative h-[78px] w-14 overflow-hidden rounded-[3px] border-2 border-black shadow-md"
              >
                <CardFace card={p.card} reversed={p.reversed} />
                <div className="pixel absolute bottom-0 inset-x-0 bg-black/80 py-0.5 text-[8px] text-[#ffe600]">
                  {["I", "II", "III"][i]}
                </div>
              </div>
            ))}
          </div>

          <div className="pixel text-lg text-[#ffe600]">
            {"★".repeat(fallback.stars)}
            {"☆".repeat(5 - fallback.stars)}
          </div>
          <div className="pixel mt-1 text-xl font-bold" style={{ color: "#ff4fd8" }}>
            {title}
          </div>

          <div className="pixel mt-1 flex justify-center gap-1.5 text-[10px] text-white/50">
            <span>Elemental balance:</span>
            {fallback.elements.map((el, i) => (
              <span key={i} className="rounded bg-white/10 px-1 py-0.5 text-white/80">
                {el}
              </span>
            ))}
          </div>

          <div
            className={`pixel mt-3.5 text-[15px] leading-relaxed text-white/95 ${
              waiting ? "blink-soft italic text-white/60" : ""
            }`}
          >
            {body}
          </div>

          {!waiting && (
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <button
                onClick={() => useGame.getState().pullAgain()}
                className="pixel rounded-[3px] border border-[#ffe600]/70 bg-[#ffe600]/15 px-3.5 py-2 text-[14px] font-bold text-[#ffe600] transition hover:bg-[#ffe600]/30 shadow"
              >
                🔮 shuffle full deck & draw again
              </button>
              <button
                onClick={() => useGame.getState().hang()}
                className="pixel rounded-[3px] border border-white/25 bg-white/10 px-3.5 py-2 text-[14px] text-white transition hover:bg-white/25"
              >
                🌙 hang in the hideout
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const d = picked[revealIdx];
  const pos = POSITIONS[revealIdx];
  const r = reactions[revealIdx];
  const meaning = d.reversed ? d.card.rev : d.card.up;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 pb-16 sm:pb-20">
      <div className="vn-box pointer-events-auto flex w-[min(620px,96vw)] gap-3.5 rounded-[6px] border border-white/20 bg-black/85 p-3.5 sm:gap-5 sm:p-4 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        {/* Large pixel tarot card */}
        <div className="relative h-[193px] w-[138px] shrink-0 sm:h-[221px] sm:w-[158px]">
          <div className="h-full w-full overflow-hidden rounded-[6px] border-2 border-black shadow-[0_0_18px_rgba(255,42,127,0.45)]">
            <CardFace card={d.card} reversed={d.reversed} big />
          </div>
          {d.reversed && (
            <div className="pixel absolute -top-2 left-1/2 -translate-x-1/2 rounded-[2px] bg-[#ff2a2a] px-2 py-0.5 text-[10px] font-bold text-white shadow">
              REVERSED ⟲
            </div>
          )}
        </div>

        {/* Card reading info & banter */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <div className="pixel text-[12px] tracking-widest text-[#ffe600]">
              {pos.label} <span className="text-white/45">· {pos.sub}</span>
            </div>
            <div className="flex gap-1 text-[11px]">
              <button
                onClick={() => setTab("reading")}
                className={`pixel rounded px-1.5 py-0.5 ${
                  tab === "reading" ? "bg-[#ffe600] text-black font-bold" : "text-white/50 hover:text-white"
                }`}
              >
                Jetta
              </button>
              <button
                onClick={() => setTab("symbolism")}
                className={`pixel rounded px-1.5 py-0.5 ${
                  tab === "symbolism" ? "bg-[#ffe600] text-black font-bold" : "text-white/50 hover:text-white"
                }`}
              >
                Lore
              </button>
            </div>
          </div>

          {/* Keywords & Element pills */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="pixel rounded-[2px] bg-[#ff2a7f]/30 px-1.5 py-0.5 text-[10px] text-[#ffb3d9]">
              {d.card.arcana.toUpperCase()}
            </span>
            {d.card.suit && (
              <span className="pixel rounded-[2px] bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
                {SUIT_INFO[d.card.suit].name} ({d.card.element})
              </span>
            )}
            {d.card.keywords.map((k) => (
              <span key={k} className="pixel rounded-[2px] bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                {k}
              </span>
            ))}
          </div>

          {/* Tab content */}
          {tab === "reading" ? (
            <div className="mt-2 min-h-[70px]">
              <div className="pixel text-[14px] leading-relaxed text-white/95 sm:text-[15px]">
                <span className="font-bold" style={{ color: GIRLS.jetta.color }}>
                  JETTA:{" "}
                </span>
                “{meaning}”
              </div>
              {r && (
                <div className="pixel mt-2 border-l-2 border-white/20 pl-2 text-[13px] leading-relaxed text-white/65">
                  <span className="font-bold" style={{ color: GIRLS[r.who].color }}>
                    {GIRLS[r.who].name}:{" "}
                  </span>
                  {r.text}
                </div>
              )}
            </div>
          ) : (
            <div className="pixel mt-2 min-h-[70px] text-[13px] leading-relaxed text-white/80">
              <div className="text-[#ffe600] font-bold">Rider-Waite Symbolism:</div>
              <div className="mt-1 italic">{d.card.symbolism}</div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-2">
            <div className="pixel text-[11px] text-white/40">
              Card {revealIdx + 1} of 3 {revealIdx === 2 ? "· final card" : ""}
            </div>
            <button
              onClick={() => {
                if (revealReady()) useGame.getState().nextReveal();
              }}
              disabled={!ready}
              className={`pixel rounded-[3px] border border-white/30 bg-white/15 px-3 py-1.5 text-[14px] font-bold text-white shadow transition ${
                ready ? "hover:bg-white/30" : "cursor-default opacity-45"
              }`}
            >
              {ready
                ? revealIdx === 2
                  ? "✦ reveal verdict [E]"
                  : "next card [E] ▼"
                : "…"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TarotUI() {
  const phase = useGame((s) => s.phase);
  if (phase === "spread") return <Spread />;
  if (phase === "reading") return <Reading />;
  if (phase === "shuffle")
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-28">
        <div className="pixel hud-shadow blink-soft text-[14px] text-[#ff4fd8]">
          shuffling full 78-card deck… focus your intention
        </div>
      </div>
    );
  return null;
}
