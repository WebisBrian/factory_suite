"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HubIcon } from "@/components/hub/HubIcons";
import { HUB_NAV_ITEMS } from "@/components/hub/hub-tools";

type HubNavProps = {
  onNavigate?: () => void;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HubNav({ onNavigate }: HubNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-col gap-1">
        {HUB_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-fg-muted hover:bg-surface-raised hover:text-fg"
                }`}
              >
                <HubIcon name={item.icon} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Rendu statique (sans état actif) servant de fallback Suspense. */
export function HubNavFallback() {
  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-col gap-1">
        {HUB_NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-fg-muted"
            >
              <HubIcon name={item.icon} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
