// Identité visuelle de l'étape 4 : bureau de recherche lumineux (papier chaud, boutons graphite).
// Même charte que CodeForge, redéclarée ici car un squad n'importe jamais le code d'un autre.
// Texte ≥ 7:1 (#2e2e2e / #454545 sur #fdfcfb), tailles ≥ 14 px, cibles ≥ 40 px (CLAUDE.md §5 bis).

export const qualityPrimaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-[#2e2e2e] px-6 py-2 text-base font-semibold text-white hover:bg-black active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-colors";

export const qualitySecondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-500 bg-transparent px-3 py-2 text-sm font-medium text-[#2e2e2e] hover:bg-black/5 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-colors";

export const qualityToggleButton = `${qualitySecondaryButton} aria-pressed:border-[#2e2e2e] aria-pressed:bg-[#2e2e2e] aria-pressed:text-white`;

export const qualityCard = "rounded-xl border border-black/15 bg-[#fdfcfb]";
export const qualityPaper = "rounded-lg bg-[#f0f0ea]";
export const qualityLink = "font-medium text-[#0a4fb8] underline underline-offset-2 hover:text-[#08398a]";
export const qualityCode = "rounded bg-black/10 px-1.5 py-0.5 font-mono text-[#2e2e2e]";
export const qualityFocus = "[&_:focus-visible]:outline-[#0a4fb8]!";
export const qualityError = "rounded-lg border border-red-800 bg-red-50 p-4 text-sm text-red-950";
export const qualityDisplay = "font-(family-name:--font-instrument-sans) font-medium text-[#2e2e2e]";
export const qualitySectionTitle =
  "font-(family-name:--font-instrument-sans) text-3xl font-medium tracking-tight text-[#2e2e2e]";

export function toolHref(path: string, projectId: number | null): string {
  return projectId === null ? path : `${path}?project_id=${projectId}`;
}
