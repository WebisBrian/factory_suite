import { useContext, type CSSProperties } from "react";
import { a11yAttributes } from "@/components/screendraft/screendraft-a11y";
import { CarouselPreviewContext, wrapSlideIndex } from "@/components/screendraft/screendraft-carousel";
import { TILE_SIZE, pointInMap, visibleTiles } from "@/components/screendraft/screendraft-map";
import { MapViewOverrideContext } from "@/components/screendraft/screendraft-map-context";
import type {
  ButtonNode,
  CarouselNode,
  DraftNode,
  MapNode,
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
    case "map":
      return <MapNodeView node={node} style={style} />;
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

/**
 * Carte OpenStreetMap figée sur son centre et son zoom, avec ses points d'intérêt.
 * Les tuiles et les points sont placés par calcul (screendraft-map) : ni bibliothèque, ni API.
 */
function MapNodeView({ node, style }: { node: MapNode; style: CSSProperties }) {
  const viewOverride = useContext(MapViewOverrideContext);
  const { markers, title } = node.props;
  // Dans le prototype, la carte explorée montre sa propre vue sans toucher à la maquette.
  const { latitude, longitude, zoom } = viewOverride(node.id) ?? node.props;
  const center = { latitude, longitude };
  const size = { width: node.width, height: node.height };

  return (
    <div
      data-node-id={node.id}
      role="img"
      aria-label={title}
      {...a11yAttributes(node)}
      // Couleur de la mer d'OpenStreetMap, le temps que les tuiles arrivent.
      style={{ ...style, overflow: "hidden", backgroundColor: style.backgroundColor ?? "#aad3df" }}
    >
      {visibleTiles(center, zoom, size).map((tile) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tile.key}
          src={tile.src}
          alt=""
          draggable={false}
          style={{ position: "absolute", left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}
        />
      ))}
      {markers.map((marker) => {
        const point = pointInMap(marker, center, zoom, size);
        return (
          <div
            key={marker.id}
            style={{
              position: "absolute",
              left: point.x,
              top: point.y,
              transform: "translate(-50%, -100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span
              style={{
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: "#ffffff",
                color: "#111827",
                fontSize: 13,
                whiteSpace: "nowrap",
                boxShadow: "0 1px 3px rgb(0 0 0 / 0.35)",
              }}
            >
              {marker.label}
            </span>
            <svg width={24} height={32} viewBox="0 0 24 32" aria-hidden>
              <path
                d="M12 1C5.9 1 1 5.9 1 12c0 8.3 11 19 11 19s11-10.7 11-19C23 5.9 18.1 1 12 1z"
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={2}
              />
              <circle cx={12} cy={12} r={4} fill="#ffffff" />
            </svg>
          </div>
        );
      })}
      <span
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          padding: "1px 6px",
          backgroundColor: "rgb(255 255 255 / 0.85)",
          color: "#111827",
          fontSize: 12,
        }}
      >
        © OpenStreetMap
      </span>
    </div>
  );
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
