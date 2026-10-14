# Attribution des données Human-Atlas

Les géométries de ce dossier proviennent du projet
[Human-Atlas](https://github.com/slorksmo/Human-Atlas), révision
`5bb5713aab18d7fe9380c3339eb09f173491ea06`. Le code adapté du viewer est
distribué sous licence MIT, © 2026 ashemag. Les données anatomiques ci-dessous
sont distribuées sous [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Référence masculine

BodyParts3D, © The Database Center for Life Science.

- Dataset : <https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html>
- Licence : <https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html>
- Publication : Mitsuhashi et al. (2009), *BodyParts3D: 3D structure database
  for anatomical concepts*, <https://doi.org/10.1093/nar/gkn613>.

Adaptations amont : millimètres/Z-up convertis en mètres/Y-up, géométrie
simplifiée avec meshoptimizer (erreur relative 0,2 % par structure), normales
quantifiées et maillages regroupés en chunks binaires. Les identifiants FMA et
les identités des meshes restent présents dans le manifeste.

## Référence féminine

Kristen Browne et Heidi Schlehlein, Human Reference Atlas / HuBMAP,
*3D Reference Organ Set for Female* v1.10, fondé sur le Visible Human Dataset.

- Bibliothèque : <https://humanatlas.io/3d-reference-library>
- Publication HRA : <https://doi.org/10.1038/s41597-022-01905-2>
- Licence : CC BY 4.0.

Huit structures pelviennes absentes de la v1.10 proviennent de la v1.5. La
référence est composite et n’a pas la même couverture que le corps masculin.

### Muscles du membre inférieur

Thor E. Andreassen, Donald R. Hume, Landon D. Hamilton, Karen E. Walker,
Sean E. Higinbotham et Kevin B. Shelburne, *Three Dimensional Lower Extremity
Musculoskeletal Geometry of the Visible Human Female and Male* (2023),
<https://doi.org/10.1038/s41597-022-01905-2>, CC BY 4.0.

76 muscles d’une seconde femme ont été ajustés sur les os partagés. Ils restent
classés dans le système distinct « Muscles de jambe (donneuse) ».

### Os empruntés

180 os absents de la source féminine (crâne, côtes, ceinture scapulaire, bras,
mains et pieds) proviennent de BodyParts3D. Ils sont ajustés par région et
restent classés comme « Os dérivés du modèle masculin ». Ils constituent des
repères de forme et de position, pas l’anatomie propre de cette référence.

Ces deux corps viennent de projets et de personnes distincts. Ils ne sont pas
deux scans directement comparables et ne constituent pas un outil clinique.
