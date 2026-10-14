import { describe, expect, it } from 'vitest';
import {
  screenToDoc,
  docToScreen,
  fitCamera,
  zoomAroundPoint,
  panCamera,
  clampScale,
  sharedFitCamera,
} from '../features/drawing/engine/coordinates';

describe('coordonnées écran ↔ document', () => {
  it('fait l’aller-retour sans perte', () => {
    const camera = { scale: 2.5, offsetX: 120, offsetY: -40 };
    const p = { x: 333, y: -17 };
    const round = screenToDoc(docToScreen(p, camera), camera);
    expect(round.x).toBeCloseTo(p.x, 8);
    expect(round.y).toBeCloseTo(p.y, 8);
  });

  it('cite le repère du cahier des charges : screen = doc * scale + offset', () => {
    const camera = { scale: 3, offsetX: 10, offsetY: 20 };
    expect(docToScreen({ x: 5, y: 7 }, camera)).toEqual({ x: 25, y: 41 });
    expect(screenToDoc({ x: 25, y: 41 }, camera)).toEqual({ x: 5, y: 7 });
  });
});

describe('fitCamera (contenir + centrer)', () => {
  it('contient le document avec marge', () => {
    const cam = fitCamera(1000, 2000, 500, 400, 20);
    // Limité par la hauteur : (400 - 2×20) / 2000.
    expect(cam.scale).toBeCloseTo(360 / 2000, 6);
    expect(1000 * cam.scale).toBeLessThanOrEqual(460 + 1e-6);
    expect(2000 * cam.scale).toBeLessThanOrEqual(360 + 1e-6);
  });

  it('centre le document', () => {
    const cam = fitCamera(1000, 1000, 800, 600, 0);
    expect(1000 * cam.scale + 2 * cam.offsetX).toBeCloseTo(800, 6);
    expect(1000 * cam.scale + 2 * cam.offsetY).toBeCloseTo(600, 6);
  });
});

describe('zoomAroundPoint', () => {
  it('garde le point d’ancrage fixe à l’écran', () => {
    const camera = { scale: 1, offsetX: 50, offsetY: 50 };
    const anchor = { x: 137, y: 99 };
    const zoomed = zoomAroundPoint(camera, 2, anchor);
    expect(docToScreen(screenToDoc(anchor, camera), zoomed)).toEqual(anchor);
  });

  it('born l’échelle', () => {
    expect(clampScale(50)).toBe(12);
    expect(clampScale(0.001)).toBe(0.1);
  });
});

describe('panCamera', () => {
  it('translate l’offset', () => {
    expect(panCamera({ scale: 1, offsetX: 0, offsetY: 0 }, 30, -10)).toEqual({
      scale: 1,
      offsetX: 30,
      offsetY: -10,
    });
  });
});

describe('sharedFitCamera (mode Côte à côte)', () => {
  it('utilise la même échelle non déformante des deux côtés', () => {
    const { left, right, scale } = sharedFitCamera(800, 600, 400, 700, 900, 300);
    expect(left.scale).toBe(right.scale);
    // Le panneau le plus contraint est la hauteur du panneau droit (marge 24).
    expect(scale).toBeCloseTo(Math.min((400 - 48) / 800, (300 - 48) / 600), 6);
    // Le document doit tenir dans chaque panneau (marge déduite).
    expect(800 * scale).toBeLessThanOrEqual(400 - 48 + 1e-6);
    expect(600 * scale).toBeLessThanOrEqual(700 - 48 + 1e-6);
    expect(800 * scale).toBeLessThanOrEqual(900 - 48 + 1e-6);
    expect(600 * scale).toBeLessThanOrEqual(300 - 48 + 1e-6);
  });
});
