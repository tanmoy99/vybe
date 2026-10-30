import { useId } from "react";
import { cn } from "@/lib/utils";

export type OrbHue = "violet" | "indigo" | "blush";

const HUES: Record<OrbHue, [string, string]> = {
  violet: ["#b89bff", "#5b3fc4"],
  indigo: ["#9db0ff", "#3a52c9"],
  blush: ["#ffc6e8", "#b6589a"],
};

/**
 * Faceless "Mystery mode" avatar: a lit sphere with an abstract silhouette.
 * Stands in wherever a 3D avatar isn't loaded (lists, low-power devices).
 */
export function AvatarOrb({ hue = "violet", className }: { hue?: OrbHue; className?: string }) {
  const id = useId();
  const [light, dark] = HUES[hue];
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-12", className)}>
      <defs>
        <radialGradient id={`${id}-g`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <clipPath id={`${id}-c`}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`} fill="#0d0b17" opacity="0.28">
        <circle cx="32" cy="26" r="10" />
        <ellipse cx="32" cy="58" rx="20" ry="16" />
      </g>
      <circle cx="32" cy="32" r="29.5" fill="none" stroke="#fff" strokeOpacity="0.25" />
    </svg>
  );
}
