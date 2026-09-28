import { useMemo } from "react";
import * as THREE from "three";
import { makeGlowTexture, rng } from "./textures";

/* ------------------------------------------------------------------ */
/*  Japanese-style drink vending machine (jidōhanbaiki)                */
/*  Blue body, yellow trim, steady backlit display. Calm background    */
/*  prop — no flicker, no vertex snapping, just a soft cold glow.      */
/* ------------------------------------------------------------------ */

const BLUE = "#1d56c4";
const BLUE_DARK = "#153f94";
const YELLOW = "#ffd21f";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function pix(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** backlit display: 3 shelves of tiny cans + price buttons */
function makeDisplayTexture() {
  const W = 48;
  const H = 64;
  const { c, ctx } = canvas(W, H);
  const r = rng(808);
  ctx.fillStyle = "#eef7ff";
  ctx.fillRect(0, 0, W, H);
  const cans = ["#2a7dff", "#ffd21f", "#ffffff", "#2ad17d", "#ff8a1f", "#1a1a22", "#6fe0ff", "#e8323c", "#c8e6ff", "#ffe98a"];
  for (let row = 0; row < 3; row++) {
    const y0 = 3 + row * 20;
    ctx.fillStyle = "#a9bccf";
    ctx.fillRect(0, y0 + 13, W, 2);
    for (let i = 0; i < 6; i++) {
      const x = 3 + i * 7;
      ctx.fillStyle = cans[(r() * cans.length) | 0];
      ctx.fillRect(x, y0 + 2, 5, 11);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(x + 1, y0 + 3, 1, 9);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(x, y0 + 6, 5, 2);
      ctx.fillStyle = "#b8c2cc";
      ctx.fillRect(x, y0 + 1, 5, 1);
      // price button
      ctx.fillStyle = "#1a1a22";
      ctx.fillRect(x, y0 + 16, 5, 3);
      ctx.fillStyle = r() < 0.85 ? "#2a9dff" : YELLOW;
      ctx.fillRect(x + 1, y0 + 17, 3, 1);
    }
  }
  return pix(c);
}

/** lower body: yellow band, coin slot, pickup bay */
function makeBodyTexture() {
  const W = 32;
  const H = 32;
  const { c, ctx } = canvas(W, H);
  const r = rng(909);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  for (let i = 0; i < 40; i++) ctx.fillRect((r() * W) | 0, (r() * H) | 0, 1, 1);
  // yellow band with label
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 2, W, 5);
  ctx.fillStyle = BLUE_DARK;
  ctx.font = "bold 5px monospace";
  ctx.fillText("つめた~い", 2, 6);
  // coin + note slot
  ctx.fillStyle = "#12141c";
  ctx.fillRect(24, 10, 5, 8);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(26, 11, 1, 3);
  ctx.fillStyle = "#c8ccd4";
  ctx.fillRect(25, 15, 3, 1);
  // pickup bay with yellow lip
  ctx.fillStyle = "#0b0d14";
  ctx.fillRect(3, 21, 18, 8);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(3, 20, 18, 1);
  return pix(c);
}

export default function VendingMachine({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  const displayTex = useMemo(() => makeDisplayTexture(), []);
  const bodyTex = useMemo(() => makeBodyTexture(), []);
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const shell = useMemo(() => new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.55, metalness: 0.15 }), []);
  const front = useMemo(() => new THREE.MeshStandardMaterial({ map: bodyTex, roughness: 0.6 }), [bodyTex]);
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: YELLOW, roughness: 0.45, metalness: 0.1 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#12141c", roughness: 0.8 }), []);

  const W = 0.9;
  const H = 1.82;
  const D = 0.7;
  const winY = H * 0.66;

  return (
    <group position={position} rotation-y={rotation}>
      {/* cabinet */}
      <mesh position={[0, H / 2, 0]} material={shell} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
      </mesh>
      {/* yellow roof lip + lit header strip */}
      <mesh position={[0, H + 0.03, 0.02]} material={trim} castShadow>
        <boxGeometry args={[W + 0.04, 0.06, D + 0.06]} />
      </mesh>
      <mesh position={[0, H - 0.07, D / 2 + 0.003]}>
        <planeGeometry args={[W - 0.08, 0.08]} />
        <meshBasicMaterial color="#ffe56b" toneMapped={false} />
      </mesh>

      {/* display window */}
      <mesh position={[-0.06, winY, D / 2 + 0.002]}>
        <planeGeometry args={[0.66, 0.9]} />
        <meshBasicMaterial map={displayTex} color="#e6f0ff" toneMapped={false} />
      </mesh>
      {/* yellow frame */}
      {[winY + 0.47, winY - 0.47].map((y) => (
        <mesh key={y} position={[-0.06, y, D / 2 + 0.01]} material={trim}>
          <boxGeometry args={[0.72, 0.04, 0.02]} />
        </mesh>
      ))}
      {[-0.41, 0.29].map((x) => (
        <mesh key={x} position={[x, winY, D / 2 + 0.01]} material={trim}>
          <boxGeometry args={[0.04, 0.98, 0.02]} />
        </mesh>
      ))}

      {/* side control strip */}
      <mesh position={[0.37, winY, D / 2 + 0.005]} material={dark}>
        <planeGeometry args={[0.1, 0.8]} />
      </mesh>
      <mesh position={[0.37, H * 0.8, D / 2 + 0.01]}>
        <planeGeometry args={[0.06, 0.04]} />
        <meshBasicMaterial color="#6fd0ff" toneMapped={false} />
      </mesh>

      {/* lower panel */}
      <mesh position={[0, H * 0.2, D / 2 + 0.002]} material={front}>
        <planeGeometry args={[W - 0.06, H * 0.36]} />
      </mesh>
      {/* feet */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.02, 0]} material={dark}>
          <boxGeometry args={[0.12, 0.04, D - 0.1]} />
        </mesh>
      ))}

      {/* steady glow + cool light spill */}
      <sprite position={[-0.06, winY, D / 2 + 0.15]} scale={[1.5, 1.7, 1]} renderOrder={5}>
        <spriteMaterial map={glowTex} color="#cfe6ff" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight position={[0, 1.1, D / 2 + 0.55]} color="#d6ecff" intensity={4.5} distance={5} decay={2} />
    </group>
  );
}
