import type { Anatomy3DAsset } from '../types';

/**
 * Manifeste des modèles 3D LOCALEMENT présents dans public/anatomy3d/.
 *
 * Chaque entrée a été téléchargée depuis sa fiche officielle après
 * vérification de la licence (2026-10-14). Aucun modèle n'est référencé
 * sans fichier réellement présent.
 *
 * Les fichiers sont servis localement et chargés uniquement à l'ouverture
 * d'une fiche. Les métadonnées restent conservées pour la traçabilité.
 */

export const assets3d: Anatomy3DAsset[] = [
  {
    id: 'nih3d-heart',
    label: 'Cœur',
    description: 'Observe sa forme, son apex et le départ des gros vaisseaux sous tous les angles.',
    structureIds: ['coeur'],
    // Chemin relatif à la base de l'app (résolu par glbAssetUrl).
    glbUrl: 'anatomy3d/heart.glb',
    previewImageUrl: 'anatomy3d/heart-apercu.png',
    credits: {
      sourceName: 'NIH 3D — 3DPX-022787 « Human Heart 3d Model »',
      sourcePageUrl: 'https://3d.nih.gov/entries/22787',
      author: 'Biology Notes Online (modèle fourni via NIH 3D)',
      license: 'Public Domain (domaine public, mention « Public Domain » sur la fiche)',
      modifications: 'Aucune — fichier GLB téléchargé tel quel (3 986 136 octets).',
      datasetVersion: 'submission 28984 (version 1.01), 2025-07-11',
    },
    fileSizeBytes: 3_986_136,
    // Le fichier contient UN SEUL mesh (vérifié dans l'en-tête GLB) :
    // la sélection 3D par structure et le quiz 3D sont donc indisponibles.
    meshCount: 1,
  },
  {
    id: 'nih3d-skull',
    label: 'Crâne',
    description: 'Explore les volumes du visage, les orbites et la boîte crânienne à 360°.',
    structureIds: ['crane'],
    glbUrl: 'anatomy3d/skull.glb',
    previewImageUrl: 'anatomy3d/skull-apercu.png',
    credits: {
      sourceName: 'NIH 3D — 3DPX-020591 « Skull and Eyes — Visible Human Male »',
      sourcePageUrl: 'https://3d.nih.gov/entries/20591',
      author: 'kbrowne, NIH 3D',
      license: 'CC BY',
      modifications: 'Aucune — version basse résolution fournie par NIH 3D.',
      datasetVersion: 'submission 43283 (version 2)',
    },
    fileSizeBytes: 7_662_468,
    meshCount: 17,
  },
  {
    id: 'nih3d-brain',
    label: 'Cerveau',
    description: 'Repère les deux hémisphères et dessine les grands reliefs de sa surface.',
    structureIds: ['cerveau'],
    glbUrl: 'anatomy3d/brain.glb',
    previewImageUrl: 'anatomy3d/brain-apercu.png',
    credits: {
      sourceName: 'NIH 3D — 3DPX-021161 « Detailed Human Brain Model »',
      sourcePageUrl: 'https://3d.nih.gov/entries/21161',
      author: 'Johnson J / Milton',
      license: 'CC BY',
      modifications: 'Aucune — fichier GLB fourni par NIH 3D.',
      datasetVersion: 'submission 43648 (version 2)',
    },
    fileSizeBytes: 12_151_308,
    meshCount: 4,
  },
  {
    id: 'nih3d-lungs',
    label: 'Poumons',
    description: 'Comprends leur disposition dans le thorax et le trajet de la trachée.',
    structureIds: ['poumons'],
    glbUrl: 'anatomy3d/lungs.glb',
    previewImageUrl: 'anatomy3d/lungs-apercu.png',
    credits: {
      sourceName: 'NIH 3D — 3DPX-013408 « Respiratory System »',
      sourcePageUrl: 'https://3d.nih.gov/entries/13408',
      author: 'NIAID Bioinformatics and Computational Biosciences Branch',
      license: 'CC BY',
      modifications: 'Version 2 optimisée, fichier GLB fourni par NIH 3D.',
      datasetVersion: 'submission 17298 (version 2)',
    },
    fileSizeBytes: 7_452_788,
    meshCount: 1,
  },
];

export const assets3dById: Record<string, Anatomy3DAsset> = Object.fromEntries(
  assets3d.map((a) => [a.id, a]),
);

export function get3dAsset(id: string): Anatomy3DAsset | undefined {
  return assets3dById[id];
}

/** URL réelle d'un GLB servi par l'app (base Vite prise en compte). */
export function glbAssetUrl(asset: Anatomy3DAsset): string {
  return `${import.meta.env.BASE_URL}${asset.glbUrl}`;
}

/** URL réelle de l'aperçu d'un modèle 3D. */
export function previewImageUrl(asset: Anatomy3DAsset): string | null {
  return asset.previewImageUrl
    ? `${import.meta.env.BASE_URL}${asset.previewImageUrl}`
    : null;
}

/**
 * Un asset 3D permet-il le quiz « toucher la structure » ?
 * Vrai seulement si la table meshToStructureId existe (meshes individualisés
 * et mappés explicitement). Jamais déduit du nombre de meshes.
 */
export function supports3dQuiz(asset: Anatomy3DAsset): boolean {
  return asset.meshToStructureId !== undefined;
}
