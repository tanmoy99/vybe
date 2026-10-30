import type { Hue } from "@/lib/hue";

const HUES: Hue[] = ["violet", "indigo", "blush"];

/** Stable colour for someone without a published avatar (derived from an opaque id). */
export function hueFor(id: string): Hue {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}
