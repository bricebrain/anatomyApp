import {
  Pencil,
  Eraser,
  Hand,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3x3,
} from 'lucide-react';
import type { DrawingToolId } from '../types';
import { PEN_SIZES, PEN_COLORS } from '../types';

/**
 * Barre d'outils (§4, écran 3). Verticale en paysage (à gauche de la zone de
 * dessin), horizontale en bas en portrait — via CSS.
 */

type Props = {
  tool: DrawingToolId;
  onToolChange: (tool: DrawingToolId) => void;
  color: string;
  onColorChange: (color: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  gridOn: boolean;
  onGridToggle: () => void;
};

export default function DrawingToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  width,
  onWidthChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onFit,
  gridOn,
  onGridToggle,
}: Props) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Outils de dessin">
      <div className="toolbar-group">
        <button
          className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => onToolChange('pen')}
          aria-label="Crayon"
          aria-pressed={tool === 'pen'}
          title="Crayon"
        >
          <Pencil size={22} />
        </button>
        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => onToolChange('eraser')}
          aria-label="Gomme (efface des traits entiers)"
          aria-pressed={tool === 'eraser'}
          title="Gomme — trait entier"
        >
          <Eraser size={22} />
        </button>
        <button
          className={`tool-btn ${tool === 'pan' ? 'active' : ''}`}
          onClick={() => onToolChange('pan')}
          aria-label="Main — déplacer"
          aria-pressed={tool === 'pan'}
          title="Main — déplacer"
        >
          <Hand size={22} />
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group toolbar-colors" role="radiogroup" aria-label="Couleur">
        {PEN_COLORS.map((c) => (
          <button
            key={c.id}
            className={`color-dot ${color === c.value ? 'selected' : ''}`}
            style={{ background: c.value }}
            onClick={() => onColorChange(c.value)}
            aria-label={c.label}
            aria-checked={color === c.value}
            role="radio"
            title={c.label}
          />
        ))}
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group toolbar-sizes" role="radiogroup" aria-label="Épaisseur">
        {PEN_SIZES.map((s) => (
          <button
            key={s}
            className={`size-dot ${width === s ? 'selected' : ''}`}
            onClick={() => onWidthChange(s)}
            aria-label={`${s} pixels`}
            aria-checked={width === s}
            role="radio"
            title={`${s} px`}
          >
            <span
              style={{
                width: Math.min(4 + s, 22),
                height: Math.min(4 + s, 22),
                borderRadius: '50%',
                background: 'currentColor',
                display: 'block',
              }}
            />
          </button>
        ))}
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button
          className="tool-btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Annuler"
          title="Annuler"
        >
          <Undo2 size={22} />
        </button>
        <button
          className="tool-btn"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Refaire"
          title="Refaire"
        >
          <Redo2 size={22} />
        </button>
        <button
          className="tool-btn"
          onClick={onClear}
          aria-label="Effacer tout le dessin"
          title="Effacer tout"
        >
          <Trash2 size={22} />
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button className="tool-btn" onClick={onZoomOut} aria-label="Zoom arrière" title="Zoom arrière">
          <ZoomOut size={22} />
        </button>
        <button className="tool-btn" onClick={onFit} aria-label="Remettre à l’écran" title="Remettre à l’écran">
          <Maximize size={20} />
        </button>
        <button className="tool-btn" onClick={onZoomIn} aria-label="Zoom avant" title="Zoom avant">
          <ZoomIn size={22} />
        </button>
        <button
          className={`tool-btn ${gridOn ? 'active' : ''}`}
          onClick={onGridToggle}
          aria-label="Grille de repère"
          aria-pressed={gridOn}
          title="Grille de repère"
        >
          <Grid3x3 size={20} />
        </button>
      </div>
    </div>
  );
}
