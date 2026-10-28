import type { Frame } from "@/components/screendraft/screendraft-schema";

export type FrameFormat = Pick<Frame, "device" | "width" | "height">;

export type FramePreset = FrameFormat & { label: string };

/** Formats proposés à la création d'une maquette (SCRUM-5). La largeur identifie le format. */
export const FRAME_PRESETS: readonly FramePreset[] = [
  { label: "Desktop", device: "desktop", width: 1440, height: 1024 },
  { label: "Laptop", device: "desktop", width: 1280, height: 800 },
  { label: "Grand écran", device: "desktop", width: 1920, height: 1080 },
  { label: "iPhone SE", device: "mobile", width: 375, height: 667 },
  { label: "iPhone 16", device: "mobile", width: 393, height: 852 },
  { label: "iPhone 16 Pro Max", device: "mobile", width: 440, height: 956 },
  { label: "Android", device: "mobile", width: 412, height: 917 },
];

/** Bornes de la hauteur réglable à la main : une page peut être plus longue que l'écran. */
export const MIN_FRAME_HEIGHT = 100;
export const MAX_FRAME_HEIGHT = 20000;

export function findPreset(frame: Frame): FramePreset | undefined {
  return FRAME_PRESETS.find(
    (preset) => preset.device === frame.device && preset.width === frame.width,
  );
}

export function isValidFrameHeight(height: number): boolean {
  return Number.isInteger(height) && height >= MIN_FRAME_HEIGHT && height <= MAX_FRAME_HEIGHT;
}
