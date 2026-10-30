import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/vybe/logo";
import { OnboardingProgress } from "./progress";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-6 sm:px-6">
        <Logo href="/onboarding" />
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm" className="h-10">
            Save &amp; exit
          </Button>
        </form>
      </header>
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-16 sm:px-6">
        <OnboardingProgress />
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
