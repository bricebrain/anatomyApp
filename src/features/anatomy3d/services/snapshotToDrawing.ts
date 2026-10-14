import type { Anatomy3DAsset } from '../../anatomy/types';
import type { ModelViewerHandle } from '../components/Anatomy3DViewer';
import {
  createAssetFromBlob,
  createProjectFromAsset,
} from '../../library/services/imageImport';
import { loadImageFromBlob } from '../../projects/projectRepository';
import { saveProject } from '../../projects/projectRepository';
import { getStructure } from '../../anatomy/data/structures';
import { navigate } from '../../../app/router';

/**
 * Capture d'une vue 3D → référence 2D locale (dossier §3.4).
 *
 * Séquence :
 *  1. toBlob() du composant Web : rendu WebGL SANS l'interface (aucune
 *     capture d'écran CSS, aucun bouton dans l'image) ;
 *  2. vérification du décodage (comme tout import d'image) ;
 *  3. création d'un ASSET LOCAL : Blob en IndexedDB + crédits d'origine
 *     du GLB conservés (source, auteur, licence, mention « capture d'un
 *     modèle 3D ») ;
 *  4. création du projet de dessin référencé sur cet asset, relié à la
 *     structure anatomique (migration douce : champs optionnels) ;
 *  5. ouverture de l'ATELIER EXISTANT — aucun moteur de dessin dupliqué.
 */

export async function snapshotToDrawing(
  viewer: ModelViewerHandle,
  asset3d: Anatomy3DAsset,
): Promise<void> {
  // Fond transparent : l'organe se pose sur le papier ivoire de l'atelier.
  const blob = await viewer.toBlob({ mimeType: 'image/png', idealAspect: true });
  if (!blob || blob.size === 0) {
    throw new Error('La capture de la vue 3D a échoué.');
  }
  const image = await loadImageFromBlob(blob); // vérifie le décodage réel

  const structure = getStructure(asset3d.structureIds[0]);
  const structureName = structure ? structure.nameFr : 'structure anatomique';

  const asset2d = await createAssetFromBlob(blob, image, {
    title: `${structureName} — vue choisie en 3D`,
    category: 'heart',
    source: 'nih3d-capture',
    credit: {
      sourceName: asset3d.credits.sourceName,
      sourcePageUrl: asset3d.credits.sourcePageUrl,
      author: asset3d.credits.author,
      license: asset3d.credits.license,
      licenseUrl: asset3d.credits.licenseUrl,
      modifications:
        'Capture d’une vue du modèle 3D (angle choisi à l’écran dans l’application).',
    },
  });

  const project = createProjectFromAsset(asset2d, `${structureName} — vue 3D`);
  project.anatomyStructureId = asset3d.structureIds[0];
  project.modelAssetOrigin = '3d-capture';
  await saveProject(project);
  navigate(`/atelier/${project.id}`);
}
