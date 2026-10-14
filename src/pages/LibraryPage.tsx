import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Search,
  ImageUp,
  Loader2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { navigate } from '../app/router';
import { Modal } from '../components/ui/Modal';
import { searchCommons, CommonsApiError } from '../features/library/services/CommonsImageProvider';
import type { CommonsSearchResult } from '../features/library/types';
import {
  curatedItems,
  curatedThumbUrl,
  materializeCuratedAsset,
} from '../features/library/services/curatedCatalog';
import {
  startProjectWithCommonsResult,
  startProjectWithCurated,
  startProjectWithFile,
} from '../features/library/services/startDrawing';
import '../styles/home.css';

/** Suggestions de recherche FR → requêtes Commons efficaces. */
const SEARCH_SUGGESTIONS: Array<{ label: string; query: string }> = [
  { label: 'Cœur', query: 'human heart anatomy' },
  { label: 'Crâne', query: 'human skull anatomy' },
  { label: 'Cerveau', query: 'human brain anatomy' },
  { label: 'Os', query: 'human bones anatomy' },
  { label: 'Main', query: 'human hand bones anatomy' },
  { label: 'Muscles', query: 'human muscles anatomy' },
  { label: 'Gray’s Anatomy', query: "Gray's anatomy plate" },
];

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; results: CommonsSearchResult[] };

export default function LibraryPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [preview, setPreview] = useState<CommonsSearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyCurated, setBusyCurated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSearch({ status: 'idle' });
      return;
    }
    setSearch({ status: 'loading' });
    try {
      const results = await searchCommons(trimmed);
      setSearch({ status: 'done', results });
    } catch (err) {
      const message =
        err instanceof CommonsApiError
          ? err.message
          : 'La recherche a échoué (réseau indisponible ?).';
      setSearch({ status: 'error', message });
    }
  }, []);

  // Debounce (§5 Source A) : aucune requête par caractère saisi.
  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void runSearch(value);
    }, 550);
  };

  useEffect(
    () => () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    },
    [],
  );

  const onCurated = async (id: string) => {
    const item = curatedItems.find((i) => i.id === id);
    if (!item) return;
    setBusyCurated(id);
    setError(null);
    try {
      await startProjectWithCurated({
        materialize: () => materializeCuratedAsset(item),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Vous pouvez importer votre propre fichier.`
          : 'Le modèle n’a pas pu être chargé.',
      );
    } finally {
      setBusyCurated(null);
    }
  };

  const onCommons = async (result: CommonsSearchResult) => {
    setBusy(true);
    setError(null);
    try {
      await startProjectWithCommonsResult(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Vous pouvez importer un fichier enregistré sur l’iPad.`
          : 'L’import de cette image a échoué.',
      );
    } finally {
      setBusy(false);
    }
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await startProjectWithFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible.');
    }
  };

  return (
    <div className="page">
      <div className="library-header">
        <button className="tool-btn" onClick={() => navigate('/')} aria-label="Retour à l’accueil">
          <ArrowLeft size={22} />
        </button>
        <h1>
          <BookOpen size={24} style={{ verticalAlign: '-4px' }} /> Bibliothèque de modèles
        </h1>
        <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
          <ImageUp size={17} /> Importer une image
        </button>
      </div>

      {error ? (
        <div className="library-error" role="alert">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : null}

      <section>
        <div className="library-section-title">
          <h2>Les essentiels pour dessiner</h2>
          <span className="faint" style={{ fontSize: '0.85rem' }}>
            une sélection disponible même sans connexion
          </span>
        </div>
        <div className="card-grid">
          {curatedItems.map((item) => (
            <button
              key={item.id}
              className="model-card card"
              onClick={() => void onCurated(item.id)}
              disabled={busyCurated !== null}
            >
              <img src={curatedThumbUrl(item)} alt={item.title} loading="lazy" />
              <div className="model-card-body">
                <strong>{item.title}</strong>
                <span className="faint">Ouvrir dans l’atelier</span>
                {busyCurated === item.id ? <Loader2 className="spin" size={16} /> : null}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="library-section-title">
          <h2>Trouver une autre planche</h2>
          <span className="faint" style={{ fontSize: '0.85rem' }}>
            recherche en ligne parmi des illustrations anatomiques
          </span>
        </div>
        <div className="search-row">
          <input
            className="search-input"
            type="search"
            value={query}
            placeholder="cœur, crâne, human heart anatomy…"
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
                void runSearch(query);
              }
            }}
            aria-label="Rechercher une illustration anatomique"
          />
          <button className="btn" onClick={() => void runSearch(query)}>
            <Search size={18} /> Rechercher
          </button>
        </div>
        <div className="search-hints" aria-label="Suggestions de recherche">
          {SEARCH_SUGGESTIONS.map((s) => (
            <button key={s.label} className="chip" onClick={() => onQueryChange(s.query)}>
              {s.label}
            </button>
          ))}
        </div>

        {search.status === 'loading' ? (
          <p className="loading-row">
            <Loader2 className="spin" size={18} /> Recherche sur Wikimedia Commons…
          </p>
        ) : null}
        {search.status === 'error' ? (
          <div className="library-error" role="alert">
            <AlertTriangle size={18} /> {search.message}{' '}
            <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
              <ImageUp size={16} /> Importer un fichier
            </button>
          </div>
        ) : null}
        {search.status === 'done' && search.results.length === 0 ? (
          <p className="empty-state">
            Aucun résultat disponible pour « {query} ». Essayez un autre terme (anglais
            conseillé) ou importez votre fichier.
          </p>
        ) : null}
        {search.status === 'done' && search.results.length > 0 ? (
          <div className="card-grid">
            {search.results.map((r) => (
              <button
                key={r.id}
                className={`model-card card commons-card ${r.reusable ? '' : 'disabled'}`}
                onClick={() => setPreview(r)}
              >
                {r.thumbUrl ? (
                  <img src={r.thumbUrl} alt={r.title} loading="lazy" />
                ) : (
                  <div className="empty-state">Image</div>
                )}
                <div className="commons-meta">
                  <span className="commons-title">{r.title}</span>
                  <span className="faint">
                    {r.width} × {r.height} px
                  </span>
                  {r.reusable ? (
                    <span className="badge badge-ok">Disponible</span>
                  ) : (
                    <span className="badge badge-warn">Non disponible</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {preview ? (
        <Modal
          title={preview.title}
          onClose={() => setPreview(null)}
          wide
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setPreview(null)}>
                Fermer
              </button>
              {preview.reusable ? (
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void onCommons(preview)}
                >
                  {busy ? <Loader2 className="spin" size={17} /> : null} Dessiner ce modèle
                </button>
              ) : (
                <span className="badge badge-warn" style={{ alignSelf: 'center' }}>
                  Image non disponible pour le dessin
                </span>
              )}
            </>
          }
        >
          {preview.thumbUrl ? (
            <img className="preview-image" src={preview.thumbUrl} alt={preview.title} />
          ) : null}
          <dl className="preview-meta">
            <dt>Dimensions</dt>
            <dd>
              {preview.width} × {preview.height} px — {preview.mime}
            </dd>
          </dl>
          {!preview.reusable ? (
            <p className="faint" style={{ marginTop: '0.75rem' }}>
              Cette illustration ne peut pas être utilisée dans l’atelier. Choisissez-en une
              autre ou importez votre propre image.
            </p>
          ) : null}
        </Modal>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          void onImport(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
