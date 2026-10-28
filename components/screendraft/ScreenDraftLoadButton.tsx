"use client";

import { useRef } from "react";
import type { ScreenDraftDocument } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftLoadButton({ onLoad }: { onLoad: (document: ScreenDraftDocument) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (file) onLoad(JSON.parse(await file.text()) as ScreenDraftDocument); event.target.value = ""; }} />
      <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">Charger</button>
    </>
  );
}
