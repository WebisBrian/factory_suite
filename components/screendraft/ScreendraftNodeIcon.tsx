import type { ReactNode } from "react";
import type { DraftNodeType } from "@/components/screendraft/screendraft-schema";

const ICONS: Record<DraftNodeType, ReactNode> = {
  section: <rect x="3" y="5" width="18" height="14" rx="2" />,
  title: <path d="M6 5v14M18 5v14M6 12h12" />,
  text: <path d="M4 7h16M4 12h16M4 17h10" />,
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 6" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  carousel: (
    <>
      <rect x="6" y="5" width="12" height="11" rx="2" />
      <path d="M3 8v5M21 8v5M10 20h.01M12 20h.01M14 20h.01" />
    </>
  ),
  button: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <path d="M9 12h6" />
    </>
  ),
  shape: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="m16 4 5 8h-10z" />
      <rect x="4" y="15" width="16" height="5" rx="1" />
    </>
  ),
};

/** Icône d'un type de composant, dans la couleur du texte qui l'entoure. */
export function ScreendraftNodeIcon({ type }: { type: DraftNodeType }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5 shrink-0 fill-none stroke-current"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[type]}
    </svg>
  );
}
