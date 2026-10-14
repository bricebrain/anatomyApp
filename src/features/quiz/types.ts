/**
 * Types du quiz d'identification anatomique (mode B du dossier d'extension).
 *
 * Règles (§2.4) :
 *  - les questions sont PRÉPARÉES ET VALIDÉES à la main, jamais déduites
 *    automatiquement d'une image ni générées par un modèle de langage ;
 *  - les zones « toucher » sont des formes stables dans les coordonnées du
 *    SCHÉMA SOURCE (viewBox SVG), pas du viewport : l'alignement survit au
 *    zoom, aux marges et au changement d'orientation (test B02) ;
 *  - `options` contient des IDs de structures du référentiel, jamais des
 *    réponses libres.
 */

export type QuizMode = 'tap-2d' | 'name-highlighted' | 'tap-3d';

/** Zone tactile d'une question, en coordonnées normalisées [0, 1] du schéma. */
export type ImageHotspot = {
  structureId: string;
  /** Polygone normalisé sur le viewBox du schéma source. */
  polygon: Array<{ x: number; y: number }>;
};

export type AnatomyQuizQuestion = {
  id: string;
  mode: QuizMode;
  promptFr: string;
  /** Structure à trouver (B1) ou à nommer (B2). */
  targetStructureId: string;
  /** Schéma interactif local utilisé par les modes 2D (ID du schéma). */
  imageAssetId?: string;
  model3dAssetId?: string;
  /** Hotspots B1 : une zone par structure touchable du schéma. */
  hotspots?: ImageHotspot[];
  /** B2 : quatre IDs de structures de même niveau de catégorie. */
  options?: string[];
  explanationFr: string;
  /** Une question n'est proposée que si sa correction est validée. */
  verified: boolean;
};

/** Petit résultat local, sans backend (§2.4). */
export type QuizResult = {
  id: string;
  questionId: string;
  structureId: string;
  mode: QuizMode;
  correct: boolean;
  answeredAt: string;
};
