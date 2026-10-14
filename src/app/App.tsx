import { lazy, Suspense, useLayoutEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import HomePage from '../pages/HomePage';

const LibraryPage = lazy(() => import('../pages/LibraryPage'));
const DrawingPage = lazy(() => import('../pages/DrawingPage'));
const ExploreBodyPage = lazy(() => import('../features/anatomy/pages/ExploreBodyPage'));
const QuizPage = lazy(() => import('../features/quiz/pages/QuizPage'));
const Anatomy3DPage = lazy(() => import('../features/anatomy3d/pages/Anatomy3DPage'));
const Anatomy3DCatalogPage = lazy(
  () => import('../features/anatomy3d/pages/Anatomy3DCatalogPage'),
);

export default function App() {
  const location = useLocation();
  return (
    <Suspense fallback={<div className="page loading-row">Ouverture…</div>}>
      {/* La clé relance l'animation d'entrée à chaque changement de page. */}
      <div key={location.pathname} className="page-enter">
      <ScrollToTop />
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/bibliotheque" element={<LibraryPage />} />
        <Route path="/atelier/:projectId" element={<DrawingRoute />} />
        <Route path="/explorer" element={<ExploreBodyPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/structure/:structureId" element={<QuizRoute />} />
        <Route path="/modeles3d" element={<Anatomy3DCatalogPage />} />
        <Route path="/modeles3d/:assetId" element={<Viewer3dRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </Suspense>
  );
}

/** Monté avec chaque page (clé = chemin) : la page s'ouvre en haut, une fois chargée. */
function ScrollToTop() {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return null;
}

function DrawingRoute() {
  const { projectId = '' } = useParams();
  return <DrawingPage projectId={projectId} />;
}

function QuizRoute() {
  const { structureId } = useParams();
  return <QuizPage structureId={structureId} />;
}

function Viewer3dRoute() {
  const { assetId = '' } = useParams();
  return <Anatomy3DPage assetId={assetId} />;
}
