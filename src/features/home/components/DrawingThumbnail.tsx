import { memo } from 'react';
import { Pencil } from 'lucide-react';
import type { DrawingProject } from '../../projects/types';

/** Miniature vectorielle : les traits (coordonnées document) rejoués en SVG. */
function DrawingThumbnail({ project }: { project: DrawingProject }) {
  if (project.strokes.length === 0) {
    return (
      <span className="thumb-empty" aria-hidden>
        <Pencil size={26} />
      </span>
    );
  }
  return (
    <svg
      className="thumb-svg"
      viewBox={`0 0 ${project.documentWidth} ${project.documentHeight}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {project.strokes.map((stroke) =>
        stroke.points.length === 1 ? (
          <circle
            key={stroke.id}
            cx={stroke.points[0].x}
            cy={stroke.points[0].y}
            r={stroke.width}
            fill={stroke.color}
          />
        ) : (
          <polyline
            key={stroke.id}
            points={stroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={stroke.color}
            strokeWidth={Math.max(stroke.width, 6)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}
    </svg>
  );
}

export default memo(DrawingThumbnail);
