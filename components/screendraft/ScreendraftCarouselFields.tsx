import { useContext, useRef, type Dispatch, type ReactNode } from "react";
import {
  FIELD_CLASS,
  ScreendraftField,
  ScreendraftFieldGroup,
} from "@/components/screendraft/ScreendraftFields";
import {
  CarouselPreviewContext,
  createSlide,
  wrapSlideIndex,
} from "@/components/screendraft/screendraft-carousel";
import type { ScreendraftAction } from "@/components/screendraft/screendraft-reducer";
import type { CarouselNode, CarouselSlide } from "@/components/screendraft/screendraft-schema";

type ScreendraftCarouselFieldsProps = {
  node: CarouselNode;
  dispatch: Dispatch<ScreendraftAction>;
};

/**
 * Contenu d'un carrousel (SCRUM-31) : son nom, et ses diapositives à ajouter, remplacer,
 * décrire, réordonner ou retirer. « Afficher » montre une diapositive dans l'éditeur.
 */
export function ScreendraftCarouselFields({ node, dispatch }: ScreendraftCarouselFieldsProps) {
  const { slideIndex, showSlide } = useContext(CarouselPreviewContext);
  const { slides, title } = node.props;
  const shown = wrapSlideIndex(slideIndex(node.id), slides.length);

  function setProps(props: Partial<CarouselNode["props"]>) {
    dispatch({ type: "set-props", id: node.id, nodeType: "carousel", props });
  }

  // Ajouter, retirer, réordonner : jamais regroupé avec une saisie dans l'historique.
  function setSlides(next: CarouselSlide[]) {
    dispatch({ type: "set-carousel-slides", id: node.id, slides: next });
  }

  // Saisie du lien ou du texte alternatif : regroupée en une étape tant qu'elle continue.
  function updateSlide(index: number, patch: Partial<CarouselSlide>) {
    setProps({ slides: slides.map((slide, position) => (position === index ? { ...slide, ...patch } : slide)) });
  }

  function moveSlide(index: number, delta: -1 | 1) {
    const next = [...slides];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setSlides(next);
    showSlide(node.id, index + delta);
  }

  function removeSlide(index: number) {
    setSlides(slides.filter((_, position) => position !== index));
    showSlide(node.id, Math.max(0, Math.min(shown, slides.length - 2)));
  }

  function addSlide() {
    setSlides([...slides, createSlide(slides.length + 1)]);
    showSlide(node.id, slides.length);
  }

  return (
    <ScreendraftFieldGroup title="Contenu">
      <ScreendraftField label="Nom du carrousel (lu par les lecteurs d’écran)">
        <input
          type="text"
          value={title}
          onChange={(event) => setProps({ title: event.target.value })}
          aria-invalid={title.trim() === "" || undefined}
          className={FIELD_CLASS}
        />
      </ScreendraftField>

      <ol className="flex flex-col gap-(--space-3)">
        {slides.map((slide, index) => {
          const position = `Diapositive ${index + 1}`;
          return (
            <li
              key={slide.id}
              className={`flex flex-col gap-(--space-2) rounded-(--radius-md) border p-(--space-2) ${
                index === shown ? "border-(--draft)" : "border-(--line)"
              }`}
            >
              <span className="font-semibold">
                {position}
                {index === shown && " (affichée)"}
              </span>
              <div className="flex gap-(--space-1)">
                <SlideButton label={`Afficher la ${position.toLowerCase()}`} disabled={index === shown} onClick={() => showSlide(node.id, index)}>
                  Voir
                </SlideButton>
                <SlideButton label={`Monter la ${position.toLowerCase()}`} disabled={index === 0} onClick={() => moveSlide(index, -1)}>
                  ↑
                </SlideButton>
                <SlideButton
                  label={`Descendre la ${position.toLowerCase()}`}
                  disabled={index === slides.length - 1}
                  onClick={() => moveSlide(index, 1)}
                >
                  ↓
                </SlideButton>
                <SlideButton label={`Retirer la ${position.toLowerCase()}`} disabled={slides.length === 1} onClick={() => removeSlide(index)}>
                  ×
                </SlideButton>
              </div>
              <ScreendraftField label="Lien de l’image">
                <input
                  type="url"
                  inputMode="url"
                  value={slide.src.startsWith("data:") ? "" : slide.src}
                  placeholder={slide.src.startsWith("data:") ? "Image importée" : "https://…"}
                  onChange={(event) => updateSlide(index, { src: event.target.value })}
                  className={FIELD_CLASS}
                />
              </ScreendraftField>
              <SlideFileButton
                label={`Importer une image pour la ${position.toLowerCase()}`}
                onLoad={(src, fileName) => updateSlide(index, { src, alt: slide.alt || fileName })}
              />
              <ScreendraftField label="Texte alternatif (obligatoire)">
                <input
                  type="text"
                  value={slide.alt}
                  onChange={(event) => updateSlide(index, { alt: event.target.value })}
                  aria-invalid={slide.alt.trim() === "" || undefined}
                  className={FIELD_CLASS}
                />
              </ScreendraftField>
            </li>
          );
        })}
      </ol>

      <button type="button" onClick={addSlide} className={`${FIELD_CLASS} min-h-10 hover:bg-(--canvas)`}>
        Ajouter une diapositive
      </button>
    </ScreendraftFieldGroup>
  );
}

type SlideButtonProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

function SlideButton({ label, disabled, onClick, children }: SlideButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid min-h-10 min-w-10 place-items-center rounded-(--radius-md) border border-(--line-strong) px-(--space-2) text-(--ink) hover:bg-(--canvas) disabled:border-(--line) disabled:text-(--line-strong) disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/** L'image est embarquée dans la maquette en data URL : pas de serveur pour l'héberger. */
function SlideFileButton({ label, onLoad }: { label: string; onLoad: (src: string, fileName: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") onLoad(reader.result, file.name);
    });
    reader.readAsDataURL(file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={label}
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${FIELD_CLASS} min-h-10 hover:bg-(--canvas)`}
      >
        Importer une image
      </button>
    </>
  );
}
