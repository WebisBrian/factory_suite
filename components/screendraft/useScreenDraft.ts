"use client";

import { useCallback, useState } from "react";
import type { DraftNode } from "@/app/screen-draft/_lib/schema";

export function useScreenDraft(initialNodes: DraftNode[] = []) {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const addNode = useCallback((node: DraftNode) => { setNodes((items) => [...items, node]); setSelectedId(node.id); }, []);
  const updateNode = useCallback((node: DraftNode) => setNodes((items) => items.map((item) => item.id === node.id ? node : item)), []);
  const deleteNode = useCallback((id: string) => { setNodes((items) => items.filter((item) => item.id !== id)); setSelectedId((id === selectedId) ? null : selectedId); }, [selectedId]);
  return { nodes, selectedId, selectedNode: nodes.find((node) => node.id === selectedId) ?? null, setSelectedId, addNode, updateNode, deleteNode };
}
