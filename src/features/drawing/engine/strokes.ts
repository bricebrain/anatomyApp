import { getStroke, type StrokeOptions } from 'perfect-freehand';
import type { Stroke, StrokePoint } from '../types';
import type { DocPoint } from './coordinates';

/**
 * Géométrie et lissage des traits.
 *
 * Les traits restent VECTORIELS (suite de points + épaisseur + couleur) et ne
 * sont convertis en contour rempli (perfect-freehand) qu'au moment du rendu.
 * Un Apple Pencil sans donnée de pression obtient une épaisseur constante de
 * secours (cahier des charges §6.3).
 */

let strokeCounter = 0;
export function newStrokeId(): string {
  strokeCounter += 1;
  return `s-${Date.now().toString(36)}-${strokeCounter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function createStroke(
  color: string,
  width: number,
  firstPoint: StrokePoint,
): Stroke {
  return {
    id: newStrokeId(),
    tool: 'pen',
    color,
    width,
    points: [firstPoint],
  };
}

/** Distance minimale (px document) entre deux points enregistrés. */
const MIN_POINT_DISTANCE = 1.2;

/**
 * Ajoute un point si assez éloigné du précédent (évite les doublons quand le
 * pointeur est immobile) ; toujours filtré, la pression pouvant différer.
 */
export function appendPoint(stroke: Stroke, point: StrokePoint): boolean {
  const last = stroke.points[stroke.points.length - 1];
  if (last) {
    const dx = point.x - last.x;
    const dy = point.y - last.y;
    if (dx * dx + dy * dy < MIN_POINT_DISTANCE * MIN_POINT_DISTANCE) {
      return false;
    }
  }
  stroke.points.push(point);
  return true;
}

function strokeOptions(stroke: Stroke, penPressure: boolean): StrokeOptions {
  return {
    size: stroke.width,
    thinning: penPressure ? 0.6 : 0,
    smoothing: 0.5,
    streamline: 0.35,
    // Si aucun vrai stylet : perfect-freehand simule une pression plausible
    // à partir de la vitesse, pour un trait vivant même à la souris.
    simulatePressure: !penPressure,
    easing: (t) => Math.sin((t * Math.PI) / 2),
  };
}

/** Le trait utilise-t-il une vraie pression (stylet) ? */
export function strokeUsesPressure(stroke: Stroke): boolean {
  return stroke.points.some((p) => typeof p.pressure === 'number' && p.pressure > 0);
}

/**
 * Contour rempli du trait (polygone perfect-freehand), en coordonnées DOCUMENT.
 */
export function strokeOutline(stroke: Stroke): Array<[number, number]> {
  const penPressure = strokeUsesPressure(stroke);
  return getStroke(stroke.points, strokeOptions(stroke, penPressure)) as Array<
    [number, number]
  >;
}

/**
 * Test de collision pour la gomme « par trait entier » (§6.5) :
 * vrai si `p` est à moins de `radius` (px document) du polyline du trait.
 */
export function hitTestStroke(stroke: Stroke, p: DocPoint, radius: number): boolean {
  const r = radius + stroke.width / 2;
  const r2 = r * r;
  const pts = stroke.points;
  if (pts.length === 1) {
    const dx = p.x - pts[0].x;
    const dy = p.y - pts[0].y;
    return dx * dx + dy * dy <= r2;
  }
  for (let i = 1; i < pts.length; i += 1) {
    if (distanceToSegmentSq(p, pts[i - 1], pts[i]) <= r2) return true;
  }
  return false;
}

function distanceToSegmentSq(
  p: DocPoint,
  a: StrokePoint,
  b: StrokePoint,
): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const lengthSq = abx * abx + aby * aby;
  if (lengthSq === 0) {
    return apx * apx + apy * apy;
  }
  let t = (apx * abx + apy * aby) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const cx = apx - t * abx;
  const cy = apy - t * aby;
  return cx * cx + cy * cy;
}

/** Rayon de la gomme en px document pour un rayon écran donné. */
export function eraserDocRadius(screenRadius: number, scale: number): number {
  return screenRadius / Math.max(scale, 0.001);
}

/** Nombre total de points (diagnostic et tests). */
export function countPoints(strokes: Stroke[]): number {
  return strokes.reduce((n, s) => n + s.points.length, 0);
}
