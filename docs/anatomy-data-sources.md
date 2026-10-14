# Sources de données anatomiques 3D

## Human-Atlas

- Dépôt : <https://github.com/slorksmo/Human-Atlas>
- Révision intégrée : `5bb5713aab18d7fe9380c3339eb09f173491ea06`
- Code porté : MIT, © 2026 ashemag.
- Modifications : intégration React 18/Vite 5, interface MUI française, palette pédagogique opaque, capture PNG et persistance IndexedDB. Le batching GPU, les textures de visibilité/sélection et le picking par mesh sont conservés.

### Corps masculin

- Dataset : BodyParts3D 4.0, © The Database Center for Life Science.
- Licence : [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Source : <https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html>
- Fichiers distribués : `atlas.json` et `body-0..14.bin.gz`, environ 33 Mo.
- Adaptations amont : axes/unités convertis, simplification meshoptimizer à 0,2 %, normales quantifiées et géométrie regroupée en chunks.

### Corps féminin

- Dataset principal : Human Reference Atlas, *3D Reference Organ Set for Female* v1.10, Kristen Browne et Heidi Schlehlein, fondé sur le Visible Human Dataset.
- Licence : CC BY 4.0.
- Source : <https://humanatlas.io/3d-reference-library>
- Compléments : huit structures pelviennes de HRA v1.5, 180 os issus de BodyParts3D et 76 muscles du membre inférieur issus d’Andreassen et al. (2023). Ces apports restent classés dans des systèmes distincts dans l’interface.
- Fichiers distribués : `atlas-female.json` et `female-0..14.bin.gz`, environ 34 Mo.

Les deux références proviennent de projets et de personnes distincts. Elles ne doivent pas être interprétées comme deux scans directement comparables. L’application est éducative et non clinique.

## Traçabilité locale

`public/models/SHA256SUMS.txt` contient l’empreinte de chaque manifeste et chunk copié. La commande `npm run sync:human-atlas` refuse toute révision amont différente du SHA audité. Aucun fichier `.bin` brut n’est redistribué et le service worker ne met pas les modèles en cache implicitement.

Les modèles GLB historiques de l’application restent gérés dans leur catalogue indépendant. HRA, NIH 3D et Z-Anatomy ne sont pas fusionnés automatiquement dans le corps packed.
