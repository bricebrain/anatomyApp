import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../features/projects/db';
import {
  saveQuizResult,
  listRecentResults,
  structureStats,
} from '../features/quiz/services/quizRepository';

/** Résultats locaux (§2.4) : petits objets, IndexedDB version 2, sans backend. */

beforeEach(async () => {
  await db.quizResults.clear();
});

describe('quizRepository', () => {
  it('enregistre puis relit un résultat horodaté', async () => {
    const saved = await saveQuizResult({
      questionId: 'q-tap-humerus',
      structureId: 'humerus',
      mode: 'tap-2d',
      correct: true,
    });
    expect(saved.id).toMatch(/^qr-/);
    expect(saved.answeredAt).toBeTruthy();

    const results = await listRecentResults();
    expect(results).toHaveLength(1);
    expect(results[0].questionId).toBe('q-tap-humerus');
    expect(results[0].correct).toBe(true);
  });

  it('agrège les statistiques par structure', async () => {
    await saveQuizResult({ questionId: 'a', structureId: 'humerus', mode: 'tap-2d', correct: true });
    await saveQuizResult({ questionId: 'b', structureId: 'humerus', mode: 'tap-2d', correct: false });
    await saveQuizResult({ questionId: 'c', structureId: 'femur', mode: 'name-highlighted', correct: true });

    const stats = await structureStats();
    expect(stats.humerus).toEqual({ correct: 1, total: 2 });
    expect(stats.femur).toEqual({ correct: 1, total: 1 });
  });

  it('l’ancien schéma v1 reste lisible : la table projects fonctionne toujours', async () => {
    // C07 : l’ajout de la table quizResults ne perturbe pas les projets.
    // Projet à l'ANCIEN format (v1) : tous les champs requis d'alors,
    // sans anatomyStructureId ni modelAssetOrigin.
    const project = {
      id: 'legacy-p1',
      name: 'Ancien dessin',
      documentWidth: 100,
      documentHeight: 100,
      strokes: [],
      modelOpacity: 0.5,
      modelVisible: true,
      viewMode: 'trace' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await db.projects.put(project);
    const reloaded = await db.projects.get('legacy-p1');
    expect(reloaded?.name).toBe('Ancien dessin');
    expect(reloaded?.anatomyStructureId).toBeUndefined();
  });
});
