import * as THREE from "three";

/**
 * Snaps vertices in screen space + forces flat shading, which together give
 * that wobbly PlayStation-1 / low-poly indie look.
 */
export function ps1<T extends THREE.Material>(material: T, snap = 220, wobble = 0): T {
  const mat = material as unknown as {
    onBeforeCompile: (shader: THREE.WebGLProgramParametersWithUniforms) => void;
    flatShading: boolean;
    customProgramCacheKey?: () => string;
  };
  mat.flatShading = true;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        ${wobble > 0 ? `transformed += vec3(sin(position.y * 37.0 + position.x * 21.0), cos(position.x * 41.0), sin(position.z * 33.0)) * ${wobble.toFixed(3)};` : ""}`
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
         gl_Position.xyz /= gl_Position.w;
         gl_Position.xy = floor(gl_Position.xy * ${snap.toFixed(1)}) / ${snap.toFixed(1)};
         gl_Position.xyz *= gl_Position.w;`
      );
  };
  mat.customProgramCacheKey = () => `ps1-${snap}-${wobble}`;
  return material;
}

export function ps1Standard(
  params: THREE.MeshStandardMaterialParameters & { snap?: number; wobble?: number }
) {
  const { snap = 220, wobble = 0, ...rest } = params;
  return ps1(new THREE.MeshStandardMaterial(rest), snap, wobble);
}
