import { useMemo, useState } from 'react';
import { ArrowLeft, GraduationCap, Play } from 'lucide-react';
import { navigate } from '../../../app/router';
import type { AnatomyQuizQuestion } from '../types';
import { verifiedQuestions } from '../data/questions';
import { getStructure, structures } from '../../anatomy/data/structures';
import type { AnatomyRegion, AnatomySystem } from '../../anatomy/types';
import { REGION_LABELS, SYSTEM_LABELS } from '../../anatomy/types';
import QuizSession from '../components/QuizSession';
import '../../../styles/quiz.css';

/**
 * Configurateur de séance (§2.3) : région et/ou système (ou « Mélange »),
 * mode B1/B2, 3, 5 ou 10 questions. Le mode B3 (toucher la 3D) n'est pas
 * proposé : aucun modèle local n’a de meshes individualisés et mappés —
 * il serait trompeur de l’afficher (§2.2).
 */

type SessionConfig = {
  region: AnatomyRegion | null;
  system: AnatomySystem | null;
  mode: 'mix' | 'tap-2d' | 'name-highlighted';
  count: number;
};

function pickQuestions(config: SessionConfig): AnatomyQuizQuestion[] {
  let pool = verifiedQuestions.filter((q) => {
    const target = getStructure(q.targetStructureId);
    if (!target) return false;
    if (config.region && target.region !== config.region) return false;
    if (config.system && target.system !== config.system) return false;
    return true;
  });
  if (config.mode !== 'mix') {
    pool = pool.filter((q) => q.mode === config.mode);
  }
  // Mélange léger puis coupe à la longueur demandée (jamais de remplissage
  // artificiel : la séance propose ce qui est vérifié).
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, config.count);
}

/** Régions/systèmes réellement couverts par les questions vérifiées. */
function coveredRegions(): AnatomyRegion[] {
  const set = new Set<AnatomyRegion>();
  for (const q of verifiedQuestions) {
    const s = getStructure(q.targetStructureId);
    if (s) set.add(s.region);
  }
  return [...set];
}
function coveredSystems(): AnatomySystem[] {
  const set = new Set<AnatomySystem>();
  for (const q of verifiedQuestions) {
    const s = getStructure(q.targetStructureId);
    if (s) set.add(s.system);
  }
  return [...set];
}

const MODES = [
  { id: 'mix' as const, label: 'Mélange' },
  { id: 'tap-2d' as const, label: 'Toucher la zone' },
  { id: 'name-highlighted' as const, label: 'Nommer la structure' },
];

const LENGTHS = [3, 5, 10];

export default function QuizPage({ structureId }: { structureId?: string }) {
  const focusStructure = structureId ? getStructure(structureId) : undefined;
  const [config, setConfig] = useState<SessionConfig>(() => ({
    region: focusStructure?.region ?? null,
    system: focusStructure?.system ?? null,
    mode: 'mix',
    count: 5,
  }));
  const [session, setSession] = useState<AnatomyQuizQuestion[] | null>(null);

  const estimated = useMemo(() => {
    if (session) return session.length;
    return pickQuestions(config).length;
  }, [config, session]);

  const start = () => {
    const questions = pickQuestions(config);
    if (questions.length > 0) setSession(questions);
  };

  return (
    <div className="page quiz-page">
      <div className="library-header">
        <button
          className="tool-btn"
          onClick={() => navigate(session ? '/quiz' : '/')}
          aria-label={session ? 'Quitter la séance' : 'Retour à l’accueil'}
        >
          <ArrowLeft size={22} />
        </button>
        <h1>
          <GraduationCap size={24} style={{ verticalAlign: '-4px' }} /> Quiz d’anatomie
        </h1>
      </div>

      {session ? (
        <QuizSession
          questions={session}
          onRestart={(questions) => setSession(questions)}
          onExit={() => setSession(null)}
        />
      ) : (
        <div className="quiz-setup card">
          {focusStructure ? (
            <p className="muted">
              Révision autour de <strong>{focusStructure.nameFr}</strong> —{' '}
              {REGION_LABELS[focusStructure.region].toLowerCase()} /{' '}
              {SYSTEM_LABELS[focusStructure.system].toLowerCase()}.
            </p>
          ) : (
            <p className="muted">
              Des séances courtes pour mémoriser la localisation et le nom des
              structures. Aucun chronomètre, aucune sanction.
            </p>
          )}

          <div className="filter-group" role="group" aria-label="Région">
            <span className="filter-label faint">Région</span>
            <button
              type="button"
              className={`chip ${config.region === null ? 'chip-active' : ''}`}
              onClick={() => setConfig((c) => ({ ...c, region: null }))}
            >
              Toutes
            </button>
            {coveredRegions().map((region) => (
              <button
                key={region}
                type="button"
                className={`chip ${config.region === region ? 'chip-active' : ''}`}
                aria-pressed={config.region === region}
                onClick={() =>
                  setConfig((c) => ({ ...c, region: c.region === region ? null : region }))
                }
              >
                {REGION_LABELS[region]}
              </button>
            ))}
          </div>

          <div className="filter-group" role="group" aria-label="Système">
            <span className="filter-label faint">Système</span>
            <button
              type="button"
              className={`chip ${config.system === null ? 'chip-active' : ''}`}
              onClick={() => setConfig((c) => ({ ...c, system: null }))}
            >
              Tous
            </button>
            {coveredSystems().map((system) => (
              <button
                key={system}
                type="button"
                className={`chip ${config.system === system ? 'chip-active' : ''}`}
                aria-pressed={config.system === system}
                onClick={() =>
                  setConfig((c) => ({ ...c, system: c.system === system ? null : system }))
                }
              >
                {SYSTEM_LABELS[system]}
              </button>
            ))}
          </div>

          <div className="filter-group" role="group" aria-label="Mode">
            <span className="filter-label faint">Mode</span>
            {MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`chip ${config.mode === mode.id ? 'chip-active' : ''}`}
                aria-pressed={config.mode === mode.id}
                onClick={() => setConfig((c) => ({ ...c, mode: mode.id }))}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="filter-group" role="group" aria-label="Nombre de questions">
            <span className="filter-label faint">Questions</span>
            {LENGTHS.map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${config.count === n ? 'chip-active' : ''}`}
                aria-pressed={config.count === n}
                onClick={() => setConfig((c) => ({ ...c, count: n }))}
              >
                {n}
              </button>
            ))}
          </div>

          {estimated === 0 ? (
            <p className="empty-state">
              Aucune question vérifiée pour cette combinaison. Les questions
              s’enrichissent structure par structure, après validation manuelle.
            </p>
          ) : (
            <p className="faint">
              {estimated} question{estimated > 1 ? 's' : ''} disponible
              {estimated > 1 ? 's' : ''} pour cette sélection.
            </p>
          )}

          <div>
            <button className="btn btn-primary" disabled={estimated === 0} onClick={start}>
              <Play size={17} /> Commencer la séance
            </button>
          </div>

          <p className="faint" style={{ fontSize: '0.82rem' }}>
            {verifiedQuestions.length} questions vérifiées à la main · schéma original de
            l’application · {structures.length} structures au catalogue.
          </p>
        </div>
      )}
    </div>
  );
}
