import { useId, useRef, useState, type Dispatch, type FormEvent } from "react";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { DraftNode, VideoNode } from "@/components/screendraft/screendraft-schema";
import { parseVideoUrl } from "@/components/screendraft/screendraft-video";

const FIELD_CLASS =
  "w-full rounded-(--radius-sm) border border-(--line-strong) bg-(--surface-raised) px-(--space-2) py-(--space-1) text-(--ink)";

type ScreendraftNodePropertiesProps = {
  node: DraftNode;
  dispatch: Dispatch<ScreendraftAction>;
};

/** Contenu de l'élément sélectionné : texte d'un titre ou d'un texte, fichier d'une image, lien d'une vidéo. */
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
  // Remonté à chaque changement d'élément pour repartir de ses valeurs.
  if (node.type === "video") return <VideoField key={node.id} node={node} dispatch={dispatch} />;
  return null;
}

/** Lien et titre d'une vidéo, appliqués ensemble : un lien non reconnu ne modifie rien. */
function VideoField({ node, dispatch }: { node: VideoNode; dispatch: Dispatch<ScreendraftAction> }) {
  const [url, setUrl] = useState(node.props.src);
  const [title, setTitle] = useState(node.props.title);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const urlId = useId();
  const titleId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseVideoUrl(url);
    if (!parsed.ok) {
      setError(parsed.error);
      setStatus("");
      return;
    }
    setError(null);
    setUrl(parsed.src);
    dispatch({
      type: "set-video",
      id: node.id,
      props: { src: parsed.src, kind: parsed.kind, title: title.trim() || "Vidéo" },
    });
    setStatus("Vidéo mise à jour.");
  }

  return (
    <section className="mb-(--space-4) border-b border-(--line) pb-(--space-4)">
      <h2 className="text-label pb-(--space-2) text-(--ink-muted)">Vidéo</h2>
      <form onSubmit={handleSubmit} noValidate className="text-body-sm flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-1)">
          <label htmlFor={urlId} className="text-(--ink-muted)">
            Lien de la vidéo
          </label>
          <input
            id={urlId}
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            className={FIELD_CLASS}
          />
          {error && (
            <p id={errorId} role="alert" className="text-(--danger)">
              Erreur : {error}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-(--space-1)">
          <label htmlFor={titleId} className="text-(--ink-muted)">
            Titre (lu par les lecteurs d’écran)
          </label>
          <input
            id={titleId}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={FIELD_CLASS}
          />
        </div>
        <button type="submit" className={`${FIELD_CLASS} min-h-10 hover:bg-(--canvas)`}>
          Appliquer la vidéo
        </button>
        <p role="status" className="text-(--ink-muted)">
          {status}
        </p>
      </form>
    </section>
  );
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
