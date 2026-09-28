import * as THREE from "three";
import { rng } from "./textures";

/* ------------------------------------------------------------------ */
/*  Pixel-art textures for the low-poly anime girls (DS / PS1 style)   */
/*  Painted pixel-by-pixel on tiny canvases, sampled with Nearest.     */
/* ------------------------------------------------------------------ */

type Ctx = CanvasRenderingContext2D;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function toTex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 1;
  return t;
}

/** lighten (amt > 0) or darken (amt < 0) a #rrggbb colour */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt < 0) {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  } else {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  }
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

const px = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

function speckle(ctx: Ctx, x: number, y: number, w: number, h: number, n: number, colors: string[], r: () => number) {
  for (let i = 0; i < n; i++) px(ctx, x + ((r() * w) | 0), y + ((r() * h) | 0), 1, 1, colors[(r() * colors.length) | 0]);
}

function sprite(ctx: Ctx, rows: string[], x0: number, y0: number, c: string, s = 1) {
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === "#") px(ctx, x0 + x * s, y0 + y * s, s, s, c);
    })
  );
}

const INK = "#1b1224";
const STAR_OUT = ["....#....", "...#.#...", "...#.#...", "####.####", "#.......#", ".#.....#.", "..#...#..", ".#..#..#.", "##.#.#.##"];
const NINE = [".###.", "#...#", "#...#", ".####", "....#", "#...#", ".###."];
const LETTER_U = ["#...#", "#...#", "#...#", "#...#", ".###."];
const SKULL = [".###.", "#.#.#", "#####", ".###.", ".#.#."];

/* ------------------------------------------------------------------ */
/*  FACE — full sphere wrap (u = 0.25 → canvas x 32 is the front)      */
/* ------------------------------------------------------------------ */
export type EyeStyle = "sparkle" | "sleepy" | "sharp";
export type MouthStyle = "fang" | "grin" | "smirk";
export type FaceMark = "mole" | "sticker" | "bandaid" | null;

export interface FaceSpec {
  skin: string;
  hair: string;
  eye: string;
  blush: string;
  eyeStyle: EyeStyle;
  mouth: MouthStyle;
  mark: FaceMark;
}

function paintEye(ctx: Ctx, ex: number, ey: number, outer: -1 | 1, f: FaceSpec, open: boolean) {
  const o = (d: number) => ex + outer * d;
  const eyeDark = shade(f.eye, -0.55);
  const eyeLight = shade(f.eye, 0.45);
  const lid = shade(f.skin, -0.3);

  if (!open) {
    if (f.eyeStyle === "sleepy") {
      px(ctx, ex - 4, ey + 5, 9, 1, INK);
      px(ctx, o(5), ey + 6, 1, 1, INK);
    } else {
      px(ctx, ex - 3, ey + 6, 7, 1, INK);
      px(ctx, ex - 4, ey + 5, 1, 1, INK);
      px(ctx, ex + 4, ey + 5, 1, 1, INK);
      px(ctx, o(5), ey + 4, 1, 1, INK);
    }
    return;
  }

  if (f.eyeStyle === "sparkle") {
    // big round shoujo eye
    px(ctx, ex - 4, ey + 1, 9, 8, "#fbf7ff");
    for (let i = 0; i < 8; i++) {
      const w = i >= 6 ? 5 : 7;
      const col = i < 2 ? eyeDark : i < 5 ? f.eye : eyeLight;
      px(ctx, ex - (w >> 1), ey + 1 + i, w, 1, col);
    }
    px(ctx, ex - 1, ey + 3, 3, 3, INK);
    px(ctx, ex - 3, ey + 2, 2, 2, "#ffffff");
    px(ctx, ex + 1, ey + 2, 1, 1, "#ffffff");
    px(ctx, ex + 2, ey + 6, 1, 1, "#ffffff");
    px(ctx, ex - 4, ey - 1, 9, 2, INK);
    px(ctx, ex - 3, ey - 2, 7, 1, INK);
    px(ctx, o(5), ey - 2, 1, 2, INK);
    px(ctx, o(6), ey - 3, 1, 2, INK);
    px(ctx, o(7), ey - 3, 1, 1, INK);
    px(ctx, o(4), ey + 8, 1, 1, INK);
    px(ctx, ex - 2, ey + 9, 5, 1, lid);
  } else if (f.eyeStyle === "sleepy") {
    // heavy, half-lidded, unbothered
    px(ctx, ex - 4, ey + 4, 9, 5, "#fbf7ff");
    for (let i = 0; i < 5; i++) {
      const w = i >= 4 ? 5 : 7;
      const col = i < 1 ? eyeDark : i < 3 ? f.eye : eyeLight;
      px(ctx, ex - (w >> 1), ey + 4 + i, w, 1, col);
    }
    px(ctx, ex - 1, ey + 4, 3, 2, INK);
    px(ctx, ex - 3, ey + 5, 1, 1, "#ffffff");
    px(ctx, ex - 4, ey + 2, 9, 2, INK);
    px(ctx, o(5), ey + 3, 1, 2, INK);
    px(ctx, o(6), ey + 4, 1, 1, INK);
    px(ctx, ex - 3, ey, 7, 1, lid);
    px(ctx, ex - 3, ey + 9, 6, 1, lid);
  } else {
    // sharp sanpaku eye, tiny pupil, upswept liner
    px(ctx, ex - 4, ey + 2, 9, 6, "#fbf7ff");
    for (let i = 0; i < 5; i++) {
      const w = i === 0 || i === 4 ? 3 : 5;
      const col = i < 1 ? eyeDark : i < 3 ? f.eye : eyeLight;
      px(ctx, ex - (w >> 1), ey + 2 + i, w, 1, col);
    }
    px(ctx, ex, ey + 3, 1, 2, INK);
    px(ctx, ex + 1, ey + 3, 1, 1, "#ffffff");
    px(ctx, ex - 4, ey, 9, 2, INK);
    px(ctx, o(5), ey, 1, 1, INK);
    px(ctx, o(6), ey - 1, 1, 1, INK);
    px(ctx, o(7), ey - 2, 1, 1, INK);
    px(ctx, ex - 3, ey + 8, 7, 1, INK);
    px(ctx, o(5), ey + 7, 1, 1, INK);
  }
}

function paintBrow(ctx: Ctx, ex: number, ey: number, outer: -1 | 1, f: FaceSpec) {
  const c = shade(f.hair, -0.35);
  if (f.eyeStyle === "sparkle") {
    px(ctx, ex - 3, ey - 5, 6, 1, c);
    px(ctx, ex + outer * 3, ey - 4, 1, 1, c);
  } else if (f.eyeStyle === "sleepy") {
    px(ctx, ex - 3, ey - 3, 7, 1, c);
  } else {
    // slanting down toward the nose — cool / unimpressed
    px(ctx, ex - 3, ey - 4, 7, 1, c);
    px(ctx, ex - outer * 3, ey - 3, 2, 1, c);
  }
}

function paintHead(f: FaceSpec, eyesOpen: boolean, mouthOpen: boolean) {
  const { c, ctx } = canvas(128, 64);
  const skinShade = shade(f.skin, -0.13);
  const hairDark = shade(f.hair, -0.35);

  px(ctx, 0, 0, 128, 64, f.skin);
  px(ctx, 10, 24, 4, 40, skinShade);
  px(ctx, 50, 24, 4, 40, skinShade);
  px(ctx, 10, 56, 44, 8, skinShade);

  // scalp hair everywhere except the face window
  for (let x = 0; x < 128; x++) {
    const inFace = x >= 10 && x < 54;
    px(ctx, x, 0, 1, inFace ? 22 : 58, x % 5 === 0 ? hairDark : f.hair);
  }

  const ey = 30;
  paintBrow(ctx, 25, ey, -1, f);
  paintBrow(ctx, 39, ey, 1, f);
  paintEye(ctx, 25, ey, -1, f, eyesOpen);
  paintEye(ctx, 39, ey, 1, f, eyesOpen);

  // blush hatching
  for (let i = 0; i < 3; i++) {
    px(ctx, 19 + i * 2, 42, 1, 1, f.blush);
    px(ctx, 18 + i * 2, 43, 1, 1, f.blush);
    px(ctx, 41 + i * 2, 42, 1, 1, f.blush);
    px(ctx, 40 + i * 2, 43, 1, 1, f.blush);
  }
  px(ctx, 32, 43, 1, 1, shade(f.skin, -0.28)); // nose

  // marks
  if (f.mark === "mole") px(ctx, 36, 48, 1, 1, shade(f.skin, -0.55));
  if (f.mark === "sticker") {
    const s = "#ffe14f";
    px(ctx, 46, 38, 1, 5, s);
    px(ctx, 44, 40, 5, 1, s);
    px(ctx, 46, 40, 1, 1, "#ffffff");
  }
  if (f.mark === "bandaid") {
    px(ctx, 28, 40, 9, 3, "#e8c4a0");
    px(ctx, 28, 40, 9, 1, "#f2d6b8");
    px(ctx, 31, 41, 1, 1, "#b98f6c");
    px(ctx, 33, 41, 1, 1, "#b98f6c");
  }

  // mouth
  const M = "#5e1c2c";
  if (mouthOpen) {
    if (f.mouth === "smirk") {
      px(ctx, 31, 46, 4, 2, "#3a0f1e");
      px(ctx, 32, 47, 2, 1, "#e2667f");
    } else {
      px(ctx, 30, 46, 5, 3, "#3a0f1e");
      px(ctx, 31, 48, 3, 1, "#e2667f");
      if (f.mouth === "grin") px(ctx, 30, 46, 5, 1, "#fbf7ff");
      if (f.mouth === "fang") px(ctx, 33, 46, 1, 1, "#ffffff");
    }
  } else if (f.mouth === "fang") {
    [[29, 47], [30, 48], [31, 48], [32, 47], [33, 48], [34, 48], [35, 47]].forEach(([x, y]) => px(ctx, x, y, 1, 1, M));
    px(ctx, 33, 49, 1, 1, "#ffffff");
  } else if (f.mouth === "grin") {
    px(ctx, 29, 46, 1, 1, M);
    px(ctx, 30, 47, 5, 1, M);
    px(ctx, 35, 46, 1, 1, M);
  } else {
    px(ctx, 30, 48, 4, 1, M);
    px(ctx, 34, 47, 1, 1, M);
  }
  return toTex(c);
}

/** [open/shut, open/talk, blink/shut, blink/talk] */
export function makeFaceSet(f: FaceSpec) {
  return [paintHead(f, true, false), paintHead(f, true, true), paintHead(f, false, false), paintHead(f, false, true)];
}

/* ------------------------------------------------------------------ */
/*  HAIR                                                               */
/* ------------------------------------------------------------------ */
export type BangStyle = "blunt" | "messy" | "spiky";

export interface HairSpec {
  hair: string;
  under?: string;
  bang: BangStyle;
  bangLen: number;
  sideLen: number;
  backLen: number;
}

/** partial-sphere hair shell with alpha-cut jagged edges */
export function makeHairShellTexture(h: HairSpec, seed: number) {
  const W = 128;
  const H = 64;
  const { c, ctx } = canvas(W, H);
  ctx.clearRect(0, 0, W, H);
  const r = rng(seed + 77);
  const dark = shade(h.hair, -0.3);
  const darker = shade(h.hair, -0.45);
  const light = shade(h.hair, 0.4);
  const messy = [0, 3, 6, 2, 5, 1, 4];

  for (let x = 0; x < W; x++) {
    let d = Math.abs(x - 32);
    d = Math.min(d, W - d);
    const tri = x % 6 < 3 ? (x % 6) * 3 : (6 - (x % 6)) * 3;
    let len: number;
    if (d < 15) {
      if (h.bang === "blunt") len = h.bangLen - (d > 12 ? 1 : 0);
      else if (h.bang === "messy") len = h.bangLen + messy[x % 7] - (d < 2 ? 3 : 0);
      else len = h.bangLen + tri - 2;
    } else if (d < 21) {
      len = h.sideLen + (h.bang === "blunt" ? 0 : (r() * 6) | 0);
    } else {
      len = h.backLen + (h.bang === "spiky" ? tri : h.bang === "messy" ? (r() * 5) | 0 : 0);
    }
    len = Math.min(len, H);
    for (let y = 0; y < len; y++) {
      let col = x % 6 === 0 ? dark : h.hair;
      if (y >= 15 && y <= 17 && x % 3 !== 0 && (x < 70 || x > 118)) col = light; // angel ring
      if (h.under && d >= 15 && y >= len - 7) col = x % 6 === 0 ? shade(h.under, -0.2) : h.under;
      if (y >= len - 2) col = h.under && d >= 15 ? shade(h.under, -0.3) : darker;
      px(ctx, x, y, 1, 1, col);
    }
  }
  return toTex(c);
}

/** long back-hair curtain (canvas top = scalp, jagged transparent bottom) */
export function makeHairCurtainTexture(h: HairSpec, seed: number) {
  const { c, ctx } = canvas(32, 64);
  ctx.clearRect(0, 0, 32, 64);
  const r = rng(seed + 91);
  const dark = shade(h.hair, -0.3);
  const darker = shade(h.hair, -0.45);
  const light = shade(h.hair, 0.3);
  for (let x = 0; x < 32; x++) {
    const len = 64 - (x % 4 === 0 ? 2 : 0) - ((r() * 9) | 0) - (x % 7 < 2 ? 5 : 0);
    for (let y = 0; y < len; y++) {
      let col = x % 4 === 0 ? dark : h.hair;
      if (y >= 5 && y <= 7 && x % 3 !== 0) col = light;
      if (y >= len - 3) col = darker;
      px(ctx, x, y, 1, 1, col);
    }
  }
  return toTex(c);
}

/* ------------------------------------------------------------------ */
/*  HEADWEAR                                                           */
/* ------------------------------------------------------------------ */
export function makeKnitTexture(color: string) {
  const { c, ctx } = canvas(32, 32);
  const d = shade(color, -0.2);
  const l = shade(color, 0.18);
  px(ctx, 0, 0, 32, 32, color);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const k = x % 4;
      if ((k === 0 && y % 2 === 0) || (k === 3 && y % 2 === 1)) px(ctx, x, y, 1, 1, d);
      else if (k === 1 && y % 2 === 0) px(ctx, x, y, 1, 1, l);
    }
  }
  return toTex(c);
}

export function makeCamoTexture() {
  const { c, ctx } = canvas(32, 32);
  const r = rng(404);
  px(ctx, 0, 0, 32, 32, "#6b6f48");
  const cols = ["#3f4429", "#8a8558", "#2b2d1e", "#565c38"];
  for (let i = 0; i < 26; i++) {
    const col = cols[(r() * cols.length) | 0];
    const x = (r() * 32) | 0;
    const y = (r() * 32) | 0;
    px(ctx, x, y, 3 + ((r() * 4) | 0), 2 + ((r() * 3) | 0), col);
    px(ctx, x + 1, y + 1, 2 + ((r() * 4) | 0), 3, col);
  }
  return toTex(c);
}

/* ------------------------------------------------------------------ */
/*  TOPS — lathe wrap (x 32 = front, x 0/64 = back, top = neck)        */
/* ------------------------------------------------------------------ */
export type TopStyle = "cami" | "jersey" | "bikini";

export interface TopSpec {
  seed: number;
  skin: string;
  style: TopStyle;
  main: string;
  accent: string;
  trim: string;
  under?: string;
  waist?: string;
}

export function makeTorsoTexture(t: TopSpec) {
  const { c, ctx } = canvas(64, 64);
  const r = rng(t.seed + 1);
  const skinS = shade(t.skin, -0.12);

  px(ctx, 0, 0, 64, 64, t.skin);
  ctx.globalAlpha = 0.5;
  px(ctx, 0, 0, 8, 64, skinS);
  px(ctx, 56, 0, 8, 64, skinS);
  ctx.globalAlpha = 1;
  px(ctx, 32, 45, 1, 2, shade(t.skin, -0.32)); // navel
  px(ctx, 26, 5, 4, 1, skinS); // collarbones
  px(ctx, 34, 5, 4, 1, skinS);

  if (t.style === "cami") {
    const fold = shade(t.main, 0.14);
    px(ctx, 0, 9, 64, 31, t.main);
    for (let y = 9; y < 14; y++) {
      const w = 6 - (y - 9);
      if (w > 0) px(ctx, 32 - w, y, w * 2, 1, t.skin);
    }
    for (let y = 9; y < 12; y++) {
      const w = 5 - (y - 9) * 2;
      if (w > 0) {
        px(ctx, 0, y, w, 1, t.skin);
        px(ctx, 64 - w, y, w, 1, t.skin);
      }
    }
    [24, 38, 6, 56].forEach((x) => px(ctx, x, 0, 2, 10, t.main));
    for (let i = 0; i < 7; i++) px(ctx, 8 + ((r() * 48) | 0), 18 + ((r() * 20) | 0), 3, 1, fold);
    for (let x = 0; x < 64; x += 3) px(ctx, x, 40, 2, 1, t.main);
    sprite(ctx, STAR_OUT, 24, 16, t.accent);
  } else if (t.style === "jersey") {
    const tee = t.under ?? "#b9bccb";
    const dark = shade(t.main, -0.25);
    px(ctx, 0, 0, 64, 64, tee);
    px(ctx, 0, 5, 64, 59, t.main);
    px(ctx, 0, 5, 64, 1, t.trim);
    for (const xc of [16, 48]) {
      for (let y = 5; y < 24; y++) {
        const w = Math.max(0, Math.round(6 - Math.max(0, y - 13) * 0.6));
        if (w > 0) {
          px(ctx, xc - w, y, w * 2, 1, tee);
          px(ctx, xc - w - 1, y, 1, 1, t.trim);
          px(ctx, xc + w, y, 1, 1, t.trim);
        }
      }
      px(ctx, xc - 1, 24, 2, 40, t.trim); // side panel stripe
    }
    for (let y = 5; y < 17; y++) {
      const w = Math.max(1, Math.round((17 - y) / 2));
      px(ctx, 32 - w, y, w * 2, 1, tee);
      px(ctx, 32 - w - 1, y, 1, 1, t.trim);
      px(ctx, 32 + w, y, 1, 1, t.trim);
    }
    sprite(ctx, LETTER_U, 35, 22, t.accent);
    for (const ox of [0, 64]) {
      sprite(ctx, NINE, ox - 11, 20, t.accent, 2);
      sprite(ctx, NINE, ox + 1, 20, t.accent, 2);
    }
    speckle(ctx, 0, 24, 64, 36, 40, [dark], r);
    px(ctx, 0, 60, 64, 4, dark);
  } else {
    for (let i = 0; i < 10; i++) {
      const w = 2 + Math.floor(i * 0.8);
      const col = i % 2 === 0 ? t.main : t.accent;
      px(ctx, 27 - (w >> 1), 14 + i, w, 1, col);
      px(ctx, 37 - (w >> 1), 14 + i, w, 1, col);
    }
    for (let y = 0; y < 14; y++) {
      px(ctx, 26 + Math.floor((14 - y) / 5), y, 1, 1, t.main);
      px(ctx, 37 - Math.floor((14 - y) / 5), y, 1, 1, t.main);
    }
    px(ctx, 0, 23, 22, 1, t.main);
    px(ctx, 42, 23, 22, 1, t.main);
    px(ctx, 0, 22, 2, 3, t.main);
    px(ctx, 62, 22, 2, 3, t.main);
    px(ctx, 32, 17, 1, 5, skinS);
  }

  if (t.waist) {
    px(ctx, 0, 53, 64, 11, t.waist);
    px(ctx, 0, 53, 64, 1, shade(t.waist, 0.25));
    px(ctx, 30, 54, 1, 6, "#f4f1ea");
    px(ctx, 34, 54, 1, 5, "#f4f1ea");
  }
  return toTex(c);
}

/* ------------------------------------------------------------------ */
/*  BOTTOMS                                                            */
/* ------------------------------------------------------------------ */
export function makeSkirtTexture(main: string, belt: string, seed: number) {
  const { c, ctx } = canvas(64, 32);
  const r = rng(seed + 11);
  const d = shade(main, -0.2);
  const dd = shade(main, -0.36);
  const l = shade(main, 0.15);
  px(ctx, 0, 0, 64, 32, main);
  speckle(ctx, 0, 0, 64, 32, 160, [d, l], r);
  px(ctx, 0, 0, 64, 5, belt);
  for (let x = 1; x < 64; x += 4) px(ctx, x, 2, 1, 1, "#e9e6ee");
  px(ctx, 28, 0, 9, 5, belt);
  sprite(ctx, SKULL, 30, 0, "#f1eee6");
  px(ctx, 28, 4, 1, 1, "#f1eee6");
  px(ctx, 36, 4, 1, 1, "#f1eee6");
  for (const xc of [16, 48]) {
    px(ctx, xc - 5, 8, 10, 10, d);
    px(ctx, xc - 5, 8, 10, 3, dd);
    px(ctx, xc, 10, 1, 1, belt);
  }
  px(ctx, 0, 21, 64, 1, dd);
  for (let x = 0; x < 64; x += 4) px(ctx, x, 22, 2, 1, d);
  px(ctx, 0, 27, 64, 1, dd);
  px(ctx, 0, 30, 64, 2, d);
  return toTex(c);
}

/** basketball shorts. stripe at u = 0.25 (left outer side) — mirror the right leg */
export function makeShortsTexture(main: string, accent: string, seed: number) {
  const { c, ctx } = canvas(32, 32);
  const r = rng(seed + 21);
  px(ctx, 0, 0, 32, 32, main);
  speckle(ctx, 0, 0, 32, 32, 60, [shade(main, 0.12), shade(main, -0.2)], r);
  px(ctx, 7, 0, 2, 32, accent);
  px(ctx, 0, 26, 32, 3, accent);
  px(ctx, 0, 29, 32, 3, shade(main, -0.2));
  return toTex(c);
}

/** track pants with three stripes at u = 0.25 — mirror the right leg */
export function makeTrackPantsTexture(main: string, accent: string, seed: number) {
  const { c, ctx } = canvas(32, 64);
  const r = rng(seed + 31);
  const d = shade(main, -0.28);
  const l = shade(main, 0.14);
  px(ctx, 0, 0, 32, 64, main);
  speckle(ctx, 0, 0, 32, 64, 120, [d, l], r);
  [5, 8, 11].forEach((x) => px(ctx, x, 0, 1, 64, accent));
  for (let i = 0; i < 6; i++) px(ctx, 14 + ((r() * 12) | 0), 20 + i * 3, 5, 1, d);
  for (let i = 0; i < 5; i++) px(ctx, 13 + ((r() * 14) | 0), 46 + i * 2, 6, 1, d);
  px(ctx, 0, 60, 32, 4, d);
  return toTex(c);
}

export function makeSockTexture(color: string) {
  const { c, ctx } = canvas(16, 32);
  const d = shade(color, -0.1);
  const dd = shade(color, -0.22);
  px(ctx, 0, 0, 16, 32, color);
  for (let x = 0; x < 16; x += 2) px(ctx, x, 0, 1, 32, d);
  [8, 14, 20, 25].forEach((y) => px(ctx, 0, y, 16, 1, dd));
  px(ctx, 0, 0, 16, 3, d);
  return toTex(c);
}

/** skin limb wrap with optional sleeve (top rows), wristband and knee */
export function makeLimbTexture(
  base: string,
  opts: { sleeve?: string; sleeveRows?: number; band?: string; bandRows?: [number, number]; kneeRow?: number } = {}
) {
  const { c, ctx } = canvas(16, 64);
  const s = shade(base, -0.13);
  px(ctx, 0, 0, 16, 64, base);
  ctx.globalAlpha = 0.55;
  px(ctx, 0, 0, 3, 64, s);
  px(ctx, 13, 0, 3, 64, s);
  ctx.globalAlpha = 1;
  if (opts.kneeRow) {
    px(ctx, 6, opts.kneeRow, 4, 1, s);
    px(ctx, 7, opts.kneeRow + 1, 2, 1, s);
  }
  if (opts.sleeve) px(ctx, 0, 0, 16, opts.sleeveRows ?? 12, opts.sleeve);
  if (opts.band && opts.bandRows) {
    px(ctx, 0, opts.bandRows[0], 16, opts.bandRows[1] - opts.bandRows[0], opts.band);
    px(ctx, 0, opts.bandRows[0], 16, 1, shade(opts.band, 0.3));
  }
  return toTex(c);
}
