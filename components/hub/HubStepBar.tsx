"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { useProjectId } from "@/lib/project-fs";
import { requestStepLeave } from "@/components/hub/hub-step-events";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-base font-semibold motion-safe:transition-colors";

/**
 * Barre d'étapes unique, sous la barre du haut de chaque outil : mêmes boutons, même place partout.
 * « Précédent » et « Continuer » gardent le project_id, donc l'étape suivante lit les fichiers de la précédente.
 * Doit être sous un <Suspense> (useProjectId lit l'URL).
 */
export function HubStepBar() {
  const pathname = usePathname();
  const projectId = useProjectId();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const index = HUB_TOOLS.findIndex((tool) => pathname.startsWith(tool.path ?? `/${tool.slug}`));
  if (index === -1) return null;

  // L'outil courant peut enregistrer avant le départ (ScreenDraft) ; s'il échoue, on reste pour afficher son erreur.
  async function go(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (leaving) return;
    setLeaving(true);
    try {
      if (await requestStepLeave()) router.push(href);
    } finally {
      setLeaving(false);
    }
  }

  const light = pathname.startsWith("/quality") || pathname.startsWith("/codeforge");
  const previous = HUB_TOOLS[index - 1];
  const next = HUB_TOOLS[index + 1];

  const secondary = light
    ? "border-2 border-zinc-500 text-[#2e2e2e] hover:bg-black/5"
    : "border-2 border-zinc-300 text-white hover:bg-white/10";
  const primary = light ? "bg-[#2e2e2e] text-white hover:bg-black" : "bg-white text-[#0b0b10] hover:bg-zinc-200";

  return (
    <nav
      aria-label="Étapes du projet"
      className={`border-b ${
        light ? "border-black/15 bg-[#f7f7f7] [&_:focus-visible]:outline-[#0a4fb8]!" : "border-zinc-700 bg-[#0f0f15]"
      }`}
    >
      <p role="status" className="sr-only">
        {leaving ? "Enregistrement avant de changer d'étape…" : ""}
      </p>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <div className="min-w-24">
          {previous && (
            <Link
              href={hubToolHref(previous, projectId)}
              onClick={(event) => go(event, hubToolHref(previous, projectId))}
              aria-label={`Étape précédente : ${previous.label}, ${previous.description}`}
              className={`${buttonBase} ${secondary}`}
            >
              <span aria-hidden>←&nbsp;</span>Précédent
            </Link>
          )}
        </div>

        <ol className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {HUB_TOOLS.map((tool, i) => {
            const current = i === index;
            return (
              <li key={tool.slug}>
                <Link
                  href={hubToolHref(tool, projectId)}
                  onClick={(event) => go(event, hubToolHref(tool, projectId))}
                  aria-current={current ? "step" : undefined}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-base ${
                    current
                      ? `font-bold underline decoration-2 underline-offset-4 ${light ? "text-[#2e2e2e]" : "text-white"}`
                      : light
                        ? "text-[#454545] hover:text-[#2e2e2e]"
                        : "text-zinc-300 hover:text-white"
                  }`}
                >
                  <span aria-hidden className="font-mono">
                    {i + 1}.
                  </span>
                  {tool.label}
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="flex min-w-24 justify-end">
          {next ? (
            <Link
              href={hubToolHref(next, projectId)}
              onClick={(event) => go(event, hubToolHref(next, projectId))}
              aria-label={`Continuer vers l'étape ${index + 2} : ${next.label}, ${next.description}`}
              className={`${buttonBase} ${primary}`}
            >
              Continuer<span aria-hidden>&nbsp;→</span>
            </Link>
          ) : (
            <Link href="/" className={`${buttonBase} ${secondary}`}>
              Retour au Hub
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
