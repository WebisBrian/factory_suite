/**
 * Classes Tailwind partagées par les panneaux de l'outil (charte : _brand/BRAND.md).
 * Mêmes tailles que Screendraft et le Générateur ; le réglage « Taille du texte » du Hub agrandit tout (rem).
 */

/** Champ de saisie ou liste déroulante. */
export const FIELD_CLASS =
  "min-h-10 w-full rounded-lg border-2 border-(--line-strong) bg-(--surface-raised) px-3 text-base text-(--ink)";

/** Bouton principal : un seul par vue. */
export const PRIMARY_BUTTON =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-(--motion) px-5 text-sm font-semibold text-(--on-motion) hover:bg-(--motion-strong)";

export const SECONDARY_BUTTON =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border-2 border-(--line-strong) bg-(--surface-raised) px-5 text-sm font-semibold hover:bg-(--motion-soft)";

/** Message d'erreur en bloc. */
export const ERROR_BOX = "rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-3 text-sm text-(--danger)";
