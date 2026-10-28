import type { CSSProperties } from "react";
import type { Screen } from "@/components/screendraft/screendraft-schema";
import { ScreendraftNode } from "@/components/screendraft/ScreendraftNode";

// Rendu par défaut de ce que le schéma ne précise pas encore.
const TEXT_DEFAULTS: CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 16,
  lineHeight: 1.2,
  color: "#000000",
};

type ScreendraftFrameProps = {
  screen: Screen;
  style?: CSSProperties;
};

/** Un écran de la maquette à l'échelle 1. Le contenu qui dépasse du frame est masqué. */
export function ScreendraftFrame({ screen, style }: ScreendraftFrameProps) {
  const { frame } = screen;
  return (
    <div
      data-screen-id={screen.id}
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
      {screen.nodes.map((node) => (
        <ScreendraftNode key={node.id} node={node} />
      ))}
    </div>
  );
}
