/** Classes Tailwind partagées par les panneaux de l'outil (charte : _brand/BRAND.md). */

/** Champ de saisie ou liste déroulante. */
export const FIELD_CLASS =
  "min-h-12 w-full rounded-xl border-2 border-(--line-strong) bg-(--surface-raised) px-3 text-lg text-(--ink)";

/** Bouton principal : un seul par vue. */
export const PRIMARY_BUTTON =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-(--motion) px-4 text-lg font-semibold text-(--on-motion) hover:bg-(--motion-strong)";

export const SECONDARY_BUTTON =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-(--line-strong) bg-(--surface-raised) px-4 text-lg font-semibold hover:bg-(--motion-soft)";

/** Message d'erreur en bloc. */
export const ERROR_BOX = "rounded-xl border-2 border-(--danger) bg-(--danger-soft) p-3 text-lg text-(--danger)";
