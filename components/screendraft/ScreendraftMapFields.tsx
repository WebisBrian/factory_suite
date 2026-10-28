import { useContext, type Dispatch } from "react";
import {
  FIELD_CLASS,
  ScreendraftField,
  ScreendraftFieldGroup,
} from "@/components/screendraft/ScreendraftFields";
import { createMarker, fitMarkers } from "@/components/screendraft/screendraft-map";
import { MapExplorationContext } from "@/components/screendraft/screendraft-map-context";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { MapMarker, MapNode } from "@/components/screendraft/screendraft-schema";

type ScreendraftMapFieldsProps = {
  node: MapNode;
  dispatch: Dispatch<ScreendraftAction>;
};

const BUTTON_CLASS = `${FIELD_CLASS} min-h-10 hover:bg-(--canvas)`;

/**
 * Contenu d'une carte (SCRUM-32) : description, exploration de la carte (se déplacer, zoomer,
 * poser des points directement dessus) et liste des points d'intérêt.
 */
export function ScreendraftMapFields({ node, dispatch }: ScreendraftMapFieldsProps) {
  const { exploringId, explore } = useContext(MapExplorationContext);
  const { latitude, longitude, zoom, markers, title } = node.props;
  const isExploring = exploringId === node.id;

  function setProps(props: Partial<MapNode["props"]>) {
    dispatch({ type: "set-props", id: node.id, nodeType: "map", props });
  }

  // Ajouter ou retirer un point : une étape d'annulation à part, jamais regroupée avec une saisie.
  function setMarkers(next: MapMarker[]) {
    dispatch({ type: "set-map-markers", id: node.id, markers: next });
  }

  // Recentre et zoome pour que tous les points tiennent dans la carte.
  function showAllMarkers() {
    const fit = fitMarkers(markers, { width: node.width, height: node.height });
    if (fit) setProps(fit);
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

      <button
        type="button"
        aria-pressed={isExploring}
        onClick={() => explore(isExploring ? null : node.id)}
        className="min-h-10 rounded-(--radius-md) bg-(--draft) px-(--space-4) py-(--space-2) font-semibold text-(--on-draft) hover:bg-(--draft-strong)"
      >
        {isExploring ? "Terminer l’exploration" : "Explorer la carte"}
      </button>
      <p className="text-(--ink-muted)">
        Ou double-cliquez sur la carte. Glissez pour vous déplacer, molette pour zoomer, cliquez pour
        poser un point ; un point se déplace en le glissant.
      </p>
      <p className="text-(--ink-muted)">
        Centre <span className="text-code text-(--ink)">{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>, zoom{" "}
        <span className="text-code text-(--ink)">{zoom}</span>
      </p>

      <h3 className="text-label pt-(--space-2) text-(--ink-muted)">Points d’intérêt</h3>
      {markers.length === 0 && <p className="text-(--ink-muted)">Aucun point : cliquez sur la carte pour en poser.</p>}
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
                  onChange={(event) =>
                    setProps({
                      markers: markers.map((other) =>
                        other.id === marker.id ? { ...other, label: event.target.value } : other,
                      ),
                    })
                  }
                  aria-invalid={marker.label.trim() === "" || undefined}
                  className={FIELD_CLASS}
                />
              </ScreendraftField>
              <p className="text-code text-(--ink-muted)">
                {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
              </p>
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
                  onClick={() => setMarkers(markers.filter((other) => other.id !== marker.id))}
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
