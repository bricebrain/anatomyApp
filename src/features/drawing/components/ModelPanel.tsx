import { Eye, EyeOff, Layers, Columns2, ImageUp } from 'lucide-react';
import type { AnatomyAsset } from '../../library/types';
import type { ViewMode } from '../types';

/**
 * Panneau « Modèle » (§4, écran 3) : opacité, visibilité, mode Calque /
 * Côte à côte et remplacement par import.
 */

type Props = {
  asset: AnatomyAsset | null;
  modelOpacity: number;
  modelVisible: boolean;
  viewMode: ViewMode;
  onOpacityChange: (v: number) => void;
  onVisibleChange: (v: boolean) => void;
  onViewModeChange: (v: ViewMode) => void;
  onImportModel: () => void;
  disabled?: boolean;
};

export default function ModelPanel({
  asset,
  modelOpacity,
  modelVisible,
  viewMode,
  onOpacityChange,
  onVisibleChange,
  onViewModeChange,
  onImportModel,
  disabled,
}: Props) {
  return (
    <div className="model-panel">
      <div className="model-panel-section">
        <p className="panel-label">Mode d’affichage</p>
        <div className="segmented" role="radiogroup" aria-label="Mode d’affichage">
          <button
            className={`segmented-btn ${viewMode === 'trace' ? 'active' : ''}`}
            onClick={() => onViewModeChange('trace')}
            role="radio"
            aria-checked={viewMode === 'trace'}
          >
            <Layers size={16} /> Calque
          </button>
          <button
            className={`segmented-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => onViewModeChange('side-by-side')}
            role="radio"
            aria-checked={viewMode === 'side-by-side'}
          >
            <Columns2 size={16} /> Côte à côte
          </button>
        </div>
      </div>

      <div className="model-panel-section">
        <div className="panel-row">
          <p className="panel-label">Modèle de référence</p>
          <button
            className="tool-btn"
            onClick={() => onVisibleChange(!modelVisible)}
            aria-label={modelVisible ? 'Masquer le modèle' : 'Afficher le modèle'}
            title={modelVisible ? 'Masquer le modèle' : 'Afficher le modèle'}
            disabled={disabled}
          >
            {modelVisible ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        <label className="slider-row">
          <span className="faint">Opacité</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(modelOpacity * 100)}
            onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
            aria-label="Opacité du modèle"
            disabled={disabled || !modelVisible}
          />
          <span className="slider-value">{Math.round(modelOpacity * 100)} %</span>
        </label>
        {disabled ? (
          <p className="faint" style={{ fontSize: '0.85rem', margin: '0.35rem 0 0' }}>
            Aucun modèle — page blanche.
          </p>
        ) : null}
      </div>

      <div className="model-panel-section">
        <button className="btn btn-sm" onClick={onImportModel} style={{ width: '100%' }}>
          <ImageUp size={18} />
          {asset ? 'Remplacer le modèle' : 'Importer un modèle'}
        </button>
        <p className="faint" style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
          Votre dessin est conservé lors d’un changement de modèle.
        </p>
      </div>
    </div>
  );
}
