import { useRef, type Dispatch } from "react";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { DraftNode } from "@/components/screendraft/screendraft-schema";

const FIELD_CLASS =
  "w-full rounded-(--radius-sm) border border-(--line-strong) bg-(--surface-raised) px-(--space-2) py-(--space-1) text-(--ink)";

type ScreendraftNodePropertiesProps = {
  node: DraftNode;
  dispatch: Dispatch<ScreendraftAction>;
};

/** Contenu de l'élément sélectionné : texte d'un titre ou d'un texte, fichier d'une image. */
export function ScreendraftNodeProperties({ node, dispatch }: ScreendraftNodePropertiesProps) {
  if (node.type === "text" || node.type === "title") {
    return (
      <section className="mb-(--space-4) border-b border-(--line) pb-(--space-4)">
        <label className="text-body-sm flex flex-col gap-(--space-1)">
          <span className="text-label text-(--ink-muted)">Contenu</span>
          <textarea
            value={node.props.text}
            onChange={(event) => dispatch({ type: "set-text", id: node.id, text: event.target.value })}
            className={`${FIELD_CLASS} min-h-24 resize-y`}
          />
        </label>
      </section>
    );
  }
  if (node.type === "image") return <ImageField nodeId={node.id} dispatch={dispatch} />;
  return null;
}

function ImageField({ nodeId, dispatch }: { nodeId: string; dispatch: Dispatch<ScreendraftAction> }) {
  const inputRef = useRef<HTMLInputElement>(null);

  // L'image est embarquée dans la maquette en data URL : pas de serveur pour l'héberger.
  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        dispatch({ type: "set-image", id: nodeId, src: reader.result, alt: file.name });
      }
    });
    reader.readAsDataURL(file);
  }

  return (
    <section className="mb-(--space-4) border-b border-(--line) pb-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">Image</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${FIELD_CLASS} text-body-sm hover:bg-(--canvas)`}
      >
        Remplacer l’image
      </button>
    </section>
  );
}
