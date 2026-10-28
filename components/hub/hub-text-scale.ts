// Taille du texte de toute l'app. Tailwind exprime tailles, espacements et largeurs en rem :
// changer la taille de police de <html> agrandit donc l'interface de façon proportionnée,
// y compris les routes des squads, sans toucher à globals.css.

export const HUB_TEXT_SCALES = [1, 1.25, 1.5, 1.75, 2] as const;
const STORAGE_KEY = "factorysuite-text-scale";

function isTextScale(value: number): boolean {
  return (HUB_TEXT_SCALES as readonly number[]).includes(value);
}

function applyTextScale(scale: number): void {
  // En % : respecte la taille de police déjà choisie dans les réglages du navigateur.
  document.documentElement.style.fontSize = `${scale * 100}%`;
}

/** Script inline exécuté avant le premier affichage, pour éviter un saut de mise en page. */
export const hubTextScaleBootScript = `try{var s=Number(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}));if([${HUB_TEXT_SCALES.join(",")}].indexOf(s)>0)document.documentElement.style.fontSize=(s*100)+"%"}catch(e){}`;

const listeners = new Set<() => void>();

export function readHubTextScale(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return isTextScale(stored) ? stored : 1;
  } catch {
    return 1;
  }
}

export function setHubTextScale(scale: number): void {
  if (!isTextScale(scale)) return;
  try {
    localStorage.setItem(STORAGE_KEY, String(scale));
  } catch {
    // Stockage indisponible (navigation privée stricte) : le réglage vaut pour la page seulement.
  }
  applyTextScale(scale);
  listeners.forEach((listener) => listener());
}

export function subscribeHubTextScale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
