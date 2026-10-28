import { useId, useRef, useState, type Dispatch, type FormEvent } from "react";
import {
  FIELD_CLASS,
  ScreendraftColorField,
  ScreendraftField,
  ScreendraftFieldGroup,
  ScreendraftNumberField,
  ScreendraftSelectField,
} from "@/components/screendraft/ScreendraftFields";
import type { Geometry, ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type {
  ButtonNode,
  DraftNode,
  DraftNodeType,
  NodeStyle,
  Screen,
  VideoNode,
} from "@/components/screendraft/screendraft-schema";
import { SHAPE_LABELS } from "@/components/screendraft/screendraft-tree";
import { parseVideoUrl } from "@/components/screendraft/screendraft-video";

// Bornes des champs, en px.
const MAX_POSITION = 10000;
const MAX_SIZE = 10000;
const MAX_FONT_SIZE = 400;
const MAX_BORDER = 100;

// Rendu par défaut quand le style ne précise rien (voir ScreendraftFrame).
const DEFAULT_TEXT_COLOR = "#000000";
const DEFAULT_FONT_SIZE = 16;

const HAS_FILL: DraftNodeType[] = ["section", "button", "shape"];
const HAS_TEXT_STYLE: DraftNodeType[] = ["title", "text", "button"];
const HAS_BOX_STYLE: DraftNodeType[] = ["section", "image", "video", "button", "shape"];

const GEOMETRY_FIELDS: { key: keyof Geometry; label: string; min: number; max: number }[] = [
  { key: "x", label: "X", min: 0, max: MAX_POSITION },
  { key: "y", label: "Y", min: 0, max: MAX_POSITION },
  { key: "width", label: "Largeur", min: 1, max: MAX_SIZE },
  { key: "height", label: "Hauteur", min: 1, max: MAX_SIZE },
];

const FONT_WEIGHTS: { value: NonNullable<NodeStyle["fontWeight"]>; label: string }[] = [
  { value: 400, label: "Normal" },
  { value: 500, label: "Moyen" },
  { value: 600, label: "Semi-gras" },
  { value: 700, label: "Gras" },
];

const TEXT_ALIGNS: { value: NonNullable<NodeStyle["textAlign"]>; label: string }[] = [
  { value: "left", label: "Gauche" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Droite" },
];

type ScreendraftNodePropertiesProps = {
  node: DraftNode;
  /** Écrans de la maquette et écran de l'élément, pour lier un bouton à un autre écran. */
  screens: Screen[];
  screenId: string | null;
  dispatch: Dispatch<ScreendraftAction>;
};

// Valeur du menu « Ouvre l'écran » quand le bouton n'est lié à aucun écran.
const NO_SCREEN = "";

/** Tout ce qui se modifie sur l'élément sélectionné : contenu, position et taille, apparence. */
export function ScreendraftNodeProperties({ node, screens, screenId, dispatch }: ScreendraftNodePropertiesProps) {
  const { style } = node;

  function setStyle(next: NodeStyle) {
    dispatch({ type: "set-style", id: node.id, style: next });
  }

  return (
    <>
      <ContentFields node={node} screens={screens} screenId={screenId} dispatch={dispatch} />

      <ScreendraftFieldGroup title="Position et taille">
        <div className="grid grid-cols-2 gap-(--space-3)">
          {GEOMETRY_FIELDS.map(({ key, label, min, max }) => (
            <ScreendraftNumberField
              key={key}
              label={label}
              value={node[key]}
              min={min}
              max={max}
              onCommit={(value) => dispatch({ type: "set-geometry", id: node.id, geometry: { [key]: value } })}
            />
          ))}
        </div>
      </ScreendraftFieldGroup>

      {HAS_TEXT_STYLE.includes(node.type) && (
        <ScreendraftFieldGroup title="Texte">
          <ScreendraftColorField
            label="Couleur"
            value={style.color}
            fallback={DEFAULT_TEXT_COLOR}
            onChange={(color) => setStyle({ color })}
          />
          <div className="grid grid-cols-2 gap-(--space-3)">
            <ScreendraftNumberField
              label="Taille (px)"
              value={style.fontSize ?? DEFAULT_FONT_SIZE}
              min={1}
              max={MAX_FONT_SIZE}
              onCommit={(fontSize) => setStyle({ fontSize })}
            />
            <ScreendraftSelectField
              label="Graisse"
              value={style.fontWeight ?? 400}
              options={FONT_WEIGHTS}
              onChange={(fontWeight) => setStyle({ fontWeight })}
            />
          </div>
          <ScreendraftSelectField
            label="Alignement"
            value={style.textAlign ?? (node.type === "button" ? "center" : "left")}
            options={TEXT_ALIGNS}
            onChange={(textAlign) => setStyle({ textAlign })}
          />
        </ScreendraftFieldGroup>
      )}

      {HAS_BOX_STYLE.includes(node.type) && (
        <ScreendraftFieldGroup title="Apparence">
          {HAS_FILL.includes(node.type) && (
            <ScreendraftColorField
              label="Fond"
              value={style.backgroundColor}
              fallback="#ffffff"
              onChange={(backgroundColor) => setStyle({ backgroundColor })}
              onClear={() => setStyle({ backgroundColor: undefined })}
            />
          )}
          <div className="grid grid-cols-2 gap-(--space-3)">
            {/* Le rond et le triangle ont une forme fixe : l'arrondi ne s'y applique pas. */}
            {!(node.type === "shape" && node.props.shape !== "rectangle") && (
              <ScreendraftNumberField
                label="Arrondi (px)"
                value={style.borderRadius ?? 0}
                min={0}
                max={MAX_SIZE}
                onCommit={(borderRadius) => setStyle({ borderRadius })}
              />
            )}
            <ScreendraftNumberField
              label="Bordure (px)"
              value={style.borderWidth ?? 0}
              min={0}
              max={MAX_BORDER}
              onCommit={(borderWidth) => setStyle({ borderWidth })}
            />
          </div>
          {Boolean(style.borderWidth) && (
            <ScreendraftColorField
              label="Couleur de bordure"
              value={style.borderColor}
              fallback={style.color ?? DEFAULT_TEXT_COLOR}
              onChange={(borderColor) => setStyle({ borderColor })}
            />
          )}
        </ScreendraftFieldGroup>
      )}
    </>
  );
}

/** Contenu propre à chaque type d'élément. Une section n'en a pas : ce sont ses enfants. */
function ContentFields({ node, screens, screenId, dispatch }: ScreendraftNodePropertiesProps) {
  switch (node.type) {
    case "section":
      return null;
    case "title":
    case "text":
      return (
        <ScreendraftFieldGroup title="Contenu">
          <textarea
            aria-label="Texte"
            value={node.props.text}
            onChange={(event) => dispatch({ type: "set-text", id: node.id, text: event.target.value })}
            className={`${FIELD_CLASS} min-h-24 resize-y`}
          />
          {node.type === "title" && (
            <ScreendraftSelectField
              label="Niveau"
              value={node.props.level}
              options={[
                { value: 1, label: "Titre 1 (h1)" },
                { value: 2, label: "Titre 2 (h2)" },
                { value: 3, label: "Titre 3 (h3)" },
              ]}
              onChange={(level) => dispatch({ type: "set-props", id: node.id, nodeType: "title", props: { level } })}
            />
          )}
        </ScreendraftFieldGroup>
      );
    case "button":
      return (
        <ScreendraftFieldGroup title="Contenu">
          <ScreendraftField label="Libellé">
            <input
              type="text"
              value={node.props.label}
              onChange={(event) =>
                dispatch({ type: "set-props", id: node.id, nodeType: "button", props: { label: event.target.value } })
              }
              className={FIELD_CLASS}
            />
          </ScreendraftField>
          <ScreenLinkField node={node} screens={screens} screenId={screenId} dispatch={dispatch} />
          {node.props.targetScreenId ? (
            // Le lien suit l'écran cible : il se met à jour si l'écran est renommé.
            <div className="flex flex-col gap-(--space-1)">
              <span className="text-(--ink-muted)">Lien</span>
              <p className="text-code rounded-(--radius-sm) border border-(--line) px-(--space-2) py-(--space-1) text-(--ink-muted)">
                {node.props.href}
              </p>
            </div>
          ) : (
            <ScreendraftField label="Lien">
              <input
                type="url"
                placeholder="https://… ou #ancre"
                value={node.props.href ?? ""}
                onChange={(event) =>
                  dispatch({
                    type: "set-props",
                    id: node.id,
                    nodeType: "button",
                    props: { href: event.target.value || undefined },
                  })
                }
                className={FIELD_CLASS}
              />
            </ScreendraftField>
          )}
        </ScreendraftFieldGroup>
      );
    case "image":
      return (
        <ScreendraftFieldGroup title="Contenu">
          <ImagePicker nodeId={node.id} dispatch={dispatch} />
          <ScreendraftField label="Texte alternatif">
            <input
              type="text"
              value={node.props.alt}
              onChange={(event) =>
                dispatch({ type: "set-props", id: node.id, nodeType: "image", props: { alt: event.target.value } })
              }
              className={FIELD_CLASS}
            />
          </ScreendraftField>
          <ScreendraftSelectField
            label="Cadrage"
            value={node.props.fit}
            options={[
              { value: "cover", label: "Remplir (rogner)" },
              { value: "contain", label: "Contenir (entière)" },
            ]}
            onChange={(fit) => dispatch({ type: "set-props", id: node.id, nodeType: "image", props: { fit } })}
          />
        </ScreendraftFieldGroup>
      );
    // Remonté à chaque changement d'élément pour repartir de son lien.
    case "video":
      return <VideoFields key={node.id} node={node} dispatch={dispatch} />;
    case "shape":
      return (
        <ScreendraftFieldGroup title="Forme">
          <ScreendraftSelectField
            label="Type"
            value={node.props.shape}
            options={(["circle", "rectangle", "triangle"] as const).map((shape) => ({
              value: shape,
              label: SHAPE_LABELS[shape],
            }))}
            onChange={(shape) => dispatch({ type: "set-props", id: node.id, nodeType: "shape", props: { shape } })}
          />
        </ScreendraftFieldGroup>
      );
  }
}

/**
 * Le lien n'est appliqué qu'à la validation : un lien non reconnu ne modifie rien.
 * Le titre, lui, s'applique à la frappe comme les autres champs.
 */
function VideoFields({ node, dispatch }: { node: VideoNode; dispatch: Dispatch<ScreendraftAction> }) {
  const [url, setUrl] = useState(node.props.src);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
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
    dispatch({ type: "set-props", id: node.id, nodeType: "video", props: { src: parsed.src, kind: parsed.kind } });
    setStatus("Vidéo mise à jour.");
  }

  return (
    <ScreendraftFieldGroup title="Contenu">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-(--space-3)">
        <ScreendraftField label="Lien de la vidéo">
          <input
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            className={FIELD_CLASS}
          />
        </ScreendraftField>
        {error && (
          <p id={errorId} role="alert" className="text-(--danger)">
            Erreur : {error}
          </p>
        )}
        <button type="submit" className={`${FIELD_CLASS} min-h-10 hover:bg-(--canvas)`}>
          Appliquer le lien
        </button>
        <p role="status" className="text-(--ink-muted)">
          {status}
        </p>
      </form>
      <ScreendraftField label="Titre (lu par les lecteurs d’écran)">
        <input
          type="text"
          value={node.props.title}
          onChange={(event) =>
            dispatch({ type: "set-props", id: node.id, nodeType: "video", props: { title: event.target.value } })
          }
          className={FIELD_CLASS}
        />
      </ScreendraftField>
    </ScreendraftFieldGroup>
  );
}

type ScreenLinkFieldProps = Omit<ScreendraftNodePropertiesProps, "node"> & { node: ButtonNode };

/**
 * Prototype : écran ouvert au clic sur le bouton. Le `href` devient alors le fichier HTML
 * de cet écran ; « Aucun » rend la main au lien libre.
 */
function ScreenLinkField({ node, screens, screenId, dispatch }: ScreenLinkFieldProps) {
  const target = node.props.targetScreenId ?? NO_SCREEN;
  // Lier un bouton à son propre écran ne mène nulle part : on ne le propose pas.
  const options = screens.filter((screen) => screen.id !== screenId || screen.id === target);
  if (options.length === 0) return null;

  return (
    <ScreendraftSelectField
      label="Ouvre l’écran"
      value={target}
      options={[
        { value: NO_SCREEN, label: "Aucun (lien libre)" },
        ...options.map((screen) => ({ value: screen.id, label: screen.name })),
      ]}
      onChange={(next) =>
        dispatch({
          type: "set-props",
          id: node.id,
          nodeType: "button",
          // Le href est recalculé à partir de l'écran choisi (voir syncLinks).
          props: { targetScreenId: next === NO_SCREEN ? undefined : next, href: undefined },
        })
      }
    />
  );
}

function ImagePicker({ nodeId, dispatch }: { nodeId: string; dispatch: Dispatch<ScreendraftAction> }) {
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
    <>
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
        className={`${FIELD_CLASS} hover:bg-(--canvas)`}
      >
        Remplacer l’image
      </button>
    </>
  );
}
