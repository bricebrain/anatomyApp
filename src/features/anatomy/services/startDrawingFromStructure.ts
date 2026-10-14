import { curatedItems, materializeCuratedAsset } from '../../library/services/curatedCatalog';
import { createProjectFromAsset, shortTitle } from '../../library/services/imageImport';
import { saveProject } from '../../projects/projectRepository';
import { createBlankProject } from '../../projects/types';
import { getStructure } from '../data/structures';
import { get3dAsset } from '../data/assets3d';
import { navigate } from '../../../app/router';

/**
 * Pont référentiel → atelier existant : la fiche d'une structure ouvre
 * l'ATELIER ACTUEL (aucune duplication du moteur de dessin).
 *
 *  - « Dessiner » matérialise une planche du catalogue local (Blob en
 *    IndexedDB, comme pour la sélection existante) puis crée le projet
 *    en lui attachant l'ID de la structure (migration douce) ;
 *  - « Voir en 3D » bascule vers l'explorateur 3D du modèle local ;
 *  - « Réviser » ouvre le quiz filtré sur la structure ;
 *  - « Dessiner de mémoire » (B4) crée un projet SANS référence, nommé
 *    d'après la structure.
 */

/** ID de la première planche 2D disponible pour une structure. */
export function default2dReferenceId(structureId: string): string | null {
  const structure = getStructure(structureId);
  if (!structure || structure.reference2dIds.length === 0) return null;
  return structure.reference2dIds[0];
}

/** ID du premier modèle 3D local pour une structure (null = pas de 3D). */
export function first3dAssetId(structureId: string): string | null {
  const structure = getStructure(structureId);
  if (!structure || structure.reference3dIds.length === 0) return null;
  const id = structure.reference3dIds[0];
  return get3dAsset(id) ? id : null;
}

/** Ouvre l'atelier avec la planche 2D choisie comme référence verrouillée. */
export async function drawStructure(
  structureId: string,
  reference2dId?: string,
): Promise<void> {
  const structure = getStructure(structureId);
  if (!structure) throw new Error('Structure inconnue du référentiel.');
  const refId = reference2dId ?? default2dReferenceId(structureId);
  if (!refId) {
    throw new Error(
      'Aucune planche 2D vérifiée n’est disponible pour cette structure.',
    );
  }
  const item = curatedItems.find((i) => i.id === refId);
  if (!item) {
    throw new Error('La planche de référence est absente du catalogue local.');
  }
  // Identique au parcours existant : fichier → vérification → Blob IndexedDB.
  const asset = await materializeCuratedAsset(item);
  const project = createProjectFromAsset(
    asset,
    `${structure.nameFr} — ${shortTitle(item.title)}`,
  );
  project.anatomyStructureId = structureId;
  project.modelAssetOrigin = 'catalog';
  await saveProject(project);
  navigate(`/atelier/${project.id}`);
}

/** B4 — « Dessiner de mémoire » : projet vierge, référence masquée. */
export async function drawStructureFromMemory(structureId: string): Promise<void> {
  const structure = getStructure(structureId);
  if (!structure) throw new Error('Structure inconnue du référentiel.');
  const project = createBlankProject(`De mémoire — ${structure.nameFr}`);
  project.anatomyStructureId = structureId;
  await saveProject(project);
  navigate(`/atelier/${project.id}`);
}

/** Ouvre l'explorateur 3D sur le modèle local d'une structure. */
export function viewStructureIn3d(structureId: string): void {
  const assetId = first3dAssetId(structureId);
  if (!assetId) return; // le bouton 3D n'existe pas sans modèle local
  navigate(`/modeles3d/${assetId}`);
}

/** Ouvre le quiz concentré sur une structure (ses questions vérifiées). */
export function reviewStructure(structureId: string): void {
  navigate(`/quiz/structure/${structureId}`);
}
