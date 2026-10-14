import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Anatomy3DAsset } from '../../anatomy/types';
import { glbAssetUrl, previewImageUrl } from '../../anatomy/data/assets3d';

/**
 * Encapsulation unique de la TECHNOLOGIE 3D (dossier d'extension §3.3) :
 * le reste de l'application ne connaît que ce composant. Le moteur retenu
 * pour la V1 est `<model-viewer>` (composant Web de Google) — chargé en
 * LAZY uniquement sur cette page : ni le bundle, ni le GLB ne pèsent sur
 * l'ouverture générale de l'app (§3.6).
 *
 * Le remplacement par three.js/React-Three-Fiber (si le quiz 3D devenait
 * prioritaire) se ferait ici sans toucher au catalogue ni à l'atelier.
 */

/** Surface d'API de <model-viewer> réellement utilisée ici. */
export type ModelViewerHandle = HTMLElement & {
  loaded: boolean;
  cameraOrbit: string;
  cameraTarget: string;
  fieldOfView: string;
  interpolationDecay: number;
  toBlob(options?: { mimeType?: string; qualityArgument?: number; idealAspect?: boolean }): Promise<Blob>;
};

type Props = {
  asset: Anatomy3DAsset;
  /** Déclenché quand le modèle est affiché. */
  onReady?: () => void;
  /** Déclenché en cas d'échec de chargement (réseau, WebGL…). */
  onError?: (message: string) => void;
  /** Progression 0..1 du téléchargement (si disponible). */
  onProgress?: (progress: number) => void;
  className?: string;
  children?: ReactNode;
};

/** WebGL est-il réellement disponible sur cet appareil ? */
export function detectWebgl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ?? canvas.getContext('webgl'),
    );
  } catch {
    return false;
  }
}

let modelViewerLoaded = false;
/** Charge le composant Web une seule fois (module ~1 Mo, lazy). */
async function ensureModelViewer(): Promise<void> {
  if (modelViewerLoaded) return;
  await import('@google/model-viewer');
  modelViewerLoaded = true;
}

const Anatomy3DViewer = forwardRef<ModelViewerHandle | null, Props>(
  function Anatomy3DViewer({ asset, onReady, onError, onProgress, className, children }, ref) {
    const innerRef = useRef<ModelViewerHandle | null>(null);
    const [libReady, setLibReady] = useState(modelViewerLoaded);
    const [failed, setFailed] = useState<string | null>(null);
    const src = useMemo(() => glbAssetUrl(asset), [asset]);

    useEffect(() => {
      let cancelled = false;
      ensureModelViewer()
        .then(() => {
          if (!cancelled) setLibReady(true);
        })
        .catch(() => {
          if (!cancelled) {
            setFailed('Le moteur 3D n’a pas pu être chargé.');
          }
        });
      return () => {
        cancelled = true;
      };
    }, []);

    // Branchement des événements du composant Web.
    useEffect(() => {
      const el = innerRef.current;
      if (!el || !libReady) return;
      const onLoad = () => onReady?.();
      const onErrorEvent = (event: Event) => {
        const detail = (event as CustomEvent<{ type?: string }>).detail;
        const message =
          detail?.type === 'loadfailure'
            ? 'Le modèle 3D n’a pas pu être téléchargé (réseau ?).'
            : 'L’affichage 3D a échoué.';
        setFailed(message);
        onError?.(message);
      };
      const onProgressEvent = (event: Event) => {
        const detail = (event as CustomEvent<{ totalProgress: number }>).detail;
        if (detail && typeof detail.totalProgress === 'number') {
          onProgress?.(detail.totalProgress);
        }
      };
      el.addEventListener('load', onLoad);
      el.addEventListener('error', onErrorEvent);
      el.addEventListener('progress', onProgressEvent);
      return () => {
        el.removeEventListener('load', onLoad);
        el.removeEventListener('error', onErrorEvent);
        el.removeEventListener('progress', onProgressEvent);
      };
    }, [libReady, onReady, onError, onProgress]);

    // Ref externe : toujours synchronisée (élément créé après lazy load).
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(innerRef.current);
        return () => ref(null);
      }
      if (ref) ref.current = innerRef.current;
      return;
    }, [ref, libReady]);

    const preview = previewImageUrl(asset);
    if (failed && preview) {
      // Repli 2D honnête : aperçu statique du même modèle (§3.2).
      return (
        <div className={`viewer-fallback ${className ?? ''}`} role="alert">
          <img src={preview} alt={`Aperçu statique — ${asset.label}`} />
          <p className="faint">{failed} Voici l’aperçu statique du modèle.</p>
          {children}
        </div>
      );
    }
    if (failed) {
      return (
        <div className={`viewer-fallback ${className ?? ''}`} role="alert">
          <p className="faint">{failed}</p>
          {children}
        </div>
      );
    }
    if (!libReady) {
      return (
        <div className={`viewer-loading ${className ?? ''}`} role="status">
          <p className="faint">Chargement du moteur 3D…</p>
        </div>
      );
    }

    return (
      <model-viewer
        ref={innerRef}
        class={`viewer-element ${className ?? ''}`}
        src={src}
        alt={`Modèle anatomique 3D manipulable — ${asset.label}`}
        camera-controls
        // Vue initiale = face antérieure calibrée (voir ViewerControls).
        camera-orbit="180deg 75deg auto"
        touch-action="pan-y"
        environment-image="neutral"
        shadow-intensity="1"
        shadow-softness="0.8"
        exposure="1"
        interaction-prompt="auto"
        aria-label={`Modèle 3D de ${asset.label} — faites-le tourner avec un doigt`}
      >
        {children}
      </model-viewer>
    );
  },
);

export default Anatomy3DViewer;
