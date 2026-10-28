"use client";

import { useState, type DragEvent } from "react";
import { LAYER_DRAG_TYPE } from "@/components/screendraft/ScreendraftLayers";
import type { Screen } from "@/components/screendraft/screendraft-schema";

type ScreendraftScreensProps = {
  screens: Screen[];
  activeScreenId: string;
  onActivate: (screenId: string) => void;
  onAdd: () => void;
  /** Calque lâché sur un écran : l'élément passe dans cet écran. */
  onDropNode: (nodeId: string, screenId: string) => void;
};

/**
 * Écrans de la maquette, dans l'ordre du canvas (de gauche à droite).
 * Les composants et les calques s'appliquent à l'écran actif.
 * Glisser un calque sur un autre écran l'y fait passer.
 */
export function ScreendraftScreens({
  screens,
  activeScreenId,
  onActivate,
  onAdd,
  onDropNode,
}: ScreendraftScreensProps) {
  const [dropScreenId, setDropScreenId] = useState<string | null>(null);

  function handleDragOver(screenId: string, event: DragEvent<HTMLElement>) {
    // Un calque ne se lâche que sur un autre écran que le sien (l'écran actif).
    if (screenId === activeScreenId || !event.dataTransfer.types.includes(LAYER_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropScreenId !== screenId) setDropScreenId(screenId);
  }

  function handleDrop(screenId: string, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDropScreenId(null);
    const nodeId = event.dataTransfer.getData(LAYER_DRAG_TYPE);
    if (nodeId) onDropNode(nodeId, screenId);
  }

  return (
    <section aria-labelledby="screendraft-ecrans" className="flex shrink-0 flex-col border-t border-(--line) p-(--space-4)">
      <div className="flex items-center justify-between pb-(--space-2)">
        <h2 id="screendraft-ecrans" className="text-label text-(--ink-muted)">Écrans</h2>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Ajouter un écran"
          title="Ajouter un écran"
          className="grid size-10 place-items-center rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) text-(--ink) hover:bg-(--canvas)"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4 fill-none stroke-current"
            strokeWidth={1.75}
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <ul aria-labelledby="screendraft-ecrans" className="-mx-(--space-2)">
        {screens.map((screen) => {
          const isActive = screen.id === activeScreenId;
          const isDropTarget = screen.id === dropScreenId;
          return (
            <li key={screen.id}>
              <button
                type="button"
                aria-current={isActive || undefined}
                onClick={() => onActivate(screen.id)}
                onDragOver={(event) => handleDragOver(screen.id, event)}
                onDragLeave={() => setDropScreenId(null)}
                onDrop={(event) => handleDrop(screen.id, event)}
                className={`text-body-sm flex w-full items-center justify-between gap-(--space-2) rounded-(--radius-md) px-(--space-2) py-(--space-1) text-left ${
                  isActive || isDropTarget ? "bg-(--draft-soft) text-(--draft)" : "text-(--ink) hover:bg-(--canvas)"
                } ${isDropTarget ? "outline-[1.5px] outline-(--draft) outline-solid" : ""}`}
              >
                <span className="min-w-0 break-words">{screen.name}</span>
                <span className={`text-code shrink-0 ${isActive || isDropTarget ? "" : "text-(--ink-muted)"}`}>
                  {screen.frame.width}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
