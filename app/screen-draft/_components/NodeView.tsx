import type { CSSProperties } from "react";
import type { ButtonNode, DraftNode, NodeStyle } from "../_lib/schema";

/** Un élément de la maquette, à l'échelle 1, positionné dans son parent. */
export default function NodeView({ node }: { node: DraftNode }) {
  const style = { ...boxStyle(node), ...toCss(node.style) };

  switch (node.type) {
    case "section":
      return (
        <section style={style}>
          {node.children.map((child) => (
            <NodeView key={child.id} node={child} />
          ))}
        </section>
      );
    case "title": {
      const Heading = `h${node.props.level}` as const;
      return <Heading style={style}>{node.props.text}</Heading>;
    }
    case "text":
      return <p style={style}>{node.props.text}</p>;
    case "image":
      return (
        // URL libre affichée telle quelle : next/image exigerait de déclarer
        // chaque domaine et redimensionnerait l'image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={node.props.src}
          alt={node.props.alt}
          draggable={false}
          style={{ ...style, objectFit: node.props.fit }}
        />
      );
    case "button":
      // Pas de vrai lien ni de vrai bouton : dans l'éditeur, un clic ne doit rien déclencher.
      return <div style={{ ...style, ...buttonLayout(node) }}>{node.props.label}</div>;
  }
}

function boxStyle(node: DraftNode): CSSProperties {
  return {
    position: "absolute",
    left: node.x,
    top: node.y,
    width: node.width,
    height: node.height,
  };
}

function toCss({ borderWidth, borderColor, ...style }: NodeStyle): CSSProperties {
  if (!borderWidth) return style;
  return { ...style, border: `${borderWidth}px solid ${borderColor ?? "currentColor"}` };
}

const JUSTIFY_BY_ALIGN = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
} as const;

function buttonLayout(node: ButtonNode): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: JUSTIFY_BY_ALIGN[node.style.textAlign ?? "center"],
  };
}
