import Link from "next/link";
import { HubContinueLink } from "@/components/hub/HubContinueLink";
import type { SaveStatus } from "@/components/screendraft/use-screendraft-save";

type ScreendraftSaveControlsProps = {
  /** null : mode démo, rien n'est écrit dans un projet. */
  projectId: number | null;
  isDirty: boolean;
  status: SaveStatus;
  onSave: () => void;
  onExport: () => void;
};

const BUTTON_CLASS =
  "min-h-10 rounded-(--radius-md) px-(--space-4) py-(--space-2) text-sm font-semibold";

/** État de l'enregistrement, export JSON et bouton Enregistrer (seul bouton principal de l'écran). */
export function ScreendraftSaveControls({
  projectId,
  isDirty,
  status,
  onSave,
  onExport,
}: ScreendraftSaveControlsProps) {
  return (
    <div className="flex items-center gap-(--space-3)">
      {status.kind === "error" ? (
        <p role="alert" className="text-sm text-(--danger)">
          Erreur : {status.message}{" "}
          <Link href="/" className="underline">
            Retour au Hub
          </Link>
        </p>
      ) : (
        <p role="status" className="text-sm text-(--ink-muted)">
          {statusMessage(projectId, isDirty, status)}
        </p>
      )}
      <button
        type="button"
        onClick={onExport}
        className={`${BUTTON_CLASS} border border-(--line-strong) bg-(--surface-raised) text-(--ink) hover:bg-(--canvas)`}
      >
        Exporter en JSON
      </button>
      {projectId !== null && (
        <button
          type="button"
          onClick={onSave}
          disabled={status.kind === "saving"}
          aria-keyshortcuts="Control+S Meta+S"
          className={`${BUTTON_CLASS} bg-(--draft) text-(--on-draft) hover:bg-(--draft-strong) disabled:bg-(--line-strong)`}
        >
          Enregistrer
        </button>
      )}
      <HubContinueLink
        className={`${BUTTON_CLASS} inline-flex items-center border border-(--line-strong) bg-(--surface-raised) text-(--ink) hover:bg-(--canvas)`}
      />
    </div>
  );
}

function statusMessage(projectId: number | null, isDirty: boolean, status: SaveStatus): string {
  if (projectId === null) return "Mode démo : rien n'est enregistré";
  if (status.kind === "saving") return "Enregistrement…";
  if (isDirty) return "Modifications non enregistrées";
  if (status.kind === "saved") return `Enregistré à ${formatTime(status.at)}`;
  return `Projet ${projectId}, à jour`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
