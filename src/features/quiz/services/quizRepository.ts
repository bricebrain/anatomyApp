import { db } from '../../projects/db';
import type { QuizResult } from '../types';

/**
 * Résultats de quiz — petits objets locaux dans IndexedDB (table ajoutée
 * en version 2 du schéma, sans toucher aux tables existantes). Aucun
 * backend, aucun envoi réseau (§2.4).
 */

function newResultId(): string {
  return `qr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveQuizResult(
  result: Omit<QuizResult, 'id' | 'answeredAt'>,
): Promise<QuizResult> {
  const full: QuizResult = {
    ...result,
    id: newResultId(),
    answeredAt: new Date().toISOString(),
  };
  await db.quizResults.put(full);
  return full;
}

export async function listRecentResults(limit = 100): Promise<QuizResult[]> {
  return db.quizResults.orderBy('answeredAt').reverse().limit(limit).toArray();
}

/** Taux de réussite récent par structure (révisions ciblées). */
export async function structureStats(): Promise<
  Record<string, { correct: number; total: number }>
> {
  const results = await db.quizResults.toArray();
  const stats: Record<string, { correct: number; total: number }> = {};
  for (const r of results) {
    const entry = stats[r.structureId] ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (r.correct) entry.correct += 1;
    stats[r.structureId] = entry;
  }
  return stats;
}
