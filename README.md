# VYBE

> Find someone on your wavelength. Anonymous, interest-first friendship, dating and community for adults in Sydney.

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Auth, Postgres, RLS) · Vercel.

**Live:** https://vybe-dusky-nine.vercel.app (Vercel project `vybe`; Supabase project `vybe`, ref `qldnfzmukmrsupsfojhj`, Sydney). Pushes to `master` deploy to production.

> **Before inviting testers, configure custom SMTP** (Supabase → Authentication → Emails → SMTP; e.g. Resend). Supabase's built-in mailer only delivers to members of your Supabase org and is heavily rate-limited, so real people won't receive confirmation emails until this is set up. Once SMTP is configured, uncomment the template blocks at the end of `supabase/config.toml` and run `npx supabase config push`. The custom templates use cross-device `token_hash` links.

## Status: Phase 1

| Area | State |
|---|---|
| Planning docs (PRD, UI concepts, architecture, matching, location privacy, avatar options, roadmap) | `docs/` |
| Design system (VYBE dark theme, glass panels, orbit motif, reduced-motion and low-power fallbacks) | Done |
| Public pages: landing, about, how it works, safety, privacy (draft), terms (draft) | Done |
| Auth: sign up with an 18+ gate, email confirmation, password and magic-link login, reset, sign out | Done (needs a Supabase project to run end to end) |
| Onboarding: identity → intentions → languages → social energy → Universe | Done |
| Database: Phase 1 migration with RLS, column grants, sign-up age trigger, audit log | Done |
| Interests/VYBE DNA, suburbs and Radar, communities, matching, chat, avatars, admin | Not started (see `docs/03-architecture.md` §7) |

## Local development

```bash
npm install
cp .env.example .env.local      # fill in your Supabase URL and publishable key
npm run dev
```

### Supabase

**Option A: hosted project (no Docker needed)**
1. Create a project at supabase.com (choose the Sydney region, `ap-southeast-2`).
2. Link it and push the migrations:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push
   npm run db:types              # regenerate src/lib/supabase/database.types.ts
   ```
3. In the dashboard, open **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` for dev, or your production domain.
   - Redirect URLs: `http://localhost:3000/**` and `https://*-<team>.vercel.app/**` (for Vercel previews).
4. In **Authentication → Email Templates**, paste the templates from `supabase/templates/`. They use `token_hash` links, which work across devices.
5. In **Authentication → Providers → Email**, enable "Confirm email". Set a minimum password length of 10, requiring lower and upper case letters and digits.
6. Set up custom SMTP (for example Resend or Postmark) before inviting testers. Supabase's built-in mailer is heavily rate-limited.

**Option B: local stack.** Needs Docker: run `npx supabase start`, then `npm run db:types:local`. `supabase/config.toml` already mirrors the settings above.

## Tests

```bash
npm run test          # unit + database tests (vitest)
npm run test:db       # migrations + RLS against in-process Postgres (PGlite + a Supabase auth shim)
npx playwright test   # e2e: production build, Pixel 7 + desktop
npm run typecheck && npm run lint
```

The database tests apply the real migrations to PGlite with a minimal shim of Supabase's roles and `auth` schema. They verify the policies without Docker, but they don't replace testing against real Supabase. CI should also run `supabase db reset` against a local stack.

## Deploying to Vercel

1. Push to GitHub, then import the repo in Vercel. It detects Next.js automatically.
2. Add the environment variables per environment:

   | Variable | Production | Preview | Notes |
   |---|---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | prod project | staging project | Public |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | prod | staging | Public; RLS protects the data |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain` | leave unset (falls back to localhost; set per branch if you test email links) | Used in email redirect links |
   | `SUPABASE_SECRET_KEY` | later phases | later phases | **Server only.** Never `NEXT_PUBLIC_` |

3. **Environment separation:** use two Supabase projects (`vybe-staging` for previews, `vybe-prod` for production). Run `supabase db push` against staging first.
4. Add your production domain to the Supabase Site URL and Redirect URLs.

**Troubleshooting**
- Email links land on `/login?error=link`: the link expired or was already used, or the redirect URL isn't allow-listed in Supabase.
- Sign-up fails with a generic error: check Postgres logs for `VYBE_UNDER_18`, `VYBE_DOB_REQUIRED` or `VYBE_CONSENT_REQUIRED`, which are raised by the `handle_new_user` trigger.
- Build error "uncached data outside `<Suspense>`": with Cache Components, anything that reads cookies (including Supabase) must sit inside a Suspense boundary.

**Rough costs at beta scale:** Vercel Hobby or Pro ($0–20 USD/month), Supabase Free or Pro ($0–25 USD/month), and transactional email (free tiers suffice for a beta). Later phases add avatar generation (per-avatar provider fees) and identity verification (roughly $1–3 per check, depending on provider). Treat these figures as estimates and confirm each provider's current pricing.

## Security notes
- Every table has RLS. Users can read and update only their own rows, and sensitive columns (DOB, account status, onboarding completion) aren't user-writable.
- The 18+ rule is enforced in the form, the server action and a database trigger. The DOB is stripped from auth metadata so it never appears in JWTs.
- Date of birth is self-declared. Real age assurance (a verification provider) is planned for Phase 7.
- Security headers (CSP, frame denial, HSTS) are set in `next.config.ts`. The CSP still allows inline scripts, and a nonce-based CSP is a follow-up.
- This is not yet production-ready. A security review, legal review (Privacy Act, Online Safety Act, the online dating industry code) and pen-testing are required before public launch.
