import { z } from "zod";
import { isAdult } from "@/lib/age";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254));

// Mirrors supabase/config.toml: min 10 chars, lower + upper + digit.
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/\d/, "Include a number.");

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.boolean()])
  .optional()
  .transform((v) => v === "on" || v === "true" || v === true);

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth.")
    .refine((v) => isAdult(v), "VYBE is for adults aged 18 and over."),
  adultAttested: checkbox.refine(Boolean, "Please confirm you are 18 or older."),
  termsAccepted: checkbox.refine(Boolean, "Please accept the Terms and Privacy Policy."),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const magicLinkSchema = z.object({ email: emailSchema });

export const updatePasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match.", path: ["confirm"] });

/** Only allow same-origin relative redirects (prevents open redirects). */
export function safeNextPath(next: unknown, fallback = "/universe") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
