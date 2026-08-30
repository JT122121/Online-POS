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

  created_at timestamptz not null default now()
);

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
-- updated_at auto-touch trigger (store_settings, products)
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

-- ============================================================================
-- Auto-provision a default store_settings row for every new sign-in
-- ============================================================================
-- Fires once, right after Supabase Auth inserts a new row into auth.users -
-- which happens identically whether that user just signed up with Google,
-- any other OAuth provider, or email/password. Without this, a brand-new
-- user would have no store_settings row at all until the app explicitly
-- created one, mirroring app.html's own "first-ever visit" defaults
-- (Demo Store / etc. - see CLAUDE.md's "Default store name/details" note)
-- so a fresh account starts in the same state a fresh browser does today.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.store_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- ============================================================================
-- End of schema
-- ============================================================================
