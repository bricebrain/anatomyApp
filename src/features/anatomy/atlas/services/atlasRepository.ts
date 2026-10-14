import { ATLAS_EDITIONS, CURATED_ATLAS_TERMS } from '../constants';
import type {
  AtlasBodyVariant,
  AtlasConcept,
  AtlasManifest,
  AtlasSearchResult,
  AtlasSystemId,
} from '../types';

export async function fetchAtlasManifest(body: AtlasBodyVariant): Promise<AtlasManifest> {
  const response = await fetch(ATLAS_EDITIONS[body].manifest);
  if (!response.ok) {
    throw new Error('Le manifeste anatomique ne peut pas être téléchargé.');
  }
  const atlas = (await response.json()) as AtlasManifest;
  if (!Array.isArray(atlas.parts) || !Array.isArray(atlas.concepts) || !atlas.chunks?.length) {
    throw new Error('Le manifeste anatomique est invalide.');
  }
  return atlas;
}

export function normalizeAtlasText(value: string): string {
  return value
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function toAtlasStructureId(body: AtlasBodyVariant, conceptId: string): string {
  return `human-atlas:${body}:${conceptId}`;
}

export function buildAtlasIndex(
  atlas: AtlasManifest,
  body: AtlasBodyVariant,
): AtlasSearchResult[] {
  const partsById = new Map(atlas.parts.map((part) => [part.id, part]));
  return atlas.concepts.flatMap((concept) => {
    const partIds = concept.elements.filter((id) => partsById.has(id));
    if (partIds.length === 0) return [];
    const systemIds = [...new Set(partIds.map((id) => partsById.get(id)!.system))];
    const curated = CURATED_ATLAS_TERMS[normalizeAtlasText(concept.name)];
    return [{
      structureId: toAtlasStructureId(body, concept.id),
      conceptId: concept.id,
      originalLabel: concept.name,
      label: curated?.label ?? concept.name,
      aliases: curated?.aliases ?? [],
      description: curated?.description,
      partIds,
      systemIds,
      localStructureId: curated?.localStructureId,
      curated: Boolean(curated),
    }];
  });
}

export function searchAtlasIndex(
  index: AtlasSearchResult[],
  query: string,
  visibleSystems?: AtlasSystemId[],
): AtlasSearchResult[] {
  const normalized = normalizeAtlasText(query);
  if (normalized.length < 2) return [];
  const allowed = visibleSystems ? new Set(visibleSystems) : null;
  return index
    .filter((item) => !allowed || item.systemIds.some((system) => allowed.has(system)))
    .map((item) => {
      const fields = [item.label, item.originalLabel, item.conceptId, ...item.aliases]
        .map(normalizeAtlasText);
      const starts = fields.some((field) => field.startsWith(normalized));
      const contains = fields.some((field) => field.includes(normalized));
      return { item, rank: starts ? 0 : contains ? 1 : 2 };
    })
    .filter(({ rank }) => rank < 2)
    .sort((a, b) => a.rank - b.rank || Number(b.item.curated) - Number(a.item.curated) || a.item.label.localeCompare(b.item.label, 'fr'))
    .slice(0, 80)
    .map(({ item }) => item);
}

export function findConceptForPart(
  atlas: AtlasManifest,
  index: AtlasSearchResult[],
  partId: string,
): AtlasSearchResult | null {
  const part = atlas.parts.find((candidate) => candidate.id === partId);
  if (!part) return null;
  return index.find((item) => item.conceptId === part.conceptId)
    ?? smallestContainingConcept(atlas.concepts, index, partId);
}

function smallestContainingConcept(
  concepts: AtlasConcept[],
  index: AtlasSearchResult[],
  partId: string,
): AtlasSearchResult | null {
  const candidate = concepts
    .filter((concept) => concept.elements.includes(partId))
    .sort((a, b) => a.elements.length - b.elements.length)[0];
  return candidate ? index.find((item) => item.conceptId === candidate.id) ?? null : null;
}
