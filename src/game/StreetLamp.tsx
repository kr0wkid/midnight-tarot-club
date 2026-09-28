import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ps1Standard as std } from "./ps1";
import { makeGlowTexture } from "./textures";
import { LAMP } from "./world";
import { audio } from "./audio";

/** dust motes drifting inside the cone of sodium light */
function Motes({ head, count = 75 }: { head: THREE.Vector3; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const tex = useMemo(() => makeGlowTexture(), []);
  const { positions, vel } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const h = Math.random();
      const rad = (0.2 + 2.0 * h) * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = head.x + Math.cos(a) * rad;
      positions[i * 3 + 1] = head.y - 0.15 - h * (head.y - 0.25);
      positions[i * 3 + 2] = head.z + Math.sin(a) * rad;
      vel[i * 3] = (Math.random() - 0.5) * 0.1;
      vel[i * 3 + 1] = -0.04 - Math.random() * 0.1;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    return { positions, vel };
  }, [count, head]);

  useFrame((state, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += (vel[i * 3] + Math.sin(t * 0.8 + i) * 0.03) * dt;
      arr[i * 3 + 1] += vel[i * 3 + 1] * dt;
      arr[i * 3 + 2] += (vel[i * 3 + 2] + Math.cos(t * 0.6 + i) * 0.03) * dt;
      const h = (head.y - arr[i * 3 + 1]) / head.y;
      const rad = Math.hypot(arr[i * 3] - head.x, arr[i * 3 + 2] - head.z);
      if (arr[i * 3 + 1] < 0.1 || rad > 0.25 + 2.1 * h) {
        const hh = Math.random() * 0.3;
        const rr = (0.2 + 2.0 * hh) * Math.sqrt(Math.random());
        const a = Math.random() * Math.PI * 2;
        arr[i * 3] = head.x + Math.cos(a) * rr;
        arr[i * 3 + 1] = head.y - 0.15 - hh * (head.y - 0.25);
        arr[i * 3 + 2] = head.z + Math.sin(a) * rr;
      }
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} renderOrder={6}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        map={tex}
        color="#ffe0b3"
        transparent
        opacity={0.32}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/** a few moths bumping around the bulb */
function Moths({ head }: { head: THREE.Vector3 }) {
  const group = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeGlowTexture(), []);
  const params = useMemo(
    () => [
      { a: 3.1, b: 5.3, c: 2.7, ph: 0 },
      { a: 2.4, b: 4.1, c: 3.6, ph: 2 },
      { a: 4.2, b: 3.3, c: 2.1, ph: 4 },
    ],
    []
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current?.children.forEach((m, i) => {
      const p = params[i];
      m.position.set(
        head.x + Math.sin(t * p.a + p.ph) * 0.4 + Math.sin(t * 13 + i) * 0.03,
        head.y - 0.25 + Math.sin(t * p.b + p.ph) * 0.2,
        head.z + Math.cos(t * p.c + p.ph) * 0.35
      );
    });
  });
  return (
    <group ref={group}>
      {params.map((_, i) => (
        <sprite key={i} scale={[0.1, 0.1, 1]} renderOrder={6}>
          <spriteMaterial map={tex} color="#fff2d8" transparent opacity={0.85} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

/**
 * The sodium-vapour street lamp.
 * Casts a warm golden cone directly onto the three anime girls and tarot crate.
 * Carefully positioned target so head, shoulders, and faces receive directional light.
 */
export default function StreetLamp() {
  const spot = useRef<THREE.SpotLight>(null);
  const bulb = useRef<THREE.PointLight>(null);
  const bounce = useRef<THREE.PointLight>(null);
  const glow = useRef<THREE.Sprite>(null);
  const pole = LAMP.pole;
  const headLocal = useMemo(() => new THREE.Vector3(LAMP.head.x - pole.x, LAMP.head.y, LAMP.head.z - pole.z), [pole]);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    // Center of the circle of three girls
    o.position.set(-0.1 - pole.x, 0.7, 0.35 - pole.z);
    return o;
  }, [pole]);
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const metal = useMemo(() => std({ color: "#3c3f46", roughness: 0.7, metalness: 0.25 }), []);
  const lensMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd89a", toneMapped: false }), []);
  const st = useRef({ level: 1, nextEvent: 6 + Math.random() * 8, eventEnd: 0 });

  const armLen = Math.abs(headLocal.x);
  const braceLen = Math.hypot(armLen * 0.6, 0.75);
  const braceAng = Math.atan2(0.75, armLen * 0.6);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const s = st.current;
    // occasional failing-ballast flicker
    if (t > s.nextEvent) {
      s.eventEnd = t + 0.3 + Math.random() * 0.8;
      s.nextEvent = t + 8 + Math.random() * 14;
      audio.zap();
    }
    const inEvent = t < s.eventEnd;
    const want = inEvent ? (Math.random() < 0.45 ? 0.3 + Math.random() * 0.4 : 1) : 1;
    s.level = THREE.MathUtils.damp(s.level, want, inEvent ? 45 : 6, dt);
    const buzz = 1 + Math.sin(t * 100) * 0.012 + Math.sin(t * 23.7) * 0.02 + Math.sin(t * 3.1) * 0.015;
    const L = s.level * buzz;
    if (spot.current) spot.current.intensity = 52 * L;
    if (bulb.current) bulb.current.intensity = 14 * L;
    if (bounce.current) bounce.current.intensity = 4.2 * L;
    if (glow.current) {
      const sc = 1.7 * (0.75 + 0.3 * L);
      glow.current.scale.set(sc, sc * 0.6, 1);
      (glow.current.material as THREE.SpriteMaterial).opacity = 0.55 * L;
    }
    lensMat.color.setRGB(1, 0.85, 0.6).multiplyScalar(0.3 + 0.7 * L);
  });

  return (
    <group position={[pole.x, pole.y, pole.z]}>
      {/* base + pole */}
      <mesh position={[0, 0.22, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.2, 0.27, 0.45, 7]} />
      </mesh>
      <mesh position={[0, (headLocal.y + 0.2) / 2, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.07, 0.1, headLocal.y + 0.2, 6]} />
      </mesh>
      {/* arm + brace */}
      <mesh position={[headLocal.x / 2, headLocal.y + 0.12, 0]} material={metal} castShadow>
        <boxGeometry args={[armLen, 0.09, 0.09]} />
      </mesh>
      <mesh
        position={[headLocal.x * 0.3, headLocal.y - 0.225, 0]}
        rotation-z={Math.sign(headLocal.x) * braceAng}
        material={metal}
      >
        <boxGeometry args={[braceLen, 0.06, 0.06]} />
      </mesh>
      {/* cobra head + lens */}
      <mesh position={[headLocal.x, headLocal.y + 0.04, 0]} material={metal} castShadow>
        <boxGeometry args={[0.66, 0.16, 0.34]} />
      </mesh>
      <mesh position={[headLocal.x, headLocal.y - 0.05, 0]} material={lensMat}>
        <boxGeometry args={[0.52, 0.05, 0.26]} />
      </mesh>
      <sprite ref={glow} position={[headLocal.x, headLocal.y - 0.1, 0]} scale={[1.7, 1.0, 1]} renderOrder={5}>
        <spriteMaterial map={glowTex} color="#ffc070" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* Main key light: sodium spotlight cone covering the three girls */}
      <spotLight
        ref={spot}
        position={[headLocal.x, headLocal.y - 0.08, 0]}
        target={target}
        color="#ffb65a"
        intensity={52}
        distance={22}
        angle={0.92}
        penumbra={0.65}
        decay={1.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0012}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <primitive object={target} />

      {/* Point bulb for radial ambient illumination under the lamp head */}
      <pointLight ref={bulb} position={[headLocal.x, headLocal.y - 0.15, 0]} color="#ffba66" intensity={14} distance={12} decay={1.8} />

      {/* Warm ground bounce fill to lift underside shadows on the girls' faces & jeans */}
      <pointLight
        ref={bounce}
        position={[-0.1 - pole.x, 0.3, 0.35 - pole.z]}
        color="#ff9844"
        intensity={4.2}
        distance={4.5}
        decay={2}
      />

      <Motes head={headLocal} />
      <Moths head={headLocal} />
    </group>
  );
}
