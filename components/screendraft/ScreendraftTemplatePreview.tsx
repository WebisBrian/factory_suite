import { ScreendraftFrame } from "@/components/screendraft/ScreendraftFrame";
import type { Screen } from "@/components/screendraft/screendraft-schema";

// Taille de la vignette, en px : c'est une image réduite, elle ne suit pas le réglage du texte.
const PREVIEW_WIDTH = 288;
const PREVIEW_HEIGHT = 180;

/**
 * Vignette du premier écran d'un modèle : la largeur tient dans la vignette (le haut de la page
 * est visible), sans réduire un écran mobile au point de le rendre illisible.
 * Le rendu est masqué aux technologies d'assistance (ses titres fausseraient le plan de la page) :
 * la vignette est annoncée comme une seule image.
 */
export function ScreendraftTemplatePreview({ screen, label }: { screen: Screen; label: string }) {
  const { width, height } = screen.frame;
  const zoom = Math.min(PREVIEW_WIDTH / width, (PREVIEW_HEIGHT * 2) / height);

  return (
    <div
      role="img"
      aria-label={label}
      className="relative mx-auto overflow-hidden rounded-(--radius-md) border border-(--line-strong) bg-(--canvas)"
      style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
    >
      <div aria-hidden inert>
        <ScreendraftFrame
          screen={screen}
          style={{
            top: 0,
            left: (PREVIEW_WIDTH - width * zoom) / 2,
            transformOrigin: "0 0",
            transform: `scale(${zoom})`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
