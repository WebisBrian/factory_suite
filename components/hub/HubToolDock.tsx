"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useProjectId } from "@/lib/project-fs";
import { HubAppIcon } from "@/components/hub/HubAppIcon";
import { HUB_TOOLS, hubToolHref, type HubTool } from "@/components/hub/hub-tools";

const dockButton =
  "flex min-h-11 items-center gap-2 rounded-full px-3 py-1.5 text-base text-white transition-colors hover:bg-white/15";

/** Fond « verre » : laisse deviner la page dessous, assez opaque pour garder le texte blanc lisible. */
const dockGlass =
  "pointer-events-auto rounded-full border border-white/25 bg-[#14141b]/75 shadow-lg shadow-black/40 backdrop-blur-md";

/** Choix replié / déplié, mémorisé dans le navigateur et commun aux trois outils. */
const STORAGE_KEY = "factorysuite:tool-dock-collapsed";
const listeners = new Set<() => void>();

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // Stockage indisponible (navigation privée) : le choix ne survit pas au changement de page.
  }
  listeners.forEach((listener) => listener());
}

function subscribeCollapsed(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toolPath(tool: HubTool): string {
  return tool.path ?? `/${tool.slug}`;
}

/**
 * Barre flottante commune aux trois outils, posée au-dessus du contenu : étape
 * précédente / suivante du pipeline et accès direct à chaque outil, en gardant le
 * project_id (ou le mode démo). Affichée uniquement sur les routes des outils.
 * Rétractable : repliée, il ne reste qu'un petit bouton « Outils » dans le coin.
 */
export function HubToolDock() {
  const pathname = usePathname();
  const projectId = useProjectId();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);

  const index = HUB_TOOLS.findIndex((tool) => pathname.startsWith(toolPath(tool)));
  if (index === -1) return null;

  if (collapsed) {
    return (
      <div className="pointer-events-none fixed bottom-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-expanded={false}
          aria-label="Afficher la barre des outils"
          className={`${dockGlass} ${dockButton} font-semibold`}
        >
          <span aria-hidden>▴</span> Outils
        </button>
      </div>
    );
  }

  const previous = HUB_TOOLS[index - 1];
  const next = HUB_TOOLS[index + 1];
  const context = projectId === null ? "mode démo" : `projet n° ${projectId}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        id="hub-tool-dock"
        className={`${dockGlass} flex max-w-full flex-wrap items-center justify-center gap-1 p-1`}
      >
        <nav aria-label={`Navigation entre les outils, ${context}`} className="flex flex-wrap items-center gap-1">
          {previous && (
            <Link
              href={hubToolHref(previous, projectId)}
              aria-label={`Précédent : ${previous.label}`}
              className={dockButton}
            >
              <span aria-hidden>←</span> Précédent
            </Link>
          )}
          <ol className="flex flex-wrap items-center gap-1">
            {HUB_TOOLS.map((tool, i) => {
              const active = i === index;
              return (
                <li key={tool.slug}>
                  <Link
                    href={hubToolHref(tool, projectId)}
                    aria-current={active ? "page" : undefined}
                    title={`Étape ${i + 1} : ${tool.description}`}
                    // Outil actif : fond + soulignement (repère qui ne dépend pas de la couleur).
                    className={`${dockButton} ${
                      active ? "bg-white/20 font-bold underline decoration-2 underline-offset-4" : ""
                    }`}
                  >
                    <HubAppIcon tool={tool} size="sm" />
                    <span>{tool.label}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {next && (
            <Link
              href={hubToolHref(next, projectId)}
              aria-label={`Suivant : ${next.label}`}
              className={`${dockButton} border-2 border-white/70 font-semibold`}
            >
              Suivant <span aria-hidden>→</span>
            </Link>
          )}
        </nav>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-expanded
          aria-controls="hub-tool-dock"
          title="Masquer la barre des outils"
          className={`${dockButton} border-l border-white/25`}
        >
          Masquer <span aria-hidden>▾</span>
        </button>
      </div>
    </div>
  );
}
