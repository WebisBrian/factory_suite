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
    <div className="flex flex-wrap items-center gap-1">
      {projectId !== null && (
        <p className="mr-2 max-w-full rounded-full border border-zinc-500 px-3 break-words py-1 text-sm text-zinc-200">
          <span className="sr-only">Projet ouvert : </span>
          {name ?? "Projet"} <span className="font-mono text-zinc-300">n° {projectId}</span>
        </p>
      )}
      <ul className="flex flex-wrap items-center gap-1">
        {HUB_TOOLS.map((tool) => {
          const active = pathname.startsWith(`/${tool.slug}`);
          const description = `${tool.label} : ${tool.description}${projectId !== null ? `, projet ${name ?? projectId}` : ", mode démo"}`;
          return (
            <li key={tool.slug}>
              <Link
                href={hubToolHref(tool, projectId)}
                aria-label={description}
                aria-current={active ? "page" : undefined}
                title={description}
                // Outil actif : fond + soulignement (repère qui ne dépend pas de la couleur).
                className={`flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-1.5 text-base transition-colors ${
                  active
                    ? "bg-white/15 font-bold text-white underline decoration-2 underline-offset-4"
                    : "text-zinc-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <HubAppIcon tool={tool} size="sm" />
                <span>{tool.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
