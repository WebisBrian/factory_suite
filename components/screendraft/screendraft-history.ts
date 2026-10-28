/**
 * Historique d'annulation (Ctrl/⌘ + Z) : états passés, état présent, états annulés.
 * Fonctions pures, indépendantes du contenu de l'état.
 */
export type History<T> = {
  past: T[];
  present: T;
  future: T[];
  /** Clé de la dernière modification enregistrée, pour regrouper un geste continu. */
  lastKey: string | null;
  lastAt: number;
};

/** Au-delà, les plus anciens états sont oubliés. */
export const MAX_HISTORY = 100;

/**
 * Deux modifications de même clé à moins de ce délai (ms) forment une seule étape :
 * un glisser envoie un déplacement à chaque mouvement de souris, une saisie un texte par touche.
 */
export const GROUP_DELAY = 1000;

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [], lastKey: null, lastAt: 0 };
}

/**
 * Enregistre un nouvel état. Sans changement, l'historique est rendu tel quel.
 * `key` null : la modification forme toujours une étape à elle seule.
 */
export function commit<T>(history: History<T>, next: T, key: string | null, at: number): History<T> {
  if (next === history.present) return history;
  const continuesGesture = key !== null && key === history.lastKey && at - history.lastAt < GROUP_DELAY;
  if (continuesGesture) {
    return { ...history, present: next, future: [], lastAt: at };
  }
  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY),
    present: next,
    future: [],
    lastKey: key,
    lastAt: at,
  };
}

export function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
    lastKey: null,
    lastAt: 0,
  };
}

export function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history;
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1),
    lastKey: null,
    lastAt: 0,
  };
}
