import { useMemo } from "react";
import * as THREE from "three";
import { ps1 } from "./ps1";
import { makeTagTexture } from "./textures";
import { FRONT_Z, WALL_FACE_X } from "./world";

export type TagData = {
  id: number;
  word: string;
  color: string;
  seed: number;
  scale: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
};

/** tags that were already on the walls when we got here */
const STATIC_TAGS: TagData[] = [
  { id: 1, word: "EDC", color: "#ff4fa3", seed: 12, scale: 1.55, x: 3.1, y: 1.75, z: FRONT_Z + 0.04, rotY: 0 },
  { id: 2, word: "MEOW", color: "#4fd2ff", seed: 33, scale: 1.1, x: 0.9, y: 1.25, z: FRONT_Z + 0.04, rotY: 0 },
  { id: 3, word: "2:06", color: "#ff7a1f", seed: 66, scale: 0.9, x: 5.1, y: 1.1, z: FRONT_Z + 0.04, rotY: 0 },
  { id: 4, word: "КОТ", color: "#c77dff", seed: 71, scale: 1.0, x: -2.6, y: 2.2, z: FRONT_Z + 0.1, rotY: 0 },
  { id: 5, word: "НОЧЬ", color: "#ffe14f", seed: 41, scale: 1.3, x: WALL_FACE_X + 0.04, y: 1.9, z: -2.1, rotY: Math.PI / 2 },
  { id: 6, word: "★", color: "#f4f4f4", seed: 8, scale: 0.8, x: WALL_FACE_X + 0.04, y: 1.15, z: -0.9, rotY: Math.PI / 2 },
  { id: 7, word: "ZZZ", color: "#7cff4f", seed: 57, scale: 1.2, x: WALL_FACE_X + 0.04, y: 1.55, z: 0.5, rotY: Math.PI / 2 },
  { id: 8, word: "PUNK", color: "#ff3b3b", seed: 90, scale: 1.0, x: WALL_FACE_X + 0.04, y: 2.2, z: 2.1, rotY: Math.PI / 2 },
];

function Tag({ tag }: { tag: TagData }) {
  const mat = useMemo(
    () =>
      ps1(
        new THREE.MeshStandardMaterial({
          map: makeTagTexture(tag.word, tag.color, tag.seed),
          transparent: true,
          roughness: 1,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3,
        })
      ),
    [tag]
  );
  return (
    <mesh
      position={[tag.x, tag.y, tag.z]}
      rotation-y={tag.rotY}
      scale={[1.6 * tag.scale, 0.8 * tag.scale, 1]}
      material={mat}
      renderOrder={2}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export function TagsLayer() {
  return (
    <group>
      {STATIC_TAGS.map((t) => (
        <Tag key={t.id} tag={t} />
      ))}
    </group>
  );
}
