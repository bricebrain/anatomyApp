import catalogJson from '../../../../public/anatomy/catalog.json';
import type { AnatomyAsset } from '../types';
import {
  putAsset,
  putFile,
  loadImageFromBlob,
} from '../../projects/projectRepository';
import { newAssetId } from './imageImport';

/**
 * Sélection locale (§5, Source B) : planches de Gray's Anatomy (1918) du
 * domaine public, téléchargées dans public/anatomy/ après vérification de
 * leur fiche sur Wikimedia Commons (métadonnées dans catalog.json).
 *
 * Au premier choix, le fichier est copié dans IndexedDB : la sélection locale
 * fonctionne ensuite hors ligne et l'atelier ne charge jamais d'URL distante.
 */

export type CuratedItem = Omit<AnatomyAsset, 'localBlobId'> & { file: string };

const catalog = catalogJson as { version: number; items: CuratedItem[] };

export const curatedItems: CuratedItem[] = catalog.items;

export function curatedThumbUrl(item: CuratedItem): string {
  return `${import.meta.env.BASE_URL}anatomy/${item.file}`;
}

/**
 * Matérialise une entrée du catalogue en asset persisté (Blob en IndexedDB).
 * Rejette proprement si le réseau/stockage échoue — l'import local reste
 * disponible comme filet de sécurité.
 */
export async function materializeCuratedAsset(item: CuratedItem): Promise<AnatomyAsset> {
  const response = await fetch(curatedThumbUrl(item));
  if (!response.ok) {
    throw new Error(
      `Le modèle « ${item.title} » n’a pas pu être chargé (${response.status}).`,
    );
  }
  const blob = await response.blob();
  const image = await loadImageFromBlob(blob); // vérifie le décodage
  const file = await putFile(blob, blob.type || 'image/png');
  const asset: AnatomyAsset = {
    id: newAssetId(),
    title: item.title,
    category: item.category,
    source: item.source,
    sourceName: item.sourceName,
    sourcePageUrl: item.sourcePageUrl,
    author: item.author,
    license: item.license,
    licenseUrl: item.licenseUrl,
    // Les dimensions réelles du fichier téléchargé priment sur le catalogue.
    width: image.naturalWidth,
    height: image.naturalHeight,
    mimeType: blob.type || 'image/png',
    thumbnailUrl: curatedThumbUrl(item),
    localBlobId: file.id,
  };
  await putAsset(asset);
  return asset;
}
