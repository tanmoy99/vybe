-- VYBE Phase 1: identity, onboarding preferences, languages, privacy settings, roles, audit log.
--
-- Security model:
--   * Every table has RLS enabled. Tables without policies are service-role only.
--   * Users can read/update only their own rows. Cross-user reads will go through
--     SECURITY DEFINER RPCs that return an explicit allow-list of columns (Phase 3+).
--   * Column-level grants stop users editing date_of_birth, account_status, etc.
--   * The 18+ rule is enforced here as well as in the app.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.gender as enum ('woman', 'man', 'non_binary', 'other');
create type public.connection_intent as enum ('dating', 'friendship', 'both', 'communities');
create type public.language_proficiency as enum ('native', 'fluent', 'conversational', 'learning');
create type public.social_energy as enum ('introvert', 'ambivert', 'extrovert');
create type public.conversation_depth as enum ('deep', 'light', 'both');
create type public.planning_style as enum ('spontaneous', 'organised', 'mix');
create type public.chronotype as enum ('morning', 'night', 'flexible');
create type public.message_frequency as enum ('often', 'daily', 'relaxed');
create type public.group_size_pref as enum ('one_on_one', 'small_group', 'large_group', 'any');
create type public.account_status as enum ('active', 'suspended', 'banned');
create type public.app_role as enum ('admin', 'moderator');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.age_in_years(dob date)
returns integer
language sql
stable
set search_path = ''
as $$
  select extract(year from age(current_date, dob))::integer;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user. Owner-only access.
-- ---------------------------------------------------------------------------
create table public.profiles (
  -- Deferred so the BEFORE INSERT trigger on auth.users can create the profile
  -- in the same transaction (see handle_new_user).
  id uuid primary key references auth.users (id) on delete cascade deferrable initially deferred,
  nickname extensions.citext unique,
  date_of_birth date not null,
  gender public.gender,
  gender_self_description text,
  account_status public.account_status not null default 'active',
  onboarding_step smallint not null default 0,
  onboarding_completed_at timestamptz,
  adult_attested_at timestamptz not null,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_nickname_format
    check (nickname is null or nickname::text ~ '^[A-Za-z][A-Za-z0-9_]{2,23}$'),
  constraint profiles_nickname_reserved
    check (nickname is null or nickname::text !~* '^(admin|vybe|moderator|mod|support|official|staff|system)'),
  constraint profiles_gender_description_length
    check (gender_self_description is null or char_length(gender_self_description) between 1 and 40),
  constraint profiles_onboarding_step_range check (onboarding_step between 0 and 20),
  constraint profiles_dob_sane check (date_of_birth > date '1900-01-01')
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profile_preferences: intentions and social style (onboarding).
-- ---------------------------------------------------------------------------
create table public.profile_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  intent public.connection_intent,
  dating_genders public.gender[] not null default '{}',
  age_min smallint not null default 18,
  age_max smallint not null default 99,
  social_energy public.social_energy,
  conversation_depth public.conversation_depth,
  planning_style public.planning_style,
  chronotype public.chronotype,
  message_frequency public.message_frequency,
  group_size public.group_size_pref,
  multilingual_ok boolean not null default true,
  updated_at timestamptz not null default now(),

  constraint profile_preferences_age_bounds check (age_min >= 18 and age_max <= 99 and age_min <= age_max)
);

create trigger profile_preferences_set_updated_at
  before update on public.profile_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- languages (reference data) and user_languages
-- ---------------------------------------------------------------------------
create table public.languages (
  code text primary key check (code ~ '^[a-z]{2,3}$'),
  name text not null,
  native_name text,
  sort_order smallint not null default 100,
  is_active boolean not null default true
);

create table public.user_languages (
  user_id uuid not null references public.profiles (id) on delete cascade,
  language_code text not null references public.languages (code),
  proficiency public.language_proficiency not null,
  prefers_chatting boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, language_code)
);

create function public.enforce_user_language_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.user_languages where user_id = new.user_id) >= 12 then
    raise exception 'You can add up to 12 languages.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger user_languages_limit
  before insert on public.user_languages
  for each row execute function public.enforce_user_language_limit();

-- ---------------------------------------------------------------------------
-- user_privacy_settings
-- ---------------------------------------------------------------------------
create table public.user_privacy_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  discoverable boolean not null default true,
  discovery_paused boolean not null default false,
  hide_from_local boolean not null default false,
  show_area_label boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger user_privacy_settings_set_updated_at
  before update on public.user_privacy_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_roles (service-role managed) and has_role()
-- ---------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete set null,
  primary key (user_id, role)
);

create function public.has_role(required public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = required
  );
$$;

-- ---------------------------------------------------------------------------
-- audit_logs (append-only, service-role read)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null deferrable initially deferred,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs (action, created_at desc);

create function public.audit_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.nickname is distinct from old.nickname then
    insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
    values ((select auth.uid()), 'profile.nickname_changed', 'profile', new.id::text,
            jsonb_build_object('from', old.nickname::text, 'to', new.nickname::text));
  end if;
  if new.account_status is distinct from old.account_status then
    insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
    values ((select auth.uid()), 'profile.status_changed', 'profile', new.id::text,
            jsonb_build_object('from', old.account_status, 'to', new.account_status));
  end if;
  return new;
end;
$$;

create trigger profiles_audit
  after update on public.profiles
  for each row execute function public.audit_profile_changes();

-- ---------------------------------------------------------------------------
-- Sign-up: validate age and create the profile skeleton.
-- The app sends date_of_birth, adult_attested and terms_accepted as sign-up
-- metadata. We validate here (defence in depth), copy them into profiles, and
-- strip date_of_birth from auth metadata so it never travels inside JWTs.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  dob date;
begin
  begin
    dob := (new.raw_user_meta_data ->> 'date_of_birth')::date;
  exception when others then
    raise exception 'VYBE_INVALID_DOB' using errcode = 'invalid_parameter_value';
  end;

  if dob is null then
    raise exception 'VYBE_DOB_REQUIRED' using errcode = 'invalid_parameter_value';
  end if;
  if public.age_in_years(dob) < 18 then
    raise exception 'VYBE_UNDER_18' using errcode = 'invalid_parameter_value';
  end if;
  if coalesce((new.raw_user_meta_data ->> 'adult_attested')::boolean, false) is not true
     or coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false) is not true then
    raise exception 'VYBE_CONSENT_REQUIRED' using errcode = 'invalid_parameter_value';
  end if;

  insert into public.profiles (id, date_of_birth, adult_attested_at, terms_accepted_at)
  values (new.id, dob, now(), now());
  insert into public.profile_preferences (user_id) values (new.id);
  insert into public.user_privacy_settings (user_id) values (new.id);
  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (new.id, 'account.created', 'user', new.id::text);

  new.raw_user_meta_data := new.raw_user_meta_data - 'date_of_birth' - 'adult_attested' - 'terms_accepted';
  return new;
end;
$$;

create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- complete_onboarding(): validates required answers, then marks completion.
-- Users cannot set onboarding_completed_at directly (no column grant).
-- ---------------------------------------------------------------------------
create function public.complete_onboarding()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  p public.profiles;
  pref public.profile_preferences;
  completed timestamptz;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = 'insufficient_privilege';
  end if;

  select * into p from public.profiles where id = uid;
  select * into pref from public.profile_preferences where user_id = uid;

  if p.nickname is null or p.gender is null then
    raise exception 'VYBE_INCOMPLETE_IDENTITY' using errcode = 'check_violation';
  end if;
  if pref.intent is null then
    raise exception 'VYBE_INCOMPLETE_INTENT' using errcode = 'check_violation';
  end if;
  if pref.intent in ('dating', 'both') and cardinality(pref.dating_genders) = 0 then
    raise exception 'VYBE_INCOMPLETE_DATING_PREFS' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.user_languages where user_id = uid) then
    raise exception 'VYBE_INCOMPLETE_LANGUAGES' using errcode = 'check_violation';
  end if;
  if pref.social_energy is null or pref.conversation_depth is null then
    raise exception 'VYBE_INCOMPLETE_ENERGY' using errcode = 'check_violation';
  end if;

  update public.profiles
     set onboarding_completed_at = coalesce(onboarding_completed_at, now())
   where id = uid
  returning onboarding_completed_at into completed;

  return completed;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_my_languages(): atomic replace of the caller's languages.
-- SECURITY INVOKER, so RLS and the 12-language limit still apply.
-- langs: [{"code":"bn","proficiency":"native","prefers_chatting":true}, ...]
-- ---------------------------------------------------------------------------
create function public.set_my_languages(langs jsonb, multilingual boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_typeof(langs) <> 'array' or jsonb_array_length(langs) not between 1 and 12 then
    raise exception 'Add between 1 and 12 languages.' using errcode = 'check_violation';
  end if;

  delete from public.user_languages where user_id = uid;
  insert into public.user_languages (user_id, language_code, proficiency, prefers_chatting)
  select uid, l ->> 'code', (l ->> 'proficiency')::public.language_proficiency,
         coalesce((l ->> 'prefers_chatting')::boolean, false)
    from jsonb_array_elements(langs) as l;

  update public.profile_preferences set multilingual_ok = multilingual where user_id = uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.profile_preferences, public.languages, public.user_languages,
  public.user_privacy_settings, public.user_roles, public.audit_logs from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (nickname, gender, gender_self_description, onboarding_step) on public.profiles to authenticated;

grant select on public.profile_preferences to authenticated;
grant update (intent, dating_genders, age_min, age_max, social_energy, conversation_depth, planning_style,
  chronotype, message_frequency, group_size, multilingual_ok) on public.profile_preferences to authenticated;

grant select on public.languages to authenticated;
grant select, insert, update, delete on public.user_languages to authenticated;

grant select on public.user_privacy_settings to authenticated;
grant update (discoverable, discovery_paused, hide_from_local, show_area_label)
  on public.user_privacy_settings to authenticated;

grant select on public.user_roles to authenticated;

revoke execute on function public.complete_onboarding() from public, anon;
grant execute on function public.complete_onboarding() to authenticated;
revoke execute on function public.set_my_languages(jsonb, boolean) from public, anon;
grant execute on function public.set_my_languages(jsonb, boolean) to authenticated;
revoke execute on function public.has_role(public.app_role) from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.audit_profile_changes() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.languages enable row level security;
alter table public.user_languages enable row level security;
alter table public.user_privacy_settings enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

create policy "Own profile: read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Own profile: update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Own preferences: read" on public.profile_preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Own preferences: update" on public.profile_preferences
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Languages: read active" on public.languages
  for select to authenticated using (is_active);

create policy "Own languages: read" on public.user_languages
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Own languages: insert" on public.user_languages
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Own languages: update" on public.user_languages
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own languages: delete" on public.user_languages
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Own privacy settings: read" on public.user_privacy_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Own privacy settings: update" on public.user_privacy_settings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Own roles: read" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));

-- audit_logs: no policies => service role only.

-- ---------------------------------------------------------------------------
-- Reference data: languages commonly spoken in Sydney (ISO 639 codes).
-- ---------------------------------------------------------------------------
insert into public.languages (code, name, native_name, sort_order) values
  ('en', 'English', 'English', 1),
  ('bn', 'Bengali', 'বাংলা', 2),
  ('hi', 'Hindi', 'हिन्दी', 3),
  ('ur', 'Urdu', 'اردو', 4),
  ('pa', 'Punjabi', 'ਪੰਜਾਬੀ', 5),
  ('ne', 'Nepali', 'नेपाली', 6),
  ('ta', 'Tamil', 'தமிழ்', 7),
  ('te', 'Telugu', 'తెలుగు', 8),
  ('gu', 'Gujarati', 'ગુજરાતી', 9),
  ('mr', 'Marathi', 'मराठी', 10),
  ('ml', 'Malayalam', 'മലയാളം', 11),
  ('si', 'Sinhala', 'සිංහල', 12),
  ('ko', 'Korean', '한국어', 20),
  ('ja', 'Japanese', '日本語', 21),
  ('zh', 'Mandarin', '普通话', 22),
  ('yue', 'Cantonese', '粵語', 23),
  ('vi', 'Vietnamese', 'Tiếng Việt', 24),
  ('th', 'Thai', 'ไทย', 25),
  ('id', 'Indonesian', 'Bahasa Indonesia', 26),
  ('ms', 'Malay', 'Bahasa Melayu', 27),
  ('fil', 'Filipino', 'Filipino', 28),
  ('ar', 'Arabic', 'العربية', 30),
  ('fa', 'Persian', 'فارسی', 31),
  ('tr', 'Turkish', 'Türkçe', 32),
  ('he', 'Hebrew', 'עברית', 33),
  ('es', 'Spanish', 'Español', 40),
  ('pt', 'Portuguese', 'Português', 41),
  ('fr', 'French', 'Français', 42),
  ('it', 'Italian', 'Italiano', 43),
  ('de', 'German', 'Deutsch', 44),
  ('el', 'Greek', 'Ελληνικά', 45),
  ('ru', 'Russian', 'Русский', 46),
  ('pl', 'Polish', 'Polski', 47),
  ('mk', 'Macedonian', 'Македонски', 48),
  ('sr', 'Serbian', 'Српски', 49),
  ('hr', 'Croatian', 'Hrvatski', 50),
  ('sw', 'Swahili', 'Kiswahili', 60),
  ('sm', 'Samoan', 'Gagana Sāmoa', 61),
  ('to', 'Tongan', 'Lea faka-Tonga', 62),
  ('fj', 'Fijian', 'Na Vosa Vakaviti', 63);
