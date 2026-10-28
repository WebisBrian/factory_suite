"use client";

import "@/components/screendraft/screendraft-theme.css";
import { useEffect, useState } from "react";
import wordmark from "@/components/screendraft/brand/logos/screen-draft-wordmark.svg";
import wordmarkWhite from "@/components/screendraft/brand/logos/screen-draft-wordmark-white.svg";
import { ScreendraftCanvas } from "@/components/screendraft/ScreendraftCanvas";
import { ScreendraftHistoryControls } from "@/components/screendraft/ScreendraftHistoryControls";
import { ScreendraftLayers } from "@/components/screendraft/ScreendraftLayers";
import { ScreendraftPalette } from "@/components/screendraft/ScreendraftPalette";
import { ScreendraftPropertiesPanel } from "@/components/screendraft/ScreendraftPropertiesPanel";
import { ScreendraftSaveControls } from "@/components/screendraft/ScreendraftSaveControls";
import { ScreendraftThemeToggle } from "@/components/screendraft/ScreendraftThemeToggle";
import { downloadMaquette } from "@/components/screendraft/screendraft-file";
import { historyShortcut, isEditableTarget } from "@/components/screendraft/screendraft-keyboard";
import { createNode } from "@/components/screendraft/screendraft-new-node";
import type { DraftNodeType, Maquette, ShapeKind } from "@/components/screendraft/screendraft-schema";
import { findNode } from "@/components/screendraft/screendraft-tree";
import { useScreendraftHistory } from "@/components/screendraft/use-screendraft-history";
import { useScreendraftSave } from "@/components/screendraft/use-screendraft-save";

type ScreendraftEditorProps = {
  initialDraft: Maquette;
  /** null : mode démo, la maquette n'est enregistrée nulle part. */
  projectId: number | null;
};

/** Éditeur plein écran, dans l'espace laissé sous la barre du Hub. */
export function ScreendraftEditor({ initialDraft, projectId }: ScreendraftEditorProps) {
  const { draft, dispatch, undo, redo, canUndo, canRedo } = useScreendraftHistory(initialDraft);
  // La sélection est un état de l'éditeur : elle n'est pas exportée dans le JSON.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selection = selectedId ? findNode(draft.nodes, selectedId) : null;
  const { save, status: saveStatus, savedDraft } = useScreendraftSave(projectId, initialDraft);
  const isDirty = projectId !== null && draft !== savedDraft;

  function addNode(type: DraftNodeType, shape?: ShapeKind) {
    const node = createNode(type, draft.nodes.length, shape);
    dispatch({ type: "add-node", node });
    setSelectedId(node.id);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
      const isSaveShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
      if (isSaveShortcut && projectId !== null) {
        event.preventDefault();
        void save(draft);
      }
      // Dans un champ de saisie, Ctrl/⌘ + Z annule la frappe : le navigateur s'en charge.
      const shortcut = isEditableTarget(event.target) ? null : historyShortcut(event);
      if (shortcut) {
        event.preventDefault();
        if (shortcut === "undo") undo();
        else redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draft, projectId, save, undo, redo]);

  // Le navigateur prévient avant de quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    if (!isDirty) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  return (
    // Le Hub n'impose pas de hauteur à la page : seul, l'éditeur grandirait avec la liste des calques
    // et ferait défiler la page. Le conteneur absolu occupe exactement l'espace sous la barre du Hub.
    <div className="relative min-h-0 flex-1">
      <div className="screendraft absolute inset-0 flex flex-col bg-(--surface) text-(--ink)">
        <header className="flex min-h-14 shrink-0 items-center gap-(--space-3) border-b border-(--line) bg-(--surface-raised) px-(--space-4) py-(--space-2)">
          {/* SVG servis tels quels : next/image n'a pas de loader en export statique. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmark.src} alt="Screen draft" className="sd-only-light h-8 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmarkWhite.src} alt="Screen draft" className="sd-only-dark h-8 w-auto" />
          <span aria-hidden className="text-body-sm text-(--line-strong)">
            /
          </span>
          <span className="text-body-sm truncate text-(--ink-muted)">{draft.name}</span>
          <div className="ml-auto flex items-center gap-(--space-3)">
            <ScreendraftHistoryControls
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
            />
            <ScreendraftSaveControls
              projectId={projectId}
              isDirty={isDirty}
              status={saveStatus}
              onSave={() => void save(draft)}
              onExport={() => downloadMaquette(draft)}
            />
            <ScreendraftThemeToggle />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-56 shrink-0 flex-col border-r border-(--line) bg-(--surface-raised)">
            <ScreendraftPalette onAdd={addNode} />
            <ScreendraftLayers
              nodes={draft.nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onPlace={(id, placement) => dispatch({ type: "place-node", id, placement })}
            />
          </div>
          {/* Changer de format (donc de largeur) recrée le canvas, qui se réajuste à l'écran. */}
          <ScreendraftCanvas
            key={draft.frame.width}
            draft={draft}
            selection={selection}
            onSelect={setSelectedId}
            onMove={(id, x, y) => dispatch({ type: "move-node", id, x, y })}
            onDropInto={(id, parentId) =>
              dispatch({ type: "place-node", id, placement: { type: "inside", parentId } })
            }
          />
          <ScreendraftPropertiesPanel frame={draft.frame} selection={selection} dispatch={dispatch} />
        </div>
      </div>
    </div>
  );
}
