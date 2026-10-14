import type { AtlasBodyVariant, AtlasSystemId } from './types';

export type AtlasSystemDefinition = {
  id: AtlasSystemId;
  label: string;
  color: string;
};

export const ATLAS_SYSTEMS: AtlasSystemDefinition[] = [
  { id: 'skeletal', label: 'Squelette', color: '#e2d9ba' },
  { id: 'muscular', label: 'Muscles', color: '#a85b50' },
  { id: 'cardiac', label: 'Cœur', color: '#b96760' },
  { id: 'sensory', label: 'Organes sensoriels', color: '#b0c8ce' },
  { id: 'arterial', label: 'Artères', color: '#c05245' },
  { id: 'venous', label: 'Veines', color: '#527c9f' },
  { id: 'nervous', label: 'Système nerveux', color: '#d8b565' },
  { id: 'brain', label: 'Régions cérébrales', color: '#b3a8c6' },
  { id: 'respiratory', label: 'Respiratoire', color: '#b98991' },
  { id: 'digestive', label: 'Digestif', color: '#b8916b' },
  { id: 'urinary', label: 'Urinaire', color: '#b47961' },
  { id: 'lymphatic', label: 'Lymphatique', color: '#879f7c' },
  { id: 'endocrine', label: 'Endocrinien', color: '#c5a09a' },
  { id: 'reproductive', label: 'Reproducteur', color: '#bda098' },
  { id: 'pregnancy', label: 'Référence grossesse', color: '#c8a6ae' },
  { id: 'integumentary', label: 'Surface du corps', color: '#ba9b7d' },
  { id: 'borrowed', label: 'Os dérivés du modèle masculin', color: '#9aa7b1' },
  { id: 'donor-muscle', label: 'Muscles de jambe (donneuse)', color: '#a8776e' },
  { id: 'connective', label: 'Tissus conjonctifs', color: '#aec3bb' },
];

const COMMON_VISIBLE: AtlasSystemId[] = [
  'cardiac',
  'sensory',
  'skeletal',
  'muscular',
  'arterial',
  'venous',
  'nervous',
  'brain',
  'respiratory',
  'digestive',
  'urinary',
  'lymphatic',
  'endocrine',
  'connective',
];

export function defaultVisibleSystems(body: AtlasBodyVariant): AtlasSystemId[] {
  return body === 'female' ? COMMON_VISIBLE : COMMON_VISIBLE;
}

export const ATLAS_EDITIONS = {
  male: {
    label: 'Corps masculin',
    manifest: '/models/atlas.json',
    dataset: 'BodyParts3D 4.0',
    summary: '2 234 maillages et 3 432 concepts nommés.',
    limits:
      'Référence masculine adulte. Les structures reproductrices sont masquées au départ.',
  },
  female: {
    label: 'Corps féminin',
    manifest: '/models/atlas-female.json',
    dataset: 'Human Reference Atlas female v1.10',
    summary: '1 220 maillages et 1 439 concepts, avec une couverture différente.',
    limits:
      'Référence composite : couverture musculaire et osseuse partielle. Certains os masculins ajustés et muscles d’une seconde donneuse restent identifiés séparément.',
  },
} satisfies Record<AtlasBodyVariant, Record<string, string>>;

type CuratedTerm = {
  label: string;
  aliases?: string[];
  description: string;
  localStructureId?: string;
};

/** Traductions anatomiques relues. Tout terme absent reste affiché en anglais. */
export const CURATED_ATLAS_TERMS: Record<string, CuratedTerm> = {
  heart: {
    label: 'Cœur',
    aliases: ['coeur'],
    description: 'Pompe musculaire qui propulse le sang dans les circulations pulmonaire et générale.',
    localStructureId: 'coeur',
  },
  skull: {
    label: 'Crâne',
    description: 'Ensemble osseux de la tête qui protège l’encéphale.',
    localStructureId: 'crane',
  },
  'skull and face male derived': {
    label: 'Crâne et face (issus du modèle masculin)',
    aliases: ['crâne', 'os du crâne'],
    description: 'Os empruntés à la référence masculine et ajustés à cette référence féminine ; ils ne représentent pas son anatomie propre.',
    localStructureId: 'crane',
  },
  humerus: {
    label: 'Humérus',
    aliases: ['os du bras'],
    description: 'Os du bras situé entre l’épaule et le coude.',
    localStructureId: 'humerus',
  },
  'left humerus': {
    label: 'Humérus gauche',
    aliases: ['humérus', 'os du bras'],
    description: 'Humérus gauche emprunté à la référence masculine et ajusté à la référence féminine.',
    localStructureId: 'humerus',
  },
  'right humerus': {
    label: 'Humérus droit',
    aliases: ['humérus', 'os du bras'],
    description: 'Humérus droit emprunté à la référence masculine et ajusté à la référence féminine.',
    localStructureId: 'humerus',
  },
  femur: {
    label: 'Fémur',
    aliases: ['os de la cuisse'],
    description: 'Os de la cuisse situé entre la hanche et le genou.',
    localStructureId: 'femur',
  },
  'femur left': {
    label: 'Fémur gauche',
    aliases: ['fémur', 'os de la cuisse'],
    description: 'Fémur gauche de la référence féminine.',
    localStructureId: 'femur',
  },
  'femur right': {
    label: 'Fémur droit',
    aliases: ['fémur', 'os de la cuisse'],
    description: 'Fémur droit de la référence féminine.',
    localStructureId: 'femur',
  },
  brain: {
    label: 'Cerveau',
    aliases: ['encéphale'],
    description: 'Organe central du système nerveux, organisé en régions fonctionnelles interconnectées.',
    localStructureId: 'cerveau',
  },
  liver: {
    label: 'Foie',
    description: 'Organe abdominal impliqué notamment dans le métabolisme et la production de bile.',
  },
  lungs: {
    label: 'Poumons',
    aliases: ['poumon'],
    description: 'Organes respiratoires où ont lieu les échanges gazeux avec le sang.',
    localStructureId: 'poumons',
  },
  'left lung': {
    label: 'Poumon gauche',
    aliases: ['poumon', 'poumons'],
    description: 'Poumon situé dans la moitié gauche du thorax.',
    localStructureId: 'poumons',
  },
  'right lung': {
    label: 'Poumon droit',
    aliases: ['poumon', 'poumons'],
    description: 'Poumon situé dans la moitié droite du thorax.',
    localStructureId: 'poumons',
  },
  mandible: {
    label: 'Mandibule',
    aliases: ['mâchoire inférieure'],
    description: 'Os mobile de la mâchoire inférieure.',
    localStructureId: 'mandibule',
  },
  kidney: {
    label: 'Rein',
    aliases: ['reins'],
    description: 'Organe qui filtre le sang et participe à l’équilibre hydrique et électrolytique.',
  },
  stomach: {
    label: 'Estomac',
    description: 'Organe digestif musculaire situé entre l’œsophage et l’intestin grêle.',
  },
  patella: {
    label: 'Rotule',
    description: 'Petit os situé à l’avant de l’articulation du genou.',
    localStructureId: 'rotule',
  },
  'patella left': {
    label: 'Rotule gauche',
    aliases: ['rotule', 'patella'],
    description: 'Petit os situé à l’avant du genou gauche.',
    localStructureId: 'rotule',
  },
  'patella right': {
    label: 'Rotule droite',
    aliases: ['rotule', 'patella'],
    description: 'Petit os situé à l’avant du genou droit.',
    localStructureId: 'rotule',
  },
  radius: {
    label: 'Radius',
    description: 'Os de l’avant-bras situé du côté du pouce.',
    localStructureId: 'radius',
  },
  'left radius': {
    label: 'Radius gauche',
    aliases: ['radius', 'os de l’avant-bras'],
    description: 'Radius gauche emprunté à la référence masculine et ajusté à la référence féminine.',
    localStructureId: 'radius',
  },
  'right radius': {
    label: 'Radius droit',
    aliases: ['radius', 'os de l’avant-bras'],
    description: 'Radius droit emprunté à la référence masculine et ajusté à la référence féminine.',
    localStructureId: 'radius',
  },
  ulna: {
    label: 'Ulna (cubitus)',
    aliases: ['cubitus'],
    description: 'Os de l’avant-bras situé du côté de l’auriculaire.',
    localStructureId: 'cubitus',
  },
  'left ulna': {
    label: 'Ulna gauche (cubitus)',
    aliases: ['ulna', 'cubitus'],
    description: 'Ulna gauche emprunté à la référence masculine et ajusté à la référence féminine.',
    localStructureId: 'cubitus',
  },
  'right ulna': {
    label: 'Ulna droit (cubitus)',
    aliases: ['ulna', 'cubitus'],
    description: 'Ulna droit emprunté à la référence masculine et ajusté à la référence féminine.',
    localStructureId: 'cubitus',
  },
  'vertebral column': {
    label: 'Colonne vertébrale',
    aliases: ['rachis', 'vertèbres'],
    description: 'Axe osseux du tronc qui protège la moelle épinière.',
    localStructureId: 'colonne',
  },
  pelvis: {
    label: 'Bassin',
    aliases: ['bassin osseux'],
    description: 'Ceinture osseuse reliant le tronc aux membres inférieurs.',
    localStructureId: 'bassin',
  },
};
