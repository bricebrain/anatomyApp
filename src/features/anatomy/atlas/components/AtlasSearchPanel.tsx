import { InputAdornment, TextField, Typography } from '@mui/material';
import { Search } from 'lucide-react';
import type { AtlasSearchResult } from '../types';

type Props = {
  query: string;
  results: AtlasSearchResult[];
  selected: AtlasSearchResult | null;
  onQueryChange(value: string): void;
  onSelect(result: AtlasSearchResult): void;
};

export default function AtlasSearchPanel({
  query,
  results,
  selected,
  onQueryChange,
  onSelect,
}: Props) {
  return (
    <section className="card atlas3d-panel">
      <Typography className="atlas3d-eyebrow">Rechercher</Typography>
      <TextField
        fullWidth
        size="small"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Cœur, crâne, humérus…"
        inputProps={{ 'aria-label': 'Rechercher une structure' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} aria-hidden color="var(--rose-500)" />
            </InputAdornment>
          ),
        }}
      />
      {query.trim().length >= 2 ? (
        <ul className="atlas3d-search-results" aria-label="Résultats anatomiques">
          {results.length > 0 ? results.map((result) => (
            <li key={result.structureId}>
              <button
                type="button"
                className={selected?.structureId === result.structureId ? 'active' : undefined}
                onClick={() => onSelect(result)}
              >
                <strong>{result.label}</strong>
                <small>{result.curated ? result.originalLabel : result.conceptId}</small>
              </button>
            </li>
          )) : (
            <li className="atlas3d-empty muted">Aucune structure trouvée dans cette référence.</li>
          )}
        </ul>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.5 }}>
          Les noms français relus sont proposés en priorité. Les autres structures restent en anglais.
        </Typography>
      )}
    </section>
  );
}
