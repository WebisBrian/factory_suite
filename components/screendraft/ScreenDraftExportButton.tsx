import type { ScreenDraftDocument } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftExportButton({ document }: { document: ScreenDraftDocument }) {
  function exportDocument() {
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" });
    const link = URL.createObjectURL(blob);
    const anchor = Object.assign(window.document.createElement("a"), { href: link, download: `${document.id}.json` });
    anchor.click();
    URL.revokeObjectURL(link);
  }
  return <button type="button" onClick={exportDocument} className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">Exporter</button>;
}
