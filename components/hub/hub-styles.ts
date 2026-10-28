// Styles partagés du Hub, pensés pour des utilisateurs malvoyants :
// contraste ≥ 7:1 pour le texte (WCAG AAA), bordures visibles sur tout contrôle,
// cibles d'au moins 40-44 px, aucun état signalé uniquement par la couleur.

export const hubPrimaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-linear-to-r from-violet-700 to-fuchsia-800 px-5 py-2 text-base font-bold text-white transition-colors hover:from-violet-800 hover:to-fuchsia-900 disabled:cursor-not-allowed disabled:opacity-60";

export const hubSecondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-zinc-300 px-5 py-2 text-base font-semibold text-white transition-colors hover:bg-white/10";

export const hubSmallButton =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-500 px-3 py-1.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const hubDangerButton =
  "inline-flex min-h-10 items-center justify-center rounded-lg bg-red-800 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60";

export const hubInput =
  "min-h-11 rounded-xl border-2 border-zinc-400 bg-[#16161d] px-4 py-2 text-base text-white placeholder:text-zinc-400 focus:border-yellow-300";

export const hubCode = "rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-zinc-100";

export const hubCard = "rounded-2xl border border-zinc-700 bg-[#14141b]";

export const hubSectionLabel = "text-sm font-bold tracking-wider text-zinc-300 uppercase";
