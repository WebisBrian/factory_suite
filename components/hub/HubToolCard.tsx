import Link from "next/link";
import { HubIcon } from "@/components/hub/HubIcons";
import type { HubTool } from "@/components/hub/hub-tools";

type HubToolCardProps = {
  tool: HubTool;
};

export function HubToolCard({ tool }: HubToolCardProps) {
  return (
    <Link
      href={tool.href}
      className="group flex flex-col gap-4 rounded-card border border-border bg-surface p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-control bg-accent-soft text-accent">
          <HubIcon name={tool.icon} className="size-5" />
        </span>
        <span className="font-mono text-xs text-fg-subtle">
          Étape {tool.step}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-fg">{tool.label}</h2>
        <p className="text-sm leading-relaxed text-fg-muted">
          {tool.description}
        </p>
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-control bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg transition-colors group-hover:bg-accent-hover">
        Ouvrir
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
