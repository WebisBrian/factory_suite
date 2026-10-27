"use client";

import { Suspense, useState } from "react";
import { HubBrand } from "@/components/hub/HubBrand";
import { HubMenuIcon } from "@/components/hub/HubIcons";
import { HubNav, HubNavFallback } from "@/components/hub/HubNav";

/** En-tête mobile (< md) avec tiroir de navigation. */
export function HubHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface md:hidden">
      <div className="flex h-header items-center justify-between px-4">
        <HubBrand />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="hub-mobile-nav"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="grid size-9 place-items-center rounded-control text-fg-muted hover:bg-surface-raised hover:text-fg"
        >
          <HubMenuIcon open={open} />
        </button>
      </div>
      <div
        id="hub-mobile-nav"
        hidden={!open}
        className="border-t border-border px-3 py-3"
      >
        <Suspense fallback={<HubNavFallback />}>
          <HubNav onNavigate={() => setOpen(false)} />
        </Suspense>
      </div>
    </header>
  );
}
