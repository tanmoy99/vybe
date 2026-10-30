-- Supabase Auth re-writes raw_user_meta_data after inserting a user (for example
-- to add email_verified), which restored the date of birth that handle_new_user
-- stripped. Strip sign-up-only keys on every write, so DOB never persists in
-- auth metadata or JWTs. profiles.date_of_birth remains the single source.

create function public.strip_signup_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.raw_user_meta_data := new.raw_user_meta_data - 'date_of_birth' - 'adult_attested' - 'terms_accepted';
  return new;
end;
$$;

revoke execute on function public.strip_signup_metadata() from public, anon, authenticated;

create trigger strip_signup_metadata_on_update
  before update on auth.users
  for each row
  when (new.raw_user_meta_data ?| array['date_of_birth', 'adult_attested', 'terms_accepted'])
  execute function public.strip_signup_metadata();

-- Clean any rows written before this fix.
update auth.users
   set raw_user_meta_data = raw_user_meta_data - 'date_of_birth' - 'adult_attested' - 'terms_accepted'
 where raw_user_meta_data ?| array['date_of_birth', 'adult_attested', 'terms_accepted'];
