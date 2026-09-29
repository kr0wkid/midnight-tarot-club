import * as THREE from "three";
import type { TarotCard } from "./tarot";
import { bannerText, getCardTheme } from "./tarotStyle";
import { cardSrc, CARD_BACK_SRC } from "./cardAssets";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function toTex(c: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  return tex;
}

const INK = "#0a0a0e";
const PAPER_YELLOW = "#ffe600";
const EYE_YELLOW = "#e8ff00";
const EYE_GREEN = "#39ff14";
const EYE_PINK = "#ff2a7f";
const CLOUD = "#c86bff";

/** card art is 50x70 (5:7) — canvas is an integer 2x so pixels stay even */
const ART_W = 100;
const ART_H = 140;
/** the legacy procedural art draws at this size, then gets blitted in */
const LEGACY_W = 96;
const LEGACY_H = 144;

/**
 * A stable texture that starts out as the legacy procedural art (so the card
 * is never blank) and swaps to the pixel-art PNG the moment it decodes.
 */
function imageTexture(url: string, drawFallback: (ctx: CanvasRenderingContext2D) => void) {
  const target = canvas(ART_W, ART_H);
  const fb = canvas(LEGACY_W, LEGACY_H);
  drawFallback(fb.ctx);
  target.ctx.drawImage(fb.c, 0, 0, ART_W, ART_H);
  const tex = toTex(target.c);

  const img = new Image();
  img.onload = () => {
    target.ctx.clearRect(0, 0, ART_W, ART_H);
    target.ctx.imageSmoothingEnabled = false;
    target.ctx.drawImage(img, 0, 0, ART_W, ART_H);
    tex.needsUpdate = true;
  };
  img.onerror = () => console.warn("[tarotArt] card art failed to load:", url);
  img.src = url;
  return tex;
}

/** draw a chunky pixel lightning bolt */
function bolt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  flip: boolean,
  color: string
) {
  const s = flip ? -1 : 1;
  let cx = x;
  let cy = y;
  ctx.fillStyle = color;
  const segs = Math.max(3, Math.floor(len / 7));
  for (let i = 0; i < segs; i++) {
    const w = i % 2 === 0 ? 3 : 2;
    ctx.fillRect(cx, cy, w, 5);
    cx += s * (i % 2 === 0 ? 3 : -2);
    cy += 5;
  }
  // tip
  ctx.fillRect(cx, cy, 2, 3);
}

/** legacy neon-punk card back (fallback art under the pixel PNG) */
function drawLegacyBack(ctx: CanvasRenderingContext2D) {
  const W = LEGACY_W;
  const H = LEGACY_H;

  // black card stock
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // thin neon rim
  ctx.fillStyle = "#ff2a7f";
  ctx.fillRect(3, 3, W - 6, 1);
  ctx.fillRect(3, H - 4, W - 6, 1);
  ctx.fillRect(3, 3, 1, H - 6);
  ctx.fillRect(W - 4, 3, 1, H - 6);

  const midX = W / 2;
  const midY = H / 2 - 2;

  // corner clouds — flat purple blobs, kept small
  ctx.fillStyle = CLOUD;
  const cloud = (cx: number, cy: number) => {
    ctx.fillRect(cx - 10, cy - 4, 20, 8);
    ctx.fillRect(cx - 6, cy - 8, 12, 16);
    ctx.fillRect(cx - 13, cy - 1, 26, 3);
  };
  cloud(16, 16);
  cloud(W - 16, 16);
  cloud(16, H - 16);
  cloud(W - 16, H - 16);

  // lightning — 4 bolts only, breathing room preserved
  bolt(ctx, midX - 24, 26, 34, false, EYE_GREEN);
  bolt(ctx, midX + 22, 26, 34, true, EYE_GREEN);
  bolt(ctx, midX - 24, midY + 26, 30, true, EYE_GREEN);
  bolt(ctx, midX + 22, midY + 26, 30, false, EYE_GREEN);

  // pink halo ring behind the eye
  ctx.fillStyle = EYE_PINK;
  ctx.beginPath();
  ctx.ellipse(midX, midY, 27, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(midX, midY, 24, 12.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // the eye — acid yellow sclera, green iris, pink slit
  ctx.fillStyle = EYE_YELLOW;
  ctx.beginPath();
  ctx.ellipse(midX, midY, 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // black outline
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(midX, midY, 22, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  // iris
  ctx.fillStyle = EYE_GREEN;
  ctx.beginPath();
  ctx.ellipse(midX, midY, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(midX, midY, 9, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  // slit pupil
  ctx.fillStyle = EYE_PINK;
  ctx.beginPath();
  ctx.ellipse(midX, midY, 3.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // glint
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(midX - 14, midY - 5, 3, 3);

  // two pink teardrops above / below
  ctx.fillStyle = EYE_PINK;
  ctx.fillRect(midX - 2, 44, 4, 7);
  ctx.fillRect(midX - 1, 42, 2, 2);
  ctx.fillRect(midX - 2, midY + 30, 4, 7);
  ctx.fillRect(midX - 1, midY + 37, 2, 2);
}

let backTex: THREE.Texture | null = null;

/** the card back — pixel art PNG, legacy neon eye as fallback */
export function makeTarotBackTexture() {
  if (backTex) return backTex;
  backTex = imageTexture(CARD_BACK_SRC, drawLegacyBack);
  return backTex;
}

/** legacy neon-punk face (fallback art under the pixel PNG) */
function drawLegacyFace(ctx: CanvasRenderingContext2D, card: TarotCard) {
  const W = LEGACY_W;
  const H = LEGACY_H;
  const theme = getCardTheme(card);

  // black stock
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // art window
  const ax = 6;
  const ay = 6;
  const aw = W - 12;
  const ah = 106;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(ax, ay, aw, ah);

  // halftone dots — sparse, one shade darker
  ctx.fillStyle = theme.deep;
  for (let y = ay + 4; y < ay + ah - 2; y += 7) {
    for (let x = ax + 4 + ((y / 7) % 2) * 3; x < ax + aw - 2; x += 7) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // two accent bolts at the edges — frame, don't fill
  bolt(ctx, ax + 5, ay + 8, 26, false, theme.accent);
  bolt(ctx, ax + aw - 8, ay + ah - 34, 26, true, theme.accent);

  // corner pips
  ctx.fillStyle = INK;
  ctx.fillRect(ax + 2, ay + 2, 4, 4);
  ctx.fillRect(ax + aw - 6, ay + 2, 4, 4);

  // numeral badge top-left
  ctx.fillStyle = INK;
  const label = card.numeral;
  const bw = 8 + label.length * 6;
  ctx.fillRect(ax + 5, ay + 5, bw, 11);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, ax + 9, ay + 7);

  // suit / arcana tag top-right
  const tag = card.arcana === "major" ? "★" : card.suit?.slice(0, 1).toUpperCase() ?? "";
  ctx.fillStyle = INK;
  ctx.fillRect(ax + aw - 16, ay + 5, 11, 11);
  ctx.fillStyle = theme.accent;
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText(tag, ax + aw - 10, ay + 7);

  // hero glyph — huge, thick black outline, white face
  const cx = W / 2;
  const cy = ay + ah / 2 + 8;
  ctx.font = "52px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.strokeText(card.icon, cx, cy);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(card.icon, cx, cy);
  // accent underline glow
  ctx.fillStyle = theme.accent;
  ctx.fillRect(cx - 20, cy + 22, 40, 3);
  ctx.fillStyle = INK;
  ctx.fillRect(cx - 20, cy + 25, 40, 1);
  ctx.textBaseline = "alphabetic";

  // yellow title plate
  const py = ay + ah + 4;
  const ph = H - py - 6;
  ctx.fillStyle = PAPER_YELLOW;
  ctx.fillRect(ax, py, aw, ph);
  ctx.fillStyle = INK;
  ctx.fillRect(ax, py, aw, 2);
  ctx.fillRect(ax, py + ph - 2, aw, 2);

  const text = bannerText(card);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  if (text.length <= 12) {
    ctx.font = "bold 10px monospace";
    ctx.fillText(text + ".", W / 2, py + 13);
  } else {
    // two tight lines
    const words = text.split(" ");
    const mid = Math.ceil(words.length / 2);
    const l1 = words.slice(0, mid).join(" ");
    const l2 = words.slice(mid).join(" ") + ".";
    ctx.font = "bold 8px monospace";
    ctx.fillText(l1, W / 2, py + 8);
    ctx.fillText(l2, W / 2, py + 17);
  }
}

const faceCache = new Map<number, THREE.Texture>();

/** a card face — pixel art PNG, legacy neon-punk art as fallback */
export function makeTarotFaceTexture(card: TarotCard) {
  const hit = faceCache.get(card.id);
  if (hit) return hit;
  const tex = imageTexture(cardSrc(card), (ctx) => drawLegacyFace(ctx, card));
  faceCache.set(card.id, tex);
  return tex;
}

let bubbleTex: THREE.Texture | null = null;

/** little speech bubble shown over whoever is talking */
export function makeBubbleTexture() {
  if (bubbleTex) return bubbleTex;
  const { c, ctx } = canvas(48, 32);
  ctx.clearRect(0, 0, 48, 32);
  ctx.fillStyle = "rgba(10,8,18,0.92)";
  ctx.beginPath();
  ctx.roundRect(2, 2, 44, 22, 6);
  ctx.fill();
  ctx.fillStyle = "#f4f1ff";
  ctx.fillRect(12, 11, 4, 4);
  ctx.fillRect(22, 11, 4, 4);
  ctx.fillRect(32, 11, 4, 4);
  ctx.fillStyle = "rgba(10,8,18,0.92)";
  ctx.beginPath();
  ctx.moveTo(20, 24);
  ctx.lineTo(26, 30);
  ctx.lineTo(30, 24);
  ctx.closePath();
  ctx.fill();
  bubbleTex = toTex(c);
  return bubbleTex;
}
