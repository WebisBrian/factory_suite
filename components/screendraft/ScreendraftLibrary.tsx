import Link from "next/link";
import { useState } from "react";
import { ScreendraftNodeIcon } from "@/components/screendraft/ScreendraftNodeIcon";
import { ScreendraftPanelSection } from "@/components/screendraft/ScreendraftPanelSection";
import type { CustomComponent } from "@/components/screendraft/screendraft-components";
import type { LibraryStatus } from "@/components/screendraft/use-screendraft-library";

const ICON_BUTTON_CLASS =
  "shrink-0 rounded-(--radius-sm) px-(--space-1) text-(--ink-muted) hover:bg-(--canvas) hover:text-(--ink)";

type ScreendraftLibraryProps = {
  components: CustomComponent[];
  status: LibraryStatus;
  /** Mode démo : les composants ne sont pas enregistrés. */
  isDemo: boolean;
  onInsert: (component: CustomComponent) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

/** Composants custom du projet : un clic en insère une copie dans la maquette. */
export function ScreendraftLibrary({
  components,
  status,
  isDemo,
  onInsert,
  onRename,
  onRemove,
}: ScreendraftLibraryProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  // Supprimer un composant ne s'annule pas : on demande confirmation.
  const [removingId, setRemovingId] = useState<string | null>(null);

  return (
    <ScreendraftPanelSection
      id="library"
      headingId="screendraft-mes-composants"
      title="Mes composants"
      count={components.length}
    >
      {status.kind === "error" && (
        <p role="alert" className="text-body-sm pb-(--space-2) text-(--danger)">
          Erreur : {status.message}{" "}
          <Link href="/" className="underline">
            Retour au Hub
          </Link>
        </p>
      )}
      {status.kind === "loading" && (
        <p role="status" className="text-body-sm text-(--ink-muted)">
          Chargement…
        </p>
      )}
      {status.kind !== "loading" && components.length === 0 && (
        <p className="text-body-sm text-(--ink-muted)">
          Sélectionnez un élément, puis « Créer un composant » dans le panneau de droite.
        </p>
      )}
      {isDemo && components.length > 0 && (
        <p className="text-body-sm pb-(--space-2) text-(--ink-muted)">
          Mode démo : non enregistrés.
        </p>
      )}

      <ul aria-labelledby="screendraft-mes-composants" className="-mx-(--space-2)">
        {components.map((component) => (
          <li key={component.id} className="flex items-center gap-(--space-1)">
            {renamingId === component.id ? (
              <input
                type="text"
                autoFocus
                aria-label="Nom du composant"
                defaultValue={component.name}
                onBlur={(event) => {
                  const name = event.currentTarget.value.trim();
                  if (name && name !== component.name) onRename(component.id, name);
                  setRenamingId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") {
                    event.currentTarget.value = component.name;
                    event.currentTarget.blur();
                  }
                }}
                className="text-body-sm m-(--space-1) min-w-0 flex-1 rounded-(--radius-sm) border border-(--line-strong) bg-(--surface-raised) px-(--space-2) py-(--space-1) text-(--ink)"
              />
            ) : removingId === component.id ? (
              <>
                <span className="text-body-sm min-w-0 flex-1 break-words p-(--space-2) text-(--ink)">
                  Supprimer « {component.name} » ?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(component.id);
                    setRemovingId(null);
                  }}
                  className={`${ICON_BUTTON_CLASS} text-body-sm text-(--danger)`}
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setRemovingId(null)}
                  className={`${ICON_BUTTON_CLASS} text-body-sm`}
                >
                  Non
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onInsert(component)}
                  title={`Insérer « ${component.name} »`}
                  className="text-body-sm flex min-w-0 flex-1 items-center gap-(--space-3) rounded-(--radius-md) p-(--space-2) text-left text-(--ink) hover:bg-(--canvas)"
                >
                  <span className="text-(--ink-muted)">
                    <ScreendraftNodeIcon type={component.node.type} />
                  </span>
                  <span className="min-w-0 break-words">{component.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingId(component.id)}
                  aria-label={`Renommer « ${component.name} »`}
                  title="Renommer"
                  className={ICON_BUTTON_CLASS}
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => setRemovingId(component.id)}
                  aria-label={`Supprimer « ${component.name} »`}
                  title="Supprimer"
                  className={ICON_BUTTON_CLASS}
                >
                  ×
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </ScreendraftPanelSection>
  );
}
