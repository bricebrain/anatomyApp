import { Camera, RotateCcw, Pencil, Loader2 } from 'lucide-react';
import type { ModelViewerHandle } from './Anatomy3DViewer';

/**
 * Contrôles de l'explorateur 3D : vues prédéfinies, remise à zéro et
 * capture de la vue courante vers l'atelier.
 *
 * Les modèles externes n'utilisent pas tous le même axe. Les commandes sont
 * donc volontairement relatives (« angle principal », « tourner ») plutôt
 * que de promettre une face anatomique potentiellement erronée.
 */

export type PresetView = {
  id: string;
  label: string;
  /** camera-orbit : azimut (theta) / site (phi) / distance. */
  orbit: string;
};

export const PRESET_VIEWS: PresetView[] = [
  { id: 'front', label: 'Angle principal', orbit: '180deg 75deg auto' },
  { id: 'left', label: 'Tourner à gauche', orbit: '90deg 75deg auto' },
  { id: 'right', label: 'Tourner à droite', orbit: '-90deg 75deg auto' },
  { id: 'back', label: 'Demi-tour', orbit: '0deg 75deg auto' },
  { id: 'top', label: 'Dessus', orbit: '180deg 10deg auto' },
];

const DEFAULT_ORBIT = 'auto auto auto';

type Props = {
  viewerRef: React.RefObject<ModelViewerHandle | null>;
  ready: boolean;
  /** Capture en cours (bouton désactivé + retour visuel). */
  capturing: boolean;
  onCapture: () => void;
};

export default function ViewerControls({ viewerRef, ready, capturing, onCapture }: Props) {
  const applyOrbit = (orbit: string) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    // Assignation par propriété : model-viewer anime doucement vers la
    // nouvelle orbite (interpolation), sans déplacer le modèle lui-même.
    viewer.interpolationDecay = 100;
    viewer.cameraOrbit = orbit;
  };

  return (
    <div className="viewer-controls" role="toolbar" aria-label="Contrôles du modèle 3D">
      <div className="viewer-views" role="group" aria-label="Vues prédéfinies">
        <Camera size={16} className="faint" aria-hidden />
        {PRESET_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            className="chip"
            disabled={!ready}
            onClick={() => applyOrbit(view.orbit)}
          >
            {view.label}
          </button>
        ))}
        <button
          type="button"
          className="chip"
          disabled={!ready}
          onClick={() => {
            const viewer = viewerRef.current;
            if (!viewer) return;
            viewer.cameraTarget = 'auto auto auto';
            viewer.fieldOfView = 'auto';
            viewer.cameraOrbit = DEFAULT_ORBIT;
          }}
        >
          <RotateCcw size={14} aria-hidden /> Remettre à zéro
        </button>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        disabled={!ready || capturing}
        onClick={onCapture}
        title="Capture l’angle choisi et ouvre l’atelier de dessin"
      >
        {capturing ? <Loader2 className="spin" size={17} /> : <Pencil size={17} />}
        Utiliser cette vue pour dessiner
      </button>
    </div>
  );
}
