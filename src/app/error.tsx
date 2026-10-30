"use client";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">We hit a snag loading this. It&apos;s not you. Please try again.</p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
