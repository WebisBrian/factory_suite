import type { CSSProperties, PointerEvent } from "react";
import type { DraftNode } from "@/app/screen-draft/_lib/schema";
import { ScreenDraftNodeRenderer } from "./ScreenDraftNodeRenderer";

export function ScreenDraftNode({
  node,
  selected = false,
  onPointerDown,
  onClick,
}: {
  node: DraftNode;
  selected?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onClick?: () => void;
}) {
  const style: CSSProperties = { position: "absolute", left: node.x, top: node.y, width: node.width, height: node.height };
  return (
    <div
      style={style}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={`cursor-move ${selected ? "ring-2 ring-sky-500 ring-offset-2" : ""}`}
    >
      <ScreenDraftNodeRenderer node={node} />
    </div>
  );
}
