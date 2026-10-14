# Mon carnet d’anatomie

PWA iPad (React + Vite + TypeScript) pour **apprendre l’anatomie humaine en la dessinant**.
Atelier de dessin Canvas (Apple Pencil / doigt / souris), bibliothèque de planches
réelles, catalogue anatomique, quiz de localisation et explorateur 3D à 360°.

## Lancer le projet

```bash
npm install
npm run dev        # développement (npm run dev:lan pour l'accès depuis l'iPad)
npm run build      # typecheck + build de production (dist/)
npm test           # suite Vitest (85 tests)
```

Ouvrir `http://localhost:5173/` (ou l'adresse LAN affichée par `dev:lan`)
dans Safari iPad pour tester en conditions réelles.

## Fonctionnalités

### Atelier de dessin (POC initial)
- Dessin au stylet/doigt/souris, gomme, zoom/déplacement, grille ;
- calque modèle réglable (opacité, masquage), modes **Calque** et **Côte à côte** ;
- annuler/refaire, sauvegarde locale IndexedDB (Dexie), export PNG
  (dessin seul, fond blanc, ou composite avec le modèle) ;
- bibliothèque : sélection locale vérifiée, recherche Wikimedia Commons
  (licences filtrées), import de fichiers personnels.

### Extension 2026-10 — catalogue, quiz, 3D
- **Explorer le corps** (`#/explorer`) : carte du corps interactive (dessin
  d'interface original), navigation région → système → structure, recherche
  française (synonymes), filtres (niveau, 2D, 3D), fiche par structure avec
  planches sourcées et actions *Dessiner* / *Voir en 3D* / *Réviser* ;
- **Quiz d'anatomie** (`#/quiz`) : modes « Toucher la zone » (schéma
  squelettique interactif original) et « Nommer la structure » (4 choix de
  même catégorie), séances de 3/5/10 questions, feedback immédiat avec
  explication, bilan, *Revoir mes erreurs*, *Dessiner de mémoire*,
  résultats sauvegardés localement ;
- **Explorateur 3D** (`#/modeles3d`) : catalogue de quatre modèles GLB
  (cœur, crâne, cerveau et poumons), rotation/zoom tactiles via
  `@google/model-viewer` (lazy-loadé), **« Utiliser cette vue pour dessiner »**
  (capture WebGL → référence 2D dans l'atelier) et repli 2D si WebGL échoue ;
- accueil personnalisé pour Eva, avec accès direct aux quatre activités et
  reprise du dernier dessin.

## Architecture

```text
src/
  app/                      React Router, thème MUI v5, providers
  pages/                    accueil, bibliothèque, atelier
  features/
    home/                   composants d'accueil + hook React Query
    drawing/                moteur Canvas (traits, caméra, export, historique)
    projects/               DrawingProject + IndexedDB (Dexie) + fichiers Blob
    library/                catalogue local vérifié, Commons, import, startDrawing
    anatomy/                RÉFÉRENTIEL commun (structures, assets 3D) + Explorer
    quiz/                   questions validées, schéma interactif, séances, résultats
    anatomy3d/              visionneuse (encapsule model-viewer), capture → atelier
public/
  anatomy/                  planches vérifiées + catalog.json (licences)
  anatomy3d/                quatre GLB locaux + aperçus
```

**Référentiel unique** : les structures anatomiques (`src/features/anatomy/`)
sont partagées par la navigation, le quiz et les fiches — pas trois bases.
Un `DrawingProject` peut référencer une structure (`anatomyStructureId`,
champ optionnel : les anciens dessins restent lisibles sans migration).

Les métadonnées techniques des ressources restent conservées dans le code et
dans les projets enregistrés, sans encombrer l'interface personnelle.

Le build et les tests automatisés sont vérifiés. Les gestes Apple Pencil,
la fluidité et la mémoire sur iPad réel doivent encore être validés sur l'appareil.
# anatomyApp
