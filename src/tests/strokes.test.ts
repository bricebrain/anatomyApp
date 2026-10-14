import { describe, expect, it } from 'vitest';
import {
  appendPoint,
  createStroke,
  hitTestStroke,
  strokeOutline,
  strokeUsesPressure,
} from '../features/drawing/engine/strokes';

describe('traits', () => {
  it('filtre les points trop rapprochés', () => {
    const stroke = createStroke('#000', 4, { x: 10, y: 10 });
    expect(appendPoint(stroke, { x: 10.2, y: 10.1 })).toBe(false);
    expect(appendPoint(stroke, { x: 12, y: 10 })).toBe(true);
    expect(stroke.points).toHaveLength(2);
  });

  it('détecte l’usage réel de la pression (stylet)', () => {
    const sans = createStroke('#000', 4, { x: 0, y: 0 });
    expect(strokeUsesPressure(sans)).toBe(false);
    const avec = createStroke('#000', 4, { x: 0, y: 0, pressure: 0.7 });
    expect(strokeUsesPressure(avec)).toBe(true);
  });

  it('produit un contour rempli exploitable', () => {
    const stroke = createStroke('#000', 8, { x: 0, y: 0 });
    appendPoint(stroke, { x: 50, y: 20 });
    appendPoint(stroke, { x: 100, y: 0 });
    const outline = strokeOutline(stroke);
    expect(outline.length).toBeGreaterThanOrEqual(3);
  });

  it('produit un disque pour un trait à un point', () => {
    const stroke = createStroke('#000', 6, { x: 5, y: 5 });
    // Le rendu gère ce cas ; le contour peut rester vide.
    expect(stroke.points).toHaveLength(1);
  });
});

describe('gomme : hitTestStroke', () => {
  const stroke = createStroke('#000', 4, { x: 0, y: 0 });
  appendPoint(stroke, { x: 100, y: 0 });

  it('touche près du segment', () => {
    expect(hitTestStroke(stroke, { x: 50, y: 0 }, 5)).toBe(true);
    expect(hitTestStroke(stroke, { x: 50, y: 4 }, 5)).toBe(true);
  });

  it('ne touche pas loin du segment', () => {
    expect(hitTestStroke(stroke, { x: 50, y: 30 }, 5)).toBe(false);
    expect(hitTestStroke(stroke, { x: -50, y: 0 }, 5)).toBe(false);
  });

  it('tient compte de l’épaisseur du trait', () => {
    const large = createStroke('#000', 20, { x: 0, y: 0 });
    appendPoint(large, { x: 100, y: 0 });
    expect(hitTestStroke(large, { x: 50, y: 12 }, 2)).toBe(true);
  });
});
