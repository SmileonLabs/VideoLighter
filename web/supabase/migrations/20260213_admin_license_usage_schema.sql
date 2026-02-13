-- Core schema for license/device control, usage tracking, and admin operations.

create extension if not exists pgcrypto;

-- Keep updated_at in sync.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admin allowlist (email-based bootstrap, expandable later).
create table if not exists public.admin_users (
  email text primary key,
  user_id uuid unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.admin_users (email, is_active)
values ('contact@smileon.app', true)
on conflict (email) do update
set is_active = excluded.is_active;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.is_active = true
      and lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- User profile mirror table (for support search by email).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_auth_user();

-- Extend existing licenses table used by the web app.
alter table public.licenses
  add column if not exists expires_at timestamptz,
  add column if not exists user_email text,
  add column if not exists device_limit integer not null default 1,
  add column if not exists polar_order_id text,
  add column if not exists polar_product_id text,
  add column if not exists source text not null default 'polar',
  add column if not exists updated_at timestamptz not null default now();

-- Legacy schema compatibility:
-- older versions had one-license-per-user unique constraints.
-- remove them to allow purchase history records.
alter table public.licenses drop constraint if exists unique_user_license;
alter table public.licenses drop constraint if exists licenses_user_id_key;
drop index if exists public.unique_user_license;
drop index if exists public.licenses_user_id_key;

update public.licenses
set expires_at = case
  when product_type = 'lifetime' then '9999-12-31T23:59:59Z'::timestamptz
  else coalesce(created_at, now()) + interval '31 day'
end
where expires_at is null;

update public.licenses
set user_email = p.email
from public.profiles p
where public.licenses.user_id = p.id
  and public.licenses.user_email is null;

drop trigger if exists trg_licenses_set_updated_at on public.licenses;
create trigger trg_licenses_set_updated_at
before update on public.licenses
for each row
execute function public.set_updated_at();

create index if not exists idx_licenses_user_id_created_at on public.licenses(user_id, created_at desc);
create index if not exists idx_licenses_user_id_expires_at on public.licenses(user_id, expires_at desc);
create index if not exists idx_licenses_license_key on public.licenses(license_key);
create unique index if not exists uq_licenses_polar_order_id on public.licenses(polar_order_id) where polar_order_id is not null;

-- Physical/app devices.
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  device_fingerprint text unique not null,
  fingerprint_hash_algo text not null default 'sha256',
  os_name text,
  os_version text,
  app_version text,
  hostname text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_devices_set_updated_at on public.devices;
create trigger trg_devices_set_updated_at
before update on public.devices
for each row
execute function public.set_updated_at();

create index if not exists idx_devices_last_seen_at on public.devices(last_seen_at desc);

-- Paid license activation to a single device.
create table if not exists public.license_activations (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  activated_at timestamptz not null default now(),
  deactivated_at timestamptz,
  deactivated_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_license_activations_license_id on public.license_activations(license_id);
create index if not exists idx_license_activations_device_id on public.license_activations(device_id);

-- One active device per paid license.
create unique index if not exists uq_license_activations_license_active
on public.license_activations(license_id)
where deactivated_at is null;

-- One active paid license per device.
create unique index if not exists uq_license_activations_device_active
on public.license_activations(device_id)
where deactivated_at is null;

-- Detailed usage logs (retain 30 days).
create table if not exists public.compression_jobs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  license_id uuid references public.licenses(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  status text not null check (status in ('success', 'failed', 'canceled')),
  files_count integer not null default 1,
  input_bytes bigint not null default 0,
  output_bytes bigint not null default 0,
  duration_ms integer,
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_compression_jobs_user_created_at on public.compression_jobs(user_id, created_at desc);
create index if not exists idx_compression_jobs_license_created_at on public.compression_jobs(license_id, created_at desc);
create index if not exists idx_compression_jobs_created_at on public.compression_jobs(created_at desc);

-- Long-term aggregate stats for refund/support decisions.
create table if not exists public.license_usage_stats (
  license_id uuid primary key references public.licenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  total_jobs bigint not null default 0,
  success_jobs bigint not null default 0,
  failed_jobs bigint not null default 0,
  canceled_jobs bigint not null default 0,
  total_files bigint not null default 0,
  total_input_bytes bigint not null default 0,
  total_output_bytes bigint not null default 0,
  first_used_at timestamptz,
  last_used_at timestamptz,
  active_days integer not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_license_usage_stats_set_updated_at on public.license_usage_stats;
create trigger trg_license_usage_stats_set_updated_at
before update on public.license_usage_stats
for each row
execute function public.set_updated_at();

create or replace function public.bump_license_usage_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.license_id is null then
    return new;
  end if;

  insert into public.license_usage_stats (
    license_id,
    user_id,
    total_jobs,
    success_jobs,
    failed_jobs,
    canceled_jobs,
    total_files,
    total_input_bytes,
    total_output_bytes,
    first_used_at,
    last_used_at,
    active_days
  )
  values (
    new.license_id,
    new.user_id,
    1,
    case when new.status = 'success' then 1 else 0 end,
    case when new.status = 'failed' then 1 else 0 end,
    case when new.status = 'canceled' then 1 else 0 end,
    greatest(new.files_count, 0),
    greatest(new.input_bytes, 0),
    greatest(new.output_bytes, 0),
    new.created_at,
    new.created_at,
    1
  )
  on conflict (license_id) do update
  set total_jobs = public.license_usage_stats.total_jobs + 1,
      success_jobs = public.license_usage_stats.success_jobs + (case when excluded.success_jobs > 0 then 1 else 0 end),
      failed_jobs = public.license_usage_stats.failed_jobs + (case when excluded.failed_jobs > 0 then 1 else 0 end),
      canceled_jobs = public.license_usage_stats.canceled_jobs + (case when excluded.canceled_jobs > 0 then 1 else 0 end),
      total_files = public.license_usage_stats.total_files + excluded.total_files,
      total_input_bytes = public.license_usage_stats.total_input_bytes + excluded.total_input_bytes,
      total_output_bytes = public.license_usage_stats.total_output_bytes + excluded.total_output_bytes,
      first_used_at = least(public.license_usage_stats.first_used_at, excluded.first_used_at),
      last_used_at = greatest(public.license_usage_stats.last_used_at, excluded.last_used_at),
      active_days = (
        select count(distinct date(cj.created_at))
        from public.compression_jobs cj
        where cj.license_id = excluded.license_id
          and cj.status = 'success'
      ),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_compression_jobs_bump_stats on public.compression_jobs;
create trigger trg_compression_jobs_bump_stats
after insert on public.compression_jobs
for each row
execute function public.bump_license_usage_stats();

create or replace function public.prune_compression_jobs(retention interval default interval '30 days')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.compression_jobs
  where created_at < now() - retention;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.prune_compression_jobs(interval) to authenticated;

-- RLS
alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.licenses enable row level security;
alter table public.devices enable row level security;
alter table public.license_activations enable row level security;
alter table public.compression_jobs enable row level security;
alter table public.license_usage_stats enable row level security;

drop policy if exists admin_users_read_admin on public.admin_users;
create policy admin_users_read_admin
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists admin_users_manage_admin on public.admin_users;
create policy admin_users_manage_admin
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists profiles_read_own_or_admin on public.profiles;
create policy profiles_read_own_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists licenses_read_own_or_admin on public.licenses;
create policy licenses_read_own_or_admin
on public.licenses
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists licenses_manage_admin_only on public.licenses;
create policy licenses_manage_admin_only
on public.licenses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists devices_read_owner_or_admin on public.devices;
create policy devices_read_owner_or_admin
on public.devices
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.license_activations la
    join public.licenses l on l.id = la.license_id
    where la.device_id = devices.id
      and la.deactivated_at is null
      and l.user_id = auth.uid()
  )
);

drop policy if exists devices_manage_admin_only on public.devices;
create policy devices_manage_admin_only
on public.devices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists activations_read_owner_or_admin on public.license_activations;
create policy activations_read_owner_or_admin
on public.license_activations
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.licenses l
    where l.id = license_activations.license_id
      and l.user_id = auth.uid()
  )
);

drop policy if exists activations_manage_admin_only on public.license_activations;
create policy activations_manage_admin_only
on public.license_activations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists jobs_read_owner_or_admin on public.compression_jobs;
create policy jobs_read_owner_or_admin
on public.compression_jobs
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists jobs_insert_owner_or_admin on public.compression_jobs;
create policy jobs_insert_owner_or_admin
on public.compression_jobs
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists jobs_manage_admin_only on public.compression_jobs;
create policy jobs_manage_admin_only
on public.compression_jobs
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists usage_stats_read_owner_or_admin on public.license_usage_stats;
create policy usage_stats_read_owner_or_admin
on public.license_usage_stats
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists usage_stats_manage_admin_only on public.license_usage_stats;
create policy usage_stats_manage_admin_only
on public.license_usage_stats
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
