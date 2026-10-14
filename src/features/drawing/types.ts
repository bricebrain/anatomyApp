/**
 * Types du moteur de dessin.
 *
 * Règle essentielle (cahier des charges §6.2) : les traits sont stockés en
 * COORDONNÉES DOCUMENT (le papier virtuel), jamais en coordonnées écran.
 * Le zoom, le déplacement et la rotation d'écran ne peuvent ainsi jamais
 * désaligner le modèle et les traits.
 */

/** Caméra : transformation document → écran. */
export type Camera = {
  /** Échelle document → écran (1 = pixels document) */
  scale: number;
  /** Translation en pixels ÉCRAN appliquée après l'échelle. */
  offsetX: number;
  offsetY: number;
};

export type StrokePoint = {
  /** Coordonnées de page (document), pas coordonnées de l'écran. */
  x: number;
  y: number;
  /** Pression 0..1 si disponible (Apple Pencil), sinon absente. */
  pressure?: number;
};

export type StrokeTool = 'pen';

export type Stroke = {
  id: string;
  tool: StrokeTool;
  color: string;
  /** Épaisseur logique en pixels document (2, 4, 8, 14…). */
  width: number;
  points: StrokePoint[];
};

export type DrawingToolId = 'pen' | 'eraser' | 'pan';

export type ViewMode = 'trace' | 'side-by-side';

export const PEN_SIZES = [2, 4, 8, 14] as const;

export const PEN_COLORS = [
  { id: 'noir', label: 'Noir', value: '#221d18' },
  { id: 'sanguine', label: 'Sanguine', value: '#8a4a2f' },
  { id: 'rouge', label: 'Rouge', value: '#b3372b' },
  { id: 'bleu', label: 'Bleu', value: '#28527a' },
  { id: 'vert', label: 'Vert', value: '#2f6b4f' },
  { id: 'gris', label: 'Gris', value: '#5b6770' },
  { id: 'rose', label: 'Rose', value: '#e0407f' },
  { id: 'violet', label: 'Violet', value: '#8b55d6' },
] as const;

/** Couleurs proposées dans la palette (au moins noir, bleu, rouge — §6.5). */
export const PALETTE_COLORS: string[] = PEN_COLORS.map((c) => c.value);

/** Document par défaut (page blanche, ratio ~A4 portrait). */
export const BLANK_DOCUMENT = { width: 1400, height: 1800 } as const;

/** Taille maximale du côté long d'un document créé à partir d'un modèle. */
export const MODEL_DOCUMENT_MAX_SIDE = 2048;
export const MODEL_DOCUMENT_MIN_SIDE = 900;
