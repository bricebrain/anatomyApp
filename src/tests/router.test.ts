import { describe, expect, it } from 'vitest';
import { parseHash } from '../app/router';

/** Routes de l’extension : exploration, quiz, visionneuse 3D (§1.2, §2.3, §3.2). */

describe('parseHash', () => {
  it('routes historiques inchangées (aucune régression)', () => {
    expect(parseHash('#/')).toEqual({ name: 'home' });
    expect(parseHash('#/bibliotheque')).toEqual({ name: 'library' });
    expect(parseHash('#/atelier/p-123')).toEqual({ name: 'drawing', projectId: 'p-123' });
  });

  it('nouvelles routes', () => {
    expect(parseHash('#/explorer')).toEqual({ name: 'explore' });
    expect(parseHash('#/quiz')).toEqual({ name: 'quiz' });
    expect(parseHash('#/modeles3d')).toEqual({ name: 'viewer3d-catalog' });
    expect(parseHash('#/quiz/structure/humerus')).toEqual({
      name: 'quiz-structure',
      structureId: 'humerus',
    });
    expect(parseHash('#/modeles3d/nih3d-heart')).toEqual({
      name: 'viewer3d',
      assetId: 'nih3d-heart',
    });
  });

  it('tolère les slashes finaux et les paramètres', () => {
    expect(parseHash('#/explorer/')).toEqual({ name: 'explore' });
    expect(parseHash('#/quiz?mode=mix')).toEqual({ name: 'quiz' });
  });

  it('retombe sur l’accueil pour un hash inconnu', () => {
    expect(parseHash('#/nimporte/quoi')).toEqual({ name: 'home' });
  });
});
