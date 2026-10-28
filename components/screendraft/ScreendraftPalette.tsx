import { ScreendraftNodeIcon } from "@/components/screendraft/ScreendraftNodeIcon";
import { ScreendraftPanelSection } from "@/components/screendraft/ScreendraftPanelSection";
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
    <>
      <ScreendraftPanelSection id="components" headingId="screendraft-composants" title="Composants" isFirst>
        <ul aria-labelledby="screendraft-composants" className="-mx-(--space-2)">
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
      </ScreendraftPanelSection>
      <ScreendraftPanelSection id="shapes" headingId="screendraft-formes" title="Formes">
        <div role="group" aria-labelledby="screendraft-formes" className="flex flex-wrap gap-(--space-2)">
          {SHAPES.map(({ shape, icon }) => (
            <button
              key={shape}
              type="button"
              onClick={() => onAdd("shape", shape)}
              aria-label={`Ajouter : ${SHAPE_LABELS[shape]}`}
              title={SHAPE_LABELS[shape]}
              className="grid size-10 place-items-center rounded-(--radius-md) border border-(--line-strong) text-lg text-(--ink) hover:bg-(--canvas)"
            >
              <span aria-hidden>{icon}</span>
            </button>
          ))}
        </div>
      </ScreendraftPanelSection>
    </>
  );
}
