/** Vrai quand la touche vise un champ de saisie : on laisse alors le navigateur la gérer. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export type HistoryShortcut = "undo" | "redo";

/** Ctrl/⌘ + Z : annuler ; Ctrl/⌘ + Maj + Z ou Ctrl + Y : rétablir. `key` suit la disposition du clavier (AZERTY compris). */
export function historyShortcut(event: KeyboardEvent): HistoryShortcut | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return null;
  const key = event.key.toLowerCase();
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  if (key === "y" && event.ctrlKey && !event.shiftKey) return "redo";
  return null;
}
