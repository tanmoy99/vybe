"use client";

import { AvatarOrb } from "@/components/vybe/avatar-orb";
import { TIER_LABEL } from "@/lib/matching/explain";
import { hueFor } from "@/lib/person-hue";

type Node = { id: string; nickname: string; tier: number; wavelength: number };

// Rings are proximity tiers, not distances. Angles are spread evenly per ring.
const RING_FOR_TIER: Record<number, number> = { 2: 0, 3: 1, 4: 2, 5: 2 };
const RADII = [0.22, 0.34, 0.46];
const MAX_PER_RING = [6, 9, 12];

/**
 * Interactive Orbit. Nodes are real buttons (keyboard + screen reader
 * friendly) and stay still so they're easy to tap; the list view is the
 * fully accessible equivalent.
 */
export function RadarOrbit({ people, onSelect, center }: { people: Node[]; onSelect: (id: string) => void; center: React.ReactNode }) {
  const rings: Node[][] = [[], [], []];
  for (const p of people) {
    const r = RING_FOR_TIER[p.tier] ?? 2;
    if (rings[r].length < MAX_PER_RING[r]) rings[r].push(p);
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <radialGradient id="radar-glow">
            <stop offset="0" stopColor="var(--vybe-violet)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--vybe-violet)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="20" fill="url(#radar-glow)" />
        {RADII.map((r, i) => (
          <circle key={r} cx="50" cy="50" r={r * 100} fill="none" stroke="white" strokeOpacity={0.1 - i * 0.025} strokeWidth="0.25" />
        ))}
        {rings.flatMap((ring, ri) =>
          ring.map((p, i) => {
            const a = ((i / ring.length) * 360 + ri * 23) * (Math.PI / 180);
            const hue = hueFor(p.id);
            return (
              <line
                key={`l-${p.id}`}
                x1="50"
                y1="50"
                x2={50 + RADII[ri] * 100 * Math.cos(a)}
                y2={50 + RADII[ri] * 100 * Math.sin(a)}
                stroke={`var(--vybe-${hue})`}
                strokeOpacity={0.12 + p.wavelength * 0.08}
                strokeWidth="0.25"
              />
            );
          }),
        )}
      </svg>

      {/* Ring labels */}
      {[0, 1, 2].map((ri) => (
        <span
          key={ri}
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 text-[10px] tracking-wider text-muted-foreground/70 uppercase"
          style={{ top: `${50 - RADII[ri] * 100 - 3.5}%` }}
        >
          {ri === 0 ? TIER_LABEL[2] : ri === 1 ? TIER_LABEL[3] : TIER_LABEL[4]}
        </span>
      ))}

      <ul aria-label="People in your orbit">
        {rings.flatMap((ring, ri) =>
          ring.map((p, i) => {
            const a = ((i / ring.length) * 360 + ri * 23) * (Math.PI / 180);
            const size = 8 + p.wavelength * 1.6 - ri * 0.8;
            return (
              <li
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${50 + RADII[ri] * 100 * Math.cos(a)}%`, top: `${50 + RADII[ri] * 100 * Math.sin(a)}%`, width: `${size}%` }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className="group block w-full rounded-full transition-transform hover:scale-110 focus-visible:scale-110"
                  aria-label={`${p.nickname}, ${TIER_LABEL[p.tier]}`}
                >
                  <AvatarOrb hue={hueFor(p.id)} className="size-full drop-shadow-[0_0_10px_rgb(157_120_245_/_0.45)]" />
                  <span className="pointer-events-none absolute top-full left-1/2 mt-1 hidden -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground group-hover:block group-focus-visible:block sm:block">
                    {p.nickname}
                  </span>
                </button>
              </li>
            );
          }),
        )}
      </ul>

      <div className="absolute top-1/2 left-1/2 w-[18%] -translate-x-1/2 -translate-y-1/2">{center}</div>
    </div>
  );
}
