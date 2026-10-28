import Link from "next/link";
import { Suspense } from "react";
import { HubLogo } from "@/components/hub/HubAppIcon";
import { HubNavSwitcher } from "@/components/hub/HubNavSwitcher";

export function HubNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121218]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
          <HubLogo size="sm" />
          <span>
            Factory<span className="text-zinc-400">Suite</span>
          </span>
        </Link>
        {/* useSearchParams (project_id) → Suspense obligatoire pour l'export statique. */}
        <Suspense fallback={null}>
          <HubNavSwitcher />
        </Suspense>
      </nav>
    </header>
  );
}
