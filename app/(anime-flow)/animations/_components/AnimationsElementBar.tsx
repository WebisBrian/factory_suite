"use client";

import type { PageElement } from "@/app/(anime-flow)/animations/_lib/page-elements";

type Props = {
  elements: PageElement[];
  selectedId: string | null;
  onSelect: (element: PageElement) => void;
};

/** Barre listant les éléments de la page, pour choisir lequel animer (SCRUM-6). */
export function AnimationsElementBar({ elements, selectedId, onSelect }: Props) {
  return (
    <nav
      aria-labelledby="animations-elements-title"
      className="rounded-2xl border border-(--line) bg-(--surface-raised) p-5"
    >
      <h2 id="animations-elements-title" className="text-xl font-semibold">
        Éléments de la page
      </h2>
      <p className="mt-1 text-lg text-(--ink-muted)">Choisissez l&apos;élément à animer.</p>

      {elements.length === 0 ? (
        <p className="mt-4 text-lg text-(--ink-muted)">Aucun élément animable dans cette page.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {elements.map((element) => (
            <AnimationsElementItem key={element.id} element={element} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </nav>
  );
}

function AnimationsElementItem({ element, selectedId, onSelect }: Omit<Props, "elements"> & { element: PageElement }) {
  const selected = element.id === selectedId;

  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(element)}
        className={`flex min-h-12 w-full items-center gap-2 rounded-xl border-2 px-4 py-2 text-left text-lg ${
          selected ? "border-(--motion) bg-(--motion-soft) font-semibold" : "border-transparent hover:bg-(--motion-soft)"
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
            <AnimationsElementItem key={child.id} element={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}
