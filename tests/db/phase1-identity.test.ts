import { beforeAll, describe, expect, it } from "vitest";
import { adultMetadata, as, createDb, signUp, type Db } from "./harness";

let db: Db;

beforeAll(async () => {
  db = await createDb();
});

function isoDateYearsAgo(years: number, dayOffset = 0) {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

describe("sign-up age gate (auth.users trigger)", () => {
  it("creates profile, preferences and privacy rows for an adult", async () => {
    const id = await signUp(db, adultMetadata());
    const { rows } = await db.query<{ n: number }>(
      `select (select count(*) from public.profiles where id = $1)
            + (select count(*) from public.profile_preferences where user_id = $1)
            + (select count(*) from public.user_privacy_settings where user_id = $1) as n`,
      [id],
    );
    expect(Number(rows[0].n)).toBe(3);
  });

  it("strips date of birth and consent flags from auth metadata", async () => {
    const id = await signUp(db, adultMetadata({ marketing: false }));
    const { rows } = await db.query<{ meta: Record<string, unknown> }>(
      "select raw_user_meta_data as meta from auth.users where id = $1",
      [id],
    );
    expect(rows[0].meta).toEqual({ marketing: false });
  });

  it("keeps date of birth out of metadata when Auth re-writes it after insert", async () => {
    // Supabase Auth updates raw_user_meta_data right after the insert with its in-memory copy.
    const id = await signUp(db, adultMetadata());
    await db.query("update auth.users set raw_user_meta_data = $2 where id = $1", [
      id,
      JSON.stringify({ ...adultMetadata(), email_verified: true }),
    ]);
    const { rows } = await db.query<{ meta: Record<string, unknown> }>(
      "select raw_user_meta_data as meta from auth.users where id = $1",
      [id],
    );
    expect(rows[0].meta).toEqual({ email_verified: true });
  });

  it("rejects someone who turns 18 tomorrow", async () => {
    await expect(signUp(db, adultMetadata({ date_of_birth: isoDateYearsAgo(18, 1) }))).rejects.toThrow(
      /VYBE_UNDER_18/,
    );
  });

  it("accepts someone who turned 18 yesterday", async () => {
    await expect(signUp(db, adultMetadata({ date_of_birth: isoDateYearsAgo(18, -1) }))).resolves.toBeTypeOf(
      "string",
    );
  });

  it("rejects a missing or malformed date of birth", async () => {
    await expect(signUp(db, adultMetadata({ date_of_birth: undefined }))).rejects.toThrow(/VYBE_DOB_REQUIRED/);
    await expect(signUp(db, adultMetadata({ date_of_birth: "not-a-date" }))).rejects.toThrow(/VYBE_INVALID_DOB/);
  });

  it("requires adult attestation and terms acceptance", async () => {
    await expect(signUp(db, adultMetadata({ adult_attested: false }))).rejects.toThrow(/VYBE_CONSENT_REQUIRED/);
    await expect(signUp(db, adultMetadata({ terms_accepted: undefined }))).rejects.toThrow(/VYBE_CONSENT_REQUIRED/);
  });
});

describe("profiles RLS and column grants", () => {
  let alice: string;
  let bob: string;

  beforeAll(async () => {
    alice = await signUp(db, adultMetadata());
    bob = await signUp(db, adultMetadata());
  });

  it("a user sees only their own profile", async () => {
    const rows = await as(db, "authenticated", alice, async (tx) =>
      (await tx.query<{ id: string }>("select id from public.profiles")).rows,
    );
    expect(rows.map((r) => r.id)).toEqual([alice]);
  });

  it("anon cannot read profiles at all", async () => {
    await expect(as(db, "anon", null, (tx) => tx.query("select * from public.profiles"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("a user can set their nickname and gender", async () => {
    const res = await as(db, "authenticated", alice, (tx) =>
      tx.query("update public.profiles set nickname = 'MidnightNomad', gender = 'woman' where id = $1", [alice]),
    );
    expect(res.affectedRows).toBe(1);
  });

  it("nicknames are unique case-insensitively", async () => {
    await expect(
      as(db, "authenticated", bob, (tx) =>
        tx.query("update public.profiles set nickname = 'midnightnomad' where id = $1", [bob]),
      ),
    ).rejects.toThrow(/duplicate key/);
  });

  it("reserved and malformed nicknames are rejected", async () => {
    for (const nickname of ["VybeOfficial", "admin_1", "ab", "1abc", "has space"]) {
      await expect(
        as(db, "authenticated", bob, (tx) => tx.query("update public.profiles set nickname = $2 where id = $1", [bob, nickname])),
      ).rejects.toThrow(/check constraint/);
    }
  });

  it("a user cannot update another user's profile", async () => {
    const res = await as(db, "authenticated", alice, (tx) =>
      tx.query("update public.profiles set gender = 'man' where id = $1", [bob]),
    );
    expect(res.affectedRows).toBe(0);
  });

  it("date of birth, account status and onboarding completion are not user-editable", async () => {
    for (const sql of [
      "update public.profiles set date_of_birth = '2015-01-01' where id = $1",
      "update public.profiles set account_status = 'active' where id = $1",
      "update public.profiles set onboarding_completed_at = now() where id = $1",
    ]) {
      await expect(as(db, "authenticated", alice, (tx) => tx.query(sql, [alice]))).rejects.toThrow(/permission denied/);
    }
  });

  it("users cannot insert or delete profile rows directly", async () => {
    await expect(
      as(db, "authenticated", alice, (tx) => tx.query("delete from public.profiles where id = $1", [alice])),
    ).rejects.toThrow(/permission denied/);
  });

  it("nickname changes are audit-logged and the audit log is not readable by users", async () => {
    const { rows } = await db.query<{ n: number }>(
      "select count(*) as n from public.audit_logs where action = 'profile.nickname_changed' and target_id = $1",
      [alice],
    );
    expect(Number(rows[0].n)).toBe(1);
    await expect(
      as(db, "authenticated", alice, (tx) => tx.query("select * from public.audit_logs")),
    ).rejects.toThrow(/permission denied/);
  });

  it("users cannot grant themselves roles", async () => {
    await expect(
      as(db, "authenticated", alice, (tx) =>
        tx.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [alice]),
      ),
    ).rejects.toThrow(/permission denied/);
    const isAdmin = await as(db, "authenticated", alice, async (tx) =>
      (await tx.query<{ v: boolean }>("select public.has_role('admin') as v")).rows[0].v,
    );
    expect(isAdmin).toBe(false);
  });
});

describe("preferences, languages and onboarding completion", () => {
  let carol: string;
  let dave: string;

  beforeAll(async () => {
    carol = await signUp(db, adultMetadata());
    dave = await signUp(db, adultMetadata());
  });

  it("age range must stay 18+ and ordered", async () => {
    await expect(
      as(db, "authenticated", carol, (tx) =>
        tx.query("update public.profile_preferences set age_min = 16 where user_id = $1", [carol]),
      ),
    ).rejects.toThrow(/check constraint/);
    await expect(
      as(db, "authenticated", carol, (tx) =>
        tx.query("update public.profile_preferences set age_min = 40, age_max = 30 where user_id = $1", [carol]),
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it("a user cannot add languages for someone else", async () => {
    await expect(
      as(db, "authenticated", carol, (tx) =>
        tx.query("insert into public.user_languages (user_id, language_code, proficiency) values ($1, 'bn', 'native')", [dave]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("caps languages at 12", async () => {
    const codes = ["en", "bn", "hi", "ur", "pa", "ne", "ta", "te", "gu", "mr", "ml", "si"];
    await as(db, "authenticated", dave, async (tx) => {
      for (const code of codes) {
        await tx.query("insert into public.user_languages (user_id, language_code, proficiency) values ($1, $2, 'learning')", [dave, code]);
      }
    });
    await expect(
      as(db, "authenticated", dave, (tx) =>
        tx.query("insert into public.user_languages (user_id, language_code, proficiency) values ($1, 'ko', 'learning')", [dave]),
      ),
    ).rejects.toThrow(/up to 12/);
  });

  it("set_my_languages replaces the caller's languages atomically", async () => {
    const codes = await as(db, "authenticated", carol, async (tx) => {
      await tx.query("select public.set_my_languages($1::jsonb, false)", [
        JSON.stringify([{ code: "en", proficiency: "fluent", prefers_chatting: true }]),
      ]);
      await tx.query("select public.set_my_languages($1::jsonb, true)", [
        JSON.stringify([
          { code: "bn", proficiency: "native", prefers_chatting: true },
          { code: "hi", proficiency: "conversational" },
        ]),
      ]);
      return (await tx.query<{ language_code: string }>("select language_code from public.user_languages order by 1")).rows;
    });
    expect(codes.map((c) => c.language_code)).toEqual(["bn", "hi"]);
  });

  it("set_my_languages rolls back entirely on an invalid language", async () => {
    await expect(
      as(db, "authenticated", carol, (tx) =>
        tx.query("select public.set_my_languages($1::jsonb, true)", [
          JSON.stringify([{ code: "en", proficiency: "fluent" }, { code: "zz", proficiency: "fluent" }]),
        ]),
      ),
    ).rejects.toThrow(/foreign key/);
    const { rows } = await db.query<{ language_code: string }>(
      "select language_code from public.user_languages where user_id = $1 order by 1",
      [carol],
    );
    expect(rows.map((r) => r.language_code)).toEqual(["bn", "hi"]);
    await db.query("delete from public.user_languages where user_id = $1", [carol]);
  });

  it("complete_onboarding refuses incomplete profiles", async () => {
    await expect(
      as(db, "authenticated", carol, (tx) => tx.query("select public.complete_onboarding()")),
    ).rejects.toThrow(/VYBE_INCOMPLETE_IDENTITY/);
  });

  it("dating intent requires at least one gender preference", async () => {
    await as(db, "authenticated", carol, async (tx) => {
      await tx.query("update public.profiles set nickname = 'CoastalDrifter', gender = 'man' where id = $1", [carol]);
      await tx.query("update public.profile_preferences set intent = 'dating' where user_id = $1", [carol]);
    });
    await expect(
      as(db, "authenticated", carol, (tx) => tx.query("select public.complete_onboarding()")),
    ).rejects.toThrow(/VYBE_INCOMPLETE_DATING_PREFS/);
  });

  it("completes once every required answer is present", async () => {
    const completed = await as(db, "authenticated", carol, async (tx) => {
      await tx.query("update public.profile_preferences set dating_genders = '{woman}', social_energy = 'introvert', conversation_depth = 'deep' where user_id = $1", [carol]);
      await tx.query("insert into public.user_languages (user_id, language_code, proficiency, prefers_chatting) values ($1, 'bn', 'native', true)", [carol]);
      return (await tx.query<{ c: Date }>("select public.complete_onboarding() as c")).rows[0].c;
    });
    expect(completed).toBeInstanceOf(Date);
  });

  it("anon cannot call complete_onboarding", async () => {
    await expect(as(db, "anon", null, (tx) => tx.query("select public.complete_onboarding()"))).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("account deletion", () => {
  it("deleting the auth user cascades to every profile table", async () => {
    const id = await signUp(db, adultMetadata());
    await db.query("insert into public.user_languages (user_id, language_code, proficiency) values ($1, 'en', 'fluent')", [id]);
    await db.query("delete from auth.users where id = $1", [id]);
    const { rows } = await db.query<{ n: number }>(
      `select (select count(*) from public.profiles where id = $1)
            + (select count(*) from public.profile_preferences where user_id = $1)
            + (select count(*) from public.user_privacy_settings where user_id = $1)
            + (select count(*) from public.user_languages where user_id = $1) as n`,
      [id],
    );
    expect(Number(rows[0].n)).toBe(0);
  });
});
