// Signal « les projets ont changé » entre composants du Hub (ex. l'assistant crée un projet :
// la liste du tableau de bord se recharge). Même page uniquement : ce n'est pas un canal entre outils.

const listeners = new Set<() => void>();

/** Abonne `listener` ; renvoie la fonction de désabonnement (à rendre depuis un useEffect). */
export function onHubProjectsChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyHubProjectsChanged(): void {
  for (const listener of listeners) listener();
}
