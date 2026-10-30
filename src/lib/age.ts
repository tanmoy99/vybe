export const MINIMUM_AGE = 18;

/**
 * Whole years between an ISO date of birth (YYYY-MM-DD) and `today`, in UTC to
 * match the database check (Supabase Postgres runs in UTC). Returns null for
 * invalid or future dates.
 */
export function ageInYears(dobIso: string, today: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobIso);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const dob = new Date(Date.UTC(y, m - 1, d));
  // Reject rollovers such as 2001-02-30.
  if (dob.getUTCFullYear() !== y || dob.getUTCMonth() !== m - 1 || dob.getUTCDate() !== d) return null;
  if (dob.getTime() > today.getTime()) return null;

  let age = today.getUTCFullYear() - y;
  const beforeBirthday =
    today.getUTCMonth() < m - 1 || (today.getUTCMonth() === m - 1 && today.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function isAdult(dobIso: string, today: Date = new Date()) {
  const age = ageInYears(dobIso, today);
  return age !== null && age >= MINIMUM_AGE && age <= 120;
}
