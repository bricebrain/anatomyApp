import { useMemo, useState } from 'react';
import { ArrowRight, Check, X, GraduationCap, Pencil, RotateCcw, BookOpen } from 'lucide-react';
import type { AnatomyQuizQuestion } from '../types';
import type { SchematicPart } from '../data/skeletonSchematic';
import { skeletonParts } from '../data/skeletonSchematic';
import AnatomyHotspotImage from './AnatomyHotspotImage';
import Celebrate from '../../../components/ui/Celebrate';
import { getStructure } from '../../anatomy/data/structures';
import { saveQuizResult } from '../services/quizRepository';
import { drawStructureFromMemory, drawStructure } from '../../anatomy/services/startDrawingFromStructure';

/**
 * Séance de quiz (B1 « Où se trouve… ? » et B2 « Comment s’appelle… ? »).
 *
 * Pas de chronomètre, pas de série punitive : réponse immédiate, mise en
 * évidence de la bonne structure, explication courte, puis passage. À la
 * fin : score, erreurs à revoir, et pont vers l’atelier (B4).
 */

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type AnswerState = {
  correct: boolean;
  tappedPartId?: string;
  chosenOption?: string;
};

type Props = {
  questions: AnatomyQuizQuestion[];
  /** Rejouer uniquement les erreurs (bouton « Revoir mes erreurs »). */
  onRestart: (questions: AnatomyQuizQuestion[]) => void;
  onExit: () => void;
};

export default function QuizSession({ questions, onRestart, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [current, setCurrent] = useState<AnswerState | null>(null);

  // Ordre des options tiré une fois par question (la position ne trahit pas
  // la réponse et reste stable pendant la question).
  const shuffledOptions = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const q of questions) {
      if (q.options) map.set(q.id, shuffle(q.options));
    }
    return map;
  }, [questions]);

  const question = questions[index];
  const target = question ? getStructure(question.targetStructureId) : undefined;
  const done = index >= questions.length;
  const missed = questions.filter((_, i) => answers[i] && !answers[i].correct);

  const record = (state: AnswerState) => {
    setCurrent(state);
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = state;
      return next;
    });
    void saveQuizResult({
      questionId: question.id,
      structureId: question.targetStructureId,
      mode: question.mode,
      correct: state.correct,
    }).catch(() => {
      /* le résultat local est optionnel : ne jamais bloquer la séance */
    });
  };

  const onPartTap = (part: SchematicPart) => {
    if (current || !question) return;
    record({ correct: part.structureId === question.targetStructureId, tappedPartId: part.id });
  };

  const onOption = (structureId: string) => {
    if (current || !question) return;
    record({
      correct: structureId === question.targetStructureId,
      chosenOption: structureId,
    });
  };

  const next = () => {
    setCurrent(null);
    setIndex((i) => i + 1);
  };

  if (!question && !done) return null;

  /* ---------- Écran de fin ---------- */
  if (done) {
    const score = answers.filter((a) => a.correct).length;
    return (
      <div className="quiz-end card">
        {score / questions.length >= 0.6 ? <Celebrate count={30} originY={30} /> : null}
        <span className="quiz-end-emoji" aria-hidden>
          {score === questions.length ? '🏆' : score / questions.length >= 0.6 ? '🌸' : '💪'}
        </span>
        <h2>
          <GraduationCap size={22} style={{ verticalAlign: '-4px' }} /> Séance terminée
        </h2>
        <p className="quiz-score">
          <strong>{score}</strong> / {questions.length} bonne{questions.length > 1 ? 's' : ''} réponse
          {questions.length > 1 ? 's' : ''}
        </p>
        <p className="quiz-cheer">
          {score === questions.length
            ? 'Parfait, tu es une star de l’anatomie !'
            : score / questions.length >= 0.6
              ? 'Très joli score, continue comme ça !'
              : 'Chaque erreur est un pas de plus — on révise ensemble ?'}
        </p>
        {missed.length > 0 ? (
          <>
            <h3 style={{ fontSize: '1rem' }}>À revoir</h3>
            <ul className="quiz-missed">
              {missed.map((q) => {
                const s = getStructure(q.targetStructureId);
                return (
                  <li key={q.id}>
                    <span>{s?.nameFr ?? q.targetStructureId}</span>
                    <span className="faint">{q.explanationFr}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="muted">Sans faute — bravo&nbsp;! Retiens bien la localisation de chaque os.</p>
        )}

        <div className="quiz-end-actions">
          {missed.length > 0 ? (
            <button className="btn btn-primary" onClick={() => onRestart(missed)}>
              <RotateCcw size={17} /> Revoir mes erreurs
            </button>
          ) : null}
          {questions.length > 0 ? (
            <DrawFromSessionButton questions={questions} answers={answers} />
          ) : null}
          <button className="btn" onClick={onExit}>
            Configurer une autre séance
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Question en cours ---------- */
  const options = shuffledOptions.get(question.id) ?? [];
  const isTap = question.mode === 'tap-2d';

  return (
    <div className="quiz-session">
      <div className="quiz-progress" role="status">
        <span>Question {index + 1} / {questions.length}</span>
        <span className="quiz-progress-track" aria-hidden>
          <span
            className="quiz-progress-fill"
            style={{ width: `${((index + (current ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </span>
        <span className="quiz-progress-dots" aria-hidden>
          {questions.map((q, i) => (
            <span
              key={q.id}
              className={`quiz-dot ${answers[i] ? (answers[i].correct ? 'is-ok' : 'is-ko') : i === index ? 'is-now' : ''}`}
            />
          ))}
        </span>
      </div>
      <h2 key={question.id} className="quiz-prompt">{question.promptFr}</h2>
      {current?.correct ? <Celebrate key={`c-${index}`} /> : null}

      <div key={`b-${question.id}`} className={`quiz-body ${current && !current.correct ? 'is-wrong' : ''}`}>
        <AnatomyHotspotImage
          interactive={isTap && !current}
          onPartTap={onPartTap}
          highlightStructureId={
            !isTap || current ? question.targetStructureId : null
          }
          revealStructureId={current ? question.targetStructureId : null}
          tappedPartId={current?.tappedPartId ?? null}
        />

        <div className="quiz-side">
          {isTap ? (
            <p className="muted quiz-hint">
              👆 Touche la zone sur le schéma. Il est stylisé : cherche la
              localisation, pas le détail fin.
            </p>
          ) : (
            <div className="quiz-options" role="group" aria-label="Choix de réponse">
              {options.map((structureId) => {
                const s = getStructure(structureId);
                const chosen = current?.chosenOption === structureId;
                const isRight = current && structureId === question.targetStructureId;
                return (
                  <button
                    key={structureId}
                    type="button"
                    className={`btn quiz-option ${current ? (isRight ? 'quiz-option-right' : chosen ? 'quiz-option-wrong' : '') : ''}`}
                    disabled={current !== null}
                    onClick={() => onOption(structureId)}
                  >
                    {current && isRight ? <Check size={16} /> : null}
                    {current && chosen && !isRight ? <X size={16} /> : null}
                    {s?.nameFr ?? structureId}
                  </button>
                );
              })}
            </div>
          )}

          {current ? (
            <div className={`quiz-feedback ${current.correct ? 'ok' : 'ko'}`} role="alert">
              <strong>
                {current.correct
                  ? 'Bien vu ! 🎉'
                  : `Presque ! Tu as choisi ${tappedLabel(current)}.`}
              </strong>
              {!current.correct && target ? (
                <span> La bonne réponse était : {target.nameFr} (en vert sur le schéma).</span>
              ) : null}
              <p className="quiz-explanation">{question.explanationFr}</p>
              {target ? (
                <div className="quiz-feedback-fiche">
                  <span className="faint">{target.descriptionFr}</span>
                  <div className="quiz-feedback-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => void drawStructureFromMemory(target.id)}
                    >
                      <Pencil size={15} /> Dessiner de mémoire
                    </button>
                    <a className="btn btn-sm btn-ghost" href="#/explorer">
                      <BookOpen size={15} /> Voir la fiche
                    </a>
                  </div>
                </div>
              ) : null}
              <button className="btn btn-primary" onClick={next}>
                {index + 1 === questions.length ? 'Voir le résultat' : 'Continuer'}{' '}
                <ArrowRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function tappedLabel(state: AnswerState): string {
  // B2 : l'option choisie est une structure connue du référentiel.
  if (state.chosenOption) {
    return getStructure(state.chosenOption)?.nameFr ?? state.chosenOption;
  }
  // B1 : étiquette française de la zone touchée du schéma.
  if (state.tappedPartId) {
    const label = skeletonParts.find((p) => p.id === state.tappedPartId)?.labelFr;
    if (label) return label;
  }
  return 'une autre zone';
}

/** « Dessiner l'une des structures » : la première structure ratée, sinon la cible 1. */
function DrawFromSessionButton({
  questions,
  answers,
}: {
  questions: AnatomyQuizQuestion[];
  answers: AnswerState[];
}) {
  const [busy, setBusy] = useState(false);
  const candidates = questions
    .map((_, i) => i)
    .filter((i) => answers[i] && !answers[i].correct)
    .map((i) => questions[i].targetStructureId);
  const structureId = candidates[0] ?? questions[0].targetStructureId;
  const structure = getStructure(structureId);
  if (!structure || structure.reference2dIds.length === 0) return null;
  return (
    <button
      className="btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await drawStructure(structureId);
        } catch {
          setBusy(false);
        }
      }}
    >
      <Pencil size={17} /> Dessiner « {structure.nameFr} »
    </button>
  );
}
