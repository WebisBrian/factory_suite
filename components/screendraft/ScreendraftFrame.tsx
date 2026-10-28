import type { CSSProperties } from "react";
import type { Maquette } from "@/components/screendraft/screendraft-schema";
import { ScreendraftNode } from "@/components/screendraft/BrandScreendraftNode";

// Rendu par défaut de ce que le schéma ne précise pas encore.
const TEXT_DEFAULTS: CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 16,
  lineHeight: 1.2,
  color: "#000000",
};

type ScreendraftFrameProps = {
  draft: Maquette;
  style?: CSSProperties;
};

/** La maquette à l'échelle 1. Le contenu qui dépasse du frame est masqué. */
export function ScreendraftFrame({ draft, style }: ScreendraftFrameProps) {
  const { frame } = draft;
  return (
    <div
      style={{
        ...TEXT_DEFAULTS,
        position: "absolute",
        overflow: "hidden",
        width: frame.width,
        height: frame.height,
        backgroundColor: frame.backgroundColor,
        ...style,
      }}
    >
      {draft.nodes.map((node) => (
        <ScreendraftNode key={node.id} node={node} />
      ))}
    </div>
  );
}
