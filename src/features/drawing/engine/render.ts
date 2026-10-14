import type { Camera, Stroke } from '../types';
import { strokeOutline } from './strokes';

/**
 * Rendu Canvas 2D d'un document (modèle + traits), en tenant compte du
 * devicePixelRatio pour la netteté Retina (§6.4).
 */

export type RenderBackground = 'paper' | 'white' | 'transparent';

export type ModelRenderInfo = {
  image: CanvasImageSource | null;
  /** Rectangle du document couvert par le modèle (letterbox centré). */
  rect: { x: number; y: number; width: number; height: number };
  opacity: number;
  visible: boolean;
};

export type SceneRenderOptions = {
  docWidth: number;
  docHeight: number;
  strokes: readonly Stroke[];
  model: ModelRenderInfo | null;
  camera: Camera;
  /** Taille CSS de la zone d'affichage (px). */
  viewWidth: number;
  viewHeight: number;
  dpr: number;
  background: RenderBackground;
};

export const PAPER_COLOR = '#fdfaf3';

function applyCameraTransform(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  dpr: number,
): void {
  ctx.setTransform(
    dpr * camera.scale,
    0,
    0,
    dpr * camera.scale,
    dpr * camera.offsetX,
    dpr * camera.offsetY,
  );
}

/** Dessine un trait (contour rempli perfect-freehand) dans le repère document. */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  camera: Camera,
  dpr = 1,
): void {
  const outline = strokeOutline(stroke);
  ctx.save();
  applyCameraTransform(ctx, camera, dpr);
  ctx.fillStyle = stroke.color;
  if (outline.length < 3) {
    // Trait réduit à un point : dessiner un disque.
    const p = stroke.points[0];
    if (p) {
      ctx.beginPath();
      const r = Math.max(stroke.width / 2, 0.6);
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i += 1) {
      ctx.lineTo(outline[i][0], outline[i][1]);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Fond + ombre portée discrète du papier. */
function drawPaper(ctx: CanvasRenderingContext2D, opts: SceneRenderOptions): void {
  const { camera, dpr, docWidth, docHeight, viewWidth, viewHeight } = opts;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (opts.background === 'transparent') {
    ctx.clearRect(0, 0, viewWidth, viewHeight);
  } else {
    ctx.fillStyle = '#fbe4ee';
    ctx.fillRect(0, 0, viewWidth, viewHeight);
    ctx.shadowColor = 'rgba(173, 33, 92, 0.18)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = opts.background === 'white' ? '#ffffff' : PAPER_COLOR;
    ctx.fillRect(
      camera.offsetX,
      camera.offsetY,
      docWidth * camera.scale,
      docHeight * camera.scale,
    );
    ctx.shadowColor = 'transparent';
  }
  ctx.restore();
}

/** Rendu complet d'une scène (utilisé par la couche statique et l'export). */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  opts: SceneRenderOptions,
): void {
  drawPaper(ctx, opts);
  const { model } = opts;
  if (model && model.visible && model.image) {
    ctx.save();
    applyCameraTransform(ctx, opts.camera, opts.dpr);
    ctx.globalAlpha = model.opacity;
    ctx.drawImage(
      model.image,
      model.rect.x,
      model.rect.y,
      model.rect.width,
      model.rect.height,
    );
    ctx.restore();
  }
  for (const stroke of opts.strokes) {
    drawStroke(ctx, stroke, opts.camera, opts.dpr);
  }
}

/** Grille de repère (couche interface — jamais exportée). */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  viewWidth: number,
  viewHeight: number,
  dpr: number,
): void {
  const step = 100; // px document
  const scaledStep = step * camera.scale;
  if (scaledStep < 14) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.beginPath();
  const startX = camera.offsetX % scaledStep;
  const startY = camera.offsetY % scaledStep;
  for (let x = startX; x < viewWidth; x += scaledStep) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewHeight);
  }
  for (let y = startY; y < viewHeight; y += scaledStep) {
    ctx.moveTo(0, y);
    ctx.lineTo(viewWidth, y);
  }
  ctx.strokeStyle = 'rgba(90, 70, 40, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** Curseur de la gomme (couche interface). */
export function drawEraserCursor(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  radius: number,
  dpr: number,
): void {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(60, 45, 30, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(60, 45, 30, 0.06)';
  ctx.fill();
  ctx.restore();
}
