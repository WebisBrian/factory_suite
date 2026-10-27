import Link from "next/link";

export function HubBrand() {
  return (
    <Link href="/" className="flex items-center gap-2 text-fg">
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-control bg-accent text-sm font-bold text-accent-fg"
      >
        F
      </span>
      <span className="text-base font-semibold tracking-tight">
        FactorySuite
      </span>
    </Link>
  );
}
