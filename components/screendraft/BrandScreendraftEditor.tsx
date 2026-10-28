"use client";

import "@/components/screendraft/screendraft-theme.css";
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import wordmark from "@/components/screendraft/brand/logos/screen-draft-wordmark.svg";
import wordmarkWhite from "@/components/screendraft/brand/logos/screen-draft-wordmark-white.svg";
import { ScreendraftPalette } from "@/components/screendraft/ScreendraftPalette";
import { ScreendraftPropertiesPanel } from "@/components/screendraft/BrandScreendraftPropertiesPanel";
import { ScreendraftThemeToggle } from "@/components/screendraft/ScreendraftThemeToggle";
import type { DraftNode, Maquette, ShapeKind, TextNode } from "@/components/screendraft/screendraft-schema";
import { ScreenDraftImageNode } from "./ScreenDraftImageNode";
import { ScreenDraftShapeNode } from "./ScreenDraftShapeNode";

const INITIAL_TEXT: TextNode = {
  id: "text_1",
  type: "text",
  x: 120,
  y: 120,
  width: 360,
  height: 96,
  style: { color: "#111827", fontSize: 28, fontWeight: 500, textAlign: "left" },
  props: { text: "Double-cliquez pour modifier ce texte" },
};

function createNode(type: DraftNode["type"], index: number, shape: "circle" | "rectangle" | "triangle" = "rectangle"): DraftNode {
  const offset = 40 + (index % 5) * 32;
  const id = `${type}_${Date.now()}_${index}`;
  if (type === "text") return { ...INITIAL_TEXT, id, x: offset, y: offset, props: { text: "Nouveau texte" } };
  if (type === "title") return { id, type, x: offset, y: offset, width: 420, height: 64, style: { color: "#111827", fontSize: 36, fontWeight: 700, textAlign: "left" }, props: { text: "Nouveau titre", level: 2 } };
  if (type === "section") return { id, type, x: offset, y: offset, width: 420, height: 220, style: { backgroundColor: "#e0f2fe", borderRadius: 16, borderWidth: 1, borderColor: "#7dd3fc" }, children: [] };
  if (type === "image") return { id, type, x: offset, y: offset, width: 260, height: 180, style: { borderRadius: 12 }, props: { src: "https://placehold.co/520x360/e0f2fe/0369a1?text=Image", alt: "Image de maquette", fit: "cover" } };
  if (type === "shape") return { id, type, x: offset, y: offset, width: 160, height: 160, style: { backgroundColor: "#38bdf8", borderWidth: 0, borderColor: "#0284c7" }, props: { shape } };
  return { id, type: "button", x: offset, y: offset, width: 180, height: 52, style: { backgroundColor: "#0284c7", color: "#ffffff", fontSize: 16, fontWeight: 600, textAlign: "center", borderRadius: 10 }, props: { label: "Nouveau bouton" } };
}

export function BrandScreendraftEditor({ draft }: { draft: Maquette }) {
  const [nodes, setNodes] = useState<DraftNode[]>(draft.nodes.length > 0 ? draft.nodes : [INITIAL_TEXT]);
  const [selectedId, setSelectedId] = useState<string | null>(draft.nodes[0]?.id ?? INITIAL_TEXT.id);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;

  function getCanvasPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    return bounds ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top } : { x: 0, y: 0 };
  }

  function addNode(type: DraftNode["type"], shape?: ShapeKind) {
    const node = createNode(type, nodes.length, shape);
    setNodes((current) => [...current, node]);
    setSelectedId(node.id);
  }

  function startDragging(event: ReactPointerEvent<HTMLDivElement>, node: DraftNode) {
    if ((event.target as HTMLElement).isContentEditable) return;
    event.stopPropagation();
    event.preventDefault();
    const point = getCanvasPoint(event);
    dragOffset.current = { x: point.x - node.x, y: point.y - node.y };
    setSelectedId(node.id);
    setDraggingId(node.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveNode(event: ReactPointerEvent<HTMLDivElement>, nodeId: string) {
    if (draggingId !== nodeId) return;
    const point = getCanvasPoint(event);
    setNodes((current) => current.map((node) => node.id === nodeId
      ? { ...node, x: Math.max(0, Math.round(point.x - dragOffset.current.x)), y: Math.max(0, Math.round(point.y - dragOffset.current.y)) }
      : node));
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (draggingId !== null) event.currentTarget.releasePointerCapture(event.pointerId);
    setDraggingId(null);
  }

  function updateText(value: string) {
    if (!selectedId) return;
    setNodes((current) => current.map((node) => {
      if (node.id !== selectedId) return node;
      if (node.type === "text") return { ...node, props: { text: value } };
      if (node.type === "title") return { ...node, props: { text: value, level: node.props.level } };
      return node;
    }));
  }

  function renderNode(node: DraftNode) {
    const style = { color: node.style.color, fontSize: node.style.fontSize, fontWeight: node.style.fontWeight, textAlign: node.style.textAlign };
    if (node.type === "text") return <div contentEditable suppressContentEditableWarning className="min-h-full outline-none" style={style} onInput={(event) => node.id === selectedId && updateText(event.currentTarget.textContent ?? "")}>{node.props.text}</div>;
    if (node.type === "title") {
      const Tag = node.props.level === 1 ? "h1" : node.props.level === 2 ? "h2" : "h3";
      return <Tag style={style} className="font-bold">{node.props.text}</Tag>;
    }
    if (node.type === "section") return <div className="h-full w-full" style={{ backgroundColor: node.style.backgroundColor, borderRadius: node.style.borderRadius, border: node.style.borderWidth ? `${node.style.borderWidth}px solid ${node.style.borderColor ?? "transparent"}` : undefined }} />;
    if (node.type === "image") return <ScreenDraftImageNode node={node} editable={selectedId === node.id} onImageChange={(src, alt) => setNodes((current) => current.map((item) => item.id === node.id && item.type === "image" ? { ...item, props: { ...item.props, src, alt } } : item))} />;
    if (node.type === "shape") return <ScreenDraftShapeNode node={node} />;
    return <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: node.style.backgroundColor, color: node.style.color, fontSize: node.style.fontSize, fontWeight: node.style.fontWeight, borderRadius: node.style.borderRadius }}>{node.props.label}</div>;
  }

  return (
    <div className="screendraft flex min-h-0 flex-1 flex-col bg-(--surface) text-(--ink)">
      <header className="flex h-14 shrink-0 items-center gap-(--space-3) border-b border-(--line) bg-(--surface-raised) px-(--space-4)">
        <img src={wordmark.src} alt="Screen draft" className="sd-only-light h-8 w-auto" />
        <img src={wordmarkWhite.src} alt="Screen draft" className="sd-only-dark h-8 w-auto" />
        <span aria-hidden className="text-body-sm text-(--line-strong)">/</span>
        <span className="text-body-sm truncate text-(--ink-muted)">{draft.name}</span>
        <div className="ml-auto"><ScreendraftThemeToggle /></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <ScreendraftPalette onAdd={addNode} />
        <main className="min-w-0 flex-1 overflow-auto bg-(--canvas) p-(--space-6)">
          <div
            ref={canvasRef}
            role="application"
            aria-label="Canvas de maquette"
            onPointerDown={() => setSelectedId(null)}
            className="relative mx-auto overflow-hidden rounded-(--radius-md) bg-white shadow-xl"
            style={{ width: draft.frame.width, height: draft.frame.height, backgroundColor: draft.frame.backgroundColor, backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          >
            {nodes.map((node) => (
              <div key={node.id} onPointerDown={(event) => startDragging(event, node)} onPointerMove={(event) => moveNode(event, node.id)} onPointerUp={stopDragging} onPointerCancel={stopDragging} onClick={(event) => { event.stopPropagation(); setSelectedId(node.id); }} className={`absolute cursor-move px-2 py-1 ${selectedId === node.id ? "ring-2 ring-(--accent)" : ""} ${draggingId === node.id ? "cursor-grabbing" : ""}`} style={{ left: node.x, top: node.y, width: node.width, height: node.height, touchAction: "none" }}>
                {renderNode(node)}
              </div>
            ))}
          </div>
        </main>
        <ScreendraftPropertiesPanel frame={draft.frame} selectedNode={selectedNode} onTextChange={updateText} />
      </div>
    </div>
  );
}
