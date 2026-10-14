import { useRef, useState } from 'react';
import { Alert, Box, IconButton } from '@mui/material';
import { BookOpen, Box as BoxIcon, Compass, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { navigate } from '../app/router';
import { ConfirmDialog } from '../components/ui/Modal';
import ActivityCard from '../features/home/components/ActivityCard';
import DrawingThumbnail from '../features/home/components/DrawingThumbnail';
import HomeHero from '../features/home/components/HomeHero';
import SuggestedModels from '../features/home/components/SuggestedModels';
import { useHomeProjects } from '../features/home/hooks/useHomeProjects';
import { curatedItems, materializeCuratedAsset } from '../features/library/services/curatedCatalog';
import { startProjectWithCurated, startProjectWithFile } from '../features/library/services/startDrawing';
import { saveProject } from '../features/projects/projectRepository';
import { createBlankProject, type DrawingProject } from '../features/projects/types';
import '../styles/home.css';

export default function HomePage() {
  const { projects, loading, removeProject } = useHomeProjects();
  const [busyModel, setBusyModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<DrawingProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const last = projects[0] ?? null;

  const startBlank = async () => {
    try {
      const project = createBlankProject('Le croquis d’Eva');
      await saveProject(project);
      navigate(`/atelier/${project.id}`);
    } catch {
      setError('Le dessin ne peut pas être enregistré pour le moment.');
    }
  };

  const startCurated = async (id: string) => {
    const item = curatedItems.find((candidate) => candidate.id === id);
    if (!item) return;
    setBusyModel(id);
    setError(null);
    try {
      await startProjectWithCurated({ materialize: () => materializeCuratedAsset(item) });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Le modèle n’a pas pu être ouvert.');
      setBusyModel(null);
    }
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await startProjectWithFile(file);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import impossible.');
    }
  };

  return (
    <Box className="page home-page">
      <HomeHero
        lastProject={last}
        drawingCount={projects.length}
        onStart={() => void startBlank()}
        onContinue={() => last && navigate(`/atelier/${last.id}`)}
        onImport={() => fileInputRef.current?.click()}
      />

      {error ? <Alert severity="error" sx={{ my: 2 }}>{error}</Alert> : null}

      <section className="home-section home-activities">
        <div className="home-section-head">
          <h2>Choisis ton moment <span aria-hidden>✨</span></h2>
          <p>Un croquis rapide, une exploration ou quelques questions pour te remettre dans le bain.</p>
        </div>
        <div className="activity-grid">
          <ActivityCard index={0} title="Explorer le corps" description="Choisir une région et découvrir ses structures." icon={Compass} tone="rose" onClick={() => navigate('/explorer')} />
          <ActivityCard index={1} title="Voir en 3D" description="Faire tourner le cœur, le crâne, le cerveau ou les poumons." icon={BoxIcon} tone="lilac" onClick={() => navigate('/modeles3d')} />
          <ActivityCard index={2} title="Quiz express" description="Quelques questions pour réviser en t’amusant." icon={GraduationCap} tone="peach" onClick={() => navigate('/quiz')} />
          <ActivityCard index={3} title="Bibliothèque" description="Toutes les planches, prêtes à être dessinées." icon={BookOpen} tone="sky" onClick={() => navigate('/bibliotheque')} />
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>Une idée pour commencer <span aria-hidden>💡</span></h2>
          <p>Touche une planche : elle s’ouvre directement dans ton atelier.</p>
        </div>
        <SuggestedModels busyId={busyModel} onSelect={(id) => void startCurated(id)} />
      </section>

      {!loading ? (
        <section className="home-section">
          <div className="home-section-head">
            <h2>Mes dessins <span aria-hidden>🎨</span></h2>
            <p>{projects.length > 0 ? 'Ta galerie personnelle, enregistrée sur cet iPad.' : 'Ta galerie est encore vide — à toi de jouer !'}</p>
          </div>
          <ul className="gallery-grid">
            <li className="rise" style={{ ['--i' as string]: 6 }}>
              <button className="gallery-new" onClick={() => void startBlank()} aria-label="Nouveau dessin">
                <Plus size={34} aria-hidden />
                <span>Nouveau</span>
              </button>
            </li>
            {projects.map((project, index) => (
              <li key={project.id} className="gallery-item rise" style={{ ['--i' as string]: 7 + index }}>
                <button className="gallery-open" onClick={() => navigate(`/atelier/${project.id}`)}>
                  <span className="gallery-thumb">
                    <DrawingThumbnail project={project} />
                  </span>
                  <span className="gallery-meta">
                    <strong>{project.name}</strong>
                    <small>{new Date(project.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {project.strokes.length} trait{project.strokes.length > 1 ? 's' : ''}</small>
                  </span>
                </button>
                <IconButton className="gallery-delete" size="small" onClick={() => setToDelete(project)} aria-label={`Supprimer « ${project.name} »`}>
                  <Trash2 size={16} />
                </IconButton>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => { void importFile(event.target.files?.[0]); event.target.value = ''; }} />

      {toDelete ? (
        <ConfirmDialog
          title={`Supprimer « ${toDelete.name} » ?`}
          message="Le dessin sera définitivement supprimé de cet iPad."
          confirmLabel="Supprimer"
          danger
          onConfirm={async () => { await removeProject(toDelete); setToDelete(null); }}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
    </Box>
  );
}
