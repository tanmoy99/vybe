import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-2 mb-6 text-muted-foreground">Step back into your universe.</p>
      {/* useSearchParams() needs a boundary under Cache Components. */}
      <Suspense fallback={<div className="h-72" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to VYBE?{" "}
        <Link href="/signup" className="text-violet underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
