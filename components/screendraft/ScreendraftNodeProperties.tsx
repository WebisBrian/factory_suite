import { useRef, type Dispatch } from "react";
import {
  FIELD_CLASS,
  ScreendraftColorField,
  ScreendraftField,
  ScreendraftFieldGroup,
  ScreendraftNumberField,
  ScreendraftSelectField,
} from "@/components/screendraft/ScreendraftFields";
import type { Geometry, ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { DraftNode, DraftNodeType, NodeStyle } from "@/components/screendraft/screendraft-schema";
import { SHAPE_LABELS } from "@/components/screendraft/screendraft-tree";

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
const HAS_BOX_STYLE: DraftNodeType[] = ["section", "image", "button", "shape"];

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
  dispatch: Dispatch<ScreendraftAction>;
};

/** Tout ce qui se modifie sur l'élément sélectionné : contenu, position et taille, apparence. */
export function ScreendraftNodeProperties({ node, dispatch }: ScreendraftNodePropertiesProps) {
  const { style } = node;

  function setStyle(next: NodeStyle) {
    dispatch({ type: "set-style", id: node.id, style: next });
  }

  return (
    <>
      <ContentFields node={node} dispatch={dispatch} />

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
function ContentFields({ node, dispatch }: ScreendraftNodePropertiesProps) {
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
