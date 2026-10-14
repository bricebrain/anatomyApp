# Audit d'intégration Human-Atlas — Phase 0

**Date :** 15 octobre 2026
**Révision amont auditée :** `slorksmo/Human-Atlas` @ `5bb5713aab18d7fe9380c3339eb09f173491ea06` (2026-09-06, « fixed commit »)
**Clone de travail :** `vendor/human-atlas-upstream/` (gitignored — jamais importé dans `src/`)
**Statut :** audit terminé avant tout code hôte, conformément au cahier technique §3.

---

## 1. Arborescence réelle de l'application hôte

PWA React 18.3.1 + Vite 5.4 + TypeScript 5.6 (strict), react-router-dom v7 en `HashRouter`,
MUI v5 + CSS global par domaine, TanStack Query v5, Dexie 4 (base `carnet-anatomie` :
`projects`, `assets`, `files`, `quizResults`), `@google/model-viewer` pour 4 GLB unitaires.

```text
src/
  app/            App.tsx (routes lazy), router.tsx (navigate() hash global), theme.ts (MUI)
  pages/          HomePage, LibraryPage, DrawingPage (atelier Canvas 2D)
  components/ui/  Modal, ConfirmDialog, Celebrate
  features/
    home/         ActivityCard, SuggestedModels, useHomeProjects (React Query)
    drawing/      DrawingSurface (2 canvas, Pointer Events, pression stylet),
                  DrawingToolbar, ModelPanel, ComparisonView ;
                  engine/ (coordinates, strokes, render, pointerInput, history, exportImage)
    projects/     db.ts (Dexie), projectRepository.ts, types.ts (DrawingProject)
    library/      curatedCatalog, CommonsImageProvider, imageImport, startDrawing
    anatomy/      RÉFÉRENTIEL (14 structures), structures.ts, assets3d.ts,
                  ExploreBodyPage, AnatomyStructureCard, startDrawingFromStructure
    quiz/         questions.ts (15 vérifiées), skeletonSchematic (SVG hotspots), QuizPage
    anatomy3d/    Anatomy3DViewer (encapsule model-viewer), snapshotToDrawing, catalogues
public/           anatomy/ (planches + catalog.json), anatomy3d/ (4 GLB), icons/, sw.js
```

Routes existantes : `/`, `/bibliotheque`, `/atelier/:projectId`, `/explorer`, `/quiz`,
`/modeles3d`, `/modeles3d/:assetId`. Aucun `three` dans les dépendances hôte.

## 2. Environnement et commandes testées sur le clone amont

| Élément | Résultat |
|---|---|
| Node local | v24.13.0 (amont exige ≥ 22.13) ✓ ; npm 11.5.1 |
| Clone | `git clone --depth 1` → SHA `5bb5713aab18d7fe9380c3339eb09f173491ea06` |
| `npm ci` | ✓ |
| `npm run check` (tsc --noEmit) | ✓ sans erreur |
| `node scripts/validate-atlas.mjs` | ✓ « 2234 meshes, 3432 concept mappings, 2 288 268 triangles, every binary buffer » |
| `node scripts/validate-atlas.mjs atlas-female.json` | ✓ « 1220 meshes, 1439 concepts, 2 765 488 triangles » |
| `node scripts/validate-interactions.mjs` | ✓ packing desktop/mobile, contrats recherche/inspection, tap/drag/multitouch/annulation |
| `npm run build` (Vite 8) | ✓ 3,28 s |
| `npm run dev` (port 3016) | ✓ HTML servi ; `GET /models/atlas.json` → 200 (1 335 285 o) ; `GET /models/body-0.bin.gz` → 200 (2 283 403 o) |

## 3. Modules amont réellement responsables (lecture intégrale du code)

| Responsabilité | Fichier amont | Contenu vérifié |
|---|---|---|
| Types + systèmes + crédits | `app/anatomy.ts` (385 l.) | `SystemId` (19), `SYSTEMS` (couleur + description), `EDITIONS` (♂ BodyParts3D 4.0 / ♀ HRA v1.10 : crédits, licence, limites, `hidden`), `DEFAULT_VISIBLE`, `EXPLANATIONS` (~300 entrées EN), `SceneState`, `explanation()` avec repli laterality/prefixe (`shared`, `qualified`) |
| Manifestes | `public/models/atlas.json`, `atlas-female.json` | `{version, sex, parts[], concepts[], chunks[], triangles}` ; `Part = {id FJ####, name, conceptId FMA####, system, chunk, positions/normals/indices (offsets octets), vertexCount, indexCount, bounds}` ; `Concept = {id FMA, name, elements[partIds]}` ; `chunks = {url, bytes, gzip?, gzipBytes?}` |
| Scène 3D | `app/scene.tsx` (134 l. condensées) | 1 seul `useEffect` + refs (compatible React 18) ; `WebGLRenderer` (pixelRatio plafonné 1,5 mobile / 2 desktop), caméra fov 34, `OrbitControls` damping ; PMREM `RoomEnvironment` ; lumières hémisphérique + 2 directionnelles + sol/plateau/anneaux décor |
| Chargement chunks | `scene.tsx` + `app/model-download.ts` | préférence `.gz` si `DecompressionStream` ; 3 workers parallèles (`cursor`) ; `decodeModelResponse` détecte la signature gzip (hébergement pouvant servir `Content-Encoding`) et valide `byteLength === chunk.bytes` ; `AbortController` |
| Géométrie & batching | `scene.tsx` | par part : position Float32, **normales Int16 normalisées**, index Uint32, attribut `partIndex` ; `mergeGeometries` par système → 1 mesh par système (≤ 19 draw calls) |
| Visibilité/couleur/sélection | `scene.tsx` (`materialFor`) | 2 `DataTexture` (état part : offset xyz + visible w ; sélection) injectées via `onBeforeCompile` ; `discard` si invisible ; teinte verte de sélection ; matériau peau semi-transparent (opacity 0,1) uniquement pour `integumentary` — **le reste est opaque** (conforme au mode A du cahier) |
| Picking | `scene.tsx` + `app/pointer-tap.ts` | `PointerTap` distingue tap/drag/pinch/annulation (seuil 12 px tactile) ; raycast sur meshes pickers non fusionnés + pré-test boîte englobante ; peau ignorée si organes solides visibles ; vue éclatée > 0,45 → cibles 2D projetées (`findTarget`) |
| Isolation / focus | `scene.tsx` | boîte englobante de la sélection + `camera.setViewOffset` réservant l'espace de l'inspecteur (référence aux classes `.detail-sheet`/`.identity` → à adapter) |
| Éclaté | `scene.tsx` + `app/explosion-layout.ts` | amortissement `damp` ; phase radiale par système < 0,45 puis grille packée (`createExplosionLayout`) |
| UI coquille | `app/page.tsx` (65 l.) | sélecteur ♂/♀, panneau systèmes (presets Tout/Squelette/Organes + switches + compteurs), combobox concepts (80 résultats, `fold()`), vues ¾/face/côté/dos, rotation auto, curseur éclaté, sheet détail (explication, membres, isolation), sheet crédits, chargement/erreur |
| i18n | `app/i18n.ts`, `anatomy-ar.ts`, `terms-ar.json` | EN/AR avec `term()`/`translated()` — **pattern à répliquer pour le FR** (vocabulaire curatéd + repli EN honnête) |
| Non portés | `agent-tools.ts` (WebMCP), `anatomy-ar.ts`, `explanations-ar.ts`, `terms-ar.json`, `components/ui/*` (shadcn), `hooks/use-mobile.ts`, AR | hors périmètre FR / remplacés par MUI hôte |

**Aucune capture d'image amont** : ni `toBlob` ni `toDataURL` — « Dessiner cette vue » sera
développée côté hôte (rendu explicite puis lecture, cf. cahier §7).

## 4. Assets nécessaires, tailles et licences

| Fichier | Taille | Licence |
|---|---:|---|
| `public/models/atlas.json` | 1,3 Mo | données CC BY 4.0 (BodyParts3D/DBCLS) |
| `public/models/atlas-female.json` | 0,6 Mo | données CC BY 4.0 (HRA/Browne & Schlehlein + compléments) |
| `body-0..14.bin.gz` (♂) | 15 × ~2,2 Mo ≈ 33 Mo | CC BY 4.0 |
| `female-0..14.bin.gz` (♀) | 15 × ~2,2 Mo ≈ 34 Mo | CC BY 4.0 |
| `.bin` non compressés | 113 Mo | **non copiés** (le loader préfère `.gz`) |
| Code porté (`anatomy.ts`, `scene.tsx`, `pointer-tap.ts`, `explosion-layout.ts`, `model-download.ts`) | ~40 Ko | **MIT** © 2026 ashemag |

`public/ATTRIBUTION.md` amont (73 l.) vérifié : ♂ BodyParts3D 4.0 © DBCLS CC BY 4.0
(mm→m, Z-up→Y-up, simplification meshopt 0,2 %, normales quantifiées) ; ♀ HRA v1.10
(Visible Human Dataset), 180 os empruntés du ♂ (système `borrowed`, distinct, off par défaut),
76 muscles de jambe d'une seconde donatrice (Andreassen et al. 2023, système `donor-muscle`,
off par défaut), 8 structures pelviennes reprises de la v1.5. Une copie adaptée de ce
fichier accompagnera les données dans le dépôt hôte.

## 5. Compatibilité des versions et méthode retenue

| | Hôte | Amont | Verdict |
|---|---|---|---|
| React | 18.3.1 | 19.2.6 | `scene.tsx` n'utilise qu'`useEffect`/`useRef`/JSX — **port direct sous React 18** ; la coquille shadcn/RSC n'est PAS portée, remplacée par l'UI hôte |
| three | absent de package.json, **mais 0.183.2 déjà présent** (peer auto-installé de `@google/model-viewer` 4.4, qui exige `^0.183.0`) | ^0.159.0 | voir « Ajustement de version » ci-dessous |
| Vite | 5.4 | 8.0 | aucun outil de build amont réutilisé ; imports `three/examples/jsm/...` fonctionnent sous Vite 5 |
| TS | 5.6 | 5.9 | types amont compatibles ; `DecompressionStream` typé via lib DOM récente — à vérifier au typecheck |
| Node | requis pour dev hôte uniquement | ≥ 22.13 (validation amont) | local v24.13 ✓ |

**Méthode retenue : port du sous-système atlas en module isolé** (`src/features/anatomy/atlas/engine/`)
avec en-têtes MIT conservées, données copiées telles quelles dans `public/models/`
(chemins identiques → loader inchangé), UI française construite avec les composants hôte
(MUI + classes existantes), capture WebGL développée côté hôte.

**Alternatives écartées :**
- *iframe de la démo* — bloquée par le cahier (pas d'état partagé, pas de capture propre) ;
- *npm dependency sur le dépôt amont* — non publié sous forme de paquet, RSC/shadcn intriqués ;
- *fork complet maintenu* — coût de maintenance injustifié pour un sous-système de ~150 lignes effectives ;
- *réécriture naïve en 2 234 `Mesh` React* — détruirait le batching GPU et le picking optimisés (interdit §0).

## 6. Risques identifiés et réponses

- **Poids des données** : 67 Mo `.gz` au total pour les deux corps, commités sur décision
  explicite ; le service worker hôte exclura `/models/` (pas de précâchage, §11 du cahier).
- **Capture WebGL Safari** : aucune API amont ; stratégie « rendu explicite + lecture
  immédiate dans la même tâche », avec repli offscreen (`WebGLRenderTarget`) si nécessaire ;
  testée au navigateur, à revalider sur iPad.
- **`DecompressionStream`** : Safari 16.4+ / Chrome 80+ — cible PWA iPad moderne OK ;
  le loader retombe sur `.bin` non compressé sinon (non distribué chez nous : message d'erreur clair).
- **Classes CSS référencées par `scene.tsx`** (`.detail-sheet`, `.identity`, `.part-hover`) :
  l'adaptation hôte remplacera ces sélecteurs par des valeurs passées en props.
- **Performances iPad** : pixelRatio plafonné, ≤ 19 draw calls, textures d'état — à valider
  sur appareil réel (jamais prétendu testé sans appareil).

## 7. Décision

Le port est **réalisable sans modifier les versions React/Vite de l'hôte** et sans toucher
aux optimisations amont (batching, picking, amortissement). Passage en Phase 1 :
dépendances + assets, port du moteur, route `/atlas3d`.

### Ajustement de version three (constat fait à l'installation, Phase 1)

La tentative d'installer `three@^0.159` échoue sur un conflit de dépendance paire :
`@google/model-viewer@4.4.0` (viewer GLB existant de l'app) exige `three@^0.183.0`, et
`three@0.183.2` était déjà effectivement présent dans `node_modules` et donc dans le bundle
de production. Pour ne ni dupliquer la bibliothèque ni risquer le viewer existant,
l'hôte utilise **une instance unique `three@0.183.2`** (`dependencies`) avec
`@types/three@0.183` (`devDependencies`), et le moteur porté est adapté de 0.159 → 0.183.
L'écart d'API est nul sur les surfaces utilisées (WebGLRenderer, DataTexture,
onBeforeCompile sur includes stables, OrbitControls, RoomEnvironment, mergeGeometries,
Raycaster, MathUtils) ; la compatibilité est validée par `tsc --noEmit`, la suite de tests
et un smoke test navigateur, et restera à confirmer sur iPad.
