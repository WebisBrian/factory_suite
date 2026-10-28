/**
 * Inspecteur de l'aperçu, comme celui du navigateur (F12) : l'élément survolé
 * est recouvert d'une surcouche et nommé par une étiquette, le clic le sélectionne.
 *
 * Code DOM pur, posé sur le document de l'iframe (même origine). Les variables
 * de la charte n'y existent pas : couleurs en dur, voir _brand/BRAND.md
 * (« Élément sélectionné », « Élément survolé »).
 */

const SELECTED_ATTR = "data-anime-flow-selected";
const POINTER_ATTR = "data-anime-flow-pointer";
const OVERLAY_ID = "anime-flow-inspector-overlay";
const LABEL_ID = "anime-flow-inspector-label";
/** Écart entre l'élément et son étiquette, et marge au bord de l'aperçu. */
const GAP = 6;

const INSPECTOR_CSS = `[${SELECTED_ATTR}] {
  outline: 3px solid #ffffff !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 9px #6d28d9 !important;
}
/* La main n'apparaît que sur ce qui se sélectionne. */
html[${POINTER_ATTR}], html[${POINTER_ATTR}] * { cursor: pointer !important; }
#${OVERLAY_ID}, #${LABEL_ID} {
  position: fixed;
  z-index: 2147483647;
  pointer-events: none;
  box-sizing: border-box;
}
#${OVERLAY_ID} {
  border: 3px dashed #6d28d9;
  background: rgba(109, 40, 217, 0.12);
}
#${LABEL_ID} {
  max-width: calc(100vw - ${GAP * 2}px);
  padding: 4px 10px;
  border-radius: 8px;
  background: #e879f9;
  color: #1a1033;
  font: 600 1rem/1.3 "Atkinson Hyperlegible", system-ui, sans-serif;
}`;

export type InspectorCallbacks = {
  /** Nom lisible de chaque élément animable, par id : seuls ceux-là sont ciblés. */
  elementNames: ReadonlyMap<string, string>;
  /** La souris entre sur un élément animable (id) ou quitte la page (null). */
  onHover: (id: string | null) => void;
  /** Clic sur un élément animable. */
  onSelect: (id: string) => void;
  /** Clic sur une zone qui n'est dans aucun élément animable. */
  onMissedClick: () => void;
  /** Échap dans l'aperçu. */
  onEscape: () => void;
  /** Navigation au clavier dans l'aperçu (flèches, Entrée), comme dans l'inspecteur F12. */
  onNavigate: (key: NavigationKey) => void;
};

export type NavigationKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Enter";
const NAVIGATION_KEYS: readonly string[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"];

export type Inspector = {
  /** Entoure et nomme l'élément (null : rien). */
  highlight: (id: string | null) => void;
  /** Fait défiler l'aperçu jusqu'à l'élément (navigation au clavier). */
  reveal: (id: string) => void;
  /** Marque l'élément sélectionné (double contour). */
  select: (id: string | null) => void;
  destroy: () => void;
};

/** `getCallbacks` est relu à chaque évènement : il renvoie toujours les props à jour. */
export function createInspector(doc: Document, getCallbacks: () => InspectorCallbacks): Inspector {
  const view = doc.defaultView;
  const listeners = new AbortController();
  const { signal } = listeners;

  const style = doc.createElement("style");
  style.textContent = INSPECTOR_CSS;
  const overlay = doc.createElement("div");
  overlay.id = OVERLAY_ID;
  const label = doc.createElement("div");
  label.id = LABEL_ID;
  // Doublon visuel de la liste « Éléments de la page », qui porte déjà ces noms.
  for (const node of [overlay, label]) {
    node.hidden = true;
    node.setAttribute("aria-hidden", "true");
  }
  doc.head.append(style);
  doc.body.append(overlay, label);

  let highlighted: Element | null = null;
  let hoveredId: string | null = null;
  let frame = 0;

  /** L'élément animable le plus proche : la cible elle-même, ou son plus proche ancêtre listé. */
  function animatableFrom(target: EventTarget | null): Element | null {
    // instanceof avec l'Element de l'iframe : celui de la page parente ne reconnaît pas ses nœuds.
    let node = view && target instanceof view.Element ? target : null;
    const { elementNames } = getCallbacks();
    while (node && !(node.id && elementNames.has(node.id))) node = node.parentElement;
    return node;
  }

  function render() {
    if (!highlighted) {
      overlay.hidden = true;
      label.hidden = true;
      return;
    }
    const rect = highlighted.getBoundingClientRect();
    Object.assign(overlay.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    overlay.hidden = false;

    const name = getCallbacks().elementNames.get(highlighted.id) ?? "";
    label.textContent = `${name} · ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    label.hidden = false;
    // Au-dessus de l'élément, ou dessous s'il touche le haut ; jamais hors de l'aperçu.
    const above = rect.top - label.offsetHeight - GAP;
    const viewportWidth = doc.documentElement.clientWidth;
    label.style.top = `${above >= 0 ? above : Math.max(GAP, rect.bottom + GAP)}px`;
    label.style.left = `${Math.max(GAP, Math.min(rect.left, viewportWidth - label.offsetWidth - GAP))}px`;
  }

  // Suit l'élément au défilement et au redimensionnement, une fois par image.
  function scheduleRender() {
    if (frame || !view) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      render();
    });
  }

  function setHovered(id: string | null) {
    if (id === hoveredId) return;
    hoveredId = id;
    doc.documentElement.toggleAttribute(POINTER_ATTR, id !== null);
    getCallbacks().onHover(id);
  }

  doc.addEventListener("mouseover", (event) => setHovered(animatableFrom(event.target)?.id ?? null), { signal });
  doc.documentElement.addEventListener("mouseleave", () => setHovered(null), { signal });
  // Capture : suit aussi le défilement des blocs internes de la page.
  doc.addEventListener("scroll", scheduleRender, { capture: true, passive: true, signal });
  view?.addEventListener("resize", scheduleRender, { signal });

  doc.addEventListener(
    "click",
    (event) => {
      // Pas de navigation ni d'envoi de formulaire dans l'aperçu.
      event.preventDefault();
      const element = animatableFrom(event.target);
      if (element) getCallbacks().onSelect(element.id);
      else getCallbacks().onMissedClick();
    },
    { signal },
  );

  doc.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") getCallbacks().onEscape();
      else if (NAVIGATION_KEYS.includes(event.key)) {
        // Les flèches parcourent les éléments au lieu de faire défiler la page.
        event.preventDefault();
        getCallbacks().onNavigate(event.key as NavigationKey);
      }
    },
    { signal },
  );

  return {
    highlight(id) {
      highlighted = id ? doc.getElementById(id) : null;
      render();
    },
    reveal(id) {
      doc.getElementById(id)?.scrollIntoView({ block: "nearest" });
      render();
    },
    select(id) {
      doc.querySelector(`[${SELECTED_ATTR}]`)?.removeAttribute(SELECTED_ATTR);
      const element = id ? doc.getElementById(id) : null;
      if (!element) return;
      element.setAttribute(SELECTED_ATTR, "");
      // Défilement instantané : pas d'animation imposée à l'utilisateur.
      element.scrollIntoView({ block: "nearest" });
      render();
    },
    destroy() {
      listeners.abort();
      if (frame) view?.cancelAnimationFrame(frame);
      style.remove();
      overlay.remove();
      label.remove();
    },
  };
}
