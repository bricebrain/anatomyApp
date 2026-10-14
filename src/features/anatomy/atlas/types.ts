export type AtlasSystemId =
  | 'skeletal'
  | 'muscular'
  | 'arterial'
  | 'venous'
  | 'nervous'
  | 'digestive'
  | 'respiratory'
  | 'urinary'
  | 'reproductive'
  | 'lymphatic'
  | 'endocrine'
  | 'integumentary'
  | 'connective'
  | 'sensory'
  | 'cardiac'
  | 'pregnancy'
  | 'brain'
  | 'borrowed'
  | 'donor-muscle';

export type AtlasBodyVariant = 'male' | 'female';
export type AtlasView = 'three-quarter' | 'front' | 'back' | 'side';

export type AtlasPart = {
  id: string;
  name: string;
  conceptId: string;
  system: AtlasSystemId;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: [number[], number[]];
};

export type AtlasConcept = {
  id: string;
  name: string;
  elements: string[];
};

export type AtlasManifest = {
  version: string;
  sex?: AtlasBodyVariant;
  source?: string;
  scope?: string;
  parts: AtlasPart[];
  concepts: AtlasConcept[];
  chunks: {
    url: string;
    bytes: number;
    gzip?: string;
    gzipBytes?: number;
  }[];
  triangles: number;
};

export type AtlasSceneState = {
  visibleSystems: AtlasSystemId[];
  selectedPartIds: string[];
  isolate: boolean;
  view: AtlasView;
  resetToken: number;
};

export type AtlasSearchResult = {
  structureId: string;
  conceptId: string;
  originalLabel: string;
  label: string;
  aliases: string[];
  description?: string;
  partIds: string[];
  systemIds: AtlasSystemId[];
  localStructureId?: string;
  curated: boolean;
};

export type AtlasCameraSnapshot = {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  projection: 'perspective';
};

export type AtlasViewerSnapshot = {
  image: Blob;
  width: number;
  height: number;
  selectedStructureIds: string[];
  visibilityPreset: string;
  camera: AtlasCameraSnapshot;
  provenanceIds: string[];
};

export type HumanAtlasViewerHandle = {
  exportSnapshot(): Promise<AtlasViewerSnapshot>;
};
