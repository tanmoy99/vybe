import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AvatarOrb, type OrbHue } from "@/components/vybe/avatar-orb";

export type OrbitNode = {
  id: string;
  /** 0 = inner ring (nearest tier), 2 = outer ring. */
  ring: 0 | 1 | 2;
  /** Degrees around the ring. */
  angle: number;
  hue: OrbHue;
  /** Relative node size, 0.6 to 1.2. */
  scale?: number;
};

const RING_RADII = [0.24, 0.36, 0.48]; // fraction of the field size
const RING_DURATIONS = ["70s", "110s", "160s"];

/**
 * The Orbit: you at the centre, people on proximity rings. Rings rotate slowly
 * (CSS only, disabled for reduced motion / low power); nodes counter-rotate to
 * stay upright. Purely visual: callers must provide an equivalent list view
 * for assistive tech and keyboard users.
 */
export function OrbitField({
  nodes = [],
  center,
  className,
  showThreads = true,
}: {
  nodes?: OrbitNode[];
  center?: ReactNode;
  className?: string;
  showThreads?: boolean;
}) {
  return (
    <div aria-hidden="true" className={cn("relative aspect-square w-full select-none", className)}>
      {/* Static ring outlines */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="orbit-core-glow">
            <stop offset="0" stopColor="var(--vybe-violet)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--vybe-violet)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="22" fill="url(#orbit-core-glow)" />
        {RING_RADII.map((r, i) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r * 100}
            fill="none"
            stroke="white"
            strokeOpacity={0.09 - i * 0.02}
            strokeDasharray={i === 2 ? "0.6 1.6" : undefined}
            strokeWidth="0.25"
          />
        ))}
      </svg>

      {[0, 1, 2].map((ring) => {
        const ringNodes = nodes.filter((n) => n.ring === ring);
        if (ringNodes.length === 0) return null;
        const radius = RING_RADII[ring] * 100;
        return (
          <div
            key={ring}
            className="ambient absolute inset-0 motion-safe:animate-orbit"
            style={{ "--orbit-duration": RING_DURATIONS[ring] } as CSSProperties}
          >
            {showThreads && (
              <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
                {ringNodes.map((n) => {
                  const rad = (n.angle * Math.PI) / 180;
                  return (
                    <line
                      key={n.id}
                      x1="50"
                      y1="50"
                      x2={50 + radius * Math.cos(rad)}
                      y2={50 + radius * Math.sin(rad)}
                      stroke={`var(--vybe-${n.hue})`}
                      strokeOpacity="0.22"
                      strokeWidth="0.25"
                    />
                  );
                })}
              </svg>
            )}
            {ringNodes.map((n) => {
              const rad = (n.angle * Math.PI) / 180;
              const size = 9 * (n.scale ?? 1) - ring;
              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${50 + radius * Math.cos(rad)}%`,
                    top: `${50 + radius * Math.sin(rad)}%`,
                    width: `${size}%`,
                  }}
                >
                  <div
                    className="ambient motion-safe:animate-orbit-reverse"
                    style={{ "--orbit-duration": RING_DURATIONS[ring] } as CSSProperties}
                  >
                    <AvatarOrb hue={n.hue} className="size-full drop-shadow-[0_0_10px_rgb(157_120_245_/_0.45)]" />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="absolute top-1/2 left-1/2 w-[20%] -translate-x-1/2 -translate-y-1/2">
        <div className="ambient absolute inset-[-18%] rounded-full bg-violet/30 blur-xl motion-safe:animate-pulse-soft" />
        <div className="relative">{center ?? <AvatarOrb hue="violet" className="size-full" />}</div>
      </div>
    </div>
  );
}
