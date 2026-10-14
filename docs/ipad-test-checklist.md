# Checklist iPad — Human-Atlas

Statut au 15 octobre 2026 : les vérifications navigateur automatisées/desktop peuvent être renseignées pendant le développement. Les lignes « iPad physique » restent volontairement non cochées jusqu’à un essai réel.

## Fonctionnel

- [ ] iPad physique — ouvrir `/atlas3d` en portrait et paysage.
- [ ] iPad physique — rotation à un doigt sans scroll parasite.
- [ ] iPad physique — pincement et déplacement à deux doigts.
- [ ] iPad physique — un drag ne déclenche pas une sélection.
- [ ] iPad physique — rechercher et isoler cœur, crâne, humérus et fémur.
- [ ] iPad physique — alterner les corps sans fermeture Safari.
- [ ] iPad physique — capturer une vue puis dessiner et recharger le projet.
- [ ] iPad physique — revenir à l’atlas depuis l’atelier.

## Performance et robustesse

- [ ] Relever modèle d’iPad et version iPadOS/Safari.
- [ ] Mesurer temps du premier affichage et volume transféré.
- [ ] Observer la fluidité pendant 60 s de rotation/zoom.
- [ ] Ouvrir/fermer la route cinq fois et surveiller la mémoire.
- [ ] Tester une perte de réseau pendant le chargement.
- [ ] Tester une perte de contexte WebGL et le message de reprise.
- [ ] Mesurer durée et taille d’une capture PNG.

Objectif indicatif : interaction perçue autour de 30 FPS ou plus sur l’iPad cible. Ce seuil n’est pas déclaré atteint avant mesure.
