"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getProjectName, useProjectId } from "@/lib/project-fs";
import { HubAppIcon } from "@/components/hub/HubAppIcon";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";

/** Passage d'un outil à l'autre en gardant le project_id courant. */
export function HubNavSwitcher() {
  const pathname = usePathname();
  const projectId = useProjectId();
  const [projectName, setProjectName] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    if (projectId === null) return;
    let cancelled = false;
    // Sans dossier autorisé, on garde simplement l'affichage "Projet #N".
    getProjectName(projectId).then(
      (name) => !cancelled && setProjectName({ id: projectId, name }),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const name = projectName?.id === projectId ? projectName.name : null;

  return (
    <div className="flex items-center gap-1">
      {projectId !== null && (
        <span className="mr-2 hidden max-w-56 truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 sm:inline">
          {name ?? "Projet"} <span className="font-mono text-zinc-500">#{projectId}</span>
        </span>
      )}
      {HUB_TOOLS.map((tool) => {
        const active = pathname.startsWith(`/${tool.slug}`);
        return (
          <Link
            key={tool.slug}
            href={hubToolHref(tool, projectId)}
            title={`${tool.label} — ${tool.description}`}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
              active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <HubAppIcon tool={tool} size="sm" />
            <span className="hidden md:inline">{tool.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
