import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ps1 } from "./ps1";
import { audio } from "./audio";
import { useGame } from "./store";
import { BOUNDS, CURB_H, CURB_Z, HUMAN_POS, OBSTACLES, playerPos } from "./world";
import { GIRL_SPOTS } from "./Characters";

/* ------------------------------------------------------------------ */
/*  Mikan — the hideout's orange cat.                                 */
/*                                                                   */
/*  Sits in odd places (the vending machine roof, the box stack, the */
/*  tire, right in the middle of the candle circle), hops between    */
/*  them, grooms itself, and generally acts like it owns the place.   */
/*  Pure ambience — it never blocks or gates anything.                */
/* ------------------------------------------------------------------ */

const FUR = "#df7a2b";
const DARK = "#a9501a";
const CREAM = "#f0e2c2";
const NOSE = "#e0848f";
const INNER = "#d78f96";
const EMISSIVE = 0.22;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const wrapPi = (a: number) => (((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
const damp = (cur: number, tgt: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(cur, tgt, 1 - Math.exp(-lambda * dt));

/** raised sidewalk behind the curb, street in front of it */
const groundY = (z: number) => (z < CURB_Z ? CURB_H : 0);

type Pose = "loaf" | "sit" | "stand";
type Tail = "curl" | "hang" | "sway";
type Mode = "idle" | "walk" | "hop" | "up" | "down";

type Spot = {
  id: string;
  pos: [number, number, number];
  pose: Pose;
  tail: Tail;
  /** needs a leap up (and a leap back down to leave) */
  perch?: boolean;
  /** ground point to launch the leap from */
  launch?: [number, number];
  /** ground point to land on when leaving */
  land?: [number, number];
  /** sometimes sits facing this yaw instead of the action */
  odd?: number;
};

const CIRCLE: [number, number, number] = [0, 0.006, 0.5];

const SPOTS: Spot[] = [
  // the candle circle — right in the middle of the ritual
  { id: "circle", pos: CIRCLE, pose: "loaf", tail: "curl", odd: Math.PI },
  // the vending machine roof, loafing like it's a sunbeam
  { id: "vending", pos: [1.75, 2.02, -2.5], pose: "loaf", tail: "curl", perch: true, launch: [1.45, -1.7], land: [1.55, -1.3] },
  // top of the tall box — sits with its tail hanging over the edge
  { id: "boxtop", pos: [-0.3, 1.18, -2.43], pose: "sit", tail: "hang", perch: true, launch: [-0.6, -1.7], land: [-0.75, -1.4] },
  // the low box
  { id: "boxlow", pos: [0.4, 0.58, -2.35], pose: "loaf", tail: "curl", perch: true, launch: [0.55, -1.6], land: [0.7, -1.3] },
  // curled up inside the tire
  { id: "tire", pos: [-3.2, 0.05, 0.6], pose: "loaf", tail: "curl", odd: 2.4 },
  // on the manhole cover
  { id: "manhole", pos: [-2.4, 0.006, 2.6], pose: "sit", tail: "sway" },
  // squatting on the sidewalk by the garage door, facing the wall
  { id: "door", pos: [-2.6, CURB_H, -2.05], pose: "sit", tail: "sway", odd: Math.PI * 0.92 },
  // at the base of the lamp post
  { id: "pole", pos: [2.62, 0.006, -0.25], pose: "sit", tail: "sway" },
  // next to the traffic cone
  { id: "cone", pos: [2.66, 0.006, 1.78], pose: "sit", tail: "sway" },
  // by the hydrant, on the curb corner
  { id: "hydrant", pos: [2.4, CURB_H, -1.86], pose: "loaf", tail: "curl" },
  // against the brick wall, watching the wrong way
  { id: "wall", pos: [-4.35, 0.006, 1.9], pose: "sit", tail: "sway", odd: -1.9 },
];

/** solid things the cat walks around (the phantom courier doesn't count — nothing renders there) */
const CAT_OBS = OBSTACLES.filter((o) => !(o.x === HUMAN_POS[0] && o.z === HUMAN_POS[2]));

const GIRL_OBS = Object.values(GIRL_SPOTS).map((g) => ({ x: g.pos[0], z: g.pos[2], r: 0.32 }));

/* ------------------------------------------------------------------ */
/*  live camera, stashed each frame so the QA hook can project coords  */
/* ------------------------------------------------------------------ */
let liveCam: THREE.Camera | null = null;
/** max seconds simulated per frame — keeps a tab-away from teleporting the cat,
 *  and doubles as a QA knob for the very slow headless test renderer */
let maxStep = 0.1;

/* ------------------------------------------------------------------ */
/*  face — flat painted voxel face like the girls, open + closed eyes  */
/* ------------------------------------------------------------------ */
function makeFaceTex(closed: boolean) {
  const W = 48;
  const H = 36;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);

  // forehead marks
  ctx.fillStyle = DARK;
  ctx.fillRect(20, 0, 3, 5);
  ctx.fillRect(26, 0, 3, 5);

  if (closed) {
    // sleepy arcs
    ctx.strokeStyle = "#3a2410";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const cx of [13, 35]) {
      ctx.beginPath();
      ctx.moveTo(cx - 6, 12);
      ctx.quadraticCurveTo(cx, 18, cx + 6, 12);
      ctx.stroke();
    }
  } else {
    // amber eyes with slit pupils
    for (const cx of [13, 35]) {
      ctx.fillStyle = "#3a2410";
      ctx.beginPath();
      ctx.ellipse(cx, 13, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffce4f";
      ctx.beginPath();
      ctx.ellipse(cx, 13, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#18140e";
      ctx.beginPath();
      ctx.ellipse(cx, 13, 1.7, 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff6e2";
      ctx.fillRect(cx + 2, 9, 2, 2);
    }
  }

  // nose
  ctx.fillStyle = NOSE;
  ctx.beginPath();
  ctx.moveTo(21, 21);
  ctx.lineTo(27, 21);
  ctx.lineTo(24, 25);
  ctx.closePath();
  ctx.fill();

  // little w mouth
  ctx.strokeStyle = "#7a4a2a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(19, 28);
  ctx.quadraticCurveTo(21.5, 25.5, 24, 26.5);
  ctx.quadraticCurveTo(26.5, 25.5, 29, 28);
  ctx.stroke();

  // whiskers
  ctx.strokeStyle = "rgba(255,246,226,0.85)";
  ctx.lineWidth = 1;
  const sides: [number, number][] = [[10, -1], [38, 1]];
  for (const [sx, dir] of sides) {
    ctx.beginPath();
    ctx.moveTo(sx, 22);
    ctx.lineTo(sx + dir * 10, 19);
    ctx.moveTo(sx, 24);
    ctx.lineTo(sx + dir * 11, 24);
    ctx.moveTo(sx, 26);
    ctx.lineTo(sx + dir * 10, 29);
    ctx.stroke();
  }
  // whisker dots
  ctx.fillStyle = "rgba(122,74,42,0.8)";
  for (const [sx, dir] of sides) {
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + dir * 2 + (i - 1) * 0, 22 + i * 2 - 2, 1, 1);
  }

  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function litMat(color: string) {
  return ps1(
    new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: EMISSIVE }),
    240
  );
}

/* ------------------------------------------------------------------ */

export default function Cat() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tailBase = useRef<THREE.Group>(null);
  const tailSegs = useRef<(THREE.Group | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const ears = useRef<(THREE.Group | null)[]>([]);

  const M = useMemo(
    () => ({ fur: litMat(FUR), dark: litMat(DARK), cream: litMat(CREAM), nose: litMat(NOSE), inner: litMat(INNER) }),
    []
  );
  const faceOpen = useMemo(() => makeFaceTex(false), []);
  const faceClosed = useMemo(() => makeFaceTex(true), []);
  const faceMat = useMemo(
    () =>
      ps1(
        new THREE.MeshLambertMaterial({
          map: faceOpen,
          emissive: new THREE.Color("#ffffff"),
          emissiveMap: faceOpen,
          emissiveIntensity: 0.3,
          transparent: true,
          alphaTest: 0.4,
        }),
        240
      ),
    [faceOpen]
  );

  const S = useRef({
    mode: "idle" as Mode,
    spot: 0,
    prevSpot: -1,
    pending: 0,
    forceTarget: null as number | null,
    toPerch: false,
    t: 0,
    dur: 1,
    hump: 0,
    dwell: rand(7, 12),
    pos: new THREE.Vector3(CIRCLE[0], CIRCLE[1], CIRCLE[2]),
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    yaw: 0,
    yawT: 0,
    gait: 0,
    // smoothed presentation state
    pitch: 0,
    bodyY: 0.055,
    leg: [0, 0, 0, 0],
    headYaw: 0,
    headPitch: 0,
    scaleY: 1,
    // timers / rolls
    landT: 0,
    blinkT: 0,
    blinkAt: 3,
    twT: 0,
    twAt: 4,
    flickT: 0,
    flickAt: 6,
    meowAt: rand(8, 16),
    lookMode: 0,
    lookAt: 4,
    oddT: 0,
    oddYaw: 0,
    action: "none" as "none" | "groom" | "bat",
    actionT: 0,
    actionNext: rand(5, 11),
  });

  /* dev QA hook — lets the visual tests teleport the cat to a spot */
  useEffect(() => {
    const w = window as unknown as {
      __catTo?: (id: string) => void;
      __catGo?: (id: string) => void;
      __catState?: () => unknown;
      __catScreen?: () => [number, number] | null;
      __catDt?: (v: number) => void;
    };
    /** test knob: how many seconds a frame may simulate (compensates slow headless fps) */
    w.__catDt = (v: number) => {
      maxStep = Math.max(0.016, Math.min(2, v));
    };
    w.__catTo = (id: string) => {
      const i = SPOTS.findIndex((sp) => sp.id === id);
      if (i < 0) return;
      const s = S.current;
      s.prevSpot = s.spot;
      s.spot = i;
      s.mode = "idle";
      s.pos.set(SPOTS[i].pos[0], SPOTS[i].pos[1], SPOTS[i].pos[2]);
      s.dwell = rand(9, 14);
      s.landT = 0.3;
      s.oddT = 0;
      s.action = "none";
    };
    /** start a real journey to a spot (walk + leap) instead of teleporting */
    w.__catGo = (id: string) => {
      const i = SPOTS.findIndex((sp) => sp.id === id);
      if (i < 0) return;
      const s = S.current;
      if (s.mode !== "idle") return;
      s.forceTarget = i;
      s.dwell = 0;
    };
    w.__catState = () => {
      const s = S.current;
      return {
        spot: SPOTS[s.spot].id,
        mode: s.mode,
        pos: s.pos.toArray().map((v) => +v.toFixed(2)),
        dwell: +s.dwell.toFixed(1),
        pending: SPOTS[s.pending]?.id ?? null,
        force: s.forceTarget,
        to: [+s.to.x.toFixed(2), +s.to.z.toFixed(2)],
      };
    };
    /** screen-pixel position of the cat (for cropping test shots) */
    w.__catScreen = () => {
      if (!liveCam) return null;
      const v = new THREE.Vector3(S.current.pos.x, S.current.pos.y + 0.13, S.current.pos.z);
      v.project(liveCam);
      const el = document.querySelector("canvas");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [Math.round((v.x * 0.5 + 0.5) * r.width + r.left), Math.round((-v.y * 0.5 + 0.5) * r.height + r.top)];
    };
    return () => {
      delete w.__catTo;
      delete w.__catGo;
      delete w.__catState;
      delete w.__catScreen;
      delete w.__catDt;
    };
  }, []);

  useFrame((state, dt) => {
    const g = root.current;
    const b = body.current;
    const h = head.current;
    if (!g || !b || !h) return;
    liveCam = state.camera;
    const s = S.current;
    const d = Math.min(dt, maxStep);
    const t = state.clock.elapsedTime;
    const started = useGame.getState().started;

    /* ---------------- journey planning ---------------- */

    const walkTo = (p: [number, number], toPerch: boolean) => {
      s.mode = "walk";
      s.toPerch = toPerch;
      s.from.copy(s.pos);
      s.to.set(p[0], groundY(p[1]), p[1]);
      s.t = 0;
      s.dur = 99; // ends on arrival, not on time
    };

    const setArc = (mode: "up" | "down" | "hop", tx: number, ty: number, tz: number) => {
      s.mode = mode;
      s.from.copy(s.pos);
      s.to.set(tx, ty, tz);
      s.t = 0;
      const dist = Math.hypot(tx - s.pos.x, tz - s.pos.z);
      const rise = ty - s.pos.y;
      s.dur =
        mode === "up"
          ? THREE.MathUtils.clamp(0.7 + dist * 0.14 + rise * 0.2, 0.6, 1.5)
          : mode === "down"
            ? THREE.MathUtils.clamp(0.5 + dist * 0.12 + Math.abs(rise) * 0.07, 0.45, 1.1)
            : THREE.MathUtils.clamp(dist / 3.2, 0.3, 0.7);
      s.hump = 0.16 + dist * 0.24 + Math.abs(rise) * 0.2 + (mode === "up" ? 0.3 : 0.12);
    };

    const arrive = (idx: number) => {
      const wasPerch = s.mode !== "walk"; // up / down / hop landings get a little squash
      s.prevSpot = s.spot;
      s.spot = idx;
      s.mode = "idle";
      s.pos.y = SPOTS[idx].pos[1];
      s.dwell = SPOTS[idx].perch ? rand(9, 17) : rand(6, 12);
      if (wasPerch) s.landT = 0.26;
      if (started && Math.random() < 0.45) audio.meow(SPOTS[idx].perch);
      const sp = SPOTS[idx];
      if (sp.odd && Math.random() < 0.55) {
        s.oddT = rand(3, 7);
        s.oddYaw = sp.odd;
      } else s.oddT = 0;
      s.action = "none";
      s.actionNext = rand(4, 9);
    };

    const lineClear = (ax: number, az: number, bx: number, bz: number) => {
      const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.14);
      for (let k = 1; k < steps; k++) {
        const u = k / steps;
        const px = ax + (bx - ax) * u;
        const pz = az + (bz - az) * u;
        for (const o of [...CAT_OBS, ...GIRL_OBS]) {
          if (Math.hypot(px - o.x, pz - o.z) < o.r + 0.14) return false;
        }
      }
      return true;
    };

    const startLeg = (idx: number) => {
      const target = SPOTS[idx];
      if (target.perch) {
        walkTo(target.launch!, true);
        return;
      }
      const dist = Math.hypot(target.pos[0] - s.pos.x, target.pos[2] - s.pos.z);
      const clear = lineClear(s.pos.x, s.pos.z, target.pos[0], target.pos[2]);
      if (dist < 1.7 && dist > 0.3 && clear && Math.random() < 0.5) {
        setArc("hop", target.pos[0], target.pos[1], target.pos[2]);
      } else walkTo([target.pos[0], target.pos[2]], false);
    };

    const startJourney = (idx: number) => {
      s.pending = idx;
      const cur = SPOTS[s.spot];
      if (cur.perch && s.mode === "idle") {
        setArc("down", cur.land![0], groundY(cur.land![1]), cur.land![1]);
      } else startLeg(idx);
    };

    const pickNext = () => {
      const phase = useGame.getState().phase;
      const cardsOut = phase === "spread" || phase === "reading" || phase === "shuffle" || phase === "after";
      const cands: { i: number; w: number }[] = [];
      for (let i = 0; i < SPOTS.length; i++) {
        if (i === s.spot || i === s.prevSpot) continue;
        if (cardsOut && SPOTS[i].id === "circle") continue; // don't sit on the cards
        cands.push({ i, w: SPOTS[i].perch ? 0.45 : 0.55 });
      }
      if (!cands.length) return;
      const total = cands.reduce((a, c) => a + c.w, 0);
      let roll = Math.random() * total;
      let pick = cands[0].i;
      for (const c of cands) {
        roll -= c.w;
        if (roll <= 0) {
          pick = c.i;
          break;
        }
      }
      startJourney(pick);
    };

    /* ---------------- mode machine ---------------- */

    if (s.mode === "idle") {
      if (s.forceTarget != null) s.dwell = 0;
      s.dwell -= d;
      const sp = SPOTS[s.spot];
      const phase = useGame.getState().phase;
      const cardsOut = phase === "spread" || phase === "reading" || phase === "shuffle" || phase === "after";
      if (sp.id === "circle" && cardsOut) s.dwell = 0;
      if (s.dwell <= 0) {
        if (s.forceTarget != null && s.forceTarget !== s.spot) {
          const ft = s.forceTarget;
          s.forceTarget = null;
          startJourney(ft);
        } else {
          s.forceTarget = null;
          pickNext();
        }
      }
    } else if (s.mode === "walk") {
      const dx = s.to.x - s.pos.x;
      const dz = s.to.z - s.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.06) {
        if (s.toPerch) setArc("up", SPOTS[s.pending].pos[0], SPOTS[s.pending].pos[1], SPOTS[s.pending].pos[2]);
        else arrive(s.pending);
      } else {
        // steer toward the target, pushing off solid things (unless this move ends on top of one)
        let mx = dx / dist;
        let mz = dz / dist;
        for (const o of [...CAT_OBS, ...GIRL_OBS]) {
          if (Math.hypot(o.x - s.to.x, o.z - s.to.z) < o.r + 0.45) continue;
          const ox = s.pos.x - o.x;
          const oz = s.pos.z - o.z;
          const od = Math.hypot(ox, oz);
          const range = o.r + 0.3;
          if (od < range && od > 1e-4) {
            const push = (1 - od / range) * 2.4;
            mx += (ox / od) * push;
            mz += (oz / od) * push;
          }
        }
        // and around the ritual circle while cards are out
        const phase = useGame.getState().phase;
        if (phase === "spread" || phase === "reading" || phase === "shuffle" || phase === "after") {
          const ox = s.pos.x - 0;
          const oz = s.pos.z - 0.42;
          const od = Math.hypot(ox, oz);
          if (od < 0.85 && od > 1e-4) {
            const push = (1 - od / 0.85) * 3;
            mx += (ox / od) * push;
            mz += (oz / od) * push;
          }
        }
        const ml = Math.hypot(mx, mz) || 1;
        const step = 0.55 * d;
        s.pos.x += (mx / ml) * step;
        s.pos.z += (mz / ml) * step;
        s.pos.x = THREE.MathUtils.clamp(s.pos.x, BOUNDS.minX, BOUNDS.maxX);
        s.pos.z = THREE.MathUtils.clamp(s.pos.z, BOUNDS.minZ, BOUNDS.maxZ);
        s.pos.y = damp(s.pos.y, groundY(s.pos.z), 9, d);
        s.gait += d * 6.2;
        s.yawT = Math.atan2(dx, dz);
      }
    } else {
      // hop / up / down — one parabola
      s.t += d;
      const u = Math.min(1, s.t / s.dur);
      s.pos.x = THREE.MathUtils.lerp(s.from.x, s.to.x, u);
      s.pos.z = THREE.MathUtils.lerp(s.from.z, s.to.z, u);
      s.pos.y = THREE.MathUtils.lerp(s.from.y, s.to.y, u) + s.hump * Math.sin(Math.PI * u);
      s.yawT = Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z);
      if (u >= 1) {
        if (s.mode === "up") arrive(s.pending);
        else if (s.mode === "down") startLeg(s.pending);
        else arrive(s.pending); // a hop's target is the spot itself... (ground hop target)
      }
    }

    /* ---------------- idle business ---------------- */

    if (s.mode === "idle") {
      if (t > s.lookAt) {
        s.lookAt = t + rand(3.5, 7);
        s.lookMode = Math.random() < 0.55 ? 0 : 1;
      }
      if (s.oddT > 0) s.oddT -= d;
      if (t > s.meowAt) {
        s.meowAt = t + rand(9, 18);
        if (started && Math.random() < 0.5) audio.meow(false);
      }
      if (t > s.actionNext) {
        s.actionNext = t + rand(5, 11);
        s.action = Math.random() < 0.55 ? "groom" : "bat";
        s.actionT = 1.6;
      }
    }
    if (s.actionT > 0) s.actionT -= d;
    else if (s.action !== "none") s.action = "none";

    if (t > s.blinkAt) {
      s.blinkAt = t + rand(2.5, 6);
      s.blinkT = 0.14;
    }
    if (s.blinkT > 0) s.blinkT -= d;
    if (t > s.twAt) {
      s.twAt = t + rand(4, 9);
      s.twT = 0.3;
    }
    if (s.twT > 0) s.twT -= d;
    if (t > s.flickAt) {
      s.flickAt = t + rand(5, 12);
      s.flickT = 0.9;
    }
    if (s.flickT > 0) s.flickT -= d;
    if (s.landT > 0) s.landT -= d;

    playerPos.copy(s.pos);

    /* ---------------- pose targets ---------------- */

    const inAir = s.mode === "up" || s.mode === "down" || s.mode === "hop";
    let pitchT = 0;
    let bodyYT = 0.105;
    let legT = [0, 0, 0, 0];
    let frontScale = 1;
    let scaleYT = 1;

    if (inAir) {
      const dist = Math.hypot(s.to.x - s.from.x, s.to.z - s.from.z);
      const u = THREE.MathUtils.clamp(s.t / s.dur, 0, 1);
      const vy = ((s.to.y - s.from.y) + s.hump * Math.PI * Math.cos(Math.PI * u)) / s.dur;
      const vh = Math.max(dist, 0.05) / s.dur;
      pitchT = THREE.MathUtils.clamp(-Math.atan2(vy, vh), -0.7, 0.7);
      legT = [1.15, 1.15, -1.0, -1.0];
      scaleYT = 1.08;
    } else if (s.mode === "walk") {
      const sw = Math.sin(s.gait) * 0.55;
      legT = [sw, -sw, -sw, sw];
      pitchT = 0;
      bodyYT = 0.105 + Math.abs(Math.sin(s.gait)) * 0.005;
    } else {
      const pose = SPOTS[s.spot].pose;
      if (pose === "sit") {
        pitchT = -0.5;
        bodyYT = 0.087;
        legT = [0.5, 0.5, -0.75, -0.75];
        frontScale = 1.22;
      } else if (pose === "loaf") {
        pitchT = 0;
        bodyYT = 0.055;
        legT = [1.35, 1.35, -1.3, -1.3];
      } else {
        pitchT = 0;
        bodyYT = 0.105;
        legT = [0, 0, 0, 0];
      }
      if (s.action === "bat" && s.actionT > 0.7 && s.actionT < 1.3) legT[1] = -1.4;
    }
    // landing squash
    if (s.landT > 0) scaleYT = 1 - 0.3 * Math.max(0, 1 - (0.26 - s.landT) * 4.5);

    s.pitch = damp(s.pitch, pitchT, 9, d);
    s.bodyY = damp(s.bodyY, bodyYT, 11, d);
    s.scaleY = damp(s.scaleY, scaleYT, 14, d);
    for (let i = 0; i < 4; i++) s.leg[i] = damp(s.leg[i], legT[i], inAir ? 18 : 13, d);

    /* ---------------- gaze ---------------- */

    let yawT = s.yawT;
    let headYawT = 0;
    let headPitchT = 0;
    if (s.mode === "idle") {
      if (s.oddT > 0) {
        yawT = s.oddYaw;
        headYawT = Math.sin(t * 0.7) * 0.25;
        headPitchT = -0.05;
      } else {
        const tgt =
          s.lookMode === 0
            ? { x: 0, y: 0.5, z: 0.42 }
            : { x: state.camera.position.x, y: state.camera.position.y, z: state.camera.position.z };
        const worldYaw = Math.atan2(tgt.x - s.pos.x, tgt.z - s.pos.z);
        yawT = worldYaw;
        const rel = wrapPi(worldYaw - s.yaw);
        headYawT = THREE.MathUtils.clamp(rel, -1.1, 1.1) * 0.5;
        const headY = s.pos.y + 0.2;
        headPitchT = THREE.MathUtils.clamp(Math.atan2(headY - tgt.y, Math.hypot(tgt.x - s.pos.x, tgt.z - s.pos.z)), -0.35, 0.6);
      }
      if (s.action === "groom" && s.actionT > 0) {
        headYawT = 0.95;
        headPitchT = -0.1;
      }
    }
    s.yaw += wrapPi(yawT - s.yaw) * (1 - Math.exp(-(s.mode === "idle" ? 2.2 : 7) * d));
    s.headYaw = damp(s.headYaw, headYawT, 6, d);
    s.headPitch = damp(s.headPitch, headPitchT, 6, d);

    /* ---------------- apply ---------------- */

    g.position.copy(s.pos);
    g.rotation.y = s.yaw;
    g.scale.set(1 / Math.sqrt(s.scaleY), s.scaleY, 1 / Math.sqrt(s.scaleY));

    b.position.y = s.bodyY;
    b.rotation.x = s.pitch;
    b.rotation.z = s.mode === "walk" ? Math.sin(s.gait) * 0.05 : 0;

    h.rotation.y = s.headYaw;
    h.rotation.x = s.headPitch;
    let shake = 0;
    if (s.action === "groom" && s.actionT > 0 && s.actionT < 1.1) shake = Math.sin(t * 34) * 0.07;
    h.rotation.z = shake;

    for (let i = 0; i < 4; i++) {
      const leg = legs.current[i];
      if (!leg) continue;
      leg.rotation.x = s.leg[i];
      const front = i < 2;
      leg.scale.y = front ? frontScale : 1;
    }

    // ears: base tilt + a quick flick now and then
    for (let i = 0; i < 2; i++) {
      const ear = ears.current[i];
      if (!ear) continue;
      const flick = s.twT > 0 ? Math.sin((0.3 - s.twT) * 40) * 0.25 : 0;
      ear.rotation.z = (i === 0 ? 1 : -1) * (0.12 + flick);
    }

    // blink
    const blit = s.blinkT > 0 ? faceClosed : faceOpen;
    if (faceMat.map !== blit) {
      faceMat.map = blit;
      faceMat.emissiveMap = blit;
      faceMat.needsUpdate = true;
    }

    // tail: pose base curve + a lazy wave (bigger while moving)
    const sp = SPOTS[s.spot];
    const tailPose = s.mode === "idle" ? sp.tail : "sway";
    const amp = (s.mode === "idle" ? 0.09 : 0.16) + (s.flickT > 0 ? 0.2 : 0);
    const base = tailBase.current;
    if (base) {
      if (tailPose === "curl") {
        base.rotation.set(0.1, 1.45, 0);
      } else if (tailPose === "hang") {
        base.rotation.set(1.25, 0, 0);
      } else {
        base.rotation.set(-0.5 + Math.sin(t * 1.8) * 0.06, Math.sin(t * 2.2) * 0.12, 0);
      }
    }
    for (let i = 0; i < tailSegs.current.length; i++) {
      const seg = tailSegs.current[i];
      if (!seg) continue;
      const wave = Math.sin(t * 2.6 - i * 0.85) * amp;
      if (tailPose === "curl") {
        seg.rotation.set(0.14, 0.2 + wave * 0.5, 0);
      } else if (tailPose === "hang") {
        seg.rotation.set(0.05, wave * 0.4, 0);
      } else {
        seg.rotation.set(-0.06, wave, 0);
      }
    }
  });

  /* ---------------- mesh ---------------- */

  const legAt = (i: number, x: number, z: number) => (
    <group
      key={i}
      position={[x, -0.035, z]}
      ref={(el) => {
        legs.current[i] = el;
      }}
      castShadow
    >
      <mesh material={M.fur} position={[0, -0.025, 0]} castShadow>
        <boxGeometry args={[0.026, 0.05, 0.03]} />
      </mesh>
      <mesh material={M.cream} position={[0, -0.06, 0.004]} castShadow>
        <boxGeometry args={[0.03, 0.022, 0.036]} />
      </mesh>
    </group>
  );

  return (
    <group ref={root} position={CIRCLE}>
      <group ref={body}>
        {/* torso */}
        <mesh material={M.fur} castShadow>
          <boxGeometry args={[0.1, 0.09, 0.2]} />
        </mesh>
        {/* tabby stripes across the back */}
        <mesh material={M.dark} position={[0, 0.046, -0.055]} castShadow>
          <boxGeometry args={[0.104, 0.014, 0.028]} />
        </mesh>
        <mesh material={M.dark} position={[0, 0.046, 0.01]} castShadow>
          <boxGeometry args={[0.104, 0.014, 0.028]} />
        </mesh>
        <mesh material={M.dark} position={[0, 0.046, 0.065]} castShadow>
          <boxGeometry args={[0.104, 0.014, 0.026]} />
        </mesh>
        {/* cream chest */}
        <mesh material={M.cream} position={[0, -0.016, 0.097]} castShadow>
          <boxGeometry args={[0.052, 0.056, 0.014]} />
        </mesh>

        {/* legs: FL, FR, BL, BR */}
        {legAt(0, -0.034, 0.062)}
        {legAt(1, 0.034, 0.062)}
        {legAt(2, -0.034, -0.062)}
        {legAt(3, 0.034, -0.062)}

        {/* tail */}
        <group ref={tailBase} position={[0, 0.032, -0.096]}>
          <mesh material={M.fur} position={[0, 0, -0.017]} castShadow>
            <boxGeometry args={[0.024, 0.024, 0.036]} />
          </mesh>
          <group
            position={[0, 0, -0.033]}
            ref={(el) => {
              tailSegs.current[0] = el;
            }}
          >
            <mesh material={M.dark} position={[0, 0, -0.017]} castShadow>
              <boxGeometry args={[0.024, 0.024, 0.036]} />
            </mesh>
            <group
              position={[0, 0, -0.033]}
              ref={(el) => {
                tailSegs.current[1] = el;
              }}
            >
              <mesh material={M.fur} position={[0, 0, -0.017]} castShadow>
                <boxGeometry args={[0.024, 0.024, 0.036]} />
              </mesh>
              <group
                position={[0, 0, -0.033]}
                ref={(el) => {
                  tailSegs.current[2] = el;
                }}
              >
                <mesh material={M.dark} position={[0, 0, -0.017]} castShadow>
                  <boxGeometry args={[0.023, 0.023, 0.035]} />
                </mesh>
                <group
                  position={[0, 0, -0.032]}
                  ref={(el) => {
                    tailSegs.current[3] = el;
                  }}
                >
                  <mesh material={M.fur} position={[0, 0, -0.016]} castShadow>
                    <boxGeometry args={[0.022, 0.022, 0.034]} />
                  </mesh>
                  <group
                    position={[0, 0, -0.031]}
                    ref={(el) => {
                      tailSegs.current[4] = el;
                    }}
                  >
                    <mesh material={M.dark} position={[0, 0, -0.015]} castShadow>
                      <boxGeometry args={[0.02, 0.02, 0.032]} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* head */}
        <group ref={head} position={[0, 0.05, 0.075]}>
          <mesh material={M.fur} position={[0, 0.02, 0.018]} castShadow>
            <boxGeometry args={[0.095, 0.08, 0.086]} />
          </mesh>
          {/* ears */}
          {[-1, 1].map((sd, i) => (
            <group
              key={i}
              position={[sd * 0.03, 0.077, 0.012]}
              ref={(el) => {
                ears.current[i] = el;
              }}
            >
              <mesh material={M.fur} rotation-y={Math.PI / 4} castShadow>
                <coneGeometry args={[0.028, 0.052, 4]} />
              </mesh>
              <mesh material={M.inner} position={[0, -0.004, 0.011]} rotation-y={Math.PI / 4}>
                <coneGeometry args={[0.015, 0.03, 4]} />
              </mesh>
            </group>
          ))}
          {/* painted face */}
          <mesh material={faceMat} position={[0, 0.021, 0.0625]}>
            <planeGeometry args={[0.09, 0.074]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
