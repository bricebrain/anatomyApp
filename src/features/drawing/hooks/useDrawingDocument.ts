import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Camera,
  DrawingToolId,
  Stroke,
  ViewMode,
} from '../types';
import { DrawingHistory } from '../engine/history';
import { saveProject } from '../../projects/projectRepository';
import type { DrawingProject } from '../../projects/types';

/**
 * Orchestrateur de l'atelier : document (traits), caméra, historique
 * annuler/refaire et sauvegarde automatique.
 *
 * Performance (§6.4) : les traits vivent dans des refs ; React ne re-rend
 * l'interface que sur des changements UTILES (compteurs, état d'outils),
 * jamais à chaque point reçu.
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const ERASER_RADIUS_PX = 14; // rayon écran de la gomme

export function useDrawingDocument(initial: DrawingProject) {
  const projectRef = useRef<DrawingProject>(initial);
  const historyRef = useRef(new DrawingHistory(initial.strokes));
  const cameraRef = useRef<Camera>({ scale: 1, offsetX: 0, offsetY: 0 });

  const [tool, setTool] = useState<DrawingToolId>(
    initial.lastTool ?? 'pen',
  );
  const [color, setColor] = useState(initial.lastColor ?? '#221d18');
  const [width, setWidth] = useState(initial.lastWidth ?? 4);
  const [modelOpacity, setModelOpacity] = useState(initial.modelOpacity);
  const [modelVisible, setModelVisible] = useState(initial.modelVisible);
  const [viewMode, setViewMode] = useState<ViewMode>(initial.viewMode);
  const [gridOn, setGridOn] = useState(false);
  const [strokeCount, setStrokeCount] = useState(initial.strokes.length);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cameraVersion, setCameraVersion] = useState(0);
  const [strokesVersion, setStrokesVersion] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  /* ---------- Persistance automatique ---------- */

  const saveTimer = useRef<number | null>(null);
  const revisionRef = useRef(0);
  const dirtyRef = useRef(false);

  const doSave = useCallback(async () => {
    const project = projectRef.current;
    setSaveStatus('saving');
    try {
      await saveProject({
        ...project,
        strokes: [...historyRef.current.strokes],
        modelOpacity,
        modelVisible,
        viewMode,
        lastTool: tool,
        lastColor: color,
        lastWidth: width,
      });
      dirtyRef.current = false;
      setSaveStatus('saved');
    } catch (err) {
      console.error('Échec de sauvegarde', err);
      setSaveStatus('error');
    }
  }, [color, modelOpacity, modelVisible, tool, viewMode, width]);

  /** Marque le projet comme modifié et programme une sauvegarde (temporisation). */
  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    revisionRef.current += 1;
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      void doSave();
    }, 700);
  }, [doSave]);

  // Sauvegarde immédiate quand Safari va être fermé/masqué.
  useEffect(() => {
    const flush = () => {
      if (!dirtyRef.current) return;
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      void doSave();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    return () => window.removeEventListener('pagehide', flush);
  }, [doSave]);

  /* ---------- Modifications du document ---------- */

  const syncHistoryUi = () => {
    setStrokeCount(historyRef.current.strokes.length);
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
    setStrokesVersion((v) => v + 1);
  };

  const commitStroke = useCallback(
    (stroke: Stroke) => {
      historyRef.current.commit([...historyRef.current.strokes, stroke]);
      syncHistoryUi();
      scheduleSave();
    },
    [scheduleSave],
  );

  /**
   * Supprime des traits entiers (gomme §6.5). Tous les traits supprimés lors
   * d'un même geste forment UNE action annulable.
   */
  const eraseStrokes = useCallback(
    (removed: readonly Stroke[]) => {
      if (removed.length === 0) return;
      const ids = new Set(removed.map((s) => s.id));
      historyRef.current.commit(
        historyRef.current.strokes.filter((s) => !ids.has(s.id)),
      );
      syncHistoryUi();
      scheduleSave();
    },
    [scheduleSave],
  );

  const clearAll = useCallback(() => {
    historyRef.current.commit([]);
    syncHistoryUi();
    scheduleSave();
  }, [scheduleSave]);

  const undo = useCallback(() => {
    const prev = historyRef.current.undo();
    if (prev) {
      syncHistoryUi();
      scheduleSave();
    }
  }, [scheduleSave]);

  const redo = useCallback(() => {
    const next = historyRef.current.redo();
    if (next) {
      syncHistoryUi();
      scheduleSave();
    }
  }, [scheduleSave]);

  /* ---------- Caméra ---------- */

  const updateCamera = useCallback((updater: (c: Camera) => Camera) => {
    cameraRef.current = updater(cameraRef.current);
    setCameraVersion((v) => v + 1);
  }, []);

  /* ---------- Réglages persistés ---------- */

  const changeModelOpacity = useCallback(
    (value: number) => {
      setModelOpacity(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const changeModelVisible = useCallback(
    (value: boolean) => {
      setModelVisible(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const changeViewMode = useCallback(
    (value: ViewMode) => {
      setViewMode(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const changeTool = useCallback(
    (value: DrawingToolId) => {
      setTool(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const setProjectName = useCallback(
    (name: string) => {
      projectRef.current = { ...projectRef.current, name };
      scheduleSave();
    },
    [scheduleSave],
  );

  /** Remplace le calque modèle (changement/import d'image). */
  const setModel = useCallback(
    (patch: {
      assetId?: string;
      width?: number;
      height?: number;
    }) => {
      projectRef.current = {
        ...projectRef.current,
        modelAssetId: patch.assetId,
        ...(patch.width && patch.height
          ? { documentWidth: patch.width, documentHeight: patch.height }
          : {}),
      };
      scheduleSave();
    },
    [scheduleSave],
  );

  return {
    // document
    project: projectRef,
    strokes: historyRef.current.strokes,
    history: historyRef,
    strokeCount,
    strokesVersion,
    // caméra
    camera: cameraRef,
    cameraVersion,
    updateCamera,
    // outils
    tool,
    color,
    width,
    setTool: changeTool,
    setColor,
    setWidth,
    gridOn,
    setGridOn,
    // modèle
    modelOpacity,
    modelVisible,
    viewMode,
    changeModelOpacity,
    changeModelVisible,
    changeViewMode,
    setModel,
    // commandes
    commitStroke,
    eraseStrokes,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
    // sauvegarde
    saveStatus,
    doSave,
    scheduleSave,
    setProjectName,
  };
}
