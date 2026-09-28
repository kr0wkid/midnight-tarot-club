import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ps1, ps1Standard as std } from "./ps1";
import {
  makeBlockTexture,
  makeCardboardTexture,
  makeNeonTexture,
  makeShutterTexture,
  makeSignTexture,
  makeVanTexture,
  makeWoodTexture,
} from "./textures";
import { CURB_H, FRONT_Z, GARAGE } from "./world";

const blockMat = (w: number, h: number) =>
  ps1(new THREE.MeshStandardMaterial({ map: makeBlockTexture(w / 0.8, h / 0.8), color: "#8f958a", roughness: 1 }));

/* ------------------------------------------------------------------ */
/*  the company van, parked inside for the night                       */
/* ------------------------------------------------------------------ */
function Van({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const side = useMemo(() => makeVanTexture(), []);
  const paint = useMemo(() => std({ color: "#dedad0", roughness: 0.6 }), []);
  const sideMat = useMemo(() => std({ map: side, roughness: 0.6 }), [side]);
  const dark = useMemo(() => std({ color: "#1e1f24", roughness: 0.7 }), []);
  const glass = useMemo(() => std({ color: "#0d1220", roughness: 0.2, metalness: 0.3 }), []);
  const tyre = useMemo(() => std({ color: "#141416" }), []);
  const lampOff = useMemo(() => new THREE.MeshBasicMaterial({ color: "#6e6656" }), []);
  const amber = useMemo(() => new THREE.MeshBasicMaterial({ color: "#c07a2a" }), []);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 1.15, -0.55]} material={paint} castShadow receiveShadow>
        <boxGeometry args={[2.0, 1.7, 3.1]} />
      </mesh>
      <mesh position={[1.01, 1.2, -0.55]} rotation-y={Math.PI / 2} material={sideMat}>
        <planeGeometry args={[3.0, 1.1]} />
      </mesh>
      <mesh position={[-1.01, 1.2, -0.55]} rotation-y={-Math.PI / 2} material={sideMat}>
        <planeGeometry args={[3.0, 1.1]} />
      </mesh>
      {/* cab */}
      <mesh position={[0, 0.85, 1.55]} material={paint} castShadow>
        <boxGeometry args={[1.95, 1.1, 1.2]} />
      </mesh>
      <mesh position={[0, 1.55, 1.2]} rotation-x={0.35} material={glass}>
        <boxGeometry args={[1.8, 0.75, 0.06]} />
      </mesh>
      <mesh position={[0, 0.42, 2.18]} material={dark}>
        <boxGeometry args={[2.0, 0.22, 0.12]} />
      </mesh>
      <mesh position={[0, 0.82, 2.16]} material={dark}>
        <boxGeometry args={[0.9, 0.25, 0.06]} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.84, 2.17]} material={lampOff}>
          <boxGeometry args={[0.32, 0.2, 0.05]} />
        </mesh>
      ))}
      {[-0.92, 0.92].map((x) => (
        <mesh key={x} position={[x, 0.6, 2.17]} material={amber}>
          <boxGeometry args={[0.1, 0.08, 0.05]} />
        </mesh>
      ))}
      {[
        [-0.85, 1.3],
        [0.85, 1.3],
        [-0.85, -1.4],
        [0.85, -1.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} rotation-z={Math.PI / 2} material={tyre} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.26, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function TireStack({ position }: { position: [number, number, number] }) {
  const tyre = useMemo(() => std({ color: "#141416", roughness: 0.9 }), []);
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.11 + i * 0.22, 0]} rotation-x={Math.PI / 2} material={tyre} castShadow>
          <torusGeometry args={[0.3, 0.11, 6, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function Shelf({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => std({ color: "#4a3a2c", map: makeWoodTexture("#4a3a2c", 1) }), []);
  const card = useMemo(() => std({ color: "#b58a5c", map: makeCardboardTexture() }), []);
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.9, 0.9, 0]} material={wood}>
          <boxGeometry args={[0.08, 1.8, 0.5]} />
        </mesh>
      ))}
      {[0.4, 1.0, 1.6].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={wood} castShadow>
          <boxGeometry args={[1.9, 0.06, 0.5]} />
        </mesh>
      ))}
      <mesh position={[-0.4, 0.62, 0]} material={card} castShadow>
        <boxGeometry args={[0.5, 0.38, 0.4]} />
      </mesh>
      <mesh position={[0.45, 1.22, 0]} material={card} castShadow>
        <boxGeometry args={[0.6, 0.38, 0.4]} />
      </mesh>
      <mesh position={[-0.5, 1.82, 0]} material={card} castShadow>
        <boxGeometry args={[0.4, 0.38, 0.38]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  inside: cold fluorescent light spilling out under the shutter      */
/* ------------------------------------------------------------------ */
function Interior() {
  const { x0, x1, h, depth } = GARAGE;
  const wallMat = useMemo(() => std({ color: "#4c4c52" }), []);
  const floorMat = useMemo(() => std({ color: "#3c3c41", roughness: 0.8 }), []);
  const drum = useMemo(() => std({ color: "#7a2c22", roughness: 0.7, metalness: 0.2 }), []);
  const housing = useMemo(() => std({ color: "#8a8d94", metalness: 0.3, roughness: 0.5 }), []);
  const tubeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#dcf6ff", toneMapped: false }), []);
  const spot = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(-2.6, 0, FRONT_Z + 2.4);
    return o;
  }, []);
  const cx = (x0 + x1) / 2;
  const w = x1 - x0;
  const zc = FRONT_Z - depth / 2;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // fluorescent tubes never quite sit still
    const f = 1 - Math.max(0, Math.sin(t * 37) * Math.sin(t * 5.3) - 0.9) * 4;
    if (spot.current) spot.current.intensity = 55 * f;
    tubeMat.color.setRGB(0.86, 0.96, 1).multiplyScalar(0.5 + 0.5 * f);
  });

  return (
    <group>
      <mesh position={[cx, 0.01, zc]} rotation-x={-Math.PI / 2} material={floorMat} receiveShadow>
        <planeGeometry args={[w, depth]} />
      </mesh>
      <mesh position={[cx, h / 2, FRONT_Z - depth + 0.2]} material={wallMat} receiveShadow>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[x0 + 0.35, h / 2, zc]} rotation-y={Math.PI / 2} material={wallMat}>
        <planeGeometry args={[depth, h]} />
      </mesh>
      <mesh position={[x1 - 0.35, h / 2, zc]} rotation-y={-Math.PI / 2} material={wallMat}>
        <planeGeometry args={[depth, h]} />
      </mesh>

      {/* fluorescent tube */}
      <mesh position={[-2.6, h - 0.12, -5.2]} material={housing}>
        <boxGeometry args={[1.7, 0.08, 0.18]} />
      </mesh>
      <mesh position={[-2.6, h - 0.18, -5.2]} material={tubeMat}>
        <boxGeometry args={[1.5, 0.05, 0.1]} />
      </mesh>
      <spotLight
        ref={spot}
        position={[-2.6, h - 0.3, -5.4]}
        target={target}
        color="#cfe9ff"
        intensity={55}
        distance={17}
        angle={0.62}
        penumbra={0.6}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.002}
        shadow-camera-near={0.5}
        shadow-camera-far={17}
      />
      <primitive object={target} />
      <pointLight position={[-2.2, 2.4, -6.8]} color="#bfe3ff" intensity={5} distance={6} decay={2} />

      <TireStack position={[-5.6, 0, -6.2]} />
      <Shelf position={[1.6, 0, FRONT_Z - depth + 0.55]} />
      <mesh position={[3.6, 0.45, -5.0]} material={drum} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.9, 8]} />
      </mesh>
      <Van position={[-2.3, 0, -6.3]} rotation={0.3} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  roller shutter, half open                                          */
/* ------------------------------------------------------------------ */
function Shutter() {
  const { door } = GARAGE;
  const cx = (door.x0 + door.x1) / 2;
  const w = door.x1 - door.x0;
  const open = 1.6;
  const hang = door.h - open;
  const tex = useMemo(() => makeShutterTexture(w / 0.6, hang / 0.6), [w, hang]);
  const mat = useMemo(
    () => ps1(new THREE.MeshStandardMaterial({ map: tex, color: "#b8bcc4", roughness: 0.75, metalness: 0.25 })),
    [tex]
  );
  const dark = useMemo(() => std({ color: "#33363c", metalness: 0.3, roughness: 0.6 }), []);
  return (
    <group>
      <mesh position={[cx, door.h - hang / 2, FRONT_Z + 0.02]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[w + 0.1, hang, 0.08]} />
      </mesh>
      <mesh position={[cx, open + 0.03, FRONT_Z + 0.04]} material={dark}>
        <boxGeometry args={[w + 0.14, 0.08, 0.12]} />
      </mesh>
      <mesh position={[cx, door.h + 0.22, FRONT_Z - 0.05]} rotation-z={Math.PI / 2} material={dark} castShadow>
        <cylinderGeometry args={[0.24, 0.24, w + 0.3, 8]} />
      </mesh>
      {[door.x0 - 0.08, door.x1 + 0.08].map((x) => (
        <mesh key={x} position={[x, door.h / 2, FRONT_Z + 0.03]} material={dark}>
          <boxGeometry args={[0.1, door.h, 0.14]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  neon, painted sign, flood light, window, pipes                     */
/* ------------------------------------------------------------------ */
function Neon() {
  const tex = useMemo(() => makeNeonTexture("24h", "#ff4fd8"), []);
  const light = useRef<THREE.PointLight>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }), [tex]);
  const back = useMemo(() => std({ color: "#1b1b20" }), []);
  const st = useRef({ level: 1, next: 3 });
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    const q = st.current;
    if (t > q.next) {
      q.next = t + 2 + Math.random() * 6;
      q.level = 0.2;
    }
    q.level = THREE.MathUtils.damp(q.level, 1, 10, dt);
    const L = q.level * (0.94 + Math.sin(t * 60) * 0.03);
    if (light.current) light.current.intensity = 5 * L;
    mat.opacity = 0.55 + 0.45 * L;
  });
  return (
    <group position={[2.4, 3.0, FRONT_Z]}>
      <mesh position={[0, 0, 0.04]} material={back}>
        <boxGeometry args={[1.7, 0.9, 0.06]} />
      </mesh>
      <mesh position={[0, 0, 0.09]} material={mat} renderOrder={3}>
        <planeGeometry args={[1.5, 0.75]} />
      </mesh>
      <pointLight ref={light} position={[0, -0.1, 0.55]} color="#ff4fd8" intensity={5} distance={5.5} decay={2} />
    </group>
  );
}

function WallSign() {
  const tex = useMemo(() => makeSignTexture("ГАРАЖ №7"), []);
  const mat = useMemo(
    () =>
      ps1(
        new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          roughness: 1,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        })
      ),
    [tex]
  );
  return (
    <mesh position={[-2.6, 3.2, FRONT_Z + 0.04]} material={mat} renderOrder={2}>
      <planeGeometry args={[3.0, 0.56]} />
    </mesh>
  );
}

function WallFlood() {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(-2.6, 0, FRONT_Z + 1.2);
    return o;
  }, []);
  const fixture = useMemo(() => std({ color: "#2c2f36", metalness: 0.3, roughness: 0.6 }), []);
  const bulb = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd9a8", toneMapped: false }), []);
  return (
    <group>
      <mesh position={[-2.6, 3.66, FRONT_Z + 0.16]} rotation-x={0.5} material={fixture} castShadow>
        <boxGeometry args={[0.36, 0.16, 0.3]} />
      </mesh>
      <mesh position={[-2.6, 3.58, FRONT_Z + 0.24]} rotation-x={0.5} material={bulb}>
        <boxGeometry args={[0.26, 0.02, 0.18]} />
      </mesh>
      <spotLight
        position={[-2.6, 3.56, FRONT_Z + 0.3]}
        target={target}
        color="#ffc98a"
        intensity={14}
        distance={9}
        angle={1.15}
        penumbra={0.85}
        decay={2}
      />
      <primitive object={target} />
    </group>
  );
}

function Window() {
  const frame = useMemo(() => std({ color: "#2b2b31" }), []);
  const glass = useMemo(() => std({ color: "#0a0d16", roughness: 0.2, metalness: 0.4 }), []);
  return (
    <group position={[5.2, 2.3, FRONT_Z]}>
      <mesh position={[0, 0, 0.03]} material={frame}>
        <boxGeometry args={[1.0, 0.95, 0.06]} />
      </mesh>
      <mesh position={[0, 0, 0.065]} material={glass}>
        <planeGeometry args={[0.86, 0.8]} />
      </mesh>
      {[-0.22, 0, 0.22].map((x) => (
        <mesh key={x} position={[x, 0, 0.09]} material={frame}>
          <boxGeometry args={[0.04, 0.86, 0.03]} />
        </mesh>
      ))}
    </group>
  );
}

function Fixtures() {
  const pipe = useMemo(() => std({ color: "#3b3d44" }), []);
  const ac = useMemo(() => std({ color: "#8c8f96", metalness: 0.2, roughness: 0.6 }), []);
  const grill = useMemo(() => std({ color: "#55585f" }), []);
  return (
    <group>
      <mesh position={[5.85, GARAGE.h / 2, FRONT_Z + 0.12]} material={pipe}>
        <cylinderGeometry args={[0.06, 0.06, GARAGE.h, 6]} />
      </mesh>
      <group position={[0.3, 3.05, FRONT_Z + 0.24]}>
        <mesh material={ac} castShadow>
          <boxGeometry args={[0.7, 0.5, 0.45]} />
        </mesh>
        <mesh position={[0, 0, 0.23]} rotation-x={Math.PI / 2} material={grill}>
          <cylinderGeometry args={[0.17, 0.17, 0.02, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function GrimeSkirt() {
  const { x1, door } = GARAGE;
  const mat = useMemo(
    () =>
      ps1(
        new THREE.MeshBasicMaterial({
          color: "#000000",
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        })
      ),
    []
  );
  const w = x1 - door.x1;
  return (
    <mesh position={[(door.x1 + x1) / 2, CURB_H + 0.3, FRONT_Z + 0.02]} material={mat} renderOrder={1}>
      <planeGeometry args={[w, 0.6]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  the building                                                       */
/* ------------------------------------------------------------------ */
export default function Garage() {
  const { x0, x1, h, depth, door } = GARAGE;
  const T = 0.3;
  const zc = FRONT_Z - T / 2;
  const leftW = door.x0 - x0;
  const rightW = x1 - door.x1;
  const doorW = door.x1 - door.x0;
  const lintelH = h - door.h;
  const leftMat = useMemo(() => blockMat(leftW, h), [leftW, h]);
  const rightMat = useMemo(() => blockMat(rightW, h), [rightW, h]);
  const lintelMat = useMemo(() => blockMat(doorW, lintelH), [doorW, lintelH]);
  const roofMat = useMemo(() => std({ color: "#2a2a2e" }), []);
  const trim = useMemo(() => std({ color: "#3b3f46", metalness: 0.2, roughness: 0.7 }), []);

  return (
    <group>
      <mesh position={[(x0 + door.x0) / 2, h / 2, zc]} material={leftMat} castShadow receiveShadow>
        <boxGeometry args={[leftW, h, T]} />
      </mesh>
      <mesh position={[(door.x1 + x1) / 2, h / 2, zc]} material={rightMat} castShadow receiveShadow>
        <boxGeometry args={[rightW, h, T]} />
      </mesh>
      <mesh position={[(door.x0 + door.x1) / 2, door.h + lintelH / 2, zc]} material={lintelMat} castShadow receiveShadow>
        <boxGeometry args={[doorW, lintelH, T]} />
      </mesh>
      {/* roof slab + parapet trim */}
      <mesh position={[(x0 + x1) / 2, h + 0.12, FRONT_Z - depth / 2]} material={roofMat} castShadow>
        <boxGeometry args={[x1 - x0 + 0.3, 0.25, depth + 0.3]} />
      </mesh>
      <mesh position={[(x0 + x1) / 2, h + 0.3, FRONT_Z + 0.02]} material={trim}>
        <boxGeometry args={[x1 - x0 + 0.3, 0.14, 0.2]} />
      </mesh>
      {/* side walls */}
      <mesh position={[x0 + 0.15, h / 2, FRONT_Z - depth / 2]} material={leftMat} castShadow>
        <boxGeometry args={[T, h, depth]} />
      </mesh>
      <mesh position={[x1 - 0.15, h / 2, FRONT_Z - depth / 2]} material={rightMat} castShadow>
        <boxGeometry args={[T, h, depth]} />
      </mesh>

      <Shutter />
      <Interior />
      <Neon />
      <WallSign />
      <WallFlood />
      <Window />
      <Fixtures />
      <GrimeSkirt />
    </group>
  );
}
