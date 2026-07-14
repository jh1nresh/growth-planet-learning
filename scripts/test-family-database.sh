#!/bin/sh
set -eu

for command_name in initdb pg_ctl createdb psql; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing PostgreSQL command: $command_name" >&2
    exit 1
  fi
done

test_root=$(mktemp -d "${TMPDIR:-/tmp}/oshiami-family-db.XXXXXX")
data_dir="$test_root/data"
socket_dir="$test_root/socket"
mkdir -p "$socket_dir"

cleanup() {
  pg_ctl -D "$data_dir" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$test_root"
}
trap cleanup EXIT INT TERM

initdb -D "$data_dir" --auth=trust --no-locale --encoding=UTF8 >/dev/null
pg_ctl -D "$data_dir" -o "-k $socket_dir -c listen_addresses='' -F" -w start >/dev/null
createdb -h "$socket_dir" oshiami_family_test

psql -h "$socket_dir" -d oshiami_family_test -v ON_ERROR_STOP=1 -q <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create extension if not exists pgcrypto;
SQL

psql -h "$socket_dir" -d oshiami_family_test -v ON_ERROR_STOP=1 -q \
  -f supabase/migrations/20260713083000_family_accounts.sql
psql -h "$socket_dir" -d oshiami_family_test -v ON_ERROR_STOP=1 -q \
  -f supabase/tests/family_accounts.sql

echo "Family database migration tests passed."
