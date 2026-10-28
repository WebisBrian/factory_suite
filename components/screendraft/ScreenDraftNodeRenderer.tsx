import type { DraftNode } from "@/app/screen-draft/_lib/schema";
import { ScreenDraftButtonNode } from "./ScreenDraftButtonNode";
import { ScreenDraftImageNode } from "./ScreenDraftImageNode";
import { ScreenDraftSectionNode } from "./ScreenDraftSectionNode";
import { ScreenDraftTextNode } from "./ScreenDraftTextNode";
import { ScreenDraftTitleNode } from "./ScreenDraftTitleNode";

export function ScreenDraftNodeRenderer({ node }: { node: DraftNode }) {
  switch (node.type) {
    case "text": return <ScreenDraftTextNode node={node} />;
    case "title": return <ScreenDraftTitleNode node={node} />;
    case "image": return <ScreenDraftImageNode node={node} />;
    case "button": return <ScreenDraftButtonNode node={node} />;
    case "section": return <ScreenDraftSectionNode node={node} />;
  }
}
