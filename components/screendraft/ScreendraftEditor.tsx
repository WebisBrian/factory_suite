"use client";

import "@/components/screendraft/screendraft-theme.css";
import { useEffect, useRef, useState } from "react";
import wordmark from "@/components/screendraft/brand/logos/screen-draft-wordmark.svg";
import wordmarkWhite from "@/components/screendraft/brand/logos/screen-draft-wordmark-white.svg";
import { ScreendraftCanvas } from "@/components/screendraft/ScreendraftCanvas";
import { ScreendraftHistoryControls } from "@/components/screendraft/ScreendraftHistoryControls";
import { ScreendraftLayers } from "@/components/screendraft/ScreendraftLayers";
import { ScreendraftLibrary } from "@/components/screendraft/ScreendraftLibrary";
import { ScreendraftMultiSelection } from "@/components/screendraft/ScreendraftMultiSelection";
import { ScreendraftPalette } from "@/components/screendraft/ScreendraftPalette";
import {
  ScreendraftPropertiesPanel,
  type ScreendraftComponentHandlers,
} from "@/components/screendraft/ScreendraftPropertiesPanel";
import { ScreendraftPrototype } from "@/components/screendraft/ScreendraftPrototype";
import { ScreendraftSaveControls } from "@/components/screendraft/ScreendraftSaveControls";
import { ScreendraftScreens } from "@/components/screendraft/ScreendraftScreens";
import { ScreendraftTemplateDialog } from "@/components/screendraft/ScreendraftTemplateDialog";
import { ScreendraftThemeToggle } from "@/components/screendraft/ScreendraftThemeToggle";
import {
  instantiateComponent,
  type CustomComponent,
} from "@/components/screendraft/screendraft-components";
import { downloadMaquette } from "@/components/screendraft/screendraft-file";
import {
  clipboardShortcut,
  historyShortcut,
  isDeleteShortcut,
  isEditableTarget,
} from "@/components/screendraft/screendraft-keyboard";
import { cloneNode, createNode } from "@/components/screendraft/screendraft-new-node";
import type {
  DraftNode,
  DraftNodeType,
  Maquette,
  ShapeKind,
} from "@/components/screendraft/screendraft-schema";
import { groupNodes } from "@/components/screendraft/screendraft-group";
import {
  createScreen,
  findScreenNode,
  type ScreenNodeLocation,
} from "@/components/screendraft/screendraft-screens";
import { frameRect } from "@/components/screendraft/screendraft-tree";
import { useScreendraftHistory } from "@/components/screendraft/use-screendraft-history";
import { useScreendraftLibrary } from "@/components/screendraft/use-screendraft-library";
import { useScreendraftSave } from "@/components/screendraft/use-screendraft-save";
import type { ScreendraftTemplate } from "@/components/screendraft/templates/screendraft-templates";

/** Élément copié ou coupé, son ancien parent et le décalage à appliquer au prochain collage. */
type ScreendraftClipboard = { node: DraftNode; parentId: string | null; offset: number };

const PASTE_OFFSET = 16;

type ScreendraftEditorProps = {
  initialDraft: Maquette;
  /** null : mode démo, la maquette n'est enregistrée nulle part. */
  projectId: number | null;
};

/** Éditeur plein écran, dans l'espace laissé sous la barre du Hub. */
export function ScreendraftEditor({ initialDraft, projectId }: ScreendraftEditorProps) {
  const { draft, dispatch, undo, redo, canUndo, canRedo } = useScreendraftHistory(initialDraft);
  // L'écran actif et la sélection sont des états de l'éditeur : ils ne sont pas exportés dans le JSON.
  const [activeScreenId, setActiveScreenId] = useState(initialDraft.screens[0].id);
  // Plusieurs éléments avec Maj + clic, toujours dans un même écran.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPrototypeOpen, setIsPrototypeOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const templatesButton = useRef<HTMLButtonElement>(null);
  // Une fenêtre (prototype ou modèles) couvre l'éditeur : il est inerte et ignore ses raccourcis.
  const isOverlayOpen = isPrototypeOpen || isTemplatesOpen;
  // Après une annulation ou une suppression, l'écran actif peut ne plus exister : on revient au premier.
  const activeScreen = draft.screens.find((screen) => screen.id === activeScreenId) ?? draft.screens[0];
  // Un élément supprimé (ou annulé) disparaît de la sélection.
  const selections = selectedIds
    .map((id) => findScreenNode(draft.screens, id))
    .filter((found): found is ScreenNodeLocation => found !== null);
  // Un seul élément : ses propriétés. Plusieurs : le panneau de sélection multiple.
  const selection = selections.length === 1 ? selections[0] : null;
  const { save, status: saveStatus, savedDraft } = useScreendraftSave(projectId, initialDraft);
  const isDirty = projectId !== null && draft !== savedDraft;
  // Presse-papiers interne à l'éditeur, comme la sélection : il n'est jamais exporté.
  const clipboard = useRef<ScreendraftClipboard | null>(null);
  const library = useScreendraftLibrary(projectId);

  function setSelectedId(id: string | null) {
    setSelectedIds(id === null ? [] : [id]);
  }

  // Maj + clic : ajoute ou retire l'élément. Un élément d'un autre écran repart d'une sélection neuve.
  function toggleSelected(id: string) {
    const screenId = findScreenNode(draft.screens, id)?.screen.id;
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((other) => other !== id);
      const sameScreen = current.every((other) => findScreenNode(draft.screens, other)?.screen.id === screenId);
      return sameScreen ? [...current, id] : [id];
    });
  }

  // Sélection multiple : les éléments passent dans une nouvelle section, qui reste sélectionnée.
  function groupSelection() {
    const wrapperId = `section_${Date.now()}`;
    dispatch({ type: "group-nodes", ids: selections.map(({ location }) => location.node.id), wrapperId });
    setSelectedId(wrapperId);
  }

  // Comme le groupement, mais la section devient un composant (enregistré d'abord) et sa première instance.
  async function createComponentFromSelection(name: string) {
    const ids = selections.map(({ location }) => location.node.id);
    const screen = selections[0]?.screen;
    const wrapperId = `section_${Date.now()}`;
    const grouped = screen ? groupNodes(screen.nodes, ids, wrapperId) : null;
    if (!grouped) return;
    const component = await library.add(name, grouped.wrapper);
    if (!component) return;
    dispatch({ type: "group-nodes", ids, wrapperId, component });
    setSelectedId(wrapperId);
  }

  function addNode(type: DraftNodeType, shape?: ShapeKind) {
    const node = createNode(type, activeScreen.nodes.length, shape);
    dispatch({ type: "add-node", screenId: activeScreen.id, node });
    setSelectedId(node.id);
  }

  // Inséré dans l'écran actif, comme un composant de base.
  function insertComponent(component: CustomComponent) {
    const node = instantiateComponent(component, activeScreen.nodes.length);
    dispatch({ type: "add-node", screenId: activeScreen.id, node });
    setSelectedId(node.id);
  }

  // La bibliothèque est enregistrée d'abord : la maquette ne change que si l'écriture a réussi,
  // sinon ses instances ne correspondraient plus au fichier des composants.
  const componentHandlers: ScreendraftComponentHandlers = {
    // L'élément d'origine devient la première instance du composant.
    create: async (name, node) => {
      const component = await library.add(name, node);
      if (component) dispatch({ type: "reset-instance", id: node.id, component });
    },
    update: async (node) => {
      if (node.componentId === undefined) return;
      const component = await library.updateContent(node.componentId, node);
      if (component) dispatch({ type: "sync-component", component });
    },
    reset: (id, component) => dispatch({ type: "reset-instance", id, component }),
    detach: (id) => dispatch({ type: "detach-instance", id }),
  };

  async function removeComponent(componentId: string) {
    if (await library.remove(componentId)) dispatch({ type: "detach-component", componentId });
  }

  // Le modèle remplace la maquette, en une étape de l'historique : Ctrl/⌘ + Z la rend.
  function loadTemplate(template: ScreendraftTemplate) {
    dispatch({ type: "load-template", template: template.maquette });
    setActiveScreenId(template.maquette.screens[0].id);
    setSelectedId(null);
    setIsTemplatesOpen(false);
    setTemplateMessage(`Modèle « ${template.name} » chargé. Ctrl/⌘ + Z pour annuler.`);
    requestAnimationFrame(() => templatesButton.current?.focus());
  }

  function closeTemplates() {
    setIsTemplatesOpen(false);
    requestAnimationFrame(() => templatesButton.current?.focus());
  }

  // Nouvel écran au format de l'écran actif, ajouté à droite et activé.
  function addScreen() {
    const screen = createScreen(draft.screens, activeScreen.frame);
    dispatch({ type: "add-screen", screen });
    activateScreen(screen.id);
  }

  // Changer d'écran désélectionne les éléments d'un autre écran.
  function activateScreen(screenId: string) {
    setActiveScreenId(screenId);
    if (selections.some((found) => found.screen.id !== screenId)) setSelectedId(null);
  }

  // L'élément passe dans un autre écran, qui devient actif : il reste sélectionné.
  function moveToScreen(id: string, screenId: string, parentId: string | null, x: number, y: number) {
    dispatch({ type: "move-to-screen", id, screenId, parentId, x, y });
    setActiveScreenId(screenId);
  }

  /**
   * Depuis la liste des écrans ou le panneau de propriétés : l'élément passe au premier niveau
   * de l'autre écran, à la même place dans le frame, ramené à l'intérieur si l'écran est plus petit.
   */
  function sendToScreen(id: string, screenId: string) {
    const found = findScreenNode(draft.screens, id);
    const target = draft.screens.find((screen) => screen.id === screenId);
    if (!found || !target || found.screen.id === screenId) return;
    const rect = frameRect(found.location);
    const x = clamp(rect.x, 0, Math.max(0, target.frame.width - rect.width));
    const y = clamp(rect.y, 0, Math.max(0, target.frame.height - rect.height));
    moveToScreen(id, screenId, null, x, y);
  }

  // Clic sur le canvas : l'écran cliqué devient actif, l'élément cliqué est sélectionné.
  // Maj + clic sur le fond garde la sélection, pour ne pas la perdre sur un clic manqué.
  function pick(screenId: string | null, nodeId: string | null, additive: boolean) {
    if (screenId) setActiveScreenId(screenId);
    if (additive && nodeId) toggleSelected(nodeId);
    else if (!additive) setSelectedId(nodeId);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // L'aperçu du prototype et les modèles gèrent leurs propres touches : l'éditeur derrière ne bouge pas.
      if (isOverlayOpen) return;
      if (event.key === "Escape") setSelectedId(null);
      const isSaveShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
      if (isSaveShortcut && projectId !== null) {
        event.preventDefault();
        void save(draft);
      }
      // Dans un champ de saisie, ces raccourcis agissent sur le texte : le navigateur s'en charge.
      if (isEditableTarget(event.target)) return;
      const shortcut = historyShortcut(event);
      if (shortcut) {
        event.preventDefault();
        if (shortcut === "undo") undo();
        else redo();
      }
      if (isDeleteShortcut(event) && selections.length > 0) {
        event.preventDefault();
        dispatch({ type: "delete-nodes", ids: selections.map(({ location }) => location.node.id) });
        setSelectedId(null);
      }
      const clipboardAction = clipboardShortcut(event);
      if (clipboardAction === "paste" && clipboard.current) {
        event.preventDefault();
        const { node, parentId, offset } = clipboard.current;
        const pasted = cloneNode(node, offset);
        // Collé dans l'écran actif : copier dans un écran puis coller dans un autre duplique l'élément.
        dispatch({ type: "paste-node", screenId: activeScreen.id, node: pasted, parentId });
        setSelectedId(pasted.id);
        // Coller plusieurs fois décale chaque copie de la précédente.
        clipboard.current = { node: pasted, parentId, offset: PASTE_OFFSET };
      } else if (clipboardAction && selection) {
        event.preventDefault();
        // Une copie se colle décalée de l'original ; un élément coupé revient à sa place.
        clipboard.current = {
          node: selection.location.node,
          parentId: selection.location.parentId,
          offset: clipboardAction === "copy" ? PASTE_OFFSET : 0,
        };
        if (clipboardAction === "cut") {
          dispatch({ type: "delete-node", id: selection.location.node.id });
          setSelectedId(null);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draft, projectId, save, undo, redo, dispatch, selection, selections, activeScreen.id, isOverlayOpen]);

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
    <main className="relative min-h-0 flex-1">
      <div className="screendraft absolute inset-0 flex flex-col bg-(--surface) text-(--ink)">
        {isPrototypeOpen && (
          <ScreendraftPrototype
            screens={draft.screens}
            startScreenId={activeScreen.id}
            onClose={() => setIsPrototypeOpen(false)}
          />
        )}
        {isTemplatesOpen && <ScreendraftTemplateDialog onChoose={loadTemplate} onClose={closeTemplates} />}
        {/* Pendant l'aperçu, l'éditeur est inerte : ni clic, ni focus clavier. */}
        <header inert={isOverlayOpen} className="flex min-h-14 shrink-0 flex-wrap items-center gap-(--space-3) border-b border-(--line) bg-(--surface-raised) px-(--space-4) py-(--space-2)">
          {/* Titre unique de la page (RGAA 9.1) : l'outil et la maquette ouverte. */}
          <h1 className="flex min-w-0 flex-wrap items-center gap-(--space-3)">
            {/* SVG servis tels quels : next/image n'a pas de loader en export statique. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={wordmark.src} alt="Screen draft" className="sd-only-light h-8 w-auto" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={wordmarkWhite.src} alt="Screen draft" className="sd-only-dark h-8 w-auto" />
            <span aria-hidden className="text-body-sm text-(--ink-muted)">
              /
            </span>
            <span className="sr-only">, maquette </span>
            <span className="text-body-sm min-w-0 break-words text-(--ink-muted)">{draft.name}</span>
          </h1>
          <p role="status" className="sr-only">
            {templateMessage}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-(--space-3)">
            <button
              ref={templatesButton}
              type="button"
              onClick={() => setIsTemplatesOpen(true)}
              aria-haspopup="dialog"
              className="text-body-sm flex min-h-10 items-center gap-(--space-2) rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-4) py-(--space-2) font-semibold text-(--ink) hover:bg-(--canvas)"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current">
                <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
              </svg>
              Modèles
            </button>
            <button
              type="button"
              onClick={() => setIsPrototypeOpen(true)}
              className="text-body-sm flex min-h-10 items-center gap-(--space-2) rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-4) py-(--space-2) font-semibold text-(--ink) hover:bg-(--canvas)"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
              </svg>
              Prototype
            </button>
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

        <div inert={isOverlayOpen} className="flex min-h-0 flex-1">
          {/* Tout le panneau défile d'un bloc ; chaque section se replie (ScreendraftPanelSection). */}
          <div className="flex w-60 max-w-[30vw] shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-(--line) bg-(--surface-raised)">
            <ScreendraftPalette onAdd={addNode} />
            <ScreendraftScreens
              screens={draft.screens}
              activeScreenId={activeScreen.id}
              onActivate={activateScreen}
              onAdd={addScreen}
              onDropNode={sendToScreen}
            />
            <ScreendraftLibrary
              components={library.components}
              status={library.status}
              isDemo={projectId === null}
              onInsert={insertComponent}
              onRename={(id, name) => void library.rename(id, name)}
              onRemove={(id) => void removeComponent(id)}
            />
            <ScreendraftLayers
              nodes={activeScreen.nodes}
              selectedIds={selectedIds}
              onSelect={(id, additive) => (additive ? toggleSelected(id) : setSelectedId(id))}
              onPlace={(id, placement) => dispatch({ type: "place-node", id, placement })}
              onRename={(id, name) => dispatch({ type: "rename-node", id, name })}
            />
          </div>
          {/* Ajouter, supprimer un écran, changer de format (donc de largeur) ou charger un modèle
              recrée le canvas, qui se réajuste pour montrer tous les écrans. */}
          <ScreendraftCanvas
            key={draft.screens.map((screen) => `${screen.id}:${screen.frame.width}`).join(",")}
            screens={draft.screens}
            activeScreenId={activeScreen.id}
            selections={selections}
            onPick={pick}
            onMove={(id, x, y) => dispatch({ type: "move-node", id, x, y })}
            onDropInto={(id, parentId) =>
              dispatch({ type: "place-node", id, placement: { type: "inside", parentId } })
            }
            onMoveToScreen={moveToScreen}
          />
          <ScreendraftPropertiesPanel
            screen={activeScreen}
            canDeleteScreen={draft.screens.length > 1}
            selection={selection?.location ?? null}
            selectionScreenId={selection?.screen.id ?? null}
            screens={draft.screens}
            theme={draft.theme}
            onSendToScreen={sendToScreen}
            dispatch={dispatch}
            components={library.components}
            componentHandlers={componentHandlers}
            multiSelection={
              selections.length > 1 && (
                <ScreendraftMultiSelection
                  // Une nouvelle sélection repart du nom par défaut.
                  key={selectedIds.join(",")}
                  count={selections.length}
                  onCreateComponent={(name) => void createComponentFromSelection(name)}
                  onGroup={groupSelection}
                  onDelete={() => {
                    dispatch({ type: "delete-nodes", ids: selections.map(({ location }) => location.node.id) });
                    setSelectedId(null);
                  }}
                />
              )
            }
          />
        </div>
      </div>
    </main>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
