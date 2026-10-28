import type { ReactNode } from "react";
import type { DraftNodeType } from "@/components/screendraft/screendraft-schema";

const BASE_COMPONENTS: { type: DraftNodeType; label: string; icon: ReactNode }[] = [
  { type: "section", label: "Section", icon: <rect x="3" y="5" width="18" height="14" rx="2" /> },
  { type: "title", label: "Titre", icon: <path d="M6 5v14M18 5v14M6 12h12" /> },
  { type: "text", label: "Texte", icon: <path d="M4 7h16M4 12h16M4 17h10" /> },
  {
    type: "image",
    label: "Image",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 16 5-5 4 4 3-3 6 6" />
      </>
    ),
  },
  {
    type: "button",
    label: "Bouton",
    icon: (
      <>
        <rect x="3" y="8" width="18" height="8" rx="4" />
        <path d="M9 12h6" />
      </>
    ),
  },
];

/** Composants de base. L'insertion dans la maquette viendra avec SCRUM-4. */
export function ScreendraftPalette() {
  return (
    <aside className="w-56 shrink-0 border-r border-(--line) bg-(--surface-raised) p-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">
        Composants
      </h2>
      <ul className="-mx-(--space-2)">
        {BASE_COMPONENTS.map(({ type, label, icon }) => (
          <li
            key={type}
            className="text-body-sm flex items-center gap-(--space-3) rounded-(--radius-md) p-(--space-2) text-(--ink)"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-5 shrink-0 fill-none stroke-(--ink-muted)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icon}
            </svg>
            {label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
