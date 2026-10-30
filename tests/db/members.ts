import { adultMetadata, as, optionId, signUp, type Db } from "./harness";

type InterestSpec = { option: [string, string, string]; intensity?: number; visibility?: string };

export type MemberOptions = {
  gender?: "woman" | "man" | "non_binary" | "other";
  intent?: "dating" | "friendship" | "both" | "communities";
  datingGenders?: string[];
  ageMin?: number;
  ageMax?: number;
  dob?: string;
  /** null = no home suburb */
  suburbId?: number | null;
  interests?: InterestSpec[];
  languages?: { code: string; proficiency?: string; chat?: boolean }[];
  energy?: Partial<
    Record<"social_energy" | "conversation_depth" | "chronotype" | "planning_style" | "message_frequency" | "group_size", string>
  >;
};

export const FIVE_INTERESTS: InterestSpec[] = [
  { option: ["cinema", "genres", "psychological-thriller"], intensity: 3 },
  { option: ["cinema", "film-industries", "korean-films-k-dramas"] },
  { option: ["music", "genres", "lo-fi"] },
  { option: ["road-trips", "trip-types", "spontaneous-night-drives"], intensity: 3 },
  { option: ["food", "cuisines", "bengali"] },
];

export const OTHER_FIVE: InterestSpec[] = [
  { option: ["tech", "topics", "cybersecurity"] },
  { option: ["tech", "topics", "robotics"] },
  { option: ["books", "what-you-read", "poetry"] },
  { option: ["pets", "favourite-animals", "cats"] },
  { option: ["sports", "sports", "cricket"] },
];

let memberSeq = 0;

/** Create a fully onboarded synthetic member directly (as superuser) for discovery tests. */
export async function makeMember(db: Db, o: MemberOptions = {}) {
  const id = await signUp(db, adultMetadata(o.dob ? { date_of_birth: o.dob } : {}));
  memberSeq += 1;
  await db.query("update public.profiles set nickname = $2, gender = $3 where id = $1", [id, `Member${memberSeq}`, o.gender ?? "woman"]);
  const e = {
    social_energy: "introvert",
    conversation_depth: "deep",
    chronotype: "night",
    planning_style: "spontaneous",
    message_frequency: "daily",
    group_size: "small_group",
    ...o.energy,
  };
  await db.query(
    `update public.profile_preferences set intent = $2, dating_genders = $3::public.gender[], age_min = $4, age_max = $5,
       social_energy = $6, conversation_depth = $7, chronotype = $8, planning_style = $9, message_frequency = $10, group_size = $11
     where user_id = $1`,
    [
      id,
      o.intent ?? "friendship",
      `{${(o.datingGenders ?? []).join(",")}}`,
      o.ageMin ?? 18,
      o.ageMax ?? 99,
      e.social_energy,
      e.conversation_depth,
      e.chronotype,
      e.planning_style,
      e.message_frequency,
      e.group_size,
    ],
  );
  for (const l of o.languages ?? [{ code: "en", proficiency: "fluent", chat: true }]) {
    await db.query(
      "insert into public.user_languages (user_id, language_code, proficiency, prefers_chatting) values ($1, $2, $3, $4)",
      [id, l.code, l.proficiency ?? "fluent", l.chat ?? false],
    );
  }
  for (const i of o.interests ?? FIVE_INTERESTS) {
    await db.query("insert into public.user_interests (user_id, option_id, intensity, visibility) values ($1, $2, $3, $4)", [
      id,
      await optionId(db, ...i.option),
      i.intensity ?? 2,
      i.visibility ?? "public",
    ]);
  }
  if (o.suburbId !== null) {
    await db.query("insert into public.user_location_preferences (user_id, suburb_id) values ($1, $2)", [id, o.suburbId ?? 1]);
  }
  await db.query("update public.profiles set onboarding_completed_at = now() where id = $1", [id]);
  return id;
}

/** Fictional test suburbs with arbitrary coordinates (never real data). */
export async function seedTestGeography(db: Db) {
  await db.exec(`
    insert into public.regions (code, name, boundary, source) values
      ('TEST', 'Test Metro', extensions.st_multi(extensions.st_geomfromtext(
        'POLYGON((150.5 -34.3, 151.6 -34.3, 151.6 -33.5, 150.5 -33.5, 150.5 -34.3))', 4326))::extensions.geography, 'test');
    insert into public.suburbs (id, sal_code, name, state, centroid, region_code) values
      (1, 'T0001', 'Testvale', 'NSW', extensions.st_setsrid(extensions.st_point(151.000, -33.900), 4326)::extensions.geography, 'TEST'),
      (2, 'T0002', 'Nearby Flats', 'NSW', extensions.st_setsrid(extensions.st_point(151.030, -33.900), 4326)::extensions.geography, 'TEST'),
      (3, 'T0003', 'Middle Ridge', 'NSW', extensions.st_setsrid(extensions.st_point(151.100, -33.900), 4326)::extensions.geography, 'TEST'),
      (4, 'T0004', 'Outer Bay', 'NSW', extensions.st_setsrid(extensions.st_point(151.400, -33.900), 4326)::extensions.geography, 'TEST'),
      (5, 'T0005', 'Far North', 'QLD', extensions.st_setsrid(extensions.st_point(153.000, -27.500), 4326)::extensions.geography, null);
  `);
}

export type DiscoveryRow = {
  candidate_id: string;
  proximity_tier: number;
  connection_kind: string;
  area_label: string | null;
  shared: { name: string; love: boolean; category: string }[];
  shared_count: number;
  shared_hidden_count: number;
} & Record<string, unknown>;

export async function discover(db: Db, uid: string, mode = "all", category: string | null = null, limit = 30) {
  return as(db, "authenticated", uid, async (tx) =>
    (await tx.query<DiscoveryRow>("select * from public.discover_candidates($1, $2, $3, 0)", [mode, category, limit])).rows,
  );
}
