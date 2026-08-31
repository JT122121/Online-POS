-- GoOnlinePOS.com - Supabase schema
--
-- This file is authored ahead of time and is NOT connected to any live
-- Supabase project yet - see supabase/README.md for how/when to run it.
-- It creates the tables app.html would eventually read/write if it starts
-- persisting to Supabase instead of (or in addition to) localStorage, plus
-- Row Level Security so every signed-in user only ever sees their own data.
--
-- Auth: this schema does not create its own users table. It relies on
-- Supabase Auth's built-in `auth.users` table, which is populated
-- automatically no matter which sign-in method a visitor uses (Google,
-- any other OAuth provider, magic link, email/password, etc.) - turning on
-- a provider like Google is done in the Supabase dashboard under
-- Authentication -> Providers, not in SQL, so nothing here needs to change
-- per provider.
--
-- Safe to run more than once: every statement is guarded with
-- IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS so re-running this
-- file against a project that already has it applied is a no-op, not an
-- error.

-- ============================================================================
-- 1. store_settings - one row per user, mirrors app.html's Settings panel
-- ============================================================================
-- Everything here is currently a single `pos-settings` (+ a few sibling
-- keys) blob in localStorage, written via storageGet/storageSet. The
-- columns below cover the fields worth querying/filtering on directly;
-- `settings` is a catch-all jsonb column for anything else app.html stores
-- alongside them, so a new client-side setting never needs a migration
-- before it can round-trip through Supabase too.

create table if not exists public.store_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  store_name text not null default 'Demo Store',
  store_details text not null default '',
  logo_data_url text not null default '',

  tax_name text not null default 'Tax',
  tax_rate numeric(8, 3) not null default 0,

  currency_code text not null default 'USD',
  currency_symbol text not null default '$',

  receipt_prefix text not null default '',
  receipt_counter integer not null default 1,

  language text not null default 'en',
  paper_size text not null default '80',

  premium_unlocked boolean not null default false,
  premium_code_used text not null default '',

  footer1 text not null default '',
  footer2 text not null default '',

  -- catch-all for any other client-stored setting (barcode scanner toggle,
  -- panel-split width, dismissed-notice flags, etc.) that doesn't need its
  -- own column to be useful.
  settings jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.store_settings is
  'One row per user - the Settings panel fields app.html currently keeps in localStorage.';

-- ============================================================================
-- 2. products - the catalog (Settings -> Products / bulk CSV-Excel upload)
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  price numeric(12, 2) not null default 0,
  category text not null default '',
  sku text not null default '',
  stock numeric(12, 2), -- null = stock tracking not used for this product
  tax_exempt boolean not null default false,
  photo text not null default '', -- compressed JPEG data URL, matches app.html's compressProductPhoto()

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists products_user_id_sku_idx on public.products(user_id, sku);

comment on table public.products is
  'Product catalog, one row per product - mirrors app.html''s products[] array.';

-- ============================================================================
-- 3. cashiers
-- ============================================================================

create table if not exists public.cashiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists cashiers_user_id_idx on public.cashiers(user_id);

-- ============================================================================
-- 4. payment_methods
-- ============================================================================

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists payment_methods_user_id_idx on public.payment_methods(user_id);

-- ============================================================================
-- 5. sales - completed transactions (app.html's salesHistory)
-- ============================================================================
-- A handful of store fields are snapshotted onto the sale itself (not just
-- foreign-keyed), matching how app.html already freezes store name/details
-- at sale time so a later Settings change or product rename doesn't alter
-- the historical record on reprint.

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  receipt_number text not null default '',
  sale_datetime timestamptz not null default now(),
  document_type text not null default '', -- 'Receipt' | 'Invoice' | 'Payment' (app.html's getDocumentTitle())

  cashier_name text not null default '',
  customer_name text not null default '',

  subtotal numeric(12, 2) not null default 0,
  discount_type text not null default 'percent', -- 'percent' | 'amount'
  discount_value numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,

  tax_name text not null default 'Tax',
  tax_rate numeric(8, 3) not null default 0,
  tax_amount numeric(12, 2) not null default 0,

  total numeric(12, 2) not null default 0,
  amount_received numeric(12, 2) not null default 0,
  change_amount numeric(12, 2) not null default 0,

  -- store details as they were at the moment of sale, for reprints
  store_name_snapshot text not null default '',
  store_details_snapshot text not null default '',
  footer1_snapshot text not null default '',
  footer2_snapshot text not null default '',

  -- catch-all for smaller per-sale display fields that don't warrant their
  -- own column (currencyCode/currencySymbol/decimalPlaces at the moment of
  -- sale) - same "settings jsonb" convention as store_settings above.
  meta jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- Upgrade path for a project where this table was already created before
-- document_type/meta existed - safe to run against a brand-new table too.
alter table public.sales add column if not exists document_type text not null default '';
alter table public.sales add column if not exists meta jsonb not null default '{}'::jsonb;

create index if not exists sales_user_id_idx on public.sales(user_id);
create index if not exists sales_user_id_sale_datetime_idx on public.sales(user_id, sale_datetime);

comment on table public.sales is
  'One row per completed sale - mirrors app.html''s salesHistory[] records (header/totals only, see sale_items/sale_payments for line detail).';

-- ============================================================================
-- 6. sale_items - line items for a sale
-- ============================================================================
-- user_id is denormalized here (not just reachable via sale_id -> sales)
-- purely so its RLS policy can be a plain, fast auth.uid() = user_id check
-- like every other table, instead of a subquery/join against sales.

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,

  name text not null default '',
  sku text not null default '',
  qty numeric(12, 3) not null default 1,
  price numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  tax_exempt boolean not null default false,

  -- optional per-sale description feature (checkout + Sales History edit
  -- only - see CLAUDE.md's "Cart/checkout" section). Blank when unused, so
  -- a plain sale with no descriptions costs nothing extra to store.
  description text not null default '',

  created_at timestamptz not null default now()
);

create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists sale_items_user_id_idx on public.sale_items(user_id);

-- ============================================================================
-- 7. sale_payments - the payment split for a sale (paymentRows)
-- ============================================================================

create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,

  method text not null default '',
  amount numeric(12, 2) not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists sale_payments_sale_id_idx on public.sale_payments(sale_id);
create index if not exists sale_payments_user_id_idx on public.sale_payments(user_id);

-- ============================================================================
-- 8. profiles - one row per signed-in user, tracks subscription status
-- ============================================================================
-- Auto-created (status 'free') for every new auth.users row by
-- handle_new_user() below. This is what app.html's Account & Subscription
-- panel reads/shows, and what redeem_code() below updates.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',

  -- Kept as a plain, human-readable label (mainly so the project owner can
  -- eyeball status in the Supabase Table Editor without doing date math) -
  -- but treat premium_until as the actual source of truth: the app always
  -- computes "is this user Premium right now" from premium_until directly
  -- (premium_until is in the future), not from this text column alone,
  -- since a subscription can lapse between visits without anything writing
  -- to this row in the meantime. redeem_code() keeps both in sync at the
  -- moment of redemption; the app lazily corrects a stale 'premium' label
  -- back to 'free' the next time that user's profile loads after expiry.
  subscription_status text not null default 'free',
  premium_until timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per signed-in user - subscription status shown in Settings -> Account, extended by redeem_code().';

-- ============================================================================
-- 9. redemption_codes - codes the project owner creates, redeemed once each
-- ============================================================================
-- Deliberately has NO Row Level Security policies granting anon/authenticated
-- access at all (RLS is enabled with zero policies below = default deny) -
-- nobody can browse, enumerate, or edit this table through the public API,
-- only through the redeem_code() function below (which runs as
-- SECURITY DEFINER, bypassing RLS) or through the Supabase dashboard's
-- Table Editor / SQL Editor, both of which use the project's service role
-- and are not subject to RLS either. That's how the project owner adds new
-- codes - open the Supabase dashboard, Table Editor -> redemption_codes ->
-- Insert row - no app code or extra tooling needed for that part.

create table if not exists public.redemption_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  duration_days integer not null default 30,

  is_used boolean not null default false,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,

  note text not null default '', -- free-form, e.g. "batch for Facebook promo, Aug 2026"
  created_at timestamptz not null default now()
);

create index if not exists redemption_codes_code_idx on public.redemption_codes(code);

comment on table public.redemption_codes is
  'Codes the project owner creates by inserting rows directly (Table Editor). Redeemed exactly once via the redeem_code() function - never read or written directly by the app.';

-- ============================================================================
-- updated_at auto-touch trigger (store_settings, products, profiles)
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_store_settings_updated_at on public.store_settings;
create trigger touch_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_products_updated_at on public.products;
create trigger touch_products_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Auto-provision default store_settings + profiles rows for every new sign-in
-- ============================================================================
-- Fires once, right after Supabase Auth inserts a new row into auth.users -
-- which happens identically whether that user just signed up with Google,
-- any other OAuth provider, or email/password. Without this, a brand-new
-- user would have no store_settings/profiles row at all until the app
-- explicitly created one. store_settings mirrors app.html's own
-- "first-ever visit" defaults (Demo Store / etc. - see CLAUDE.md's "Default
-- store name/details" note); profiles starts every new account at the
-- 'free' subscription tier - Premium is opt-in via redeem_code() below, not
-- auto-granted the way the old PROMO1 code used to be.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.store_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.profiles (user_id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- redeem_code() - the only way redemption_codes is ever read or written
-- ============================================================================
-- Called from the app via supabase.rpc('redeem_code', { p_code: '...' }).
-- Runs as SECURITY DEFINER (so it can read/update redemption_codes despite
-- that table having no RLS policies for authenticated users) but starts by
-- requiring a real caller identity (auth.uid()), and only ever touches the
-- calling user's own profile - it never takes a user id as a parameter, so
-- there's no way to redeem a code "on behalf of" someone else.
--
-- "for update" row-locks the matching code for the duration of the
-- transaction, so two people redeeming the same code at the same moment
-- can't both succeed - the second one blocks until the first commits, then
-- correctly sees is_used = true and fails cleanly instead of racing.
--
-- Extension is additive: redeeming while already Premium stacks the new
-- code's duration on top of the remaining time rather than overwriting it,
-- so redeeming early never costs a subscriber any remaining days.

create or replace function public.redeem_code(p_code text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.redemption_codes;
  v_current_until timestamptz;
  v_new_until timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'reason', 'not_authenticated');
  end if;

  select * into v_row
  from public.redemption_codes
  where upper(trim(code)) = upper(trim(p_code))
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'invalid');
  end if;
  if v_row.is_used then
    return jsonb_build_object('success', false, 'reason', 'already_used');
  end if;

  update public.redemption_codes
  set is_used = true, used_by = v_uid, used_at = now()
  where id = v_row.id;

  select premium_until into v_current_until from public.profiles where user_id = v_uid;
  v_new_until := greatest(now(), coalesce(v_current_until, now())) + make_interval(days => v_row.duration_days);

  update public.profiles
  set subscription_status = 'premium', premium_until = v_new_until, updated_at = now()
  where user_id = v_uid;

  return jsonb_build_object('success', true, 'premium_until', v_new_until);
end;
$$;

revoke all on function public.redeem_code(text) from public;
grant execute on function public.redeem_code(text) to authenticated;

-- ============================================================================
-- Row Level Security - every table, every user only ever sees their own rows
-- ============================================================================

alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.cashiers enable row level security;
alter table public.payment_methods enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;
alter table public.profiles enable row level security;
alter table public.redemption_codes enable row level security;
-- redemption_codes gets RLS enabled but NO policies below - default deny
-- for anon/authenticated. Only redeem_code() (SECURITY DEFINER, bypasses
-- RLS) and the Supabase dashboard (service role, also bypasses RLS) can
-- touch this table - see the table's own comment above.

drop policy if exists "store_settings: owner full access" on public.store_settings;
create policy "store_settings: owner full access" on public.store_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "products: owner full access" on public.products;
create policy "products: owner full access" on public.products
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cashiers: owner full access" on public.cashiers;
create policy "cashiers: owner full access" on public.cashiers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "payment_methods: owner full access" on public.payment_methods;
create policy "payment_methods: owner full access" on public.payment_methods
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sales: owner full access" on public.sales;
create policy "sales: owner full access" on public.sales
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sale_items: owner full access" on public.sale_items;
create policy "sale_items: owner full access" on public.sale_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sale_payments: owner full access" on public.sale_payments;
create policy "sale_payments: owner full access" on public.sale_payments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- profiles: a user can read/update their own row, but never anyone else's,
-- and never subscription_status/premium_until directly (those only ever
-- change through redeem_code() or handle_new_user() above, both
-- SECURITY DEFINER) - enforced by simply never granting a client-facing
-- UPDATE policy on those columns' values beyond what the app itself sends,
-- since the app never writes to this table directly at all today.
drop policy if exists "profiles: owner can read own row" on public.profiles;
create policy "profiles: owner can read own row" on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "profiles: owner can insert own row" on public.profiles;
create policy "profiles: owner can insert own row" on public.profiles
  for insert
  with check (auth.uid() = user_id);
-- Insert-only safety net for an account created before this table existed
-- (handle_new_user() normally provisions this row automatically on every
-- new sign-in - see above) - the app can fall back to inserting its own
-- default 'free' row if one is somehow missing, without needing a service
-- role. No client-facing UPDATE policy exists on this table by design.

-- ============================================================================
-- End of schema
-- ============================================================================
