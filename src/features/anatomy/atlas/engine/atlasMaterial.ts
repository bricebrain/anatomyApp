import * as THREE from 'three';

export function createAtlasMaterial(
  color: string,
  partState: THREE.DataTexture,
  selectionState: THREE.DataTexture,
  stateWidth: number,
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.06,
    roughness: 0.56,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.partState = { value: partState };
    shader.uniforms.selectionState = { value: selectionState };
    shader.uniforms.stateWidth = { value: stateWidth };
    shader.vertexShader = `
      attribute float partIndex;
      uniform sampler2D partState;
      uniform sampler2D selectionState;
      uniform float stateWidth;
      varying float partVisible;
      varying float partSelected;
    ${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5);
       vec4 state = texture2D(partState, stateUv);
       transformed += state.xyz;
       partVisible = state.w;
       partSelected = texture2D(selectionState, stateUv).r;`,
    );
    shader.fragmentShader = `
      varying float partVisible;
      varying float partSelected;
    ${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.75, 0.65), partSelected * 0.82);',
    );
  };
  return material;
}
