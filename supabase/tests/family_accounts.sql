begin;
set local role service_role;

do $$
declare
  v_parent_id constant text := 'did:privy:test-parent';
  v_household_id uuid;
  v_profile_id uuid;
  v_device_one uuid;
  v_device_two uuid;
  v_allowed boolean;
  v_created boolean;
  v_credential_version integer;
  v_attempt integer;
  v_count integer;
  v_pin_hash constant text := 'scrypt$v1$16384$8$1$' || repeat('a', 80);
  v_new_pin_hash constant text := 'scrypt$v1$16384$8$1$' || repeat('b', 80);
  v_progress constant jsonb := '{"version":4,"childAlias":"小星","completedMissionIds":[],"topicStates":[],"xp":0,"updatedAt":"2026-07-13T00:00:00.000Z"}'::jsonb;
begin
  insert into public.households (parent_privy_user_id)
  values (v_parent_id)
  returning id into v_household_id;

  select profile_id
  into v_profile_id
  from public.oshiami_create_child_profile(v_parent_id, '小星', 'star', v_pin_hash, v_progress);

  insert into public.approved_devices (household_id, token_hash, expires_at)
  values (v_household_id, repeat('a', 64), now() + interval '30 days')
  returning id into v_device_one;

  for v_attempt in 1..5 loop
    select attempt.allowed
    into v_allowed
    from public.oshiami_reserve_pin_attempt(repeat('a', 64), v_profile_id) attempt;
    if v_allowed is distinct from true then
      raise exception 'PIN attempt % should be allowed', v_attempt;
    end if;
  end loop;

  select attempt.allowed
  into v_allowed
  from public.oshiami_reserve_pin_attempt(repeat('a', 64), v_profile_id) attempt;
  if v_allowed is distinct from false then
    raise exception 'sixth PIN attempt should require parent reapproval';
  end if;

  select public.oshiami_create_child_session(
    v_household_id,
    v_profile_id,
    v_device_one,
    repeat('1', 64),
    now() + interval '12 hours',
    1
  ) into v_created;
  if v_created is distinct from false then
    raise exception 'revoked device created a child session';
  end if;

  insert into public.approved_devices (household_id, token_hash, expires_at)
  values (v_household_id, repeat('b', 64), now() + interval '30 days')
  returning id into v_device_two;

  select attempt.allowed, attempt.credential_version
  into v_allowed, v_credential_version
  from public.oshiami_reserve_pin_attempt(repeat('b', 64), v_profile_id) attempt;
  if v_allowed is distinct from true or v_credential_version <> 1 then
    raise exception 'new approved device could not reserve the initial credential';
  end if;

  select public.oshiami_create_child_session(
    v_household_id,
    v_profile_id,
    v_device_two,
    repeat('2', 64),
    now() + interval '12 hours',
    v_credential_version
  ) into v_created;
  if v_created is distinct from true then
    raise exception 'valid credential did not create a child session';
  end if;

  perform public.oshiami_update_child_profile(v_parent_id, v_profile_id, '小星', 'moon', v_new_pin_hash);

  select count(*)
  into v_count
  from public.child_sessions
  where child_profile_id = v_profile_id
    and revoked_at is null;
  if v_count <> 0 then
    raise exception 'PIN rotation did not revoke existing sessions';
  end if;

  select public.oshiami_create_child_session(
    v_household_id,
    v_profile_id,
    v_device_two,
    repeat('3', 64),
    now() + interval '12 hours',
    v_credential_version
  ) into v_created;
  if v_created is distinct from false then
    raise exception 'stale credential version created a child session';
  end if;

  select attempt.allowed, attempt.credential_version
  into v_allowed, v_credential_version
  from public.oshiami_reserve_pin_attempt(repeat('b', 64), v_profile_id) attempt;
  if v_allowed is distinct from true or v_credential_version <> 2 then
    raise exception 'rotated credential version was not returned';
  end if;

  select public.oshiami_create_child_session(
    v_household_id,
    v_profile_id,
    v_device_two,
    repeat('4', 64),
    now() + interval '12 hours',
    v_credential_version
  ) into v_created;
  if v_created is distinct from true then
    raise exception 'rotated credential did not create a child session';
  end if;

  update public.child_progress
  set revision = revision + 1
  where child_profile_id = v_profile_id;
  if not found then
    raise exception 'service_role could not update child progress';
  end if;

  update public.child_sessions
  set revoked_at = now()
  where child_profile_id = v_profile_id
    and revoked_at is null;
  if not found then
    raise exception 'service_role could not revoke a child session';
  end if;

  delete from public.child_pin_attempts
  where child_profile_id = v_profile_id;

  delete from public.child_profiles
  where id = v_profile_id;
  if not found then
    raise exception 'service_role could not delete a child profile';
  end if;

  select count(*) into v_count from public.child_progress where child_profile_id = v_profile_id;
  if v_count <> 0 then
    raise exception 'child deletion did not cascade progress';
  end if;
end;
$$;

rollback;
