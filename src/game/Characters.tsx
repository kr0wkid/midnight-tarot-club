import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ps1 } from "./ps1";
import { type GirlId } from "./dialogue";
import { useGame } from "./store";
import { makeBubbleTexture, makeTarotBackTexture } from "./tarotArt";
import { makeGlowTexture, makeSadCatTexture } from "./textures";
import * as T from "./animeTex";

/** a loose standing chat circle, open toward the viewer */
export const GIRL_SPOTS: Record<GirlId, { pos: [number, number, number]; rot: number }> = {
  jetta: { pos: [-0.05, 0, -0.2], rot: 0.05 },
  emi: { pos: [-1.12, 0, 0.62], rot: 0.95 },
  cole: { pos: [1.08, 0, 0.64], rot: -0.95 },
};

type V3 = [number, number, number];
type Bottom = "skirt" | "shorts" | "trackpants";
type Shoes = "boot" | "hightop" | "sneaker";
type Headwear = "headphones" | "catbeanie" | "cap";

interface Look {
  seed: number;
  face: T.FaceSpec;
  hair: T.HairSpec;
  longHair: boolean;
  top: T.TopSpec;
  sleeve?: string;
  bottom: Bottom;
  bottomMain: string;
  bottomAccent: string;
  socks?: string;
  shoes: Shoes;
  shoeMain: string;
  shoeAccent: string;
  sole: string;
  headwear: Headwear;
  hatMain: string;
  hatAccent: string;
  wristband?: string;
}

/* ------------------------------------------------------------------ */
/*  the three girls                                                    */
/* ------------------------------------------------------------------ */
const LOOKS: Record<GirlId, Look> = {
  // tan · long messy red hair · headphones · star cami · cargo mini + skull belt · combat boots
  jetta: {
    seed: 11,
    face: { skin: "#c68a60", hair: "#a3242c", eye: "#e2a33c", blush: "#a8433f", eyeStyle: "sleepy", mouth: "grin", mark: "mole" },
    hair: { hair: "#a3242c", bang: "messy", bangLen: 36, sideLen: 62, backLen: 64 },
    longHair: true,
    top: { seed: 11, skin: "#c68a60", style: "cami", main: "#1d1a22", accent: "#c8323c", trim: "#1d1a22" },
    bottom: "skirt",
    bottomMain: "#d6ccb0",
    bottomAccent: "#1c1a1f",
    shoes: "boot",
    shoeMain: "#19181d",
    shoeAccent: "#9aa0aa",
    sole: "#2c2b30",
    headwear: "headphones",
    hatMain: "#141418",
    hatAccent: "#c8323c",
  },
  // light · black bob w/ yellow underlayer · green cat beanie + braids · #99 jersey · hoop shorts · slouch socks
  emi: {
    seed: 23,
    face: { skin: "#f6dccb", hair: "#18161f", eye: "#3a7cff", blush: "#ff8aa0", eyeStyle: "sparkle", mouth: "fang", mark: "sticker" },
    hair: { hair: "#18161f", under: "#ffd84a", bang: "blunt", bangLen: 38, sideLen: 50, backLen: 47 },
    longHair: false,
    top: { seed: 23, skin: "#f6dccb", style: "jersey", main: "#2b47c9", accent: "#ffffff", trim: "#ffd84a", under: "#b9bccb" },
    sleeve: "#b9bccb",
    bottom: "shorts",
    bottomMain: "#17171c",
    bottomAccent: "#ffd84a",
    socks: "#d9dae2",
    shoes: "hightop",
    shoeMain: "#2b47c9",
    shoeAccent: "#ffd84a",
    sole: "#e9e8f0",
    headwear: "catbeanie",
    hatMain: "#a6e94a",
    hatAccent: "#7cc62c",
    wristband: "#39d0d8",
  },
  // deep brown · messy blue hair · camo cap · striped bikini · navy track pants · red sneakers · lollipop
  cole: {
    seed: 37,
    face: { skin: "#8a5337", hair: "#2f7fe0", eye: "#e8323c", blush: "#a8423e", eyeStyle: "sharp", mouth: "smirk", mark: "bandaid" },
    hair: { hair: "#2f7fe0", bang: "spiky", bangLen: 35, sideLen: 50, backLen: 46 },
    longHair: false,
    top: { seed: 37, skin: "#8a5337", style: "bikini", main: "#e8323c", accent: "#f4f1ea", trim: "#e8323c", waist: "#1f2b52" },
    bottom: "trackpants",
    bottomMain: "#1f2b52",
    bottomAccent: "#f4f1ea",
    shoes: "sneaker",
    shoeMain: "#d8322c",
    shoeAccent: "#f4f1ea",
    sole: "#f4f1ea",
    headwear: "cap",
    hatMain: "#6b6f48",
    hatAccent: "#3f4429",
  },
};

/* ------------------------------------------------------------------ */
/*  materials: lit by the lamp + candles, with a little emissive so    */
/*  the pixel art still reads in the dark. PS1 vertex snapping on.     */
/* ------------------------------------------------------------------ */
const EMISSIVE = 0.22;
function lit(map: THREE.Texture, extra: THREE.MeshLambertMaterialParameters = {}) {
  return ps1(
    new THREE.MeshLambertMaterial({
      map,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: map,
      emissiveIntensity: EMISSIVE,
      side: THREE.DoubleSide,
      ...extra,
    }),
    240
  );
}
function flat(color: string) {
  return ps1(
    new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: EMISSIVE, side: THREE.DoubleSide }),
    240
  );
}

/* ------------------------------------------------------------------ */
/*  smooth low-poly body profiles (bottom → top)                       */
/* ------------------------------------------------------------------ */
type Profile = [number, number][];
const lathe = (pts: Profile, seg = 9, phiStart = Math.PI, phiLength = Math.PI * 2) =>
  new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    seg,
    phiStart,
    phiLength
  );

const HEAD_R = 0.2;
const TORSO: Profile = [[0.03, 0], [0.108, 0.03], [0.116, 0.07], [0.104, 0.12], [0.088, 0.17], [0.09, 0.22], [0.104, 0.27], [0.108, 0.31], [0.098, 0.35], [0.068, 0.39], [0.032, 0.42]];
const LEG: Profile = [[0.026, 0], [0.031, 0.05], [0.038, 0.14], [0.04, 0.2], [0.034, 0.3], [0.037, 0.36], [0.047, 0.46], [0.056, 0.6], [0.06, 0.7], [0.058, 0.74]];
const UPPER: Profile = [[0.028, -0.25], [0.031, -0.2], [0.034, -0.12], [0.037, -0.05], [0.036, 0], [0.026, 0.03]];
const FORE: Profile = [[0.022, -0.24], [0.025, -0.2], [0.029, -0.12], [0.03, -0.05], [0.027, 0.01]];
const SLEEVE: Profile = [[0.05, -0.12], [0.048, -0.06], [0.045, -0.01], [0.034, 0.03]];
const SKIRT: Profile = [[0.16, 0], [0.15, 0.06], [0.135, 0.13], [0.125, 0.19], [0.118, 0.24]];
const SHORTS: Profile = [[0.07, 0], [0.068, 0.08], [0.07, 0.16], [0.075, 0.24]];
const HIP: Profile = [[0.03, 0], [0.1, 0.03], [0.116, 0.07], [0.115, 0.1]];
// wide-leg baggy track pants: puddled hem, straight wide drop, gathered at the waist
const PANTS: Profile = [[0.1, 0], [0.122, 0.025], [0.126, 0.07], [0.118, 0.13], [0.124, 0.2], [0.116, 0.3], [0.118, 0.42], [0.112, 0.54], [0.104, 0.66], [0.098, 0.72], [0.092, 0.76]];
const BAGGY_HIP: Profile = [[0.03, 0], [0.13, 0.025], [0.14, 0.06], [0.128, 0.1]];
const SOCK: Profile = [[0.036, 0], [0.046, 0.04], [0.043, 0.08], [0.048, 0.12], [0.043, 0.16], [0.046, 0.2], [0.036, 0.24]];
const BOOT_SHAFT: Profile = [[0.046, 0], [0.05, 0.1], [0.052, 0.2], [0.056, 0.27]];
const CURTAIN: Profile = [[0.13, -0.62], [0.16, -0.52], [0.185, -0.38], [0.2, -0.22], [0.215, -0.08], [0.22, 0.02], [0.2, 0.1]];

/** low-poly sphere pinched into a soft anime V-chin */
function makeHeadGeo(r: number) {
  const g = new THREE.SphereGeometry(r, 12, 10);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < 0) {
      const f = Math.pow(-y / r, 1.6);
      const z = p.getZ(i);
      p.setX(i, p.getX(i) * (1 - 0.4 * f));
      p.setZ(i, z * (1 - 0.18 * f) + (z > 0 ? 0.02 * f : 0));
    }
  }
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/*  small helpers                                                      */
/* ------------------------------------------------------------------ */
const UP = new THREE.Vector3(0, 1, 0);

function Rod({ a, b, r, material }: { a: V3; b: V3; r: number; material: THREE.Material }) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  return (
    <mesh position={va.add(vb).multiplyScalar(0.5)} quaternion={quat} material={material} castShadow>
      <cylinderGeometry args={[r, r, len, 5]} />
    </mesh>
  );
}

/** a hair spike: cone rooted at `base`, pointing along `dir` */
function Spike({ base, dir, r, h, material }: { base: V3; dir: V3; r: number; h: number; material: THREE.Material }) {
  const d = new THREE.Vector3(...dir).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, d);
  const pos = new THREE.Vector3(...base).addScaledVector(d, h / 2);
  return (
    <mesh position={pos} quaternion={quat} material={material} castShadow>
      <coneGeometry args={[r, h, 4]} />
    </mesh>
  );
}

type Mats = ReturnType<typeof buildMats>;

function buildMats(look: Look) {
  const faces = T.makeFaceSet(look.face);
  const bottomTex =
    look.bottom === "skirt"
      ? T.makeSkirtTexture(look.bottomMain, look.bottomAccent, look.seed)
      : look.bottom === "shorts"
        ? T.makeShortsTexture(look.bottomMain, look.bottomAccent, look.seed)
        : T.makeTrackPantsTexture(look.bottomMain, look.bottomAccent, look.seed);
  return {
    faces,
    face: lit(faces[0]),
    shell: lit(T.makeHairShellTexture(look.hair, look.seed), { alphaTest: 0.5 }),
    curtain: look.longHair ? lit(T.makeHairCurtainTexture(look.hair, look.seed), { alphaTest: 0.5 }) : null,
    hairFlat: flat(look.hair.hair),
    torso: lit(T.makeTorsoTexture(look.top)),
    upper: lit(T.makeLimbTexture(look.face.skin)),
    fore: lit(T.makeLimbTexture(look.face.skin, { band: look.wristband, bandRows: [52, 57] })),
    leg: lit(T.makeLimbTexture(look.face.skin, { kneeRow: 35 })),
    sleeve: look.sleeve ? lit(T.makeLimbTexture(look.sleeve)) : null,
    skin: flat(look.face.skin),
    skinShade: flat(T.shade(look.face.skin, -0.15)),
    bottom: lit(bottomTex),
    sock: look.socks ? lit(T.makeSockTexture(look.socks)) : null,
    shoeMain: flat(look.shoeMain),
    shoeAccent: flat(look.shoeAccent),
    sole: flat(look.sole),
    hat:
      look.headwear === "catbeanie"
        ? lit(T.makeKnitTexture(look.hatMain))
        : look.headwear === "cap"
          ? lit(T.makeCamoTexture())
          : flat(look.hatMain),
    hatAccent: look.headwear === "catbeanie" ? lit(T.makeKnitTexture(look.hatAccent)) : flat(look.hatAccent),
    black: flat("#17161b"),
    white: flat("#f1eef6"),
    metal: flat("#b8bcc6"),
    phoneCase: flat("#ffb3db"),
    screen: new THREE.MeshBasicMaterial({ map: makeSadCatTexture(), toneMapped: false }),
    tamaScreen: flat("#8fae78"),
  };
}

function buildGeo(look: Look) {
  return {
    head: makeHeadGeo(HEAD_R),
    shell: new THREE.SphereGeometry(HEAD_R * 1.09, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.78),
    curtain: lathe(CURTAIN, 9, Math.PI / 2 + 0.25, Math.PI - 0.5),
    torso: lathe(TORSO, 10),
    leg: lathe(LEG, 8),
    upper: lathe(UPPER, 7),
    fore: lathe(FORE, 7),
    sleeve: lathe(SLEEVE, 8),
    skirt: lathe(SKIRT, 12),
    shorts: lathe(SHORTS, 8),
    hip: lathe(HIP, 10),
    pants: lathe(PANTS, 10),
    baggyHip: lathe(BAGGY_HIP, 10),
    sock: lathe(SOCK, 8),
    bootShaft: lathe(BOOT_SHAFT, 8),
    beanie: new THREE.SphereGeometry(0.232, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.5),
    cap: new THREE.SphereGeometry(0.228, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.4),
    longHair: look.longHair,
  };
}

/* ------------------------------------------------------------------ */
/*  shoes                                                              */
/* ------------------------------------------------------------------ */
function Shoe({ s, kind, M, shaft }: { s: number; kind: Shoes; M: Mats; shaft: THREE.BufferGeometry }) {
  return (
    <group position={[s * 0.06, 0, 0.02]} rotation-y={s * 0.06}>
      {kind === "boot" && (
        <>
          <mesh position={[0, 0.066, 0.012]} rotation-x={Math.PI / 2} scale={[1.05, 1, 0.85]} material={M.shoeMain} castShadow>
            <capsuleGeometry args={[0.055, 0.1, 2, 8]} />
          </mesh>
          <mesh position={[0, 0.022, 0.014]} rotation-x={Math.PI / 2} scale={[1.1, 1.05, 0.42]} material={M.sole} castShadow>
            <capsuleGeometry args={[0.058, 0.105, 2, 8]} />
          </mesh>
          <mesh position={[0, 0.06, 0]} geometry={shaft} material={M.shoeMain} castShadow />
          {[0.15, 0.25].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={M.shoeAccent}>
              <cylinderGeometry args={[0.058, 0.058, 0.014, 8]} />
            </mesh>
          ))}
        </>
      )}
      {kind === "hightop" && (
        <>
          <mesh position={[0, 0.058, 0.01]} rotation-x={Math.PI / 2} scale={[1, 1, 0.75]} material={M.shoeMain} castShadow>
            <capsuleGeometry args={[0.048, 0.09, 2, 8]} />
          </mesh>
          <mesh position={[0, 0.022, 0.012]} rotation-x={Math.PI / 2} scale={[1.06, 1.04, 0.36]} material={M.sole} castShadow>
            <capsuleGeometry args={[0.05, 0.095, 2, 8]} />
          </mesh>
          <mesh position={[0, 0.11, -0.012]} material={M.shoeMain} castShadow>
            <cylinderGeometry args={[0.044, 0.048, 0.08, 8]} />
          </mesh>
          <mesh position={[0, 0.092, 0.04]} rotation-x={-0.35} material={M.shoeAccent}>
            <boxGeometry args={[0.1, 0.016, 0.05]} />
          </mesh>
          <mesh position={[0, 0.042, 0.1]} scale={[1, 0.55, 0.7]} material={M.sole}>
            <sphereGeometry args={[0.045, 7, 5]} />
          </mesh>
        </>
      )}
      {kind === "sneaker" && (
        <>
          <mesh position={[0, 0.054, 0.012]} rotation-x={Math.PI / 2} scale={[1, 1, 0.7]} material={M.shoeMain} castShadow>
            <capsuleGeometry args={[0.047, 0.09, 2, 8]} />
          </mesh>
          <mesh position={[0, 0.022, 0.014]} rotation-x={Math.PI / 2} scale={[1.06, 1.04, 0.42]} material={M.sole} castShadow>
            <capsuleGeometry args={[0.049, 0.095, 2, 8]} />
          </mesh>
          <mesh position={[0, 0.04, 0.1]} scale={[1, 0.6, 0.75]} material={M.sole}>
            <sphereGeometry args={[0.046, 7, 5]} />
          </mesh>
          <mesh position={[0, 0.088, 0.03]} rotation-x={-0.3} material={M.shoeAccent}>
            <boxGeometry args={[0.04, 0.012, 0.07]} />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  natural, conversational animation                                  */
/*  - no hops, no snapping to camera                                   */
/*  - speaker addresses a friend; listeners watch, nod, laugh, drift   */
/*  - when YOU join, the speaker looks at you                          */
/*  - slow weight shifts, breathing, lagged head/body turns            */
/* ------------------------------------------------------------------ */
const HEAD_Y = 1.36;
const HIP_Y = 0.66;
const OTHERS: Record<GirlId, GirlId[]> = { jetta: ["emi", "cole"], emi: ["jetta", "cole"], cole: ["jetta", "emi"] };
const LAUGHY = /!!|omg|lol|haha|😂|\?\?|insane|DRAMA|screaming/i;

const wrap = (a: number) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function Girl({ id }: { id: GirlId }) {
  const look = LOOKS[id];
  const spot = GIRL_SPOTS[id];
  const root = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const braidL = useRef<THREE.Group>(null);
  const braidR = useRef<THREE.Group>(null);
  const curtain = useRef<THREE.Group>(null);
  const bubble = useRef<THREE.Sprite>(null);
  const off = look.seed * 0.37;

  const S = useRef({
    lastKey: -1,
    prevWho: "jetta" as GirlId,
    curWho: "jetta" as GirlId,
    addressee: OTHERS[id][0],
    glanceNext: rand(2, 4),
    glanceAlt: false,
    tilt: 0,
    nodAt: -99,
    laugh: 0,
    phoneLook: false,
    blinkNext: rand(1, 4),
    blinkEnd: 0,
    yaw: 0,
    pitch: 0,
    body: 0,
    faceIdx: 0,
  });
  const tgt = useMemo(() => new THREE.Vector3(), []);

  const M = useMemo(() => buildMats(look), [look]);
  const G = useMemo(() => buildGeo(look), [look]);
  const bubbleTex = useMemo(() => makeBubbleTexture(), []);
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const deckMat = useMemo(() => {
    const tex = makeTarotBackTexture();
    return ps1(new THREE.MeshLambertMaterial({ map: tex, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.3 }), 240);
  }, []);

  const headOf = (who: GirlId, v: THREE.Vector3) => v.set(GIRL_SPOTS[who].pos[0], HEAD_Y, GIRL_SPOTS[who].pos[2]);

  useFrame((state, dt) => {
    const g = root.current;
    const u = upper.current;
    if (!g || !u) return;
    const s = S.current;
    const t = state.clock.elapsedTime;
    const now = Date.now();
    const { line, lineAt, phase } = useGame.getState();
    const speakDur = THREE.MathUtils.clamp(line.text.length * 65, 1500, 5200);
    const talking = now - lineAt < speakDur;
    const speaking = talking && line.who === id;
    const engaged = phase === "talk" || phase === "shuffle" || phase === "spread" || phase === "reading";
    const D = THREE.MathUtils.damp;

    /* ---- react to a new line ---- */
    if (line.key !== s.lastKey) {
      s.lastKey = line.key;
      s.prevWho = s.curWho;
      s.curWho = line.who;
      if (line.who === id) {
        // talk to whoever spoke before, like a real back-and-forth
        s.addressee = s.prevWho !== id ? s.prevWho : OTHERS[id][(Math.random() * 2) | 0];
        s.glanceAlt = false;
        s.glanceNext = t + rand(1.8, 3.2);
        s.phoneLook = false;
      } else {
        if (LAUGHY.test(line.text) && Math.random() < 0.55) s.laugh = 1;
        else if (Math.random() < 0.5) s.nodAt = t + rand(0.5, 1.8);
        s.phoneLook = id === "emi" && !engaged && Math.random() < 0.18;
      }
    }

    /* ---- glance rhythm: eyes don't stay locked forever ---- */
    if (t > s.glanceNext) {
      s.glanceAlt = Math.random() < (speaking ? 0.4 : 0.28);
      s.glanceNext = t + (s.glanceAlt ? rand(0.9, 1.8) : rand(2.4, 5));
      s.tilt = rand(-0.08, 0.08);
      if (id === "emi" && !talking && !engaged) s.phoneLook = Math.random() < 0.45;
    }

    /* ---- choose where to look ---- */
    const cam = state.camera.position;
    let lookDown = 0;
    if (engaged) {
      if (speaking) tgt.copy(cam);
      else if (talking && line.who !== id) (s.glanceAlt ? tgt.copy(cam) : headOf(line.who, tgt));
      else tgt.copy(cam);
      if (id === "jetta" && phase === "shuffle") lookDown = 0.45; // watching her hands
    } else if (speaking) {
      headOf(s.glanceAlt ? OTHERS[id].find((o) => o !== s.addressee)! : s.addressee, tgt);
    } else if (talking) {
      if (s.glanceAlt) headOf(OTHERS[id].find((o) => o !== line.who) ?? line.who, tgt);
      else headOf(line.who, tgt);
      if (s.phoneLook) lookDown = 0.5;
    } else {
      headOf(s.glanceAlt ? OTHERS[id][1] : OTHERS[id][0], tgt);
      if (s.phoneLook) lookDown = 0.5;
    }

    const dx = tgt.x - spot.pos[0];
    const dz = tgt.z - spot.pos[2];
    const rel = wrap(Math.atan2(dx, dz) - spot.rot);
    const bodyT = THREE.MathUtils.clamp(rel * 0.35, -0.4, 0.4);
    const yawT = THREE.MathUtils.clamp(rel - bodyT, -1.0, 1.0);
    const pitchT = THREE.MathUtils.clamp(-Math.atan2(tgt.y - HEAD_Y, Math.hypot(dx, dz)), -0.3, 0.3) + lookDown;
    s.body = D(s.body, bodyT, 1.4, dt);
    s.yaw = D(s.yaw, yawT, 3.2, dt);
    s.pitch = D(s.pitch, pitchT, 3, dt);

    /* ---- body: weight shift + breathing, never still, never bouncy ---- */
    s.laugh = Math.max(0, s.laugh - dt * 0.8);
    const lg = s.laugh;
    const weight = Math.sin(t * 0.42 + off) * 0.7 + Math.sin(t * 0.17 + off * 2) * 0.3;
    const breathe = Math.sin(t * 1.45 + off);
    const emph = speaking ? Math.sin(t * 2.6 + off) * 0.55 + Math.sin(t * 4.1 + off * 1.7) * 0.3 : 0;

    g.rotation.y = spot.rot + s.body * 0.35;
    g.rotation.z = weight * 0.018;
    g.position.y = spot.pos[1] + breathe * 0.002;
    u.rotation.y = s.body * 0.65;
    u.rotation.z = -weight * 0.03 + (speaking ? Math.sin(t * 1.3 + off) * 0.015 : 0);
    const lean = (engaged && !speaking ? 0.035 : 0.01) + emph * 0.012 - lg * 0.07;
    u.rotation.x = D(u.rotation.x, lean + breathe * 0.008 + Math.sin(t * 22) * 0.01 * lg, 5, dt);

    /* ---- head ---- */
    if (head.current) {
      const h = head.current;
      let nod = 0;
      const nt = t - s.nodAt;
      if (nt > 0 && nt < 0.8) nod = Math.sin((nt / 0.8) * Math.PI * 2) * 0.07 * (1 - nt / 0.8);
      h.rotation.y = s.yaw + (speaking ? Math.sin(t * 1.2 + off) * 0.05 : Math.sin(t * 0.5 + off) * 0.02);
      h.rotation.x = s.pitch + emph * 0.045 + nod - lg * 0.12;
      h.rotation.z = D(h.rotation.z, (speaking ? Math.sin(t * 1.8 + off) * 0.05 : s.tilt) + lg * Math.sin(t * 9) * 0.03, 3, dt);
    }

    /* ---- face: randomised blinks, rhythmic lips with word gaps ---- */
    if (t > s.blinkNext) {
      s.blinkEnd = t + 0.11;
      s.blinkNext = t + (Math.random() < 0.15 ? 0.25 : rand(2.2, 5.5));
    }
    const closed = t < s.blinkEnd;
    const wordGap = Math.sin(t * 2.2 + off) < -0.75;
    const open = (speaking && !wordGap && Math.sin(t * 13.7) + Math.sin(t * 8.3 + 1) * 0.7 > 0.2) || (lg > 0.2 && Math.sin(t * 16) > -0.4);
    const idx = (closed ? 2 : 0) + (open ? 1 : 0);
    if (idx !== s.faceIdx) {
      s.faceIdx = idx;
      M.face.map = M.faces[idx];
      M.face.emissiveMap = M.faces[idx];
    }

    /* ---- arms: relaxed rest poses + organic talking gestures ---- */
    const g1 = Math.sin(t * 1.7 + off) * 0.6 + Math.sin(t * 2.9 + off * 1.3) * 0.4;
    const g2 = Math.sin(t * 2.3 + off * 0.7) * 0.6 + Math.sin(t * 3.7 + off) * 0.4;
    const drift = Math.sin(t * 0.6 + off) * 0.03;
    let ulx = 0.05 + drift, ulz = -0.1, urx = 0.05 - drift, urz = 0.1, fl = -0.25, fr = -0.25;

    if (id === "jetta") {
      // holds her deck loosely at the waist
      urx = -0.22 + drift; urz = 0.12; fr = -1.05;
      ulx = 0.06; ulz = -0.14; fl = -0.35;
      if (phase === "shuffle") {
        ulx = urx = -0.45; ulz = 0.22; urz = -0.22;
        fl = -1.15 + Math.sin(t * 11) * 0.18;
        fr = -1.15 - Math.sin(t * 11) * 0.18;
      } else if (phase === "spread" || phase === "reading") {
        urx = -0.5; urz = 0.08; fr = -0.95;
        ulx = -0.3; ulz = 0.12; fl = -0.8 + g1 * 0.1;
      } else if (speaking) {
        urx = -0.3 + g1 * 0.1; fr = -1.15 + g2 * 0.2;
        ulx = -0.12 + g2 * 0.12; ulz = -0.18; fl = -0.7 + g1 * 0.3;
      }
    } else if (id === "emi") {
      // phone at chest; free hand does the talking
      urx = -0.18; urz = 0.08; fr = s.phoneLook ? -1.45 : -1.2;
      ulx = 0.04 + drift; ulz = -0.12; fl = -0.3;
      if (speaking) {
        fr = -0.95;
        ulx = -0.28 + g1 * 0.16; ulz = -0.32 + g2 * 0.08; fl = -1.15 + g2 * 0.35;
      }
      if (lg > 0.3) { ulx = -0.55; ulz = 0.2; fl = -1.9; } // hand to mouth
    } else {
      // hands in pockets of the baggy pants
      ulx = urx = 0.12 + drift * 0.5; ulz = -0.16; urz = 0.16; fl = fr = -0.2;
      if (speaking) {
        urx = -0.32 + g1 * 0.14; urz = 0.26; fr = -1.0 + g2 * 0.28;
      }
    }

    if (armL.current && armR.current && foreL.current && foreR.current) {
      armL.current.rotation.x = D(armL.current.rotation.x, ulx, 4, dt);
      armL.current.rotation.z = D(armL.current.rotation.z, ulz, 4, dt);
      armR.current.rotation.x = D(armR.current.rotation.x, urx, 4, dt);
      armR.current.rotation.z = D(armR.current.rotation.z, urz, 4, dt);
      foreL.current.rotation.x = D(foreL.current.rotation.x, fl, 4, dt);
      foreR.current.rotation.x = D(foreR.current.rotation.x, fr, 4, dt);
    }

    /* ---- secondary motion: braids / hair follow the head, lagging ---- */
    const swing = Math.sin(t * 1.3 + off) * 0.05 - s.yaw * 0.12 + lg * Math.sin(t * 14) * 0.06;
    if (braidL.current) braidL.current.rotation.x = D(braidL.current.rotation.x, swing, 3, dt);
    if (braidR.current) braidR.current.rotation.x = D(braidR.current.rotation.x, swing * 0.9, 3, dt);
    if (curtain.current) curtain.current.rotation.x = Math.sin(t * 1.1 + off) * 0.025 + s.pitch * -0.2;

    if (bubble.current) {
      bubble.current.visible = speaking;
      bubble.current.position.y = 2.02 + Math.sin(t * 2) * 0.02;
    }
  });

  const join = (delta: number) => {
    if (delta > 6) return;
    const p = useGame.getState().phase;
    if (p === "ambient" || p === "after") useGame.getState().join();
  };

  return (
    <group
      ref={root}
      position={spot.pos}
      rotation-y={spot.rot}
      onClick={(e) => {
        e.stopPropagation();
        join(e.delta);
      }}
    >
      {/* ---------------- feet & legs (planted) ---------------- */}
      {[-1, 1].map((s) => (
        <Shoe key={`sh${s}`} s={s} kind={look.shoes} M={M} shaft={G.bootShaft} />
      ))}

      {look.bottom !== "trackpants" &&
        [-1, 1].map((s) => <mesh key={`lg${s}`} position={[s * 0.055, 0.02, 0]} geometry={G.leg} material={M.leg} castShadow />)}

      {M.sock &&
        [-1, 1].map((s) => <mesh key={`sk${s}`} position={[s * 0.055, 0.07, 0]} geometry={G.sock} material={M.sock!} castShadow />)}

      {look.bottom === "skirt" && <mesh position={[0, 0.52, 0]} scale={[1, 1, 0.82]} geometry={G.skirt} material={M.bottom} castShadow />}
      {look.bottom === "shorts" && (
        <>
          {[-1, 1].map((s) => (
            <mesh key={`so${s}`} position={[s * 0.058, 0.5, 0]} scale={[s, 1, 1]} geometry={G.shorts} material={M.bottom} castShadow />
          ))}
          <mesh position={[0, 0.64, 0]} scale={[1, 1, 0.8]} geometry={G.hip} material={M.bottom} />
        </>
      )}
      {look.bottom === "trackpants" && (
        <>
          {/* super baggy: wide legs that pool over the sneakers */}
          {[-1, 1].map((s) => (
            <mesh key={`tp${s}`} position={[s * 0.075, 0.0, 0]} scale={[s, 1, 0.92]} rotation-z={s * 0.03} geometry={G.pants} material={M.bottom} castShadow />
          ))}
          <mesh position={[0, 0.63, 0]} scale={[1, 1, 0.82]} geometry={G.baggyHip} material={M.bottom} />
          {/* drawstrings */}
          <Rod a={[-0.025, 0.72, 0.105]} b={[-0.035, 0.6, 0.12]} r={0.005} material={M.white} />
          <Rod a={[0.025, 0.72, 0.105]} b={[0.04, 0.62, 0.12]} r={0.005} material={M.white} />
        </>
      )}

      {/* ---------------- upper body (pivots at the hips) ---------------- */}
      <group ref={upper} position={[0, HIP_Y, 0]}>
        <group position={[0, -HIP_Y, 0]}>
          <mesh position={[0, 0.72, 0]} scale={[1, 1, 0.78]} geometry={G.torso} material={M.torso} castShadow />
          <mesh position={[0, 1.17, 0]} material={M.skinShade} castShadow>
            <cylinderGeometry args={[0.026, 0.03, 0.12, 7]} />
          </mesh>

          {/* jetta: tamagotchi on a cord */}
          {id === "jetta" && (
            <>
              <Rod a={[-0.045, 1.14, 0.065]} b={[0, 0.985, 0.105]} r={0.004} material={M.black} />
              <Rod a={[0.045, 1.14, 0.065]} b={[0, 0.985, 0.105]} r={0.004} material={M.black} />
              <mesh position={[0, 0.965, 0.105]} scale={[0.9, 1.1, 0.55]} material={M.white} castShadow>
                <sphereGeometry args={[0.026, 7, 6]} />
              </mesh>
              <mesh position={[0, 0.968, 0.12]} material={M.tamaScreen}>
                <planeGeometry args={[0.022, 0.018]} />
              </mesh>
            </>
          )}

          {/* emi: crossbody bag */}
          {id === "emi" && (
            <>
              <Rod a={[0.1, 1.1, 0.085]} b={[-0.12, 0.8, 0.095]} r={0.008} material={M.black} />
              <mesh position={[-0.17, 0.75, 0.05]} rotation-y={0.5} material={M.black} castShadow>
                <boxGeometry args={[0.13, 0.1, 0.045]} />
              </mesh>
              <mesh position={[-0.16, 0.78, 0.075]} rotation-y={0.5} material={M.metal}>
                <boxGeometry args={[0.02, 0.012, 0.005]} />
              </mesh>
            </>
          )}

          {/* ---------------- arms (shoulder + elbow) ---------------- */}
          {[-1, 1].map((s) => (
            <group key={`arm${s}`} ref={s < 0 ? armL : armR} position={[s * 0.13, 1.08, 0]}>
              <mesh geometry={G.upper} material={M.upper} castShadow />
              {M.sleeve && <mesh geometry={G.sleeve} material={M.sleeve} castShadow />}
              <group ref={s < 0 ? foreL : foreR} position={[0, -0.235, 0]}>
                <mesh geometry={G.fore} material={M.fore} castShadow />
                <mesh position={[0, -0.25, 0.004]} scale={[0.8, 1.25, 0.62]} material={M.skin} castShadow>
                  <sphereGeometry args={[0.032, 7, 5]} />
                </mesh>

                {/* jetta: spiked wristband + her tarot deck */}
                {id === "jetta" && s === 1 && (
                  <>
                    <group position={[0, -0.19, 0]}>
                      <mesh rotation-x={Math.PI / 2} material={M.black}>
                        <torusGeometry args={[0.031, 0.011, 4, 10]} />
                      </mesh>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <group key={i} rotation-y={(i / 5) * Math.PI * 2}>
                          <mesh position={[0.046, 0, 0]} rotation-z={-Math.PI / 2} material={M.metal}>
                            <coneGeometry args={[0.007, 0.024, 4]} />
                          </mesh>
                        </group>
                      ))}
                    </group>
                    <mesh position={[0, -0.28, 0.03]} material={deckMat} castShadow>
                      <boxGeometry args={[0.07, 0.105, 0.022]} />
                    </mesh>
                  </>
                )}

                {/* emi: sad-cat phone */}
                {id === "emi" && s === 1 && (
                  <group position={[0, -0.28, 0.02]} rotation-x={-Math.PI / 2}>
                    <mesh material={M.phoneCase} castShadow>
                      <boxGeometry args={[0.07, 0.12, 0.016]} />
                    </mesh>
                    {[-0.022, 0.022].map((x) => (
                      <mesh key={x} position={[x, 0.07, 0]} material={M.phoneCase}>
                        <coneGeometry args={[0.013, 0.024, 3]} />
                      </mesh>
                    ))}
                    <mesh position={[0, 0, -0.0085]} rotation-y={Math.PI} material={M.screen}>
                      <planeGeometry args={[0.058, 0.098]} />
                    </mesh>
                    <sprite scale={[0.26, 0.26, 1]}>
                      <spriteMaterial map={glowTex} color="#ffb8e6" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
                    </sprite>
                  </group>
                )}
              </group>
            </group>
          ))}

          {/* ---------------- head ---------------- */}
          <group ref={head} position={[0, HEAD_Y, 0]}>
            <mesh geometry={G.head} material={M.face} castShadow />
            <mesh position={[0, 0.012, -0.004]} geometry={G.shell} material={M.shell} castShadow />

            {/* JETTA — long messy red hair + headphones */}
            {id === "jetta" && M.curtain && (
              <>
                <group ref={curtain}>
                  <mesh geometry={G.curtain} material={M.curtain} castShadow />
                </group>
                {[-1, 1].map((s) => (
                  <mesh key={`lk${s}`} position={[s * 0.168, -0.12, 0.085]} rotation={[Math.PI, 0, s * 0.12]} scale={[1, 1, 0.45]} material={M.hairFlat} castShadow>
                    <coneGeometry args={[0.038, 0.3, 4]} />
                  </mesh>
                ))}
                <Spike base={[0.04, 0.19, 0.05]} dir={[0.5, 0.6, 0.5]} r={0.03} h={0.1} material={M.hairFlat} />
                <Spike base={[-0.06, 0.2, 0.0]} dir={[-0.7, 0.6, 0.1]} r={0.03} h={0.11} material={M.hairFlat} />
                <Spike base={[0.0, 0.18, -0.1]} dir={[0.1, 0.4, -0.9]} r={0.035} h={0.12} material={M.hairFlat} />
                <Spike base={[0.17, 0.02, -0.08]} dir={[0.9, -0.3, -0.3]} r={0.03} h={0.1} material={M.hairFlat} />
                <Spike base={[-0.17, 0.0, -0.08]} dir={[-0.9, -0.4, -0.2]} r={0.03} h={0.1} material={M.hairFlat} />

                <mesh material={M.hat} castShadow>
                  <torusGeometry args={[0.236, 0.014, 4, 14, Math.PI]} />
                </mesh>
                {[-1, 1].map((s) => (
                  <group key={`hp${s}`} position={[s * 0.228, -0.02, 0]} rotation-z={Math.PI / 2}>
                    <mesh material={M.hat} castShadow>
                      <cylinderGeometry args={[0.06, 0.06, 0.05, 10]} />
                    </mesh>
                    <mesh position={[0, -s * 0.027, 0]} material={M.hatAccent}>
                      <cylinderGeometry args={[0.036, 0.036, 0.006, 10]} />
                    </mesh>
                  </group>
                ))}
              </>
            )}

            {/* EMI — OVERSIZED slouchy cat-ear beanie with chunky braided tassels */}
            {id === "emi" && (
              // sized to the skull, not floated above it: the rim lands on the
              // forehead and the brim band hugs the hair instead of flaring off it
              <group position={[0, 0.035, -0.012]} rotation-x={-0.11}>
                <mesh geometry={G.beanie} material={M.hat} castShadow />
                {/* folded ribbed brim, wrapping the head */}
                <mesh position={[0, -0.008, 0]} material={M.hatAccent} castShadow>
                  <cylinderGeometry args={[0.242, 0.226, 0.058, 12, 1, true]} />
                </mesh>
                {/* big floppy cat ears */}
                {[-1, 1].map((s) => (
                  <mesh key={`ear${s}`} position={[s * 0.13, 0.19, -0.01]} rotation-z={-s * 0.42} material={M.hat} castShadow>
                    <coneGeometry args={[0.1, 0.17, 4]} />
                  </mesh>
                ))}
                {/* ear flaps */}
                {[-1, 1].map((s) => (
                  <mesh key={`flap${s}`} position={[s * 0.216, -0.06, 0.0]} scale={[0.42, 1, 0.9]} material={M.hat} castShadow>
                    <sphereGeometry args={[0.07, 7, 6]} />
                  </mesh>
                ))}
                {/* braided tassels */}
                {[-1, 1].map((s) => (
                  <group key={`br${s}`} ref={s < 0 ? braidL : braidR} position={[s * 0.205, -0.13, 0.0]}>
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <mesh key={i} position={[(i % 2 ? 1 : -1) * 0.007, -i * 0.03, 0]} material={i % 2 ? M.hat : M.hatAccent} castShadow>
                        <sphereGeometry args={[0.02, 6, 5]} />
                      </mesh>
                    ))}
                    <mesh position={[0, -0.215, 0]} material={M.hatAccent}>
                      <cylinderGeometry args={[0.017, 0.017, 0.012, 6]} />
                    </mesh>
                    <mesh position={[0, -0.245, 0]} rotation-x={Math.PI} material={M.hat}>
                      <coneGeometry args={[0.024, 0.055, 5]} />
                    </mesh>
                  </group>
                ))}
              </group>
            )}

            {/* COLE — camo cap, messy spiky blue hair, lollipop */}
            {id === "cole" && (
              <>
                <group rotation-x={-0.12}>
                  <mesh geometry={G.cap} material={M.hat} castShadow />
                  <mesh position={[0, 0.07, 0.1]} rotation-x={0.14} material={M.hatAccent} castShadow>
                    <cylinderGeometry args={[0.17, 0.17, 0.014, 10, 1, false, -Math.PI / 2, Math.PI]} />
                  </mesh>
                  <mesh position={[0, 0.228, 0]} material={M.hatAccent}>
                    <sphereGeometry args={[0.018, 5, 4]} />
                  </mesh>
                </group>
                {[1.3, 1.9, 2.5, 3.14, 3.8, 4.4, 5.0].map((a, i) => (
                  <Spike
                    key={a}
                    base={[Math.sin(a) * 0.19, -0.02 - (i % 2) * 0.05, Math.cos(a) * 0.19]}
                    dir={[Math.sin(a) * 0.8, -0.55, Math.cos(a) * 0.8]}
                    r={0.034}
                    h={0.12 + (i % 3) * 0.02}
                    material={M.hairFlat}
                  />
                ))}
                <Rod a={[0.025, -0.122, 0.17]} b={[0.11, -0.15, 0.2]} r={0.005} material={M.white} />
              </>
            )}
          </group>
        </group>
      </group>

      {/* speech bubble */}
      <sprite ref={bubble} position={[0, 2.02, 0]} scale={[0.5, 0.33, 1]} visible={false} renderOrder={9}>
        <spriteMaterial map={bubbleTex} transparent depthWrite={false} opacity={0.85} />
      </sprite>
    </group>
  );
}

export function Girls() {
  return (
    <group>
      <Girl id="jetta" />
      <Girl id="emi" />
      <Girl id="cole" />
    </group>
  );
}
