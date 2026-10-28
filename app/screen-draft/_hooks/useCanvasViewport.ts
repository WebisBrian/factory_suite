import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  applyZoomCommand,
  fitToScreen,
  panBy,
  zoomAt,
  type Point,
  type Size,
  type Viewport,
  type ZoomCommand,
} from "../_lib/viewport";

const WHEEL_LINE_HEIGHT = 16;
const WHEEL_ZOOM_SPEED = 0.01;
// Un cran de molette souris envoie ~100 px quand un pincement de trackpad en
// envoie quelques-uns : on plafonne pour que la souris ne zoome pas trop fort.
const MAX_WHEEL_ZOOM_DELTA = 25;

/**
 * Zoom et déplacement du canvas, à la manière de Figma :
 * - molette ou trackpad : déplacer ; Ctrl/⌘ + molette ou pincement : zoomer ;
 * - espace + glisser, ou clic molette + glisser : déplacer ;
 * - Ctrl/⌘ + / − : zoom avant / arrière ; Maj + 1 : ajuster ; Maj + 0 : 100 %.
 *
 * `viewport` reste null tant que le canvas n'a pas été mesuré.
 */
export function useCanvasViewport(frame: Size) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastPointer = useRef<Point | null>(null);
  const { width, height } = frame;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      setViewport(
        (current) => current ?? fitToScreen({ width, height }, sizeOf(canvas)),
      );
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [width, height]);

  // Écouteur natif : React enregistre `onWheel` en passif, ce qui empêcherait
  // de bloquer le zoom de la page sur Ctrl/⌘ + molette.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = wheelUnit(event, canvas);
      const dx = event.deltaX * unit;
      const dy = event.deltaY * unit;

      if (event.ctrlKey || event.metaKey) {
        const anchor = pointIn(canvas, event);
        const capped = Math.max(-MAX_WHEEL_ZOOM_DELTA, Math.min(MAX_WHEEL_ZOOM_DELTA, dy));
        const factor = Math.exp(-capped * WHEEL_ZOOM_SPEED);
        setViewport((current) => current && zoomAt(current, current.zoom * factor, anchor));
      } else {
        setViewport((current) => current && panBy(current, -dx, -dy));
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  const zoom = useCallback(
    (command: ZoomCommand) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasSize = sizeOf(canvas);
      setViewport(
        (current) =>
          current && applyZoomCommand(current, command, { width, height }, canvasSize),
      );
    },
    [width, height],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditable(event.target)) return;
      if (event.code === "Space") {
        event.preventDefault();
        setIsSpacePressed(true);
        return;
      }
      const command = zoomShortcut(event);
      if (command) {
        event.preventDefault();
        zoom(command);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space" || isEditable(event.target)) return;
      // Évite qu'un bouton qui a le focus soit activé en relâchant espace.
      event.preventDefault();
      setIsSpacePressed(false);
    }

    function handleBlur() {
      setIsSpacePressed(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [zoom]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const isMiddleButton = event.button === 1;
    const isSpaceDrag = event.button === 0 && isSpacePressed;
    if (!isMiddleButton && !isSpaceDrag) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setIsPanning(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const last = lastPointer.current;
    if (!last) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setViewport((current) => current && panBy(current, dx, dy));
  }

  function handlePointerUp() {
    if (!lastPointer.current) return;
    lastPointer.current = null;
    setIsPanning(false);
  }

  return {
    canvasRef,
    viewport,
    zoom,
    cursor: cursorFor(isPanning, isSpacePressed),
    panHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}

function sizeOf(element: HTMLElement): Size {
  return { width: element.clientWidth, height: element.clientHeight };
}

function pointIn(element: HTMLElement, event: MouseEvent): Point {
  const rect = element.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/** Taille en px d'une unité de `deltaX` / `deltaY` (Firefox compte en lignes). */
function wheelUnit(event: WheelEvent, element: HTMLElement): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return WHEEL_LINE_HEIGHT;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return element.clientHeight;
  return 1;
}

function zoomShortcut(event: KeyboardEvent): ZoomCommand | null {
  const withModifier = event.metaKey || event.ctrlKey;
  if (withModifier && (event.key === "=" || event.key === "+")) return "in";
  if (withModifier && event.key === "-") return "out";
  if (withModifier || !event.shiftKey) return null;
  // `code` plutôt que `key` : sur un clavier AZERTY, Maj + 1 donne bien « 1 ».
  if (event.code === "Digit1") return "fit";
  if (event.code === "Digit0") return "reset";
  return null;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function cursorFor(isPanning: boolean, isSpacePressed: boolean): string {
  if (isPanning) return "grabbing";
  if (isSpacePressed) return "grab";
  return "default";
}
