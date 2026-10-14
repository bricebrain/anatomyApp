import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { ArrowLeft, Box as BoxIcon, Search } from 'lucide-react';
import { navigate } from '../../../app/router';
import type { AnatomyDifficulty, AnatomyRegion, AnatomySystem } from '../types';
import { DIFFICULTY_LABELS, REGION_LABELS } from '../types';
import { regionsWithContent, structures, systemsWithContent } from '../data/structures';
import { filterStructures, normalizeFr, searchStructures } from '../services/structureSearch';
import AnatomyStructureCard from '../components/AnatomyStructureCard';
import '../../../styles/explore.css';

const SHORT_SYSTEM_LABELS: Record<AnatomySystem, string> = {
  skeletal: 'Squelette',
  muscular: 'Muscles',
  cardiovascular: 'Cardiovasculaire',
  respiratory: 'Respiratoire',
  nervous: 'Nerveux',
  digestive: 'Digestif',
  other: 'Autre',
};

export default function ExploreBodyPage() {
  const [region, setRegion] = useState<AnatomyRegion | null>(null);
  const [system, setSystem] = useState<AnatomySystem | null>(null);
  const [difficulty, setDifficulty] = useState<AnatomyDifficulty | null>(null);
  const [query, setQuery] = useState('');
  const [only2d, setOnly2d] = useState(false);
  const [only3d, setOnly3d] = useState(false);

  const normQuery = normalizeFr(query);
  const searchHits = useMemo(
    () => (normQuery.length >= 2 ? searchStructures(normQuery) : []),
    [normQuery],
  );
  const searchIds = useMemo(() => new Set(searchHits.map((hit) => hit.structure.id)), [searchHits]);

  const results = useMemo(() => {
    const filtered = filterStructures({
      region: region ?? undefined,
      system: system ?? undefined,
      difficulty: difficulty ?? undefined,
      with2d: only2d || undefined,
      with3d: only3d || undefined,
    });
    return normQuery.length >= 2
      ? filtered.filter((structure) => searchIds.has(structure.id))
      : filtered;
  }, [region, system, difficulty, only2d, only3d, normQuery, searchIds]);

  const regionCounts = useMemo(
    () => Object.fromEntries(regionsWithContent.map((item) => [item, structures.filter((structure) => structure.region === item).length])),
    [],
  );

  const selectedTitle = normQuery.length >= 2
    ? `Résultats pour « ${query.trim()} »`
    : region
      ? REGION_LABELS[region]
      : 'Toutes les structures';

  return (
    <Box className="page atlas-page">
      <header className="atlas-header">
        <IconButton className="back-btn" onClick={() => navigate('/')} aria-label="Retour à l’accueil">
          <ArrowLeft size={22} />
        </IconButton>
        <Box>
          <Typography className="page-kicker">ATLAS PERSONNEL</Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', sm: '2.8rem' } }}>
            Atlas anatomique
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 690, lineHeight: 1.65 }}>
            Parcours les régions du corps comme dans un atlas, puis ouvre une fiche pour
            l’observer, la dessiner ou la réviser.
          </Typography>
        </Box>
      </header>

      <div className="atlas-layout">
        <Paper component="nav" className="atlas-region-nav" aria-label="Régions anatomiques">
          <Typography className="atlas-nav-eyebrow">Régions anatomiques</Typography>
          <button
            type="button"
            className={`atlas-region-button ${region === null ? 'active' : ''}`}
            onClick={() => setRegion(null)}
          >
            <span className="atlas-region-index">00</span>
            <span>Toutes les régions</span>
            <small>{structures.length}</small>
          </button>
          {regionsWithContent.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`atlas-region-button ${region === item ? 'active' : ''}`}
              onClick={() => setRegion(region === item ? null : item)}
              aria-pressed={region === item}
            >
              <span className="atlas-region-index">{String(index + 1).padStart(2, '0')}</span>
              <span>{REGION_LABELS[item]}</span>
              <small>{regionCounts[item]}</small>
            </button>
          ))}
          <div className="atlas-3d-note">
            <BoxIcon size={18} />
            <span>4 structures sont aussi disponibles en vue 3D.</span>
          </div>
        </Paper>

        <main className="atlas-main">
          <Paper className="atlas-toolbar">
            <TextField
              fullWidth
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher : humérus, rachis, mâchoire…"
              aria-label="Rechercher une structure anatomique en français"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Search size={19} /></InputAdornment>
                ),
              }}
            />

            <div className="atlas-filter-block">
              <Typography className="atlas-filter-label">Système anatomique</Typography>
              <ToggleButtonGroup
                exclusive
                value={system ?? 'all'}
                onChange={(_, value: AnatomySystem | 'all' | null) => {
                  if (value) setSystem(value === 'all' ? null : value);
                }}
                aria-label="Système anatomique"
                className="atlas-system-tabs"
              >
                <ToggleButton value="all">Tous</ToggleButton>
                {systemsWithContent.map((item) => (
                  <ToggleButton key={item} value={item}>{SHORT_SYSTEM_LABELS[item]}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>

            <div className="atlas-secondary-filters">
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select
                  value={difficulty ?? 'all'}
                  onChange={(event) => setDifficulty(event.target.value === 'all' ? null : event.target.value as AnatomyDifficulty)}
                  aria-label="Niveau de difficulté"
                >
                  <MenuItem value="all">Tous les niveaux</MenuItem>
                  {(Object.keys(DIFFICULTY_LABELS) as AnatomyDifficulty[]).map((item) => (
                    <MenuItem key={item} value={item}>{DIFFICULTY_LABELS[item]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Chip label="Avec planche 2D" variant={only2d ? 'filled' : 'outlined'} color={only2d ? 'primary' : 'default'} onClick={() => setOnly2d(!only2d)} />
              <Chip label="Avec modèle 3D" variant={only3d ? 'filled' : 'outlined'} color={only3d ? 'primary' : 'default'} onClick={() => setOnly3d(!only3d)} />
            </div>
          </Paper>

          <div className="atlas-results-header">
            <div>
              <Typography className="atlas-results-kicker">SÉLECTION</Typography>
              <Typography variant="h2" sx={{ fontSize: '1.55rem' }}>{selectedTitle}</Typography>
            </div>
            <Typography color="text.secondary">
              {results.length} fiche{results.length > 1 ? 's' : ''}
            </Typography>
          </div>

          {results.length === 0 ? (
            <Paper className="atlas-empty">
              Aucune fiche ne correspond à cette sélection. Modifie un filtre ou ta recherche.
            </Paper>
          ) : (
            <div className="card-grid atlas-card-grid">
              {results.map((structure) => (
                <AnatomyStructureCard key={structure.id} structure={structure} />
              ))}
            </div>
          )}
        </main>
      </div>
    </Box>
  );
}
