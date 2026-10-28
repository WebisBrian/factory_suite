import type { ButtonNode } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftButtonNode({ node }: { node: ButtonNode }) {
  return (
    <a
      href={node.props.href}
      style={{
        backgroundColor: node.style.backgroundColor,
        color: node.style.color,
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
        textAlign: node.style.textAlign,
        borderRadius: node.style.borderRadius,
      }}
      className="flex h-full w-full items-center justify-center"
    >
      {node.props.label}
    </a>
  );
}
