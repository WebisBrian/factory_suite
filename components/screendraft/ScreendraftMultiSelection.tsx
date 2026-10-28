import { useState, type FormEvent } from "react";
import { FIELD_CLASS, ScreendraftField, ScreendraftFieldGroup } from "@/components/screendraft/ScreendraftFields";

const MAX_NAME_LENGTH = 60;

const BUTTON_CLASS = `${FIELD_CLASS} hover:bg-(--canvas) disabled:text-(--line-strong) disabled:hover:bg-(--surface-raised)`;

type ScreendraftMultiSelectionProps = {
  count: number;
  /** Regroupe la sélection dans une section, enregistrée comme composant réutilisable. */
  onCreateComponent: (name: string) => void;
  onGroup: () => void;
  onDelete: () => void;
};

/** Plusieurs éléments sélectionnés (Maj + clic) : en faire un composant, les grouper ou les supprimer. */
export function ScreendraftMultiSelection({
  count,
  onCreateComponent,
  onGroup,
  onDelete,
}: ScreendraftMultiSelectionProps) {
  const [name, setName] = useState("Nouveau composant");
  const trimmed = name.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmed) onCreateComponent(trimmed);
  }

  return (
    <>
      <ScreendraftFieldGroup title="Sélection">
        <p>
          <strong>{count}</strong> éléments sélectionnés.{" "}
          <span className="text-(--ink-muted)">Maj + clic pour en ajouter ou en retirer.</span>
        </p>
        <button type="button" onClick={onGroup} className={BUTTON_CLASS}>
          Grouper dans une section
        </button>
        <button type="button" onClick={onDelete} aria-keyshortcuts="Delete" className={BUTTON_CLASS}>
          Supprimer
        </button>
      </ScreendraftFieldGroup>
      <ScreendraftFieldGroup title="Composant">
        <form onSubmit={handleSubmit} className="flex flex-col gap-(--space-3)">
          <ScreendraftField label="Nom">
            <input
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(event) => setName(event.target.value)}
              className={FIELD_CLASS}
            />
          </ScreendraftField>
          <button type="submit" disabled={!trimmed} className={BUTTON_CLASS}>
            Créer un composant
          </button>
          <p className="text-(--ink-muted)">
            Les éléments sont regroupés dans une section, qui devient le composant et sa première instance.
          </p>
        </form>
      </ScreendraftFieldGroup>
    </>
  );
}
