"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function TextField({
  name,
  label,
  hint,
  errors,
  className,
  ...inputProps
}: { name: string; label: string; hint?: string; errors?: string[] } & ComponentProps<typeof Input>) {
  const id = `field-${name}`;
  const describedBy = [hint && `${id}-hint`, errors?.length && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} aria-invalid={errors?.length ? true : undefined} aria-describedby={describedBy} {...inputProps} />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} errors={errors} />
    </div>
  );
}

/** Shape returned by every form Server Action. */
export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function FormAlert({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        state.ok ? "border-violet/40 bg-violet/10 text-foreground" : "border-destructive/40 bg-destructive/10 text-foreground",
      )}
    >
      {state.message}
    </div>
  );
}

export function SubmitButton({ children, className, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} className={cn("w-full", className)} {...props}>
      {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}
