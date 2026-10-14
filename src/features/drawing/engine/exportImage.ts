import type { Stroke } from '../types';
import { renderScene, type ModelRenderInfo } from './render';

/**
 * Export PNG (§6.7). Les images sont re-rendues depuis des sources LOCALES
 * (HTMLImageElement chargé via un Blob IndexedDB ou un fichier importé) :
 * jamais d'URL distante directe sur le canvas → pas de *tainted canvas*.
 */

export type ExportOptions = {
  docWidth: number;
  docHeight: number;
  strokes: readonly Stroke[];
  model: ModelRenderInfo | null;
  background: 'transparent' | 'white';
};

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('L’export PNG a échoué (toBlob a renvoyé null).'));
    }, 'image/png');
  });
}

/** Rend le document à sa taille native et renvoie le canvas. */
export function renderExportCanvas(opts: ExportOptions): HTMLCanvasElement {
  const canvas = createCanvas(opts.docWidth, opts.docHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible pour l’export.');
  const camera = { scale: 1, offsetX: 0, offsetY: 0 };
  renderScene(ctx, {
    docWidth: opts.docWidth,
    docHeight: opts.docHeight,
    strokes: opts.strokes,
    model: opts.model,
    camera,
    viewWidth: opts.docWidth,
    viewHeight: opts.docHeight,
    dpr: 1,
    background: opts.background,
  });
  return canvas;
}

export async function exportDrawingPng(
  opts: Omit<ExportOptions, 'model'>,
): Promise<Blob> {
  return canvasToPngBlob(renderExportCanvas({ ...opts, model: null }));
}

export async function exportCompositePng(
  opts: Omit<ExportOptions, 'background'> & { background?: 'white' },
): Promise<Blob> {
  return canvasToPngBlob(
    renderExportCanvas({ ...opts, background: 'white' }),
  );
}

/** Déclenche le téléchargement (attribut download — géré par Safari iPadOS). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function safeFilename(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
  return cleaned || 'dessin';
}
