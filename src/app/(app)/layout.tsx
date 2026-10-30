import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/vybe/logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo href="/universe" />
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" className="h-10">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
