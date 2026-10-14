import { navigate } from '../../../../app/router';
import {
  createAssetFromBlob,
  createProjectFromAsset,
} from '../../../library/services/imageImport';
import { loadImageFromBlob, saveProject } from '../../../projects/projectRepository';
import { ATLAS_EDITIONS } from '../constants';
import type {
  AtlasBodyVariant,
  AtlasSearchResult,
  AtlasViewerSnapshot,
} from '../types';

export async function atlasSnapshotToDrawing(
  snapshot: AtlasViewerSnapshot,
  body: AtlasBodyVariant,
  selected: AtlasSearchResult | null,
): Promise<void> {
  if (!snapshot.image.size) throw new Error('La capture 3D est vide.');
  const image = await loadImageFromBlob(snapshot.image);
  const edition = ATLAS_EDITIONS[body];
  const structureName = selected?.label ?? edition.label;
  const asset = await createAssetFromBlob(snapshot.image, image, {
    title: `${structureName} — vue Human-Atlas`,
    source: 'human-atlas-capture',
    credit: {
      sourceName: body === 'male' ? 'BodyParts3D via Human-Atlas' : 'Human Reference Atlas via Human-Atlas',
      sourcePageUrl: body === 'male'
        ? 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html'
        : 'https://humanatlas.io/3d-reference-library',
      author: body === 'male'
        ? 'Database Center for Life Science (DBCLS)'
        : 'Kristen Browne, Heidi Schlehlein et contributeurs Human Reference Atlas',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      modifications: 'Capture PNG d’une vue 3D, palette pédagogique opaque et angle choisis dans l’application.',
    },
  });
  if (!asset.localBlobId) throw new Error('La capture ne peut pas être conservée localement.');

  const project = createProjectFromAsset(asset, `${structureName} — étude 3D`);
  project.anatomyStructureId = selected?.localStructureId;
  project.modelAssetOrigin = '3d-capture';
  project.anatomyReference = {
    kind: 'snapshot-3d',
    provider: 'human-atlas',
    assetId: `human-atlas-${body}`,
    selectedStructureIds: selected ? [selected.structureId] : [],
    bodyVariant: body,
    snapshotBlobId: asset.localBlobId,
    camera: snapshot.camera,
    appearancePreset: 'pedagogical-opaque',
    provenanceIds: snapshot.provenanceIds,
    returnRoute: '/atlas3d',
    createdAt: new Date().toISOString(),
  };
  await saveProject(project);
  navigate(`/atelier/${project.id}`);
}
