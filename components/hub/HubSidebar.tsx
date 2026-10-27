import { Suspense } from "react";
import { HubBrand } from "@/components/hub/HubBrand";
import { HubNav, HubNavFallback } from "@/components/hub/HubNav";

/** Barre latérale desktop (≥ md). */
export function HubSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col gap-6 border-r border-border bg-surface px-3 py-5 md:flex">
      <div className="px-3">
        <HubBrand />
      </div>
      <Suspense fallback={<HubNavFallback />}>
        <HubNav />
      </Suspense>
    </aside>
  );
}
