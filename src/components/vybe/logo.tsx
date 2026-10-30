import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
      <defs>
        <linearGradient id="vybe-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--vybe-violet)" />
          <stop offset="1" stopColor="var(--vybe-indigo)" />
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="16" rx="14" ry="6.5" fill="none" stroke="url(#vybe-mark)" strokeWidth="1.6" transform="rotate(-24 16 16)" />
      <circle cx="16" cy="16" r="5.5" fill="url(#vybe-mark)" />
      <circle cx="27.2" cy="10.6" r="2.2" fill="var(--vybe-blush)" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-lg", className)} aria-label="VYBE home">
      <LogoMark />
      <span className="font-heading text-lg font-semibold tracking-[0.18em]">VYBE</span>
    </Link>
  );
}
