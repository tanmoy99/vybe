"use client";

import { FieldError } from "@/components/vybe/form";
import { cn } from "@/lib/utils";

export type ChoiceOption = { value: string; label: string; description?: string };

/**
 * Card-styled native radio/checkbox group. Native inputs keep keyboard, screen
 * reader and plain FormData behaviour intact.
 */
export function ChoiceGroup({
  type = "radio",
  name,
  legend,
  description,
  options,
  defaultValue,
  errors,
  columns = 2,
  onValueChange,
}: {
  type?: "radio" | "checkbox";
  name: string;
  legend: string;
  description?: string;
  options: ChoiceOption[];
  defaultValue?: string | string[] | null;
  errors?: string[];
  columns?: 1 | 2 | 3;
  onValueChange?: (value: string, checked: boolean) => void;
}) {
  const selected = new Set(Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []);
  const errorId = `${name}-error`;
  const descId = description ? `${name}-desc` : undefined;
  return (
    <fieldset aria-describedby={[descId, errors?.length ? errorId : null].filter(Boolean).join(" ") || undefined}>
      <legend className="font-heading text-base font-semibold">{legend}</legend>
      {description && (
        <p id={descId} className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <div
        className={cn(
          "mt-3 grid gap-2",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "group relative flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors",
              "hover:border-violet/40 has-checked:border-violet has-checked:bg-violet/12 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            )}
          >
            <input
              type={type}
              name={name}
              value={opt.value}
              defaultChecked={selected.has(opt.value)}
              onChange={(e) => onValueChange?.(opt.value, e.currentTarget.checked)}
              className="mt-1 size-4 shrink-0 accent-[var(--vybe-violet)]"
            />
            <span className="min-w-0">
              <span className="block font-medium">{opt.label}</span>
              {opt.description && <span className="mt-0.5 block text-sm text-muted-foreground">{opt.description}</span>}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-2">
        <FieldError id={errorId} errors={errors} />
      </div>
    </fieldset>
  );
}
