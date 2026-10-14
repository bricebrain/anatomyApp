import type { AnatomyQuizQuestion } from '../types';
import { SKELETON_ASSET_ID, skeletonHotspots } from './skeletonSchematic';

/**
 * Questions de quiz PRÉPARÉES ET VALIDÉES À LA MAIN (§2.4) — jamais
 * générées automatiquement ni déduites d'une image.
 *
 * Validation effective pour chaque question :
 *  - la cible existe dans le schéma interactif local (zones vectorielles
 *    ci-dessus) ET dans le référentiel de structures ;
 *  - les options B2 sont quatre structures osseuses de même niveau (pas
 *    de piège absurde) ;
 *  - l'explication est une phrase factuelle courte ;
 *  - aucune question ne repose sur gauche/droite du spectateur.
 *
 * Un test (src/tests/quizQuestions.test.ts) rejette toute régression :
 * cible absente, option manquante, question non vérifiée, etc.
 */

const SKELETON = {
  imageAssetId: SKELETON_ASSET_ID,
  hotspots: skeletonHotspots(),
};

export const quizQuestions: AnatomyQuizQuestion[] = [
  /* ---------- B1 : « Où se trouve… ? » (toucher la zone) ---------- */
  {
    id: 'q-tap-crane',
    mode: 'tap-2d',
    promptFr: 'Touchez le crâne.',
    targetStructureId: 'crane',
    ...SKELETON,
    explanationFr:
      'Le crâne est la boîte osseuse qui enferme le cerveau, au sommet de la tête.',
    verified: true,
  },
  {
    id: 'q-tap-mandibule',
    mode: 'tap-2d',
    promptFr: 'Touchez la mandibule.',
    targetStructureId: 'mandibule',
    ...SKELETON,
    explanationFr:
      'La mandibule est la mâchoire inférieure, juste sous le crâne — le seul os mobile du crâne.',
    verified: true,
  },
  {
    id: 'q-tap-colonne',
    mode: 'tap-2d',
    promptFr: 'Touchez la colonne vertébrale.',
    targetStructureId: 'colonne',
    ...SKELETON,
    explanationFr:
      'La colonne vertébrale descend au milieu du dos, du crâne au bassin, entre les deux cages de côtes.',
    verified: true,
  },
  {
    id: 'q-tap-bassin',
    mode: 'tap-2d',
    promptFr: 'Touchez le bassin.',
    targetStructureId: 'bassin',
    ...SKELETON,
    explanationFr:
      'Le bassin est la ceinture osseuse qui relie la colonne vertébrale aux fémurs.',
    verified: true,
  },
  {
    id: 'q-tap-humerus',
    mode: 'tap-2d',
    promptFr: 'Touchez l’humérus.',
    targetStructureId: 'humerus',
    ...SKELETON,
    explanationFr:
      'L’humérus est l’os unique du bras : entre l’épaule et le coude.',
    verified: true,
  },
  {
    id: 'q-tap-radius',
    mode: 'tap-2d',
    promptFr: 'Touchez le radius.',
    targetStructureId: 'radius',
    ...SKELETON,
    explanationFr:
      'Le radius est l’os de l’avant-bras côté pouce ; il descend jusqu’au poignet.',
    verified: true,
  },
  {
    id: 'q-tap-femur',
    mode: 'tap-2d',
    promptFr: 'Touchez le fémur.',
    targetStructureId: 'femur',
    ...SKELETON,
    explanationFr:
      'Le fémur est l’os de la cuisse, de la hanche au genou — le plus long du corps.',
    verified: true,
  },
  {
    id: 'q-tap-rotule',
    mode: 'tap-2d',
    promptFr: 'Touchez la rotule.',
    targetStructureId: 'rotule',
    ...SKELETON,
    explanationFr:
      'La rotule est le petit os de l’avant du genou, ronde comme un galet.',
    verified: true,
  },

  /* ---------- B2 : « Comment s’appelle cette structure ? » ---------- */
  {
    id: 'q-name-humerus',
    mode: 'name-highlighted',
    promptFr: 'Comment s’appelle l’os mis en évidence ?',
    targetStructureId: 'humerus',
    ...SKELETON,
    options: ['humerus', 'radius', 'cubitus', 'femur'],
    explanationFr:
      'L’os surligné se trouve dans le BRAS (épaule → coude) : c’est l’humérus.',
    verified: true,
  },
  {
    id: 'q-name-radius',
    mode: 'name-highlighted',
    promptFr: 'Comment s’appelle l’os mis en évidence ?',
    targetStructureId: 'radius',
    ...SKELETON,
    options: ['radius', 'cubitus', 'humerus', 'femur'],
    explanationFr:
      'C’est un os de l’avant-bras, la barbe externe côté pouce : le radius.',
    verified: true,
  },
  {
    id: 'q-name-cubitus',
    mode: 'name-highlighted',
    promptFr: 'Comment s’appelle l’os mis en évidence ?',
    targetStructureId: 'cubitus',
    ...SKELETON,
    options: ['cubitus', 'radius', 'humerus', 'femur'],
    explanationFr:
      'C’est l’autre os de l’avant-bras, côté auriculaire, qui s’articule avec l’humérus au coude : le cubitus (ulna).',
    verified: true,
  },
  {
    id: 'q-name-femur',
    mode: 'name-highlighted',
    promptFr: 'Comment s’appelle l’os mis en évidence ?',
    targetStructureId: 'femur',
    ...SKELETON,
    options: ['femur', 'humerus', 'radius', 'rotule'],
    explanationFr:
      'L’os surligné est dans la CUISSE (hanche → genou) : c’est le fémur.',
    verified: true,
  },
  {
    id: 'q-name-rotule',
    mode: 'name-highlighted',
    promptFr: 'Comment s’appelle le petit os mis en évidence ?',
    targetStructureId: 'rotule',
    ...SKELETON,
    options: ['rotule', 'femur', 'bassin', 'humerus'],
    explanationFr:
      'Le petit os rond à l’avant du genou est la rotule (patella).',
    verified: true,
  },
  {
    id: 'q-name-crane',
    mode: 'name-highlighted',
    promptFr: 'Comment s’appelle l’os mis en évidence ?',
    targetStructureId: 'crane',
    ...SKELETON,
    options: ['crane', 'mandibule', 'bassin', 'femur'],
    explanationFr:
      'La boîte osseuse qui enferme le cerveau est le crâne ; la mandibule est la mâchoire, plus bas.',
    verified: true,
  },
  {
    id: 'q-name-bassin',
    mode: 'name-highlighted',
    promptFr: 'Comment s’appelle l’ensemble osseux mis en évidence ?',
    targetStructureId: 'bassin',
    ...SKELETON,
    options: ['bassin', 'colonne', 'femur', 'humerus'],
    explanationFr:
      'La ceinture osseuse entre le tronc et les jambes est le bassin ; la colonne vertébrale arrive dedans par le sacrum.',
    verified: true,
  },
];

/** Seules les questions VÉRIFIÉES sont proposées (§2.4, critère B). */
export const verifiedQuestions: AnatomyQuizQuestion[] = quizQuestions.filter(
  (q) => q.verified,
);

export function questionsById(id: string): AnatomyQuizQuestion | undefined {
  return verifiedQuestions.find((q) => q.id === id);
}
