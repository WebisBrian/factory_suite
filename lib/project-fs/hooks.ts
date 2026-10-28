"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getFolderStatus,
  parseProjectId,
  pickDataFolder,
  requestFolderAccess,
  type FolderStatus,
} from "@/lib/project-fs/project-fs";

/**
 * Lit `?project_id=N` dans l'URL. Renvoie null si absent ou invalide.
 * Utilise useSearchParams : le composant appelant doit être sous un <Suspense>.
 */
export function useProjectId(): number | null {
  return parseProjectId(useSearchParams().get("project_id"));
}

export interface ProjectFolder {
  /** null tant que le statut n'est pas encore connu (premier rendu). */
  status: FolderStatus | null;
  /** Relit le statut (après un changement fait ailleurs). */
  refresh: () => Promise<void>;
  /** Ouvre le sélecteur de dossier. À appeler depuis un clic. */
  pickFolder: () => Promise<void>;
  /** Redemande l'autorisation sur le dossier déjà choisi. À appeler depuis un clic. */
  requestAccess: () => Promise<void>;
}

export function useProjectFolder(): ProjectFolder {
  const [status, setStatus] = useState<FolderStatus | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await getFolderStatus());
  }, []);

  useEffect(() => {
    let cancelled = false;
    getFolderStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pickFolder = useCallback(async () => {
    try {
      await pickDataFolder();
    } catch (error) {
      // L'utilisateur a fermé le sélecteur : rien à faire.
      if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
    }
    await refresh();
  }, [refresh]);

  const requestAccess = useCallback(async () => {
    await requestFolderAccess();
    await refresh();
  }, [refresh]);

  return { status, refresh, pickFolder, requestAccess };
}
