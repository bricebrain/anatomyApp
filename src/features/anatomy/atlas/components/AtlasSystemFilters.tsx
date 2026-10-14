import type { CSSProperties } from 'react';
import { Typography } from '@mui/material';
import type { AtlasSystemDefinition } from '../constants';
import type { AtlasSystemId } from '../types';

type SystemWithCount = AtlasSystemDefinition & { count: number };

type Props = {
  systems: SystemWithCount[];
  visibleSystems: AtlasSystemId[];
  onToggle(system: AtlasSystemId): void;
};

export default function AtlasSystemFilters({ systems, visibleSystems, onToggle }: Props) {
  return (
    <section className="card atlas3d-panel atlas3d-system-panel">
      <Typography className="atlas3d-eyebrow">Systèmes visibles</Typography>
      <div className="atlas3d-system-list">
        {systems.map((system) => {
          const visible = visibleSystems.includes(system.id);
          return (
            <button
              key={system.id}
              type="button"
              className={`atlas3d-system${visible ? ' active' : ''}`}
              aria-pressed={visible}
              onClick={() => onToggle(system.id)}
              style={{ '--system-color': system.color } as CSSProperties}
            >
              <span className="atlas3d-system-dot" aria-hidden />
              <span className="atlas3d-system-label">{system.label}</span>
              <span className="atlas3d-system-count">{system.count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
