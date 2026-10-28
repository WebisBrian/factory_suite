"use client";

import { summarizeAnimation, type ElementAnimation } from "@/app/(anime-flow)/animations/_lib/element-animation";
import type { PageElement } from "@/app/(anime-flow)/animations/_lib/page-elements";

type Props = {
  /** Dans l'ordre de la page. */
  items: { element: PageElement; animation: ElementAnimation }[];
  onEdit: (element: PageElement) => void;
  onRemove: (element: PageElement) => void;
};

const SECONDARY_BUTTON =
  "min-h-10 rounded-full border-2 border-(--line-strong) bg-(--surface-raised) px-4 text-sm font-semibold hover:bg-(--motion-soft)";

/** Récapitulatif des animations déjà posées, pour les modifier ou les retirer sans chercher l'élément. */
export function AnimationsPlacedList({ items, onEdit, onRemove }: Props) {
  return (
    <section
      aria-labelledby="animations-placed-title"
      className="rounded-2xl border border-(--line) bg-(--surface-raised) p-5"
    >
      <h2 id="animations-placed-title" className="text-lg font-semibold">
        Animations posées
      </h2>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-(--ink-muted)">Aucune animation pour l&apos;instant.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map(({ element, animation }) => (
            <li key={element.id} className="flex flex-col gap-2 rounded-xl border border-(--line) p-3">
              <div>
                <p className="text-base font-semibold">{element.name}</p>
                <p className="text-sm text-(--ink-muted)">{summarizeAnimation(animation)}</p>
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
      )}
    </section>
  );
}
