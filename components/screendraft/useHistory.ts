"use client";

import { useCallback, useState } from "react";

export function useHistory<T>(initial: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState(initial);
  const [future, setFuture] = useState<T[]>([]);
  const update = useCallback((next: T) => { setPast((items) => [...items, present]); setPresent(next); setFuture([]); }, [present]);
  const undo = useCallback(() => { const previous = past.at(-1); if (previous === undefined) return; setPast((items) => items.slice(0, -1)); setFuture((items) => [present, ...items]); setPresent(previous); }, [past, present]);
  const redo = useCallback(() => { const next = future[0]; if (next === undefined) return; setFuture((items) => items.slice(1)); setPast((items) => [...items, present]); setPresent(next); }, [future, present]);
  return { present, update, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
