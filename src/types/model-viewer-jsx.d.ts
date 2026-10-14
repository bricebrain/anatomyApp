import type { DetailedHTMLProps, HTMLAttributes, Ref } from 'react';
import type { ModelViewerHandle } from '../features/anatomy3d/components/Anatomy3DViewer';

/**
 * Typage JSX minimal de l'élément custom <model-viewer> (composant Web de
 * @google/model-viewer). Seuls les attributs réellement utilisés sont
 * déclarés — la surface d'API programmée vit dans ModelViewerHandle.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        class?: string;
        'camera-controls'?: boolean;
        'camera-orbit'?: string;
        'touch-action'?: string;
        'environment-image'?: string;
        'shadow-intensity'?: string;
        'shadow-softness'?: string;
        exposure?: string;
        'interaction-prompt'?: string;
        ref?: Ref<ModelViewerHandle>;
      };
    }
  }
}

export {};
