import {
  SKELETON_VIEWBOX,
  skeletonPartsInRenderOrder,
  type SchematicPart,
  type Shape,
} from '../data/skeletonSchematic';

/**
 * Image interactive à zones du quiz (B1/B2).
 *
 * Les zones tactiles sont les formes vectorielles du schéma : le
 * hit-testing est natif (SVG), dans les coordonnées du viewBox — aucune
 * conversion viewport, donc aucun désalignement en rotation iPad (B02).
 * Le rendu est purement déclaratif : mêmes formes, états différents.
 */

function shapeElement(shape: Shape, key: string) {
  switch (shape.kind) {
    case 'ellipse':
      return <ellipse key={key} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
    case 'rect':
      return (
        <rect
          key={key}
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={shape.rx ?? 0}
        />
      );
    case 'polygon':
      return (
        <polygon key={key} points={shape.points.map((p) => `${p.x},${p.y}`).join(' ')} />
      );
  }
}

type Props = {
  /** Mode B1 : rappel appelé quand une zone est touchée. */
  onPartTap?: (part: SchematicPart) => void;
  /** Mode B2 : structure à mettre en évidence. */
  highlightStructureId?: string | null;
  /** Après réponse : la bonne structure (vert) et la zone touchée (rouge). */
  revealStructureId?: string | null;
  tappedPartId?: string | null;
  /** Interactive : zones réactives ; sinon simple planche. */
  interactive?: boolean;
};

export default function AnatomyHotspotImage({
  onPartTap,
  highlightStructureId = null,
  revealStructureId = null,
  tappedPartId = null,
  interactive = false,
}: Props) {
  return (
    <div className="hotspot-figure card">
      <svg
        viewBox={`0 0 ${SKELETON_VIEWBOX.width} ${SKELETON_VIEWBOX.height}`}
        className="hotspot-svg"
        role="img"
        aria-label="Schéma squelettique simplifié de face"
      >
        {skeletonPartsInRenderOrder.map((part) => {
          const isTarget = part.structureId != null && part.structureId === highlightStructureId;
          const isReveal = part.structureId != null && part.structureId === revealStructureId;
          const isTappedWrong = tappedPartId != null && part.id === tappedPartId && !isReveal;
          const classes = [
            'hotspot-part',
            isTarget ? 'is-target' : '',
            isReveal ? 'is-reveal' : '',
            isTappedWrong ? 'is-wrong' : '',
            interactive ? 'is-interactive' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <g
              key={part.id}
              className={classes}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? `Zone : ${part.labelFr}` : undefined}
              onClick={interactive ? () => onPartTap?.(part) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPartTap?.(part);
                      }
                    }
                  : undefined
              }
            >
              {part.shapes.map((shape, i) => shapeElement(shape, `${part.id}-${i}`))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
