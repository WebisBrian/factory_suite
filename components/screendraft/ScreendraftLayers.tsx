"use client";

import { Fragment, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ScreendraftNodeIcon } from "@/components/screendraft/ScreendraftNodeIcon";
import { ScreendraftPanelSection } from "@/components/screendraft/ScreendraftPanelSection";
import type { DraftNode } from "@/components/screendraft/screendraft-schema";
import {
  contentLabel,
  findNode,
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
  selectedIds: string[];
  /** `additive` : Maj + clic, ajouter ou retirer le calque de la sélection. */
  onSelect: (id: string, additive: boolean) => void;
  onPlace: (id: string, placement: Placement) => void;
  /** Nouveau nom d'un calque ; vide : le calque reprend son contenu comme libellé. */
  onRename: (id: string, name: string) => void;
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
  selectedIds: string[];
  dropTarget: DropTarget | null;
  /** Sections repliées dans les calques (état d'affichage, jamais exporté). */
  collapsedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string, additive: boolean) => void;
  drag: RowDragHandlers;
  /** Calque en cours de renommage, et les actions de renommage. */
  editingId: string | null;
  rename: RenameHandlers;
};

type RenameHandlers = {
  start: (id: string) => void;
  commit: (node: DraftNode, value: string) => void;
  cancel: (id: string) => void;
};

// Place réservée à gauche de chaque ligne pour la flèche des sections : les icônes restent alignées.
const TOGGLE_GUTTER = "var(--space-6)";

/**
 * Calques de la maquette, du premier plan à l'arrière-plan comme dans Figma :
 * l'inverse de l'ordre du JSON. Les enfants d'une section sont décalés vers la droite.
 * Glisser un calque le place devant ou derrière un autre, ou dans une section.
 * Une section se replie pour masquer ses enfants dans la liste (pas sur le canvas).
 * Double-clic ou F2 sur un calque : le renommer.
 */
export function ScreendraftLayers({ nodes, selectedIds, onSelect, onPlace, onRename }: ScreendraftLayersProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const [editingId, setEditingId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Après le renommage, le focus revient sur la ligne pour continuer au clavier.
  function focusRow(id: string) {
    requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLElement>(`[data-layer-id="${CSS.escape(id)}"]`)?.focus(),
    );
  }

  const rename: RenameHandlers = {
    start(id) {
      onSelect(id, false);
      setEditingId(id);
    },
    commit(node, value) {
      setEditingId(null);
      const name = value.trim();
      // Garder le libellé proposé sans le changer ne donne pas de nom : il suivra le contenu.
      if (!node.name && name === contentLabel(node)) return focusRow(node.id);
      onRename(node.id, name);
      focusRow(node.id);
    },
    cancel(id) {
      setEditingId(null);
      focusRow(id);
    },
  };

  function toggle(id: string) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

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
      onSelect(node.id, false);
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
    <ScreendraftPanelSection id="layers" headingId="screendraft-calques" title="Calques" count={countNodes(nodes)}>
      <ul ref={listRef} aria-labelledby="screendraft-calques" className="-mx-(--space-2)">
        <LayerRows
          nodes={nodes}
          depth={0}
          selectedIds={selectedIds}
          dropTarget={dropTarget}
          collapsedIds={collapsedIds}
          onToggle={toggle}
          onSelect={onSelect}
          drag={drag}
          editingId={editingId}
          rename={rename}
        />
      </ul>
    </ScreendraftPanelSection>
  );
}

/** Nombre d'éléments de l'écran, enfants des sections compris. */
function countNodes(nodes: DraftNode[]): number {
  return nodes.reduce((total, node) => total + 1 + (node.type === "section" ? countNodes(node.children) : 0), 0);
}

function LayerRows(props: LayerRowsProps) {
  const { nodes, depth, selectedIds, dropTarget, collapsedIds, onToggle, onSelect, drag, editingId, rename } = props;
  const indent = `calc(var(--space-2) + var(--space-4) * ${depth})`;

  return [...nodes].reverse().map((node) => {
    const isSelected = selectedIds.includes(node.id);
    const zone = dropTarget?.id === node.id ? dropTarget.zone : null;
    const isSection = node.type === "section";
    // Une section qui contient un élément sélectionné (ex. cliqué sur le canvas) reste ouverte.
    const containsSelection = isSection && selectedIds.some((id) => findNode(node.children, id) !== null);
    const isCollapsed = isSection && collapsedIds.has(node.id) && !containsSelection;
    return (
      <Fragment key={node.id}>
        <li className="relative">
          {zone === "front" && <DropLine indent={indent} />}
          {isSection && (
            <button
              type="button"
              aria-expanded={!isCollapsed}
              aria-label={`${isCollapsed ? "Déplier" : "Replier"} la section « ${nodeLabel(node)} »`}
              title={isCollapsed ? "Déplier" : "Replier"}
              onClick={() => onToggle(node.id)}
              className={`absolute top-1/2 z-10 grid size-6 -translate-y-1/2 place-items-center rounded-(--radius-sm) hover:bg-(--surface-raised) ${
                isSelected ? "text-(--draft)" : "text-(--ink-muted) hover:text-(--ink)"
              }`}
              style={{ left: `calc(${indent} - var(--space-1))` }}
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className={`size-4 fill-none stroke-current transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          )}
          {node.id === editingId ? (
            <RenameField node={node} paddingLeft={`calc(${indent} + ${TOGGLE_GUTTER})`} rename={rename} />
          ) : (
            <button
              type="button"
              draggable
              data-layer-id={node.id}
              aria-current={isSelected || undefined}
              aria-keyshortcuts="F2"
              title="Double-cliquez (ou F2) pour renommer"
              onClick={(event) => onSelect(node.id, event.shiftKey)}
              onDoubleClick={() => rename.start(node.id)}
              onKeyDown={(event) => {
                if (event.key === "F2") {
                  event.preventDefault();
                  rename.start(node.id);
                }
              }}
              onDragStart={(event) => drag.start(node, event)}
              onDragOver={(event) => drag.over(node, event)}
              onDrop={drag.drop}
              onDragEnd={drag.end}
              className={`text-body-sm flex w-full items-center gap-(--space-2) rounded-(--radius-md) py-(--space-1) pr-(--space-2) text-left ${
                isSelected || zone === "inside" ? "bg-(--draft-soft) font-semibold text-(--draft)" : "text-(--ink) hover:bg-(--canvas)"
              } ${zone === "inside" ? "outline-[1.5px] outline-(--draft) outline-solid" : ""}`}
              style={{ paddingLeft: `calc(${indent} + ${TOGGLE_GUTTER})` }}
            >
              <span className={isSelected ? undefined : "text-(--ink-muted)"}>
                <ScreendraftNodeIcon type={node.type} />
              </span>
              <span className="min-w-0 break-words">{nodeLabel(node)}</span>
              {/* Section repliée : nombre d'éléments masqués. */}
              {isCollapsed && (
                <span className={`text-code ml-auto shrink-0 ${isSelected ? "" : "text-(--ink-muted)"}`}>
                  <span className="sr-only">, contient </span>
                  {countNodes(node.children)}
                  <span className="sr-only"> éléments</span>
                </span>
              )}
              {/* Sélection signalée autrement que par la couleur (RGAA 3.1). */}
              {isSelected && (
                <span aria-hidden className={`shrink-0 ${isCollapsed ? "" : "ml-auto"}`}>
                  ✓
                </span>
              )}
            </button>
          )}
        </li>
        {isSection && !isCollapsed && <LayerRows {...props} nodes={node.children} depth={depth + 1} />}
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

type RenameFieldProps = { node: DraftNode; paddingLeft: string; rename: RenameHandlers };

/** Champ de renommage : Entrée ou sortie du champ valide, Échap annule. */
function RenameField({ node, paddingLeft, rename }: RenameFieldProps) {
  // Échap retire le champ : la sortie qui suit ne doit pas valider.
  const cancelled = useRef(false);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Échap ne doit pas aussi désélectionner l'élément (raccourci de l'éditeur).
    event.stopPropagation();
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      cancelled.current = true;
      rename.cancel(node.id);
    }
  }

  return (
    <input
      type="text"
      autoFocus
      aria-label={`Nom du calque (vide : « ${contentLabel(node)} »)`}
      defaultValue={nodeLabel(node)}
      placeholder={contentLabel(node)}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!cancelled.current) rename.commit(node, event.currentTarget.value);
      }}
      className="text-body-sm w-full rounded-(--radius-sm) border border-(--draft) bg-(--surface-raised) py-(--space-1) pr-(--space-2) text-(--ink)"
      style={{ paddingLeft }}
    />
  );
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
