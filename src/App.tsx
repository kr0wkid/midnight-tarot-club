import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Scene from "./game/Scene";
import HUD from "./components/HUD";
import Dialogue from "./components/Dialogue";
import TarotUI from "./components/TarotUI";
import { useGame } from "./game/store";
import { audio } from "./game/audio";

const btn =
  "pixel pointer-events-auto rounded-[3px] border border-white/25 bg-black/55 px-3 py-1.5 text-[11px] text-white/90 transition hover:bg-black/80";

export default function App() {
  const started = useGame((s) => s.started);
  const phase = useGame((s) => s.phase);
  const toggleMute = useGame((s) => s.toggleMute);
  const muted = useGame((s) => s.muted);
  const [showHelp, setShowHelp] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);
  const [uiIn, setUiIn] = useState(false);

  // let the dolly-in breathe before the UI fades up
  useEffect(() => {
    if (!started) return;
    const a = setTimeout(() => setUiIn(true), 1400);
    const b = setTimeout(() => setShowHelp(true), 2200);
    const c = setTimeout(() => setShowHelp(false), 12000);
    return () => [a, b, c].forEach(clearTimeout);
  }, [started]);

  // scrolling isn't a "real" gesture for browsers' autoplay rules,
  // so resume audio on the first click / key / touch after arriving
  useEffect(() => {
    if (!started) return;
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
    const poll = setInterval(() => setNeedsSound(!!audio.ctx && audio.ctx.state !== "running"), 500);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      clearInterval(poll);
    };
  }, [started]);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  const join = () => useGame.getState().join();

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#04060b]">
      <Canvas
        shadows
        dpr={0.55}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 50, near: 0.1, far: 160, position: [3, 5, 14] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <Scene />
      </Canvas>

      {/* colour grade + CRT overlays */}
      <div className="grade pointer-events-none absolute inset-0" />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-25" />
      <div className="vignette pointer-events-none absolute inset-0" />

      {/* ---------- establishing shot: no wrapper, just a whisper of text ---------- */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-[9vh] text-center transition-opacity duration-1000"
        style={{ opacity: started ? 0 : 1 }}
      >
        <div>
          <div className="pixel hud-shadow text-[10px] tracking-[0.35em] text-[#ff5c6a]/90">гараж · 02:06 am</div>
          <div className="pixel hud-shadow mt-2 text-xl text-white/90 sm:text-3xl">★ midnight tarot club ★</div>
        </div>
        <div className="pixel hud-shadow blink-soft text-[11px] tracking-widest text-white/70">
          scroll or press enter ↓
        </div>
      </div>

      <div className="transition-opacity duration-700" style={{ opacity: uiIn ? 1 : 0 }}>
        {started && <HUD />}
        {started && <Dialogue />}
        {started && <TarotUI />}

        {started && (
          <div
            onClick={(e) => (e.target as HTMLElement).blur()}
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2"
          >
            {(phase === "ambient" || phase === "after") && (
              <button onClick={join} className={`${btn} border-[#ff5c6a]/60 text-[#ffc2c8]`}>
                👋 join them [E]
              </button>
            )}
            <button onClick={toggleMute} className={btn}>
              {muted ? "🔇 sound off" : "🔊 sound on"}
            </button>
            <button onClick={() => setShowHelp((v) => !v)} className={btn}>
              ? help
            </button>
          </div>
        )}
      </div>

      {started && needsSound && !muted && (
        <div className="pixel hud-shadow blink-soft pointer-events-none absolute left-1/2 top-[6%] -translate-x-1/2 text-[10px] text-white/60">
          🔈 click or press any key to hear them
        </div>
      )}

      {started && showHelp && (
        <div className="pixel pointer-events-none absolute left-1/2 top-[14%] -translate-x-1/2 rounded-[3px] border border-white/10 bg-black/45 px-4 py-3 text-center text-[11px] leading-relaxed text-white/70">
          <div className="text-white/90">three girls, one streetlight, 02:06 am</div>
          <div>hold left mouse &amp; drag — look around · scroll — zoom</div>
          <div>click a girl or press E — join the chat · M — mute</div>
        </div>
      )}
    </div>
  );
}
