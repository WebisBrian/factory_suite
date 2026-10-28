import { ScreendraftNodeIcon } from "@/components/screendraft/ScreendraftNodeIcon";
import type { DraftNodeType } from "@/components/screendraft/screendraft-schema";

const BASE_COMPONENTS: { type: DraftNodeType; label: string }[] = [
  { type: "section", label: "Section" },
  { type: "title", label: "Titre" },
  { type: "text", label: "Texte" },
  { type: "image", label: "Image" },
  { type: "button", label: "Bouton" },
];

/** Composants de base. L'insertion dans la maquette viendra avec SCRUM-4. */
export function ScreendraftPalette() {
  return (
    <section className="p-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">
        Composants
      </h2>
      <ul className="-mx-(--space-2)">
        {BASE_COMPONENTS.map(({ type, label }) => (
          <li
            key={type}
            className="text-body-sm flex items-center gap-(--space-3) rounded-(--radius-md) p-(--space-2) text-(--ink)"
          >
            <span className="text-(--ink-muted)">
              <ScreendraftNodeIcon type={type} />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
