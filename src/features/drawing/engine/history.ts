import type { Stroke } from '../types';

/**
 * Historique annuler/refaire (§6.5).
 *
 * Implémentation par INSTANTANÉS avec partage structurel : chaque état est un
 * tableau de traits immuables ; les instantanés partagent les objets traits
 * inchangés, donc le coût mémoire est faible. Chaque `commit` = une action
 * annulable (un trait, un passage de gomme complet, un effacement total).
 *
 * Garantit au moins 20 actions récentes (ici : 100).
 */

const MAX_HISTORY = 100;

export class DrawingHistory {
  private past: Stroke[][] = [];
  private future: Stroke[][] = [];
  private current: readonly Stroke[];

  constructor(initial: readonly Stroke[] = []) {
    this.current = [...initial];
  }

  /** État courant (à traiter comme lecture seule). */
  get strokes(): readonly Stroke[] {
    return this.current;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Enregistre un nouvel état (une action utilisateur complète). */
  commit(next: readonly Stroke[]): void {
    if (next === this.current) return;
    this.past.push([...this.current]);
    if (this.past.length > MAX_HISTORY) {
      this.past.shift();
    }
    this.current = next;
    this.future = [];
  }

  /** Annule et renvoie l'état précédent (copie), ou null. */
  undo(): Stroke[] | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push([...this.current]);
    this.current = prev;
    return [...prev];
  }

  /** Rétablit et renvoie l'état suivant (copie), ou null. */
  redo(): Stroke[] | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push([...this.current]);
    this.current = next;
    return [...next];
  }
}
