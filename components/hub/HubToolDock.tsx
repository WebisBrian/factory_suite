"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useProjectId } from "@/lib/project-fs";
import { HubAppIcon } from "@/components/hub/HubAppIcon";
import { HUB_TOOLS, hubToolHref, type HubTool } from "@/components/hub/hub-tools";

const dockButton =
  "flex min-h-11 items-center gap-2 rounded-full px-3 py-1.5 text-base text-zinc-100 transition-colors hover:bg-white/10 hover:text-white";

/** Variable CSS lue par app/layout.tsx pour laisser la place de la barre sous le contenu. */
const DOCK_SPACE = "--hub-dock-space";
/** Marge (px) entre le contenu et le haut de la barre. */
const DOCK_MARGIN = 8;

function toolPath(tool: HubTool): string {
  return tool.path ?? `/${tool.slug}`;
}

/**
 * Barre flottante commune aux trois outils : étape précédente / suivante du pipeline
 * et accès direct à chaque outil, en gardant le project_id (ou le mode démo).
 * Affichée uniquement sur les routes des outils, pas sur le Hub.
 * Repliable : avec le texte agrandi, elle ne doit pas masquer le contenu de l'outil.
 */
export function HubToolDock() {
  const pathname = usePathname();
  const index = HUB_TOOLS.findIndex((tool) => pathname.startsWith(toolPath(tool)));
  return index === -1 ? null : <HubToolDockBar index={index} />;
}

function HubToolDockBar({ index }: { index: number }) {
  const projectId = useProjectId();
  const [open, setOpen] = useState(true);
  const dock = useRef<HTMLDivElement>(null);

  // Réserve sous le contenu la hauteur réelle de la barre (texte agrandi, barre repliée) :
  // elle ne recouvre ainsi jamais les contrôles des outils (ex. zoom de ScreenDraft).
  useEffect(() => {
    const element = dock.current;
    if (!element) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(([entry]) =>
      root.style.setProperty(DOCK_SPACE, `${Math.ceil(entry.borderBoxSize[0].blockSize) + DOCK_MARGIN}px`),
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty(DOCK_SPACE);
    };
  }, []);

  const previous = HUB_TOOLS[index - 1];
  const next = HUB_TOOLS[index + 1];
  const context = projectId === null ? "mode démo" : `projet n° ${projectId}`;

  return (
    <div
      ref={dock}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4"
    >
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-zinc-500 bg-[#14141b]/95 p-1 shadow-lg shadow-black/50 backdrop-blur">
        {open && (
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
                        active ? "bg-white/15 font-bold text-white underline decoration-2 underline-offset-4" : ""
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
                className={`${dockButton} border-2 border-zinc-300 font-semibold`}
              >
                Suivant <span aria-hidden>→</span>
              </Link>
            )}
          </nav>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={`${dockButton} ${open ? "min-w-11 justify-center" : ""}`}
        >
          {open ? (
            <>
              <span aria-hidden>▾</span>
              <span className="sr-only">Replier la barre des outils</span>
            </>
          ) : (
            <>
              <span aria-hidden>▴</span> Outils
            </>
          )}
        </button>
      </div>
    </div>
  );
}
