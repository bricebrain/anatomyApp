import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ATLAS_SYSTEMS, defaultVisibleSystems } from '../constants';
import {
  buildAtlasIndex,
  fetchAtlasManifest,
  findConceptForPart,
  searchAtlasIndex,
} from '../services/atlasRepository';
import type {
  AtlasBodyVariant,
  AtlasSearchResult,
  AtlasSystemId,
  AtlasView,
} from '../types';

export function useHumanAtlasExplorer() {
  const initialSession = useRef(readAtlasSession());
  const savedConceptId = useRef(initialSession.current.conceptId);
  const [body, setBodyState] = useState<AtlasBodyVariant>(initialSession.current.body);
  const [visibleSystems, setVisibleSystems] = useState<AtlasSystemId[]>(
    initialSession.current.visibleSystems ?? defaultVisibleSystems(initialSession.current.body),
  );
  const [selected, setSelected] = useState<AtlasSearchResult | null>(null);
  const [isolate, setIsolate] = useState(initialSession.current.isolate);
  const [view, setView] = useState<AtlasView>(initialSession.current.view);
  const [resetToken, setResetToken] = useState(0);
  const [query, setQuery] = useState('');

  const atlasQuery = useQuery({
    queryKey: ['human-atlas', body],
    queryFn: () => fetchAtlasManifest(body),
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  const index = useMemo(
    () => (atlasQuery.data ? buildAtlasIndex(atlasQuery.data, body) : []),
    [atlasQuery.data, body],
  );
  const searchResults = useMemo(
    () => searchAtlasIndex(index, query),
    [index, query],
  );
  const availableSystems = useMemo(() => {
    if (!atlasQuery.data) return [];
    const counts = new Map<AtlasSystemId, number>();
    atlasQuery.data.parts.forEach((part) => counts.set(part.system, (counts.get(part.system) ?? 0) + 1));
    return ATLAS_SYSTEMS.filter((system) => counts.has(system.id)).map((system) => ({
      ...system,
      count: counts.get(system.id) ?? 0,
    }));
  }, [atlasQuery.data]);

  useEffect(() => {
    const conceptId = savedConceptId.current;
    if (!conceptId || index.length === 0) return;
    setSelected(index.find((item) => item.conceptId === conceptId) ?? null);
    savedConceptId.current = undefined;
  }, [index]);

  useEffect(() => {
    if (savedConceptId.current) return;
    writeAtlasSession({
      body,
      conceptId: selected?.conceptId,
      isolate,
      view,
      visibleSystems,
    });
  }, [body, isolate, selected?.conceptId, view, visibleSystems]);

  const setBody = useCallback((next: AtlasBodyVariant) => {
    setBodyState(next);
    setVisibleSystems(defaultVisibleSystems(next));
    setSelected(null);
    setIsolate(false);
    setQuery('');
    setResetToken((value) => value + 1);
  }, []);

  const choose = useCallback((result: AtlasSearchResult | null) => {
    setSelected(result);
    setIsolate(false);
    if (result) {
      setVisibleSystems((current) => [...new Set([...current, ...result.systemIds])]);
    }
  }, []);

  const selectPart = useCallback((partId: string) => {
    if (!atlasQuery.data) return;
    choose(findConceptForPart(atlasQuery.data, index, partId));
  }, [atlasQuery.data, choose, index]);

  const toggleSystem = useCallback((system: AtlasSystemId) => {
    setVisibleSystems((current) => current.includes(system)
      ? current.filter((item) => item !== system)
      : [...current, system]);
  }, []);

  const changeView = useCallback((next: AtlasView) => {
    setView(next);
    setResetToken((value) => value + 1);
  }, []);

  const resetCamera = useCallback(() => setResetToken((value) => value + 1), []);

  return {
    body,
    setBody,
    atlasQuery,
    selected,
    choose,
    selectPart,
    isolate,
    setIsolate,
    visibleSystems,
    toggleSystem,
    availableSystems,
    view,
    changeView,
    resetToken,
    resetCamera,
    query,
    setQuery,
    searchResults,
  };
}

const ATLAS_SESSION_KEY = 'human-atlas-explorer-state-v1';

type StoredAtlasSession = {
  body: AtlasBodyVariant;
  conceptId?: string;
  isolate: boolean;
  view: AtlasView;
  visibleSystems?: AtlasSystemId[];
};

function readAtlasSession(): StoredAtlasSession {
  const fallback: StoredAtlasSession = {
    body: 'male',
    isolate: false,
    view: 'three-quarter',
  };
  try {
    const stored = JSON.parse(sessionStorage.getItem(ATLAS_SESSION_KEY) ?? 'null') as Partial<StoredAtlasSession> | null;
    if (!stored || (stored.body !== 'male' && stored.body !== 'female')) return fallback;
    return {
      body: stored.body,
      conceptId: typeof stored.conceptId === 'string' ? stored.conceptId : undefined,
      isolate: Boolean(stored.isolate),
      view: ['three-quarter', 'front', 'back', 'side'].includes(stored.view ?? '')
        ? stored.view as AtlasView
        : 'three-quarter',
      visibleSystems: Array.isArray(stored.visibleSystems)
        ? stored.visibleSystems
        : undefined,
    };
  } catch {
    return fallback;
  }
}

function writeAtlasSession(value: StoredAtlasSession): void {
  try {
    sessionStorage.setItem(ATLAS_SESSION_KEY, JSON.stringify(value));
  } catch {
    // Le viewer reste pleinement utilisable si Safari refuse le stockage de session.
  }
}
