import * as THREE from "three";

export const TAG_WORDS = ["EDC", "MEOW", "НОЧЬ", "2:06", "ZZZ", "CAT", "SLOW", "КОТ", "★", "PUNK", "NAP", "HISS", "DLVR", "NO$", "MEW"];
export const TAG_COLORS = ["#ff4fa3", "#4fd2ff", "#ffe14f", "#7cff4f", "#ff7a1f", "#c77dff", "#f4f4f4", "#ff3b3b"];

/** tiny deterministic PRNG so the world looks the same every load */
export function rng(seed: number) {
  let s = (Math.floor(seed) * 2654435761 + 12345) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function makeCanvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

type TexOpts = { repeat?: [number, number]; mips?: boolean; clamp?: boolean; smooth?: boolean };

function pixelTex(c: HTMLCanvasElement, opts: TexOpts = {}) {
  const { repeat = [1, 1], mips = false, clamp = false, smooth = false } = opts;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.magFilter = smooth ? THREE.LinearFilter : THREE.NearestFilter;
  tex.minFilter = mips ? THREE.LinearMipmapLinearFilter : smooth ? THREE.LinearFilter : THREE.NearestFilter;
  tex.generateMipmaps = mips;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  return tex;
}

function dots(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], r: () => number, size = 1) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[(r() * colors.length) | 0];
    ctx.fillRect((r() * w) | 0, (r() * h) | 0, size, size);
  }
}

/* ------------------------------------------------------------------ */
/*  surfaces                                                           */
/* ------------------------------------------------------------------ */

/** cracked asphalt */
export function makeAsphaltTexture(repeat = 20) {
  const { c, ctx } = makeCanvas(64);
  const r = rng(7);
  ctx.fillStyle = "#2c2c31";
  ctx.fillRect(0, 0, 64, 64);
  dots(ctx, 64, 64, 2400, ["#26262b", "#303036", "#35353b", "#222227", "#3b3b42", "#2a2a2f"], r);
  dots(ctx, 64, 64, 90, ["#4a4a52", "#1c1c20"], r);
  for (let k = 0; k < 2; k++) {
    let x = (r() * 64) | 0;
    let y = (r() * 64) | 0;
    ctx.fillStyle = "#1a1a1e";
    for (let i = 0; i < 40; i++) {
      ctx.fillRect(x, y, 1, 1);
      x = (x + ((r() * 3) | 0) - 1 + 64) % 64;
      y = (y + ((r() * 2) | 0)) % 64;
    }
  }
  return pixelTex(c, { repeat: [repeat, repeat], mips: true });
}

/** sidewalk slabs */
export function makeConcreteTexture(repeatX = 1, repeatY = 1) {
  const { c, ctx } = makeCanvas(64);
  const r = rng(11);
  ctx.fillStyle = "#5a585c";
  ctx.fillRect(0, 0, 64, 64);
  dots(ctx, 64, 64, 1800, ["#55535a", "#605e63", "#4f4d52", "#67656a", "#4a484d"], r);
  ctx.fillStyle = "#3a383c";
  ctx.fillRect(0, 31, 64, 2);
  ctx.fillRect(31, 0, 2, 64);
  return pixelTex(c, { repeat: [repeatX, repeatY], mips: true });
}

export function makeBrickTexture(repeatX = 1, repeatY = 1, tone: "red" | "grey" = "red") {
  const { c, ctx } = makeCanvas(64);
  const r = rng(tone === "red" ? 3 : 5);
  ctx.fillStyle = tone === "red" ? "#3a2c2a" : "#36363b";
  ctx.fillRect(0, 0, 64, 64);
  const bricks =
    tone === "red"
      ? ["#6b3f35", "#74483c", "#5e3730", "#7c4d40", "#66413a", "#553028"]
      : ["#5a5a60", "#63636a", "#525258", "#6b6b72", "#4c4c52"];
  const bw = 16;
  const bh = 8;
  for (let row = 0; row < 8; row++) {
    const off = row % 2 ? 8 : 0;
    for (let col = -1; col < 5; col++) {
      const x = col * bw + off;
      const y = row * bh;
      ctx.fillStyle = bricks[(r() * bricks.length) | 0];
      ctx.fillRect(x + 1, y + 1, bw - 1, bh - 1);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.06)";
        ctx.fillRect(x + 1 + ((r() * (bw - 1)) | 0), y + 1 + ((r() * (bh - 1)) | 0), 1, 1);
      }
    }
  }
  return pixelTex(c, { repeat: [repeatX, repeatY], mips: true });
}

/** painted cinder blocks (garage walls) */
export function makeBlockTexture(repeatX = 1, repeatY = 1) {
  const { c, ctx } = makeCanvas(64);
  const r = rng(21);
  ctx.fillStyle = "#4a4a48";
  ctx.fillRect(0, 0, 64, 64);
  const blocks = ["#75716a", "#7d7972", "#6c6862", "#827e76", "#706c66"];
  const bw = 32;
  const bh = 16;
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 16 : 0;
    for (let col = -1; col < 3; col++) {
      const x = col * bw + off;
      const y = row * bh;
      ctx.fillStyle = blocks[(r() * blocks.length) | 0];
      ctx.fillRect(x + 1, y + 1, bw - 1, bh - 1);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = r() < 0.6 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)";
        ctx.fillRect(x + 1 + ((r() * (bw - 1)) | 0), y + 1 + ((r() * (bh - 1)) | 0), 1, 1);
      }
    }
  }
  return pixelTex(c, { repeat: [repeatX, repeatY], mips: true });
}

/** corrugated roller shutter */
export function makeShutterTexture(repeatX = 1, repeatY = 1) {
  const { c, ctx } = makeCanvas(64);
  const r = rng(31);
  for (let y = 0; y < 64; y++) {
    const p = y % 8;
    ctx.fillStyle = p < 2 ? "#7a7d84" : p < 5 ? "#5b5e66" : p < 7 ? "#4a4d54" : "#3a3c42";
    ctx.fillRect(0, y, 64, 1);
  }
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = r() < 0.5 ? "rgba(120,70,30,0.35)" : "rgba(0,0,0,0.25)";
    ctx.fillRect((r() * 64) | 0, (r() * 64) | 0, 1 + ((r() * 2) | 0), 1);
  }
  return pixelTex(c, { repeat: [repeatX, repeatY], mips: true });
}

/** rough wooden planks */
export function makeWoodTexture(base = "#3b2a1e", repeat = 1) {
  const { c, ctx } = makeCanvas(64);
  const r = rng(41);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 8) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, 0, 1, 64);
  }
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.28)" : "rgba(255,220,180,0.07)";
    ctx.fillRect((r() * 64) | 0, (r() * 64) | 0, 1 + ((r() * 5) | 0), 1);
  }
  return pixelTex(c, { repeat: [repeat, repeat] });
}

export function makeCardboardTexture() {
  const { c, ctx } = makeCanvas(32);
  const r = rng(51);
  ctx.fillStyle = "#a5804f";
  ctx.fillRect(0, 0, 32, 32);
  dots(ctx, 32, 32, 300, ["#9c7747", "#ad8757", "#95713f", "#b08a5a"], r);
  ctx.fillStyle = "#cbb98d";
  ctx.fillRect(0, 13, 32, 6);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, 32, 1);
  ctx.fillRect(0, 31, 32, 1);
  ctx.fillRect(0, 0, 1, 32);
  ctx.fillRect(31, 0, 1, 32);
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(4, 23, 9, 2);
  ctx.fillRect(4, 26, 6, 1);
  return pixelTex(c);
}

/* ------------------------------------------------------------------ */
/*  signage & decals                                                   */
/* ------------------------------------------------------------------ */

/** a hand drawn graffiti tag: throw-up, marker scrawl or stencil */
export function makeTagTexture(word: string, color: string, seed: number) {
  const W = 160;
  const H = 80;
  const { c, ctx } = makeCanvas(W, H);
  const r = rng(seed);
  const style = (r() * 3) | 0;
  const len = Math.max(1, word.length);
  const fontSize = len >= 5 ? 38 : len === 4 ? 46 : len === 3 ? 54 : 62;
  const heavy = `900 ${fontSize}px Impact, "Arial Black", "Segoe UI Black", Haettenschweiler, sans-serif`;

  ctx.save();
  ctx.translate(W / 2, H / 2 + 3);
  ctx.rotate((r() - 0.5) * 0.2);
  ctx.transform(1, 0, (r() - 0.5) * 0.45, 1, 0, 0);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  if (style === 0) {
    ctx.font = heavy;
    ctx.lineWidth = 11;
    ctx.strokeStyle = "rgba(12,10,20,0.92)";
    ctx.strokeText(word, 0, 0);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(word, -3, -3);
    ctx.fillStyle = color;
    ctx.fillText(word, 0, 0);
    const half = ctx.measureText(word).width / 2;
    for (let i = 0; i < 4; i++) {
      const x = -half + r() * half * 2;
      const l = 6 + r() * 20;
      ctx.fillRect(x, fontSize * 0.22, 3, l);
      ctx.fillRect(x - 1, fontSize * 0.22 + l - 2, 5, 3);
    }
  } else if (style === 1) {
    ctx.font = `italic 700 ${fontSize * 0.82}px "Brush Script MT", "Segoe Script", "Comic Sans MS", cursive`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.strokeText(word, 0, 0);
    ctx.lineWidth = 1.5;
    ctx.strokeText(word, 3, 2);
    const half = ctx.measureText(word).width / 2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-half - 6, fontSize * 0.4);
    ctx.quadraticCurveTo(0, fontSize * 0.6, half + 10, fontSize * 0.28);
    ctx.stroke();
  } else {
    ctx.font = `900 ${fontSize * 0.78}px Impact, "Arial Black", sans-serif`;
    const w = ctx.measureText(word).width + 22;
    ctx.fillStyle = "rgba(10,10,14,0.88)";
    ctx.fillRect(-w / 2, -fontSize * 0.42, w, fontSize * 0.84);
    ctx.fillStyle = color;
    ctx.fillText(word, 0, 1);
  }
  ctx.restore();

  // overspray
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.3 * r();
    ctx.fillStyle = color;
    ctx.fillRect((W * 0.12 + r() * W * 0.76) | 0, (H * 0.15 + r() * H * 0.7) | 0, 1, 1);
  }
  ctx.globalAlpha = 1;
  return pixelTex(c, { clamp: true });
}

/** glowing neon lettering on a transparent background */
export function makeNeonTexture(text: string, color: string) {
  const W = 128;
  const H = 64;
  const { c, ctx } = makeCanvas(W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${H * 0.6}px "Pixelify Sans", Impact, "Arial Black", sans-serif`;
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.strokeText(text, W / 2, H / 2 + 2);
  ctx.strokeText(text, W / 2, H / 2 + 2);
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fff5fb";
  ctx.strokeText(text, W / 2, H / 2 + 2);
  return pixelTex(c, { clamp: true, smooth: true });
}

/** faded painted lettering on a wall */
export function makeSignTexture(text: string) {
  const W = 256;
  const H = 48;
  const { c, ctx } = makeCanvas(W, H);
  const r = rng(61);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 30px "Pixelify Sans", Impact, "Arial Black", sans-serif`;
  ctx.fillStyle = "rgba(236,230,214,0.82)";
  ctx.fillText(text, W / 2, H / 2 + 2);
  for (let i = 0; i < 420; i++) ctx.clearRect((r() * W) | 0, (r() * H) | 0, 2, 1);
  return pixelTex(c, { clamp: true });
}

/** torn paper poster */
export function makePosterTexture(seed: number) {
  const { c, ctx } = makeCanvas(32, 48);
  const r = rng(seed * 17 + 3);
  const papers = ["#d9d1bd", "#c9d2d6", "#e0c8c0", "#d8d8cc", "#f0e6c8"];
  ctx.fillStyle = papers[(r() * papers.length) | 0];
  ctx.fillRect(0, 0, 32, 48);
  ctx.fillStyle = ["#1d1d24", "#a52a2a", "#1f3a8a", "#d97706"][(r() * 4) | 0];
  ctx.fillRect(3, 4, 26, 7);
  ctx.fillStyle = ["#6b7280", "#7c3f3f", "#3f6b7c", "#4c4c5a"][(r() * 4) | 0];
  ctx.fillRect(4, 14, 24, 16);
  ctx.fillStyle = "rgba(20,20,25,0.7)";
  for (let i = 0; i < 5; i++) ctx.fillRect(4, 33 + i * 3, 8 + ((r() * 16) | 0), 1);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect((r() * 32) | 0, (r() * 48) | 0, 1, 1);
  }
  ctx.clearRect(24 + ((r() * 6) | 0), 40 + ((r() * 6) | 0), 10, 10);
  return pixelTex(c, { clamp: true });
}

/** side panel of the company van */
export function makeVanTexture() {
  const { c, ctx } = makeCanvas(128, 48);
  const r = rng(71);
  ctx.fillStyle = "#e4dfd3";
  ctx.fillRect(0, 0, 128, 48);
  ctx.fillStyle = "#e2702b";
  ctx.fillRect(0, 34, 128, 6);
  ctx.fillStyle = "#2b2b33";
  ctx.fillRect(0, 40, 128, 8);
  ctx.fillStyle = "#1e1e26";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 13px "Pixelify Sans", Impact, "Arial Black", sans-serif`;
  ctx.fillText("★ EASY DELIVERY co. ★", 64, 15);
  ctx.font = `600 8px "Pixelify Sans", monospace`;
  ctx.fillText("anywhere · anytime · 02:06 am", 64, 27);
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = "rgba(60,40,20,0.10)";
    ctx.fillRect((r() * 128) | 0, 20 + ((r() * 28) | 0), 2, 1);
  }
  return pixelTex(c, { clamp: true });
}

/** distant apartment block with a few lit windows */
export function makeBuildingTexture(seed: number, cols = 6, rows = 12) {
  const w = cols * 8;
  const h = rows * 10;
  const { c, ctx } = makeCanvas(w, h);
  const r = rng(seed);
  ctx.fillStyle = seed % 2 ? "#0c0c16" : "#0f0e18";
  ctx.fillRect(0, 0, w, h);
  const warm = ["#ffd58a", "#ffc46b", "#f7e2b0"];
  const cool = ["#9fd3ff", "#cfe6ff", "#8fb7ff"];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const v = r();
      if (v < 0.2) {
        ctx.fillStyle = (r() < 0.7 ? warm : cool)[(r() * 3) | 0];
        ctx.globalAlpha = 0.55 + r() * 0.45;
        ctx.fillRect(x * 8 + 2, y * 10 + 3, 4, 4);
        ctx.globalAlpha = 1;
      } else if (v < 0.35) {
        ctx.fillStyle = "#1a1a28";
        ctx.fillRect(x * 8 + 2, y * 10 + 3, 4, 4);
      }
    }
  }
  return pixelTex(c, { clamp: true });
}

/* ------------------------------------------------------------------ */
/*  sprites                                                            */
/* ------------------------------------------------------------------ */

/** hand drawn pixel music note (eighth note pair) */
export function makeNoteTexture() {
  const { c, ctx } = makeCanvas(32);
  ctx.clearRect(0, 0, 32, 32);
  ctx.fillStyle = "#ffffff";
  const head = (cx: number, cy: number) => {
    ctx.fillRect(cx - 3, cy, 6, 3);
    ctx.fillRect(cx - 4, cy + 1, 8, 2);
    ctx.fillRect(cx - 2, cy - 1, 5, 1);
  };
  head(9, 22);
  head(21, 20);
  ctx.fillRect(12, 8, 2, 15);
  ctx.fillRect(24, 6, 2, 15);
  ctx.fillRect(12, 6, 14, 3);
  ctx.fillRect(13, 9, 12, 1);
  return pixelTex(c, { clamp: true });
}

/** soft radial glow sprite */
export function makeGlowTexture() {
  const { c, ctx } = makeCanvas(64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** striped knit pattern for sweaters and arm warmers */
export function makeStripeTexture(colA = "#1a1622", colB = "#ff8fb7", stripes = 6) {
  const { c, ctx } = makeCanvas(32, 32);
  const h = 32 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? colA : colB;
    ctx.fillRect(0, i * h, 32, Math.ceil(h));
  }
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect((Math.random() * 32) | 0, (Math.random() * 32) | 0, 1, 1);
  }
  return pixelTex(c, { repeat: [1, 2] });
}

/** fine fishnet / mesh texture */
export function makeFishnetTexture() {
  const { c, ctx } = makeCanvas(16, 16);
  ctx.fillStyle = "rgba(18, 14, 24, 0.4)";
  ctx.fillRect(0, 0, 16, 16);
  ctx.strokeStyle = "#120e18";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(8, 0);
  ctx.lineTo(16, 8);
  ctx.lineTo(8, 16);
  ctx.closePath();
  ctx.stroke();
  return pixelTex(c, { repeat: [4, 4] });
}

/** oversized distressed visual-kei / punk shirt graphic */
export function makePunkGraphicTexture() {
  const { c, ctx } = makeCanvas(64, 64);
  ctx.fillStyle = "#16131c";
  ctx.fillRect(0, 0, 64, 64);
  // grunge noise
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.04)";
    ctx.fillRect((Math.random() * 64) | 0, (Math.random() * 64) | 0, 2, 1);
  }
  // distressed gothic cross / symbol
  ctx.fillStyle = "#e0daf2";
  ctx.fillRect(30, 12, 4, 38);
  ctx.fillRect(18, 22, 28, 4);
  ctx.fillStyle = "#c77dff";
  ctx.fillRect(28, 20, 8, 8);
  // Japanese text or barcode
  ctx.fillStyle = "#a89ec2";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("死 · NIGHT", 32, 57);
  return pixelTex(c, { clamp: true });
}

/** cute sad cat sticker / phone screen graphic */
export function makeSadCatTexture() {
  const { c, ctx } = makeCanvas(32, 32);
  ctx.fillStyle = "#ffbde2";
  ctx.fillRect(0, 0, 32, 32);
  // cat face
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(16, 17, 10, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.beginPath();
  ctx.moveTo(7, 11);
  ctx.lineTo(11, 4);
  ctx.lineTo(15, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(17, 10);
  ctx.lineTo(21, 4);
  ctx.lineTo(25, 11);
  ctx.fill();
  // sad tareme cat eyes
  ctx.fillStyle = "#2b1c3d";
  ctx.fillRect(11, 15, 3, 2);
  ctx.fillRect(18, 15, 3, 2);
  ctx.fillRect(10, 17, 2, 2);
  ctx.fillRect(20, 17, 2, 2);
  // teardrop
  ctx.fillStyle = "#7de2ff";
  ctx.fillRect(9, 20, 2, 3);
  // little pink nose
  ctx.fillStyle = "#ff7da7";
  ctx.fillRect(15, 18, 2, 2);
  return pixelTex(c, { clamp: true });
}

/** energy drink can label */
export function makeCanTexture() {
  const { c, ctx } = makeCanvas(32, 32);
  ctx.fillStyle = "#12141c";
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = "#00ffcc";
  ctx.fillRect(0, 8, 32, 6);
  ctx.fillStyle = "#ff0077";
  ctx.fillRect(0, 16, 32, 4);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 7px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NEO★", 16, 13);
  return pixelTex(c, { repeat: [2, 1] });
}

/** soft neutral puff used for steam */
export function makeSmokeTexture() {
  const { c, ctx } = makeCanvas(64);
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.5, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 26;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.arc(32 + Math.cos(a) * r, 32 + Math.sin(a) * r, 3 + Math.random() * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
