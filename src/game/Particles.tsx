import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeSmokeTexture } from "./textures";

/** slow rising steam / smoke puffs */
export function Puff({
  position,
  count = 6,
  rise = 2.5,
  opacity = 0.08,
  speed = 0.16,
  spread = 0.5,
  tint = 0.45,
}: {
  position: [number, number, number];
  count?: number;
  rise?: number;
  opacity?: number;
  speed?: number;
  spread?: number;
  tint?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeSmokeTexture(), []);
  const parts = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        life: i / count,
        speed: speed * (0.8 + Math.random() * 0.5),
        drift: (Math.random() - 0.5) * spread,
        seed: Math.random() * 10,
      })),
    [count, speed, spread]
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t0 = state.clock.elapsedTime;
    g.children.forEach((child, i) => {
      const p = parts[i];
      p.life += dt * p.speed;
      if (p.life > 1) {
        p.life = 0;
        p.drift = (Math.random() - 0.5) * spread;
      }
      const t = p.life;
      child.position.set(
        p.drift * t + Math.sin(t0 * 0.7 + p.seed) * 0.3 * t,
        t * rise,
        Math.cos(t0 * 0.5 + p.seed) * 0.25 * t
      );
      const s = 0.4 + t * 2.2;
      child.scale.set(s, s * 0.9, 1);
      const m = (child as THREE.Sprite).material as THREE.SpriteMaterial;
      m.opacity = Math.sin(Math.PI * t) * opacity;
      const k = tint + 0.25 * (1 - t);
      m.color.setRGB(k, k * 0.92, k * 0.84);
    });
  });

  return (
    <group ref={group} position={position}>
      {parts.map((_, i) => (
        <sprite key={i} renderOrder={7}>
          <spriteMaterial map={tex} transparent opacity={0} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}
