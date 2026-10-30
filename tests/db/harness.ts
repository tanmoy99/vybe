/**
 * In-process Postgres (PGlite) with a minimal Supabase-shaped shim so migrations
 * and RLS policies can be tested without Docker. It mirrors what matters for
 * authorisation: the anon/authenticated/service_role roles, default table
 * grants, auth.users and auth.uid() reading request.jwt.claims.
 *
 * This is not a full Supabase stack. CI should also run these migrations
 * against `supabase start` before release.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { postgis } from "@electric-sql/pglite-postgis";

const SHIM = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema extensions;
  create schema auth;
  grant usage on schema public, extensions, auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

  create table auth.users (
    id uuid primary key,
    email text unique,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create function auth.uid() returns uuid language sql stable as $$
    select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
  $$;
`;

export async function createDb() {
  const db = await PGlite.create({ extensions: { citext, postgis } });
  await db.exec(SHIM);
  const dir = path.join(process.cwd(), "supabase", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }
  return db;
}

export type Db = Awaited<ReturnType<typeof createDb>>;

/** Insert into auth.users exactly as Supabase Auth's sign-up would. */
export async function signUp(db: Db, metadata: Record<string, unknown>) {
  const id = randomUUID();
  await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [
    id,
    `${id}@example.test`,
    JSON.stringify(metadata),
  ]);
  return id;
}

export function adultMetadata(overrides: Record<string, unknown> = {}) {
  return { date_of_birth: "1996-04-12", adult_attested: true, terms_accepted: true, ...overrides };
}

/** Run `fn` inside a transaction as the given Postgres role and (optionally) user. */
export async function as<T>(
  db: Db,
  role: "anon" | "authenticated",
  userId: string | null,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(userId ? { sub: userId, role } : { role }),
    ]);
    await tx.exec(`set local role ${role}`);
    return fn(tx);
  });
}

/** Look up an interest option id by category/subcategory/option slug. */
export async function optionId(db: Db, category: string, subcategory: string, option: string) {
  const { rows } = await db.query<{ id: number }>(
    `select o.id from public.interest_options o
       join public.interest_subcategories s on s.id = o.subcategory_id
       join public.interest_categories c on c.id = s.category_id
      where c.slug = $1 and s.slug = $2 and o.slug = $3`,
    [category, subcategory, option],
  );
  if (!rows[0]) throw new Error(`No option ${category}/${subcategory}/${option}`);
  return rows[0].id;
}

export async function categoryId(db: Db, slug: string) {
  const { rows } = await db.query<{ id: number }>("select id from public.interest_categories where slug = $1", [slug]);
  return rows[0].id;
}
