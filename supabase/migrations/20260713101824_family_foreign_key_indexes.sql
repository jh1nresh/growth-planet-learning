drop index if exists public.child_pin_attempts_child_profile_id_idx;
drop index if exists public.child_sessions_child_profile_id_idx;
drop index if exists public.child_sessions_device_id_idx;

create index child_pin_attempts_device_household_idx
  on public.child_pin_attempts (device_id, household_id);

create index child_pin_attempts_profile_household_idx
  on public.child_pin_attempts (child_profile_id, household_id);

create index child_sessions_device_household_idx
  on public.child_sessions (device_id, household_id);

create index child_sessions_profile_household_idx
  on public.child_sessions (child_profile_id, household_id);
