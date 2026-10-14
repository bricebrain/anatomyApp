# Extension du Carnet d'anatomie — Catalogue du corps, quiz et vue 3D à 360°

**Version :** 1.0 — 14 octobre 2026  
**Destinataire :** GLM, assistant de développement  
**Projet existant :** PWA iPad React + Vite + TypeScript ; atelier Canvas déjà opérationnel  
**Type de travaux :** extension incrémentale d'une application existante, **pas de réécriture**  
**Public cible :** une utilisatrice souhaitant prendre plaisir à dessiner tout en mémorisant l'anatomie  
**Langue de l'application :** français

---

## 0. Instructions prioritaires pour GLM

1. **Commence par explorer le dépôt existant** : routes, composants d'atelier de dessin, bibliothèque, modèles de données, stockage IndexedDB, export et licences. Réutilise les abstractions en place avant toute modification.
2. **Ne casse aucune fonctionnalité existante** : dessin Apple Pencil/doigt, gomme, zoom, calque, import, comparaison, sauvegarde et export.
3. Développe et teste **trois fonctionnalités réellement utilisables**, dans cet ordre :
   - Catalogue anatomique permettant de choisir précisément quoi dessiner ;
   - Quiz d'identification anatomique ;
   - Explorateur 3D à 360°, avec passage d'une vue 3D vers une image de référence dans l'atelier de dessin.
4. Construis un **référentiel commun de structures anatomiques** servant à la navigation, aux modèles 2D/3D et aux questions de quiz. Ne code pas trois bases de données différentes.
5. Les modèles anatomiques doivent provenir de **sources réelles avec licences identifiées** ; ne génère pas de faux organes, de faux liens, de réponses anatomiques improvisées ni de fausses métadonnées.
6. Aucun backend, authentification ou IA payante n'est requis pour cette étape. L'application peut rester hébergée en statique ; les assets lourds doivent être optimisés et chargés à la demande.
7. Implémente des **vertical slices** démontrables et mets à jour les fichiers `README.md` et `POC_STATUS.md`/`FEATURE_STATUS.md`.
8. Ne prétends pas avoir vérifié les gestes, la fluidité ni la mémoire sur iPad sans test sur un véritable appareil.

### Vision centrale

**Choisir une structure anatomique → l'examiner en 2D ou en 3D → la dessiner depuis l'angle choisi → réviser sa localisation et son nom dans un quiz.**

Les trois expériences doivent se renforcer mutuellement. Le mode 3D doit pouvoir **fournir un modèle pour dessiner**, et les quiz doivent utiliser les **mêmes structures anatomiques** que la bibliothèque.

---

## 1. Feature A — Explorer le corps et sélectionner un élément à dessiner

### 1.1 Objectif

Offrir une navigation plus naturelle qu'une recherche par mots-clés : partir du corps humain, choisir une région, puis sélectionner un élément précis.

### 1.2 Écran « Explorer le corps »

- Dessin interactif du corps humain **face et dos**, avec zones cliquables (SVG correctement sourcé ou dessin d'interface original non présenté comme une référence médicale détaillée).
- Choix d'une région : tête/cou, thorax, abdomen/bassin, bras/main, jambe/pied, dos.
- Choix d'un système : squelette, muscles, organes, système nerveux, vaisseaux (n'activer que les catégories disposant de contenus fiables).
- Liste de fiches de structures associées à la région et au système.
- Recherche en français et synonymes de base, avec nom anglais optionnel ; ne pas imposer les termes anglais à l'utilisatrice.
- Filtres : difficulté de dessin (débutant/intermédiaire/avancé), illustration 2D disponible, modèle 3D disponible.
- Fiche par structure : nom, image d'aperçu, région, système, petite description factuelle, source/crédits, boutons **Dessiner**, **Voir en 3D** (si modèle disponible) et **Réviser** (si question vérifiée disponible).
- Un élément indisponible doit apparaître comme **« Modèle non disponible »** ou ne pas être proposé ; ne jamais afficher un faux visuel.

### 1.3 Première sélection éditoriale (petit catalogue fiable)

Commencer avec **8 à 12 structures réellement documentées**, par exemple : crâne, mandibule, cerveau, cœur, poumon, humérus, radius, fémur, rotule, main, bassin, colonne vertébrale. Cette liste est indicative : n'inclure que les éléments disposant d'assets et de métadonnées fiables.

Chaque structure peut posséder plusieurs représentations (planche 2D, image personnelle, GLB 3D). Le nom d'une structure ne doit pas dépendre du titre d'un fichier.

### 1.4 Connexion à l'atelier existant

- `Dessiner` : ouvre l'atelier avec une référence 2D de la structure choisie.
- `Voir en 3D` : ouvre l'explorateur et sélectionne la bonne structure.
- `Réviser` : ouvre un quiz filtré sur la région / le système concernés.
- Sur toute fiche, conserver l'attribution des ressources 2D et 3D.
- Les dessins déjà enregistrés continuent à s'ouvrir après ajout des nouvelles métadonnées (migration douce).

### 1.5 Critères d'acceptation A

- Depuis l'écran d'accueil, l'utilisatrice peut sélectionner « Membres supérieurs → Squelette → Humérus → Dessiner ».
- Elle peut revenir à une autre région sans perdre son projet en cours.
- Une recherche française renvoie les modèles disponibles ; les résultats ne sont pas inventés.
- Une structure sans modèle 3D n'affiche pas un bouton 3D trompeur.

---

## 2. Feature B — Quiz « Retrouve cet élément d'anatomie »

### 2.1 Objectif pédagogique

Travailler la reconnaissance visuelle et la **localisation anatomique**, sans transformer l'expérience en cours théorique. Sessions courtes, 3 à 5 questions, niveau adaptable.

### 2.2 Modes (ordre recommandé)

**B1 — Où se trouve… ? (priorité P0)**
- Question : « Touche l'humérus ».
- Afficher une **image 2D annotée par zones invisibles validées manuellement**, ou une représentation dont les éléments sont individuellement sélectionnables.
- L'utilisatrice touche la structure ; réponse immédiate, mise en évidence discrète et explication courte.
- Ne pas évaluer via la couleur du pixel ni par un découpage improvisé de l'image.

**B2 — Comment s'appelle cette structure ? (priorité P0)**
- Afficher une structure surlignée dans une planche ou un modèle simple.
- Proposer 4 réponses de **même niveau de catégorie** (ex. quatre os), pas de pièges absurdes.
- Expliquer brièvement la réponse et permettre de voir sa fiche.

**B3 — Quiz directement dans la 3D (phase ultérieure, conditionnelle)**
- « Touche le fémur » directement dans le modèle 3D.
- Implémenter uniquement si le GLB contient des **meshes distincts avec identifiants stables et vérifiés**, ou si une table explicite associe les meshes aux structures.
- Utiliser un raycast/picking fiable ; aucun quiz 3D automatique sur une scène fusionnée en un seul mesh.

**B4 — Dessine de mémoire (plus tard)**
- Après le quiz : action facultative « Dessiner cet élément de mémoire », qui renvoie vers l'atelier existant avec référence masquée.

### 2.3 Configurateur de séance

- Région et/ou système, ou mode « Mélange ».
- Mode B1 ou B2 ; le mode B3 est désactivé si la structure 3D ne permet pas de sélection.
- 3, 5 ou 10 questions maximum par séance.
- Pas de chronomètre obligatoire, pas de séries punitives, pas de feed infini.
- À la fin : nombre de bonnes réponses, erreurs à revoir, bouton **Revoir mes erreurs** et bouton **Dessiner l'une des structures**.

### 2.4 Données et correction

- Les questions et leur bonne réponse sont **préparées et validées**, pas générées automatiquement par déduction d'une image ou un LLM.
- Une question « toucher la zone » possède `assetId`, `targetStructureId` et une zone géométrique stable (polygone/masque/SVG) dans les coordonnées **normalisées de l'image source**, pas du viewport.
- La transformation pour l'affichage doit tenir compte de `object-fit: contain`, des marges, du zoom et du changement d'orientation.
- Pour un quiz 3D, la bonne réponse est basée sur l'identifiant anatomique relié au mesh sélectionné.
- Pour gauche/droite, respecter la **convention anatomique** et préciser au besoin « côté gauche du sujet » et non celui du spectateur.
- Sauvegarder uniquement de petits résultats locaux (`questionId`, réussite, date, tentatives), sans backend.

### 2.5 Critères d'acceptation B

- L'utilisatrice lance un quiz « Os du bras », répond en touchant une zone de l'image, obtient un retour clair.
- Une mauvaise réponse met en évidence la bonne structure et propose de consulter sa fiche.
- Les questions ne sont proposées que si leurs ressources et leur correction sont validées.
- En portrait/paysage iPad, les zones de réponse restent alignées avec l'image.

---

## 3. Feature C — Explorateur anatomique 3D à 360°

### 3.1 Ce que signifie « 360° »

Ce doit être un **véritable objet 3D manipulable**, et non une animation d'images 2D ou une image panoramique : rotation libre autour de l'organe dans la limite de l'interface, zoom, recadrage et vues prédéfinies.

### 3.2 Comportement V1

- Charger **un seul organe ou ensemble anatomique** à la fois.
- Rotation à un doigt (ou souris), zoom pincé, bouton remettre à zéro.
- Vues prédéfinies : face, arrière, côté gauche, côté droit, dessus si pertinent ; ne pas confondre l'orientation technique du fichier avec les directions anatomiques sans vérification.
- Nom de l'élément et métadonnées de source/licence affichés.
- État de chargement, progression si possible, gestion d'erreur réseau / WebGL indisponible.
- Bouton **« Utiliser cette vue pour dessiner »** : créer une **capture PNG/WebP de l'angle courant** puis ouvrir l'atelier de dessin existant avec cette image comme référence verrouillée ; préserver les crédits originaux et l'angle de prise de vue.
- Le dessin reste en **2D sur Canvas** ; il n'est pas nécessaire de dessiner directement sur la surface 3D dans cette version.
- Une image d'aperçu 2D apparaît si la 3D ne fonctionne pas sur l'iPad.

### 3.3 Deux choix techniques, sans les mélanger inconsidérément

**Option démarrage rapide : `@google/model-viewer`**
- Très adapté à l'affichage d'un fichier GLB unique, rotation/touch/zoom.
- À retenir si les besoins 3D se limitent à visionner et capturer une vue.
- Valider l'intégration React, le rendu sur Safari iPad et la possibilité de capturer la vue sans manipulation fragile du DOM.

**Option recommandée pour la cible à moyen terme : `three` + `@react-three/fiber` + `@react-three/drei`**
- `GLTFLoader` et `OrbitControls`/équivalent ; contrôle des caméras et des captures.
- Permet le raycast sur des meshes identifiés, le surlignage des structures, les contrôles de couches et les quiz 3D.
- Exige davantage de développement et d'optimisation, mais évite une refonte si sélection et quiz 3D deviennent prioritaires.

**Décision proposée :** faire une **preuve de concept sur un seul GLB** avec la solution la plus simple à intégrer au dépôt ; retenir R3F/Three.js si le besoin de cliquer sur une structure 3D distincte est immédiat. Encapsuler ce choix derrière un composant `Anatomy3DViewer` pour éviter de coupler le catalogue au moteur.

### 3.4 Importation d'une vue dans l'atelier

Séquence obligatoire :
1. Choisir une structure dans le catalogue.
2. Ouvrir le modèle 3D, le manipuler jusqu'au bon angle.
3. Cliquer **Utiliser cette vue pour dessiner**.
4. Capturer un rendu de la scène hors contrôles/UI en résolution suffisante, fond clair ou transparent selon la capacité du modèle.
5. Créer une nouvelle ressource de référence 2D **locale** avec un Blob, sa provenance, les modifications (« capture d'un modèle 3D ») et l'orientation.
6. L'enregistrer dans IndexedDB et ouvrir le moteur Canvas existant en mode Calque ou Côte à côte.
7. Conserver l'image et les données de provenance lors de la sauvegarde du dessin et de l'export.

Ne pas utiliser une capture d'écran CSS incluant les boutons. Éviter les échecs de capture WebGL par un mécanisme de rendu/export testé plutôt qu'une hypothèse non vérifiée. Ne pas détruire le contexte WebGL sans nécessité.

### 3.5 Sources de données publiques vérifiées

**Source prioritaire pour une vraie bibliothèque anatomique structurée : BodyParts3D**
- Page officielle : https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html
- La base fournit des fichiers Wavefront OBJ représentant des structures et des tables correspondantes d'identifiants FMA, noms anglais et relations anatomiques.
- Licence annoncée sur la page officielle mise à jour le 25/02/2025 : **CC BY 4.0** avec attribution requise.
- Les archives OBJ sont volumineuses et ne doivent PAS être chargées intégralement dans Safari à chaque visite.
- Pipeline **hors navigateur** : téléchargement manuel/officiel → choix d'une petite sélection de structures → extraction/assemblage éventuel → contrôle orientation et échelle → conversion GLB → réduction du nombre de polygones / compression / optimisation → manifest JSON → intégration comme assets statiques.
- Ne pas présumer que chaque ensemble composé (« cœur complet », etc.) existe en un seul fichier : certaines structures sont des compositions de parties atomiques.

**Source pour premiers modèles GLB : NIH 3D**
- Site : https://3d.nih.gov/
- Exemples à examiner :
  - Cœur : https://3d.nih.gov/entries/download/22787/1.01
  - Cerveau : https://3d.nih.gov/entries/download/21160/1.01
  - Squelette : https://3d.nih.gov/entries/download/16838/2
- Le site propose des fichiers GLB adaptés à l'usage Web **pour plusieurs modèles**.
- **Les licences varient selon les fiches** ; accéder à la fiche complète et contrôler les droits **avant redistribution** dans l'application. Un fichier téléchargeable n'est pas automatiquement libre de réutilisation.
- Les GLB ne contiennent pas nécessairement des meshes anatomiques individuellement identifiés : ne pas en déduire que le quiz 3D est disponible.

**Source avancée : Z-Anatomy**
- Dépôt : https://github.com/Z-Anatomy/Models-of-human-anatomy
- Atlas dérivé notamment de BodyParts3D, avec nomenclature étendue.
- La base générale Z-Anatomy annonce CC BY-SA 4.0, mais le dépôt documente aussi des **éléments tiers sous licences NC** (oreille interne, rein). Le contrat exact doit être vérifié **pour chaque élément retenu** ; ne pas distribuer une compilation en supposant une seule licence uniforme.
- L'export depuis Blender vers GLB est possible, mais peut demander un travail de préparation des objets, matériaux et identifiants.

**Règle commune :** conserver `sourceName`, `sourcePageUrl`, `author`, `license`, `licenseUrl`, `modifications`, `downloadedAt` ou version du dataset ; afficher une page « Crédits ». Une capture 2D dérivée d'un GLB doit rester liée à ses crédits d'origine.

### 3.6 Performance iPad

- Lazy load de l'écran 3D et des fichiers GLB : ne pas faire télécharger les modèles à l'ouverture générale de l'app.
- Prévoir un **modèle basse complexité d'abord**, ressources lourdes seulement sur demande ; mesurer la taille réelle téléchargée et la mémoire.
- Privilégier GLB compressé/optimisé avec géométries raisonnables ; limiter les textures, ombres et lumières coûteuses.
- Ne pas charger un atlas corps entier et des dizaines d'organes simultanément.
- Nettoyer les géométries, textures et listeners inutilisés quand on change de modèle.
- Réduire l'animation continue si la scène est immobile, lorsque la bibliothèque le permet.
- Préserver le fonctionnement du Canvas de dessin lors des allers-retours entre 3D et 2D.
- Tester portrait/paysage, gestes et retour au premier plan sur Safari iPad réel.

### 3.7 Critères d'acceptation C

- Un vrai GLB anatomique correctement licencié se charge depuis le catalogue.
- La rotation et le zoom tactiles fonctionnent sur iPad ; la scène reste lisible.
- Le bouton **Utiliser cette vue pour dessiner** crée une référence exploitable dans le Canvas existant.
- Le dessin et la provenance persistent après rechargement.
- En cas d'échec WebGL ou de fichier trop lourd, le système revient à une image 2D sans perdre le projet.

---

## 4. Modèle de données partagé

Créer une structure anatomique distincte des assets 2D/3D :

```ts
type AnatomySystem = 'skeletal' | 'muscular' | 'cardiovascular' |
  'respiratory' | 'nervous' | 'digestive' | 'other';

type AnatomyRegion = 'head-neck' | 'thorax' | 'abdomen-pelvis' |
  'upper-limb' | 'lower-limb' | 'back' | 'other';

type AnatomyStructure = {
  id: string;                   // ID interne stable : ex. 'humerus'
  nameFr: string;
  nameEn: string;
  synonymsFr?: string[];
  descriptionFr?: string;      // texte relu / sourcé
  system: AnatomySystem;
  region: AnatomyRegion;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  externalIds?: { fma?: string; other?: string };
  reference2dIds: string[];
  reference3dIds: string[];
  quizQuestionIds: string[];
};

type ResourceCredits = {
  sourceName: string;
  sourcePageUrl: string;
  author?: string;
  license: string;
  licenseUrl?: string;
  modifications?: string;
  datasetVersion?: string;
};

type Anatomy3DAsset = {
  id: string;
  structureIds: string[];      // plusieurs si modèle composé
  glbUrl: string;               // URL locale réelle, pas inventée
  previewImageUrl?: string;
  meshToStructureId?: Record<string, string>; // seulement si vérifié
  credits: ResourceCredits;
  fileSizeBytes?: number;
};

type ImageHotspot = {
  structureId: string;
  polygon: Array<{ x: number; y: number }>;
  // x,y normalisés dans [0,1] par rapport à l'image source
};

type AnatomyQuizQuestion = {
  id: string;
  mode: 'tap-2d' | 'name-highlighted' | 'tap-3d';
  promptFr: string;
  targetStructureId: string;
  imageAssetId?: string;
  model3dAssetId?: string;
  hotspots?: ImageHotspot[];
  options?: string[];            // IDs de structures, pas réponses libres
  explanationFr: string;
  verified: boolean;
};
```

**Important :** adapter ces types aux modèles en place ; ne pas migrer brutalement les anciens dessins. Un `DrawingProject` existant doit simplement pouvoir référencer une nouvelle `AnatomyStructure` et une image produite à partir d'une vue 3D, tout en conservant sa lecture ancienne.

---

## 5. Structure React suggérée (indicative)

```text
src/features/anatomy/
  data/structures.ts
  data/credits.ts
  components/BodyRegionSelector.tsx
  components/AnatomyStructureCard.tsx
  pages/ExploreBodyPage.tsx
  types.ts
src/features/quiz/
  data/questions.ts
  components/AnatomyHotspotImage.tsx
  components/QuizSession.tsx
  pages/QuizPage.tsx
  services/quizRepository.ts
src/features/anatomy3d/
  components/Anatomy3DViewer.tsx
  components/ViewerControls.tsx
  services/threeDAssetRepository.ts
  services/snapshotToDrawing.ts
  pages/Anatomy3DPage.tsx
public/anatomy3d/           # seuls les modèles réellement autorisés
```

Utiliser les routes et services de dessin déjà en place plutôt que de les dupliquer.

---

## 6. Ordre d'implémentation / démonstrations GLM

### Phase A — Référentiel et sélection

- Créer une structure de données unique et quelques fiches fiables.
- Ajouter **Explorer le corps** et navigation région → système → structure.
- Brancher **Dessiner** sur l'atelier existant.
- Livrer un parcours de bout en bout utilisant une ressource réellement disponible.

**Démo :** « Je sélectionne Main → Os → un os disponible → Dessiner ».

### Phase B — Quiz 2D validés

- Implémenter B1 et B2 avec 8–15 questions vérifiées à la main.
- Construire une image à hotspots, avec transformations tactiles robustes.
- Afficher les erreurs / bonnes réponses et la navigation vers une fiche.
- Sauvegarder de petits résultats localement.

**Démo :** « Je réponds à 5 questions sur les os puis j'ouvre la fiche de l'un des os que j'ai raté ».

### Phase C — Premier organe 3D

- Intégrer **un seul fichier GLB réel et juridiquement vérifié** (cœur ou cerveau), plutôt que le corps entier.
- Afficher rotation, zoom, recentrage et vues prédéfinies réellement calibrées.
- Tester iPad et intégrer un repli si WebGL échoue.
- Livrer le bouton **Utiliser cette vue pour dessiner**.

**Démo :** « Je tourne le cœur en 3D, je choisis une vue de profil, puis je la reproduis au stylet dans mon atelier ».

### Phase D — Extension progressive

- Ajouter 2–5 modèles 3D supplémentaires adaptés à l'iPad.
- Éventuellement préparer une conversion BodyParts3D avec correspondance FMA → mesh.
- Ajouter le quiz 3D uniquement si les meshes sont individualisés et correctement mappés.
- Mesurer la performance et ajuster les modèles.

**Démo :** « Je sélectionne un os dans la scène 3D et l'application affiche son vrai nom » ; ne pas considérer cette démo réussie si le modèle est un seul mesh non segmenté.

---

## 7. Test et validation

| ID | Test | Critère de réussite |
|---|---|---|
| A01 | Navigation zone du corps → structure | Fiche correcte, cohérente et sourcée |
| A02 | Bouton Dessiner depuis la fiche | Atelier existant ouvert avec bonne référence |
| A03 | Recherche française | Résultats pertinents présents dans le catalogue |
| A04 | Structure sans GLB | Pas de fausse promesse de modèle 3D |
| B01 | Toucher un hotspot 2D | Correction juste et zone bien placée |
| B02 | Tourner l'iPad pendant un quiz | Hotspots toujours alignés |
| B03 | Quiz de 5 questions | Résultats et erreurs à revoir corrects |
| B04 | Mauvaise réponse | Bonne zone/bonne réponse explicitée |
| C01 | Charger GLB iPad | Aucun crash, rotation et zoom fonctionnels |
| C02 | Changer l'angle | Caméra réellement manipulable à 360° |
| C03 | Capturer la vue 3D | Image créée sans boutons de l'interface |
| C04 | Utiliser cette vue pour dessiner | Image passée dans le Canvas 2D déjà existant |
| C05 | Sauvegarder/recharger le dessin | Dessin, image et crédits présents après relance |
| C06 | Échec WebGL ou asset manquant | État d'erreur compréhensible + fallback 2D |
| C07 | Compatibilité avec anciens projets | Dessins existants inchangés et lisibles |
| C08 | Licence et provenance | Auteurs, liens, licences et modifications affichés |

Ne pas marquer « testé sur iPad » à partir de tests sur desktop. Documenter les blocages de modèle, de licence, de taille ou de conversion sans substituer une image fictive.

---

## 8. Hors périmètre immédiat

- Atlas corporel complet avec milliers de meshes en haute résolution sur iPad ; à envisager seulement après optimisation et tests.
- Reconnaissance / notation automatique de la qualité du dessin par IA.
- Dessin directement sur la surface 3D.
- Représentations médicalement diagnostiques, conseils de santé, simulation clinique.
- Compte utilisateur, cloud et synchronisation multiappareil.
- Quiz générés automatiquement sans contenu vérifié.
- Expérience AR/réalité augmentée ; la rotation 3D dans le navigateur suffit ici.

---

## 9. Références fiables et pistes de réutilisation

- **BodyParts3D officiel (archives, noms FMA, licence CC BY 4.0 en 2025)** : https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html
- **NIH 3D (GLB, licences par modèle)** : https://3d.nih.gov/  ; aide https://3d.nih.gov/faqs?page=1
- **Z-Anatomy (Blender, sources et licences composites)** : https://github.com/Z-Anatomy/Models-of-human-anatomy
- **Open Anatomy Atlas (inspiration open source pour selection/quiz/3D — vérifier indépendamment licences et qualité avant réemploi)** : https://github.com/CognitionLabSNUC/open-anatomy-atlas
- **Composant Web 3D simple** : https://modelviewer.dev/
- **Three.js** : https://threejs.org/
- **React Three Fiber** : https://r3f.docs.pmnd.rs/

## 10. Message final à GLM

**N'écris pas une simple proposition : implémente les fonctionnalités dans l'application existante, sans régression.**

Commence par inspecter le projet. Travaille en petites phases testables et respecte cet ordre :

**Catalogue anatomique unifié → sélection pour dessiner → quiz 2D vérifiés → premier GLB interactif → capture d'une vue pour dessiner → extension 3D progressive.**

Le scénario principal à atteindre est : **je choisis une structure, je la regarde à 360°, je fixe l'angle qui me plaît, puis je la dessine sur mon iPad**.
