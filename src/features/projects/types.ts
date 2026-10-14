import type { Stroke, ViewMode, DrawingToolId } from '../drawing/types';
import type { AtlasBodyVariant, AtlasCameraSnapshot } from '../anatomy/atlas/types';

/** Type de schéma du cahier des charges §7 (affiné). */

export type DrawingProject = {
  id: string;
  name: string;
  modelAssetId?: string;
  documentWidth: number;
  documentHeight: number;
  strokes: Stroke[];
  modelOpacity: number;
  modelVisible: boolean;
  viewMode: ViewMode;
  /** Outils pertinents restaurés à la réouverture. */
  lastTool?: DrawingToolId;
  lastColor?: string;
  lastWidth?: number;
  createdAt: string;
  updatedAt: string;
  /**
   * Champs ajoutés par l'extension « catalogue / quiz / 3D » (2026-10).
   * Optionnels : les dessins existants restent lisibles sans migration,
   * et les nouveaux champs ne sont pas indexés (aucun re-hash Dexie).
   */
  /** Structure du référentiel anatomique visée par ce dessin, ex. 'humerus'. */
  anatomyStructureId?: string;
  /** D'où vient l'image de référence : capture d'une vue 3D, catalogue… */
  modelAssetOrigin?: ModelAssetOrigin;
  /** Provenance complète d'une capture issue du corps Human-Atlas. */
  anatomyReference?: DrawingAnatomyReference;
};

export type ModelAssetOrigin = 'catalog' | 'commons' | 'local-import' | '3d-capture';

export type DrawingAnatomyReference = {
  kind: 'snapshot-3d';
  provider: 'human-atlas';
  assetId: string;
  selectedStructureIds: string[];
  bodyVariant: AtlasBodyVariant;
  snapshotBlobId: string;
  camera: AtlasCameraSnapshot;
  appearancePreset: 'pedagogical-opaque';
  provenanceIds: string[];
  returnRoute: '/atlas3d';
  createdAt: string;
};

export function newProjectId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankProject(name = 'Sans titre'): DrawingProject {
  const now = new Date().toISOString();
  return {
    id: newProjectId(),
    name,
    documentWidth: 1400,
    documentHeight: 1800,
    strokes: [],
    modelOpacity: 0.45,
    modelVisible: true,
    viewMode: 'trace',
    lastTool: 'pen',
    lastColor: '#221d18',
    lastWidth: 4,
    createdAt: now,
    updatedAt: now,
  };
}
