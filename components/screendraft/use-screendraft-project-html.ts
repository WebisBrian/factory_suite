import { useEffect, useState } from "react";
import { listProjectFiles } from "@/lib/project-fs";

/**
 * Vrai si le dossier du projet contient déjà une page HTML (écrite par CodeForge,
 * dont `page.html`, l'entrée lue par AnimFlow). Revérifié quand on revient sur l'onglet :
 * la page a pu être générée entre-temps dans un autre outil.
 * Faux en mode démo, ou si le dossier n'est pas lisible (pas d'accès accordé) : on n'insiste pas.
 */
export function useScreendraftProjectHtml(projectId: number | null): boolean {
  const [hasHtml, setHasHtml] = useState(false);

  useEffect(() => {
    if (projectId === null) return;
    const id = projectId;
    let cancelled = false;

    function check() {
      listProjectFiles(id)
        .then((files) => files.some((file) => file.name.toLowerCase().endsWith(".html")))
        .catch(() => false)
        .then((found) => {
          if (!cancelled) setHasHtml(found);
        });
    }

    function checkWhenVisible() {
      if (document.visibilityState === "visible") check();
    }

    check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", checkWhenVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [projectId]);

  return projectId !== null && hasHtml;
}
