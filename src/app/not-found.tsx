import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AvatarOrb } from "@/components/vybe/avatar-orb";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <AvatarOrb hue="indigo" className="size-16 opacity-80" />
      <h1 className="text-3xl font-semibold">Lost in space</h1>
      <p className="text-muted-foreground">This page drifted out of orbit, or never existed.</p>
      <Button asChild>
        <Link href="/">Back to VYBE</Link>
      </Button>
    </main>
  );
}
