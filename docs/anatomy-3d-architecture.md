# Architecture de l’atlas 3D

## Flux principal

La route lazy `/atlas3d` charge un manifeste avec React Query. Le hook `useHumanAtlasExplorer` porte l’état métier (référence, systèmes visibles, concept sélectionné, isolation et recherche). Les composants MUI restent présentatifs.

Le renderer Three.js vit dans `src/features/anatomy/atlas/engine/`. Il reprend les principes du moteur amont :

1. téléchargement parallèle de trois chunks ;
2. décodage gzip contrôlé par signature ;
3. regroupement des géométries par système et chunk ;
4. texture GPU par structure pour visibilité et sélection ;
5. maillages individuels non rendus uniquement pour le raycasting ;
6. distinction tap/drag/pincement avant le picking ;
7. destruction des buffers, matériaux, listeners, contrôles et renderer au démontage.

La sélection UI manipule un concept stable (`human-atlas:<body>:<conceptId>`) et non le seul nom affiché. Un concept peut regrouper plusieurs meshes. Les traductions françaises sont une liste relue ; le nom source anglais est conservé en fallback.

## Capture et atelier

`exportSnapshot()` force un rendu WebGL sans décor ni contrôle, puis produit un Blob PNG dans la même tâche. `atlasSnapshotToDrawing` :

- valide le décodage du PNG ;
- stocke le Blob et son asset dans IndexedDB ;
- crée un nouveau projet, sans remplacer un dessin existant ;
- persiste corps, concept sélectionné, caméra, palette et provenance dans le champ optionnel `anatomyReference` ;
- ouvre l’atelier Canvas existant.

Les anciens projets restent lisibles : aucun nouvel index Dexie ni migration destructive n’est requis.

## Cache et mémoire

Un seul corps est monté à la fois. Le changement de référence détruit le contexte précédent. `/models/` est exclu du cache automatique du service worker. Les deux manifestes peuvent rester dans le cache mémoire limité de React Query, mais pas les buffers GPU ni les réponses binaires.
