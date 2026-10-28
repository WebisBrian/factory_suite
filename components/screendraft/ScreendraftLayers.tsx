"use client";

import { Fragment, useState, type DragEvent } from "react";
import { ScreendraftNodeIcon } from "@/components/screendraft/ScreendraftNodeIcon";
import type { DraftNode } from "@/components/screendraft/screendraft-schema";
import {
  isSameOrInside,
  nodeLabel,
  type Placement,
} from "@/components/screendraft/screendraft-tree";

/** Type des données glissées depuis un calque (son id), reconnu par la liste des écrans. */
export const LAYER_DRAG_TYPE = "application/x-screendraft-node";

/** Où lâcher un calque par rapport à une ligne : devant (au-dessus), derrière (en dessous) ou dans une section. */
type DropZone = "front" | "back" | "inside";
type DropTarget = { id: string; zone: DropZone };

type ScreendraftLayersProps = {
  nodes: DraftNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPlace: (id: string, placement: Placement) => void;
};

type RowDragHandlers = {
  start: (node: DraftNode, event: DragEvent<HTMLElement>) => void;
  over: (node: DraftNode, event: DragEvent<HTMLElement>) => void;
  drop: (event: DragEvent<HTMLElement>) => void;
  end: () => void;
};

type LayerRowsProps = {
  nodes: DraftNode[];
  depth: number;
  selectedId: string | null;
  dropTarget: DropTarget | null;
  onSelect: (id: string) => void;
  drag: RowDragHandlers;
};

/**
 * Calques de la maquette, du premier plan à l'arrière-plan comme dans Figma :
 * l'inverse de l'ordre du JSON. Les enfants d'une section sont décalés vers la droite.
 * Glisser un calque le place devant ou derrière un autre, ou dans une section.
 */
export function ScreendraftLayers({ nodes, selectedId, onSelect, onPlace }: ScreendraftLayersProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  function endDrag() {
    setDraggedId(null);
    setDropTarget(null);
  }

  const drag: RowDragHandlers = {
    start(node, event) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", node.id);
      // Type propre à Screendraft : la liste des écrans n'accepte que les calques.
      event.dataTransfer.setData(LAYER_DRAG_TYPE, node.id);
      setDraggedId(node.id);
      onSelect(node.id);
    },
    over(node, event) {
      // Pas de dépôt sur l'élément glissé ni dans ses propres enfants.
      if (!draggedId || isSameOrInside(nodes, draggedId, node.id)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const zone = dropZoneAt(event, node.type === "section");
      if (dropTarget?.id !== node.id || dropTarget.zone !== zone) setDropTarget({ id: node.id, zone });
    },
    drop(event) {
      event.preventDefault();
      if (draggedId && dropTarget) onPlace(draggedId, toPlacement(dropTarget));
      endDrag();
    },
    end: endDrag,
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-(--line) p-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">Calques</h2>
      <ul className="-mx-(--space-2) min-h-0 flex-1 overflow-y-auto">
        <LayerRows
          nodes={nodes}
          depth={0}
          selectedId={selectedId}
          dropTarget={dropTarget}
          onSelect={onSelect}
          drag={drag}
        />
      </ul>
    </section>
  );
}

function LayerRows({ nodes, depth, selectedId, dropTarget, onSelect, drag }: LayerRowsProps) {
  const indent = `calc(var(--space-2) + var(--space-4) * ${depth})`;

  return [...nodes].reverse().map((node) => {
    const isSelected = node.id === selectedId;
    const zone = dropTarget?.id === node.id ? dropTarget.zone : null;
    return (
      <Fragment key={node.id}>
        <li className="relative">
          {zone === "front" && <DropLine indent={indent} />}
          <button
            type="button"
            draggable
            aria-current={isSelected || undefined}
            onClick={() => onSelect(node.id)}
            onDragStart={(event) => drag.start(node, event)}
            onDragOver={(event) => drag.over(node, event)}
            onDrop={drag.drop}
            onDragEnd={drag.end}
            className={`text-body-sm flex w-full items-center gap-(--space-2) rounded-(--radius-md) py-(--space-1) pr-(--space-2) text-left ${
              isSelected || zone === "inside" ? "bg-(--draft-soft) text-(--draft)" : "text-(--ink) hover:bg-(--canvas)"
            } ${zone === "inside" ? "outline-[1.5px] outline-(--draft) outline-solid" : ""}`}
            style={{ paddingLeft: indent }}
          >
            <span className={isSelected ? undefined : "text-(--ink-muted)"}>
              <ScreendraftNodeIcon type={node.type} />
            </span>
            <span className="truncate">{nodeLabel(node)}</span>
          </button>
        </li>
        {node.type === "section" && (
          <LayerRows
            nodes={node.children}
            depth={depth + 1}
            selectedId={selectedId}
            dropTarget={dropTarget}
            onSelect={onSelect}
            drag={drag}
          />
        )}
        {/* « Derrière » une section : sous tous ses enfants, pas entre la section et son premier enfant. */}
        {zone === "back" && (
          <li aria-hidden className="relative">
            <DropLine indent={indent} />
          </li>
        )}
      </Fragment>
    );
  });
}

function DropLine({ indent }: { indent: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-0 right-(--space-2) z-10 h-0.5 -translate-y-1/2 rounded-(--radius-pill) bg-(--draft)"
      style={{ left: indent }}
    />
  );
}

/** Haut de la ligne : devant ; bas : derrière ; milieu d'une section : dedans. */
function dropZoneAt(event: DragEvent<HTMLElement>, isSection: boolean): DropZone {
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = (event.clientY - rect.top) / rect.height;
  if (isSection && ratio > 0.25 && ratio < 0.75) return "inside";
  return ratio < 0.5 ? "front" : "back";
}

// Les calques sont affichés à l'envers du JSON : « devant » une ligne, c'est après elle dans le tableau.
function toPlacement({ id, zone }: DropTarget): Placement {
  switch (zone) {
    case "inside":
      return { type: "inside", parentId: id };
    case "front":
      return { type: "after", siblingId: id };
    case "back":
      return { type: "before", siblingId: id };
  }
}
