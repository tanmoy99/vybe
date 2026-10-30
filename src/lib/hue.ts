// Static class maps: Tailwind can't see dynamically built class names like `bg-${hue}`.
export type Hue = "violet" | "indigo" | "blush";

export const HUE_DOT: Record<Hue, string> = { violet: "bg-violet", indigo: "bg-indigo", blush: "bg-blush" };
export const HUE_TEXT: Record<Hue, string> = { violet: "text-violet", indigo: "text-indigo", blush: "text-blush" };
export const HUE_CHIP: Record<Hue, string> = {
  violet: "border-violet/30 bg-violet/10",
  indigo: "border-indigo/30 bg-indigo/10",
  blush: "border-blush/30 bg-blush/10",
};
