"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjectId } from "@/lib/project-fs";
import { HUB_TOOLS, hubToolHref } from "@/components/hub/hub-tools";

/**
 * Bouton « Continuer » vers l'étape suivante, à placer en haut d'un outil à côté de ses actions.
 * Garde le project_id : l'étape suivante lit les fichiers écrits par celle-ci. Rien à afficher à la dernière étape.
 * Le style est fourni par l'outil (chacun a sa charte). Doit être sous un <Suspense>.
 */
export function HubContinueLink({ className }: { className: string }) {
  const pathname = usePathname();
  const projectId = useProjectId();
  const index = HUB_TOOLS.findIndex((tool) => pathname.startsWith(tool.path ?? `/${tool.slug}`));
  const next = HUB_TOOLS[index + 1];
  if (index === -1 || !next) return null;

  return (
    <Link
      href={hubToolHref(next, projectId)}
      aria-label={`Continuer vers l'étape ${index + 2} : ${next.label}, ${next.description}`}
      className={className}
    >
      Continuer
      <span aria-hidden>&nbsp;→</span>
    </Link>
  );
}
