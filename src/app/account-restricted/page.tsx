import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account restricted", robots: { index: false } };

export default function AccountRestrictedPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <ShieldAlert className="size-10 text-blush" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">Your account is restricted</h1>
      <p className="text-muted-foreground">
        Your account has been limited for breaking our community rules. If you think this is a mistake, you can appeal
        through the contact details on our{" "}
        <Link href="/safety" className="text-violet underline underline-offset-4">
          Safety
        </Link>{" "}
        page.
      </p>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}
