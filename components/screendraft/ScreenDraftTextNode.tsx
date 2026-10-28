import type { TextNode } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftTextNode({
  node,
  editable = false,
  onChange,
}: {
  node: TextNode;
  editable?: boolean;
  onChange?: (text: string) => void;
}) {
  return (
    <div
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={(event) => onChange?.(event.currentTarget.textContent ?? "")}
      style={{ color: node.style.color, fontSize: node.style.fontSize, fontWeight: node.style.fontWeight, textAlign: node.style.textAlign }}
      className="min-h-full outline-none"
    >
      {node.props.text}
    </div>
  );
}
