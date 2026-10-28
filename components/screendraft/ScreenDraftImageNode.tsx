"use client";

import { useRef } from "react";
import type { ImageNode } from "@/app/screen-draft/_lib/schema";

export function ScreenDraftImageNode({
  node,
  editable = false,
  onImageChange,
}: {
  node: ImageNode;
  editable?: boolean;
  onImageChange?: (src: string, alt: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") onImageChange?.(reader.result, file.name);
    });
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative h-full w-full">
      <img
        src={node.props.src}
        alt={node.props.alt}
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        style={{ objectFit: node.props.fit, borderRadius: node.style.borderRadius }}
        className="pointer-events-none block h-full w-full select-none"
      />
      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handleFileChange(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => inputRef.current?.click()}
            className="absolute inset-x-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white hover:bg-black/85"
          >
            Remplacer l’image
          </button>
        </>
      )}
    </div>
  );
}
