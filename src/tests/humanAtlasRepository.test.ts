import { describe, expect, it } from 'vitest';
import {
  buildAtlasIndex,
  findConceptForPart,
  normalizeAtlasText,
  searchAtlasIndex,
  toAtlasStructureId,
} from '../features/anatomy/atlas/services/atlasRepository';
import type { AtlasManifest } from '../features/anatomy/atlas/types';

const atlas: AtlasManifest = {
  version: 'test',
  sex: 'male',
  triangles: 2,
  chunks: [{ url: '/models/test.bin', bytes: 1 }],
  parts: [
    {
      id: 'mesh-heart',
      name: 'Heart mesh',
      conceptId: 'FMA7088',
      system: 'cardiac',
      chunk: 0,
      positions: 0,
      normals: 0,
      indices: 0,
      vertexCount: 3,
      indexCount: 3,
      bounds: [[0, 0, 0], [1, 1, 1]],
    },
    {
      id: 'mesh-unknown',
      name: 'Source mesh',
      conceptId: 'FMA999',
      system: 'skeletal',
      chunk: 0,
      positions: 0,
      normals: 0,
      indices: 0,
      vertexCount: 3,
      indexCount: 3,
      bounds: [[0, 0, 0], [1, 1, 1]],
    },
  ],
  concepts: [
    { id: 'FMA7088', name: 'heart', elements: ['mesh-heart'] },
    { id: 'FMA999', name: 'Untranslated structure', elements: ['mesh-unknown'] },
  ],
};

describe('référentiel Human-Atlas', () => {
  it('construit un identifiant stable distinct du mesh', () => {
    expect(toAtlasStructureId('male', 'FMA7088')).toBe('human-atlas:male:FMA7088');
  });

  it('recherche les alias français validés sans perdre le nom source', () => {
    const index = buildAtlasIndex(atlas, 'male');
    const result = searchAtlasIndex(index, 'coeur')[0];
    expect(result.label).toBe('Cœur');
    expect(result.originalLabel).toBe('heart');
    expect(result.partIds).toEqual(['mesh-heart']);
  });

  it('conserve honnêtement un libellé anglais non traduit', () => {
    const result = buildAtlasIndex(atlas, 'male')[1];
    expect(result.label).toBe('Untranslated structure');
    expect(result.curated).toBe(false);
  });

  it('résout le concept sélectionné depuis un identifiant de mesh', () => {
    const index = buildAtlasIndex(atlas, 'male');
    expect(findConceptForPart(atlas, index, 'mesh-heart')?.conceptId).toBe('FMA7088');
  });

  it('normalise accents, ligature et ponctuation pour la recherche', () => {
    expect(normalizeAtlasText('  CŒUR — antérieur ')).toBe('coeur anterieur');
  });
});
