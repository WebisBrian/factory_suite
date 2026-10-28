import { useContext, type CSSProperties } from "react";
import { a11yAttributes } from "@/components/screendraft/screendraft-a11y";
import { CarouselPreviewContext, wrapSlideIndex } from "@/components/screendraft/screendraft-carousel";
import type {
  ButtonNode,
  CarouselNode,
  DraftNode,
  NodeStyle,
  ShapeNode,
  VideoNode,
} from "@/components/screendraft/screendraft-schema";

/**
 * Un élément de la maquette, à l'échelle 1, positionné dans son parent.
 * `data-node-id` permet au canvas de retrouver l'élément cliqué.
 */
export function ScreendraftNode({ node }: { node: DraftNode }) {
  const style = { ...boxStyle(node), ...toCss(node.style) };
  // SCRUM-25 : mêmes attributs que dans la page générée.
  const a11y = a11yAttributes(node);

  switch (node.type) {
    case "section":
      return (
        <section data-node-id={node.id} {...a11y} style={style}>
          {node.children.map((child) => (
            <ScreendraftNode key={child.id} node={child} />
          ))}
        </section>
      );
    case "title": {
      const Heading = `h${node.props.level}` as const;
      return (
        <Heading data-node-id={node.id} {...a11y} style={style}>
          {node.props.text}
        </Heading>
      );
    }
    case "text":
      return (
        <p data-node-id={node.id} {...a11y} style={style}>
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
          alt={node.a11y?.decorative ? "" : node.props.alt}
          draggable={false}
          style={{ ...style, objectFit: node.props.fit }}
        />
      );
    case "video":
      return <VideoNodeView node={node} style={style} />;
    case "carousel":
      return <CarouselNodeView node={node} style={style} />;
    case "button":
      // Pas de vrai lien ni de vrai bouton : dans l'éditeur, un clic ne doit rien déclencher.
      return (
        <div data-node-id={node.id} {...a11y} style={{ ...style, ...buttonLayout(node) }}>
          {node.props.label}
        </div>
      );
    case "shape":
      return <ShapeNodeView node={node} style={style} />;
  }
}

const CAROUSEL_ARROW: CSSProperties = {
  position: "absolute",
  top: "50%",
  width: 40,
  height: 40,
  marginTop: -20,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgb(255 255 255 / 0.9)",
  color: "#111827",
  fontSize: 28,
  lineHeight: 1,
  boxShadow: "0 1px 4px rgb(0 0 0 / 0.3)",
};

/**
 * Une diapositive à la fois, avec les flèches et l'indicateur de position de la page générée.
 * Ils ne sont que dessinés : dans l'éditeur, la diapositive se choisit dans le panneau de
 * propriétés ; dans le prototype, de vrais boutons sont posés par-dessus.
 */
function CarouselNodeView({ node, style }: { node: CarouselNode; style: CSSProperties }) {
  const { slideIndex } = useContext(CarouselPreviewContext);
  const { slides, title } = node.props;
  const index = wrapSlideIndex(slideIndex(node.id), slides.length);
  const slide = slides[index];

  return (
    <div
      data-node-id={node.id}
      role="region"
      aria-roledescription="carrousel"
      aria-label={title}
      {...a11yAttributes(node)}
      style={{ ...style, overflow: "hidden", backgroundColor: style.backgroundColor ?? "#e5e7eb" }}
    >
      {slide ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.src}
          alt={slide.alt}
          draggable={false}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
          Ajoutez des images
        </div>
      )}
      {slides.length > 1 && (
        <div aria-hidden>
          <span style={{ ...CAROUSEL_ARROW, left: 12 }}>‹</span>
          <span style={{ ...CAROUSEL_ARROW, right: 12 }}>›</span>
          <span
            style={{
              position: "absolute",
              bottom: 12,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {slides.map((candidate, position) => (
              <span
                key={candidate.id}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: position === index ? "#ffffff" : "rgb(255 255 255 / 0.5)",
                  boxShadow: "0 0 0 1px rgb(0 0 0 / 0.3)",
                }}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Le lecteur est affiché mais pas utilisable dans l'éditeur : sans pointer-events
 * ni focus, le clic atteint le cadre et sélectionne l'élément au lieu de lancer la vidéo.
 */
function VideoNodeView({ node, style }: { node: VideoNode; style: CSSProperties }) {
  const { src, kind, title } = node.props;
  const playerStyle: CSSProperties = { width: "100%", height: "100%", border: 0, pointerEvents: "none" };
  return (
    <div data-node-id={node.id} {...a11yAttributes(node)} style={{ ...style, overflow: "hidden" }}>
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
    return <div data-node-id={node.id} {...a11yAttributes(node)} style={{ ...style, borderRadius }} />;
  }
  // Le fond et la bordure d'un triangle se dessinent en SVG, pas en CSS.
  return (
    <svg
      data-node-id={node.id}
      {...a11yAttributes(node)}
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
