import type { ImageHotspot } from '../types';

/**
 * Schéma squelettique INTERACTIF original — dessin d'interface stylisé,
 * volontairement simplifié (pas une référence médicale détaillée).
 *
 * Rôle central (§2.2 B1/B2) : chaque partie est INDIVIDUELLEMENT
 * SÉLECTIONNABLE. Les zones sont les formes vectorielles mêmes du schéma
 * (coordonnées du viewBox, jamais du viewport) : l'alignement survit au
 * zoom, aux marges `object-fit` et au passage portrait/paysage (B02),
 * parce que le SVG se met à l'échelle en bloc.
 *
 * Convention d'orientation : le sujet fait face au spectateur — la gauche
 * du schéma correspond donc au côté DROIT du sujet. Aucune question ne
 * demande « à gauche/à droite » pour éviter toute ambiguïté (§2.4).
 */

export const SKELETON_VIEWBOX = { width: 500, height: 1000 } as const;
export const SKELETON_ASSET_ID = 'skeleton-front-local';

export type Shape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
  | { kind: 'polygon'; points: Array<{ x: number; y: number }> };

export type SchematicPart = {
  /** ID de structure du référentiel, ou ID de zone neutre ('zone-…'). */
  id: string;
  /** Étiquette française affichée dans les retours du quiz. */
  labelFr: string;
  /** Une structure du référentiel (zone scorée en B1) si non vide. */
  structureId?: string;
  shapes: Shape[];
  /** Ordre de rendu (les formes suivantes passent au-dessus). */
  z: number;
};

const poly = (...pts: Array<[number, number]>) =>
  pts.map(([x, y]) => ({ x, y }));

export const skeletonParts: SchematicPart[] = [
  {
    id: 'crane',
    labelFr: 'le crâne',
    structureId: 'crane',
    z: 10,
    shapes: [
      { kind: 'ellipse', cx: 250, cy: 55, rx: 44, ry: 46 },
      { kind: 'rect', x: 230, y: 88, w: 40, h: 30, rx: 12 },
    ],
  },
  {
    id: 'mandibule',
    labelFr: 'la mandibule',
    structureId: 'mandibule',
    z: 20,
    shapes: [
      {
        kind: 'polygon',
        points: poly(
          [218, 95], [282, 95], [278, 118], [262, 136],
          [250, 141], [238, 136], [222, 118],
        ),
      },
    ],
  },
  {
    id: 'clavicules',
    labelFr: 'les clavicules',
    z: 15,
    shapes: [
      { kind: 'polygon', points: poly([246, 166], [180, 156], [178, 167], [244, 177]) },
      { kind: 'polygon', points: poly([254, 166], [320, 156], [322, 167], [256, 177]) },
    ],
  },
  {
    id: 'colonne',
    labelFr: 'la colonne vertébrale',
    structureId: 'colonne',
    z: 5,
    shapes: [{ kind: 'rect', x: 239, y: 146, w: 22, h: 292, rx: 9 }],
  },
  {
    id: 'cage-thoracique',
    labelFr: 'la cage thoracique',
    z: 6,
    shapes: [
      {
        kind: 'polygon',
        points: poly(
          [238, 170], [180, 195], [163, 245], [180, 298], [238, 322],
        ),
      },
      {
        kind: 'polygon',
        points: poly(
          [262, 170], [320, 195], [337, 245], [320, 298], [262, 322],
        ),
      },
    ],
  },
  {
    // Rendu après le bassin : les têtes fémorales passent dessous.
    id: 'femur',
    labelFr: 'le fémur',
    structureId: 'femur',
    z: 12,
    shapes: [
      { kind: 'polygon', points: poly([185, 538], [213, 538], [196, 700], [168, 700]) },
      { kind: 'polygon', points: poly([315, 538], [287, 538], [304, 700], [332, 700]) },
    ],
  },
  {
    id: 'bassin',
    labelFr: 'le bassin',
    structureId: 'bassin',
    z: 16,
    shapes: [
      {
        kind: 'polygon',
        points: poly(
          [250, 438], [200, 455], [172, 500], [178, 545],
          [205, 562], [232, 540], [250, 520],
        ),
      },
      {
        kind: 'polygon',
        points: poly(
          [250, 438], [300, 455], [328, 500], [322, 545],
          [295, 562], [268, 540], [250, 520],
        ),
      },
    ],
  },
  {
    id: 'humerus',
    labelFr: "l'humérus",
    structureId: 'humerus',
    z: 8,
    shapes: [
      { kind: 'polygon', points: poly([160, 180], [186, 180], [172, 334], [146, 334]) },
      { kind: 'polygon', points: poly([340, 180], [314, 180], [328, 334], [354, 334]) },
    ],
  },
  {
    id: 'radius',
    labelFr: 'le radius',
    structureId: 'radius',
    z: 8,
    shapes: [
      // Bras droit du sujet (à gauche du spectateur) : radius latéral (extérieur).
      { kind: 'polygon', points: poly([140, 348], [158, 348], [150, 484], [132, 484]) },
      // Bras gauche du sujet : miroir.
      { kind: 'polygon', points: poly([360, 348], [342, 348], [350, 484], [368, 484]) },
    ],
  },
  {
    id: 'cubitus',
    labelFr: 'le cubitus',
    structureId: 'cubitus',
    z: 8,
    shapes: [
      { kind: 'polygon', points: poly([166, 348], [184, 348], [176, 484], [158, 484]) },
      { kind: 'polygon', points: poly([334, 348], [316, 348], [324, 484], [342, 484]) },
    ],
  },
  {
    id: 'main',
    labelFr: 'la main',
    structureId: 'main',
    z: 8,
    shapes: [
      { kind: 'ellipse', cx: 141, cy: 508, rx: 21, ry: 30 },
      { kind: 'ellipse', cx: 359, cy: 508, rx: 21, ry: 30 },
    ],
  },
  {
    id: 'rotule',
    labelFr: 'la rotule',
    structureId: 'rotule',
    z: 30,
    shapes: [
      { kind: 'ellipse', cx: 182, cy: 712, rx: 15, ry: 13 },
      { kind: 'ellipse', cx: 318, cy: 712, rx: 15, ry: 13 },
    ],
  },
  {
    id: 'tibia-fibula',
    labelFr: 'le tibia et la fibula',
    z: 7,
    shapes: [
      { kind: 'rect', x: 170, y: 726, w: 40, h: 150, rx: 18 },
      { kind: 'rect', x: 156, y: 732, w: 10, h: 138, rx: 5 },
      { kind: 'rect', x: 290, y: 726, w: 40, h: 150, rx: 18 },
      { kind: 'rect', x: 334, y: 732, w: 10, h: 138, rx: 5 },
    ],
  },
  {
    id: 'pieds',
    labelFr: 'les pieds',
    z: 7,
    shapes: [
      { kind: 'ellipse', cx: 178, cy: 902, rx: 30, ry: 17 },
      { kind: 'ellipse', cx: 322, cy: 902, rx: 30, ry: 17 },
    ],
  },
];

/** Parties triées par ordre de rendu (z croissant). */
export const skeletonPartsInRenderOrder: SchematicPart[] = [...skeletonParts].sort(
  (a, b) => a.z - b.z,
);

export function partByStructureId(structureId: string): SchematicPart | undefined {
  return skeletonParts.find((p) => p.structureId === structureId);
}

/** Enveloppe polygonale (normalisée) d'une forme — hotspots de données. */
function shapePolygon(shape: Shape): Array<{ x: number; y: number }> {
  const { width: W, height: H } = SKELETON_VIEWBOX;
  const norm = (pts: Array<{ x: number; y: number }>) =>
    pts.map((p) => ({ x: p.x / W, y: p.y / H }));
  switch (shape.kind) {
    case 'polygon':
      return norm(shape.points);
    case 'rect': {
      const { x, y, w, h } = shape;
      return norm([
        { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
      ]);
    }
    case 'ellipse': {
      // Octogone inscrit — approximation honnête pour les données.
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI / 4) * i;
        pts.push({
          x: shape.cx + shape.rx * Math.cos(angle),
          y: shape.cy + shape.ry * Math.sin(angle),
        });
      }
      return norm(pts);
    }
  }
}

/**
 * Hotspots normalisés [0, 1] dérivés du schéma (source unique) : une entrée
 * par structure du référentiel présente dans le schéma. L'évaluation
 * interactive utilise le hit-testing SVG natif ; ces polygones servent de
 * référence de données et aux tests.
 */
export function skeletonHotspots(): ImageHotspot[] {
  return skeletonParts
    .filter((p) => p.structureId)
    .map((p) => ({
      structureId: p.structureId as string,
      polygon: p.shapes.flatMap(shapePolygon),
    }));
}
