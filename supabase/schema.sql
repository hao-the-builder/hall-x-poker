-- ============================================================================
-- Hall X Poker — Supabase schema
-- Paste the whole file into Supabase Dashboard > SQL Editor > New query > Run.
-- Safe to re-run: every statement is idempotent (create or replace / if not exists).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Only @connect.ust.hk addresses may register (enforced at the auth layer,
--    so it cannot be bypassed by calling the API directly).
-- ----------------------------------------------------------------------------
create or replace function public.enforce_ust_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or new.email !~* '^[a-z0-9._%+\-]+@connect\.ust\.hk$' then
    raise exception 'Only @connect.ust.hk email addresses can register.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_ust_email on auth.users;
create trigger enforce_ust_email
  before insert or update of email on auth.users
  for each row execute function public.enforce_ust_email();

-- ----------------------------------------------------------------------------
-- 2. Profiles (one per auth user, created automatically)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 2 and 32)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  name text;
begin
  name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  if name is null then
    name := split_part(new.email, '@', 1);
  end if;
  name := left(name, 32);
  if char_length(name) < 2 then
    name := 'Player';
  end if;
  insert into public.profiles (id, display_name, email)
  values (new.id, name, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their display name, nothing else.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;
  new.display_name := left(trim(new.display_name), 32);
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ----------------------------------------------------------------------------
-- 3. Tournaments and seats
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tournament_status') then
    create type public.tournament_status as enum ('open', 'completed');
  end if;
end
$$;

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  host_id uuid not null references public.profiles (id) on delete cascade,
  scheduled_at timestamptz not null default now(),
  max_players integer not null default 9,
  status public.tournament_status not null default 'open',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint tournaments_name_length check (char_length(name) between 2 and 60),
  constraint tournaments_max_players_range check (max_players between 2 and 9)
);

create table if not exists public.tournament_players (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  rank integer,
  points integer,
  primary key (tournament_id, user_id),
  constraint tournament_players_rank_range check (rank is null or rank between 1 and 9),
  constraint tournament_players_points_range check (points is null or points between 1 and 9),
  constraint tournament_players_rank_unique unique (tournament_id, rank)
);

create index if not exists tournament_players_user_idx on public.tournament_players (user_id);
create index if not exists tournaments_status_idx on public.tournaments (status, scheduled_at desc);

-- ----------------------------------------------------------------------------
-- 4. Rating: average points per match, and a letter tier
--
--   Points: 1st = 9, 2nd = 8, ... 9th = 1, regardless of field size.
--   avg_points = total_points / matches        (1.00 to 9.00)
--   tier:  S >= 7.5 | A >= 6.5 | B >= 5.5 | C >= 4.5 | D >= 3.5 | E below
--   provisional = fewer than 3 completed matches (tier shown, but flagged)
--   Players with no completed matches are unrated (null).
-- ----------------------------------------------------------------------------
create or replace function public.compute_average(matches integer, total_points integer)
returns numeric
language sql
immutable
as $$
  select case
    when matches is null or matches <= 0 then null
    else round(total_points::numeric / matches, 2)
  end
$$;

create or replace function public.rating_tier(avg_points numeric)
returns text
language sql
immutable
as $$
  select case
    when avg_points is null then null
    when avg_points >= 7.5 then 'S'
    when avg_points >= 6.5 then 'A'
    when avg_points >= 5.5 then 'B'
    when avg_points >= 4.5 then 'C'
    when avg_points >= 3.5 then 'D'
    else 'E'
  end
$$;

-- ----------------------------------------------------------------------------
-- 5. Leaderboard view
-- ----------------------------------------------------------------------------
create or replace view public.leaderboard
with (security_invoker = true)
as
with stats as (
  select
    p.id,
    p.display_name,
    count(tp.tournament_id) filter (where t.status = 'completed')::integer as matches,
    coalesce(sum(tp.points) filter (where t.status = 'completed'), 0)::integer as total_points,
    count(*) filter (where t.status = 'completed' and tp.rank = 1)::integer as wins,
    count(*) filter (where t.status = 'completed' and tp.rank <= 3)::integer as podiums,
    max(t.completed_at) filter (where t.status = 'completed') as last_played_at
  from public.profiles p
  left join public.tournament_players tp on tp.user_id = p.id
  left join public.tournaments t on t.id = tp.tournament_id
  group by p.id, p.display_name
)
select
  s.*,
  public.compute_average(s.matches, s.total_points) as avg_points,
  public.rating_tier(public.compute_average(s.matches, s.total_points)) as tier,
  (s.matches < 3) as provisional
from stats s;

-- ----------------------------------------------------------------------------
-- 6. Row-level security: members can read everything; all writes go through
--    the functions below so the rules cannot be bypassed.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists tournaments_select on public.tournaments;
create policy tournaments_select on public.tournaments
  for select to authenticated using (true);

drop policy if exists tournament_players_select on public.tournament_players;
create policy tournament_players_select on public.tournament_players
  for select to authenticated using (true);

grant usage on schema public to authenticated;
grant select on public.profiles, public.tournaments, public.tournament_players, public.leaderboard to authenticated;
grant update (display_name) on public.profiles to authenticated;
revoke all on public.profiles, public.tournaments, public.tournament_players, public.leaderboard from anon;

-- ----------------------------------------------------------------------------
-- 7. Write operations (security definer; each one re-checks the caller)
-- ----------------------------------------------------------------------------
create or replace function public.assert_member()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Any signed-in account counts as a member. Email verification is not
  -- required; the @connect.ust.hk trigger on auth.users still applies.
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;
  return auth.uid();
end;
$$;

create or replace function public.create_tournament(
  p_name text,
  p_scheduled_at timestamptz,
  p_max_players integer,
  p_host_plays boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.assert_member();
  new_id uuid;
begin
  if p_name is null or char_length(trim(p_name)) < 2 then
    raise exception 'Give the tournament a name (2 to 60 characters).';
  end if;
  if p_max_players is null or p_max_players < 2 or p_max_players > 9 then
    raise exception 'A table seats between 2 and 9 players.';
  end if;
  insert into public.tournaments (name, host_id, scheduled_at, max_players)
  values (left(trim(p_name), 60), uid, coalesce(p_scheduled_at, now()), p_max_players)
  returning id into new_id;

  if p_host_plays then
    insert into public.tournament_players (tournament_id, user_id) values (new_id, uid);
  end if;
  return new_id;
end;
$$;

create or replace function public.update_tournament(
  p_id uuid,
  p_name text,
  p_scheduled_at timestamptz,
  p_max_players integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.assert_member();
  tr public.tournaments%rowtype;
  seated integer;
begin
  select * into tr from public.tournaments where id = p_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if tr.host_id <> uid then raise exception 'Only the host can edit this tournament.'; end if;
  if tr.status <> 'open' then raise exception 'Completed tournaments cannot be edited. Reopen it first.'; end if;
  if p_name is null or char_length(trim(p_name)) < 2 then
    raise exception 'Give the tournament a name (2 to 60 characters).';
  end if;
  if p_max_players is null or p_max_players < 2 or p_max_players > 9 then
    raise exception 'A table seats between 2 and 9 players.';
  end if;
  select count(*) into seated from public.tournament_players where tournament_id = p_id;
  if p_max_players < seated then
    raise exception '% players are already seated; remove someone before shrinking the table.', seated;
  end if;
  update public.tournaments
     set name = left(trim(p_name), 60),
         scheduled_at = coalesce(p_scheduled_at, scheduled_at),
         max_players = p_max_players
   where id = p_id;
end;
$$;

create or replace function public.delete_tournament(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.assert_member();
  tr public.tournaments%rowtype;
begin
  select * into tr from public.tournaments where id = p_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if tr.host_id <> uid then raise exception 'Only the host can delete this tournament.'; end if;
  if tr.status <> 'open' then raise exception 'Completed tournaments cannot be deleted. Reopen it first.'; end if;
  delete from public.tournaments where id = p_id;
end;
$$;

create or replace function public.join_tournament(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.assert_member();
  tr public.tournaments%rowtype;
  seated integer;
begin
  select * into tr from public.tournaments where id = p_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if tr.status <> 'open' then raise exception 'This tournament is no longer open.'; end if;
  if exists (select 1 from public.tournament_players where tournament_id = p_id and user_id = uid) then
    return;
  end if;
  select count(*) into seated from public.tournament_players where tournament_id = p_id;
  if seated >= tr.max_players then
    raise exception 'This table is full (% seats).', tr.max_players;
  end if;
  insert into public.tournament_players (tournament_id, user_id) values (p_id, uid);
end;
$$;

create or replace function public.leave_tournament(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.assert_member();
  tr public.tournaments%rowtype;
begin
  select * into tr from public.tournaments where id = p_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if tr.status <> 'open' then raise exception 'Results are already in; you cannot leave now.'; end if;
  delete from public.tournament_players where tournament_id = p_id and user_id = uid;
end;
$$;

create or replace function public.remove_player(p_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.assert_member();
  tr public.tournaments%rowtype;
begin
  select * into tr from public.tournaments where id = p_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if tr.host_id <> uid then raise exception 'Only the host can remove players.'; end if;
  if tr.status <> 'open' then raise exception 'Results are already in. Reopen the tournament to change seats.'; end if;
  delete from public.tournament_players where tournament_id = p_id and user_id = p_user_id;
end;
$$;

-- p_rankings: [{"user_id": "<uuid>", "rank": 1}, ...] covering every seated player.
create or replace function public.finalize_tournament(p_id uuid, p_rankings jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.assert_member();
  tr public.tournaments%rowtype;
  n_players integer;
  n_rankings integer;
  n_users integer;
  n_ranks integer;
  min_rank integer;
  max_rank integer;
  n_matched integer;
begin
  select * into tr from public.tournaments where id = p_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if tr.host_id <> uid then raise exception 'Only the host can enter results.'; end if;
  if tr.status <> 'open' then raise exception 'Results have already been entered.'; end if;
  if p_rankings is null or jsonb_typeof(p_rankings) <> 'array' then
    raise exception 'Rankings must be a list.';
  end if;

  select count(*) into n_players from public.tournament_players where tournament_id = p_id;
  if n_players < 2 then
    raise exception 'At least 2 players must be seated to record results.';
  end if;

  select count(*), count(distinct r.user_id), count(distinct r.rank), min(r.rank), max(r.rank)
    into n_rankings, n_users, n_ranks, min_rank, max_rank
  from jsonb_to_recordset(p_rankings) as r(user_id uuid, rank integer);

  if n_rankings <> n_players or n_users <> n_players then
    raise exception 'Every seated player needs exactly one finishing position (% of % given).', n_users, n_players;
  end if;
  if n_ranks <> n_players or min_rank <> 1 or max_rank <> n_players then
    raise exception 'Positions must be exactly 1 to % with no repeats.', n_players;
  end if;

  select count(*) into n_matched
  from jsonb_to_recordset(p_rankings) as r(user_id uuid, rank integer)
  join public.tournament_players tp on tp.tournament_id = p_id and tp.user_id = r.user_id;
  if n_matched <> n_players then
    raise exception 'Rankings include someone who is not seated at this table.';
  end if;

  update public.tournament_players tp
     set rank = r.rank,
         points = 10 - r.rank
    from jsonb_to_recordset(p_rankings) as r(user_id uuid, rank integer)
   where tp.tournament_id = p_id and tp.user_id = r.user_id;

  update public.tournaments
     set status = 'completed', completed_at = now()
   where id = p_id;
end;
$$;

create or replace function public.reopen_tournament(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.assert_member();
  tr public.tournaments%rowtype;
begin
  select * into tr from public.tournaments where id = p_id for update;
  if not found then raise exception 'Tournament not found.'; end if;
  if tr.host_id <> uid then raise exception 'Only the host can reopen this tournament.'; end if;
  if tr.status <> 'completed' then return; end if;
  update public.tournament_players set rank = null, points = null where tournament_id = p_id;
  update public.tournaments set status = 'open', completed_at = null where id = p_id;
end;
$$;

-- Lock the functions down to signed-in members.
revoke all on function public.assert_member() from public, anon;
revoke all on function public.create_tournament(text, timestamptz, integer, boolean) from public, anon;
revoke all on function public.update_tournament(uuid, text, timestamptz, integer) from public, anon;
revoke all on function public.delete_tournament(uuid) from public, anon;
revoke all on function public.join_tournament(uuid) from public, anon;
revoke all on function public.leave_tournament(uuid) from public, anon;
revoke all on function public.remove_player(uuid, uuid) from public, anon;
revoke all on function public.finalize_tournament(uuid, jsonb) from public, anon;
revoke all on function public.reopen_tournament(uuid) from public, anon;

grant execute on function public.create_tournament(text, timestamptz, integer, boolean) to authenticated;
grant execute on function public.update_tournament(uuid, text, timestamptz, integer) to authenticated;
grant execute on function public.delete_tournament(uuid) to authenticated;
grant execute on function public.join_tournament(uuid) to authenticated;
grant execute on function public.leave_tournament(uuid) to authenticated;
grant execute on function public.remove_player(uuid, uuid) to authenticated;
grant execute on function public.finalize_tournament(uuid, jsonb) to authenticated;
grant execute on function public.reopen_tournament(uuid) to authenticated;
grant execute on function public.compute_average(integer, integer) to authenticated;
grant execute on function public.rating_tier(numeric) to authenticated;
