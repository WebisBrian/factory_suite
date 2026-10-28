import type { ShapeNode as ShapeNodeData } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftShapeNode({ node }: { node: ShapeNodeData }) {
  if (node.props.shape === "triangle") {
    return (
      <svg
        aria-label="Triangle"
        className="block h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
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

  return (
    <div
      aria-label={node.props.shape === "circle" ? "Rond" : "Carré"}
      className="h-full w-full"
      style={{
        backgroundColor: node.style.backgroundColor,
        borderColor: node.style.borderColor,
        borderRadius: node.props.shape === "circle" ? "50%" : node.style.borderRadius,
        borderStyle: node.style.borderWidth ? "solid" : undefined,
        borderWidth: node.style.borderWidth,
      }}
    />
  );
}
