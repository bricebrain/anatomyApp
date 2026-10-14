import type { AnatomyStructure } from '../types';

/**
 * Référentiel des structures anatomiques — édition 2026-10.
 *
 * Règles éditoriales :
 *  - une structure n'entre au référentiel que si elle possède AU MOINS une
 *    représentation réelle et vérifiée (planche 2D du catalogue local) ;
 *  - les IDs de planches renvoient à public/anatomy/catalog.json (fichiers
 *    présents, licences vérifiées sur Wikimedia Commons) ;
 *  - les IDs 3D renvoient à data/assets3d.ts (GLB réellement présents dans
 *    public/anatomy3d/, licence vérifiée) ;
 *  - une structure sans modèle 3D n'affiche jamais de bouton « Voir en 3D ».
 *
 * Les descriptions courtes reprennent des faits anatomiques élémentaires
 * (niveau manuel scolaire) ; elles ne remplacent pas une source médicale.
 */

export const structures: AnatomyStructure[] = [
  {
    id: 'crane',
    nameFr: 'Crâne',
    nameEn: 'Skull',
    synonymsFr: ['voûte crânienne', 'os de la tête'],
    descriptionFr:
      'Boîte osseuse de la tête : 22 os soudés (8 pour la voûte, 14 pour le visage), entre lesquels seule la mandibule est mobile.',
    system: 'skeletal',
    region: 'head-neck',
    difficulty: 'beginner',
    reference2dIds: ['gray-190'],
    reference3dIds: ['nih3d-skull'],
    quizQuestionIds: ['q-tap-crane', 'q-name-crane'],
  },
  {
    id: 'mandibule',
    nameFr: 'Mandibule',
    nameEn: 'Mandible',
    synonymsFr: ['mâchoire inférieure', 'mâchoire'],
    descriptionFr:
      'Os de la mâchoire inférieure, seul os mobile du crâne. Il porte les dents inférieures et s’articule devant l’oreille.',
    system: 'skeletal',
    region: 'head-neck',
    difficulty: 'beginner',
    reference2dIds: ['gray-176'],
    reference3dIds: [],
    quizQuestionIds: ['q-tap-mandibule'],
  },
  {
    id: 'cerveau',
    nameFr: 'Cerveau',
    nameEn: 'Brain',
    synonymsFr: ['encéphale'],
    descriptionFr:
      'Centre du système nerveux, logé dans le crâne. La planche de référence en montre une coupe sagittale médiane.',
    system: 'nervous',
    region: 'head-neck',
    difficulty: 'intermediate',
    reference2dIds: ['gray-715'],
    reference3dIds: ['nih3d-brain'],
    quizQuestionIds: [],
  },
  {
    id: 'coeur',
    nameFr: 'Cœur',
    nameEn: 'Heart',
    synonymsFr: ['muscle cardiaque', 'cœur humain'],
    descriptionFr:
      'Muscle creux qui pompe le sang dans les vaisseaux. Situé dans le thorax, entre les deux poumons, légèrement à gauche de la ligne médiane.',
    system: 'cardiovascular',
    region: 'thorax',
    difficulty: 'intermediate',
    reference2dIds: ['gray-490', 'gray-493'],
    reference3dIds: ['nih3d-heart'],
    quizQuestionIds: [],
  },
  {
    id: 'poumons',
    nameFr: 'Poumons',
    nameEn: 'Lungs',
    synonymsFr: ['poumon', 'poumon gauche', 'poumon droit'],
    descriptionFr:
      'Deux organes respiratoires logés dans le thorax, de part et d’autre du cœur et protégés par les côtes.',
    system: 'respiratory',
    region: 'thorax',
    difficulty: 'intermediate',
    reference2dIds: ['gray-970'],
    reference3dIds: ['nih3d-lungs'],
    quizQuestionIds: [],
  },
  {
    id: 'colonne',
    nameFr: 'Colonne vertébrale',
    nameEn: 'Vertebral column',
    synonymsFr: ['rachis', 'vertèbres', 'échine', 'colonne'],
    descriptionFr:
      'Empilement de 33 vertèbres — cervicales, thoraciques, lombaires, puis sacrum et coccyx — qui soutient le tronc et protège la moelle épinière.',
    system: 'skeletal',
    region: 'back',
    difficulty: 'intermediate',
    reference2dIds: ['gray-111'],
    reference3dIds: [],
    quizQuestionIds: ['q-tap-colonne'],
  },
  {
    id: 'bassin',
    nameFr: 'Bassin',
    nameEn: 'Pelvis',
    synonymsFr: ['bassin osseux', 'os coxaux', 'os iliaques', 'hanche'],
    descriptionFr:
      'Ceinture osseuse reliant la colonne vertébrale aux membres inférieurs : deux os coxaux et le sacrum.',
    system: 'skeletal',
    region: 'abdomen-pelvis',
    difficulty: 'advanced',
    reference2dIds: ['gray-241'],
    reference3dIds: [],
    quizQuestionIds: ['q-tap-bassin', 'q-name-bassin'],
  },
  {
    id: 'humerus',
    nameFr: 'Humérus',
    nameEn: 'Humerus',
    synonymsFr: ['os du bras'],
    descriptionFr:
      'Os unique du bras : il relie l’épaule (omoplate) au coude, où il s’articule avec le radius et le cubitus.',
    system: 'skeletal',
    region: 'upper-limb',
    difficulty: 'beginner',
    reference2dIds: ['gray-208'],
    reference3dIds: [],
    quizQuestionIds: ['q-tap-humerus', 'q-name-humerus'],
  },
  {
    id: 'radius',
    nameFr: 'Radius',
    nameEn: 'Radius',
    synonymsFr: ['os de l’avant-bras'],
    descriptionFr:
      'Os latéral de l’avant-bras (côté du pouce). Il descend jusqu’au poignet, qu’il porte en grande partie.',
    system: 'skeletal',
    region: 'upper-limb',
    difficulty: 'intermediate',
    reference2dIds: ['gray-213'],
    reference3dIds: [],
    quizQuestionIds: ['q-tap-radius', 'q-name-radius'],
  },
  {
    id: 'cubitus',
    nameFr: 'Cubitus',
    nameEn: 'Ulna',
    synonymsFr: ['ulna'],
    descriptionFr:
      'Os médial de l’avant-bras (côté de l’auriculaire). Son extrémité supérieure forme le pivot du coude avec l’humérus.',
    system: 'skeletal',
    region: 'upper-limb',
    difficulty: 'intermediate',
    reference2dIds: ['gray-213'],
    reference3dIds: [],
    quizQuestionIds: ['q-name-cubitus'],
  },
  {
    id: 'main',
    nameFr: 'Main (os)',
    nameEn: 'Bones of the hand',
    synonymsFr: ['os de la main', 'carpe', 'métacarpiens', 'phalanges'],
    descriptionFr:
      'Chaque main compte 27 os : 8 os du carpe, 5 métacarpiens et 14 phalanges.',
    system: 'skeletal',
    region: 'upper-limb',
    difficulty: 'advanced',
    reference2dIds: ['gray-219'],
    reference3dIds: [],
    quizQuestionIds: [],
  },
  {
    id: 'femur',
    nameFr: 'Fémur',
    nameEn: 'Femur',
    synonymsFr: ['os de la cuisse'],
    descriptionFr:
      'Os de la cuisse, le plus long et le plus solide du corps : il relie la hanche (bassin) au genou.',
    system: 'skeletal',
    region: 'lower-limb',
    difficulty: 'beginner',
    reference2dIds: ['gray-244'],
    reference3dIds: [],
    quizQuestionIds: ['q-tap-femur', 'q-name-femur'],
  },
  {
    id: 'rotule',
    nameFr: 'Rotule',
    nameEn: 'Patella',
    synonymsFr: ['patella'],
    descriptionFr:
      'Petit os plat à l’avant du genou, logé dans le tendon du muscle quadriceps ; il protège l’articulation.',
    system: 'skeletal',
    region: 'lower-limb',
    difficulty: 'beginner',
    reference2dIds: ['gray-255'],
    reference3dIds: [],
    quizQuestionIds: ['q-tap-rotule', 'q-name-rotule'],
  },
  {
    id: 'muscles-face-cou',
    nameFr: 'Muscles de la tête et du cou',
    nameEn: 'Muscles of the head and neck',
    synonymsFr: ['muscles du visage', 'muscles superficiels', 'muscles de la tête'],
    descriptionFr:
      'Planche des muscles superficiels de la tête, du visage et du cou — les muscles juste sous la peau, qui mobilisent le visage et la mâchoire.',
    system: 'muscular',
    region: 'head-neck',
    difficulty: 'intermediate',
    reference2dIds: ['gray-378'],
    reference3dIds: [],
    quizQuestionIds: [],
  },
];

export const structuresById: Record<string, AnatomyStructure> = Object.fromEntries(
  structures.map((s) => [s.id, s]),
);

export function getStructure(id: string): AnatomyStructure | undefined {
  return structuresById[id];
}

/** Régions qui possèdent au moins une structure documentée. */
export const regionsWithContent: AnatomyStructure['region'][] = [
  'head-neck',
  'thorax',
  'abdomen-pelvis',
  'upper-limb',
  'lower-limb',
  'back',
];

/** Systèmes qui possèdent au moins une structure documentée. */
export const systemsWithContent: AnatomyStructure['system'][] = [
  'skeletal',
  'muscular',
  'cardiovascular',
  'respiratory',
  'nervous',
];
