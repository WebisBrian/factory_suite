import { Fragment } from "react";
import { ScreendraftNodeIcon } from "@/components/screendraft/ScreendraftNodeIcon";
import type { DraftNode } from "@/components/screendraft/screendraft-schema";
import { nodeLabel } from "@/components/screendraft/screendraft-tree";

type LayerListProps = {
  nodes: DraftNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Calques de la maquette, du premier plan à l'arrière-plan comme dans Figma :
 * l'inverse de l'ordre du JSON. Les enfants d'une section sont décalés vers la droite.
 */
export function ScreendraftLayers(props: LayerListProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-(--line) p-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">Calques</h2>
      <ul className="-mx-(--space-2) min-h-0 flex-1 overflow-y-auto">
        <LayerRows {...props} depth={0} />
      </ul>
    </section>
  );
}

function LayerRows({ nodes, selectedId, onSelect, depth }: LayerListProps & { depth: number }) {
  return [...nodes].reverse().map((node) => {
    const isSelected = node.id === selectedId;
    return (
      <Fragment key={node.id}>
        <li>
          <button
            type="button"
            aria-current={isSelected || undefined}
            onClick={() => onSelect(node.id)}
            className={`text-body-sm flex w-full items-center gap-(--space-2) rounded-(--radius-md) py-(--space-1) pr-(--space-2) text-left ${
              isSelected ? "bg-(--draft-soft) text-(--draft)" : "text-(--ink) hover:bg-(--canvas)"
            }`}
            style={{ paddingLeft: `calc(var(--space-2) + var(--space-4) * ${depth})` }}
          >
            <span className={isSelected ? undefined : "text-(--ink-muted)"}>
              <ScreendraftNodeIcon type={node.type} />
            </span>
            <span className="truncate">{nodeLabel(node)}</span>
          </button>
        </li>
        {node.type === "section" && (
          <LayerRows nodes={node.children} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
        )}
      </Fragment>
    );
  });
}
