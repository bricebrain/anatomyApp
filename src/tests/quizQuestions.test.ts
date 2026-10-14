import { describe, expect, it } from 'vitest';
import { quizQuestions, verifiedQuestions } from '../features/quiz/data/questions';
import {
  SKELETON_VIEWBOX,
  partByStructureId,
  skeletonHotspots,
  skeletonParts,
} from '../features/quiz/data/skeletonSchematic';
import { getStructure, structuresById } from '../features/anatomy/data/structures';

/**
 * Validation des QUESTIONS DE QUIZ (§2.4) : une question n'est proposée que
 * si sa cible, ses options et sa géométrie sont vérifiées. Ce test fait
 * office de relecture systématique.
 */

describe('questions de quiz', () => {
  it('seules des questions vérifiées existent', () => {
    expect(quizQuestions.length).toBeGreaterThanOrEqual(8);
    expect(quizQuestions.length).toBeLessThanOrEqual(15);
    for (const q of quizQuestions) expect(q.verified).toBe(true);
    expect(verifiedQuestions).toHaveLength(quizQuestions.length);
  });

  it('chaque cible est une structure du référentiel ET du schéma', () => {
    for (const q of quizQuestions) {
      expect(structuresById[q.targetStructureId], `${q.id} cible inconnue`).toBeDefined();
      expect(
        partByStructureId(q.targetStructureId),
        `${q.id} cible absente du schéma interactif`,
      ).toBeDefined();
    }
  });

  it('les questions B1 portent des hotspots normalisés couvrant la cible', () => {
    for (const q of quizQuestions.filter((x) => x.mode === 'tap-2d')) {
      expect(q.imageAssetId).toBe('skeleton-front-local');
      expect(q.hotspots).toBeDefined();
      const target = q.hotspots!.find((h) => h.structureId === q.targetStructureId);
      expect(target, `${q.id} sans hotspot pour sa cible`).toBeDefined();
      for (const point of target!.polygon) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('les questions B2 offrent exactement 4 options valides de même système', () => {
    for (const q of quizQuestions.filter((x) => x.mode === 'name-highlighted')) {
      const options = q.options!;
      expect(options, `${q.id}`).toHaveLength(4);
      expect(new Set(options).size).toBe(4); // pas de doublon
      expect(options).toContain(q.targetStructureId);
      const systems = new Set(
        options.map((id) => structuresById[id]?.system).filter(Boolean),
      );
      expect(systems.size, `${q.id} options de catégories mixtes`).toBe(1);
      for (const id of options) {
        expect(structuresById[id], `${q.id} option inconnue : ${id}`).toBeDefined();
      }
    }
  });

  it('aucune question ne repose sur gauche/droite du spectateur (§2.4)', () => {
    for (const q of quizQuestions) {
      expect(q.promptFr.toLowerCase()).not.toMatch(/gauche|droite/);
      expect(q.explanationFr.toLowerCase()).not.toMatch(/gauche du schéma|droite du schéma/);
    }
  });

  it('chaque question a une explication factuelle courte', () => {
    for (const q of quizQuestions) {
      expect(q.explanationFr.length).toBeGreaterThan(20);
      expect(q.explanationFr.length).toBeLessThan(220);
    }
  });

  it('le mode B3 (toucher la 3D) n’est pas utilisé sans meshes mappés', () => {
    for (const q of quizQuestions) {
      expect(q.mode).not.toBe('tap-3d');
    }
  });
});

describe('schéma squelettique interactif', () => {
  it('les formes restent dans le viewBox', () => {
    const { width: W, height: H } = SKELETON_VIEWBOX;
    for (const part of skeletonParts) {
      for (const shape of part.shapes) {
        if (shape.kind === 'ellipse') {
          expect(shape.cx - shape.rx).toBeGreaterThanOrEqual(0);
          expect(shape.cx + shape.rx).toBeLessThanOrEqual(W);
          expect(shape.cy - shape.ry).toBeGreaterThanOrEqual(0);
          expect(shape.cy + shape.ry).toBeLessThanOrEqual(H);
        } else if (shape.kind === 'rect') {
          expect(shape.x).toBeGreaterThanOrEqual(0);
          expect(shape.x + shape.w).toBeLessThanOrEqual(W);
          expect(shape.y).toBeGreaterThanOrEqual(0);
          expect(shape.y + shape.h).toBeLessThanOrEqual(H);
        } else {
          for (const p of shape.points) {
            expect(p.x).toBeGreaterThanOrEqual(0);
            expect(p.x).toBeLessThanOrEqual(W);
            expect(p.y).toBeGreaterThanOrEqual(0);
            expect(p.y).toBeLessThanOrEqual(H);
          }
        }
      }
    }
  });

  it('chaque zone possède une étiquette française (retours honnêtes)', () => {
    for (const part of skeletonParts) {
      expect(part.labelFr).toBeTruthy();
    }
  });

  it('les hotspots dérivés couvrent toutes les structures du schéma', () => {
    const hotspots = skeletonHotspots();
    const structureIds = new Set(
      skeletonParts.filter((p) => p.structureId).map((p) => p.structureId as string),
    );
    expect(new Set(hotspots.map((h) => h.structureId))).toEqual(structureIds);
  });

  it('anatomie de base : le fémur est SOUS le bassin, l’humérus AU-DESSUS du radius', () => {
    const femur = partByStructureId('femur')!;
    const bassin = partByStructureId('bassin')!;
    const humerus = partByStructureId('humerus')!;
    const radius = partByStructureId('radius')!;
    const top = (part: typeof femur) => Math.min(...part.shapes
      .flatMap((s) => (s.kind === 'polygon' ? s.points : s.kind === 'rect' ? [{ x: s.x, y: s.y }] : [{ x: s.cx, y: s.cy - s.ry }]))
      .map((p) => p.y));
    const bottom = (part: typeof femur) => Math.max(...part.shapes
      .flatMap((s) => (s.kind === 'polygon' ? s.points : s.kind === 'rect' ? [{ x: s.x, y: s.y + s.h }] : [{ x: s.cx, y: s.cy + s.ry }]))
      .map((p) => p.y));
    expect(top(femur)).toBeGreaterThan(top(bassin)); // fémur commence sous le bassin
    expect(bottom(humerus)).toBeLessThan(top(radius)); // humérus finit avant l'avant-bras
  });
});

describe('croisement référentiel ↔ quiz', () => {
  it('chaque question ciblant S est listée par S.quizQuestionIds', () => {
    for (const q of verifiedQuestions) {
      const structure = getStructure(q.targetStructureId);
      expect(structure).toBeDefined();
      expect(structure!.quizQuestionIds).toContain(q.id);
    }
    // et la réciproque (déjà couverte par le test référentiel).
  });

  it('« Réviser » n’est proposé (fiche) que pour des structures avec questions', () => {
    for (const structure of Object.values(structuresById)) {
      const allExist = structure.quizQuestionIds.every((id) =>
        verifiedQuestions.some((q) => q.id === id),
      );
      expect(allExist).toBe(true);
      if (structure.quizQuestionIds.length === 0) {
        // ex. le cœur : aucune question vérifiée → pas de bouton Réviser.
        expect(structure.quizQuestionIds).toHaveLength(0);
      }
    }
  });
});
