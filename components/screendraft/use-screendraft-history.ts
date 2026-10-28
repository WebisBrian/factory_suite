import { useCallback, useReducer } from "react";
import {
  commit,
  createHistory,
  redo,
  undo,
  type History,
} from "@/components/screendraft/screendraft-history";
import {
  screendraftReducer,
  type ScreendraftAction,
} from "@/components/screendraft/screendraft-reducer";
import type { Maquette } from "@/components/screendraft/screendraft-schema";

type HistoryEvent =
  | { type: "apply"; action: ScreendraftAction; at: number }
  | { type: "undo" }
  | { type: "redo" };

function historyReducer(history: History<Maquette>, event: HistoryEvent): History<Maquette> {
  switch (event.type) {
    case "apply":
      return commit(
        history,
        screendraftReducer(history.present, event.action),
        groupKey(event.action),
        event.at,
      );
    case "undo":
      return undo(history);
    case "redo":
      return redo(history);
  }
}

/**
 * Actions envoyées en continu pendant un même geste, à regrouper en une seule étape :
 * déplacer un élément (et le lâcher dans une section), taper son texte ou le nom d'un écran,
 * régler une couleur.
 */
function groupKey(action: ScreendraftAction): string | null {
  switch (action.type) {
    case "move-node":
    case "place-node":
    case "move-to-screen":
      return `move:${action.id}`;
    case "set-text":
      return `text:${action.id}`;
    case "rename-screen":
      return `screen-name:${action.screenId}`;
    // Glisser dans un sélecteur de couleur, taper un libellé ou un lien.
    case "set-style":
      return `style:${action.id}:${Object.keys(action.style).join()}`;
    case "set-props":
      return `props:${action.id}:${Object.keys(action.props).join()}`;
    default:
      return null;
  }
}

/** État de la maquette avec annulation : `dispatch` s'utilise comme celui de `screendraftReducer`. */
export function useScreendraftHistory(initialDraft: Maquette) {
  const [history, dispatchHistory] = useReducer(historyReducer, initialDraft, createHistory);

  const dispatch = useCallback(
    (action: ScreendraftAction) => dispatchHistory({ type: "apply", action, at: Date.now() }),
    [],
  );
  const undoChange = useCallback(() => dispatchHistory({ type: "undo" }), []);
  const redoChange = useCallback(() => dispatchHistory({ type: "redo" }), []);

  return {
    draft: history.present,
    dispatch,
    undo: undoChange,
    redo: redoChange,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
