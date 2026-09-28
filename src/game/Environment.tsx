import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ps1, ps1Standard as std } from "./ps1";
import {
  makeAsphaltTexture,
  makeBrickTexture,
  makeBuildingTexture,
  makeCardboardTexture,
  makeConcreteTexture,
  makeGlowTexture,
  makePosterTexture,
  rng,
} from "./textures";
import { CURB_H, CURB_Z, FRONT_Z, WALL_FACE_X, WALL_H, WALL_LEN, WALL_T, WALL_X } from "./world";

type V3 = [number, number, number];

/* ------------------------------------------------------------------ */
/*  ground                                                             */
/* ------------------------------------------------------------------ */
export function Ground() {
  const asphalt = useMemo(() => makeAsphaltTexture(22), []);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, 90, 30, 30);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const d = Math.hypot(x, y);
      const far = THREE.MathUtils.smoothstep(d, 9, 20);
      pos.setZ(i, (Math.sin(x * 0.9) * Math.cos(y * 0.7) * 0.05 + Math.sin(x * 2.3 + y * 1.9) * 0.02) * far);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} geometry={geo} receiveShadow>
      <meshStandardMaterial map={asphalt} color="#bcbcc8" roughness={0.9} flatShading />
    </mesh>
  );
}

export function Sidewalk() {
  const concrete = useMemo(() => makeConcreteTexture(24, 1), []);
  const curb = useMemo(() => std({ color: "#6a686c" }), []);
  const width = CURB_Z - FRONT_Z;
  return (
    <group>
      <mesh position={[-0.75, CURB_H / 2, (FRONT_Z + CURB_Z) / 2]} receiveShadow castShadow>
        <boxGeometry args={[30, CURB_H, width]} />
        <meshStandardMaterial map={concrete} color="#a9a7ad" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-0.75, CURB_H / 2, CURB_Z - 0.03]} material={curb}>
        <boxGeometry args={[30, CURB_H + 0.01, 0.06]} />
      </mesh>
    </group>
  );
}

export function BrickWall() {
  const brick = useMemo(() => makeBrickTexture(WALL_LEN, WALL_H), []);
  const mat = useMemo(() => std({ map: brick, color: "#b8a9a2", roughness: 1 }), [brick]);
  const coping = useMemo(() => std({ color: "#3b3b40" }), []);
  const grime = useMemo(
    () =>
      ps1(
        new THREE.MeshBasicMaterial({
          color: "#000000",
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        })
      ),
    []
  );
  return (
    <group position={[WALL_X, 0, 1.0]}>
      <mesh position={[0, WALL_H / 2, 0]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[WALL_T, WALL_H, WALL_LEN]} />
      </mesh>
      <mesh position={[0, WALL_H + 0.05, 0]} material={coping} castShadow>
        <boxGeometry args={[WALL_T + 0.12, 0.1, WALL_LEN + 0.1]} />
      </mesh>
      <mesh position={[WALL_T / 2 + 0.01, 0.35, 0]} rotation-y={Math.PI / 2} material={grime} renderOrder={1}>
        <planeGeometry args={[WALL_LEN, 0.7]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  props                                                              */
/* ------------------------------------------------------------------ */
export function Dumpster({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const body = useMemo(() => std({ color: "#2f5c3c", roughness: 0.8 }), []);
  const lid = useMemo(() => std({ color: "#28503a", roughness: 0.8 }), []);
  const dark = useMemo(() => std({ color: "#1a1a1e" }), []);
  const bag = useMemo(() => std({ color: "#15161b", roughness: 0.55 }), []);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.72, 0]} material={body} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.15, 1.0]} />
      </mesh>
      <mesh position={[0, 1.28, 0]} material={dark}>
        <boxGeometry args={[1.84, 0.06, 1.04]} />
      </mesh>
      <mesh position={[0, 1.36, -0.08]} rotation-x={-0.3} material={lid} castShadow>
        <boxGeometry args={[1.84, 0.08, 1.06]} />
      </mesh>
      {[-0.7, 0.7].map((x) =>
        [-0.35, 0.35].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 0.09, z]} rotation-z={Math.PI / 2} material={dark}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 6]} />
          </mesh>
        ))
      )}
      <mesh position={[1.15, 0.28, 0.25]} scale={[1, 0.75, 1]} material={bag} castShadow>
        <dodecahedronGeometry args={[0.36, 0]} />
      </mesh>
      <mesh position={[1.35, 0.2, -0.2]} scale={[0.9, 0.6, 0.9]} material={bag} castShadow>
        <dodecahedronGeometry args={[0.3, 0]} />
      </mesh>
    </group>
  );
}

export function CardboardBoxes({ position }: { position: V3 }) {
  const tex = useMemo(() => makeCardboardTexture(), []);
  const mat = useMemo(() => std({ map: tex, color: "#c9a074" }), [tex]);
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} rotation-y={0.2} material={mat} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.6, 0.6]} />
      </mesh>
      <mesh position={[0.05, 0.82, 0.02]} rotation-y={-0.15} material={mat} castShadow>
        <boxGeometry args={[0.5, 0.44, 0.5]} />
      </mesh>
      <mesh position={[0.75, 0.22, 0.1]} rotation-y={0.6} material={mat} castShadow>
        <boxGeometry args={[0.45, 0.44, 0.45]} />
      </mesh>
    </group>
  );
}

export function Cone({ position }: { position: V3 }) {
  const orange = useMemo(() => std({ color: "#e0641c" }), []);
  const white = useMemo(() => std({ color: "#e8e4dc" }), []);
  const dark = useMemo(() => std({ color: "#1c1c20" }), []);
  return (
    <group position={position} rotation-y={0.4}>
      <mesh position={[0, 0.03, 0]} material={dark} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} material={orange} castShadow>
        <coneGeometry args={[0.2, 0.66, 7]} />
      </mesh>
      <mesh position={[0, 0.38, 0]} material={white}>
        <cylinderGeometry args={[0.11, 0.135, 0.1, 7]} />
      </mesh>
    </group>
  );
}

export function Hydrant({ position }: { position: V3 }) {
  const red = useMemo(() => std({ color: "#b8332a", roughness: 0.6 }), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} material={red}>
        <cylinderGeometry args={[0.16, 0.18, 0.12, 8]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={red} castShadow>
        <cylinderGeometry args={[0.12, 0.13, 0.6, 8]} />
      </mesh>
      <mesh position={[0, 0.74, 0]} material={red} castShadow>
        <sphereGeometry args={[0.14, 8, 6]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation-z={Math.PI / 2} material={red}>
        <cylinderGeometry args={[0.06, 0.06, 0.42, 6]} />
      </mesh>
      <mesh position={[0, 0.5, 0.15]} rotation-x={Math.PI / 2} material={red}>
        <cylinderGeometry args={[0.06, 0.06, 0.16, 6]} />
      </mesh>
    </group>
  );
}

export function Tire({ position }: { position: V3 }) {
  const tyre = useMemo(() => std({ color: "#141416", roughness: 0.9 }), []);
  return (
    <mesh position={[position[0], position[1] + 0.11, position[2]]} rotation-x={Math.PI / 2} material={tyre} castShadow receiveShadow>
      <torusGeometry args={[0.3, 0.11, 6, 10]} />
    </mesh>
  );
}

export function Manhole({ position }: { position: V3 }) {
  const iron = useMemo(() => std({ color: "#1f1f24", roughness: 0.7, metalness: 0.3 }), []);
  return (
    <mesh position={[position[0], position[1] + 0.015, position[2]]} material={iron} receiveShadow>
      <cylinderGeometry args={[0.42, 0.42, 0.03, 9]} />
    </mesh>
  );
}

export function Puddles() {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0b0d14", roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.9 }),
    []
  );
  const list = useMemo(
    () =>
      [
        { p: [1.3, 0.008, 2.3] as V3, s: [1.6, 1.0] as [number, number], r: 0.4 },
        { p: [-3.4, 0.008, 0.2] as V3, s: [1.1, 0.7] as [number, number], r: -0.6 },
        { p: [3.3, 0.008, -0.2] as V3, s: [0.9, 0.6] as [number, number], r: 0.2 },
      ],
    []
  );
  return (
    <>
      {list.map((q, i) => (
        <mesh key={i} position={q.p} rotation={[-Math.PI / 2, 0, q.r]} scale={[q.s[0], q.s[1], 1]} material={mat} receiveShadow>
          <circleGeometry args={[1, 9]} />
        </mesh>
      ))}
    </>
  );
}

export function Trash() {
  const paper = useMemo(() => std({ color: "#b9b4a6" }), []);
  const glass = useMemo(() => std({ color: "#2e5a3a", roughness: 0.3 }), []);
  const can = useMemo(() => std({ color: "#8a8f99", roughness: 0.4, metalness: 0.4 }), []);
  const papers = useMemo(() => {
    const r = rng(5);
    return new Array(6).fill(0).map(() => ({
      p: [-3.5 + r() * 8, 0.06, -1.6 + r() * 4.2] as V3,
      s: 0.06 + r() * 0.05,
      rot: [r() * 3, r() * 3, r() * 3] as V3,
    }));
  }, []);
  return (
    <group>
      {papers.map((q, i) => (
        <mesh key={i} position={q.p} rotation={q.rot} scale={q.s} material={paper} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      <mesh position={[3.4, 0.07, -1.2]} rotation={[0, 0.7, Math.PI / 2]} material={glass} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.34, 6]} />
      </mesh>
      <mesh position={[-2.6, 0.06, 1.3]} rotation={[0, 0.2, Math.PI / 2]} material={can} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.16, 6]} />
      </mesh>
    </group>
  );
}

export function UtilityPole({ position }: { position: V3 }) {
  const wood = useMemo(() => std({ color: "#2a211a" }), []);
  const metal = useMemo(() => std({ color: "#4a4d55" }), []);
  const wires = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: "#15151c" });
    const top = new THREE.Vector3(position[0], position[1] + 6.7, position[2]);
    const ends = [new THREE.Vector3(-0.6, 4.0, FRONT_Z + 0.2), new THREE.Vector3(16, 7.6, -6), new THREE.Vector3(14, 7.2, 4)];
    return ends.map((end) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const p = top.clone().lerp(end, t);
        p.y -= Math.sin(t * Math.PI) * 0.6;
        pts.push(p);
      }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    });
  }, [position]);
  return (
    <group>
      <group position={position}>
        <mesh position={[0, 3.5, 0]} material={wood} castShadow>
          <cylinderGeometry args={[0.11, 0.15, 7, 6]} />
        </mesh>
        <mesh position={[0, 6.4, 0]} material={wood}>
          <boxGeometry args={[1.5, 0.1, 0.1]} />
        </mesh>
        <mesh position={[0.25, 5.4, 0]} material={metal} castShadow>
          <boxGeometry args={[0.5, 0.75, 0.5]} />
        </mesh>
      </group>
      {wires.map((w, i) => (
        <primitive key={i} object={w} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  neighbouring building + distant city                               */
/* ------------------------------------------------------------------ */
export function NeighborBuilding() {
  const brick = useMemo(() => makeBrickTexture(7, 6, "grey"), []);
  const mat = useMemo(() => std({ map: brick, color: "#9a9aa2" }), [brick]);
  const win = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffca7a", toneMapped: false }), []);
  const frame = useMemo(() => std({ color: "#2a2a30" }), []);
  const pipe = useMemo(() => std({ color: "#3a3a40" }), []);
  const x0 = 6.3;
  const w = 9;
  const d = 7.5;
  const h = 7.4;
  const z0 = FRONT_Z - 0.4;
  return (
    <group>
      <mesh position={[x0 + w / 2, h / 2, z0 - d / 2]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {[
        [7.9, 2.9, true],
        [10.1, 5.1, true],
        [7.9, 5.1, false],
      ].map(([x, y, lit], i) => (
        <group key={i} position={[x as number, y as number, z0 + 0.02]}>
          <mesh material={frame}>
            <boxGeometry args={[0.95, 1.2, 0.06]} />
          </mesh>
          {lit && (
            <mesh position={[0, 0, 0.035]} material={win}>
              <planeGeometry args={[0.75, 1.0]} />
            </mesh>
          )}
          {lit && (
            <mesh position={[0, 0, 0.045]} material={frame}>
              <boxGeometry args={[0.06, 1.0, 0.02]} />
            </mesh>
          )}
        </group>
      ))}
      <mesh position={[x0 + 0.25, h / 2, z0 + 0.12]} material={pipe}>
        <cylinderGeometry args={[0.07, 0.07, h, 6]} />
      </mesh>
    </group>
  );
}

function Building({ x, h, w, z, d, seed }: { x: number; h: number; w: number; z: number; d: number; seed: number }) {
  const tex = useMemo(
    () => makeBuildingTexture(seed, Math.max(3, Math.round(w / 1.2)), Math.max(4, Math.round(h / 1.2))),
    [seed, w, h]
  );
  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  );
}

function Antenna({ position }: { position: V3 }) {
  const ref = useRef<THREE.Sprite>(null);
  const tex = useMemo(() => makeGlowTexture(), []);
  useFrame((s) => {
    if (ref.current) (ref.current.material as THREE.SpriteMaterial).opacity = Math.sin(s.clock.elapsedTime * 2.6) > 0.3 ? 0.9 : 0.05;
  });
  return (
    <sprite ref={ref} position={position} scale={[0.9, 0.9, 1]}>
      <spriteMaterial map={tex} color="#ff2a2a" transparent depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

export function CityBackdrop() {
  const items = useMemo(() => {
    const r = rng(77);
    return new Array(9).fill(0).map((_, i) => ({
      x: -26 + i * 6.5 + (r() - 0.5) * 3,
      h: 7 + r() * 12,
      w: 4 + r() * 4,
      z: -17 - r() * 8,
      d: 4 + r() * 4,
      seed: 100 + i,
    }));
  }, []);
  const glow = useMemo(() => makeGlowTexture(), []);
  const tallest = items.reduce((a, b) => (b.h > a.h ? b : a), items[0]);
  return (
    <group>
      {items.map((b, i) => (
        <Building key={i} {...b} />
      ))}
      <sprite position={[2, 6, -30]} scale={[70, 22, 1]}>
        <spriteMaterial map={glow} color="#5a2e4a" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <Antenna position={[tallest.x, tallest.h + 1.2, tallest.z]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  posters                                                            */
/* ------------------------------------------------------------------ */
function Poster({ p, ry, seed, s, tilt }: { p: V3; ry: number; seed: number; s: number; tilt: number }) {
  const tex = useMemo(() => makePosterTexture(seed), [seed]);
  const mat = useMemo(
    () =>
      ps1(
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 1,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        })
      ),
    [tex]
  );
  return (
    <mesh position={p} rotation={[0, ry, tilt]} scale={[s, s * 1.5, 1]} material={mat} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export function Posters() {
  const list = useMemo(
    () => [
      { p: [WALL_FACE_X + 0.03, 1.5, -1.5] as V3, ry: Math.PI / 2, seed: 1, s: 0.55, tilt: 0.05 },
      { p: [WALL_FACE_X + 0.03, 2.4, -1.15] as V3, ry: Math.PI / 2, seed: 2, s: 0.5, tilt: -0.08 },
      { p: [WALL_FACE_X + 0.03, 1.9, 1.4] as V3, ry: Math.PI / 2, seed: 3, s: 0.6, tilt: 0.03 },
      { p: [-0.45, 1.75, FRONT_Z + 0.03] as V3, ry: 0, seed: 4, s: 0.55, tilt: -0.04 },
      { p: [4.2, 1.5, FRONT_Z + 0.03] as V3, ry: 0, seed: 5, s: 0.5, tilt: 0.06 },
    ],
    []
  );
  return (
    <>
      {list.map((q, i) => (
        <Poster key={i} {...q} />
      ))}
    </>
  );
}
