import { beforeAll, describe, expect, it } from "vitest";
import { adultMetadata, as, categoryId, createDb, optionId, signUp, type Db } from "./harness";

let db: Db;
let user: string;
let other: string;

beforeAll(async () => {
  db = await createDb();
  user = await signUp(db, adultMetadata());
  other = await signUp(db, adultMetadata());
});

const save = (uid: string, cat: number, choices: unknown[], visibility: Record<string, string> = {}, details: unknown[] = []) =>
  as(db, "authenticated", uid, (tx) =>
    tx.query("select public.set_my_category_interests($1::smallint, $2::jsonb, $3::jsonb, $4::jsonb)", [
      cat,
      JSON.stringify(choices),
      JSON.stringify(visibility),
      JSON.stringify(details),
    ]),
  );

describe("interest taxonomy", () => {
  it("seeds the worlds from the brief", async () => {
    const { rows } = await db.query<{ world_name: string }>("select world_name from public.interest_categories order by sort_order");
    expect(rows.map((r) => r.world_name)).toEqual(
      expect.arrayContaining(["Cinema Planet", "Music Galaxy", "Road Trip Island", "Gaming Dimension", "Food Street", "Culture Circle", "Deep Talks Lounge", "Tech Universe"]),
    );
  });

  it("is readable by members but only admins can change it", async () => {
    const n = await as(db, "authenticated", user, async (tx) => (await tx.query("select 1 from public.interest_options")).rows.length);
    expect(n).toBeGreaterThan(100);
    const res = await as(db, "authenticated", user, (tx) => tx.query("update public.interest_categories set name = 'Hacked'"));
    expect(res.affectedRows).toBe(0);
  });

  it("admins can add a category without code changes", async () => {
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [other]);
    await as(db, "authenticated", other, (tx) =>
      tx.query("insert into public.interest_categories (slug, name, world_name) values ('anime', 'Anime', 'Anime Archipelago')"),
    );
    const { rows } = await db.query("select 1 from public.interest_categories where slug = 'anime'");
    expect(rows).toHaveLength(1);
    await db.query("delete from public.user_roles where user_id = $1", [other]);
  });
});

describe("set_my_category_interests", () => {
  it("saves choices with intensity, visibility and free-text details", async () => {
    const cinema = await categoryId(db, "cinema");
    const thriller = await optionId(db, "cinema", "genres", "psychological-thriller");
    const kdrama = await optionId(db, "cinema", "film-industries", "korean-films-k-dramas");
    const { rows: subs } = await db.query<{ id: number; slug: string }>(
      "select s.id, s.slug from public.interest_subcategories s where s.category_id = $1",
      [cinema],
    );
    const genres = subs.find((s) => s.slug === "genres")!.id;
    const favs = subs.find((s) => s.slug === "favourite-films-directors")!.id;

    await save(user, cinema, [{ option_id: thriller, intensity: 3 }, { option_id: kdrama }], { [genres]: "matching_only" }, [
      { subcategory_id: favs, details: "  Memories of Murder  " },
    ]);

    const mine = await as(db, "authenticated", user, async (tx) =>
      (await tx.query<{ option_id: number; intensity: number; visibility: string }>(
        "select option_id, intensity, visibility from public.user_interests order by option_id",
      )).rows,
    );
    expect(mine).toEqual(
      expect.arrayContaining([
        { option_id: thriller, intensity: 3, visibility: "matching_only" },
        { option_id: kdrama, intensity: 2, visibility: "public" },
      ]),
    );
    const { rows: det } = await db.query<{ details: string }>("select details from public.user_interest_details where user_id = $1", [user]);
    expect(det[0].details).toBe("Memories of Murder");
  });

  it("replaces only the chosen category", async () => {
    const music = await categoryId(db, "music");
    const cinema = await categoryId(db, "cinema");
    await save(user, music, [{ option_id: await optionId(db, "music", "genres", "lo-fi") }]);
    await save(user, cinema, [{ option_id: await optionId(db, "cinema", "genres", "horror") }]);
    const { rows } = await db.query<{ slug: string }>(
      `select o.slug from public.user_interests ui join public.interest_options o on o.id = ui.option_id
        where ui.user_id = $1 order by o.slug`,
      [user],
    );
    expect(rows.map((r) => r.slug)).toEqual(["horror", "lo-fi"]);
  });

  it("rejects options from another category", async () => {
    const cinema = await categoryId(db, "cinema");
    await expect(save(user, cinema, [{ option_id: await optionId(db, "music", "genres", "k-pop") }])).rejects.toThrow(
      /VYBE_OPTION_NOT_IN_CATEGORY/,
    );
  });

  it("allows only one answer for single-choice questions", async () => {
    const rt = await categoryId(db, "road-trips");
    await expect(
      save(user, rt, [
        { option_id: await optionId(db, "road-trips", "driver-or-passenger", "driver") },
        { option_id: await optionId(db, "road-trips", "driver-or-passenger", "passenger") },
      ]),
    ).rejects.toThrow(/VYBE_SINGLE_CHOICE/);
  });

  it("dietary preferences default to private", async () => {
    const food = await categoryId(db, "food");
    await save(user, food, [{ option_id: await optionId(db, "food", "dietary-preferences", "halal") }]);
    const { rows } = await db.query<{ visibility: string }>(
      `select ui.visibility from public.user_interests ui join public.interest_options o on o.id = ui.option_id
        where ui.user_id = $1 and o.slug = 'halal'`,
      [user],
    );
    expect(rows[0].visibility).toBe("private");
  });

  it("users cannot read or write each other's interests", async () => {
    const seen = await as(db, "authenticated", other, async (tx) => (await tx.query("select * from public.user_interests")).rows);
    expect(seen).toHaveLength(0);
    await expect(
      as(db, "authenticated", other, (tx) =>
        tx.query("insert into public.user_interests (user_id, option_id) values ($1, 1)", [user]),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});
