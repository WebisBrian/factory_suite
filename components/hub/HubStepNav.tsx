"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjectId } from "@/lib/project-fs";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";
import { hubPrimaryButton, hubSecondaryButton } from "@/components/hub/hub-styles";

/**
 * Passage d'une étape à la suivante, en bas de chaque outil : le project_id est conservé,
 * donc l'étape suivante lit les fichiers écrits par la précédente.
 * Doit être sous un <Suspense> (useProjectId lit l'URL).
 */
export function HubStepNav() {
  const pathname = usePathname();
  const projectId = useProjectId();
  const index = HUB_TOOLS.findIndex((tool) => pathname.startsWith(tool.path ?? `/${tool.slug}`));
  if (index === -1) return null;

  const previous = HUB_TOOLS[index - 1];
  const next = HUB_TOOLS[index + 1];
  const current = HUB_TOOLS[index];

  return (
    <nav
      aria-label={`Étapes, vous êtes à l'étape ${index + 1} sur ${HUB_TOOLS.length} : ${current.label}`}
      className="border-t border-zinc-700 bg-[#121218]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        {previous ? (
          <Link
            href={hubToolHref(previous, projectId)}
            aria-label={`Étape précédente : ${previous.label}, ${previous.description}`}
            className={hubSecondaryButton}
          >
            <span aria-hidden>←&nbsp;</span>
            {previous.label}
          </Link>
        ) : (
          <span />
        )}
        <p className="text-sm text-zinc-300">
          Étape {index + 1} sur {HUB_TOOLS.length}
        </p>
        {next ? (
          <Link
            href={hubToolHref(next, projectId)}
            aria-label={`Étape suivante : ${next.label}, ${next.description}`}
            className={hubPrimaryButton}
          >
            {next.label}
            <span aria-hidden>&nbsp;→</span>
          </Link>
        ) : (
          <Link href="/" className={hubSecondaryButton}>
            Retour au Hub
          </Link>
        )}
      </div>
    </nav>
  );
}
