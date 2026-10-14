import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ATLAS_SYSTEMS } from '../constants';
import type { AtlasManifest, AtlasSceneState, AtlasViewerSnapshot } from '../types';
import { createAtlasMaterial } from './atlasMaterial';
import { decodeModelResponse } from './modelDownload';
import {
  addDirectionalLight,
  canvasToBlob,
  createStageDecor,
  disposeObject,
  installPicking,
} from './runtimeSupport';

type RuntimeOptions = {
  host: HTMLDivElement;
  atlas: AtlasManifest;
  state: { current: AtlasSceneState };
  onSelect(partId: string): void;
  onProgress(percent: number): void;
  onReady(): void;
  onError(message: string): void;
};

export type AtlasRuntime = {
  capture(): Promise<AtlasViewerSnapshot>;
  dispose(): void;
};

/** Port isolé du renderer Human-Atlas : batching + textures d'état + picking. */
export function mountAtlasRuntime(options: RuntimeOptions): AtlasRuntime {
  const { host, atlas, state, onSelect, onProgress, onReady, onError } = options;
  const abort = new AbortController();
  let disposed = false;
  let frame = 0;
  let ready = false;
  let dirty = true;
  let stateKey = '';
  let cameraKey = '';

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-label', 'Corps humain interactif en trois dimensions');
  renderer.domElement.style.touchAction = 'none';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.005, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.085;
  controls.minDistance = 0.07;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * 0.96;
  controls.addEventListener('change', () => { dirty = true; });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa7acb2, 1.15));
  addDirectionalLight(scene, 0xfffaf4, 2.4, [-2, 4, 3]);
  addDirectionalLight(scene, 0xe9f0ff, 1.7, [2, 2, -3]);

  const decor = createStageDecor();
  decor.forEach((object) => scene.add(object));

  const textureWidth = THREE.MathUtils.ceilPowerOfTwo(atlas.parts.length);
  const partData = new Float32Array(textureWidth * 4);
  const partTexture = new THREE.DataTexture(partData, textureWidth, 1, THREE.RGBAFormat, THREE.FloatType);
  const selectionData = new Uint8Array(textureWidth * 4);
  const selectionTexture = new THREE.DataTexture(selectionData, textureWidth, 1);
  partTexture.needsUpdate = selectionTexture.needsUpdate = true;

  const materials = new Map(ATLAS_SYSTEMS.map((system) => [
    system.id,
    createAtlasMaterial(system.color, partTexture, selectionTexture, textureWidth),
  ]));
  const geometries: THREE.BufferGeometry[] = [];
  const bounds = atlas.parts.map((part) => new THREE.Box3(
    new THREE.Vector3().fromArray(part.bounds[0]),
    new THREE.Vector3().fromArray(part.bounds[1]),
  ));
  const pickMaterial = new THREE.MeshBasicMaterial();
  const pickers: Array<THREE.Mesh | undefined> = [];
  const partIndexById = new Map(atlas.parts.map((part, index) => [part.id, index]));

  const fitBody = () => {
    const view = state.current.view;
    const direction = view === 'front'
      ? new THREE.Vector3(0, 0.02, 1)
      : view === 'back'
        ? new THREE.Vector3(0, 0.02, -1)
        : view === 'side'
          ? new THREE.Vector3(1, 0.02, 0)
          : new THREE.Vector3(0.35, 0.06, 1).normalize();
    controls.target.set(0, 0.85, 0);
    camera.position.copy(controls.target).addScaledVector(direction, host.clientWidth < 768 ? 4.7 : 4);
    controls.update();
    dirty = true;
  };

  const fitSelection = () => {
    const selected = state.current.selectedPartIds.map((id) => partIndexById.get(id));
    const box = new THREE.Box3();
    selected.forEach((index) => {
      if (index !== undefined) box.union(bounds[index]);
    });
    if (box.isEmpty()) return fitBody();
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z, 0.03);
    const distance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.55;
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(0.2, 0.1, 1).normalize().multiplyScalar(distance));
    controls.update();
    dirty = true;
  };

  const updateState = () => {
    const next = state.current;
    const key = `${next.visibleSystems.join(',')}|${next.selectedPartIds.join(',')}|${next.isolate}|${next.view}|${next.resetToken}`;
    if (key === stateKey) return;
    const visible = new Set(next.visibleSystems);
    const selected = new Set(next.selectedPartIds);
    atlas.parts.forEach((part, index) => {
      const shown = next.isolate ? selected.has(part.id) : visible.has(part.system) || selected.has(part.id);
      partData[index * 4 + 3] = shown ? 1 : 0;
      selectionData[index * 4] = selected.has(part.id) ? 255 : 0;
    });
    partTexture.needsUpdate = selectionTexture.needsUpdate = true;
    dirty = true;
    const nextCameraKey = `${next.isolate}|${next.isolate ? next.selectedPartIds.join(',') : ''}|${next.view}|${next.resetToken}`;
    if (nextCameraKey !== cameraKey) {
      if (next.isolate && selected.size > 0) fitSelection();
      else fitBody();
      cameraKey = nextCameraKey;
    }
    stateKey = key;
  };

  const loadChunk = async (chunkIndex: number) => {
    const chunk = atlas.chunks[chunkIndex];
    const compressed = Boolean(chunk.gzip) && typeof DecompressionStream !== 'undefined';
    if (!compressed && chunk.gzip && !chunk.url) {
      throw new Error('Ce navigateur ne peut pas décompresser les données anatomiques.');
    }
    const response = await fetch(compressed ? chunk.gzip! : chunk.url, { signal: abort.signal });
    const buffer = await decodeModelResponse(response, chunk.bytes, compressed);
    if (disposed) return;
    const groups = new Map<string, THREE.BufferGeometry[]>();
    atlas.parts.forEach((part, index) => {
      if (part.chunk !== chunkIndex) return;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer, part.positions, part.vertexCount * 3), 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(new Int16Array(buffer, part.normals, part.vertexCount * 3), 3, true));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, part.indices, part.indexCount), 1));
      geometry.setAttribute('partIndex', new THREE.BufferAttribute(new Float32Array(part.vertexCount).fill(index), 1));
      geometry.boundingBox = bounds[index].clone();
      geometry.computeBoundingSphere();
      geometries.push(geometry);
      const picker = new THREE.Mesh(geometry, pickMaterial);
      picker.matrixAutoUpdate = false;
      picker.updateMatrixWorld(true);
      pickers[index] = picker;
      const list = groups.get(part.system) ?? [];
      list.push(geometry);
      groups.set(part.system, list);
    });
    groups.forEach((items, system) => {
      const geometry = mergeGeometries(items, false);
      if (!geometry) throw new Error('Impossible d’assembler la géométrie anatomique.');
      geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, materials.get(system as never));
      mesh.frustumCulled = false;
      scene.add(mesh);
    });
    dirty = true;
  };

  let loadedChunks = 0;
  void (async () => {
    try {
      let cursor = 0;
      await Promise.all(Array.from({ length: 3 }, async () => {
        while (cursor < atlas.chunks.length) {
          const index = cursor;
          cursor += 1;
          await loadChunk(index);
          loadedChunks += 1;
          onProgress(Math.round((loadedChunks / atlas.chunks.length) * 100));
        }
      }));
      if (!disposed) {
        ready = true;
        onReady();
      }
    } catch (error) {
      if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) {
        onError(error instanceof Error ? error.message : 'Le corps 3D ne peut pas être chargé.');
      }
    }
  })();

  const resize = () => {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 768 || height < 600 ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (state.current.isolate && state.current.selectedPartIds.length > 0) fitSelection();
    else fitBody();
    dirty = true;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const removePointerListeners = installPicking({ renderer, camera, atlas, partData, pickers, onSelect, isReady: () => ready });
  const animate = () => {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    updateState();
    if (controls.update()) dirty = true;
    if (dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
  };
  animate();

  const onContextLost = (event: Event) => {
    event.preventDefault();
    onError('La session 3D a été interrompue par l’appareil. Rechargez la page.');
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);

  return {
    async capture() {
      if (!ready) throw new Error('Le modèle doit être entièrement chargé avant la capture.');
      decor.forEach((object) => { object.visible = false; });
      renderer.setClearColor('#ffffff', 1);
      let image: Blob;
      try {
        renderer.render(scene, camera);
        image = await canvasToBlob(renderer.domElement);
      } finally {
        decor.forEach((object) => { object.visible = true; });
        renderer.setClearColor(0x000000, 0);
        dirty = true;
      }
      return {
        image,
        width: renderer.domElement.width,
        height: renderer.domElement.height,
        selectedStructureIds: [...state.current.selectedPartIds],
        visibilityPreset: state.current.visibleSystems.join(','),
        camera: {
          position: camera.position.toArray(),
          target: controls.target.toArray(),
          up: camera.up.toArray(),
          projection: 'perspective',
        },
        provenanceIds: [`human-atlas-${atlas.sex ?? 'male'}`],
      };
    },
    dispose() {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      removePointerListeners();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      pickMaterial.dispose();
      partTexture.dispose();
      selectionTexture.dispose();
      environment.dispose();
      decor.forEach(disposeObject);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
