import Link from "next/link";
import { HubIcon } from "@/components/hub/HubIcons";
import type { HubTool } from "@/components/hub/hub-tools";

type HubStubPageProps = {
  tool: HubTool;
};

export function HubStubPage({ tool }: HubStubPageProps) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-card border border-dashed border-border bg-surface p-8">
      <span className="grid size-12 place-items-center rounded-control bg-accent-soft text-accent">
        <HubIcon name={tool.icon} className="size-6" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{tool.label}</h1>
        <p className="text-fg-muted">
          En construction — développé par la squad {tool.squad}.
        </p>
      </div>
      <Link
        href="/"
        className="text-sm font-medium text-accent hover:text-accent-hover"
      >
        ← Retour à l&apos;accueil
      </Link>
    </section>
  );
}
