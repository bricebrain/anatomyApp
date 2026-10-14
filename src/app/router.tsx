import { useEffect, useState } from 'react';

/**
 * Micro-routeur par hash — volontairement minimal pour ce POC :
 * Parseur conservé pour les tests et les services historiques. Le rendu des
 * routes est désormais pris en charge par React Router dans App.tsx.
 */

export type Route =
  | { name: 'home' }
  | { name: 'library' }
  | { name: 'drawing'; projectId: string }
  | { name: 'explore' }
  | { name: 'quiz' }
  | { name: 'quiz-structure'; structureId: string }
  | { name: 'viewer3d-catalog' }
  | { name: 'viewer3d'; assetId: string };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#/, '').replace(/\/+$/, '').split('?')[0];
  if (clean === '' || clean === '/') return { name: 'home' };
  if (clean === '/bibliotheque') return { name: 'library' };
  if (clean === '/explorer') return { name: 'explore' };
  if (clean === '/quiz') return { name: 'quiz' };
  if (clean === '/modeles3d') return { name: 'viewer3d-catalog' };
  let match = /^\/quiz\/structure\/([^/]+)$/.exec(clean);
  if (match) return { name: 'quiz-structure', structureId: decodeURIComponent(match[1]) };
  match = /^\/modeles3d\/([^/]+)$/.exec(clean);
  if (match) return { name: 'viewer3d', assetId: decodeURIComponent(match[1]) };
  match = /^\/atelier\/([^/]+)$/.exec(clean);
  if (match) return { name: 'drawing', projectId: decodeURIComponent(match[1]) };
  return { name: 'home' };
}

export function navigate(to: string): void {
  window.location.hash = to;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
