import { useId, useState, type Dispatch, type FormEvent } from "react";
import {
  FIELD_CLASS,
  ScreendraftDecimalField,
  ScreendraftField,
  ScreendraftFieldGroup,
  ScreendraftNumberField,
} from "@/components/screendraft/ScreendraftFields";
import {
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  createMarker,
  fitMarkers,
  isValidLatitude,
  isValidLongitude,
  parseMapLocation,
} from "@/components/screendraft/screendraft-map";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { MapMarker, MapNode } from "@/components/screendraft/screendraft-schema";

type ScreendraftMapFieldsProps = {
  node: MapNode;
  dispatch: Dispatch<ScreendraftAction>;
};

const BUTTON_CLASS = `${FIELD_CLASS} min-h-10 hover:bg-(--canvas)`;

/**
 * Contenu d'une carte (SCRUM-32) : description, centre (lien collé ou coordonnées), zoom
 * et points d'intérêt. Pas de recherche par adresse : le guide du Hub interdit d'appeler une API.
 */
export function ScreendraftMapFields({ node, dispatch }: ScreendraftMapFieldsProps) {
  const { latitude, longitude, zoom, markers, title } = node.props;
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const errorId = useId();

  function setProps(props: Partial<MapNode["props"]>) {
    dispatch({ type: "set-props", id: node.id, nodeType: "map", props });
  }

  // Ajouter ou retirer un point : une étape d'annulation à part, jamais regroupée avec une saisie.
  function setMarkers(next: MapMarker[]) {
    dispatch({ type: "set-map-markers", id: node.id, markers: next });
  }

  function updateMarker(index: number, patch: Partial<MapMarker>) {
    setProps({ markers: markers.map((marker, position) => (position === index ? { ...marker, ...patch } : marker)) });
  }

  // Recentre et zoome pour que tous les points tiennent dans la carte.
  function showAllMarkers() {
    const fit = fitMarkers(markers, { width: node.width, height: node.height });
    if (fit) setProps(fit);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseMapLocation(location);
    if (!parsed.ok) {
      setError(parsed.error);
      setStatus("");
      return;
    }
    setError(null);
    setProps({
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      ...(parsed.zoom !== undefined && { zoom: parsed.zoom }),
    });
    setStatus(`Carte centrée sur ${parsed.latitude}, ${parsed.longitude}.`);
  }

  return (
    <ScreendraftFieldGroup title="Contenu">
      <ScreendraftField label="Description de la carte (lue par les lecteurs d’écran)">
        <input
          type="text"
          value={title}
          onChange={(event) => setProps({ title: event.target.value })}
          aria-invalid={title.trim() === "" || undefined}
          className={FIELD_CLASS}
        />
      </ScreendraftField>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-(--space-3)">
        <ScreendraftField label="Lien de carte ou coordonnées du centre">
          <input
            type="text"
            inputMode="url"
            placeholder="Lien Google Maps ou OpenStreetMap"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
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
        <button type="submit" className={BUTTON_CLASS}>
          Centrer la carte
        </button>
        <p role="status" className="text-(--ink-muted)">
          {status}
        </p>
      </form>

      <div className="grid grid-cols-2 gap-(--space-3)">
        <ScreendraftDecimalField
          label="Latitude du centre"
          value={latitude}
          isValid={isValidLatitude}
          onCommit={(value) => setProps({ latitude: value })}
        />
        <ScreendraftDecimalField
          label="Longitude du centre"
          value={longitude}
          isValid={isValidLongitude}
          onCommit={(value) => setProps({ longitude: value })}
        />
      </div>
      <ScreendraftNumberField
        label={`Zoom (${MIN_MAP_ZOOM} : monde, ${MAX_MAP_ZOOM} : rue)`}
        value={zoom}
        min={MIN_MAP_ZOOM}
        max={MAX_MAP_ZOOM}
        onCommit={(value) => setProps({ zoom: value })}
      />

      <h3 className="text-label pt-(--space-2) text-(--ink-muted)">Points d’intérêt</h3>
      {markers.length === 0 && <p className="text-(--ink-muted)">Aucun point d’intérêt.</p>}
      <ol className="flex flex-col gap-(--space-3)">
        {markers.map((marker, index) => {
          const name = marker.label.trim() || `point ${index + 1}`;
          return (
            <li
              key={marker.id}
              className="flex flex-col gap-(--space-2) rounded-(--radius-md) border border-(--line) p-(--space-2)"
            >
              <ScreendraftField label={`Nom du point ${index + 1}`}>
                <input
                  type="text"
                  value={marker.label}
                  onChange={(event) => updateMarker(index, { label: event.target.value })}
                  aria-invalid={marker.label.trim() === "" || undefined}
                  className={FIELD_CLASS}
                />
              </ScreendraftField>
              <div className="grid grid-cols-2 gap-(--space-2)">
                <ScreendraftDecimalField
                  label={`Latitude du point ${index + 1}`}
                  value={marker.latitude}
                  isValid={isValidLatitude}
                  onCommit={(value) => updateMarker(index, { latitude: value })}
                />
                <ScreendraftDecimalField
                  label={`Longitude du point ${index + 1}`}
                  value={marker.longitude}
                  isValid={isValidLongitude}
                  onCommit={(value) => updateMarker(index, { longitude: value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-(--space-2)">
                <button
                  type="button"
                  aria-label={`Centrer la carte sur ${name}`}
                  onClick={() => setProps({ latitude: marker.latitude, longitude: marker.longitude })}
                  className={BUTTON_CLASS}
                >
                  Centrer ici
                </button>
                <button
                  type="button"
                  aria-label={`Retirer ${name}`}
                  onClick={() => setMarkers(markers.filter((_, position) => position !== index))}
                  className={BUTTON_CLASS}
                >
                  Retirer
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => setMarkers([...markers, createMarker(markers.length + 1, { latitude, longitude })])}
        className={BUTTON_CLASS}
      >
        Ajouter un point au centre
      </button>
      {markers.length > 0 && (
        <button type="button" onClick={showAllMarkers} className={BUTTON_CLASS}>
          Afficher tous les points
        </button>
      )}
    </ScreendraftFieldGroup>
  );
}
