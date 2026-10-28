import type { TitleNode } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftTitleNode({ node }: { node: TitleNode }) {
  const className = "font-bold outline-none";
  const style = { color: node.style.color, fontSize: node.style.fontSize, fontWeight: node.style.fontWeight, textAlign: node.style.textAlign };
  if (node.props.level === 1) return <h1 className={className} style={style}>{node.props.text}</h1>;
  if (node.props.level === 2) return <h2 className={className} style={style}>{node.props.text}</h2>;
  return <h3 className={className} style={style}>{node.props.text}</h3>;
}
