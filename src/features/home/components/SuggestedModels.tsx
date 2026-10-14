import type { CSSProperties } from 'react';
import { CircularProgress } from '@mui/material';
import { Pencil } from 'lucide-react';
import { curatedItems, curatedThumbUrl } from '../../library/services/curatedCatalog';

type Props = {
  busyId: string | null;
  onSelect: (id: string) => void;
};

/** Carrousel façon « reels » : planches prêtes à dessiner. */
export default function SuggestedModels({ busyId, onSelect }: Props) {
  return (
    <div className="reel-row">
      {curatedItems.slice(0, 8).map((item, index) => (
        <button
          key={item.id}
          className="reel-card rise"
          style={{ '--i': index + 4 } as CSSProperties}
          onClick={() => onSelect(item.id)}
          disabled={busyId !== null}
        >
          <span className="reel-image">
            <img src={curatedThumbUrl(item)} alt={item.title} loading="lazy" />
          </span>
          <span className="reel-caption">
            <strong>{item.title}</strong>
            <small>
              {busyId === item.id ? <CircularProgress size={13} color="inherit" /> : <Pencil size={13} />}
              Prête à être dessinée
            </small>
          </span>
        </button>
      ))}
    </div>
  );
}
