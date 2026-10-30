import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  DesktopNav,
  DesktopNavFallback,
  MobileTabBar,
  MobileTabBarFallback,
  type AppNavHref,
} from "@/components/vybe/app-nav";
import { Logo } from "@/components/vybe/logo";
import { BellLink, NotificationBell } from "@/components/vybe/notification-bell";

// Tabs appear here as their pages ship, so navigation never leads to a dead end.
const LIVE_TABS: AppNavHref[] = ["/universe", "/radar", "/connections", "/me"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/universe" />
          <Suspense fallback={<DesktopNavFallback items={LIVE_TABS} />}>
            <DesktopNav items={LIVE_TABS} />
          </Suspense>
          <div className="flex items-center gap-1">
            <Suspense fallback={<BellLink count={0} />}>
              <NotificationBell />
            </Suspense>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="h-10">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-28 sm:px-6 sm:pt-12 md:pb-16">
        {children}
      </main>
      <Suspense fallback={<MobileTabBarFallback items={LIVE_TABS} />}>
        <MobileTabBar items={LIVE_TABS} />
      </Suspense>
    </div>
  );
}
