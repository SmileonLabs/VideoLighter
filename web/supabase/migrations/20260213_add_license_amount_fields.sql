alter table public.licenses
  add column if not exists paid_amount_cents integer,
  add column if not exists paid_currency text;

create index if not exists idx_licenses_paid_currency on public.licenses(paid_currency);
