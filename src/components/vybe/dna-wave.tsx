import { cn } from "@/lib/utils";

export type WaveStrand = { label: string; hue: "violet" | "indigo" | "blush"; weight: number };

function wavePath(amplitude: number, frequency: number, phase: number, width = 600, height = 120) {
  const mid = height / 2;
  const points: string[] = [];
  for (let x = 0; x <= width; x += 6) {
    // Taper at both ends so strands braid together like a signal.
    const envelope = Math.sin((Math.PI * x) / width);
    const y = mid + Math.sin((x / width) * Math.PI * 2 * frequency + phase) * amplitude * envelope;
    points.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

/**
 * VYBE DNA as layered signal waves: one strand per world, amplitude from how
 * much of that world is in someone's DNA. Decorative; callers render the
 * strands as text too. `weight` is 0 to 1.
 */
export function DnaWave({ strands, className, label }: { strands: WaveStrand[]; className?: string; label: string }) {
  return (
    <svg viewBox="0 0 600 120" role="img" aria-label={label} className={cn("w-full", className)} preserveAspectRatio="none">
      <line x1="0" y1="60" x2="600" y2="60" stroke="white" strokeOpacity="0.06" />
      {strands.map((s, i) => (
        <path
          key={s.label}
          d={wavePath(8 + s.weight * 44, 1.5 + (i % 4) * 0.75, i * 1.3)}
          fill="none"
          stroke={`var(--vybe-${s.hue})`}
          strokeOpacity={0.35 + s.weight * 0.55}
          strokeWidth={1.2 + s.weight * 1.6}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
