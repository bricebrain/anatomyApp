import { structures } from '../data/structures';
import type { AnatomyStructure } from '../types';

/**
 * Recherche française sur le référentiel : nom, synonymes et (en secours)
 * nom anglais. Les accents sont normalisés — « crane », « femur » et
 * « rachis » doivent tous fonctionner. Les résultats viennent uniquement
 * du référentiel documenté : rien n'est inventé.
 */

export function normalizeFr(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/['’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SearchHit = {
  structure: AnatomyStructure;
  /** Où le terme a été trouvé (pour le tri : nom > synonyme > anglais). */
  field: 'name' | 'synonym' | 'english';
};

export function searchStructures(query: string): SearchHit[] {
  const q = normalizeFr(query);
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const structure of structures) {
    if (normalizeFr(structure.nameFr).includes(q)) {
      hits.push({ structure, field: 'name' });
      continue;
    }
    if (
      (structure.synonymsFr ?? []).some((syn) => normalizeFr(syn).includes(q))
    ) {
      hits.push({ structure, field: 'synonym' });
      continue;
    }
    if (normalizeFr(structure.nameEn).includes(q)) {
      hits.push({ structure, field: 'english' });
    }
  }
  const order = { name: 0, synonym: 1, english: 2 } as const;
  return hits.sort((a, b) => order[a.field] - order[b.field]);
}

export type StructureFilters = {
  region?: AnatomyStructure['region'];
  system?: AnatomyStructure['system'];
  difficulty?: AnatomyStructure['difficulty'];
  /** Ne garder que les structures avec planche 2D dessinable. */
  with2d?: boolean;
  /** Ne garder que les structures avec modèle 3D local. */
  with3d?: boolean;
};

export function filterStructures(filters: StructureFilters): AnatomyStructure[] {
  return structures.filter((s) => {
    if (filters.region && s.region !== filters.region) return false;
    if (filters.system && s.system !== filters.system) return false;
    if (filters.difficulty && s.difficulty !== filters.difficulty) return false;
    if (filters.with2d && s.reference2dIds.length === 0) return false;
    if (filters.with3d && s.reference3dIds.length === 0) return false;
    return true;
  });
}
