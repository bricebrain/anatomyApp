# Cahier technique — Intégration Human-Atlas et catalogue anatomique 3D

**Version :** 1.0 — 15 octobre 2026
**Destinataire :** GLM, agent chargé de développer dans le dépôt React existant
**Nature :** spécification technique d'implémentation, incrémentale et vérifiable
**Plateforme prioritaire :** iPad / Safari / application web (PWA éventuelle)
**Langue UI :** français
**Statut :** à développer ; ce document ne prétend pas que le projet existant ni les modèles ont déjà été intégrés.

---

## 0. MISSION IMPÉRATIVE À GLM

**Ne crée pas une nouvelle application.** Travaille dans le dépôt *actuel* du carnet d'anatomie, dont les modules suivants sont déjà opérationnels :

- bibliothèque de planches et import d'illustrations 2D ;
- atelier de dessin Canvas au stylet sur iPad ;
- calque, couleurs, gomme, opacité et comparaison ;
- sauvegarde des projets (stockage local) et export ;
- première version du visualiseur 3D et éventuels quiz.

### But de cette extension

1. **Intégrer réellement** le moteur et les données du projet open source [Human-Atlas](https://github.com/slorksmo/Human-Atlas) dans l'application existante, **sans iframe comme solution finale**.
2. Donner accès à un **corps humain 3D interactif**, à ses différents systèmes et à **des milliers de structures anatomiques nommées et sélectionnables**, selon la couverture réelle de la source.
3. Améliorer le rendu : **surfaces opaques**, couleurs anatomiques/pédagogiques, éclairage lisible, mise en évidence des structures, transparence **uniquement à la demande**.
4. Relier les structures sélectionnées à **« Dessiner cette vue »**, au **catalogue d'exercices** et aux **quiz anatomiques** existants.
5. Préparer une architecture de **sources multiples** : Human-Atlas (prioritaire), Human Reference Atlas / HuBMAP (GLB supplémentaires), NIH 3D (modèles choisis), Z-Anatomy (option avancée sous réserve d'audit des licences).
6. Livrer de vrais parcours testables sur l'iPad cible, et pas uniquement une démonstration desktop.

### Contraintes absolues

- Inspecter **le code existant** avant toute modification. Préserver toutes ses fonctionnalités, routes, styles, données utilisateur et sauvegardes ; aucune migration destructrice.
- **Cloner et lire le dépôt Human-Atlas à une révision déterminée** ; ne pas coder sur la base de suppositions concernant ses fichiers internes.
- **Réutiliser les optimisations de son moteur**, sa sélection/picking, ses identifiants et ses fichiers anatomiques déjà préparés si leurs conditions de redistribution sont respectées. Ne pas recréer naïvement 3 000 `Mesh` React séparés si le code actuel utilise des géométries regroupées avec sélection GPU.
- Ne pas supposer que la géométrie Human-Atlas est constituée de GLB individuels : son README indique **des chunks binaires et un manifeste préparé par scripts**.
- Ne pas changer arbitrairement les dépendances React/Three/Vite de l'application hôte pour correspondre au dépôt tiers : faire une **analyse des versions et compatibilités** avant toute intégration.
- Respecter les **licences propres à chaque modèle** et afficher l'attribution ; **MIT pour le code Human-Atlas ≠ licence des données anatomiques (CC BY 4.0)**.
- Ne jamais convertir une image mal documentée en « domaine public » par défaut, ni fusionner des données de sources anatomiques distinctes comme si elles provenaient d'une même personne.
- Ne pas solliciter d'API payante, de serveur ou d'IA pour le runtime de cette extension.
- Reporter les vérifications qui exigent l'iPad physique si GLM n'a pas accès à cet appareil : ne jamais indiquer « testé Apple Pencil » à tort.

### Mode de travail

Implémenter par **jalons vérifiables** : audit → démo isolée fonctionnelle → intégration du corps 3D → catalogue et sélection → dessin/quiz → autres sources → optimisation. À la fin de chaque phase, montrer ce qui fonctionne, les fichiers modifiés, la preuve de build et les limitations.

---

## 1. CONTEXTE ET PROBLÈMES ACTUELS

L'utilisatrice souhaite **apprendre l'anatomie en dessinant**, pour le plaisir et la mémorisation. La première version de l'application lui permet déjà d'importer des planches et de les reproduire sur iPad.

**Problèmes observés dans la première bibliothèque 3D :**

- trop peu de modèles/organe disponibles ;
- aspect **transparent**, peu coloré, peu lisible ;
- absence de véritable **exploration d'un corps complet** avec sélection des structures ;
- lien entre « exploration 3D », « dessin » et « quiz » encore limité.

**Principe directeur :** passer d'une petite galerie d'objets 3D à un **atlas anatomique interactif** qui sert de référentiel aux exercices et à l'atelier.

### Expérience cible (iPad)

1. Ouvrir **Explorer le corps**.
2. Choisir *corps masculin* ou *corps féminin* ; comprendre que les couvertures diffèrent.
3. Afficher/masquer les systèmes : os, muscles, organes, nerfs, vaisseaux, etc., **selon la classification réellement disponible**.
4. Tourner le corps à 360°, pincer pour zoomer, toucher un élément pour le sélectionner.
5. Lire son nom, sa catégorie, une brève information vérifiable ; l'isoler, le colorer, recentrer la caméra.
6. Appuyer sur **Dessiner cette vue** : obtenir une image 2D de l'angle choisi dans **l'atelier de dessin déjà existant**.
7. Appuyer sur **Réviser cet élément** : ouvrir un quiz alimenté par le même identifiant anatomique, uniquement si le quiz possède les données nécessaires.
8. Revenir à l'atlas sans perdre le contexte de sélection.

---

## 2. RESSOURCES : CE QUI A ÉTÉ VÉRIFIÉ

### 2.1 Human-Atlas — fournisseur prioritaire et moteur à adapter

- Dépôt : https://github.com/slorksmo/Human-Atlas
- Démonstration : https://atlas.taim.best
- Stack annoncée : React, TypeScript, Three.js, composants shadcn ; application statique sans backend.
- Licence du **code** : MIT (`LICENSE` du dépôt).
- Licence annoncée pour les **données anatomiques distribuées par ce projet** : CC BY 4.0, avec détails dans `public/ATTRIBUTION.md`.
- Fonctionnalités déjà présentes dans le projet d'origine : deux corps de référence, recherche, systèmes activables, sélection/isolation, mode éclaté (« explode »), caméra 3D, informations sur les structures.

**Chiffres annoncés dans le README consulté le 15/10/2026 (non contractuels si le dépôt évolue) :**

| Corps | Origine | Maillages/structures | Concepts nommés | Systèmes | Téléchargement géométrie |
|---|---|---:|---:|---:|---:|
| Référence masculine | BodyParts3D 4.0 | 2 234 | 3 432 | 15 | ~34 Mo |
| Référence féminine | HRA v1.10 + éléments complémentaires | 1 220 | 1 439 | 18 | ~37 Mo |

**Attention :** « 3 432 concepts » ne signifie pas « 3 432 fichiers GLB téléchargeables ». Un concept peut regrouper plusieurs maillages, et un maillage possède un identifiant/source distinct. Ne pas inventer une équivalence 1:1.

La référence féminine provient d'autres données et **n'est pas aussi complète que le modèle masculin**. Elle contient en particulier des ajouts de muscles de jambe provenant d'un autre sujet et des os masculins ajustés pour pallier certains manques. Conserver ces distinctions visibles dans l'interface et dans les crédits.

**Particularité technique à conserver :** la géométrie est regroupée en lots et pilotée par données GPU par structure pour les positions, la visibilité et la sélection ; une géométrie dédiée permet le picking. Le README indique que les fichiers optimisés pour le navigateur sont **déjà inclus** ; la reconstruction depuis OBJ/GLB/STL ne doit donc pas être le point de départ.

**Commandes documentées pour explorer la copie du dépôt :**

```bash
# Dans un dossier de travail distinct du projet hôte
# Épingler ensuite le SHA testé.
git clone https://github.com/slorksmo/Human-Atlas.git human-atlas-upstream
cd human-atlas-upstream
git rev-parse HEAD
# Le README indique Node >= 22.13.
npm ci
npm run dev
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-atlas.mjs atlas-female.json
node scripts/validate-interactions.mjs
npm run build
```

Il faut **adapter** ces commandes à la révision réellement clonée ; elles sont issues du README consulté. Préserver le SHA de la révision choisie dans `docs/third-party-sources.md`.

### 2.2 Human Reference Atlas — apport de GLB complémentaires

- Portail : https://humanatlas.io/3d-reference-library
- Licence des objets de référence publiés dans cette collection : CC BY 4.0 (confirmer sur la page/manifest de chaque release).
- Modèles par organe au format **GLB**, avec structures parfois identifiées par ontologies médicales (UBERON, FMA).
- À privilégier pour **enrichir le catalogue en organes individuels**, sans re-télécharger le corps féminin complet déjà issu de cette source.
- Ne pas inventer d'URL ou d'API : utiliser les liens de la release officielle et des manifestes confirmés. Les chemins vers des versions de GLB peuvent changer.

**Ne pas confondre** « HRA ensemble de corps de référence » et « HRA catalogue d'organes ». Ils peuvent partager des organes ; ils doivent être dédupliqués **dans l'UI**, mais l'origine reste attachée à chaque modèle.

### 2.3 NIH 3D — supplément manuel

- Catalogue : https://3d.nih.gov/
- Les modèles sont soumis à des **licences définies par les déposants** : certaines entrées sont Public Domain ou CC, d'autres ont des restrictions.
- Pour ce projet, n'importer **manuellement** qu'une poignée de modèles dont licence, téléchargement et attribution ont été contrôlés.
- **Aucun scraping massif** ni importation automatique supposée : on ne déclare pas « gratuit » ou « libre » tout le catalogue.

### 2.4 Z-Anatomy — option avancée, distincte

- Dépôt : https://github.com/Z-Anatomy/Models-of-human-anatomy
- Format principal du dépôt : **template/atlas pour Blender**, pas un service web de GLB prêt à consommer.
- Licence globale annoncée : **CC BY-SA 4.0** avec obligation de partage à l'identique pour les adaptations concernées.
- Certains éléments tiers explicitement listés sont sous **CC BY-NC**, **CC BY-NC-SA** ou autres conditions : **audit par objet obligatoire** avant export et redistribution.
- Ne jamais empaqueter aveuglément `Z-Anatomy.zip` dans la PWA.
- À traiter comme **source de modèles particuliers difficiles à trouver**, via pipeline Blender → GLB optimisé, après audit des droits ; pas une dépendance principale pour ce jalon.

### Tableau de stratégie de source

| Source | Type d'intégration | Priorité | Vérification critique |
|---|---|---|---|
| Human-Atlas | Moteur et données navigateur existants | **P0** | Licence de données, structure du runtime, performances iPad |
| HRA | Quelques GLB unitaires curatés | **P1** | Licence release, structure/identifiants, taille |
| NIH 3D | Sélection manuelle de modèles | **P2** | Licence **par entrée**, qualité et provenance |
| Z-Anatomy | Exports Blender préparés | **P3** | CC BY-SA + **licences tierces**, géométrie et taille |

---

## 3. PHASE D'AUDIT TECHNIQUE — OBLIGATOIRE AVANT CODAGE

GLM doit produire `docs/human-atlas-integration-audit.md` avec :

1. Arborescence **réelle** de l'application existante ; entrypoint, routes, React/Three/Vite, moteur 3D déjà présent, moteur 2D, IndexedDB.
2. Révision SHA du clone Human-Atlas, environnement Node et commandes testées.
3. Repérage dans la source amont des modules réellement responsables de :
   - chargement du manifeste des deux corps ;
   - lecture des chunks binaires et leur compression éventuelle ;
   - création/rendu du moteur Three.js ;
   - regroupement des géométries, matériaux, couleurs et sélection ;
   - raycast/picking ;
   - systèmes, concepts, noms, descriptions et recherche ;
   - commandes de rotation, zoom, focus/isolation/explode ;
   - gestion des ressources et destruction du renderer.
4. Fichiers source **et** assets nécessaires avec tailles et licences.
5. Versions réellement compatibles entre projet hôte et dépôt amont (notamment React, Three, @types, imports, CSS). Ne pas remplacer React 18 par React 19 sans preuve de nécessité.
6. Méthode d'intégration retenue et alternatives écartées.
7. Premier rendu du dépôt amont en environnement de développement distinct ; **captures/test** disponibles.

**Livrable de cette phase :** documentation d'audit, sans toucher au comportement du dessin et sans intégrer un dépôt entier dans `src/` à l'aveugle.

### Décision d'intégration privilégiée

**Adapter/porter le sous-système d'atlas à un module isolé dans l'application hôte**, avec conservation des crédits. Cela permet la communication par props/callbacks et une UI en français harmonisée.

Pour le **spike** initial seulement, un iframe local ou un mini-site séparé peut aider à valider l'affichage, mais **ne constitue pas la livraison cible**, parce qu'il bloque une intégration propre au dessin, au quiz et à l'état global.

Si l'amont ne permet pas un port raisonnable, proposer une deuxième option documentée : **fork maintenu localement** ou module encapsulé avec interface événementielle. Présenter le coût de maintenance. Ne pas modifier le comportement utilisateur existant pour forcer cette décision.

---

## 4. ARCHITECTURE CIBLE

L'extension doit créer une abstraction **AtlasProvider** commune, plutôt qu'exposer directement les types amont partout dans l'application.

```text
Application React existante
├── Accueil
├── Bibliothèque 2D (préservée)
├── Atelier de dessin Canvas (préservé)
├── Quiz anatomiques (si déjà présents)
└── Explorer 3D
    ├── BodySelector (référence masculine/féminine)
    ├── AnatomicalSystemFilters
    ├── AnatomySearch / StructureTree
    ├── AnatomyViewer3D
    │   ├── HumanAtlasRuntimeAdapter [P0]
    │   └── StandaloneGLBViewerAdapter [P1]
    ├── StructureDetails
    ├── AppearanceControls (opaque, pédagogique, transparence)
    └── Actions (Isoler, Dessiner cette vue, Réviser)

Domaine partagé
├── AnatomyCatalogService
├── AnatomyStructureResolver
├── LicenseAttributionService
├── DrawingReferenceExporter
└── QuizStructureAdapter

Données
├── Human-Atlas manifests/chunks déjà optimisés
├── GLB unitaires curatés HRA/NIH/Z-Anatomy
├── Catalogues de recherche et métadonnées FR
└── Références/licences/provenances
```

### Organisation indicative

```text
src/features/anatomy/
  domain/
    anatomy.types.ts
    anatomyCatalog.ts
    anatomyIdentity.ts
    licenses.ts
  providers/
    AtlasProvider.ts
    HumanAtlasProvider.ts
    GlbCatalogProvider.ts
  viewer/
    AnatomyExplorerPage.tsx
    AnatomyViewer3D.tsx
    HumanAtlasRuntimeAdapter.ts
    StandaloneGlbViewer.tsx
    CameraController.ts
    ViewerAppearanceControls.tsx
    useAnatomySelection.ts
  components/
    BodySelector.tsx
    SystemFilters.tsx
    StructureSearch.tsx
    StructureDetails.tsx
  integrations/
    exportViewToDrawing.ts
    openQuizForStructure.ts
    drawingReferenceRepository.ts
  data/
    anatomy-curated.fr.json
    anatomy-licenses.json
  tests/
    identity.test.ts
    catalog.test.ts
    attribution.test.ts
    exportView.test.ts
public/anatomy3d/
  human-atlas/  # fichiers réellement requis par le moteur adapté
  curated/      # GLB unitaires optimisés et leur manifeste
```

**Important :** cette arborescence est une proposition, pas une affirmation sur les chemins internes de Human-Atlas. Les noms finaux doivent suivre les conventions du dépôt hôte.

### Interfaces TypeScript proposées

```ts
export type AnatomyProviderId = 'human-atlas' | 'hra' | 'nih3d' | 'z-anatomy';

export type BodyVariant = 'male' | 'female' | 'unspecified';

export type AnatomyStructure = {
  id: string;                 // ex: 'human-atlas:male:<source-id>'
  provider: AnatomyProviderId;
  sourceId: string;           // identifiant amont non modifié
  conceptId?: string;         // identifiant de concept distinct du mesh si disponible
  ontologyIds?: { fma?: string; uberon?: string };
  label: string;              // libellé FR validé ou libellé source
  originalLabel: string;
  description?: string;
  systemId: string;
  parentId?: string;
  bodyVariant: BodyVariant;
  drawable: boolean;
  quizEligible: boolean;
  provenanceId: string;
};

export type AnatomyAsset = {
  id: string;
  provider: AnatomyProviderId;
  title: string;
  format: 'packed-atlas' | 'glb';
  urlOrManifestPath: string;
  structureIds: string[];
  bodyVariant: BodyVariant;
  approximateDownloadBytes?: number;
  provenanceId: string;
};

export type AnatomyProvenance = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  originalAuthors: string[];
  license: string;
  licenseUrl: string;
  upstreamRepository?: string;
  upstreamCommit?: string;
  version?: string;
  modifications: string[];
  supplementalSources?: string[];
  redistributionVerified: boolean;
};

export interface AtlasProvider {
  id: AnatomyProviderId;
  listAssets(): Promise<AnatomyAsset[]>;
  searchStructures(query: string, context?: {
    bodyVariant?: BodyVariant;
    systemIds?: string[];
  }): Promise<AnatomyStructure[]>;
  getStructure(id: string): Promise<AnatomyStructure | null>;
  getProvenance(id: string): Promise<AnatomyProvenance | null>;
}
```

**Précision importante :** `AtlasProvider` représente le **catalogue et l'identité**. Le renderer est séparé dans un `ViewerAdapter` parce que les fichiers Human-Atlas packed **ne se chargent pas avec `GLTFLoader`**, contrairement aux fichiers HRA `.glb`.

### Interface minimale du visualiseur

```ts
export type ViewerSelection = {
  structureId: string;
  sourceMeshIds: string[];
};

export type ViewerSnapshot = {
  image: Blob; // image PNG, réellement lisible et non tainted
  width: number;
  height: number;
  selectedStructureIds: string[];
  visibilityPreset: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    up: [number, number, number];
    projection: 'perspective' | 'orthographic';
  };
  provenanceIds: string[];
};

export interface AnatomyViewerHandle {
  focusStructure(id: string): void;
  isolateStructure(id: string): void;
  setSelection(ids: string[]): void;
  resetCamera(): void;
  exportSnapshot(): Promise<ViewerSnapshot>;
}
```

Implémentation concrète à ajuster selon le moteur Human-Atlas après audit. Ne pas prétendre que le dépôt amont exporte directement ces interfaces : **ce sont les contrats de l'adaptateur à créer**.

---

## 5. MODULE « EXPLORER LE CORPS » — FONCTIONNALITÉS

### 5.1 Affichage principal

- Afficher un **corps de référence opaque, coloré par système** ; fond clair, ombres discrètes, reliefs lisibles.
- Basculer masculin/féminin avec avertissement contextualisé des **différences de couverture et d'origine**.
- Rotation libre à 360° autour du modèle ; zoom et panoramique ; recentrer la caméra.
- Sur iPad : un doigt pour orbiter, pincement à deux doigts pour zoomer, geste de déplacement dédié pour pan ; tap bref pour sélectionner. Éviter de confondre un drag avec un tap.
- Boutons « face », « dos », « gauche », « droite », « recentrer » et « isoler » si techniquement justifié.
- Contrôle du chargement, progression des assets, affichage d'erreurs et de réessai.

### 5.2 Recherche et navigation

- Recherche en français pour les structures **explicitement traduites/validées** ; sinon afficher l'anglais + un alias français validé pour les 30–50 structures prioritaires.
- Éviter de générer des traductions anatomiques automatiques non vérifiées. Ne pas fusionner « ilium » et « ileum », ni les termes homonymes de systèmes différents.
- Recherche par noms source, identifiants, alias connus ; normalisation accents et casse.
- Arbre système → région → organe → structure, si les hiérarchies réelles le permettent.
- Filtres systèmes (os, muscles, cardiovasculaire, nerveux…), avec mappage explicite depuis les systèmes du fournisseur.
- Sélection : mise en évidence et info-bulle discrète, fiche de détail, actions **« Isoler »**, **« Dessiner »**, **« Réviser »**.
- Structures indisponibles pour un corps : état « non modélisé dans cette référence » ; ne pas afficher un faux organe.

### 5.3 Mode « Isoler » / modèle prêt à dessiner

- Choisir un organe ou un os ; masquer le contexte ou le mettre en gris atténué.
- Recadrer automatiquement la caméra sur l'objet sélectionné **sans modifier sa géométrie ni son échelle relative**.
- Laisser l'utilisatrice tourner librement cet élément, voir différentes faces, zoomer.
- Option « conserver les structures voisines » si utile (par exemple un muscle et l'os support).
- Retour au corps complet sans rechargement inutile.

### 5.4 Mode « éclaté » (option si repris de l'amont)

- Réutiliser le mode `explode` déjà existant dans Human-Atlas si stable sur iPad.
- Ne pas en faire une condition du premier jalon ; privilégier la sélection, la couleur, la fluidité et le dessin.

---

## 6. RENDU COULEUR, MATÉRIAUX ET TRANSPARENCE

Le problème actuel « tout semble transparent » doit être traité **à partir du moteur réel et des matériaux réels**, pas par l'ajout superficiel d'un `MeshStandardMaterial` à tous les enfants de la scène (ce qui risquerait de casser le rendu et le picking optimisés de Human-Atlas).

### 6.1 Diagnostic demandé

Inspecter dans le visualiseur **actuel** et dans le code amont :

- `material.transparent`, `opacity`, `depthWrite`, `depthTest`, blending ;
- présence d'un wireframe, backface culling, normals correctes ;
- textures de couleurs par structure, shader ou buffer d'attributs ;
- illumination et tone mapping ;
- effets de clipping, styles volontairement semi-transparents pour montrer les organes ;
- différence entre texture de couleur réelle et couleur pédagogique assignée par système.

### 6.2 Trois modes visuels (sans falsifier la source)

**A. Couleur pédagogique — mode par défaut (P0)**

- Squelette ivoire ; muscles rouge/brun ; nerfs jaune ; artères rouge, veines bleu ; organes selon une palette lisible et cohérente.
- Couleurs explicites, contrastées, **surfaces opaques** sauf demande contraire.
- Conserver les couleurs originales de Human-Atlas lorsqu'elles sont pertinentes ; palette override uniquement si nécessaire.
- Ne pas présenter ces couleurs comme des **textures photographiques authentiques**.

**B. Anatomique sobre (P1)**

- Rendu plus naturel **dans la limite des informations de surface disponibles** : valeurs moins saturées, éclairage doux et relief.
- Si les données ne contiennent ni texture ni détail microscopique, ne pas promettre du photoréalisme.

**C. Exploration interne (P1)**

- Contrôle de transparence **explicite**, par système ou structure, avec bouton reset.
- Préférer *masquer/isoler* aux grandes surfaces translucides superposées, qui peuvent provoquer des artefacts de rendu ou de performance.

### 6.3 Sélection

- Souligner visuellement l'objet touché (teinte, emissive ou contour léger adapté au moteur).
- Revenir à sa couleur initiale en désélectionnant.
- Ne pas modifier de façon permanente le buffer de couleurs partagées de milliers de structures ; restaurer l'état sans fuite mémoire.

---

## 7. INTÉGRATION AVEC L'ATELIER DE DESSIN 2D

**Fonction signature de l'application : « Dessiner cette vue ».** Elle doit fonctionner depuis le corps complet **et** depuis une structure isolée.

### Parcours détaillé

1. Sélectionner, par exemple, le **crâne**.
2. Cliquer sur **Isoler** ; tourner le crâne de trois quarts ; éventuellement choisir un mode de couleurs.
3. Appuyer sur **Dessiner cette vue**.
4. Produire une image **PNG du canvas WebGL réellement rendu**, sans UI, à la bonne résolution ; avec fond blanc/transparent selon l'option retenue.
5. Conserver en métadonnées : structure(s), source, licence, source d'origine, variante de corps, angle/projection de caméra et palette.
6. Créer un **nouveau projet** dans le moteur de dessin existant (ou demander explicitement si le projet courant doit être remplacé).
7. Insérer le PNG comme **modèle de référence verrouillé sous la couche des traits**.
8. Garder toutes les fonctionnalités déjà développées : transparence, calque, dessin de mémoire, comparaison, sauvegarde, export.
9. Proposer un bouton **« Revenir à la vue 3D »** en conservant la sélection/caméra si possible.

### Exigences pour la capture WebGL

- Ne pas se fier à `canvas.toDataURL()` sur un canvas WebGL dont le buffer a déjà été vidé par le navigateur.
- Préférer un **rendu explicite de capture** au moment de l'action, idéalement dans une cible/offscreen si l'architecture le permet ; ou déclencher un rendu avant capture avec stratégie vérifiée sur Safari.
- Éviter `preserveDrawingBuffer: true` en permanence si cela pénalise la performance ; l'évaluer uniquement si nécessaire.
- Exporter en Blob PNG, gérer les limites de résolution iPad et les erreurs mémoire.
- CORS : interdire les textures/images externes non autorisées susceptibles de contaminer le canvas ; privilégier assets hébergés sur le même domaine et contrôlés.
- Vérifier qu'aucun logo, libellé d'UI ou contrôle d'orbite ne figure dans la référence de dessin par erreur.
- **Ne jamais écraser un dessin existant** lors de ce transfert.

### Données persistées associées au projet

```ts
export type DrawingAnatomyReference = {
  kind: 'snapshot-3d';
  provider: AnatomyProviderId;
  assetId: string;
  selectedStructureIds: string[];
  bodyVariant: BodyVariant;
  snapshotBlobId: string; // IndexedDB ; ne pas sérialiser un Blob en localStorage
  camera: ViewerSnapshot['camera'];
  appearancePreset: string;
  provenanceIds: string[];
  createdAt: string;
};
```

**Migration :** ajouter ce champ en `optional` aux projets 2D existants, ne pas invalider leur lecture ni leurs sauvegardes. Si l'application utilise une autre structure IndexedDB, produire une migration compatible.

---

## 8. LIEN AVEC LES QUIZ ANATOMIQUES

Le quiz utilise les **identifiants de structures**, pas des noms affichés. L'outil 3D doit pouvoir devenir une source fiable de questions.

### Exemples de quiz

- **« Trouve l'humérus »** : sélectionner la bonne structure dans le modèle 3D (picking).
- **« Quel est cet élément ? »** : montrer une structure isolée sans son label ; proposer 3 ou 4 réponses compatibles et non ambiguës.
- **« À quel système appartient cette structure ? »** : reconnaître os / muscle / système cardiovasculaire selon les catégories curatées.
- **« Repère le cœur »** : afficher le corps et demander de toucher l'organe, avec les systèmes nécessaires visibles.

### Prérequis de qualité

- Ensemble de questions **curatées**, initialement 20–30, à partir de structures bien identifiables ; ne pas générer des distracteurs absurdes ou des réponses non disponibles dans la référence.
- Définir `quizEligible = false` pour les structures non fiables ou non sélectionnables.
- Vérifier la capacité à sélectionner correctement **un concept regroupant plusieurs maillages**.
- Corriger les différences droite/gauche, sexes, niveaux hiérarchiques.
- Le quiz doit pouvoir masquer l'étiquette au moment de la question sans supprimer l'identifiant.
- Ne pas produire de conseil médical.

### Contrat d'intégration illustratif

```ts
function openQuizForStructure(structure: AnatomyStructure): void {
  if (!structure.quizEligible) return;
  // Transmettre structure.id au module de quiz déjà présent ;
  // ne pas transmettre uniquement structure.label.
}
```

---

## 9. ENRICHISSEMENT MULTI-SOURCES — PIPELINE

### Objectif

Pouvoir ajouter un organe rare, un modèle mieux texturé ou une structure absente de Human-Atlas **sans modifier le moteur natif Human-Atlas**. Ce dernier reste la référence du corps complet ; les autres sources alimentent d'abord une **galerie de modèles indépendants**.

### Pipeline des modèles GLB unitaires

```text
Source officielle (HRA / entrée NIH / objet Z-Anatomy vérifié)
  -> revue licence et attribution + identification de la version
  -> téléchargement dans pipeline local/build (pas à chaque ouverture)
  -> inspection (glTF Validator, mesh, transforms, unités, axes, matériaux)
  -> optimisation (géométrie/textures, Draco ou Meshopt selon compatibilité)
  -> génération miniature + manifeste JSON
  -> hébergement statique dans /public/anatomy3d/curated ou stockage CDN
  -> catalogage sous un ID stable
  -> affichage dans un viewer GLB dédié
  -> action « Dessiner cette vue » (commune au moteur Human-Atlas)
```

### Règles

- Ne pas mélanger automatiquement les coordonnées d'un rein isolé HRA avec celles du corps Human-Atlas. Sans référentiel et transformation validés, le montrer en **viewer autonome**.
- Vérifier les unités (`mm`/`m`), l'orientation et la position de caméra.
- Conserver hiérarchie, `name` et `extras` des GLB lorsque nécessaires à la sélection.
- Optimiser progressivement, mesurer le gain, ne pas supprimer des sous-structures utiles aux quiz.
- Certaines scènes HRA ont des structures identifiées, d'autres modèles isolés n'ont qu'un seul mesh ; les quiz multi-zones ne seront disponibles que lorsque la segmentation est réelle.
- Interdire l'import automatique d'un modèle dont licence ou auteur sont introuvables.

### Catalogue de démonstration recommandé

Partir de **10–15 sujets diversifiés**, par exemple : cœur, cerveau, crâne, humérus, fémur, bassin, colonne vertébrale, main, poumons, reins, foie, estomac, muscles du bras (si disponible), genou, mandibule.

Ce sont des **objectifs de couverture**, pas la promesse que chaque source fournit déjà un modèle utilisable pour chacun : vérifier la présence et l'origine avant affichage.

### Dédoublonnage

Un concept anatomique peut disposer :

- d'un modèle segmenté dans le corps Human-Atlas ;
- d'un objet individuel HRA ;
- d'un objet texturé NIH 3D ;
- d'une planche 2D dans le catalogue actuel.

Regrouper ces options dans la fiche : **« Voir en 3D dans le corps » / « Voir un autre modèle 3D » / « Dessiner un modèle 2D »**, avec **provenance distincte**. Ne pas remplacer silencieusement un modèle par un autre.

---

## 10. LICENCES, CRÉDITS ET PROVENANCE — EXIGENCES BLOQUANTES

### Human-Atlas

- Conserver la notice de licence **MIT** pour le code repris/adapté.
- Conserver une copie traçable des attributions des modèles en **CC BY 4.0** et des adaptations via le fichier amont `public/ATTRIBUTION.md`.
- Fournir une vue **Sources et crédits** accessible depuis l'explorateur 3D et le catalogue.
- Conserver l'attribution dans les exports de vues/dessins lorsque l'image source est incorporée : au minimum crédits associés au projet et option d'export de notice `.txt` ou `.json` (plus une mention visible si nécessaire selon les conditions applicables).
- Ne pas présenter les corps masculin et féminin comme deux scans de référence comparables ni masquer les éléments empruntés.

### HRA

- CC BY 4.0 pour la collection officielle mentionnée ; consigner version, auteur, lien et modifications pour **chaque fichier** importé.

### NIH 3D

- **Licence par entrée**. En cas de licence inconnue/ambiguë : ne pas redistribuer le modèle ; demander validation manuelle.

### Z-Anatomy

- CC BY-SA 4.0 pour l'atlas dans son ensemble ; attention aux obligations de partage à l'identique des adaptations et aux fichiers tiers CC BY-NC / CC BY-NC-SA.
- Écarter de la redistribution tout objet dont les droits ne sont pas compatibles avec l'utilisation projetée.
- Ne pas appliquer automatiquement MIT ou CC BY à des données Z-Anatomy.

### Checklist de chaque ressource

- [ ] Page source officielle enregistrée.
- [ ] Auteur, licence, URL de licence renseignés.
- [ ] Version/date de téléchargement et SHA ou checksum si possible.
- [ ] Source géométrique originale et transformations documentées.
- [ ] Droit de redistribution du **fichier adapté** vérifié.
- [ ] Crédits visibles dans l'app et récupérables dans l'export.
- [ ] Structure/description validées pour un usage **éducatif**, sans revendication clinique.

---

## 11. PERFORMANCE IPAD ET GESTION MÉMOIRE

**Le corps Human-Atlas annoncé autour de 34–37 Mo par référence n'est pas un petit asset**. Le chargement de ces fichiers peut consommer beaucoup plus de mémoire GPU une fois décompressés. Ne jamais **précharger automatiquement les deux corps**.

### Exigences

- Lazy-load de la route **Explorer 3D** et de son code ; charger les données uniquement au besoin.
- Charger la variante sélectionnée, conserver l'autre non chargée par défaut ; libérer matériaux, buffers GPU, textures et listeners lors du changement quand nécessaire.
- Éviter le chargement simultané des deux corps sur iPad modeste ; mesurer avant d'autoriser le cache mémoire.
- Prévoir un vrai écran de chargement, possibilité d'annuler/quitter, fallback si WebGL est indisponible ou si le contexte est perdu.
- Préserver le rendu optimisé de Human-Atlas : batches, shader/texture par structure et picking adapté.
- Éviter le `setState` React à chaque frame ; la boucle de rendu 3D ne doit pas provoquer le rerender complet de l'interface.
- Résolution du renderer ajustée au `devicePixelRatio`, avec plafond configurable après mesures (par ex. 1,5–2 pour éviter le coût de 3× sans raison).
- Ne pas lancer des ombres dynamiques coûteuses sur toutes les structures si une lumière diffuse et directionnelle suffit.
- Supprimer les `ObjectURL` inutilisées ; gérer `dispose()`/destroy correctement.
- Les fichiers de **geometry atlas** importants ne doivent **pas** être précachés par défaut par le service worker ; cache explicite facultatif, versionné, avec budget/contrôle et indication de taille.
- En cas d'échec réseau ou hors mémoire, proposer un **modèle unitaire plus léger** ou la bibliothèque 2D.

### Mesures minimales à collecter

- Taille transfert initial ; temps jusqu'au premier affichage ; temps de sélection.
- FPS perçu pendant rotation/zoom sur iPad ; gel UI ou fermeture Safari.
- Réouverture, changement portrait/paysage, bascule entre corps et retour à l'atelier.
- Contexte WebGL perdu et gestion de reprise.
- Taille PNG/temps de capture et persistance dans IndexedDB.

Les budgets (ex. viser >= 30 FPS pendant l'interaction et une ouverture perçue acceptable sur l'iPad cible) sont des **objectifs de test**, pas une garantie. Documenter le modèle et la version iPadOS utilisés.

---

## 12. DÉCOUPAGE DES PHASES DE DÉVELOPPEMENT

### Phase 0 — Audit et test de Human-Atlas hors intégration

- Cloner, figer SHA, faire démarrer la démo amont et exécuter les scripts documentés.
- Identifier les sous-modules, assets, versions et clauses de redistribution.
- Comparer avec le visualiseur 3D de l'application actuelle.
- Choisir **port adapté / fork module** et documenter pourquoi.

**Terminé lorsque :** un rapport montre l'architecture réelle, les assets nécessaires, la compatibilité et un test fonctionnel de l'amont.

### Phase 1 — Intégration du corps 3D Human-Atlas

- Créer route/onglet **Explorer 3D** dans l'app actuelle.
- Faire fonctionner le corps masculin, en **couleurs opaques**, avec rotation et sélection.
- Faire fonctionner le corps féminin en deuxième temps ; mentionner sa couverture partielle.
- Préserver les sauvegardes et l'atelier existant ; pas d'écrasement d'écran.

**Terminé lorsque :** sur un navigateur de test, le corps se voit, tourne, se sélectionne, et les crédits sont accessibles.

### Phase 2 — Recherche, filtres et isolation

- Barre de recherche, filtres systèmes, hiérarchie si fournie.
- Panneau de détail de l'élément sélectionné, focus/isoler/revenir.
- Premiers noms FR curatés, anglais en fallback.
- Diagnostic et correction des transparences non voulues.

**Terminé lorsque :** cœur, crâne, humérus et fémur (si disponibles dans le corps choisi) sont accessibles à la recherche, isolables et colorés.

### Phase 3 — Intégration au dessin

- Vue/capture PNG WebGL propre.
- Transfert vers le modèle de référence de l'atelier 2D.
- Stockage de la provenance et de la caméra avec le nouveau projet.
- Comparaison et réouverture sans régression.

**Terminé lorsque :** un élément sélectionné est dessiné dans l'atelier puis récupéré après rechargement.

### Phase 4 — Quiz basés sur identifiants

- Réutiliser le quiz existant et relier la sélection d'une structure 3D.
- Ajouter « trouver l'élément » et « reconnaître l'élément isolé » sur une sélection limitée de contenus validés.
- Gérer mauvaises réponses, reset, gauche/droite, visibilité du système.

**Terminé lorsque :** quiz 3D fiable sur 10 questions vérifiées, sans résultats faux à cause d'une ambiguïté mesh/concept.

### Phase 5 — Modèles HRA unitaires

- Ajouter fournisseur de GLB isolés.
- Importer **2 ou 3 GLB HRA réellement vérifiés** (licence, axes, matériaux, taille).
- Réutiliser contrôle caméra, rendu et **Dessiner cette vue**.

**Terminé lorsque :** les organes GLB supplémentaires sont visibles sans casser l'atlas packed, avec crédits et capture pour le dessin.

### Phase 6 — NIH 3D et Z-Anatomy (option)

- Catalogue manuel NIH : **1–3 modèles validés**.
- Pipeline Z-Anatomy/Blender si et seulement si une lacune utile est identifiée et que les licences sont auditées.
- Améliorations iPad / optimisation globale.

**Terminé lorsque :** les éléments supplémentaires ont des licences tracées et ne dégradent pas le temps de chargement initial.

---

## 13. CRITÈRES D'ACCEPTATION (TESTS)

| ID | Scénario | Résultat attendu |
|---|---|---|
| A01 | Ouvrir app existante | Accueil/atelier 2D fonctionnels, projets anciens conservés |
| A02 | Ouvrir Explorer 3D | Corps 3D affiché après chargement, crédits accessibles |
| A03 | Pivoter le corps | Rotation 360° fluide sans scroll parasite de la page |
| A04 | Pincer / déplacer / tap | Gestes distingués, pas de sélection involontaire après drag |
| A05 | Changer de système | Affichage/masquage cohérent sans disparition de sélection non annoncée |
| A06 | Sélectionner crâne/fémur | Panneau de détail et mise en évidence correcte |
| A07 | Isoler une structure | Cadre centré, retour au corps complet fonctionnel |
| A08 | Affichage couleur par défaut | Surfaces normalement opaques, palette lisible ; transparence non imposée |
| A09 | Changer mode visuel | Palettes cohérentes, retour au style initial, pas de fuite mémoire |
| A10 | Changer corps masculin/féminin | Variantes distinctes, couverture clairement signalée |
| A11 | Rechercher en français | Résultats corrects pour dictionnaire FR validé ; anglais sinon |
| A12 | Dessiner cette vue | PNG correspondant à l'angle choisi, ouvre atelier 2D |
| A13 | Sauvegarder dessin issu d'une vue 3D | Projet restauré avec image, traits et métadonnées |
| A14 | Export PNG du projet | Image correcte, attribution accessible ; pas d'export CORS cassé |
| A15 | Quiz « trouve l'organe » | Picking identifie la bonne structure, score fiable |
| A16 | Import GLB HRA | Affichage 3D indépendant, source et crédits corrects |
| A17 | Pas de réseau au chargement | État d'erreur clair, bibliothèque 2D toujours disponible |
| A18 | Basculer 3D ↔ dessin plusieurs fois | Pas de contextes WebGL ni listeners accumulés |
| A19 | Taille tablette/orientation | Contrôles utilisables en iPad portrait et paysage |
| A20 | Licence des ressources | Aucune ressource inconnue redistribuée ; adaptations documentées |
| A21 | Retour à un dessin existant | Aucune migration ne détruit l'historique local |
| A22 | Ouvrir/fermer plusieurs fois sur iPad | Absence de plantage régulier ; limites mesurées |

### Tests techniques spécifiques

- Unitaires : normalisation source/mesh/concept, tri systèmes, recherche, doublons, attributs de licence.
- Intégration : sélection 3D → capture WebGL → IndexedDB → réouverture atelier.
- Non-régression : tracé Apple Pencil, calques, gomme, zoom et PNG historiques.
- Build/typecheck ; lint de l'hôte ; tests amont adaptés si code réutilisé.
- Vérification sur **Safari iPad physique** pour performances, pointer events et charge mémoire.

---

## 14. LIVRABLES ATTENDUS DE GLM

1. Code de l'application existante modifié avec route **Explorer 3D**, moteur intégré et liaison avec dessin/quiz.
2. **Aucun iframe final**, pas de reconstruction monolithique ni disparition des modules existants.
3. Catalogue de modèles et métadonnées, avec images/meshes **réellement disponibles** et crédits.
4. `docs/human-atlas-integration-audit.md` : origine, SHA, analyse des fichiers et dépendances, stratégie de port.
5. `docs/anatomy-data-sources.md` : chaque dataset, auteur, version, licence, modifications, taille, règles de redistribution.
6. `docs/anatomy-3d-architecture.md` : contrats d'adaptateurs et chargement, sélection, capture, cache, persistance.
7. `docs/ipad-test-checklist.md` : scénarios réellement vérifiés et **ceux nécessitant encore l'iPad**.
8. `INTEGRATION_STATUS.md` : pour chaque phase, statut « terminé / partiel / bloqué », preuves, commandes exécutées, risques.
9. Instructions `npm install`, `npm run dev`, `npm run build` cohérentes avec le dépôt hôte et tests.
10. Visuels/captures de démonstration **issus du vrai rendu** si l'environnement de GLM le permet.

### Ce que GLM doit éviter

- Livrer un simple README ou une capture de Human-Atlas sans l'intégrer.
- Créer une route `/atlas` avec iframe externe et annoncer l'intégration terminée.
- Copier/coller tout le dépôt tiers sans identifier les assets et dépendances réellement nécessaires.
- Utiliser `GLTFLoader` directement sur les fichiers **packed** du moteur Human-Atlas.
- Inventer un catalogue GLB accessible en API pour NIH ou Z-Anatomy.
- Modifier automatiquement les sources d'images existantes ou supprimer les projets IndexedDB.
- Confondre le nombre de concepts anatomiques et le nombre de maillages.
- Promettre le photoréalisme à partir de géométries dépourvues de texture.
- Démarrer les phases optionnelles avant une expérience **3D → dessin** fonctionnelle et vérifiée.

---

## 15. REFERENCES OFFICIELLES

- Human-Atlas (code et README) : https://github.com/slorksmo/Human-Atlas
- Démo Human-Atlas : https://atlas.taim.best
- Human-Atlas — crédits détaillés : https://github.com/slorksmo/Human-Atlas/blob/main/public/ATTRIBUTION.md
- BodyParts3D : https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- HRA 3D Reference Library : https://humanatlas.io/3d-reference-library
- NIH 3D, conditions : https://3d.nih.gov/terms
- Z-Anatomy : https://github.com/Z-Anatomy/Models-of-human-anatomy
- MIT : https://opensource.org/license/mit
- CC BY 4.0 : https://creativecommons.org/licenses/by/4.0/
- CC BY-SA 4.0 : https://creativecommons.org/licenses/by-sa/4.0/
- Three.js : https://threejs.org/docs/
- WebGL canvas capture : https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- IndexedDB : https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

---

## 16. PROMPT FINAL À EXÉCUTER PAR GLM

> Tu interviens dans mon **application React/TypeScript/Vite existante** dédiée à l'apprentissage de l'anatomie par le dessin sur iPad. **Je ne veux pas d'une nouvelle application**, ni d'une iframe de démonstration. Lis ce cahier des charges et inspecte d'abord mon dépôt pour comprendre le dessin 2D, la bibliothèque, les quiz, le visualiseur 3D actuel et le stockage IndexedDB.
>
> Clone ensuite **https://github.com/slorksmo/Human-Atlas**, fige la révision SHA, vérifie sa licence MIT pour le code et les attributions CC BY 4.0 pour les données. Étudie son moteur de géométries packées et de picking et réutilise-le intelligemment : **ne remplace pas ses optimisations par des milliers de composants Three.js naïfs**.
>
> Réalise les phases **0 à 3 en priorité** : audit documenté ; corps anatomique 3D interactif et coloré dans mon application ; recherche, sélection, filtres et isolation ; bouton **« Dessiner cette vue »** qui ouvre la capture réelle du modèle dans mon atelier Canvas actuel et permet de sauvegarder le dessin avec ses crédits. Ensuite seulement, lie les quiz puis ajoute quelques modèles HRA GLB vérifiés. Réserve NIH 3D et Z-Anatomy aux phases facultatives, après contrôle des licences.
>
> À chaque jalon, **code, exécute, teste, puis indique précisément le statut**. Ne détruis aucune donnée ou fonctionnalité existante, n'invente pas de fichiers, de licences ou de tests sur iPad. Si une ambiguïté architecturale bloque l'intégration, expose l'option choisie et l'alternative. L'objectif final est une **expérience 3D fluide sur iPad servant directement à apprendre et à dessiner l'anatomie**.
