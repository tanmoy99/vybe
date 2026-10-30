"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, MessageCircle, Orbit, Radar, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export const APP_NAV = [
  { href: "/universe", label: "Universe", icon: Orbit },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/worlds", label: "Worlds", icon: Globe2 },
  { href: "/connections", label: "Connections", icon: MessageCircle },
  { href: "/me", label: "My VYBE", icon: UserRound },
] as const;

export type AppNavHref = (typeof APP_NAV)[number]["href"];
type Props = { items: readonly AppNavHref[]; badges?: Partial<Record<AppNavHref, number>> };
type IsActive = (href: string) => boolean;

function usePathActive(): IsActive {
  const pathname = usePathname();
  return (href) => pathname === href || pathname.startsWith(`${href}/`);
}

const never: IsActive = () => false;

function DesktopList({ items, isActive }: Props & { isActive: IsActive }) {
  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {APP_NAV.filter((i) => items.includes(i.href)).map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
                isActive(href) && "bg-violet/12 text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileList({ items, badges = {}, isActive }: Props & { isActive: IsActive }) {
  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg justify-around">
        {APP_NAV.filter((i) => items.includes(i.href)).map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const badge = badges[href];
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground",
                  active && "text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-5", active && "text-violet")} aria-hidden="true" />
                  {badge ? (
                    <span className="absolute -top-1 -right-2 min-w-4 rounded-full bg-blush px-1 text-center text-[10px] leading-4 font-semibold text-background">
                      {badge > 9 ? "9+" : badge}
                      <span className="sr-only"> new</span>
                    </span>
                  ) : null}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Top navigation for tablets and desktops. Wrap in <Suspense> with DesktopNavFallback. */
export function DesktopNav(props: Props) {
  return <DesktopList {...props} isActive={usePathActive()} />;
}
export function DesktopNavFallback(props: Props) {
  return <DesktopList {...props} isActive={never} />;
}

/** Bottom tab bar for phones. Wrap in <Suspense> with MobileTabBarFallback. */
export function MobileTabBar(props: Props) {
  return <MobileList {...props} isActive={usePathActive()} />;
}
export function MobileTabBarFallback(props: Props) {
  return <MobileList {...props} isActive={never} />;
}
