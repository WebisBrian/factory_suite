import type { Point, Size } from "@/components/screendraft/screendraft-viewport";

const HANDLE_POSITIONS = ["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-bottom-1 -right-1"];

/**
 * Cadre de sélection de la charte : contour `--selection` et quatre poignées aux coins.
 * Dessiné en px écran pour garder la même épaisseur à tous les zooms.
 */
export function ScreendraftSelection({ rect }: { rect: Point & Size }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute border-[1.5px] border-(--selection)"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    >
      {HANDLE_POSITIONS.map((position) => (
        <span
          key={position}
          className={`absolute size-2 border-[1.5px] border-(--selection) bg-(--surface-raised) ${position}`}
        />
      ))}
    </div>
  );
}
