import { useState } from 'react';
import { Pencil, Box, GraduationCap, Loader2, AlertTriangle } from 'lucide-react';
import type { AnatomyStructure } from '../types';
import { DIFFICULTY_LABELS, REGION_LABELS, SYSTEM_LABELS } from '../types';
import { curatedItems, curatedThumbUrl } from '../../library/services/curatedCatalog';
import {
  drawStructure,
  first3dAssetId,
  reviewStructure,
  viewStructureIn3d,
} from '../services/startDrawingFromStructure';

/**
 * Fiche d'une structure du référentiel : aperçu réel (planche du catalogue
 * local), description factuelle et actions. Un bouton n'apparaît
 * que si la ressource correspondante existe réellement — une structure sans
 * modèle 3D n'affiche AUCUNE promesse 3D (critère A04).
 */

export function StructureBadges({ structure }: { structure: AnatomyStructure }) {
  return (
    <>
      <span className="badge badge-ok">{SYSTEM_LABELS[structure.system]}</span>
      <span className="badge">{REGION_LABELS[structure.region]}</span>
      <span className="badge">{DIFFICULTY_LABELS[structure.difficulty]}</span>
    </>
  );
}

type Props = {
  structure: AnatomyStructure;
  /** Après une action qui navigue (dessin/quiz/3D). */
};

export default function AnatomyStructureCard({ structure }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plates = structure.reference2dIds
    .map((id) => curatedItems.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => item !== undefined);
  const has3d = first3dAssetId(structure.id) !== null;
  const hasQuiz = structure.quizQuestionIds.length > 0;
  const preview = plates[0];

  const onDraw = async (reference2dId: string) => {
    setBusy(reference2dId);
    setError(null);
    try {
      await drawStructure(structure.id, reference2dId);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Vous pouvez importer votre propre image depuis l’accueil.`
          : 'Le modèle n’a pas pu être chargé.',
      );
      setBusy(null);
    }
  };

  return (
    <>
      <button
        type="button"
        className="model-card card structure-card"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {preview ? (
          <img src={curatedThumbUrl(preview)} alt={preview.title} loading="lazy" />
        ) : (
          <div className="structure-card-nopreview faint">Pas d’aperçu</div>
        )}
        <div className="model-card-body">
          <span className="structure-card-system">{SYSTEM_LABELS[structure.system]}</span>
          <strong className="structure-card-title">{structure.nameFr}</strong>
          <div className="structure-card-meta">
            <span>{DIFFICULTY_LABELS[structure.difficulty]}</span>
            {has3d ? <span>Vue 3D</span> : null}
            {hasQuiz ? <span>Quiz</span> : null}
          </div>
        </div>
      </button>

      {open ? (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal structure-detail" role="dialog" aria-modal="true" aria-label={structure.nameFr}>
            <div className="modal-header">
              <h2>{structure.nameFr}</h2>
              <button type="button" className="tool-btn" onClick={() => setOpen(false)} aria-label="Fermer">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="structure-detail-badges">
                <StructureBadges structure={structure} />
              </div>
              {structure.descriptionFr ? (
                <p className="muted" style={{ lineHeight: 1.6 }}>
                  {structure.descriptionFr}
                </p>
              ) : null}
              {error ? (
                <div className="library-error" role="alert" style={{ marginBottom: '0.9rem' }}>
                  <AlertTriangle size={18} /> {error}
                </div>
              ) : null}

              {plates.length > 0 ? (
                <div className="structure-plates">
                  <h3 style={{ fontSize: '1rem' }}>Planches de référence</h3>
                  {plates.map((plate) => (
                    <div key={plate.id} className="structure-plate">
                      <img src={curatedThumbUrl(plate)} alt={plate.title} loading="lazy" />
                      <div className="structure-plate-meta">
                        <strong>{plate.title}</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={busy !== null}
                          onClick={() => void onDraw(plate.id)}
                        >
                          {busy === plate.id ? (
                            <Loader2 className="spin" size={16} />
                          ) : (
                            <Pencil size={16} />
                          )}
                          Dessiner cette planche
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="faint">Aucune planche 2D vérifiée pour l’instant.</p>
              )}
            </div>
            <div className="modal-footer">
              {has3d ? (
                <button type="button" className="btn" onClick={() => viewStructureIn3d(structure.id)}>
                  <Box size={17} /> Voir en 3D
                </button>
              ) : null}
              {hasQuiz ? (
                <button type="button" className="btn" onClick={() => reviewStructure(structure.id)}>
                  <GraduationCap size={17} /> Réviser
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
