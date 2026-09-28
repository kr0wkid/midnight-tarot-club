import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  world layout (shared by rendering, collision and interactions)      */
/* ------------------------------------------------------------------ */

/** front face of the garage building */
export const FRONT_Z = -3.0;
/** sidewalk edge (everything behind it is raised by CURB_H) */
export const CURB_Z = -1.7;
export const CURB_H = 0.14;

/** brick wall running along the left side of the yard */
export const WALL_X = -5.0;
export const WALL_T = 0.36;
export const WALL_FACE_X = WALL_X + WALL_T / 2;
export const WALL_LEN = 8;
export const WALL_H = 3.2;

export const GARAGE = {
  x0: -7.5,
  x1: 6.0,
  h: 3.8,
  depth: 6.4,
  door: { x0: -4.3, x1: -0.9, h: 2.75 },
};

/** the sodium street lamp – replaces the campfire as the key light */
export const LAMP = {
  pole: new THREE.Vector3(2.4, 0, -0.7),
  head: new THREE.Vector3(0.95, 3.55, -0.7),
  target: new THREE.Vector3(-0.1, 0, 0.6),
};

export const HUMAN_POS: [number, number, number] = [-1.45, 0, 0.15];
export const CAT_START: [number, number, number] = [1.15, 0, 0.3];

export const MAX_TAGS = 12;

/** live player position (written by the cat every frame) */
export const playerPos = new THREE.Vector3(CAT_START[0], CAT_START[1], CAT_START[2]);

export const BOUNDS = { minX: WALL_FACE_X + 0.4, maxX: 5.2, minZ: FRONT_Z + 0.42, maxZ: 3.0 };

export const OBSTACLES: { x: number; z: number; r: number }[] = [
  { x: LAMP.pole.x, z: LAMP.pole.z, r: 0.3 }, // lamp post
  { x: 3.6, z: -2.4, r: 0.65 }, // dumpster
  { x: 4.8, z: -2.4, r: 0.65 },
  { x: 5.5, z: -2.1, r: 0.45 }, // trash bags
  { x: -0.2, z: -2.45, r: 0.6 }, // cardboard boxes
  { x: 1.5, z: -2.35, r: 0.22 }, // hydrant
  { x: 2.9, z: 2.0, r: 0.28 }, // cone
  { x: -3.2, z: 0.6, r: 0.4 }, // tyre
  { x: HUMAN_POS[0], z: HUMAN_POS[2], r: 0.45 }, // the other courier
];

export function clampToWorld(p: THREE.Vector3) {
  p.x = THREE.MathUtils.clamp(p.x, BOUNDS.minX, BOUNDS.maxX);
  p.z = THREE.MathUtils.clamp(p.z, BOUNDS.minZ, BOUNDS.maxZ);
  for (const o of OBSTACLES) {
    const dx = p.x - o.x;
    const dz = p.z - o.z;
    const d = Math.hypot(dx, dz);
    const min = o.r + 0.28;
    if (d < min) {
      if (d < 1e-4) {
        p.x = o.x + min;
      } else {
        p.x = o.x + (dx / d) * min;
        p.z = o.z + (dz / d) * min;
      }
    }
  }
}

export type SprayTarget = { x: number; y: number; z: number; rotY: number };

/** where would a tag land if the player sprayed right now? */
export function sprayTarget(p: THREE.Vector3): SprayTarget | null {
  const y = 0.85 + Math.random() * 0.7;
  const { door, x1 } = GARAGE;
  // garage front (right of the roller door)
  if (p.z < FRONT_Z + 1.5 && p.x > door.x1 + 1.1 && p.x < x1 - 1.1) {
    return { x: p.x, y: CURB_H + y, z: FRONT_Z + 0.04, rotY: 0 };
  }
  // brick wall on the left
  if (p.x < WALL_FACE_X + 1.5 && p.z > FRONT_Z + 1.1 && p.z < 3.9) {
    return { x: WALL_FACE_X + 0.04, y, z: p.z, rotY: Math.PI / 2 };
  }
  return null;
}
