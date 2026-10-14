# Cahier des charges — POC « Carnet d'anatomie » (iPad Web)

**Version :** 1.0 — 13 octobre 2026  
**Destinataire :** GLM (assistant de développement)  
**Nature du livrable :** prototype web fonctionnel, à tester en conditions réelles sur iPad avec stylet  
**Langue de l'interface :** français  
**Utilisateur cible :** une seule personne, débutante ou intermédiaire en dessin anatomique

---

## 0. INSTRUCTIONS À GLM — À LIRE EN PREMIER

Tu es chargé de **développer un POC utilisable**, pas seulement une maquette ou une architecture théorique. Travaille directement dans le dépôt du projet fourni. Si le dépôt est vide, initialise-le.

### Mission

Construire une application **React + Vite + TypeScript** optimisée pour **Safari sur iPad**, où l'utilisatrice peut :

1. Trouver et choisir une **véritable illustration anatomique** autorisée à la réutilisation.
2. L'afficher dans un **atelier de dessin**.
3. **Dessiner au-dessus de l'image ou à côté**, avec un Apple Pencil compatible, un doigt ou une souris.
4. Régler la **transparence du modèle anatomique**.
5. **Afficher, masquer et comparer** son dessin au modèle.
6. **Enregistrer et retrouver** son travail après fermeture et réouverture du navigateur.

**Priorité absolue :** éprouver la qualité du dessin et l'importation de modèles anatomiques réels. Tout le reste est secondaire.

### Règles impératives de réalisation

- Livrer du **code exécuté et testable**, pas des écrans statiques non fonctionnels.
- Ne pas ajouter d'API d'IA, de modèle de langage, de compte utilisateur ou de backend.
- Ne pas remplacer silencieusement les modèles anatomiques par des images inventées, des placeholders ou des images soumises à des droits non identifiés.
- Si une récupération en ligne est impossible, permettre systématiquement **l'import d'un fichier local** (`PNG`, `JPG`, `WEBP`, éventuellement `SVG` sécurisé).
- Chaque illustration fournie par une source externe doit conserver son **auteur, sa source, sa licence et son lien vers la fiche d'origine**.
- Ne pas se contenter de tests sur ordinateur : prévoir les tests iPad listés plus bas et signaler honnêtement ce qui ne peut pas être vérifié sans l'appareil.
- Développer par étapes fonctionnelles, avec une version utilisable à chaque étape.
- Favoriser une architecture lisible, des composants petits et un moteur de dessin isolé du reste de l'application.

---

## 1. Contexte et objectif du produit

L'application est destinée à une personne qui aime **dessiner** et souhaite **apprendre l'anatomie humaine en dessinant**. Son plaisir créatif est aussi important que l'acquisition de connaissances.

À terme, une déclinaison iPhone servira aux révisions courtes. **Ce POC concerne uniquement la partie iPad Web.**

Nous ne cherchons PAS encore à concevoir une encyclopédie médicale ni un système éducatif complet. Le POC doit répondre à trois questions :

1. **Le dessin au stylet est-il suffisamment fluide et agréable dans Safari sur iPad ?**
2. **Peut-on facilement récupérer des illustrations anatomiques pertinentes et légalement réutilisables ?**
3. **L'expérience « je choisis un organe → je le reproduis → je compare → je sauvegarde » donne-t-elle envie de recommencer ?**

### Définition du succès

Le POC est réussi si l'utilisatrice peut, **sans aide technique** :

- Ouvrir le site depuis l'iPad.
- Choisir une image du cœur ou du crâne.
- Dessiner un croquis complet au stylet.
- Masquer le modèle pour juger son dessin.
- Comparer les deux images.
- Fermer puis rouvrir l'application et récupérer son dessin.

---

## 2. Périmètre exact

### P0 — Obligatoire pour le POC

- Interface agréable sur iPad en portrait et paysage.
- Galerie initiale de modèles anatomiques **réels** ; si l'acquisition automatique ne marche pas, import manuel immédiatement fonctionnel.
- Recherche de modèles anatomiques via **Wikimedia Commons** (voir section 5) ; récupération des métadonnées de licence.
- Atelier de dessin avec fond anatomique verrouillé et couche de dessin distincte.
- Trait au stylet/doigt/souris avec rendu fluide, taille, couleur et gomme.
- Annuler/refaire ; effacer le dessin avec confirmation.
- Curseur d'opacité du modèle ; masquer/réafficher le modèle.
- Modes **Calque** et **Côte à côte** ; possibilité de comparer après avoir dessiné.
- Zoom et déplacement du document, sans désaligner les traits et le modèle.
- Sauvegarde locale durable d'une session et réouverture.
- Export PNG du dessin, avec ou sans modèle, sans erreur de sécurité CORS.
- Affichage de l'attribution de l'image utilisée.

### P1 — Si P0 est fonctionnel et testé

- Outil pipette ou palette enrichie.
- Enregistrement de plusieurs versions d'un même dessin.
- Export d'un projet JSON réimportable.
- Favoris dans la galerie.
- Filtre « os / organes / muscles / système nerveux ».
- Suggestions d'exercices simples (tracer le contour / copier / dessiner de mémoire).

### Hors périmètre de ce POC

- Correction automatique par IA.
- Reconnaissance des organes dessinés.
- Quiz, SRS ou évaluation pédagogique complète.
- Anatomie 3D.
- Collaboration, partage social, compte utilisateur, cloud et synchronisation entre appareils.
- Application native iOS, PencilKit, App Store et fonctions avancées de l'Apple Pencil (double-tap, hover spécifique, etc.).
- Diagnostic médical ou conseil de santé.

---

## 3. Parcours utilisateur prioritaires

### Parcours A — Premier dessin (principal)

1. L'utilisatrice ouvre `/` et voit trois options : **Choisir un modèle**, **Importer une image**, **Reprendre un dessin**.
2. Elle sélectionne « Cœur » dans une galerie ou importe un dessin anatomique.
3. Le modèle s'ouvre dans l'atelier, centré et adapté à la zone disponible.
4. Le mode **Calque** est activé : modèle sous le dessin, légèrement transparent (défaut : 45 %).
5. Elle choisit un crayon sombre et trace les contours avec le stylet.
6. Elle utilise une gomme, annule une action, zoome sur un détail, puis continue.
7. Elle masque le modèle et visualise uniquement son dessin.
8. Elle passe en **Côte à côte** pour comparer l'original et sa réalisation.
9. Elle sauvegarde et ferme Safari.
10. À la prochaine ouverture, elle reprend exactement son dessin.

### Parcours B — Chercher un élément anatomique

1. Elle ouvre « Bibliothèque ».
2. Elle tape « heart » ou « skull » ; le champ peut proposer une traduction indicative de termes français courants.
3. L'application montre des vignettes et le type de licence disponible.
4. Elle sélectionne un résultat **compatible avec la politique de licences du POC**.
5. Elle voit l'image, l'auteur, la source, la licence et un bouton « Dessiner ce modèle ».
6. Le modèle est importé dans un projet de dessin, sans perdre les données d'attribution.
7. Si la récupération échoue, un message clair apparaît avec la possibilité d'importer un fichier enregistré sur l'iPad.

### Parcours C — Dessiner sans modèle

- L'utilisatrice crée une page blanche, dessine librement et peut ajouter une image plus tard.
- L'application reste fonctionnelle même sans Internet ni fichier anatomique distant.

---

## 4. Écrans et interface

### Écran 1 — Accueil

Interface minimaliste, chaleureuse et visuelle :

- Titre : « Mon carnet d'anatomie ».
- CTA principal : **Commencer un dessin**.
- CTA secondaire : **Importer une illustration**.
- Bloc **Dernier dessin** (si un projet existe).
- Quelques modèles suggérés (si disponibles).

Pas de statistiques, badges de série, feed infini ou menu complexe.

### Écran 2 — Bibliothèque de modèles

- Grille de cartes illustrées.
- Recherche textuelle : *cœur, crâne, cerveau, os, main, muscles* ; proposer aussi les équivalents anglais pour Commons.
- Deux sections : **Sélection locale** et **Recherche Wikimedia Commons**.
- Afficher image, titre, source et licence lisible.
- Cliquer sur une carte ouvre une **prévisualisation** avec « Dessiner ce modèle ».
- État vide utile ; état de chargement ; état erreur explicite ; import local toujours accessible.
- Ne pas afficher une illustration comme réutilisable tant que sa licence n'a pas été contrôlée.

### Écran 3 — Atelier de dessin (écran le plus important)

**Sur iPad paysage :**

- En haut : retour, nom du projet, statut « Enregistré » / « Enregistrement… », enregistrer, export.
- Barre d'outils latérale ou compacte : crayon, gomme, main/déplacer, annuler, refaire, couleur, épaisseur.
- **Grand espace central réservé au dessin** (majorité de l'écran).
- Petit panneau rétractable « Modèle » : opacité, visible/masqué, mode Calque / Côte à côte.
- Bouton visible « Comparer ».

**Sur iPad portrait :**

- Zone de dessin prioritaire.
- Barre d'outils repliée en bas ou en haut.
- Panneau du modèle affiché dans un tiroir, pas en permanence au détriment du dessin.

### Ambiance graphique

- Style « carnet / atelier scientifique », sobre et élégant.
- Fond clair ivoire ou blanc cassé, traits lisibles, commandes contrastées.
- Typographie claire, grands boutons tactiles (cibles confortables, idéalement >= 44 px).
- Pas de design de type jeu mobile ni d'animations distrayantes.
- Respect de la *safe area* iPad ; éviter qu'un changement de barre d'adresse déplace le document pendant le tracé.

---

## 5. Sources d'illustrations anatomiques : exigence majeure

**Il faut prouver qu'on peut récupérer de vraies illustrations utiles pour s'entraîner au dessin.**

### Source A — Wikimedia Commons : intégration de recherche (P0)

Site : https://commons.wikimedia.org/  
Collection intéressante : https://commons.wikimedia.org/wiki/Category:Gray%27s_Anatomy_plates

La collection historique **Gray's Anatomy (1918)** comporte de nombreuses planches du domaine public. Pour toute image particulière, consulter la page du fichier afin de confirmer son statut et son crédit.

Mettre en place un service `CommonsImageProvider` utilisant l'API MediaWiki officielle :

`https://commons.wikimedia.org/w/api.php`

Exemple de requête de recherche (paramètres, à encoder avec `URLSearchParams`) :

```text
action=query
format=json
origin=*
generator=search
gsrsearch=human heart anatomy
gsrnamespace=6
gsrlimit=12
prop=imageinfo
iiprop=url|size|mime|extmetadata
iiurlwidth=700
```

**Comportements attendus :**

- Rechercher uniquement dans l'espace de noms des fichiers (`gsrnamespace=6`).
- Gérer les réponses sans résultats et les erreurs réseau.
- Normaliser les données : titre, URL miniature, URL d'origine, dimensions, MIME, page Wikimedia, auteur, licence.
- Les données de `extmetadata` peuvent contenir du HTML : les convertir en texte sans injection HTML non nettoyé.
- Respecter le caractère coûteux de `extmetadata` : petits lots, debounce de la recherche, aucune requête par caractère saisi.
- Afficher les licences connues compatibles avec le POC (p. ex. Public Domain, CC0, CC BY, CC BY-SA, en respectant leurs conditions). Les licences inconnues doivent être exclues de la sélection automatique ou nécessiter vérification manuelle.
- Télécharger ou mettre en cache le fichier choisi avant utilisation comme modèle, si CORS l'autorise.
- En cas d'échec CORS ou de récupération, **ne pas casser le mode dessin** : informer l'utilisatrice et proposer un import local.
- Préserver systématiquement la page source et la licence.

Référence API : https://www.mediawiki.org/wiki/API:Imageinfo  
Référence CORS : https://www.mediawiki.org/wiki/API:Cross-site_requests

### Source B — Servier Medical Art : sélection manuelle pour le POC (P0)

Bibliothèque : https://smart.servier.com/  
Licence : **CC BY 4.0** — crédit obligatoire, lien de licence, mention des adaptations le cas échéant.

**Ne pas supposer qu'il existe une API publique de recherche Servier** ni développer de scraping fragile. Utiliser les images téléchargées dans un petit catalogue local, avec leur attribution.

Trois points d'entrée réels pour préparer une sélection :

- Cœur : https://smart.servier.com/smart_image/heart/
- Crâne : https://smart.servier.com/smart_image/skull/
- Cerveau : https://smart.servier.com/smart_image/brain/

GLM doit inspecter le format et la qualité des fichiers réellement accessibles avant de les intégrer. Le site peut distribuer plusieurs variantes. **Ne jamais inventer les URL des fichiers image.**

Créer une sélection initiale de **3 à 6 modèles** : cœur, crâne, cerveau ; puis idéalement main/os et muscles si des fichiers autorisés sont accessibles. Une sélection réduite et fiable vaut mieux que 50 résultats peu pertinents.

### Source C — Import d'une image personnelle (P0, filet de sécurité)

- Bouton d'import accessible depuis l'accueil, la bibliothèque et l'atelier.
- Fichiers acceptés : PNG, JPG, WEBP ; SVG uniquement si traitement sûr et maîtrisé.
- Vérifier format, décodage et taille du fichier ; fournir une erreur lisible.
- Conserver le fichier localement avec le projet.
- L'utilisatrice est responsable des droits de réutilisation des images qu'elle importe.
- Prévoir un champ « Source / auteur / licence » facultatif pour les imports personnels.

### Qualité des illustrations (critères de sélection)

- Anatomie humaine réelle ; pas de modèles inventés par IA.
- Sujet identifiable et **suffisamment isolé pour être dessiné**.
- Contours nets, fond sobre, résolution correcte.
- Éviter au départ les planches surchargées de légendes, de flèches ou de dizaines de détails.
- Préférer les visuels adaptés au tracé (si besoin, version simplifiée clairement identifiée comme adaptation).
- Stocker une miniature distincte du fichier haute résolution si possible.

### Exigence légale

Pour chaque modèle, conserver : `sourceName`, `sourcePageUrl`, `author`, `license`, `licenseUrl`, `modifications`.
Afficher ces informations depuis la fiche modèle et dans un écran « Crédits ». Pour un export incorporant le modèle, proposer également un crédit dans les métadonnées ou un fichier texte d'accompagnement lorsque c'est pertinent.

**Important :** certaines autres sources, notamment le manuel *OpenStax Anatomy and Physiology 2e*, utilisent la licence CC BY-NC-SA 4.0 et imposent des restrictions propres, y compris concernant les usages avec IA. Elles ne sont **pas** sélectionnées comme source automatique pour ce POC.

---

## 6. Moteur de dessin : exigences techniques

### 6.1 Choix d'implémentation

Privilégier **HTML Canvas 2D + Pointer Events** pour ce POC. Une bibliothèque légère d'amélioration des traits (par exemple `perfect-freehand`) peut être évaluée si elle améliore réellement l'expérience.

Il faut un composant `DrawingSurface` isolé et réutilisable. Éviter de disperser les interactions de stylet dans les composants React de l'interface.

**Important :** les éventuelles données de pression ou d'inclinaison reçues depuis Safari dépendent du matériel et du navigateur ; prévoir un rendu de qualité **même si ces données ne sont pas disponibles**.

### 6.2 Architecture en couches

Le document possède au minimum :

1. **Couche modèle anatomique** : image de référence, positionnée, **non dessinable et verrouillée**.
2. **Couche dessin** : traits de l'utilisatrice ; éditable.
3. **Couche interface** : grille optionnelle, repères, poignées si nécessaire (ne fait pas partie de l'export par défaut).

**Règle essentielle :** le modèle et les traits doivent partager le **même repère de coordonnées documentaire**. La rotation d'écran, le zoom, le déplacement et le redimensionnement ne doivent jamais désaligner les tracés.

### 6.3 Acquisition des entrées

Gérer correctement :

- `pointerdown`, `pointermove`, `pointerup`, `pointercancel` ;
- `setPointerCapture` quand applicable ;
- `pointerType` (`pen`, `touch`, `mouse`, éventuellement vide) ;
- `pressure` si exploitable, avec épaisseur constante de secours ;
- les événements intermédiaires/coalescés si pris en charge et utiles ;
- les changements d'orientation et de dimensions.

Sur la surface de dessin, appliquer une gestion appropriée de `touch-action` pour éviter que Safari défile la page pendant le tracé. **Ne pas désactiver globalement tous les gestes de la page.**

Prévoir la coexistence stylet/doigts :

- Par défaut, stylet ou un doigt dessine.
- Mode explicite **Main / déplacer** pour panoramique.
- Tester un geste à deux doigts pour zoomer/déplacer si réalisable dans ce POC.
- Si un stylet est en cours d'utilisation, éviter qu'un contact accidentel de paume ne crée un trait ; documenter les limites sans promettre la qualité de rejet de paume native.

### 6.4 Tracé et rendu

- Trait continu, sans segments cassés lors d'un déplacement rapide.
- Trait visuellement doux (interpolation ou lissage sans sacrifier la réactivité).
- Rendu net sur écran Retina : tenir compte du `devicePixelRatio`.
- Ne pas faire un `setState` React sur chaque point du dessin ; stocker la session active dans une structure adaptée (`ref`, moteur autonome) et ne publier que les changements utiles.
- Éviter le redessin complet de l'interface React à chaque mouvement.
- Conserver les traits sous forme **vectorielle logique** : suite de points, épaisseur, couleur, outil, pression facultative. Ne pas stocker uniquement une capture PNG.

### 6.5 Outils minimum

- Crayon / stylo.
- Gomme (au POC, gomme par trait entier acceptable et clairement indiquée ; gomme partielle facultative).
- Palette d'au moins 5 couleurs, dont noir, bleu et rouge.
- Épaisseur avec quelques valeurs faciles à toucher (par exemple 2, 4, 8, 14 px logiques).
- Annuler / refaire : au minimum 20 actions récentes.
- Effacer tout : confirmation.
- Zoom + / zoom - / remettre à l'écran.
- Déplacer : outil Main.

### 6.6 Calque, copie et comparaison

**Mode CALQUE :**

- Modèle et dessin dans la même zone.
- Curseur d'opacité du modèle de 0 à 100 %.
- Bouton visible / masqué.
- Le réglage de transparence ne doit **jamais** modifier les traits enregistrés.

**Mode CÔTE À CÔTE :**

- Original d'un côté, dessin seul de l'autre.
- Mise à l'échelle cohérente et centrage pour comparer facilement.
- Pas d'étirement déformant des proportions.
- En portrait, présentation verticale si l'espace manque.

**Mode DESSIN DE MÉMOIRE (version minimale) :**

- Un bouton « Masquer le modèle » suffit au POC.
- L'utilisatrice continue à dessiner sans référence ; elle peut ensuite la réafficher.

### 6.7 Export

Proposer :

- **Exporter le dessin seul** : PNG transparent ou fond blanc, au choix.
- **Exporter dessin + modèle** : PNG composé avec opacité et position actuelles du modèle.

Les images externes ne doivent pas contaminer le canvas (*tainted canvas*) : importer les images sous forme locale / Blob via chargement CORS autorisé ou stockage de fichiers uploadés. En cas d'incompatibilité, afficher un message précis, **pas un export silencieusement cassé**.

---

## 7. Sauvegarde locale et données

### Stockage

Utiliser **IndexedDB**, avec `Dexie` si cela simplifie l'implémentation. Éviter `localStorage` pour les images et les dessins volumineux.

Stocker :

- Les projets de dessin.
- Les traits et réglages d'affichage.
- La référence du modèle et ses crédits.
- Les fichiers images en Blob si nécessaires à la réouverture hors ligne.
- La date de modification.

### Sauvegarde

- Sauvegarde automatique **à la fin d'un trait** et après les changements importants, avec temporisation si nécessaire.
- Indicateur « Enregistrement… / Enregistré ».
- Un rafraîchissement ou une fermeture ne doit pas entraîner de perte des traits **déjà enregistrés**.
- Au rechargement : restaurer le document, les couches, les coordonnées, les outils pertinents.
- Prévenir si le stockage est plein ou indisponible.
- Ne pas promettre une conservation définitive des données iOS : proposer l'export PNG et, idéalement P1, un backup JSON.

### Schéma indicatif TypeScript

```ts
type AnatomySource = 'commons' | 'servier' | 'local';

type AnatomyAsset = {
  id: string;
  title: string;
  category: 'heart' | 'skull' | 'brain' | 'bones' | 'muscles' | 'other';
  source: AnatomySource;
  sourceName: string;
  sourcePageUrl?: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  modifications?: string;
  width: number;
  height: number;
  mimeType: string;
  thumbnailUrl?: string;
  // L'image du projet peut être conservée séparément en IndexedDB.
  localBlobId?: string;
};

type StrokePoint = {
  x: number; // Coordonnées de la page, pas coordonnées de l'écran
  y: number;
  pressure?: number;
};

type Stroke = {
  id: string;
  tool: 'pen';
  color: string;
  width: number;
  points: StrokePoint[];
};

type DrawingProject = {
  id: string;
  name: string;
  modelAssetId?: string;
  documentWidth: number;
  documentHeight: number;
  strokes: Stroke[];
  modelOpacity: number;
  modelVisible: boolean;
  viewMode: 'trace' | 'side-by-side';
  createdAt: string;
  updatedAt: string;
};
```

Ce schéma est une proposition : il peut être affiné, sans supprimer la distinction **asset anatomique / projet / traits / fichier image**.

---

## 8. Structure technique recommandée

### Stack

- **React + Vite + TypeScript**.
- CSS modulaire ou solution de style légère ; design tactile iPad.
- **Canvas 2D + Pointer Events** pour le dessin.
- `perfect-freehand` uniquement si ses performances et son comportement sont satisfaisants.
- `Dexie` / IndexedDB pour les sauvegardes et images locales.
- `lucide-react` pour les icônes, facultatif.
- Tests unitaires : **Vitest** ; tests UI utiles avec **React Testing Library**.
- Aucun backend requis.
- HTTPS en hébergement (Cloudflare Pages, par exemple), pour tests sur iPad et éventuelle installation à l'écran d'accueil.

### Organisation proposée

```text
src/
  app/
    App.tsx
    routes.tsx
  components/
    layout/
    ui/
  features/
    library/
      components/
      services/CommonsImageProvider.ts
      services/LocalAssetProvider.ts
      types.ts
    drawing/
      components/DrawingSurface.tsx
      components/DrawingToolbar.tsx
      components/ModelControls.tsx
      components/ComparisonView.tsx
      engine/
        pointerInput.ts
        coordinates.ts
        renderStrokes.ts
        canvasExport.ts
      types.ts
    projects/
      db.ts
      projectRepository.ts
  pages/
    HomePage.tsx
    LibraryPage.tsx
    DrawingPage.tsx
  styles/
public/
  anatomy/    # Modèles téléchargés légalement, s'ils sont disponibles
```

Il s'agit d'un **guide**, pas d'une obligation de multiplier inutilement les fichiers.

### Principes d'architecture

1. Le moteur de dessin doit être testable indépendamment du catalogue anatomique.
2. Changer un modèle ne doit pas effacer un ancien dessin sans confirmation.
3. Les images externes sont traitées comme des données incertaines : erreurs réseau, formats, CORS, licence.
4. Séparer la caméra du document (zoom/déplacement) et les coordonnées des traits.
5. Conserver la possibilité de remplacer le moteur Canvas sans réécrire les projets.
6. Aucun calcul médical automatisé ni affirmation de précision clinique des images.

---

## 9. Ordre de réalisation demandé à GLM

### Phase 1 — Socle et atelier autonome (premier jalon)

- Initialiser Vite/React/TypeScript.
- Créer l'accueil, la page atelier et la navigation minimale.
- Créer un canvas avec **page blanche** et outils de dessin de base.
- Tester souris, doigt et stylet via Pointer Events.
- Implémenter annuler/refaire, couleurs, épaisseur, gomme.
- Ajouter zoom et déplacement avec repère documentaire stable.

**Démonstration exigée :** je peux dessiner, zoomer, effacer, annuler et refaire, sans modèle anatomique.

### Phase 2 — Premier vrai modèle anatomique (jalon prioritaire)

- Implémenter import PNG/JPG/WEBP local.
- Charger l'image sous le dessin, verrouillée.
- Afficher modèle, régler opacité et masquer/réafficher.
- Ajouter le mode Côte à côte.
- Vérifier que zoom et transformations gardent les calques alignés.

**Démonstration exigée :** un fichier anatomique choisi sur iPad sert de modèle de dessin.

### Phase 3 — Bibliothèque anatomique réelle

- Constituer une courte sélection à partir de Servier ou Gray's Anatomy, avec crédits.
- Ajouter galerie et prévisualisation.
- Ajouter la recherche via l'API Wikimedia Commons.
- Afficher et vérifier les métadonnées de licence.
- Permettre « Dessiner ce modèle » et assurer les états d'erreur et de repli.

**Démonstration exigée :** je peux récupérer une image réelle trouvée dans l'application puis dessiner dessus ; en cas d'échec réseau, l'import fonctionne toujours.

### Phase 4 — Sauvegarde et export

- Stocker images, projets et traits dans IndexedDB.
- Sauvegarder automatiquement.
- Restaurer un projet après fermeture et réouverture.
- Exporter en PNG sans modèle et avec modèle.
- Vérifier les crédits et les règles CORS.

**Démonstration exigée :** j'ouvre un dessin sauvegardé, je le complète, je peux l'exporter.

### Phase 5 — Finitions iPad

- Affiner portrait/paysage et surfaces tactiles.
- Vérifier scroll involontaire, gestes, paume, orientation, Retina.
- Installer éventuellement en PWA (manifest + service worker de base), **uniquement si les jalons précédents sont stables**.
- Livrer la liste des limites observées.

---

## 10. Critères d'acceptation et scénarios de test

| ID | Scénario | Résultat attendu |
|---|---|---|
| T01 | Tracer lentement puis rapidement au stylet sur iPad | Traits continus et utilisables |
| T02 | Changer couleur et épaisseur | Nouveaux traits mis à jour, anciens inchangés |
| T03 | Dessiner puis Annuler/Refaire | Dernière action annulée puis rétablie |
| T04 | Utiliser la gomme | Gomme fonctionnelle, sans effacer le modèle |
| T05 | Importer PNG/JPG depuis Fichiers | Image chargée comme modèle verrouillé |
| T06 | Régler opacité à 0 %, 50 %, 100 % | Modèle varie ; traits restent inchangés |
| T07 | Masquer le modèle puis le réafficher | Les traits restent intacts |
| T08 | Zoomer, déplacer et revenir au cadrage initial | Modèle et traits restent parfaitement alignés |
| T09 | Passer en comparaison | Original et dessin affichés sans déformation |
| T10 | Chercher « human heart anatomy » sur Commons | Vraies vignettes ou message d'erreur explicite |
| T11 | Ouvrir un résultat de Commons | Source et licence visibles ; import si autorisé |
| T12 | Couper la connexion pendant la recherche | Pas de plantage ; import local disponible |
| T13 | Fermer puis rouvrir la page | Projet précédemment enregistré restauré |
| T14 | Exporter dessin seul et dessin + modèle | PNG correct, pas d'erreur CORS silencieuse |
| T15 | Tourner l'iPad portrait/paysage | Document non déformé, alignement conservé |
| T16 | Tracer à proximité des bords de la zone de dessin | Aucun scroll involontaire pendant le tracé |
| T17 | Ouvrir les crédits du modèle | Auteur, licence et lien source affichés |
| T18 | Simuler un échec IndexedDB ou de stockage | Message explicite ; aucun faux message « Enregistré » |

### Mesures qualitatives

Sur l'iPad réel, observer :

- **Latence perçue du trait** : est-ce naturel ou frustrant ?
- **Fluidité** : les courbes paraissent-elles régulières ?
- **Contrôle** : les doigts/paume déclenchent-ils des traits indésirables ?
- **Lisibilité de l'original** : le modèle se prête-t-il réellement à la copie ?
- **Ergonomie** : outils faciles à atteindre sans masquer le dessin ?
- **Plaisir** : l'utilisatrice a-t-elle envie de faire un second dessin ?

Si l'expérience au stylet n'est pas satisfaisante dans Safari, **ne pas masquer le problème** : documenter la limite et proposer les alternatives (optimisation moteur ou natif/PencilKit) sans réécrire immédiatement tout le produit.

---

## 11. Livraison attendue

Le dépôt doit contenir :

1. **Application fonctionnelle** avec démarrage local (`npm install`, `npm run dev`).
2. `README.md` détaillant installation, commandes, déploiement et tests sur iPad (adresse réseau locale accessible ou URL HTTPS).
3. Une courte description des **sources anatomiques réellement intégrées**, de leur licence et de leur attribution.
4. Des projets sauvegardables et au moins un flux complet dessin → comparaison → réouverture.
5. Des scripts de build, lint/typecheck et tests basiques.
6. Un fichier `POC_STATUS.md` indiquant clairement :
   - fonctions terminées ;
   - fonctions non terminées ;
   - vérifications faites en navigateur desktop ;
   - vérifications **restant à faire sur iPad réel** ;
   - limites techniques, notamment CORS/licences/Apple Pencil ;
   - étapes prioritaires suivantes.

**Attention :** ne jamais déclarer « compatible Apple Pencil testé » sans test réel sur un iPad équipé et un stylet compatible.

---

## 12. Références techniques utiles à GLM

- Pointer Events / interactions de dessin : https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events
- Pointer Events / propriétés stylet : https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- API MediaWiki Imageinfo : https://www.mediawiki.org/wiki/API:Imageinfo
- CORS API MediaWiki : https://www.mediawiki.org/wiki/API:Cross-site_requests
- Collection historique Gray's Anatomy : https://commons.wikimedia.org/wiki/Category:Gray%27s_Anatomy_plates
- Servier Medical Art : https://smart.servier.com/
- Licence CC BY 4.0 : https://creativecommons.org/licenses/by/4.0/
- Politique de stockage WebKit (sauvegardes non garanties indéfiniment) : https://webkit.org/blog/14403/updates-to-storage-policy/

---

## 13. Message final à GLM

**Commence par coder le POC.** Ne me livre pas seulement un document de conception ou une liste de dépendances.

Procède dans cet ordre :

**Canvas fonctionnel → import d'un véritable modèle anatomique → calque et comparaison → recherche Commons → persistance → test iPad.**

Si tu dois arbitrer, privilégie toujours la **qualité du dessin**, la **provenance des images** et la **possibilité de reprendre son travail**, plutôt que des fonctionnalités cosmétiques.

Lorsque tu rencontres un blocage technique, explique ce qui a été testé et propose un repli concret. N'invente jamais un résultat de test ni une licence d'image.
