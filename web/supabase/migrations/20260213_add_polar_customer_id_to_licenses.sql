alter table public.licenses
  add column if not exists polar_customer_id text;

create index if not exists idx_licenses_polar_customer_id
on public.licenses(polar_customer_id);
