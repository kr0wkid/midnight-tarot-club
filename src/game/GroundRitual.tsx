import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ps1Standard as std } from "./ps1";
import { makeGlowTexture, rng } from "./textures";
import { makeTarotBackTexture, makeTarotFaceTexture } from "./tarotArt";
import { DECK, type DrawnCard } from "./tarot";
import { useGame } from "./store";
import { Puff } from "./Particles";

/* ------------------------------------------------------------------ */
/*  No table — just their spot on the asphalt: a chalk circle, a few   */
/*  melted-down candles, and cards left lying around. When you get a   */
/*  reading, your three cards get laid down in the middle.             */
/* ------------------------------------------------------------------ */

export const RITUAL_POS: [number, number, number] = [0, 0, 0.42];
const R = 0.44;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

/** scratchy chalk circle + pentagram + little glyphs, on transparent */
function makeChalkTexture() {
  const S = 128;
  const { c, ctx } = canvas(S, S);
  const r = rng(1313);
  ctx.clearRect(0, 0, S, S);
  const cx = S / 2;
  const cy = S / 2;
  const chalk = (alpha: number) => `rgba(235,232,245,${alpha})`;

  const ring = (rad: number, alpha: number, w: number) => {
    for (let i = 0; i < 360; i += 1.2) {
      if (r() < 0.08) continue; // gaps where the chalk skipped
      const t = (i * Math.PI) / 180;
      const jitter = (r() - 0.5) * 1.2;
      ctx.fillStyle = chalk(alpha * (0.6 + r() * 0.4));
      ctx.fillRect(cx + Math.cos(t) * (rad + jitter), cy + Math.sin(t) * (rad + jitter), w, w);
    }
  };
  ring(58, 0.75, 2);
  ring(50, 0.55, 1);

  // pentagram
  const pts: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const t = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    pts.push([cx + Math.cos(t) * 49, cy + Math.sin(t) * 49]);
  }
  for (let i = 0; i < 5; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % 5];
    const steps = 70;
    for (let s = 0; s < steps; s++) {
      if (r() < 0.06) continue;
      const u = s / steps;
      ctx.fillStyle = chalk(0.45 + r() * 0.3);
      ctx.fillRect(x0 + (x1 - x0) * u + (r() - 0.5), y0 + (y1 - y0) * u + (r() - 0.5), 1.5, 1.5);
    }
  }

  // tiny glyphs between the rings
  ctx.fillStyle = chalk(0.6);
  ctx.font = "7px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const glyphs = ["☽", "♏", "♊", "♑", "✦", "☉", "♀", "✧"];
  glyphs.forEach((g, i) => {
    const t = (i / glyphs.length) * Math.PI * 2 + 0.3;
    ctx.fillText(g, cx + Math.cos(t) * 54, cy + Math.sin(t) * 54);
  });

  // smudge where someone stepped on it
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.beginPath();
  ctx.ellipse(cx + 38, cy + 30, 9, 5, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Candle({ x, z, h, wax, lean = 0 }: { x: number; z: number; h: number; wax: string; lean?: number }) {
  const flame = useRef<THREE.Sprite>(null);
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const waxMat = useMemo(() => std({ color: wax, roughness: 0.8 }), [wax]);
  const puddle = useMemo(() => std({ color: wax, roughness: 0.6 }), [wax]);
  const wick = useMemo(() => std({ color: "#1a1410" }), []);
  const off = useMemo(() => Math.random() * 10, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime + off;
    if (flame.current) {
      const f = 1 + Math.sin(t * 9) * 0.1 + Math.sin(t * 21) * 0.06;
      flame.current.scale.set(0.1 * f, 0.17 * (2 - f), 1);
    }
  });
  return (
    <group position={[x, 0, z]} rotation-z={lean}>
      {/* melted wax puddle */}
      <mesh position={[0, 0.006, 0]} scale={[1, 0.25, 1]} material={puddle} receiveShadow>
        <sphereGeometry args={[0.055, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, h / 2, 0]} material={waxMat} castShadow>
        <cylinderGeometry args={[0.028, 0.034, h, 7]} />
      </mesh>
      {/* drip */}
      <mesh position={[0.024, h * 0.7, 0.01]} material={waxMat}>
        <capsuleGeometry args={[0.007, h * 0.3, 2, 4]} />
      </mesh>
      <mesh position={[0, h + 0.012, 0]} material={wick}>
        <cylinderGeometry args={[0.003, 0.003, 0.02, 4]} />
      </mesh>
      <sprite ref={flame} position={[0, h + 0.06, 0]} scale={[0.1, 0.17, 1]} renderOrder={6}>
        <spriteMaterial map={glowTex} color="#ffb04a" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/** a card lying flat on the ground */
function GroundCard({
  x,
  z,
  rot,
  tex,
  scale = 1,
  lift = 0,
}: {
  x: number;
  z: number;
  rot: number;
  tex: THREE.Texture;
  scale?: number;
  lift?: number;
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.85,
        emissive: new THREE.Color("#ffffff"),
        emissiveMap: tex,
        emissiveIntensity: 0.3,
      }),
    [tex]
  );
  return (
    <group position={[x, 0.008 + lift, z]} rotation-y={rot}>
      <mesh rotation-x={-Math.PI / 2} scale={scale} material={mat} receiveShadow>
        <planeGeometry args={[0.2, 0.28]} />
      </mesh>
    </group>
  );
}

/** your drawn cards, laid in a row in the middle of the circle */
function LaidCard({ drawn, index, revealed }: { drawn: DrawnCard; index: number; revealed: boolean }) {
  const group = useRef<THREE.Group>(null);
  const back = useMemo(() => makeTarotBackTexture(), []);
  const face = useMemo(() => makeTarotFaceTexture(drawn.card), [drawn.card]);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.85, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.4 }),
    []
  );
  const grow = useRef(0);
  useFrame((_, dt) => {
    grow.current = Math.min(1, grow.current + dt * 2.5);
    const s = 1 - Math.pow(1 - grow.current, 3);
    if (group.current) {
      group.current.scale.setScalar(s);
      group.current.position.y = 0.012 + (1 - s) * 0.25;
    }
  });
  mat.map = revealed ? face : back;
  mat.emissiveMap = revealed ? face : back;
  return (
    <group ref={group} position={[(index - 1) * 0.24, 0.012, 0.04]} rotation-y={(index - 1) * -0.06}>
      <mesh rotation={[-Math.PI / 2, 0, drawn.reversed ? Math.PI : 0]} material={mat}>
        <planeGeometry args={[0.2, 0.28]} />
      </mesh>
    </group>
  );
}

export default function GroundRitual() {
  const chalkTex = useMemo(() => makeChalkTexture(), []);
  const chalkMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: chalkTex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        color: "#d8d4e6",
      }),
    [chalkTex]
  );
  const back = useMemo(() => makeTarotBackTexture(), []);
  const deckSide = useMemo(() => std({ color: "#0a0a0e" }), []);
  const light = useRef<THREE.PointLight>(null);

  // a few cards left out from earlier — fixed so the spot looks lived-in
  const loose = useMemo(() => {
    const pick = (id: number) => makeTarotFaceTexture(DECK[id]);
    return [
      { x: -0.52, z: 0.3, rot: 0.9, tex: pick(18) }, // the moon
      { x: 0.5, z: 0.55, rot: -0.5, tex: pick(16) }, // the tower
      { x: 0.36, z: -0.22, rot: 2.3, tex: back },
      { x: -0.3, z: 0.62, rot: -1.2, tex: back },
    ];
  }, [back]);

  const picked = useGame((s) => s.picked);
  const revealIdx = useGame((s) => s.revealIdx);
  const phase = useGame((s) => s.phase);
  const revealedCount = phase === "after" ? 3 : phase === "reading" ? Math.min(3, revealIdx + 1) : 0;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (light.current) light.current.intensity = 2.3 + Math.sin(t * 9) * 0.18 + Math.sin(t * 23) * 0.1;
  });

  const candles = useMemo(() => {
    const waxes = ["#1c1822", "#ece6d8", "#1c1822", "#5b2a7a", "#ece6d8"];
    const heights = [0.2, 0.12, 0.26, 0.09, 0.16];
    return waxes.map((wax, i) => {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return { x: Math.cos(t) * (R + 0.04), z: Math.sin(t) * (R + 0.04), h: heights[i], wax, lean: i === 3 ? 0.18 : 0 };
    });
  }, []);

  return (
    <group position={RITUAL_POS}>
      {/* chalk circle */}
      <mesh position={[0, 0.004, 0]} rotation-x={-Math.PI / 2} material={chalkMat} renderOrder={1}>
        <planeGeometry args={[R * 2.25, R * 2.25]} />
      </mesh>

      {candles.map((c, i) => (
        <Candle key={i} {...c} />
      ))}

      {loose.map((c, i) => (
        <GroundCard key={i} {...c} />
      ))}

      {/* the rest of the deck, stacked sloppy */}
      <group position={[0.2, 0, -0.34]} rotation-y={0.4}>
        <mesh position={[0, 0.018, 0]} material={deckSide} castShadow>
          <boxGeometry args={[0.2, 0.034, 0.3]} />
        </mesh>
        <GroundCard x={0} z={0} rot={0.08} tex={back} lift={0.03} />
      </group>

      {picked.map((p, i) => (
        <LaidCard key={p.uid} drawn={p} index={i} revealed={i < revealedCount} />
      ))}

      {/* low warm candle glow — lights their faces from below */}
      <pointLight ref={light} position={[0, 0.35, 0]} color="#ff9a3c" intensity={2.3} distance={4} decay={2} />
      <Puff position={[0, 0.3, -0.44]} count={4} rise={1.4} opacity={0.045} speed={0.18} spread={0.2} />
    </group>
  );
}
