import { FIELD_CLASS, ScreendraftFieldGroup } from "@/components/screendraft/ScreendraftFields";
import {
  isInstanceModified,
  type CustomComponent,
} from "@/components/screendraft/screendraft-components";
import type { DraftNode, Screen } from "@/components/screendraft/screendraft-schema";

const BUTTON_CLASS = `${FIELD_CLASS} hover:bg-(--canvas) disabled:text-(--line-strong) disabled:hover:bg-(--surface-raised)`;

type ScreendraftInstanceControlsProps = {
  node: DraftNode;
  /** undefined : le composant a été retiré de la bibliothèque, ou elle n'a pas pu être lue. */
  component: CustomComponent | undefined;
  /** Écrans de la maquette, pour les liens des boutons du composant. */
  screens: Screen[];
  onUpdate: (node: DraftNode) => void;
  onReset: (id: string, component: CustomComponent) => void;
  onDetach: (id: string) => void;
};

/** Lien entre l'instance sélectionnée et son composant : propager, annuler ou détacher. */
export function ScreendraftInstanceControls({
  node,
  component,
  screens,
  onUpdate,
  onReset,
  onDetach,
}: ScreendraftInstanceControlsProps) {
  const isModified = component !== undefined && isInstanceModified(node, component, screens);

  return (
    <ScreendraftFieldGroup title="Composant">
      {component ? (
        <p>
          Instance de <strong>« {component.name} »</strong>
          {isModified && <span className="text-(--ink-muted)"> — modifiée</span>}
        </p>
      ) : (
        <p className="text-(--ink-muted)">Composant introuvable dans la bibliothèque.</p>
      )}
      {component && (
        <>
          <button
            type="button"
            disabled={!isModified}
            onClick={() => onUpdate(node)}
            aria-describedby="screendraft-instance-update-hint"
            className={BUTTON_CLASS}
          >
            Mettre à jour le composant
          </button>
          <p id="screendraft-instance-update-hint" className="text-(--ink-muted)">
            Toutes les instances, dans tous les écrans, reprendront cet élément. Seule leur position est conservée.
          </p>
          <button
            type="button"
            disabled={!isModified}
            onClick={() => onReset(node.id, component)}
            className={BUTTON_CLASS}
          >
            Rétablir le composant
          </button>
        </>
      )}
      <button type="button" onClick={() => onDetach(node.id)} className={BUTTON_CLASS}>
        Détacher l’instance
      </button>
    </ScreendraftFieldGroup>
  );
}
