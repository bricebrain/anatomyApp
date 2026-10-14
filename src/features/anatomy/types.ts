/**
 * Référentiel commun des structures anatomiques (extension 2026-10).
 *
 * Une « structure » est un élément anatomique NOMMÉ (humérus, cœur…),
 * distinct des assets qui la représentent : une structure peut posséder
 * plusieurs représentations (planche 2D du catalogue, image personnelle,
 * modèle 3D GLB) sans que son nom dépende d'un titre de fichier.
 *
 * Le référentiel sert de source unique pour :
 *  - la navigation « Explorer le corps » ;
 *  - les questions de quiz (targetStructureId / options) ;
 *  - le lien entre un dessin et la structure dessinée.
 */

export type AnatomySystem =
  | 'skeletal'
  | 'muscular'
  | 'cardiovascular'
  | 'respiratory'
  | 'nervous'
  | 'digestive'
  | 'other';

export type AnatomyRegion =
  | 'head-neck'
  | 'thorax'
  | 'abdomen-pelvis'
  | 'upper-limb'
  | 'lower-limb'
  | 'back'
  | 'other';

export type AnatomyDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** Libellés français des énumérations (interface 100 % française). */
export const SYSTEM_LABELS: Record<AnatomySystem, string> = {
  skeletal: 'Squelette',
  muscular: 'Muscles',
  cardiovascular: 'Système cardiovasculaire',
  respiratory: 'Système respiratoire',
  nervous: 'Système nerveux',
  digestive: 'Système digestif',
  other: 'Autre',
};

export const REGION_LABELS: Record<AnatomyRegion, string> = {
  'head-neck': 'Tête et cou',
  thorax: 'Thorax',
  'abdomen-pelvis': 'Abdomen et bassin',
  'upper-limb': 'Bras et main',
  'lower-limb': 'Jambe et pied',
  back: 'Dos',
  other: 'Autre',
};

export const DIFFICULTY_LABELS: Record<AnatomyDifficulty, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export type AnatomyStructure = {
  /** ID interne stable, ex. 'humerus'. */
  id: string;
  nameFr: string;
  nameEn: string;
  synonymsFr?: string[];
  /** Courte description factuelle, relue. */
  descriptionFr?: string;
  system: AnatomySystem;
  region: AnatomyRegion;
  difficulty: AnatomyDifficulty;
  externalIds?: { fma?: string; other?: string };
  /** IDs d'entrées du catalogue local 2D (public/anatomy/catalog.json). */
  reference2dIds: string[];
  /** IDs d'assets 3D locaux (data/assets3d.ts). */
  reference3dIds: string[];
  /** IDs de questions de quiz vérifiées ciblant cette structure. */
  quizQuestionIds: string[];
};

/** Crédits obligatoires pour toute ressource externe (§5 du cahier des charges). */
export type ResourceCredits = {
  sourceName: string;
  sourcePageUrl: string;
  author?: string;
  license: string;
  licenseUrl?: string;
  modifications?: string;
  datasetVersion?: string;
};

export type Anatomy3DAsset = {
  id: string;
  /** Nom court présenté dans le catalogue 3D. */
  label: string;
  /** Texte d'accompagnement orienté apprentissage. */
  description: string;
  /** Plusieurs si le modèle est une composition (cœur complet = plusieurs parties). */
  structureIds: string[];
  /** URL locale réelle (public/anatomy3d/), jamais inventée. */
  glbUrl: string;
  previewImageUrl?: string;
  /**
   * Table mesh → structure, RENSEIGNÉE UNIQUEMENT si vérifiée sur le fichier
   * (meshes individualisés et identifiés). Absente = quiz 3D indisponible.
   */
  meshToStructureId?: Record<string, string>;
  credits: ResourceCredits;
  fileSizeBytes?: number;
  /** Nombre de meshes du fichier (information honnête : 1 mesh = non sélectionnable). */
  meshCount?: number;
};
