import { beforeAll, describe, expect, it } from "vitest";
import { as, createDb, type Db } from "./harness";
import { discover, FIVE_INTERESTS, makeMember, OTHER_FIVE, seedTestGeography } from "./members";

let db: Db;
const ids = (rows: { candidate_id: string }[]) => rows.map((r) => r.candidate_id);

beforeAll(async () => {
  db = await createDb();
  await seedTestGeography(db);
});

describe("hard eligibility", () => {
  it("needs 5 non-private interests to appear", async () => {
    const viewer = await makeMember(db);
    const sparse = await makeMember(db, { interests: FIVE_INTERESTS.slice(0, 4) });
    const hiddenOnly = await makeMember(db, { interests: FIVE_INTERESTS.map((i) => ({ ...i, visibility: "private" })) });
    const full = await makeMember(db);
    const seen = ids(await discover(db, viewer));
    expect(seen).toContain(full);
    expect(seen).not.toContain(sparse);
    expect(seen).not.toContain(hiddenOnly);
  });

  it("enforces mutual dating gender preferences", async () => {
    const man = await makeMember(db, { gender: "man", intent: "dating", datingGenders: ["woman"], suburbId: 3 });
    const womanSeekingMen = await makeMember(db, { gender: "woman", intent: "dating", datingGenders: ["man"], suburbId: 3 });
    const womanSeekingWomen = await makeMember(db, { gender: "woman", intent: "dating", datingGenders: ["woman"], suburbId: 3 });
    const manSeekingMen = await makeMember(db, { gender: "man", intent: "dating", datingGenders: ["man"], suburbId: 3 });
    const seen = ids(await discover(db, man));
    expect(seen).toContain(womanSeekingMen);
    expect(seen).not.toContain(womanSeekingWomen);
    expect(seen).not.toContain(manSeekingMen);
    expect(ids(await discover(db, womanSeekingWomen))).not.toContain(man);
  });

  it("keeps dating-only and friendship-only people apart", async () => {
    const dater = await makeMember(db, { gender: "man", intent: "dating", datingGenders: ["woman"], suburbId: 4 });
    const friendOnly = await makeMember(db, { gender: "woman", intent: "friendship", suburbId: 4 });
    const both = await makeMember(db, { gender: "woman", intent: "both", datingGenders: ["man"], suburbId: 4 });
    const seen = await discover(db, dater);
    expect(ids(seen)).not.toContain(friendOnly);
    expect(seen.find((r) => r.candidate_id === both)?.connection_kind).toBe("dating");
  });

  it("enforces age ranges in both directions", async () => {
    const viewer = await makeMember(db, { dob: "1996-01-01", ageMin: 25, ageMax: 35, suburbId: 2 });
    const tooYoung = await makeMember(db, { dob: "2005-01-01", suburbId: 2 });
    const wantsOlder = await makeMember(db, { dob: "1994-01-01", ageMin: 40, ageMax: 60, suburbId: 2 });
    const fits = await makeMember(db, { dob: "1993-01-01", suburbId: 2 });
    const seen = ids(await discover(db, viewer));
    expect(seen).toContain(fits);
    expect(seen).not.toContain(tooYoung);
    expect(seen).not.toContain(wantsOlder);
  });

  it("hides blocked people in both directions", async () => {
    const a = await makeMember(db);
    const b = await makeMember(db);
    expect(ids(await discover(db, a))).toContain(b);
    await as(db, "authenticated", a, (tx) => tx.query("insert into public.blocks (blocker_id, blocked_id) values ($1, $2)", [a, b]));
    expect(ids(await discover(db, a))).not.toContain(b);
    expect(ids(await discover(db, b))).not.toContain(a);
  });

  it("hides paused, undiscoverable, communities-only and suspended members", async () => {
    const viewer = await makeMember(db);
    const paused = await makeMember(db);
    const hidden = await makeMember(db);
    const communities = await makeMember(db, { intent: "communities" });
    const suspended = await makeMember(db);
    await db.query("update public.user_privacy_settings set discovery_paused = true where user_id = $1", [paused]);
    await db.query("update public.user_privacy_settings set discoverable = false where user_id = $1", [hidden]);
    await db.query("update public.profiles set account_status = 'suspended' where id = $1", [suspended]);
    const seen = ids(await discover(db, viewer));
    for (const id of [paused, hidden, communities, suspended]) expect(seen).not.toContain(id);
  });

  it("returns nothing to a viewer who isn't discoverable themselves", async () => {
    const lurker = await makeMember(db, { suburbId: null });
    expect(await discover(db, lurker)).toEqual([]);
  });
});

describe("location privacy", () => {
  it("orders by tier and never distinguishes same-suburb from nearby", async () => {
    const locals: string[] = [];
    for (let i = 0; i < 10; i++) locals.push(await makeMember(db, { suburbId: 1 }));
    const far = await makeMember(db, { suburbId: 4 });
    const rows = await discover(db, locals[0]);
    const tiers = rows.map((r) => r.proximity_tier);
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
    expect(tiers).not.toContain(1);
    expect(rows.find((r) => r.candidate_id === locals[1])?.proximity_tier).toBe(2);
    expect(rows.find((r) => r.candidate_id === far)?.proximity_tier).toBe(4);
  });

  it("coarsens small suburbs to 'nearby' (k-anonymity floor)", async () => {
    const a = await makeMember(db, { suburbId: 3 });
    const b = await makeMember(db, { suburbId: 3 });
    expect((await discover(db, a)).find((r) => r.candidate_id === b)?.proximity_tier).toBe(3);
  });

  it("hide_from_local keeps someone out of local tiers", async () => {
    const viewer = await makeMember(db, { suburbId: 1 });
    const shy = await makeMember(db, { suburbId: 1 });
    await db.query("update public.user_privacy_settings set hide_from_local = true where user_id = $1", [shy]);
    expect((await discover(db, viewer)).find((r) => r.candidate_id === shy)?.proximity_tier).toBe(4);
  });

  it("respects both people's discovery radius and keeps other cities opt-in", async () => {
    const viewer = await makeMember(db, { suburbId: 4 });
    const localOnly = await makeMember(db, { suburbId: 1 });
    const interstate = await makeMember(db, { suburbId: 5 });
    await db.query("insert into public.discovery_preferences (user_id, max_tier) values ($1, 3)", [localOnly]);
    let seen = ids(await discover(db, viewer));
    expect(seen).not.toContain(localOnly);
    expect(seen).not.toContain(interstate);
    await db.query("insert into public.discovery_preferences (user_id, max_tier) values ($1, 5), ($2, 5)", [viewer, interstate]);
    seen = ids(await discover(db, viewer));
    expect(seen).toContain(interstate);
  });

  it("never returns coordinates, distances, suburbs (unless opted in) or raw scores", async () => {
    const viewer = await makeMember(db, { suburbId: 2 });
    const labelled = await makeMember(db, { suburbId: 2 });
    await db.query("update public.user_privacy_settings set show_area_label = true where user_id = $1", [labelled]);
    const rows = await discover(db, viewer);
    for (const r of rows) {
      for (const key of Object.keys(r)) expect(key).not.toMatch(/centroid|distance|lat|lon|score|suburb_id|date_of_birth/);
      if (r.candidate_id !== labelled) expect(r.area_label).toBeNull();
    }
    expect(rows.find((r) => r.candidate_id === labelled)?.area_label).toBe("Nearby Flats");
  });

  it("limits home-suburb changes to 3 per 30 days", async () => {
    const u = await makeMember(db, { suburbId: null });
    const move = (s: number) =>
      as(db, "authenticated", u, (tx) =>
        tx.query(
          `insert into public.user_location_preferences (user_id, suburb_id) values ($1, $2)
           on conflict (user_id) do update set suburb_id = excluded.suburb_id`,
          [u, s],
        ),
      );
    await move(1);
    await move(2);
    await move(3);
    await expect(move(4)).rejects.toThrow(/VYBE_SUBURB_CHANGE_LIMIT/);
  });

  it("members can't read each other's location", async () => {
    const a = await makeMember(db);
    const rows = await as(db, "authenticated", a, async (tx) => (await tx.query("select user_id from public.user_location_preferences")).rows);
    expect(rows).toEqual([{ user_id: a }]);
  });

  it("suburb geometry isn't readable, names are", async () => {
    const a = await makeMember(db);
    await expect(as(db, "authenticated", a, (tx) => tx.query("select centroid from public.suburbs"))).rejects.toThrow(/permission denied/);
    const names = await as(db, "authenticated", a, async (tx) => (await tx.query("select name from public.suburbs where id = 1")).rows);
    expect(names).toEqual([{ name: "Testvale" }]);
  });
});

describe("scoring data", () => {
  it("returns shared public interests but never matching-only or private names", async () => {
    const viewer = await makeMember(db, { suburbId: 3 });
    const other = await makeMember(db, {
      suburbId: 3,
      interests: [
        { option: ["cinema", "genres", "psychological-thriller"], intensity: 3 },
        { option: ["cinema", "film-industries", "korean-films-k-dramas"], visibility: "matching_only" },
        { option: ["music", "genres", "lo-fi"], visibility: "private" },
        { option: ["road-trips", "trip-types", "spontaneous-night-drives"], intensity: 3 },
        { option: ["food", "cuisines", "bengali"] },
        { option: ["gaming", "games", "valorant"] },
      ],
    });
    const row = (await discover(db, viewer)).find((r) => r.candidate_id === other)!;
    const names = row.shared.map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(["Psychological thriller", "Spontaneous night drives", "Bengali"]));
    expect(names).not.toContain("Korean films & K-dramas");
    expect(names).not.toContain("Lo-fi");
    expect(row.shared_hidden_count).toBe(1);
    expect(row.shared_count).toBe(4);
    expect(row.shared[0]).toMatchObject({ love: true });
  });

  it("ranks the stronger interest match first within a tier", async () => {
    for (let i = 0; i < 10; i++) await makeMember(db, { suburbId: 2, interests: OTHER_FIVE });
    const viewer = await makeMember(db, { suburbId: 2 });
    const twin = await makeMember(db, { suburbId: 2 });
    const local = (await discover(db, viewer)).filter((r) => r.proximity_tier === 2).map((r) => r.candidate_id);
    expect(local.indexOf(twin)).toBeLessThan(local.length - 10);
    const strangers = (await discover(db, viewer)).filter((r) => r.proximity_tier === 2 && r.shared_count === 0);
    expect(local.indexOf(twin)).toBeLessThan(local.indexOf(strangers[0].candidate_id));
  });

  it("taste twin mode requires 5+ shared interests", async () => {
    const viewer = await makeMember(db, { suburbId: 4 });
    const twin = await makeMember(db, { suburbId: 4 });
    const partial = await makeMember(db, { suburbId: 4, interests: [...FIVE_INTERESTS.slice(0, 2), ...OTHER_FIVE.slice(0, 3)] });
    const seen = ids(await discover(db, viewer, "taste_twin"));
    expect(seen).toContain(twin);
    expect(seen).not.toContain(partial);
  });

  it("filters by world for Taste Galaxy", async () => {
    const viewer = await makeMember(db, { suburbId: 4 });
    const stranger = await makeMember(db, { suburbId: 4, interests: OTHER_FIVE });
    const cinephile = await makeMember(db, { suburbId: 4 });
    const seen = ids(await discover(db, viewer, "all", "cinema"));
    expect(seen).toContain(cinephile);
    expect(seen).not.toContain(stranger);
  });
});

describe("abuse limits", () => {
  it("rate-limits discovery calls", async () => {
    const u = await makeMember(db);
    await db.query("insert into public.discovery_requests (user_id, mode) select $1, 'all' from generate_series(1, 120)", [u]);
    await expect(discover(db, u)).rejects.toThrow(/VYBE_RATE_LIMITED/);
  });

  it("anon cannot discover", async () => {
    await expect(as(db, "anon", null, (tx) => tx.query("select * from public.discover_candidates()"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("members can't call the internal pool function", async () => {
    const u = await makeMember(db);
    await expect(as(db, "authenticated", u, (tx) => tx.query("select * from public._discovery_pool($1)", [u]))).rejects.toThrow(
      /permission denied/,
    );
  });
});
