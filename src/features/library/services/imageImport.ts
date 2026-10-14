import type { AnatomyAsset, AnatomyCategory } from '../types';
import {
  putAsset,
  putFile,
  getAsset,
  getFile,
  loadImageFromBlob,
  blobUrl,
} from '../../projects/projectRepository';
import { createBlankProject, type DrawingProject } from '../../projects/types';
import { MODEL_DOCUMENT_MAX_SIDE, MODEL_DOCUMENT_MIN_SIDE } from '../../drawing/types';

/**
 * Import d'une image personnelle (§5, Source C) et création d'assets depuis
 * n'importe quelle source. Validation : MIME, taille, décodage réel.
 */

export const ACCEPTED_IMPORT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

export class ImportError extends Error {}

export function guessCategory(title: string): AnatomyCategory {
  const t = title.toLowerCase();
  if (/(c[œo]ur|heart|cardio)/.test(t)) return 'heart';
  if (/(cr[âa]ne|skull|cran)/.test(t)) return 'skull';
  if (/(cerveau|brain|enc[ée]phale)/.test(t)) return 'brain';
  if (/(os|bone|squelette|skeleton|main|hand)/.test(t)) return 'bones';
  if (/(muscle|musculation|myolog)/.test(t)) return 'muscles';
  return 'other';
}

export async function validateImageFile(file: File): Promise<HTMLImageElement> {
  if (!ACCEPTED_IMPORT_TYPES.includes(file.type)) {
    throw new ImportError(
      `Format non pris en charge (${file.type || 'inconnu'}). Utilisez PNG, JPG ou WEBP.`,
    );
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ImportError('Fichier trop volumineux (plus de 25 Mo).');
  }
  try {
    return await loadImageFromBlob(file);
  } catch {
    throw new ImportError('Cette image n’a pas pu être décodée.');
  }
}

export type CreditInfo = {
  author?: string;
  sourceName?: string;
  sourcePageUrl?: string;
  license?: string;
  licenseUrl?: string;
  modifications?: string;
};

let assetCounter = 0;
export function newAssetId(): string {
  assetCounter += 1;
  return `a-${Date.now().toString(36)}-${assetCounter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/**
 * Crée un asset anatomique complet : stocke le Blob dans IndexedDB puis la
 * fiche d'attribution. Repli honnête si le stockage échoue : lève l'erreur.
 */
export async function createAssetFromBlob(
  blob: Blob,
  image: HTMLImageElement,
  meta: {
    title: string;
    category?: AnatomyCategory;
    source: AnatomyAsset['source'];
    credit?: CreditInfo;
  },
): Promise<AnatomyAsset> {
  const file = await putFile(blob, blob.type || 'image/png');
  const asset: AnatomyAsset = {
    id: newAssetId(),
    title: meta.title,
    category: meta.category ?? guessCategory(meta.title),
    source: meta.source,
    sourceName: meta.credit?.sourceName ?? 'Fichier importé',
    sourcePageUrl: meta.credit?.sourcePageUrl,
    author: meta.credit?.author,
    license: meta.credit?.license,
    licenseUrl: meta.credit?.licenseUrl,
    modifications: meta.credit?.modifications,
    width: image.naturalWidth,
    height: image.naturalHeight,
    mimeType: blob.type || 'image/png',
    localBlobId: file.id,
  };
  await putAsset(asset);
  return asset;
}

/**
 * Taille du document à partir d'un modèle : l'image est contenue dans un
 * document de proportions PRESERVÉES, borné pour rester performant.
 */
export function documentSizeForModel(
  imgW: number,
  imgH: number,
): { width: number; height: number } {
  const long = Math.max(imgW, imgH);
  const scale = Math.min(
    1,
    MODEL_DOCUMENT_MAX_SIDE / Math.max(long, 1),
    Math.max(1, MODEL_DOCUMENT_MIN_SIDE) / Math.max(Math.min(imgW, imgH), 1),
  );
  return {
    width: Math.round(imgW * scale),
    height: Math.round(imgH * scale),
  };
}

/** Crée un projet de dessin dont le calque modèle est l'asset donné. */
export function createProjectFromAsset(
  asset: AnatomyAsset,
  name?: string,
): DrawingProject {
  const project = createBlankProject(name ?? `Copie — ${shortTitle(asset.title)}`);
  const size = documentSizeForModel(asset.width, asset.height);
  project.modelAssetId = asset.id;
  project.documentWidth = size.width;
  project.documentHeight = size.height;
  return project;
}

export function shortTitle(title: string): string {
  return title.length > 40 ? `${title.slice(0, 39)}…` : title;
}

/** Charge l'image d'un asset depuis IndexedDB (réouverture hors ligne). */
export async function loadAssetImage(
  assetId: string,
): Promise<{ asset: AnatomyAsset; image: HTMLImageElement } | null> {
  const asset = await getAsset(assetId);
  if (!asset || !asset.localBlobId) return null;
  const file = await getFile(asset.localBlobId);
  if (!file) return null;
  const image = await loadImageFromBlob(file.blob);
  return { asset, image };
}

/** Objet URL d'affichage pour la miniature d'un asset stocké. */
export async function assetObjectUrl(assetId: string): Promise<string | null> {
  const asset = await getAsset(assetId);
  if (!asset?.localBlobId) return null;
  const file = await getFile(asset.localBlobId);
  return file ? blobUrl(file) : null;
}
