import type { Dispatch } from "react";
import { ScreendraftNodeIcon } from "@/components/screendraft/ScreendraftNodeIcon";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import {
  canMoveInDepth,
  nodeLabel,
  type DepthMove,
  type NodeLocation,
} from "@/components/screendraft/screendraft-tree";

const DEPTH_ACTIONS: { move: DepthMove; label: string }[] = [
  { move: "front", label: "Premier plan" },
  { move: "forward", label: "Avancer" },
  { move: "backward", label: "Reculer" },
  { move: "back", label: "Arrière-plan" },
];

type ScreendraftDepthControlsProps = {
  location: NodeLocation;
  dispatch: Dispatch<ScreendraftAction>;
};

/** Niveau de profondeur de l'élément sélectionné, parmi les éléments du même parent (SCRUM-9). */
export function ScreendraftDepthControls({ location, dispatch }: ScreendraftDepthControlsProps) {
  const { node, index, siblingCount } = location;

  return (
    <section className="mb-(--space-4) border-b border-(--line) pb-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">Profondeur</h2>
      <p className="text-body-sm flex items-center gap-(--space-2) pb-(--space-1)">
        <span className="text-(--ink-muted)">
          <ScreendraftNodeIcon type={node.type} />
        </span>
        <span className="truncate">{nodeLabel(node)}</span>
      </p>
      <p className="text-body-sm pb-(--space-3) text-(--ink-muted)">
        Plan <span className="text-code text-(--ink)">{siblingCount - index}</span> sur{" "}
        <span className="text-code text-(--ink)">{siblingCount}</span>, 1 étant le premier plan
      </p>
      <div className="grid grid-cols-2 gap-(--space-2)">
        {DEPTH_ACTIONS.map(({ move, label }) => (
          <button
            key={move}
            type="button"
            disabled={!canMoveInDepth(location, move)}
            onClick={() => dispatch({ type: "move-depth", id: node.id, move })}
            className="text-body-sm rounded-(--radius-md) border border-(--line-strong) bg-(--surface-raised) px-(--space-2) py-(--space-1) text-(--ink) hover:bg-(--canvas) disabled:border-(--line) disabled:text-(--line-strong) disabled:hover:bg-(--surface-raised)"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
