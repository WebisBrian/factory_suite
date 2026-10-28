import type { SectionNode } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftSectionNode({ node, children }: { node: SectionNode; children?: React.ReactNode }) {
  return (
    <section
      style={{
        backgroundColor: node.style.backgroundColor,
        borderRadius: node.style.borderRadius,
        borderWidth: node.style.borderWidth,
        borderColor: node.style.borderColor,
      }}
      className="relative"
    >
      {children}
    </section>
  );
}
