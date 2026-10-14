import type { AnatomyAsset } from '../types';
import type { CommonsSearchResult } from '../types';
import { navigate } from '../../../app/router';
import { saveProject, loadImageFromBlob } from '../../projects/projectRepository';
import {
  createProjectFromAsset,
  validateImageFile,
  createAssetFromBlob,
} from './imageImport';
import {
  fetchCommonsImageBlob,
  fetchCommonsImageInfo,
  CommonsApiError,
} from './CommonsImageProvider';

/**
 * Point d'entrée unique « Dessiner ce modèle » : crée le projet et bascule
 * dans l'atelier. Toutes les erreurs remontent avec un message clair ;
 * l'import local reste le filet de sécurité (§5).
 */

export async function startProjectWithAsset(asset: AnatomyAsset): Promise<void> {
  const project = createProjectFromAsset(asset);
  await saveProject(project);
  navigate(`/atelier/${project.id}`);
}

/** Depuis la sélection locale (fichiers déjà vérifiés dans public/anatomy). */
export async function startProjectWithCurated(item: {
  materialize: () => Promise<AnatomyAsset>;
}): Promise<void> {
  const asset = await item.materialize();
  await startProjectWithAsset(asset);
}

/** Depuis un résultat de recherche Wikimedia Commons. */
export async function startProjectWithCommonsResult(
  result: CommonsSearchResult,
): Promise<void> {
  if (!result.reusable) {
    throw new Error(
      'Cette image ne peut pas être importée. Choisissez-en une autre ou utilisez votre propre fichier.',
    );
  }
  const info = await fetchCommonsImageInfo(result.id, 1600);
  const blob = await fetchCommonsImageBlob(info);
  const image = await loadImageFromBlob(blob);
  const asset = await createAssetFromBlob(blob, image, {
    title: info.title,
    source: 'commons',
    credit: {
      sourceName: 'Wikimedia Commons',
      sourcePageUrl: info.pageUrl,
      author: info.author,
      license: info.license,
      licenseUrl: info.licenseUrl,
    },
  });
  await startProjectWithAsset(asset);
}

/** Depuis un fichier local (PNG/JPG/WEBP). */
export async function startProjectWithFile(
  file: File,
  credit?: { author?: string; license?: string },
): Promise<void> {
  const image = await validateImageFile(file);
  const asset = await createAssetFromBlob(file, image, {
    title: file.name.replace(/\.[a-z0-9]+$/i, ''),
    source: 'local',
    credit: {
      sourceName: 'Import personnel',
      ...credit,
    },
  });
  await startProjectWithAsset(asset);
}

export { CommonsApiError };
