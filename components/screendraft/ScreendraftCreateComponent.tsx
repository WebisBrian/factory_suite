import { useState, type FormEvent } from "react";
import { FIELD_CLASS, ScreendraftField, ScreendraftFieldGroup } from "@/components/screendraft/ScreendraftFields";
import type { DraftNode } from "@/components/screendraft/screendraft-schema";
import { nodeLabel } from "@/components/screendraft/screendraft-tree";

const MAX_NAME_LENGTH = 60;

type ScreendraftCreateComponentProps = {
  node: DraftNode;
  onCreate: (name: string, node: DraftNode) => void;
};

/**
 * Enregistre l'élément sélectionné (et ses enfants) comme composant réutilisable.
 * À rendre avec `key={node.id}` : le nom proposé repart du nouvel élément sélectionné.
 */
export function ScreendraftCreateComponent({ node, onCreate }: ScreendraftCreateComponentProps) {
  const [name, setName] = useState(() => nodeLabel(node).slice(0, MAX_NAME_LENGTH));
  const trimmed = name.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmed) onCreate(trimmed, node);
  }

  return (
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
        <button
          type="submit"
          disabled={!trimmed}
          className={`${FIELD_CLASS} hover:bg-(--canvas) disabled:text-(--line-strong) disabled:hover:bg-(--surface-raised)`}
        >
          Créer un composant
        </button>
      </form>
    </ScreendraftFieldGroup>
  );
}
