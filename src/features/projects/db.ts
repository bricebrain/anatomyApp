import Dexie, { type Table } from 'dexie';
import type { DrawingProject } from './types';
import type { AnatomyAsset } from '../library/types';
import type { QuizResult } from '../quiz/types';

/** Fichier image brut conservé localement (Blob) — jamais en localStorage. */
export type StoredFile = {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
};

class AnatomyDB extends Dexie {
  projects!: Table<DrawingProject, string>;
  assets!: Table<AnatomyAsset, string>;
  files!: Table<StoredFile, string>;
  /** Résultats de quiz (petits objets ; pas de backend, §2.4). */
  quizResults!: Table<QuizResult, string>;

  constructor() {
    super('carnet-anatomie');
    // version 2 : ajout purement additif de la table quizResults.
    // Les tables existantes (donc les dessins en cours) ne changent pas :
    // la réouverture d'un ancien projet reste garantie (test C07).
    this.version(1).stores({
      projects: 'id, updatedAt',
      assets: 'id, category',
      files: 'id',
    });
    this.version(2)
      .stores({
        projects: 'id, updatedAt',
        assets: 'id, category',
        files: 'id',
        quizResults: 'id, questionId, structureId, answeredAt',
      })
      .upgrade(async (tx) => {
        // Rien à migrer : la table est nouvelle.
        await tx.table('quizResults').count();
      });
  }
}

export const db = new AnatomyDB();

/** Vérifie la disponibilité réelle du stockage (utile pour un message honnête). */
export async function checkStorageAvailable(): Promise<boolean> {
  try {
    if (typeof indexedDB === 'undefined') return false;
    await db.open();
    return true;
  } catch {
    return false;
  }
}
