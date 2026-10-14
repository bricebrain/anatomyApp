import type { CSSProperties } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { Focus, GraduationCap, MousePointerClick, Palette } from 'lucide-react';
import { ATLAS_SYSTEMS } from '../constants';
import type { AtlasSearchResult } from '../types';

type Props = {
  selected: AtlasSearchResult | null;
  isolate: boolean;
  captureBusy: boolean;
  onIsolate(): void;
  onDraw(): void;
  onReview(): void;
};

export default function AtlasStructureDetails({
  selected,
  isolate,
  captureBusy,
  onIsolate,
  onDraw,
  onReview,
}: Props) {
  if (!selected) {
    return (
      <section className="card atlas3d-panel atlas3d-details">
        <span className="atlas3d-details-icon" aria-hidden><MousePointerClick size={22} /></span>
        <Typography variant="h2" sx={{ fontSize: '1.35rem', mt: 1.5 }}>Explore le modèle</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>
          Touche une structure dans le corps ou utilise la recherche. Tu peux aussi capturer la vue complète pour la dessiner.
        </Typography>
        <Button fullWidth sx={{ mt: 2 }} variant="contained" startIcon={<Palette size={18} />} disabled={captureBusy} onClick={onDraw}>
          {captureBusy ? 'Préparation…' : 'Dessiner cette vue'}
        </Button>
      </section>
    );
  }

  return (
    <section className="card atlas3d-panel atlas3d-details">
      <Typography className="atlas3d-eyebrow">Structure sélectionnée</Typography>
      <Typography variant="h2" sx={{ fontSize: '1.5rem' }}>{selected.label}</Typography>
      {selected.label !== selected.originalLabel ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{selected.originalLabel}</Typography>
      ) : null}
      <div className="atlas3d-badges">
        {selected.systemIds.map((id) => {
          const system = ATLAS_SYSTEMS.find((item) => item.id === id);
          return (
            <span key={id} className="badge" style={{ '--system-color': system?.color } as CSSProperties}>
              <span className="atlas3d-system-dot" aria-hidden />
              {system?.label ?? id}
            </span>
          );
        })}
        <span className="badge">
          {selected.partIds.length} maillage{selected.partIds.length > 1 ? 's' : ''}
        </span>
      </div>
      <Typography sx={{ mt: 1.5, lineHeight: 1.55 }} color="text.secondary">
        {selected.description ?? 'Description française non encore validée. Le nom source est conservé sans traduction automatique.'}
      </Typography>
      {!selected.curated ? (
        <Alert severity="info" sx={{ mt: 1.5 }}>Libellé source en anglais — traduction non validée.</Alert>
      ) : null}
      <Stack gap={1} sx={{ mt: 2 }}>
        <Button variant={isolate ? 'outlined' : 'contained'} startIcon={<Focus size={18} />} onClick={onIsolate}>
          {isolate ? 'Revenir au corps complet' : 'Isoler et centrer'}
        </Button>
        <Button variant="contained" color="secondary" startIcon={<Palette size={18} />} disabled={captureBusy} onClick={onDraw}>
          {captureBusy ? 'Préparation…' : 'Dessiner cette vue'}
        </Button>
        <Button variant="outlined" startIcon={<GraduationCap size={18} />} disabled={!selected.localStructureId} onClick={onReview}>
          {selected.localStructureId ? 'Réviser cet élément' : 'Quiz non disponible'}
        </Button>
      </Stack>
    </section>
  );
}
