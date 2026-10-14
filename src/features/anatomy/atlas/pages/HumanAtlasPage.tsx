import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import { ArrowLeft, Boxes, Hand, RotateCcw } from 'lucide-react';
import { navigate } from '../../../../app/router';
import { ATLAS_EDITIONS } from '../constants';
import { useHumanAtlasExplorer } from '../hooks/useHumanAtlasExplorer';
import { atlasSnapshotToDrawing } from '../services/atlasSnapshotToDrawing';
import type { AtlasBodyVariant, AtlasSceneState, AtlasView, HumanAtlasViewerHandle } from '../types';
import AtlasSearchPanel from '../components/AtlasSearchPanel';
import AtlasStructureDetails from '../components/AtlasStructureDetails';
import AtlasSystemFilters from '../components/AtlasSystemFilters';
import HumanAtlasScene from '../components/HumanAtlasScene';
import '../../../../styles/human-atlas.css';

const VIEWS: Array<{ id: AtlasView; label: string }> = [
  { id: 'three-quarter', label: '3/4' },
  { id: 'front', label: 'Face' },
  { id: 'back', label: 'Dos' },
  { id: 'side', label: 'Côté' },
];

const BODIES: Array<{ id: AtlasBodyVariant; label: string }> = [
  { id: 'male', label: 'Masculin' },
  { id: 'female', label: 'Féminin' },
];

export default function HumanAtlasPage() {
  const explorer = useHumanAtlasExplorer();
  const viewerRef = useRef<HumanAtlasViewerHandle | null>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const edition = ATLAS_EDITIONS[explorer.body];

  useEffect(() => {
    setReady(false);
    setProgress(0);
    setViewerError(null);
  }, [explorer.body]);

  const sceneState = useMemo<AtlasSceneState>(() => ({
    visibleSystems: explorer.visibleSystems,
    selectedPartIds: explorer.selected?.partIds ?? [],
    isolate: explorer.isolate,
    view: explorer.view,
    resetToken: explorer.resetToken,
  }), [
    explorer.visibleSystems,
    explorer.selected,
    explorer.isolate,
    explorer.view,
    explorer.resetToken,
  ]);

  const drawCurrentView = async () => {
    if (!viewerRef.current) return;
    setCaptureBusy(true);
    setViewerError(null);
    try {
      const snapshot = await viewerRef.current.exportSnapshot();
      await atlasSnapshotToDrawing(snapshot, explorer.body, explorer.selected);
    } catch (error) {
      setViewerError(error instanceof Error ? error.message : 'La capture ne peut pas être créée.');
      setCaptureBusy(false);
    }
  };

  return (
    <Box className="page atlas3d-page page-enter">
      <header className="atlas3d-header">
        <IconButton className="back-btn" onClick={() => navigate('/')} aria-label="Retour à l’accueil">
          <ArrowLeft size={22} />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography className="page-kicker">CORPS ENTIER · 3D</Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', sm: '2.7rem' } }}>
            Explore le corps en 3D
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680, lineHeight: 1.65 }}>
            {edition.summary} {edition.limits}
          </Typography>
        </Box>
        <div className="atlas3d-segmented" role="group" aria-label="Référence anatomique">
          {BODIES.map((body) => (
            <button
              key={body.id}
              type="button"
              className={explorer.body === body.id ? 'active' : undefined}
              aria-pressed={explorer.body === body.id}
              onClick={() => explorer.setBody(body.id)}
            >
              {body.label}
            </button>
          ))}
        </div>
      </header>

      {explorer.body === 'female' ? (
        <Alert severity="info" className="atlas3d-alert">
          Cette référence a une couverture différente : certains os et muscles proviennent de sources complémentaires clairement séparées dans les filtres.
        </Alert>
      ) : null}
      {viewerError || explorer.atlasQuery.error ? (
        <Alert
          severity="error"
          className="atlas3d-alert"
          action={<Button color="inherit" size="small" onClick={() => void explorer.atlasQuery.refetch()}>Réessayer</Button>}
        >
          {viewerError ?? (explorer.atlasQuery.error instanceof Error ? explorer.atlasQuery.error.message : 'Chargement impossible.')}
        </Alert>
      ) : null}

      <Box className="atlas3d-layout">
        <Box component="aside" className="atlas3d-sidebar atlas3d-sidebar-left">
          <AtlasSearchPanel
            query={explorer.query}
            results={explorer.searchResults}
            selected={explorer.selected}
            onQueryChange={explorer.setQuery}
            onSelect={explorer.choose}
          />
          <AtlasSystemFilters
            systems={explorer.availableSystems}
            visibleSystems={explorer.visibleSystems}
            onToggle={explorer.toggleSystem}
          />
        </Box>

        <Box component="main" className="atlas3d-stage-wrap">
          <Box className="atlas3d-stage">
            {explorer.atlasQuery.data ? (
              <HumanAtlasScene
                ref={viewerRef}
                atlas={explorer.atlasQuery.data}
                state={sceneState}
                onSelect={explorer.selectPart}
                onProgress={setProgress}
                onReady={() => setReady(true)}
                onError={setViewerError}
              />
            ) : (
              <div className="atlas3d-loading">
                <CircularProgress />
                <Typography color="text.secondary">Ouverture du modèle anatomique…</Typography>
              </div>
            )}
            {!ready && explorer.atlasQuery.data ? (
              <Box className="atlas3d-progress" role="status">
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Chargement du corps… {progress} %</Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            ) : null}
          </Box>

          <div className="atlas3d-view-controls">
            <div className="atlas3d-segmented" role="group" aria-label="Orientation de la caméra">
              {VIEWS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  className={explorer.view === view.id ? 'active' : undefined}
                  aria-pressed={explorer.view === view.id}
                  onClick={() => explorer.changeView(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-sm" onClick={explorer.resetCamera}>
              <RotateCcw size={17} /> Recentrer
            </button>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/modeles3d')}>
              <Boxes size={17} /> Modèles unitaires
            </button>
          </div>
          <p className="atlas3d-hint muted">
            <Hand size={15} aria-hidden />
            Un doigt pour tourner · deux doigts pour zoomer/déplacer · toucher brièvement pour sélectionner
          </p>
        </Box>

        <Box component="aside" className="atlas3d-sidebar atlas3d-sidebar-right">
          <AtlasStructureDetails
            selected={explorer.selected}
            isolate={explorer.isolate}
            captureBusy={captureBusy || !ready}
            onIsolate={() => explorer.setIsolate(!explorer.isolate)}
            onDraw={() => void drawCurrentView()}
            onReview={() => explorer.selected?.localStructureId && navigate(`/quiz/structure/${explorer.selected.localStructureId}`)}
          />
        </Box>
      </Box>
    </Box>
  );
}
