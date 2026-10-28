import type { CSSProperties } from "react";
import type { ScreenDraftDocument } from "../_lib/schema";
import NodeView from "./NodeView";

// Rendu par défaut de ce que le schéma ne précise pas encore.
const TEXT_DEFAULTS: CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 16,
  lineHeight: 1.2,
  color: "#000000",
};

type FrameViewProps = {
  draft: ScreenDraftDocument;
  style?: CSSProperties;
};

/** La maquette à l'échelle 1. Le contenu qui dépasse du frame est masqué. */
export default function FrameView({ draft, style }: FrameViewProps) {
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
        <NodeView key={node.id} node={node} />
      ))}
    </div>
  );
}
