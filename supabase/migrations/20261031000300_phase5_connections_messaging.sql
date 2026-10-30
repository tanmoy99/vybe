-- VYBE Phase 5: consent-gated connections, matches, private messaging, blocking,
-- reporting and notifications. Nobody can message anyone without an accepted
-- request, and every request re-checks the full discovery eligibility rules.

create type public.connection_status as enum ('pending', 'accepted', 'declined', 'withdrawn');
create type public.report_status as enum ('open', 'reviewing', 'actioned', 'dismissed');

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('dating', 'friendship')),
  note text check (char_length(note) <= 300),
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> recipient_id)
);
create unique index connection_requests_one_pending
  on public.connection_requests (least(sender_id, recipient_id), greatest(sender_id, recipient_id)) where status = 'pending';
create index connection_requests_recipient_idx on public.connection_requests (recipient_id, status, created_at desc);
create index connection_requests_sender_idx on public.connection_requests (sender_id, created_at desc);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('dating', 'friendship')),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check (user_a < user_b)
);
create unique index matches_one_active on public.matches (user_a, user_b) where ended_at is null;
create index matches_user_b_idx on public.matches (user_b);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  hidden_at timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('user', 'message', 'post', 'comment')),
  target_id text,
  reason text not null check (reason in ('harassment', 'hate', 'sexual_content', 'spam_or_scam', 'impersonation',
                                         'underage', 'privacy', 'violence', 'other')),
  details text check (char_length(details) <= 1000),
  -- Copy of the reported content at report time, so evidence survives deletion.
  snapshot jsonb not null default '{}'::jsonb,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolution_note text check (char_length(resolution_note) <= 1000)
);
create index reports_status_idx on public.reports (status, created_at);
create index reports_target_user_idx on public.reports (target_user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text check (link ~ '^/[A-Za-z0-9/_?=&-]*$'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  connection_requests boolean not null default true,
  new_matches boolean not null default true,
  messages boolean not null default true,
  community_activity boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.is_blocked_pair(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.blocks
                  where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create function public.is_conversation_member(conv uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversation_members
                  where conversation_id = conv and user_id = (select auth.uid()));
$$;

-- Active match, both accounts active, no block: the only state in which messages flow.
create function public.can_message(conv uuid, uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
      from public.conversations c
      join public.matches m on m.id = c.match_id and m.ended_at is null
      join public.profiles pa on pa.id = m.user_a and pa.account_status = 'active'
      join public.profiles pb on pb.id = m.user_b and pb.account_status = 'active'
     where c.id = conv
       and uid in (m.user_a, m.user_b)
       and not public.is_blocked_pair(m.user_a, m.user_b)
  );
$$;

-- Caller-only variant used by RLS (can_message itself stays private).
create function public.can_i_message(conv uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.can_message(conv, (select auth.uid()));
$$;

create function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  allowed boolean;
begin
  select case p_kind
           when 'connection_request' then coalesce(np.connection_requests, true)
           when 'match' then coalesce(np.new_matches, true)
           when 'message' then coalesce(np.messages, true)
           when 'community' then coalesce(np.community_activity, true)
           else true end
    into allowed
    from (select 1) x left join public.notification_preferences np on np.user_id = p_user;
  if allowed then
    insert into public.notifications (user_id, kind, title, body, link) values (p_user, p_kind, p_title, p_body, p_link);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Connection requests
-- ---------------------------------------------------------------------------
create function public.send_connection_request(p_recipient uuid, p_kind text default null, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v uuid := (select auth.uid());
  pool_kind text;
  chosen text;
  req uuid;
  reverse_req uuid;
begin
  if v is null then raise exception 'Not authenticated' using errcode = 'insufficient_privilege'; end if;
  if p_note is not null and char_length(p_note) > 300 then
    raise exception 'VYBE_NOTE_TOO_LONG' using errcode = 'check_violation';
  end if;

  if (select count(*) from public.connection_requests where sender_id = v and created_at > now() - interval '1 day') >= 20 then
    raise exception 'VYBE_RATE_LIMITED' using errcode = 'P0001';
  end if;

  -- Full eligibility: the recipient must currently be someone this user could discover.
  select d.connection_kind into pool_kind from public._discovery_pool(v) d where d.candidate_id = p_recipient;
  if pool_kind is null then
    raise exception 'VYBE_CANNOT_REQUEST' using errcode = 'P0001';
  end if;

  chosen := case
    when pool_kind = 'dating_or_friendship' then coalesce(nullif(p_kind, ''), 'friendship')
    else pool_kind end;
  if chosen not in ('dating', 'friendship') or (pool_kind <> 'dating_or_friendship' and chosen <> pool_kind) then
    raise exception 'VYBE_CANNOT_REQUEST' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.matches where user_a = least(v, p_recipient) and user_b = greatest(v, p_recipient) and ended_at is null) then
    raise exception 'VYBE_ALREADY_CONNECTED' using errcode = 'P0001';
  end if;
  -- A recent decline by the recipient is respected silently.
  if exists (select 1 from public.connection_requests
              where sender_id = v and recipient_id = p_recipient and status = 'declined'
                and responded_at > now() - interval '30 days') then
    raise exception 'VYBE_CANNOT_REQUEST' using errcode = 'P0001';
  end if;

  -- They already asked you: mutual interest becomes a match straight away.
  select id into reverse_req from public.connection_requests
   where sender_id = p_recipient and recipient_id = v and status = 'pending';
  if reverse_req is not null then
    perform public._accept_request(reverse_req);
    return reverse_req;
  end if;

  if exists (select 1 from public.connection_requests where sender_id = v and recipient_id = p_recipient and status = 'pending') then
    raise exception 'VYBE_ALREADY_REQUESTED' using errcode = 'P0001';
  end if;

  insert into public.connection_requests (sender_id, recipient_id, kind, note)
  values (v, p_recipient, chosen, nullif(btrim(p_note), ''))
  returning id into req;

  perform public.notify(p_recipient, 'connection_request',
    (select nickname::text from public.profiles where id = v) || ' is interested in connecting',
    case chosen when 'dating' then 'A dating request' else 'A friendship request' end,
    '/connections');
  return req;
end;
$$;

-- Internal: accept a pending request (callers have already authorised).
create function public._accept_request(p_request uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.connection_requests;
  m uuid;
  conv uuid;
begin
  select * into r from public.connection_requests where id = p_request and status = 'pending' for update;
  if r.id is null then raise exception 'VYBE_REQUEST_NOT_FOUND' using errcode = 'P0001'; end if;
  if public.is_blocked_pair(r.sender_id, r.recipient_id) then
    raise exception 'VYBE_CANNOT_REQUEST' using errcode = 'P0001';
  end if;

  update public.connection_requests set status = 'accepted', responded_at = now() where id = r.id;
  insert into public.matches (user_a, user_b, kind)
  values (least(r.sender_id, r.recipient_id), greatest(r.sender_id, r.recipient_id), r.kind)
  returning id into m;
  insert into public.conversations (match_id) values (m) returning id into conv;
  insert into public.conversation_members (conversation_id, user_id) values (conv, r.sender_id), (conv, r.recipient_id);

  perform public.notify(r.sender_id, 'match',
    'You matched with ' || (select nickname::text from public.profiles where id = r.recipient_id),
    'Say hello with a conversation spark.', '/connections/' || conv::text);
  return conv;
end;
$$;

create function public.respond_connection_request(p_request uuid, p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v uuid := (select auth.uid());
begin
  if not exists (select 1 from public.connection_requests where id = p_request and recipient_id = v and status = 'pending') then
    raise exception 'VYBE_REQUEST_NOT_FOUND' using errcode = 'P0001';
  end if;
  if p_accept then
    return public._accept_request(p_request);
  end if;
  update public.connection_requests set status = 'declined', responded_at = now() where id = p_request;
  return null;
end;
$$;

create function public.withdraw_connection_request(p_request uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.connection_requests set status = 'withdrawn', responded_at = now()
   where id = p_request and sender_id = (select auth.uid()) and status = 'pending';
  if not found then raise exception 'VYBE_REQUEST_NOT_FOUND' using errcode = 'P0001'; end if;
end;
$$;

create function public.unmatch(p_conversation uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.matches m set ended_at = now()
    from public.conversations c
   where c.id = p_conversation and m.id = c.match_id and m.ended_at is null
     and (select auth.uid()) in (m.user_a, m.user_b);
  if not found then raise exception 'VYBE_NOT_FOUND' using errcode = 'P0001'; end if;
end;
$$;

-- Block: hides both people from each other everywhere, ends matches and cancels requests.
create function public.block_user(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v uuid := (select auth.uid());
begin
  if v is null or p_user is null or p_user = v then raise exception 'VYBE_INVALID' using errcode = 'P0001'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (v, p_user) on conflict do nothing;
  update public.matches set ended_at = now()
   where user_a = least(v, p_user) and user_b = greatest(v, p_user) and ended_at is null;
  update public.connection_requests set status = 'withdrawn', responded_at = now()
   where status = 'pending' and ((sender_id = v and recipient_id = p_user) or (sender_id = p_user and recipient_id = v));
  insert into public.audit_logs (actor_id, action, target_type, target_id) values (v, 'safety.block', 'profile', p_user::text);
end;
$$;

create function public.unblock_user(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.blocks where blocker_id = (select auth.uid()) and blocked_id = p_user;
$$;

-- Report anything; the content is snapshotted as evidence.
create function public.report_content(p_target_type text, p_target_id text, p_reason text, p_details text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v uuid := (select auth.uid());
  target_user uuid;
  snap jsonb := '{}'::jsonb;
  rid uuid;
begin
  if v is null then raise exception 'Not authenticated' using errcode = 'insufficient_privilege'; end if;
  if (select count(*) from public.reports where reporter_id = v and created_at > now() - interval '1 day') >= 15 then
    raise exception 'VYBE_RATE_LIMITED' using errcode = 'P0001';
  end if;

  if p_target_type = 'user' then
    target_user := p_target_id::uuid;
    select jsonb_build_object('nickname', nickname::text) into snap from public.profiles where id = target_user;
  elsif p_target_type = 'message' then
    select m.sender_id, jsonb_build_object('body', m.body, 'sent_at', m.created_at, 'conversation_id', m.conversation_id)
      into target_user, snap
      from public.messages m where m.id = p_target_id::uuid and public.is_conversation_member(m.conversation_id);
  else
    -- Communities (Phase 4) register their own snapshot logic by overriding this function.
    raise exception 'VYBE_INVALID_TARGET' using errcode = 'P0001';
  end if;
  if target_user is null or target_user = v then raise exception 'VYBE_INVALID_TARGET' using errcode = 'P0001'; end if;

  insert into public.reports (reporter_id, target_user_id, target_type, target_id, reason, details, snapshot)
  values (v, target_user, p_target_type, p_target_id, p_reason, nullif(btrim(p_details), ''), snap)
  returning id into rid;
  insert into public.audit_logs (actor_id, action, target_type, target_id) values (v, 'safety.report', p_target_type, p_target_id);
  return rid;
end;
$$;

-- ---------------------------------------------------------------------------
-- my_connections(): everything the Connections screen needs, public-safe.
-- ---------------------------------------------------------------------------
create function public.my_connections()
returns table (
  kind text,
  request_id uuid,
  conversation_id uuid,
  person_id uuid,
  nickname text,
  connection_type text,
  note text,
  created_at timestamptz,
  last_message text,
  last_message_at timestamptz,
  unread integer
)
language sql
stable
security definer
set search_path = ''
as $$
  -- Incoming pending requests (hidden if either side blocked the other)
  select 'incoming', r.id, null::uuid, r.sender_id, p.nickname::text, r.kind, r.note, r.created_at, null::text, null::timestamptz, 0
    from public.connection_requests r
    join public.profiles p on p.id = r.sender_id and p.account_status = 'active'
   where r.recipient_id = (select auth.uid()) and r.status = 'pending'
     and not public.is_blocked_pair(r.sender_id, r.recipient_id)
  union all
  -- Outgoing pending requests
  select 'outgoing', r.id, null, r.recipient_id, p.nickname::text, r.kind, r.note, r.created_at, null, null, 0
    from public.connection_requests r
    join public.profiles p on p.id = r.recipient_id
   where r.sender_id = (select auth.uid()) and r.status = 'pending'
  union all
  -- Active matches with their conversation
  select 'match', null, c.id, other.id, other.nickname::text, m.kind, null, m.created_at,
         (select left(msg.body, 120) from public.messages msg
           where msg.conversation_id = c.id and msg.hidden_at is null order by msg.created_at desc limit 1),
         c.last_message_at,
         (select count(*)::int from public.messages msg
           where msg.conversation_id = c.id and msg.sender_id <> (select auth.uid()) and msg.hidden_at is null
             and msg.created_at > cm.last_read_at)
    from public.conversation_members cm
    join public.conversations c on c.id = cm.conversation_id
    join public.matches m on m.id = c.match_id and m.ended_at is null
    join public.profiles other on other.id = case when m.user_a = cm.user_id then m.user_b else m.user_a end
   where cm.user_id = (select auth.uid())
     and other.account_status = 'active'
     and not public.is_blocked_pair(m.user_a, m.user_b);
$$;

-- Public-safe info about the other person in a conversation the caller belongs to.
create function public.conversation_peer(p_conversation uuid)
returns table (person_id uuid, nickname text, match_kind text, can_message boolean)
language sql stable security definer set search_path = '' as $$
  select other.id, other.nickname::text, m.kind, public.can_message(c.id, (select auth.uid()))
    from public.conversations c
    join public.matches m on m.id = c.match_id
    join public.profiles other on other.id = case when m.user_a = (select auth.uid()) then m.user_b else m.user_a end
   where c.id = p_conversation and (select auth.uid()) in (m.user_a, m.user_b);
$$;

-- ---------------------------------------------------------------------------
-- Message triggers: rate limit, conversation timestamp, throttled notification
-- ---------------------------------------------------------------------------
create function public.before_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'VYBE_RATE_LIMITED' using errcode = 'P0001';
  end if;
  new.body := btrim(new.body);
  new.created_at := now();
  new.hidden_at := null;
  return new;
end;
$$;

create function public.after_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  recipient uuid;
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  update public.conversation_members set last_read_at = new.created_at
   where conversation_id = new.conversation_id and user_id = new.sender_id;

  select user_id into recipient from public.conversation_members
   where conversation_id = new.conversation_id and user_id <> new.sender_id;
  -- One unread message notification per conversation at a time.
  if recipient is not null and not exists (
       select 1 from public.notifications
        where user_id = recipient and kind = 'message' and read_at is null
          and link = '/connections/' || new.conversation_id::text) then
    perform public.notify(recipient, 'message',
      'New message from ' || (select nickname::text from public.profiles where id = new.sender_id),
      null, '/connections/' || new.conversation_id::text);
  end if;
  return new;
end;
$$;

create trigger messages_before_insert before insert on public.messages
  for each row execute function public.before_message_insert();
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.after_message_insert();

-- ---------------------------------------------------------------------------
-- Discovery must not resurface people you're already connected or pending with.
-- ---------------------------------------------------------------------------
create or replace function public.discover_candidates(
  p_mode text default 'all',
  p_category text default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  candidate_id uuid,
  nickname text,
  age integer,
  intent public.connection_intent,
  connection_kind text,
  proximity_tier smallint,
  area_label text,
  wavelength smallint,
  shared_count integer,
  shared jsonb,
  shared_hidden_count integer,
  shared_languages text[],
  highlights jsonb,
  social_energy public.social_energy,
  conversation_depth public.conversation_depth,
  chronotype public.chronotype,
  planning_style public.planning_style
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v uuid := (select auth.uid());
begin
  if v is null then
    raise exception 'Not authenticated' using errcode = 'insufficient_privilege';
  end if;
  if p_mode not in ('all', 'taste_twin', 'opposite') then
    raise exception 'Unknown discovery mode' using errcode = 'invalid_parameter_value';
  end if;
  if (select count(*) from public.discovery_requests
       where user_id = v and created_at > now() - interval '1 hour') >= 120 then
    raise exception 'VYBE_RATE_LIMITED' using errcode = 'P0001';
  end if;
  insert into public.discovery_requests (user_id, mode) values (v, p_mode);

  p_limit := least(greatest(coalesce(p_limit, 24), 1), 30);
  p_offset := least(greatest(coalesce(p_offset, 0), 0), 300);

  return query
  select d.candidate_id, d.nickname, d.age, d.intent, d.connection_kind, d.proximity_tier, d.area_label,
         (case when d.score >= 0.6 then 3 when d.score >= 0.4 then 2 else 1 end)::smallint,
         d.shared_count, d.shared, d.shared_hidden_count, d.shared_languages, d.highlights,
         d.social_energy, d.conversation_depth, d.chronotype, d.planning_style
    from public._discovery_pool(v) d
   where (p_mode <> 'taste_twin' or d.shared_count >= 5)
     and (p_mode <> 'opposite' or (d.lang_score > 0 and d.shared_count between 1 and 4 and d.comm_score >= 0.7))
     and (p_category is null or exists (
           select 1 from jsonb_array_elements(d.shared) x where x ->> 'category' = p_category))
     and not exists (
           select 1 from public.matches m
            where m.user_a = least(v, d.candidate_id) and m.user_b = greatest(v, d.candidate_id) and m.ended_at is null)
     and not exists (
           select 1 from public.connection_requests r
            where r.status = 'pending'
              and ((r.sender_id = v and r.recipient_id = d.candidate_id) or (r.sender_id = d.candidate_id and r.recipient_id = v)))
   order by
     case when p_mode = 'all' then d.proximity_tier end asc,
     case when p_mode = 'taste_twin' then d.interest_score when p_mode = 'opposite' then d.comm_score end desc nulls last,
     round(d.score, 1) desc,
     md5(v::text || d.candidate_id::text || current_date::text)
   limit p_limit offset p_offset;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges and RLS
-- ---------------------------------------------------------------------------
revoke all on public.connection_requests, public.matches, public.conversations, public.conversation_members,
  public.messages, public.reports, public.notifications, public.notification_preferences from anon, authenticated;

grant select on public.connection_requests, public.matches, public.conversations to authenticated;
grant select on public.conversation_members to authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;
grant select on public.messages to authenticated;
grant insert (conversation_id, sender_id, body) on public.messages to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select, insert on public.notification_preferences to authenticated;
grant update (connection_requests, new_matches, messages, community_activity) on public.notification_preferences to authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'is_blocked_pair(uuid, uuid)', 'can_message(uuid, uuid)', 'notify(uuid, text, text, text, text)',
    '_accept_request(uuid)', 'before_message_insert()', 'after_message_insert()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
  foreach f in array array[
    'is_conversation_member(uuid)', 'can_i_message(uuid)', 'send_connection_request(uuid, text, text)', 'respond_connection_request(uuid, boolean)',
    'withdraw_connection_request(uuid)', 'unmatch(uuid)', 'block_user(uuid)', 'unblock_user(uuid)',
    'report_content(text, text, text, text)', 'my_connections()', 'conversation_peer(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

alter table public.connection_requests enable row level security;
alter table public.matches enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

create policy "Own requests: read" on public.connection_requests for select to authenticated
  using ((select auth.uid()) in (sender_id, recipient_id));
create policy "Own matches: read" on public.matches for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));
create policy "Member conversations: read" on public.conversations for select to authenticated
  using ((select public.is_conversation_member(id)));
create policy "Member rows: read" on public.conversation_members for select to authenticated
  using ((select public.is_conversation_member(conversation_id)));
create policy "Own membership: mark read" on public.conversation_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Members read messages" on public.messages for select to authenticated
  using ((select public.is_conversation_member(conversation_id)) and hidden_at is null);
create policy "Matched members send messages" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.can_i_message(conversation_id));

-- reports: no member policies (insert via report_content, read by moderators via service role / admin RPCs).

create policy "Own notifications: read" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Own notifications: mark read" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Own notification prefs: read" on public.notification_preferences for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Own notification prefs: insert" on public.notification_preferences for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Own notification prefs: update" on public.notification_preferences for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Realtime: RLS above decides who receives each change.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages, public.notifications;
  end if;
end;
$$;
