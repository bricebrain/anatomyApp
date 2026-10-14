import { describe, expect, it } from 'vitest';
import { DrawingHistory } from '../features/drawing/engine/history';
import type { Stroke } from '../features/drawing/types';

function fakeStroke(id: string): Stroke {
  return { id, tool: 'pen', color: '#000', width: 4, points: [{ x: 0, y: 0 }] };
}

describe('historique annuler/refaire', () => {
  it('annule et refait un trait ajouté', () => {
    const h = new DrawingHistory();
    h.commit([fakeStroke('a')]);
    expect(h.strokes.map((s) => s.id)).toEqual(['a']);
    const undone = h.undo();
    expect(undone).toEqual([]);
    expect(h.canRedo).toBe(true);
    const redone = h.redo();
    expect(redone?.map((s) => s.id)).toEqual(['a']);
  });

  it('traite un geste de gomme multi-traits comme UNE action', () => {
    const h = new DrawingHistory([fakeStroke('a')]);
    h.commit([fakeStroke('a'), fakeStroke('b'), fakeStroke('c')]);
    // Gomme : b et c disparaissent en une seule action.
    h.commit([fakeStroke('a')]);
    expect(h.strokes.map((s) => s.id)).toEqual(['a']);
    const undone = h.undo();
    expect(undone?.map((s) => s.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('annule un effacement complet', () => {
    const h = new DrawingHistory([fakeStroke('a'), fakeStroke('b')]);
    h.commit([]);
    expect(h.strokes).toEqual([]);
    const undone = h.undo();
    expect(undone?.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('oublie la pile « refaire » après une nouvelle action', () => {
    const h = new DrawingHistory();
    h.commit([fakeStroke('a')]);
    h.undo();
    expect(h.canRedo).toBe(true);
    h.commit([fakeStroke('z')]);
    expect(h.canRedo).toBe(false);
    expect(h.strokes.map((s) => s.id)).toEqual(['z']);
  });

  it('conserve au moins 20 actions (ici 100)', () => {
    const h = new DrawingHistory();
    for (let i = 0; i < 130; i += 1) {
      h.commit([fakeStroke(`s${i}`)]);
    }
    let undos = 0;
    while (h.undo()) {
      undos += 1;
      if (undos > 150) break;
    }
    expect(undos).toBeGreaterThanOrEqual(20);
    expect(undos).toBeLessThanOrEqual(100);
  });
});
