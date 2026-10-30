import { describe, expect, it } from "vitest";
import { ageInYears, isAdult } from "@/lib/age";
import { safeNextPath, signUpSchema } from "@/lib/validation/auth";
import { identitySchema, intentionsSchema, languagesSchema, nicknameSchema } from "@/lib/validation/onboarding";

const today = new Date(Date.UTC(2026, 9, 30)); // 2026-10-30

describe("ageInYears", () => {
  it("counts whole years and respects birthdays", () => {
    expect(ageInYears("2008-10-30", today)).toBe(18);
    expect(ageInYears("2008-10-31", today)).toBe(17);
    expect(ageInYears("1990-01-01", today)).toBe(36);
  });

  it("handles 29 February birthdays", () => {
    expect(ageInYears("2008-02-29", new Date(Date.UTC(2026, 1, 28)))).toBe(17);
    expect(ageInYears("2008-02-29", new Date(Date.UTC(2026, 2, 1)))).toBe(18);
  });

  it("rejects invalid, rolled-over and future dates", () => {
    expect(ageInYears("2001-02-30", today)).toBeNull();
    expect(ageInYears("30/10/2001", today)).toBeNull();
    expect(ageInYears("2030-01-01", today)).toBeNull();
  });

  it("isAdult enforces 18 to 120", () => {
    expect(isAdult("2008-10-30", today)).toBe(true);
    expect(isAdult("2008-10-31", today)).toBe(false);
    expect(isAdult("1890-01-01", today)).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    email: "  Person@Example.com ",
    password: "Wavelength2026",
    dateOfBirth: "1996-04-12",
    adultAttested: "on",
    termsAccepted: "on",
  };

  it("accepts a valid adult and normalises email", () => {
    const r = signUpSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data?.email).toBe("person@example.com");
  });

  it("rejects under-18 users, weak passwords and missing consent", () => {
    const year = new Date().getUTCFullYear() - 16;
    expect(signUpSchema.safeParse({ ...valid, dateOfBirth: `${year}-01-01` }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: "password" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, adultAttested: undefined }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, termsAccepted: undefined }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows same-origin paths and blocks open redirects", () => {
    expect(safeNextPath("/onboarding")).toBe("/onboarding");
    expect(safeNextPath("https://evil.example")).toBe("/universe");
    expect(safeNextPath("//evil.example")).toBe("/universe");
    expect(safeNextPath("/\\evil.example")).toBe("/universe");
    expect(safeNextPath(undefined, "/x")).toBe("/x");
  });
});

describe("onboarding schemas", () => {
  it("nickname rules mirror the database constraint", () => {
    expect(nicknameSchema.safeParse("MidnightNomad").success).toBe(true);
    for (const bad of ["ab", "1abc", "has space", "VybeTeam", "admin", "a".repeat(25)]) {
      expect(nicknameSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("only keeps a self-description when gender is 'other'", () => {
    expect(identitySchema.parse({ nickname: "Nova_1", gender: "woman", genderSelfDescription: "x" }).genderSelfDescription).toBeNull();
    expect(identitySchema.parse({ nickname: "Nova_1", gender: "other", genderSelfDescription: "Genderfluid" }).genderSelfDescription).toBe("Genderfluid");
  });

  it("dating intent requires dating genders; friendship clears them", () => {
    expect(intentionsSchema.safeParse({ intent: "dating", datingGenders: [], ageMin: 20, ageMax: 30 }).success).toBe(false);
    const friends = intentionsSchema.parse({ intent: "friendship", datingGenders: ["woman"], ageMin: 20, ageMax: 30 });
    expect(friends.datingGenders).toEqual([]);
  });

  it("age range must be 18+ and ordered", () => {
    expect(intentionsSchema.safeParse({ intent: "friendship", ageMin: 17, ageMax: 30 }).success).toBe(false);
    expect(intentionsSchema.safeParse({ intent: "friendship", ageMin: 40, ageMax: 30 }).success).toBe(false);
  });

  it("languages must be unique, 1 to 12", () => {
    const en = { code: "en", proficiency: "fluent", prefersChatting: true } as const;
    expect(languagesSchema.safeParse({ languages: [en], multilingualOk: true }).success).toBe(true);
    expect(languagesSchema.safeParse({ languages: [], multilingualOk: true }).success).toBe(false);
    expect(languagesSchema.safeParse({ languages: [en, en], multilingualOk: true }).success).toBe(false);
  });
});
