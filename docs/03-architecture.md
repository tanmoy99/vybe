# VYBE — Architecture (Vercel + Supabase)

## 1. System overview

```
 Browser (mobile-first Next.js UI, R3F avatar canvas)
   │  HTTPS (Supabase session in httpOnly cookies, managed by @supabase/ssr)
   ▼
 Vercel ── Next.js 16 App Router
   ├─ proxy.ts ............ refreshes the Supabase session; optimistic auth redirects
   ├─ Server Components .... read via the user-scoped Supabase client (RLS enforced)
   ├─ Server Actions ....... all mutations; zod validation; re-check the user every call
   └─ Route handlers ....... auth callbacks, webhooks (avatar/verification providers)
   ▼
 Supabase
   ├─ Auth ................. email+password, magic link; the only identity authority
   ├─ Postgres + PostGIS ... schema `public`; RLS on every table
   │    └─ SECURITY DEFINER RPCs for cross-user reads (discovery, public profile cards)
   ├─ Storage .............. private-photos (owner only), avatar-assets (public-read, published only)
   ├─ Realtime ............. messages and notifications (Postgres changes, gated by RLS)
   └─ Edge Functions/Queues  async jobs (avatar generation, Pulse aggregation), Phase 6+
   ▼
 External (optional, async): avatar generation provider, identity/liveness provider,
                              image malware scanning, error monitoring (Sentry)
```

## 2. Key decisions

| Decision | Rationale |
|---|---|
| **The user-scoped client by default; the service role only in narrowly scoped server modules** (`src/lib/supabase/admin.ts`, marked `server-only`) | RLS stays the primary guard, so a bug in app code can't leak data |
| **Other users' data is read only through `SECURITY DEFINER` RPCs** (e.g. `discover_candidates`, `public_profile_card`) that return an explicit allow-list of columns | Owner-only RLS on `profiles` means nobody can `select *` someone else's DOB, suburb or verification data |
| **Column-level `GRANT UPDATE`** on user-editable columns | Users can't change their DOB, account status or role through the API |
| **The age gate is enforced in three layers**: a form check (zod), the server action, and a DB trigger on `auth.users` insert | Defence in depth; the DB rejects under-18 sign-ups even if the UI is bypassed |
| **Cache Components on, with session reads inside `<Suspense>`** | Static marketing shell from the CDN; authenticated UI streams in |
| **No heavy compute on Vercel** | Avatar generation and verification run on providers or queues; Vercel only orchestrates |
| **SQL migrations in `supabase/migrations`** | Reviewable, reproducible and CI-applied |

## 3. Code layout

```
src/
  app/
    (marketing)/          landing, about, how-it-works, safety, terms, privacy
    (auth)/               login, signup, forgot-password, update-password
    auth/confirm/         email OTP / magic-link verification route
    onboarding/           multi-step onboarding (one segment per step)
    (app)/                authenticated product: universe, radar, worlds, connections, me
    admin/                admin console (role-gated)
  components/
    ui/                   shadcn primitives (themed)
    vybe/                 brand components: OrbitField, GlassPanel, Logo, ...
  lib/
    supabase/             server.ts, client.ts, proxy.ts, admin.ts
    auth/                 DAL: getUser(), requireUser(), requireOnboarded()
    validation/           zod schemas shared by client and server
    matching/             pure, unit-tested scoring + tiering (mirrors the SQL RPC)
supabase/
  migrations/             timestamped SQL
  seed.sql                taxonomy + languages only (no fake people)
tests/
  unit/                   vitest
  db/                     RLS tests (PGlite with an auth shim; real Supabase in CI)
  e2e/                    Playwright
```

## 4. Data model (overview)

The full DDL lives in `supabase/migrations`. Phase 1 tables are implemented; the rest are designed here and built in their phase.

| Domain | Tables | Notes |
|---|---|---|
| Identity | `profiles`, `profile_preferences`, `user_privacy_settings`, `user_roles` | `profiles.id = auth.users.id`, cascade delete. Owner-only RLS |
| Languages | `languages`, `user_languages` | ISO 639-1 codes, proficiency, chat preference |
| Verification | `verification_sessions`, `verification_results` | Provider reference and status only; no documents stored. Owner can read their own status |
| Interests | `interest_categories` → `interest_subcategories` → `interest_options`, `user_interests`, `user_interest_details`, `compatibility_questions`, `user_compatibility_answers` | Admin-editable taxonomy; per-row `visibility` |
| Geography | `suburbs` (PostGIS centroid and boundary), `user_location_preferences`, `discovery_preferences` | Users reference a suburb id and never store raw coordinates |
| Matching | `discovery_requests` (rate-limit log), `connection_requests`, `matches`, `compatibility_explanations` | `matches` row only on mutual acceptance |
| Messaging | `conversations`, `conversation_members`, `messages` | Insert allowed only for members of a conversation backed by an active match |
| Communities | `communities`, `community_members`, `community_posts`, `comments`, `reactions`, `events`, `event_participants` | Moderator roles per community |
| Avatars | `avatar_profiles`, `avatar_assets`, `avatar_generation_jobs`, `private_photo_assets` | Photos in a private bucket; assets published only after approval |
| Safety | `blocks`, `reports`, `moderation_actions`, `audit_logs` | Blocks are symmetric in every read path |
| Notifications | `notifications`, `notification_preferences` | Realtime channel per user |

**Deletion:** every user-owned row cascades from `auth.users` deletion. Exceptions: `reports` and `moderation_actions` keep the reporter/target id set to null, plus an anonymised snapshot, so safety history survives. Storage objects are removed by the account-deletion action before the auth user is deleted.

## 5. Security model

- **RLS everywhere.** Every table in `public` has RLS enabled. Tables with no policy are service-role only (`audit_logs`, `user_roles`).
- **Auth checks.** `proxy.ts` only refreshes sessions and does optimistic redirects. Real checks happen in the DAL (`requireUser`) inside every page and server action.
- **Server actions** validate input with zod, re-derive the user from the session (never from form data) and return typed errors.
- **Rate limiting.** Postgres-backed counters (`discovery_requests`, connection requests per day) to start; Upstash/Vercel KV if needed.
- **Headers.** CSP, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and `Permissions-Policy` (geolocation=self only).
- **Secrets.** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` reach the browser. `SUPABASE_SECRET_KEY` is server-only.

## 6. 3D avatar options (comparison)

| Option | What you get | Photo → avatar | Cost | Risks | Verdict |
|---|---|---|---|---|---|
| **In-house procedural/modular avatar (Three.js + R3F)** | Real 3D meshes composed from parametric parts (head, hair, outfits), glTF export | No (manual customisation) | Engineering only | Art quality depends on us | **MVP choice.** Works offline, no vendor lock-in, honest "real 3D" |
| Modular glTF kits (e.g. CC0 Quaternius/Kenney characters, VRoid/VRM models) | Higher-quality rigged bodies to recolour and accessorise | No | Free (check each licence) | Licence review per asset; file size | **Phase 6 upgrade** for bodies and outfits |
| Avaturn (photo → rigged glTF) | Realistic-leaning 3D avatar from selfies, SDK and API | Yes | Paid per avatar/plan | Biometric processing by a third party, DPA needed | Candidate for the **Realistic** mode |
| Ready Player Me | Stylised avatars, large ecosystem | Partial | — | The public developer service was wound down after its 2025 acquisition; verify status before considering it | Not recommended |
| Image-to-3D generators (Meshy, Tripo, Rodin, Hunyuan3D, etc.) | Static, often unrigged meshes from an image | Yes | Per-generation credits | Unrigged, uncanny faces, heavy meshes | Use for accessories or props, not faces |
| Self-hosted research models (head-reconstruction pipelines) | Highest control | Yes | GPU hosting | Ops burden, licences often non-commercial | Not for MVP |

**Pipeline when a provider is added (async):** the client uploads to the `private-photos` bucket (signed upload URL, size and type limits). A server action creates an `avatar_generation_jobs` row. A queue worker (Supabase Edge Function + Queues, or the provider's webhook) strips EXIF, scans, calls the provider and stores the glTF in `avatar-assets` as *unpublished*. The user previews and approves, then `avatar_profiles.published_asset_id` is set. Source photos are auto-deleted after N days unless the user keeps them.

## 7. Roadmap

| Phase | Deliverables | Safety built in alongside |
|---|---|---|
| **1** (current) | Next.js + Supabase setup, design system, marketing pages, auth, onboarding (identity, intentions, languages, social energy) | 18+ gate (3 layers), owner-only RLS, column grants, audit log |
| 2 | Taxonomy tables + admin CRUD, interest picker, VYBE DNA view, per-interest visibility | Visibility enforced in RPCs |
| 3 | ABS suburb import, home suburb step, `discover_candidates` RPC, Radar (Orbit and list) | Tier thresholds, rate limit, blocks, pause/hide |
| 4 | Communities, posts, comments, reactions, rules, moderation queue | Reports, mod actions, content limits |
| 5 | Connection requests, matches, Realtime chat, Conversation Sparks, unmatch | Consent-gated messaging, message reporting |
| 6 | Avatar Studio (R3F), photo upload infrastructure, provider spike | Private bucket, EXIF strip, deletion |
| 7 | Verification provider, appeals, security testing, pen-test fixes | — |
| 8 | Universe, Taste Galaxy, The Pulse, performance, private beta | Aggregation thresholds |
