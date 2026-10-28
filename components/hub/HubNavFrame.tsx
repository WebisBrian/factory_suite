"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Cadre de la barre du haut : thème clair sur Qualité et CodeForge (data-light), sombre ailleurs.
 * Les enfants adaptent leurs couleurs avec `group-data-light/nav:`.
 */
export function HubNavFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const light = ["/codeforge", "/quality"].some((p) => pathname.startsWith(p));

  return (
    <header
      data-light={light ? "" : undefined}
      // Le contour de focus jaune du Hub est invisible sur fond clair : bleu foncé en thème clair.
      className="group/nav border-b border-zinc-700 bg-[#121218] data-light:border-black/15 data-light:bg-[#fdfcfb] data-light:[&_:focus-visible]:outline-[#0a4fb8]!"
    >
      {children}
    </header>
  );
}
