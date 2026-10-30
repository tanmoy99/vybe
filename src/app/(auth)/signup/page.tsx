import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Join the beta" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Create your VYBE</h1>
      <p className="mt-2 mb-6 text-muted-foreground">Anonymous by default. Adults 18+ in Sydney.</p>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-violet underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
