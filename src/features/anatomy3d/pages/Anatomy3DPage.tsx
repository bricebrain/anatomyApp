import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, Box, AlertTriangle } from 'lucide-react';
import { navigate } from '../../../app/router';
import { get3dAsset } from '../../anatomy/data/assets3d';
import { getStructure } from '../../anatomy/data/structures';
import { curatedItems, curatedThumbUrl } from '../../library/services/curatedCatalog';
import { drawStructure } from '../../anatomy/services/startDrawingFromStructure';
import Anatomy3DViewer, {
  detectWebgl,
  type ModelViewerHandle,
} from '../components/Anatomy3DViewer';
import ViewerControls from '../components/ViewerControls';
import { snapshotToDrawing } from '../services/snapshotToDrawing';
import '../../../styles/viewer3d.css';

/**
 * Explorateur anatomique 3D (feature C) : un élément à la fois, rotation à
 * un doigt, zoom pincé, vues prédéfinies calibrées, et capture de l'angle
 * courant comme référence de dessin. Repli 2D si WebGL échoue.
 */

export default function Anatomy3DPage({ assetId }: { assetId: string }) {
  const asset = get3dAsset(assetId);
  const viewerRef = useRef<ModelViewerHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const webglOk = useRef(detectWebgl()).current;

  const onReady = useCallback(() => {
    setProgress(null);
    setReady(true);
  }, []);
  const onError = useCallback((message: string) => {
    setReady(false);
    setError(message);
  }, []);
  const onProgress = useCallback((value: number) => setProgress(value), []);

  const structure = asset ? getStructure(asset.structureIds[0]) : undefined;
  const plates = asset
    ? (structure?.reference2dIds ?? [])
        .map((id) => curatedItems.find((item) => item.id === id))
        .filter((item): item is NonNullable<typeof item> => item !== undefined)
    : [];

  const onCapture = async () => {
    const viewer = viewerRef.current;
    if (!viewer || !asset) return;
    setCapturing(true);
    setError(null);
    try {
      await snapshotToDrawing(viewer, asset);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Vous pouvez dessiner depuis une planche 2D ci-dessous.`
          : 'La capture 3D a échoué.',
      );
      setCapturing(false);
    }
  };

  if (!asset) {
    return (
      <div className="page">
        <div className="library-header">
          <button className="tool-btn" onClick={() => navigate('/')} aria-label="Retour à l’accueil">
            <ArrowLeft size={22} />
          </button>
          <h1>Modèle 3D introuvable</h1>
        </div>
        <p className="empty-state">
          Ce modèle n’existe pas dans la bibliothèque 3D.
        </p>
      </div>
    );
  }

  return (
    <div className="page viewer-page">
      <div className="library-header">
        <button className="tool-btn" onClick={() => navigate('/modeles3d')} aria-label="Retour aux modèles 3D">
          <ArrowLeft size={22} />
        </button>
        <h1>
          <Box size={24} style={{ verticalAlign: '-4px' }} /> {asset.label} en 3D
        </h1>
      </div>

      {error ? (
        <div className="library-error" role="alert">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : null}

      {!webglOk ? (
        <div className="viewer-webgl-missing card">
          <p>
            <strong>L’affichage 3D n’est pas disponible</strong> sur cet appareil ou ce
            navigateur (WebGL indisponible). Pas de panique : votre travail n’est pas
            perdu, et le modèle existe aussi en planches 2D.
          </p>
          <Viewer2dFallback structureId={asset.structureIds[0]} plates={plates} />
        </div>
      ) : (
        <>
          <div className="viewer-stage card">
            <Anatomy3DViewer
              ref={viewerRef}
              asset={asset}
              onReady={onReady}
              onError={onError}
              onProgress={onProgress}
            >
              {!ready && progress !== null && progress < 1 ? (
                <span slot="progress-bar" className="viewer-progress">
                  Téléchargement du modèle… {Math.round(progress * 100)} %
                </span>
              ) : null}
            </Anatomy3DViewer>
          </div>

          <ViewerControls
            viewerRef={viewerRef}
            ready={ready}
            capturing={capturing}
            onCapture={() => void onCapture()}
          />

          <p className="faint viewer-hint">
            Un doigt pour faire tourner, deux doigts pour zoomer et déplacer. La
            capture ouvre l’atelier avec CET angle comme référence verrouillée.
          </p>
        </>
      )}

      {plates.length > 0 ? (
        <section className="card viewer-drawing-alternatives">
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Tu préfères partir d’une planche&nbsp;?</h2>
            <p className="muted">Choisis une vue 2D et ouvre-la directement dans l’atelier.</p>
          </div>
          <Viewer2dFallback structureId={asset.structureIds[0]} plates={plates} />
        </section>
      ) : null}
    </div>
  );
}

/** Repli 2D : planches vérifiées de la même structure (aucune image inventée). */
function Viewer2dFallback({
  structureId,
  plates,
}: {
  structureId: string;
  plates: ReturnType<typeof curatedItems.slice>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  if (plates.length === 0) {
    return <p className="faint">Aucune planche 2D disponible pour cette structure.</p>;
  }
  return (
    <div className="viewer-2d-plates">
      {plates.map((plate) => (
        <div key={plate.id} className="viewer-2d-plate">
          <img src={curatedThumbUrl(plate)} alt={plate.title} loading="lazy" />
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy !== null}
            onClick={() => {
              setBusy(plate.id);
              drawStructure(structureId, plate.id).catch(() => setBusy(null));
            }}
          >
            Dessiner cette planche
          </button>
        </div>
      ))}
    </div>
  );
}
