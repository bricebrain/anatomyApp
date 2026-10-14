import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Columns2,
  Check,
  Loader2,
  AlertTriangle,
  CloudUpload,
} from 'lucide-react';
import { navigate } from '../app/router';
import { ConfirmDialog } from '../components/ui/Modal';
import DrawingSurface from '../features/drawing/components/DrawingSurface';
import DrawingToolbar from '../features/drawing/components/DrawingToolbar';
import ModelPanel from '../features/drawing/components/ModelPanel';
import ComparisonView from '../features/drawing/components/ComparisonView';
import { useDrawingDocument } from '../features/drawing/hooks/useDrawingDocument';
import { zoomAroundPoint } from '../features/drawing/engine/coordinates';
import {
  exportDrawingPng,
  exportCompositePng,
  downloadBlob,
  safeFilename,
} from '../features/drawing/engine/exportImage';
import type { ModelRenderInfo } from '../features/drawing/engine/render';
import { getProject, saveProject } from '../features/projects/projectRepository';
import {
  createBlankProject,
  type DrawingProject,
} from '../features/projects/types';
import {
  loadAssetImage,
  validateImageFile,
  createAssetFromBlob,
  documentSizeForModel,
} from '../features/library/services/imageImport';
import type { AnatomyAsset } from '../features/library/types';
import '../styles/workshop.css';

export default function DrawingPage({ projectId }: { projectId: string }) {
  const [loadError, setLoadError] = useState<string | null>(null);

  const [project, setProject] = useState<DrawingProject | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let loaded = await getProject(projectId);
        if (!loaded) {
          // Lien direct / rechargement après effacement du stockage.
          loaded = createBlankProject('Dessin sans titre');
          loaded.id = projectId;
          await saveProject(loaded);
        }
        if (!cancelled) setProject(loaded);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadError(
            'Impossible d’ouvrir ce dessin (stockage indisponible ?). Revenez à l’accueil pour recommencer.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loadError) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.25rem' }}>
            <AlertTriangle size={20} style={{ verticalAlign: '-3px' }} /> {loadError}
          </h1>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center' }}>
        <p className="muted">
          <Loader2 className="spin" size={20} style={{ verticalAlign: '-4px' }} />{' '}
          Ouverture du dessin…
        </p>
      </div>
    );
  }

  return <Workshop key={project.id} initialProject={project} />;
}

/* ============================================================
 * Atelier — monté uniquement quand le projet est chargé, pour
 * que l'historique et les traits partent du bon état initial.
 * ============================================================ */

function Workshop({ initialProject }: { initialProject: DrawingProject }) {
  const [project, setProject] = useState(initialProject);
  const [asset, setAsset] = useState<AnatomyAsset | null>(null);
  const [modelImage, setModelImage] = useState<HTMLImageElement | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [fitCounter, setFitCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const pendingFileRef = useRef<File | undefined>(undefined);

  const doc = useDrawingDocument(project);

  /* ---------- Modèle : chargement puis remplacement ---------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!project.modelAssetId) return;
      try {
        const result = await loadAssetImage(project.modelAssetId);
        if (!cancelled && result) {
          setAsset(result.asset);
          setModelImage(result.image);
        }
      } catch (err) {
        console.warn('Modèle introuvable dans le stockage local', err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.modelAssetId]);

  const modelInfo: ModelRenderInfo | null = useMemo(() => {
    if (!modelImage) return null;
    return {
      image: modelImage,
      rect: modelRect(project, modelImage),
      opacity: doc.modelOpacity,
      visible: doc.modelVisible,
    };
  }, [modelImage, project, doc.modelOpacity, doc.modelVisible]);

  const doImport = useCallback(
    async (file: File) => {
      try {
        const image = await validateImageFile(file);
        const newAsset = await createAssetFromBlob(file, image, {
          title: file.name.replace(/\.[a-z0-9]+$/i, ''),
          source: 'local',
          credit: {
            sourceName: 'Import personnel',
          },
        });
        const size = documentSizeForModel(image.naturalWidth, image.naturalHeight);
        setProject((p) => ({
          ...p,
          modelAssetId: newAsset.id,
          documentWidth: size.width,
          documentHeight: size.height,
        }));
        doc.setModel({ assetId: newAsset.id, ...size });
        setAsset(newAsset);
        setModelImage(image);
        setFitCounter((c) => c + 1);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Import impossible.');
      }
    },
    [doc],
  );

  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    if (doc.strokeCount > 0 && project.modelAssetId) {
      pendingFileRef.current = file;
      setConfirmReplace(true);
      return;
    }
    void doImport(file);
  };

  /* ---------- Export ---------- */

  const runExport = async (kind: 'drawing-transparent' | 'drawing-white' | 'composite') => {
    setExportBusy(true);
    setExportError(null);
    try {
      const common = {
        docWidth: project.documentWidth,
        docHeight: project.documentHeight,
        strokes: doc.strokes,
      };
      const base = safeFilename(project.name || 'dessin');
      if (kind === 'composite') {
        if (!modelInfo) throw new Error('Aucun modèle à inclure dans l’export.');
        const blob = await exportCompositePng({ ...common, model: modelInfo });
        downloadBlob(blob, `${base}-avec-modele.png`);
      } else {
        const blob = await exportDrawingPng({
          ...common,
          background: kind === 'drawing-white' ? 'white' : 'transparent',
        });
        downloadBlob(blob, `${base}-dessin.png`);
      }
    } catch (err) {
      console.error(err);
      setExportError(
        err instanceof Error ? err.message : 'L’export a échoué pour une raison inconnue.',
      );
    } finally {
      setExportBusy(false);
    }
  };

  /* ---------- Raccourcis clavier (confort desktop) ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) doc.redo();
        else doc.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc]);

  const zoomAroundCenter = (factor: number) => {
    const rect = canvasAreaRef.current?.getBoundingClientRect();
    const center = {
      x: rect ? rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.height / 2 : window.innerHeight / 2,
    };
    doc.updateCamera((c) => zoomAroundPoint(c, factor, center));
  };

  const comparing = doc.viewMode === 'side-by-side';

  return (
    <div className="workshop">
      <header className="workshop-header">
        <button
          className="tool-btn"
          onClick={() => navigate('/')}
          aria-label="Retour à l’accueil"
        >
          <ArrowLeft size={22} />
        </button>
        <input
          className="project-name"
          value={project.name}
          onChange={(e) => {
            const name = e.target.value;
            setProject((p) => (p ? { ...p, name } : p));
            doc.setProjectName(name);
          }}
          aria-label="Nom du dessin"
        />
        <span className={`save-status ${doc.saveStatus === 'error' ? 'error' : ''}`} role="status">
          {doc.saveStatus === 'saving' ? (
            <>
              <Loader2 className="spin" size={15} /> Enregistrement…
            </>
          ) : doc.saveStatus === 'error' ? (
            <>
              <AlertTriangle size={15} /> Échec d’enregistrement
            </>
          ) : doc.saveStatus === 'saved' ? (
            <>
              <Check size={15} /> Enregistré
            </>
          ) : null}
        </span>
        <div className="header-actions">
          <button
            className="btn btn-sm"
            onClick={() => doc.changeViewMode(comparing ? 'trace' : 'side-by-side')}
          >
            <Columns2 size={17} />
            {comparing ? 'Dessiner' : 'Comparer'}
          </button>
          <button
            className="btn btn-sm btn-primary"
            disabled={exportBusy}
            onClick={() => void runExport('composite')}
            title="Exporter le dessin avec le modèle (PNG)"
          >
            {exportBusy ? <Loader2 className="spin" size={17} /> : <Download size={17} />}
            Exporter
          </button>
          <button
            className="btn btn-sm"
            disabled={exportBusy}
            onClick={() => void runExport('drawing-transparent')}
            title="PNG du dessin seul, fond transparent"
          >
            Dessin seul
          </button>
          <button
            className="btn btn-sm"
            disabled={exportBusy}
            onClick={() => void runExport('drawing-white')}
            title="PNG du dessin seul, fond blanc"
          >
            Dessin + fond blanc
          </button>
        </div>
      </header>

      {exportError ? (
        <div className="banner banner-error" role="alert">
          {exportError}{' '}
          <button className="btn btn-sm btn-ghost" onClick={() => setExportError(null)}>
            Fermer
          </button>
        </div>
      ) : null}
      {doc.saveStatus === 'error' ? (
        <div className="banner banner-error" role="alert">
          Le dessin n’a pas pu être enregistré (stockage plein ou indisponible ?). Exportez-le en
          PNG pour ne pas le perdre.{' '}
          <button className="btn btn-sm" onClick={() => void doc.doSave()}>
            <CloudUpload size={16} /> Réessayer
          </button>
        </div>
      ) : null}

      <div className="workshop-body">
        {!comparing ? (
          <>
            <DrawingToolbar
              tool={doc.tool}
              onToolChange={doc.setTool}
              color={doc.color}
              onColorChange={doc.setColor}
              width={doc.width}
              onWidthChange={doc.setWidth}
              canUndo={doc.canUndo}
              canRedo={doc.canRedo}
              onUndo={doc.undo}
              onRedo={doc.redo}
              onClear={() => setConfirmClear(true)}
              onZoomIn={() => zoomAroundCenter(1.3)}
              onZoomOut={() => zoomAroundCenter(0.75)}
              onFit={() => setFitCounter((c) => c + 1)}
              gridOn={doc.gridOn}
              onGridToggle={() => doc.setGridOn(!doc.gridOn)}
            />
            <div className="canvas-area" ref={canvasAreaRef}>
              <DrawingSurface
                docWidth={project.documentWidth}
                docHeight={project.documentHeight}
                strokes={doc.strokes}
                strokesVersion={doc.strokesVersion}
                cameraRef={doc.camera}
                cameraVersion={doc.cameraVersion}
                onCameraChange={doc.updateCamera}
                tool={doc.tool}
                color={doc.color}
                width={doc.width}
                model={modelInfo}
                gridOn={doc.gridOn}
                onCommitStroke={doc.commitStroke}
                onEraseStrokes={doc.eraseStrokes}
                onFitRequest={fitCounter}
              />
            </div>
            <aside className={`model-side ${panelOpen ? 'open' : ''}`}>
              <button
                className="model-side-toggle"
                onClick={() => setPanelOpen((o) => !o)}
                aria-expanded={panelOpen}
              >
                {panelOpen ? '›' : '‹'} Modèle
              </button>
              {panelOpen ? (
                <ModelPanel
                  asset={asset}
                  modelOpacity={doc.modelOpacity}
                  modelVisible={doc.modelVisible}
                  viewMode={doc.viewMode}
                  onOpacityChange={doc.changeModelOpacity}
                  onVisibleChange={doc.changeModelVisible}
                  onViewModeChange={doc.changeViewMode}
                  onImportModel={() => fileInputRef.current?.click()}
                  disabled={!modelInfo}
                />
              ) : null}
            </aside>
          </>
        ) : (
          <div className="compare-container">
            <ComparisonView
              docWidth={project.documentWidth}
              docHeight={project.documentHeight}
              strokes={doc.strokes}
              model={modelInfo}
            />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          onImportFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {confirmClear ? (
        <ConfirmDialog
          title="Effacer tout le dessin ?"
          message="Tous les traits seront supprimés (le modèle reste en place). Cette action reste annulable via « Annuler »."
          confirmLabel="Effacer le dessin"
          danger
          onConfirm={() => {
            doc.clearAll();
            setConfirmClear(false);
          }}
          onCancel={() => setConfirmClear(false)}
        />
      ) : null}

      {confirmReplace ? (
        <ConfirmDialog
          title="Remplacer le modèle ?"
          message="Votre dessin est conservé, mais le nouveau modèle peut ne plus être aligné avec vos traits actuels."
          confirmLabel="Remplacer le modèle"
          onConfirm={() => {
            setConfirmReplace(false);
            if (pendingFileRef.current) void doImport(pendingFileRef.current);
            pendingFileRef.current = undefined;
          }}
          onCancel={() => {
            setConfirmReplace(false);
            pendingFileRef.current = undefined;
          }}
        />
      ) : null}
    </div>
  );
}

/** Rectangle document du modèle : contenu (letterbox) et centré. */
function modelRect(
  project: DrawingProject,
  image: HTMLImageElement,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min(
    project.documentWidth / image.naturalWidth,
    project.documentHeight / image.naturalHeight,
  );
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  return {
    x: (project.documentWidth - w) / 2,
    y: (project.documentHeight - h) / 2,
    width: w,
    height: h,
  };
}
