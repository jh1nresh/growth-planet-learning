create table public.households (
  id uuid primary key default gen_random_uuid(),
  parent_privy_user_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_parent_privy_user_id_check
    check (char_length(parent_privy_user_id) between 1 and 255)
);

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  alias text not null,
  avatar_id text not null default 'sprout',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_profiles_id_household_unique unique (id, household_id),
  constraint child_profiles_alias_check check (
    alias = btrim(alias)
    and char_length(alias) between 1 and 16
    and alias !~ '[<>[:cntrl:]]'
  ),
  constraint child_profiles_avatar_id_check
    check (avatar_id in ('sprout', 'star', 'moon', 'cloud'))
);

create index child_profiles_household_id_idx
  on public.child_profiles (household_id);

create table public.child_pin_credentials (
  child_profile_id uuid primary key references public.child_profiles(id) on delete cascade,
  pin_hash text not null,
  credential_version integer not null default 1,
  changed_at timestamptz not null default now(),
  constraint child_pin_credentials_hash_check check (
    char_length(pin_hash) between 64 and 255
    and pin_hash like 'scrypt$v1$%'
  ),
  constraint child_pin_credentials_version_check check (credential_version > 0)
);

create table public.approved_devices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint approved_devices_id_household_unique unique (id, household_id),
  constraint approved_devices_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint approved_devices_expiry_check check (expires_at > created_at)
);

create index approved_devices_household_id_idx
  on public.approved_devices (household_id);

create table public.child_pin_attempts (
  household_id uuid not null,
  device_id uuid not null,
  child_profile_id uuid not null,
  attempt_count smallint not null default 0,
  primary key (device_id, child_profile_id),
  constraint child_pin_attempts_device_fkey
    foreign key (device_id, household_id)
    references public.approved_devices(id, household_id) on delete cascade,
  constraint child_pin_attempts_profile_fkey
    foreign key (child_profile_id, household_id)
    references public.child_profiles(id, household_id) on delete cascade,
  constraint child_pin_attempts_count_check check (attempt_count between 0 and 5)
);

create index child_pin_attempts_child_profile_id_idx
  on public.child_pin_attempts (child_profile_id);

create table public.child_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  child_profile_id uuid not null,
  device_id uuid not null,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint child_sessions_profile_fkey
    foreign key (child_profile_id, household_id)
    references public.child_profiles(id, household_id) on delete cascade,
  constraint child_sessions_device_fkey
    foreign key (device_id, household_id)
    references public.approved_devices(id, household_id) on delete cascade,
  constraint child_sessions_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint child_sessions_expiry_check check (expires_at > created_at)
);

create index child_sessions_household_id_idx
  on public.child_sessions (household_id);
create index child_sessions_child_profile_id_idx
  on public.child_sessions (child_profile_id);
create index child_sessions_device_id_idx
  on public.child_sessions (device_id);

create table public.child_progress (
  child_profile_id uuid primary key references public.child_profiles(id) on delete cascade,
  state jsonb not null,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_progress_revision_check check (revision > 0),
  constraint child_progress_state_check check (
    jsonb_typeof(state) = 'object'
    and state ->> 'version' = '4'
    and jsonb_typeof(state -> 'completedMissionIds') = 'array'
    and jsonb_typeof(state -> 'topicStates') = 'array'
    and jsonb_typeof(state -> 'xp') = 'number'
    and octet_length(state::text) <= 262144
  )
);

alter table public.households enable row level security;
alter table public.households force row level security;
alter table public.child_profiles enable row level security;
alter table public.child_profiles force row level security;
alter table public.child_pin_credentials enable row level security;
alter table public.child_pin_credentials force row level security;
alter table public.approved_devices enable row level security;
alter table public.approved_devices force row level security;
alter table public.child_pin_attempts enable row level security;
alter table public.child_pin_attempts force row level security;
alter table public.child_sessions enable row level security;
alter table public.child_sessions force row level security;
alter table public.child_progress enable row level security;
alter table public.child_progress force row level security;

revoke all on table public.households from public, anon, authenticated;
revoke all on table public.child_profiles from public, anon, authenticated;
revoke all on table public.child_pin_credentials from public, anon, authenticated;
revoke all on table public.approved_devices from public, anon, authenticated;
revoke all on table public.child_pin_attempts from public, anon, authenticated;
revoke all on table public.child_sessions from public, anon, authenticated;
revoke all on table public.child_progress from public, anon, authenticated;

grant select, insert on table public.households to service_role;
grant select, delete on table public.child_profiles to service_role;
grant select, insert on table public.approved_devices to service_role;
grant select, delete on table public.child_pin_attempts to service_role;
grant select, update on table public.child_sessions to service_role;
grant select, update on table public.child_progress to service_role;

create or replace function public.oshiami_create_child_profile(
  p_parent_privy_user_id text,
  p_alias text,
  p_avatar_id text,
  p_pin_hash text,
  p_progress jsonb
)
returns table (
  profile_id uuid,
  profile_alias text,
  profile_avatar_id text,
  profile_created_at timestamptz,
  profile_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_profile_id uuid;
begin
  insert into public.households (parent_privy_user_id)
  values (p_parent_privy_user_id)
  on conflict (parent_privy_user_id) do nothing;

  select h.id
  into v_household_id
  from public.households h
  where h.parent_privy_user_id = p_parent_privy_user_id
  for update;

  if (select count(*) from public.child_profiles c where c.household_id = v_household_id) >= 8 then
    raise exception using errcode = 'P0001', message = 'child_profile_limit';
  end if;

  insert into public.child_profiles (household_id, alias, avatar_id)
  values (v_household_id, p_alias, p_avatar_id)
  returning id into v_profile_id;

  insert into public.child_pin_credentials (child_profile_id, pin_hash)
  values (v_profile_id, p_pin_hash);

  insert into public.child_progress (child_profile_id, state)
  values (
    v_profile_id,
    jsonb_set(p_progress, '{childAlias}', to_jsonb(p_alias), true)
  );

  return query
  select c.id, c.alias, c.avatar_id, c.created_at, c.updated_at
  from public.child_profiles c
  where c.id = v_profile_id;
end;
$$;

create or replace function public.oshiami_update_child_profile(
  p_parent_privy_user_id text,
  p_child_profile_id uuid,
  p_alias text,
  p_avatar_id text,
  p_pin_hash text default null
)
returns table (
  profile_id uuid,
  profile_alias text,
  profile_avatar_id text,
  profile_created_at timestamptz,
  profile_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  update public.child_profiles c
  set alias = p_alias,
      avatar_id = p_avatar_id,
      updated_at = now()
  from public.households h
  where c.id = p_child_profile_id
    and h.id = c.household_id
    and h.parent_privy_user_id = p_parent_privy_user_id
  returning c.id into v_profile_id;

  if v_profile_id is null then
    return;
  end if;

  if p_pin_hash is not null then
    update public.child_pin_credentials
    set pin_hash = p_pin_hash,
        credential_version = credential_version + 1,
        changed_at = now()
    where child_profile_id = v_profile_id;

    update public.child_sessions
    set revoked_at = now()
    where child_profile_id = v_profile_id
      and revoked_at is null;

    delete from public.child_pin_attempts
    where child_profile_id = v_profile_id;
  end if;

  update public.child_progress
  set state = jsonb_set(state, '{childAlias}', to_jsonb(p_alias), true),
      updated_at = now()
  where child_profile_id = v_profile_id;

  return query
  select c.id, c.alias, c.avatar_id, c.created_at, c.updated_at
  from public.child_profiles c
  where c.id = v_profile_id;
end;
$$;

create or replace function public.oshiami_reserve_pin_attempt(
  p_device_token_hash text,
  p_child_profile_id uuid
)
returns table (
  allowed boolean,
  pin_hash text,
  credential_version integer,
  device_id uuid,
  household_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device_id uuid;
  v_household_id uuid;
  v_pin_hash text;
  v_credential_version integer;
  v_attempt_count smallint;
begin
  select d.id, d.household_id
  into v_device_id, v_household_id
  from public.approved_devices d
  where d.token_hash = p_device_token_hash
    and d.revoked_at is null
    and d.expires_at > now()
  for update;

  if v_device_id is null then
    return;
  end if;

  select credentials.pin_hash, credentials.credential_version
  into v_pin_hash, v_credential_version
  from public.child_pin_credentials credentials
  join public.child_profiles c on c.id = credentials.child_profile_id
  where c.id = p_child_profile_id
    and c.household_id = v_household_id;

  if v_pin_hash is null then
    return;
  end if;

  insert into public.child_pin_attempts (household_id, device_id, child_profile_id)
  values (v_household_id, v_device_id, p_child_profile_id)
  on conflict on constraint child_pin_attempts_pkey do nothing;

  select attempts.attempt_count
  into v_attempt_count
  from public.child_pin_attempts attempts
  where attempts.device_id = v_device_id
    and attempts.child_profile_id = p_child_profile_id
  for update;

  if v_attempt_count >= 5 then
    update public.approved_devices
    set revoked_at = now()
    where id = v_device_id
      and revoked_at is null;

    allowed := false;
    pin_hash := null;
    credential_version := null;
    device_id := v_device_id;
    household_id := v_household_id;
    return next;
    return;
  end if;

  update public.child_pin_attempts attempts
  set attempt_count = v_attempt_count + 1
  where attempts.device_id = v_device_id
    and attempts.child_profile_id = p_child_profile_id;

  update public.approved_devices
  set last_used_at = now()
  where id = v_device_id;

  allowed := true;
  pin_hash := v_pin_hash;
  credential_version := v_credential_version;
  device_id := v_device_id;
  household_id := v_household_id;
  return next;
end;
$$;

create or replace function public.oshiami_create_child_session(
  p_household_id uuid,
  p_child_profile_id uuid,
  p_device_id uuid,
  p_token_hash text,
  p_expires_at timestamptz,
  p_credential_version integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credential_version integer;
begin
  perform 1
  from public.approved_devices d
  where d.id = p_device_id
    and d.household_id = p_household_id
    and d.revoked_at is null
    and d.expires_at > now()
  for update;

  if not found then
    return false;
  end if;

  select credentials.credential_version
  into v_credential_version
  from public.child_pin_credentials credentials
  join public.child_profiles profile on profile.id = credentials.child_profile_id
  where credentials.child_profile_id = p_child_profile_id
    and profile.household_id = p_household_id
  for update of credentials;

  if v_credential_version is null or v_credential_version <> p_credential_version then
    return false;
  end if;

  update public.child_sessions sessions
  set revoked_at = now()
  where sessions.device_id = p_device_id
    and sessions.revoked_at is null;

  insert into public.child_sessions (
    household_id,
    child_profile_id,
    device_id,
    token_hash,
    expires_at
  ) values (
    p_household_id,
    p_child_profile_id,
    p_device_id,
    p_token_hash,
    p_expires_at
  );

  return true;
end;
$$;

revoke all on function public.oshiami_create_child_profile(text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.oshiami_update_child_profile(text, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.oshiami_reserve_pin_attempt(text, uuid) from public, anon, authenticated;
revoke all on function public.oshiami_create_child_session(uuid, uuid, uuid, text, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.oshiami_create_child_profile(text, text, text, text, jsonb) to service_role;
grant execute on function public.oshiami_update_child_profile(text, uuid, text, text, text) to service_role;
grant execute on function public.oshiami_reserve_pin_attempt(text, uuid) to service_role;
grant execute on function public.oshiami_create_child_session(uuid, uuid, uuid, text, timestamptz, integer) to service_role;
