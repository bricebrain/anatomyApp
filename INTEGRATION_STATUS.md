# Statut d’intégration Human-Atlas

## Phase 0 — Audit : terminé

Audit amont, SHA, commandes, licences, compatibilité Three/React et stratégie de port documentés dans `docs/human-atlas-integration-audit.md`.

## Phase 1 — Corps 3D : implémenté, validation iPad restante

- route lazy `/atlas3d` ;
- références masculine et féminine chargées séparément ;
- rendu opaque par système, rotation/zoom/pan, progression, erreur et crédits ;
- destruction explicite des ressources ;
- assets packés synchronisés avec checksums.

## Phase 2 — Recherche, filtres, sélection et isolation : implémenté

- recherche sur nom source, identifiant et vocabulaire français relu ;
- anglais conservé pour les termes non validés ;
- filtres des systèmes réellement présents ;
- sélection concept ↔ meshes, mise en évidence, isolation et recentrage ;
- vues face, dos, côté et trois-quarts.

## Phase 3 — Dessin : implémenté, validation Safari iPad restante

- capture PNG du WebGL sans interface ;
- nouveau projet et Blob persistés dans IndexedDB ;
- caméra, corps, sélection, palette et provenance associés au projet ;
- atelier existant préservé et retour vers `/atlas3d`.

Smoke test navigateur local réalisé : chargement des deux références, recherche
française du cœur, résolution du concept féminin en 14 maillages, isolation,
capture PNG, ouverture dans l’atelier et restauration du contexte au retour.

## Phases 4 à 6 : partielles / non démarrées

Le bouton de révision réutilise les quiz 2D existants lorsqu’une structure curatée correspond. Les véritables questions de picking 3D ne sont pas encore développées. Les modèles GLB existants restent disponibles séparément ; aucun nouvel asset HRA/NIH/Z-Anatomy n’est ajouté sans audit individuel.

## Commandes de preuve

```bash
npm run typecheck
npm test
npm run build
```

La checklist `docs/ipad-test-checklist.md` décrit les essais physiques encore requis. Aucun test Apple Pencil ou performance iPad n’est revendiqué à ce stade.
