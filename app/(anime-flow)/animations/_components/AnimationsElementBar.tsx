"use client";

import type { PageElement } from "@/app/(anime-flow)/animations/_lib/page-elements";

type Props = {
  elements: PageElement[];
  selectedId: string | null;
  /** Élément survolé, dans la liste ou dans l'aperçu. */
  hoveredId: string | null;
  onSelect: (element: PageElement) => void;
  /** Survol ou focus clavier d'une ligne : l'élément est entouré dans l'aperçu. */
  onHover: (id: string | null) => void;
};

/** id du bouton d'un élément dans la liste, pour y revenir après un clic dans l'aperçu. */
export function elementButtonId(elementId: string): string {
  return `animations-element-${elementId}`;
}

/**
 * Liste des éléments de la page, pour choisir lequel animer (SCRUM-6).
 * Le titre est porté par la section du panneau : `labelledBy` est son id.
 */
export function AnimationsElementBar({
  elements,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  labelledBy,
}: Props & { labelledBy: string }) {
  return (
    <nav aria-labelledby={labelledBy}>
      {elements.length === 0 ? (
        <p className="text-lg text-(--ink-muted)">Aucun élément animable dans cette page.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {elements.map((element) => (
            <AnimationsElementItem
              key={element.id}
              element={element}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
        </ul>
      )}
    </nav>
  );
}

function AnimationsElementItem({ element, ...props }: Omit<Props, "elements"> & { element: PageElement }) {
  const { selectedId, hoveredId, onSelect, onHover } = props;
  const selected = element.id === selectedId;
  const hovered = element.id === hoveredId;

  return (
    <li>
      <button
        type="button"
        id={elementButtonId(element.id)}
        aria-pressed={selected}
        onClick={() => onSelect(element)}
        onMouseEnter={() => onHover(element.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(element.id)}
        onBlur={() => onHover(null)}
        className={`flex min-h-12 w-full items-center gap-2 rounded-xl border-2 px-4 py-2 text-left text-lg ${
          selected
            ? "border-(--motion) bg-(--motion-soft) font-semibold"
            : hovered
              ? // Survolé dans l'aperçu : pointillés, comme la surcouche de l'aperçu (pas que la couleur).
                "border-dashed border-(--motion) bg-(--motion-soft)"
              : "border-transparent hover:bg-(--motion-soft)"
        }`}
      >
        {/* La sélection ne passe pas que par la couleur : coche visible + aria-pressed. */}
        <span aria-hidden className="w-5 shrink-0">
          {selected ? "✓" : ""}
        </span>
        {element.name}
      </button>
      {element.children.length > 0 && (
        <ul className="mt-1 ml-6 flex flex-col gap-1 border-l-2 border-(--line) pl-2">
          {element.children.map((child) => (
            <AnimationsElementItem key={child.id} element={child} {...props} />
          ))}
        </ul>
      )}
    </li>
  );
}
