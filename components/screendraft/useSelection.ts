"use client";

import { useState } from "react";

export function useSelection<T extends { id: string }>() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return { selectedId, setSelectedId, isSelected: (item: T) => item.id === selectedId };
}
