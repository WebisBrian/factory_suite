import type { FrameFormat } from "@/components/screendraft/screendraft-formats";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import { moveInDepth, type DepthMove } from "@/components/screendraft/screendraft-tree";

/** Toutes les modifications de la maquette passent par ici, une action par story. */
export type ScreendraftAction =
  | { type: "set-format"; format: FrameFormat }
  | { type: "set-frame-height"; height: number }
  | { type: "move-depth"; id: string; move: DepthMove };

export function screendraftReducer(draft: Maquette, action: ScreendraftAction): Maquette {
  switch (action.type) {
    // Les éléments ne bougent pas : ce qui dépasse du nouveau frame est masqué.
    case "set-format": {
      const { device, width, height } = action.format;
      return { ...draft, frame: { ...draft.frame, device, width, height } };
    }
    case "set-frame-height":
      return { ...draft, frame: { ...draft.frame, height: action.height } };
    case "move-depth": {
      const nodes = moveInDepth(draft.nodes, action.id, action.move);
      return nodes === draft.nodes ? draft : { ...draft, nodes };
    }
  }
}
