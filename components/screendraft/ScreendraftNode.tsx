import type { CSSProperties } from "react";
import type { ButtonNode, DraftNode, NodeStyle, ShapeNode, VideoNode } from "@/components/screendraft/screendraft-schema";

/**
 * Un élément de la maquette, à l'échelle 1, positionné dans son parent.
 * `data-node-id` permet au canvas de retrouver l'élément cliqué.
 */
export function ScreendraftNode({ node }: { node: DraftNode }) {
  const style = { ...boxStyle(node), ...toCss(node.style) };

  switch (node.type) {
    case "section":
      return (
        <section data-node-id={node.id} style={style}>
          {node.children.map((child) => (
            <ScreendraftNode key={child.id} node={child} />
          ))}
        </section>
      );
    case "title": {
      const Heading = `h${node.props.level}` as const;
      return (
        <Heading data-node-id={node.id} style={style}>
          {node.props.text}
        </Heading>
      );
    }
    case "text":
      return (
        <p data-node-id={node.id} style={style}>
          {node.props.text}
        </p>
      );
    case "image":
      return (
        // URL libre affichée telle quelle : next/image exigerait de déclarer
        // chaque domaine et redimensionnerait l'image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          data-node-id={node.id}
          src={node.props.src}
          alt={node.props.alt}
          draggable={false}
          style={{ ...style, objectFit: node.props.fit }}
        />
      );
    case "video":
      return <VideoNodeView node={node} style={style} />;
    case "button":
      // Pas de vrai lien ni de vrai bouton : dans l'éditeur, un clic ne doit rien déclencher.
      return (
        <div data-node-id={node.id} style={{ ...style, ...buttonLayout(node) }}>
          {node.props.label}
        </div>
      );
    case "shape":
      return <ShapeNodeView node={node} style={style} />;
  }
}

/**
 * Le lecteur est affiché mais pas utilisable dans l'éditeur : sans pointer-events
 * ni focus, le clic atteint le cadre et sélectionne l'élément au lieu de lancer la vidéo.
 */
function VideoNodeView({ node, style }: { node: VideoNode; style: CSSProperties }) {
  const { src, kind, title } = node.props;
  const playerStyle: CSSProperties = { width: "100%", height: "100%", border: 0, pointerEvents: "none" };
  return (
    <div data-node-id={node.id} style={{ ...style, overflow: "hidden" }}>
      {!src ? (
        <div
          style={{
            display: "flex",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 18,
          }}
        >
          ▶ Ajoutez un lien vidéo
        </div>
      ) : kind === "embed" ? (
        <iframe src={src} title={title} tabIndex={-1} loading="lazy" allowFullScreen style={playerStyle} />
      ) : (
        <video src={src} aria-label={title} preload="metadata" muted tabIndex={-1} style={playerStyle} />
      )}
    </div>
  );
}

function ShapeNodeView({ node, style }: { node: ShapeNode; style: CSSProperties }) {
  if (node.props.shape !== "triangle") {
    const borderRadius = node.props.shape === "circle" ? "50%" : style.borderRadius;
    return <div data-node-id={node.id} style={{ ...style, borderRadius }} />;
  }
  // Le fond et la bordure d'un triangle se dessinent en SVG, pas en CSS.
  return (
    <svg
      data-node-id={node.id}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ ...boxStyle(node), overflow: "visible" }}
    >
      <polygon
        points="50,0 100,100 0,100"
        fill={node.style.backgroundColor}
        stroke={node.style.borderColor}
        strokeWidth={node.style.borderWidth}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
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
