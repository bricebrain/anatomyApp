import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../features/projects/db';
import {
  saveProject,
  getProject,
  listProjects,
  deleteProject,
  putAsset,
  getAsset,
  putFile,
  getFile,
} from '../features/projects/projectRepository';
import { createBlankProject, type DrawingProject } from '../features/projects/types';
import type { AnatomyAsset } from '../features/library/types';

beforeEach(async () => {
  await Promise.all([db.projects.clear(), db.assets.clear(), db.files.clear()]);
});

function projectWithStrokes(id: string, count: number): DrawingProject {
  const p = createBlankProject('Test');
  p.id = id;
  p.strokes = Array.from({ length: count }, (_, i) => ({
    id: `s${i}`,
    tool: 'pen' as const,
    color: '#000',
    width: 4,
    points: [{ x: i * 10, y: 20 }],
  }));
  return p;
}

describe('projectRepository (IndexedDB via fake-indexeddb)', () => {
  it('sauvegarde puis relit un projet avec ses traits', async () => {
    const project = projectWithStrokes('p1', 3);
    await saveProject(project);
    const loaded = await getProject('p1');
    expect(loaded?.name).toBe('Test');
    expect(loaded?.strokes).toHaveLength(3);
    expect(loaded?.strokes[2].points[0].x).toBe(20);
  });

  it('liste les projets du plus récent au plus ancien', async () => {
    const a = projectWithStrokes('a', 1);
    a.updatedAt = '2026-01-01T00:00:00Z';
    await saveProject(a);
    const b = projectWithStrokes('b', 2);
    b.updatedAt = '2026-02-01T00:00:00Z';
    await saveProject(b);
    const list = await listProjects();
    expect(list.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('supprime le projet et l’asset orphelin avec son fichier', async () => {
    const file = await putFile(new Blob(['x']), 'image/png');
    const asset: AnatomyAsset = {
      id: 'asset1',
      title: 'Cœur',
      category: 'heart',
      source: 'local',
      sourceName: 'Test',
      width: 10,
      height: 10,
      mimeType: 'image/png',
      localBlobId: file.id,
    };
    await putAsset(asset);
    const project = projectWithStrokes('p2', 0);
    project.modelAssetId = 'asset1';
    await saveProject(project);

    await deleteProject(project);
    expect(await getProject('p2')).toBeUndefined();
    expect(await getAsset('asset1')).toBeUndefined();
    expect(await getFile(file.id)).toBeUndefined();
  });

  it('conserve l’asset partagé quand un autre projet l’utilise encore', async () => {
    const file = await putFile(new Blob(['y']), 'image/png');
    const asset: AnatomyAsset = {
      id: 'asset2',
      title: 'Crâne',
      category: 'skull',
      source: 'commons',
      sourceName: 'Test',
      width: 10,
      height: 10,
      mimeType: 'image/png',
      localBlobId: file.id,
    };
    await putAsset(asset);
    const p1 = projectWithStrokes('q1', 0);
    p1.modelAssetId = 'asset2';
    const p2 = projectWithStrokes('q2', 0);
    p2.modelAssetId = 'asset2';
    await saveProject(p1);
    await saveProject(p2);

    await deleteProject(p1);
    expect(await getAsset('asset2')).toBeDefined();
    expect(await getFile(file.id)).toBeDefined();
  });
});
