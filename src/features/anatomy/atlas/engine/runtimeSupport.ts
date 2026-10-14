import * as THREE from 'three';
import type { AtlasManifest } from '../types';
import { PointerTap } from './PointerTap';

export function addDirectionalLight(
  scene: THREE.Scene,
  color: number,
  intensity: number,
  position: [number, number, number],
) {
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(...position);
  scene.add(light);
}

export function createStageDecor(): THREE.Mesh[] {
  // Fond transparent : le dégradé rose de la page reste visible derrière le corps.
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.7, 0.028, 100),
    new THREE.MeshStandardMaterial({ color: 0xffe3ee, metalness: 0.08, roughness: 0.6 }),
  );
  platform.position.y = -0.016;
  return [platform];
}

export function disposeObject(object: THREE.Mesh) {
  object.geometry.dispose();
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => material.dispose());
}

export function installPicking(options: {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  atlas: AtlasManifest;
  partData: Float32Array;
  pickers: Array<THREE.Mesh | undefined>;
  onSelect(partId: string): void;
  isReady(): boolean;
}): () => void {
  const { renderer, camera, atlas, partData, pickers, onSelect, isReady } = options;
  const tap = new PointerTap();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const down = (event: PointerEvent) => tap.down(
    event.pointerId,
    event.clientX,
    event.clientY,
    event.pointerType === 'touch' ? 12 : 5,
  );
  const move = (event: PointerEvent) => tap.move(event.pointerId, event.clientX, event.clientY);
  const cancel = (event: PointerEvent) => tap.cancel(event.pointerId);
  const up = (event: PointerEvent) => {
    if (!tap.up(event.pointerId, event.clientX, event.clientY) || !isReady()) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    let nearest = Number.POSITIVE_INFINITY;
    let selected = -1;
    pickers.forEach((mesh, index) => {
      if (!mesh || partData[index * 4 + 3] < 0.5) return;
      const hit = raycaster.intersectObject(mesh, false)[0];
      if (hit && hit.distance < nearest) {
        nearest = hit.distance;
        selected = index;
      }
    });
    if (selected >= 0) onSelect(atlas.parts[selected].id);
  };
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', up);
  renderer.domElement.addEventListener('pointercancel', cancel);
  return () => {
    renderer.domElement.removeEventListener('pointerdown', down);
    renderer.domElement.removeEventListener('pointermove', move);
    renderer.domElement.removeEventListener('pointerup', up);
    renderer.domElement.removeEventListener('pointercancel', cancel);
  };
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob?.size) resolve(blob);
      else reject(new Error('La capture WebGL a échoué.'));
    }, 'image/png');
  });
}
