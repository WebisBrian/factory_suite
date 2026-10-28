"use client";

import "@/components/screendraft/screendraft-theme.css";
import { useReducer } from "react";
import wordmark from "@/components/screendraft/brand/logos/screen-draft-wordmark.svg";
import wordmarkWhite from "@/components/screendraft/brand/logos/screen-draft-wordmark-white.svg";
import { ScreendraftCanvas } from "@/components/screendraft/ScreendraftCanvas";
import { ScreendraftPalette } from "@/components/screendraft/ScreendraftPalette";
import { ScreendraftPropertiesPanel } from "@/components/screendraft/ScreendraftPropertiesPanel";
import { ScreendraftThemeToggle } from "@/components/screendraft/ScreendraftThemeToggle";
import { screendraftReducer } from "@/components/screendraft/screendraft-reducer";
import type { Maquette } from "@/components/screendraft/screendraft-schema";

/** Éditeur plein écran, dans l'espace laissé sous la barre du Hub. */
export function ScreendraftEditor({ initialDraft }: { initialDraft: Maquette }) {
  const [draft, dispatch] = useReducer(screendraftReducer, initialDraft);

  return (
    <div className="screendraft flex min-h-0 flex-1 flex-col bg-(--surface) text-(--ink)">
      <header className="flex h-14 shrink-0 items-center gap-(--space-3) border-b border-(--line) bg-(--surface-raised) px-(--space-4)">
        {/* SVG servis tels quels : next/image n'a pas de loader en export statique. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wordmark.src} alt="Screen draft" className="sd-only-light h-8 w-auto" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wordmarkWhite.src} alt="Screen draft" className="sd-only-dark h-8 w-auto" />
        <span aria-hidden className="text-body-sm text-(--line-strong)">
          /
        </span>
        <span className="text-body-sm truncate text-(--ink-muted)">{draft.name}</span>
        <div className="ml-auto">
          <ScreendraftThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ScreendraftPalette />
        {/* Changer de format (donc de largeur) recrée le canvas, qui se réajuste à l'écran. */}
        <ScreendraftCanvas key={draft.frame.width} draft={draft} />
        <ScreendraftPropertiesPanel frame={draft.frame} dispatch={dispatch} />
      </div>
    </div>
  );
}
