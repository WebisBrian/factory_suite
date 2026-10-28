"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { DraftNode, TextNode } from "@/app/screen-draft/_lib/schema";
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
  if (type === "title") {
    return {
      id, type, x: offset, y: offset, width: 420, height: 64,
      style: { color: "#111827", fontSize: 36, fontWeight: 700, textAlign: "left" },
      props: { text: "Nouveau titre", level: 2 },
    };
  }
  if (type === "section") {
    return {
      id, type, x: offset, y: offset, width: 420, height: 220,
      style: { backgroundColor: "#e0f2fe", borderRadius: 16, borderWidth: 1, borderColor: "#7dd3fc" },
      children: [],
    };
  }
  if (type === "image") {
    return {
      id, type, x: offset, y: offset, width: 260, height: 180,
      style: { borderRadius: 12 },
      props: { src: "https://placehold.co/520x360/e0f2fe/0369a1?text=Image", alt: "Image de maquette", fit: "cover" },
    };
  }
  if (type === "shape") {
    return {
      id, type, x: offset, y: offset, width: 160, height: 160,
      style: { backgroundColor: "#38bdf8", borderWidth: 0, borderColor: "#0284c7" },
      props: { shape },
    };
  }
  return {
    id, type: "button", x: offset, y: offset, width: 180, height: 52,
    style: { backgroundColor: "#0284c7", color: "#ffffff", fontSize: 16, fontWeight: 600, textAlign: "center", borderRadius: 10 },
    props: { label: "Nouveau bouton" },
  };
}

export function ScreenDraftEditor() {
  const [nodes, setNodes] = useState<DraftNode[]>([INITIAL_TEXT]);
  const [selectedId, setSelectedId] = useState(INITIAL_TEXT.id);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const textEditorRefs = useRef(new Map<string, HTMLDivElement>());
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;

  useEffect(() => {
    nodes.forEach((node) => {
      if (node.type !== "text") return;
      const editor = textEditorRefs.current.get(node.id);
      if (editor && document.activeElement !== editor && editor.textContent !== node.props.text) {
        editor.textContent = node.props.text;
      }
    });
  }, [nodes]);

  function getCanvasPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function addNode(type: DraftNode["type"], shape?: "circle" | "rectangle" | "triangle") {
    const node = createNode(type, nodes.length, shape);
    setNodes((current) => [...current, node]);
    setSelectedId(node.id);
  }

  function startDragging(event: ReactPointerEvent<HTMLDivElement>, node: DraftNode) {
    if ((event.target as HTMLElement).isContentEditable) return;
    event.stopPropagation();
    event.preventDefault();
    setSelectedId(node.id);
    setDraggingId(node.id);
    const point = getCanvasPoint(event);
    dragOffset.current = { x: point.x - node.x, y: point.y - node.y };
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

  function updateText(nodeId: string, value: string) {
    setNodes((current) => current.map((node) => node.id === nodeId && node.type === "text"
      ? { ...node, props: { text: value } }
      : node));
  }

  function renderNode(node: DraftNode) {
    const style = {
      color: node.style.color,
      fontSize: node.style.fontSize,
      fontWeight: node.style.fontWeight,
      textAlign: node.style.textAlign,
    } as const;
    if (node.type === "text") {
      return (
        <div
          ref={(element) => {
            if (element) textEditorRefs.current.set(node.id, element);
            else textEditorRefs.current.delete(node.id);
          }}
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => updateText(node.id, event.currentTarget.textContent ?? "")}
          className="min-h-full outline-none"
          style={style}
          spellCheck
        />
      );
    }
    if (node.type === "title") {
      const Tag = node.props.level === 1 ? "h1" : node.props.level === 2 ? "h2" : "h3";
      return <Tag style={style} className="font-bold">{node.props.text}</Tag>;
    }
    if (node.type === "section") {
      return <div className="h-full w-full" style={{ backgroundColor: node.style.backgroundColor, borderRadius: node.style.borderRadius, border: node.style.borderWidth ? `${node.style.borderWidth}px solid ${node.style.borderColor ?? "transparent"}` : undefined }} />;
    }
    if (node.type === "image") {
      return (
        <ScreenDraftImageNode
          node={node}
          editable={selectedId === node.id}
          onImageChange={(src, alt) => setNodes((current) => current.map((item) => item.id === node.id && item.type === "image"
            ? { ...item, props: { ...item.props, src, alt } }
            : item))}
        />
      );
    }
    if (node.type === "shape") return <ScreenDraftShapeNode node={node} />;
    return <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: node.style.backgroundColor, color: node.style.color, fontSize: node.style.fontSize, fontWeight: node.style.fontWeight, borderRadius: node.style.borderRadius }}>{node.props.label}</div>;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-sky-400 uppercase">Screendraft</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Éditeur de maquette</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["text", "title", "section", "image", "button"] as const).map((type) => (
            <button key={type} type="button" onClick={() => addNode(type)} className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400">
              + {type === "text" ? "Texte" : type === "title" ? "Titre" : type === "section" ? "Section" : type === "image" ? "Image" : "Bouton"}
            </button>
          ))}
          <div className="flex items-center gap-1 rounded-lg border border-sky-400/40 p-1">
            <span className="px-2 text-xs text-sky-300">Forme</span>
            <button type="button" onClick={() => addNode("shape", "circle")} className="rounded px-2 py-1 text-sm text-white hover:bg-white/10" aria-label="Ajouter un rond">○</button>
            <button type="button" onClick={() => addNode("shape", "rectangle")} className="rounded px-2 py-1 text-sm text-white hover:bg-white/10" aria-label="Ajouter un carré">□</button>
            <button type="button" onClick={() => addNode("shape", "triangle")} className="rounded px-2 py-1 text-sm text-white hover:bg-white/10" aria-label="Ajouter un triangle">△</button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="overflow-auto rounded-2xl border border-white/10 bg-white/3 p-6">
          <div
            ref={canvasRef}
            role="application"
            aria-label="Canvas de maquette"
            onPointerDown={() => setSelectedId("")}
            className="relative mx-auto h-[600px] w-[900px] max-w-full overflow-hidden rounded-lg bg-white shadow-2xl"
            style={{ backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          >
            {nodes.map((node) => (
              <div
                key={node.id}
                onPointerDown={(event) => startDragging(event, node)}
                onPointerMove={(event) => moveNode(event, node.id)}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
                onClick={(event) => { event.stopPropagation(); setSelectedId(node.id); }}
                className={`absolute cursor-move rounded px-2 py-1 ${selectedId === node.id ? "ring-2 ring-sky-500 ring-offset-2" : ""} ${draggingId === node.id ? "cursor-grabbing" : ""}`}
                style={{ left: node.x, top: node.y, width: node.width, height: node.height, touchAction: "none" }}
              >
                {renderNode(node)}
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <h2 className="font-medium text-white">Propriétés</h2>
          {selectedNode ? (
            <p className="mt-5 text-sm text-zinc-400">Élément sélectionné : <strong className="text-white">{selectedNode.type}</strong></p>
          ) : (
            <p className="mt-5 text-sm text-zinc-500">Sélectionnez un élément.</p>
          )}
          {selectedNode?.type === "text" && (
            <label className="mt-5 block text-xs text-zinc-400">
              Contenu
              <textarea value={selectedNode.props.text} onChange={(event) => updateText(selectedNode.id, event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-sky-400" />
            </label>
          )}
          <p className="mt-5 text-xs leading-5 text-zinc-500">Faites glisser les éléments pour les déplacer. Les textes sont éditables directement.</p>
        </aside>
      </div>
    </main>
  );
}
