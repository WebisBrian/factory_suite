import { ScreendraftNodeIcon } from "@/components/screendraft/ScreendraftNodeIcon";
import type { DraftNodeType, ShapeKind } from "@/components/screendraft/screendraft-schema";
import { SHAPE_LABELS } from "@/components/screendraft/screendraft-tree";

const BASE_COMPONENTS: { type: Exclude<DraftNodeType, "shape">; label: string }[] = [
  { type: "section", label: "Section" },
  { type: "title", label: "Titre" },
  { type: "text", label: "Texte" },
  { type: "image", label: "Image" },
  { type: "video", label: "Vidéo" },
  { type: "button", label: "Bouton" },
];

const SHAPES: { shape: ShapeKind; icon: string }[] = [
  { shape: "circle", icon: "●" },
  { shape: "rectangle", icon: "■" },
  { shape: "triangle", icon: "▲" },
];

/** Composants de base et formes : un clic ajoute l'élément à la maquette. */
export function ScreendraftPalette({
  onAdd,
}: {
  onAdd: (type: DraftNodeType, shape?: ShapeKind) => void;
}) {
  return (
    <section className="p-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">
        Composants
      </h2>
      <ul className="-mx-(--space-2)">
        {BASE_COMPONENTS.map(({ type, label }) => (
          <li key={type}>
            <button
              type="button"
              onClick={() => onAdd(type)}
              className="text-body-sm flex w-full items-center gap-(--space-3) rounded-(--radius-md) p-(--space-2) text-left text-(--ink) hover:bg-(--canvas)"
            >
              <span className="text-(--ink-muted)">
                <ScreendraftNodeIcon type={type} />
              </span>
              {label}
            </button>
          </li>
        ))}
      </ul>
      <h2 className="text-label mt-(--space-4) pb-(--space-2) text-(--ink-muted)">
        Formes
      </h2>
      <div className="flex gap-(--space-2)">
        {SHAPES.map(({ shape, icon }) => (
          <button
            key={shape}
            type="button"
            onClick={() => onAdd("shape", shape)}
            aria-label={`Ajouter : ${SHAPE_LABELS[shape]}`}
            title={SHAPE_LABELS[shape]}
            className="grid size-9 place-items-center rounded-(--radius-md) border border-(--line) text-lg text-(--ink) hover:bg-(--canvas)"
          >
            <span aria-hidden>{icon}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
