import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { structures, getStructure } from '../features/anatomy/data/structures';
import { assets3d, assets3dById, supports3dQuiz, glbAssetUrl } from '../features/anatomy/data/assets3d';
import { curatedItems } from '../features/library/services/curatedCatalog';
import { filterStructures, normalizeFr, searchStructures } from '../features/anatomy/services/structureSearch';
import { verifiedQuestions } from '../features/quiz/data/questions';

/**
 * Intégrité du RÉFÉRENTIEL (§1.3, §4) : une structure n'existe que si ses
 * représentations existent réellement — fichiers présents sur disque, IDs
 * croisés avec le catalogue et le manifeste 3D. Ce test empêche toute
 * « promesse » d'asset inventé (critères A03/A04).
 */

const catalogIds = new Set(curatedItems.map((item) => item.id));
// Vitest tourne à la racine du projet : les fichiers statiques s'y vérifient.
const root = process.cwd();

describe('référentiel de structures', () => {
  it('des IDs uniques et stables', () => {
    const ids = structures.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of structures) expect(getStructure(s.id)).toBe(s);
  });

  it('chaque planche 2D référencée existe dans le catalogue local', () => {
    for (const s of structures) {
      expect(s.reference2dIds.length).toBeGreaterThan(0);
      for (const id of s.reference2dIds) {
        expect(catalogIds.has(id), `${s.id} → planche ${id} absente du catalogue`).toBe(true);
      }
    }
  });

  it('chaque asset 3D référencé existe dans le manifeste local', () => {
    for (const s of structures) {
      for (const id of s.reference3dIds) {
        expect(assets3dById[id], `${s.id} → asset 3D ${id} absent du manifeste`).toBeDefined();
      }
    }
  });

  it('les questions référencées par les structures existent et sont vérifiées', () => {
    const verifiedIds = new Set(verifiedQuestions.map((q) => q.id));
    for (const s of structures) {
      for (const id of s.quizQuestionIds) {
        expect(verifiedIds.has(id), `${s.id} → question ${id} inconnue ou non vérifiée`).toBe(true);
      }
    }
  });

  it('tous les fichiers du catalogue sont réellement présents sur disque', () => {
    for (const item of curatedItems) {
      const file = path.join(root, 'public', 'anatomy', item.file);
      expect(fs.existsSync(file), `${item.file} absent`).toBe(true);
    }
  });

  it('chaque entrée du catalogue porte ses crédits complets', () => {
    for (const item of curatedItems) {
      expect(item.author).toBeTruthy();
      expect(item.sourcePageUrl).toMatch(/^https:/);
      expect(item.license).toMatch(/domaine public/i);
      expect(item.licenseUrl).toMatch(/^https:/);
    }
  });
});

describe('manifeste 3D', () => {
  it('les GLB référencés existent sur disque (aucune URL inventée)', () => {
    expect(assets3d.length).toBeGreaterThan(0);
    for (const asset of assets3d) {
      const file = path.join(root, 'public', asset.glbUrl);
      expect(fs.existsSync(file), `${asset.glbUrl} absent`).toBe(true);
      if (asset.fileSizeBytes) {
        expect(fs.statSync(file).size).toBe(asset.fileSizeBytes);
      }
    }
  });

  it('les crédits 3D sont complets (source, lien, licence)', () => {
    for (const asset of assets3d) {
      expect(asset.credits.sourceName).toBeTruthy();
      expect(asset.credits.sourcePageUrl).toMatch(/^https:/);
      expect(asset.credits.license).toBeTruthy();
    }
  });

  it('le quiz 3D n’est jamais annoncé sans table mesh→structure', () => {
    // Le cœur n’a qu’un seul mesh : la sélection 3D doit rester fermée.
    const heart = assets3dById['nih3d-heart'];
    expect(heart).toBeDefined();
    expect(heart.meshCount).toBe(1);
    expect(heart.meshToStructureId).toBeUndefined();
    expect(supports3dQuiz(heart)).toBe(false);
  });

  it('glbAssetUrl sert l’URL sous la base de l’application', () => {
    expect(glbAssetUrl(assets3dById['nih3d-heart'])).toMatch(/anatomy3d\/heart\.glb$/);
  });
});

describe('recherche française (A03)', () => {
  it('trouve par nom sans accent', () => {
    const hits = searchStructures('crane');
    expect(hits.some((h) => h.structure.id === 'crane')).toBe(true);
  });

  it('trouve par synonyme (rachis → colonne)', () => {
    const hits = searchStructures('rachis');
    expect(hits.some((h) => h.structure.id === 'colonne')).toBe(true);
  });

  it('trouve par synonyme (mâchoire → mandibule)', () => {
    const hits = searchStructures(normalizeFr('mâchoire'));
    expect(hits.some((h) => h.structure.id === 'mandibule')).toBe(true);
  });

  it('trouve par nom anglais (skull) sans l’imposer à l’utilisatrice', () => {
    const hits = searchStructures('skull');
    expect(hits.some((h) => h.structure.id === 'crane')).toBe(true);
  });

  it('ne retourne rien pour un terme hors référentiel (pas d’invention)', () => {
    expect(searchStructures('zygomatique')).toEqual([]);
    expect(searchStructures('a')).toEqual([]);
  });

  it('le classement privilégie le nom exact avant le synonyme', () => {
    const hits = searchStructures('os de la cuisse');
    expect(hits[0].structure.id).toBe('femur');
  });
});

describe('filtres (A)', () => {
  it('filtre par région + système', () => {
    const results = filterStructures({ region: 'upper-limb', system: 'skeletal' });
    expect(results.map((s) => s.id).sort()).toEqual(
      ['cubitus', 'humerus', 'main', 'radius'].sort(),
    );
  });

  it('with3d ne laisse que les structures réellement modélisées', () => {
    const results = filterStructures({ with3d: true });
    expect(results.map((s) => s.id)).toEqual(['crane', 'cerveau', 'coeur', 'poumons']);
  });

  it('with2d ne laisse que les structures avec planche', () => {
    for (const s of filterStructures({ with2d: true })) {
      expect(s.reference2dIds.length).toBeGreaterThan(0);
    }
  });
});
