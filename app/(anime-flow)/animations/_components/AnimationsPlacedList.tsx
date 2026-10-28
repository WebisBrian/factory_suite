"use client";

import type { AnimationPreset } from "@/app/(anime-flow)/animations/_lib/animation-library";
import { summarizeAnimation, type ElementAnimation } from "@/app/(anime-flow)/animations/_lib/element-animation";
import { SECONDARY_BUTTON } from "@/app/(anime-flow)/animations/_lib/field-styles";
import type { PageElement } from "@/app/(anime-flow)/animations/_lib/page-elements";

type Props = {
  /** Dans l'ordre de la page. */
  items: { element: PageElement; animation: ElementAnimation }[];
  customAnimations: readonly AnimationPreset[];
  onEdit: (element: PageElement) => void;
  onRemove: (element: PageElement) => void;
};

/**
 * Récapitulatif des animations déjà posées, pour les modifier ou les retirer sans chercher l'élément.
 * Le titre est porté par la section du panneau.
 */
export function AnimationsPlacedList({ items, customAnimations, onEdit, onRemove }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-(--ink-muted)">Aucune animation pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map(({ element, animation }) => (
        <li key={element.id} className="flex flex-col gap-2 rounded-xl border border-(--line) p-3">
          <div>
            <p className="text-base font-semibold break-words">{element.name}</p>
            <p className="text-sm text-(--ink-muted)">{summarizeAnimation(animation, customAnimations)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* aria-label : « Modifier » seul ne dit pas de quel élément il s'agit. */}
            <button
              type="button"
              onClick={() => onEdit(element)}
              aria-label={`Modifier l'animation de ${element.name}`}
              className={SECONDARY_BUTTON}
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={() => onRemove(element)}
              aria-label={`Retirer l'animation de ${element.name}`}
              className={SECONDARY_BUTTON}
            >
              Retirer
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
