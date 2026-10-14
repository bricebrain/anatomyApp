import type { Camera } from '../types';

/**
 * Conversions écran ↔ document.
 *
 * Convention : screen = (doc * scale) + offset
 * (l'offset est exprimé en pixels écran, ce qui rend le zoom autour d'un
 * point simple et évite les accumulations d'erreurs flottantes).
 */

export type ScreenPoint = { x: number; y: number };
export type DocPoint = { x: number; y: number };

export function screenToDoc(p: ScreenPoint, camera: Camera): DocPoint {
  return {
    x: (p.x - camera.offsetX) / camera.scale,
    y: (p.y - camera.offsetY) / camera.scale,
  };
}

export function docToScreen(p: DocPoint, camera: Camera): ScreenPoint {
  return {
    x: p.x * camera.scale + camera.offsetX,
    y: p.y * camera.scale + camera.offsetY,
  };
}

export function clampScale(scale: number, min = 0.1, max = 12): number {
  return Math.min(max, Math.max(min, scale));
}

/**
 * Caméra « contenir » : le document entier est visible, centré, avec une marge.
 * Utilisée à l'ouverture et pour le bouton « Remettre à l'écran ».
 */
export function fitCamera(
  docWidth: number,
  docHeight: number,
  viewWidth: number,
  viewHeight: number,
  padding = 32,
): Camera {
  const usableW = Math.max(1, viewWidth - padding * 2);
  const usableH = Math.max(1, viewHeight - padding * 2);
  const scale = Math.min(usableW / docWidth, usableH / docHeight);
  return {
    scale,
    offsetX: (viewWidth - docWidth * scale) / 2,
    offsetY: (viewHeight - docHeight * scale) / 2,
  };
}

/**
 * Zoom autour d'un point ÉCRAN (le point sous le curseur/doigt reste fixe).
 */
export function zoomAroundPoint(
  camera: Camera,
  zoomFactor: number,
  screenAnchor: ScreenPoint,
): Camera {
  const nextScale = clampScale(camera.scale * zoomFactor);
  const effectiveFactor = nextScale / camera.scale;
  return {
    scale: nextScale,
    offsetX: screenAnchor.x - (screenAnchor.x - camera.offsetX) * effectiveFactor,
    offsetY: screenAnchor.y - (screenAnchor.y - camera.offsetY) * effectiveFactor,
  };
}

/** Déplacement (pan) en pixels écran. */
export function panCamera(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, offsetX: camera.offsetX + dx, offsetY: camera.offsetY + dy };
}

/**
 * Caméra commune à deux vues (mode Côte à côte) : même échelle des deux côtés,
 * sans déformation, chacun centré dans sa zone.
 */
export function sharedFitCamera(
  docWidth: number,
  docHeight: number,
  leftW: number,
  leftH: number,
  rightW: number,
  rightH: number,
  padding = 24,
): { scale: number; left: Camera; right: Camera } {
  const scale = Math.min(
    Math.max(1, leftW - padding * 2) / docWidth,
    Math.max(1, leftH - padding * 2) / docHeight,
    Math.max(1, rightW - padding * 2) / docWidth,
    Math.max(1, rightH - padding * 2) / docHeight,
  );
  return {
    scale,
    left: {
      scale,
      offsetX: (leftW - docWidth * scale) / 2,
      offsetY: (leftH - docHeight * scale) / 2,
    },
    right: {
      scale,
      offsetX: (rightW - docWidth * scale) / 2,
      offsetY: (rightH - docHeight * scale) / 2,
    },
  };
}
