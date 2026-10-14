import { db, type StoredFile } from './db';
import type { DrawingProject } from './types';
import type { AnatomyAsset } from '../library/types';

/**
 * Dépôt des projets et fichiers. Toutes les erreurs remontent à l'appelant :
 * l'interface doit afficher « Échec d'enregistrement » plutôt qu'un faux
 * « Enregistré » (test T18).
 */

const PROJECTS_LIST_LIMIT = 30;

export async function saveProject(project: DrawingProject): Promise<void> {
  const stamped = { ...project, updatedAt: new Date().toISOString() };
  await db.projects.put(stamped);
}

export async function getProject(id: string): Promise<DrawingProject | undefined> {
  return db.projects.get(id);
}

export async function listProjects(): Promise<DrawingProject[]> {
  const all = await db.projects.orderBy('updatedAt').reverse().limit(PROJECTS_LIST_LIMIT).toArray();
  return all;
}

export async function deleteProject(project: DrawingProject): Promise<void> {
  await db.transaction('rw', db.projects, db.assets, db.files, async () => {
    // Supprime l'asset et son fichier s'ils ne sont plus référencés.
    if (project.modelAssetId) {
      const stillUsed = await db.projects
        .filter((p) => p.id !== project.id && p.modelAssetId === project.modelAssetId)
        .count();
      if (stillUsed === 0) {
        const asset = await db.assets.get(project.modelAssetId);
        if (asset?.localBlobId) {
          await db.files.delete(asset.localBlobId);
        }
        await db.assets.delete(project.modelAssetId);
      }
    }
    await db.projects.delete(project.id);
  });
}

/* ---------- Assets & fichiers ---------- */

export async function putAsset(asset: AnatomyAsset): Promise<void> {
  await db.assets.put(asset);
}

export async function getAsset(id: string): Promise<AnatomyAsset | undefined> {
  return db.assets.get(id);
}

export function newFileId(): string {
  return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function putFile(blob: Blob, mimeType: string): Promise<StoredFile> {
  const file: StoredFile = {
    id: newFileId(),
    blob,
    mimeType,
    createdAt: new Date().toISOString(),
  };
  await db.files.put(file);
  return file;
}

export async function getFile(id: string): Promise<StoredFile | undefined> {
  return db.files.get(id);
}

/** Objet URL temporaire pour afficher un blob (à révoquer après usage). */
export function blobUrl(file: StoredFile): string {
  return URL.createObjectURL(file.blob);
}

/** Charge une image depuis un Blob (vérifie le décodage). */
export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de décoder cette image.'));
    };
    img.src = url;
    // Révoquer plus tard : l'image reste utile après résolution.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  });
}
