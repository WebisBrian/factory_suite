import type { ReactNode } from "react";
import type { HubIconName } from "@/components/hub/hub-tools";

const HUB_ICON_PATHS: Record<HubIconName, ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  screendraft: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 13h4M8 16h7" />
    </>
  ),
  generator: (
    <>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.5 5-3 14" />
    </>
  ),
  animations: (
    <>
      <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />
    </>
  ),
};

type HubIconProps = {
  name: HubIconName;
  className?: string;
};

export function HubIcon({ name, className = "size-5" }: HubIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {HUB_ICON_PATHS[name]}
    </svg>
  );
}

export function HubMenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden="true"
      className="size-5"
    >
      {open ? (
        <path d="M6 6l12 12M18 6 6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}
