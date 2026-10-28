// Identité visuelle de CodeForge : bureau de recherche lumineux (papier chaud, boutons graphite).
// Surfaces claires posées dans le cadre sombre du Hub ; texte ≥ 7:1 (graphite #2e2e2e / #454545 sur #fdfcfb),
// tailles ≥ 14 px, cibles ≥ 40 px (CLAUDE.md §5 bis). Le bleu des liens est assombri (#0a4fb8) pour le contraste.

/** Bouton d'action principal : pastille graphite. */
export const generatorPrimaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-[#2e2e2e] px-6 py-2 text-base font-semibold text-white hover:bg-black active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-colors";

/** Bouton d'outil : contour fin, coins 6 px. */
export const generatorSecondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-500 bg-transparent px-3 py-2 text-sm font-medium text-[#2e2e2e] hover:bg-black/5 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-colors";

/** Variante « bouton à bascule » : l'état pressé est donné par le fond ET par aria-pressed. */
export const generatorToggleButton = `${generatorSecondaryButton} aria-pressed:border-[#2e2e2e] aria-pressed:bg-[#2e2e2e] aria-pressed:text-white`;

/** Carte de contenu : plate, 12 px, filet fin. */
export const generatorCard = "rounded-xl border border-black/15 bg-[#fdfcfb]";

/** Encart papier chaud (explications, import). */
export const generatorPaper = "rounded-lg bg-[#f0f0ea]";

/** Fenêtre produit flottante (aperçu de la page). */
export const generatorWindow =
  "overflow-hidden rounded-xl border border-black/15 bg-[#fdfcfb] shadow-[0_0_4px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.04),0_16px_26px_rgba(0,0,0,0.05)]";

/** Toile de travail derrière la page. */
export const generatorCanvas = "bg-[#eeeded]";

export const generatorKicker = "text-sm font-semibold text-[#454545]";

export const generatorCode = "rounded bg-black/10 px-1.5 py-0.5 font-mono text-[#2e2e2e]";

export const generatorLink = "font-medium text-[#0a4fb8] underline underline-offset-2 hover:text-[#08398a]";

/** Titres d'affichage (Instrument Sans, variable fournie par page.tsx). */
export const generatorDisplay = "font-(family-name:--font-instrument-sans) font-medium text-[#2e2e2e]";

/**
 * Le Hub dessine un contour de focus jaune : invisible sur fond clair.
 * On le remplace par un bleu foncé dans toute la zone CodeForge.
 */
export const generatorFocus = "[&_:focus-visible]:outline-[#0a4fb8]!";

export const generatorError = "rounded-lg border border-red-800 bg-red-50 p-4 text-sm text-red-950";

export const generatorSuccess = "rounded-lg border border-[#2e2e2e] bg-[#f0f0ea] p-4 text-sm text-[#2e2e2e]";

/** Titre d'étape (h2) : « 1. Maquette », « 2. Aperçu », « 3. Export ». */
export const generatorSectionTitle =
  "font-(family-name:--font-instrument-sans) text-3xl font-medium tracking-tight text-[#2e2e2e]";

/** Lien vers un autre outil de la chaîne, en gardant le projet courant dans l'URL. */
export function toolHref(path: string, projectId: number | null): string {
  return projectId === null ? path : `${path}?project_id=${projectId}`;
}
