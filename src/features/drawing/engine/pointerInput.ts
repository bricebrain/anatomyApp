import type { StrokePoint } from '../types';

/**
 * Aides pour l'acquisition des entrées Pointer Events (§6.3) :
 * événements coalescés, pression avec repli, priorité stylet > doigt.
 */

/** Extrait les événements coalescés (haute fréquence) si disponibles. */
export function coalescedEvents(e: PointerEvent): PointerEvent[] {
  if (typeof e.getCoalescedEvents === 'function') {
    const events = e.getCoalescedEvents();
    if (events && events.length > 0) return events;
  }
  return [e];
}

/**
 * Pression exploitable ? Safari/iPadOS ne fournit pas toujours `pressure`
 * (0 ou 0.5 par défaut pour souris/doigt). On ne l'utilise que pour un vrai
 * stylet avec une valeur plausible.
 */
export function usablePressure(e: PointerEvent): number | undefined {
  if (e.pointerType !== 'pen') return undefined;
  if (!Number.isFinite(e.pressure)) return undefined;
  if (e.pressure <= 0 || e.pressure > 1) return undefined;
  // 0.5 constant = valeur par défaut « bouton simple » sans capteur.
  return e.pressure;
}

export function eventToStrokePoint(
  e: PointerEvent,
  toDoc: (x: number, y: number) => { x: number; y: number },
): StrokePoint {
  const p = toDoc(e.offsetX, e.offsetY);
  return { x: p.x, y: p.y, pressure: usablePressure(e) };
}

/**
 * Priorité des pointeurs pour éviter les traits de paume (§6.3) :
 * un stylet actif ignore les contacts tactiles ; l'arrivée d'un stylet
 * pendant un tracé au doigt remplace celui-ci.
 */
export function pointerPriority(pointerType: string): number {
  switch (pointerType) {
    case 'pen':
      return 2;
    case 'mouse':
      return 1;
    default:
      return 0; // touch
  }
}
