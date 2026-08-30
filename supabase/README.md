# Supabase schema (connected - Account & Subscription + Cloud Sync)

This folder holds the Supabase PostgreSQL schema behind `app.html`'s
**Account & Subscription** system (Settings → Premium) and its optional
**Cloud Sync** feature (Settings → Backup → Cloud Sync). Anyone can sign
in with Google (or any other provider you enable) to get a free account;
redeeming a code extends their subscription and unlocks Premium features,
including Cloud Sync, which backs up data to the cloud and restores it on
any device. The app itself stays usable with zero signup - `localStorage`
remains the primary/default storage for everyone on the free tier. See
`modules/account.js`/`modules/cloud-sync.js` and the "Account &
Subscription"/"Cloud Sync" sections of `CLAUDE.md` for the integration
itself; this file covers the database side.

This **replaced** an earlier Google Sheet + Apps Script Premium system
(`premium-validation/`, left on disk unused - see `CLAUDE.md`) - there is
no more free auto-granted code; every new account starts on the free tier
and stays there until a code is redeemed.

**Before this will work, run this file (or the updated version of it)
against your Supabase project's SQL Editor** - see "How to run this"
below. It's safe to re-run any time you pull a newer version; it upgrades
an existing project in place (see "Notes" below).

## What's in `schema.sql`

One row per signed-in user, everywhere, enforced by Row Level Security -
no user can ever read or write another user's data, even via the public
API:

| Table | Mirrors |
|---|---|
| `store_settings` | Settings panel (store name/details, tax, currency, receipt numbering, language, paper size, Premium status) |
| `products` | The product catalog (Settings -> Products / bulk CSV or Excel upload) |
| `cashiers` | Settings -> Cashiers |
| `payment_methods` | Settings -> Payment Methods |
| `sales` | Completed sales (`salesHistory`) - totals/header, plus a `document_type` column and a `meta jsonb` catch-all for smaller per-sale display fields |
| `sale_items` | Each sale's line items, including the optional per-item description feature |
| `sale_payments` | Each sale's payment split |
| `profiles` | Settings -> Premium ("Account & Subscription") - one row per user, subscription status and expiry |
| `redemption_codes` | Codes you create; redeemed exactly once each via the `redeem_code()` function below |

A `handle_new_user()` trigger on Supabase's own `auth.users` table
auto-creates a default `store_settings` row (same "Demo Store" defaults
`app.html` already ships) **and** a default `profiles` row
(`subscription_status: 'free'`) the moment a new account first signs in -
no app code has to remember to provision either.

## Adding redemption codes

Open your Supabase project's dashboard -> **Table Editor** ->
`redemption_codes` -> **Insert row**. Fill in:

- `code` - the string a user types into Settings -> Premium -> Redeem
  Code. Matching is case/whitespace-insensitive.
- `duration_days` - how many days that code extends a subscription by
  (defaults to 30 if left blank).
- `note` (optional) - your own reference, e.g. "batch for Facebook promo,
  Aug 2026" - never shown to users.

That's it - no app code, deploy step, or extra tooling needed. The table
has no public API access at all (see "Notes" below), so this dashboard
view - or a direct SQL `insert` in the SQL Editor - is the only way codes
get created. `is_used`/`used_by`/`used_at` fill in automatically the
moment someone redeems a code; leave them blank when inserting a new one.

## Authentication (Google or anything else)

This schema doesn't create a users table of its own - it relies entirely
on **Supabase Auth**, which already has a built-in `auth.users` table that
fills in automatically no matter how someone signs in. Turning on Google
(or any other provider - GitHub, Facebook, email/password, magic link,
etc.) is a **dashboard setting, not a SQL change**:

1. In the Supabase dashboard: **Authentication -> Providers -> Google** ->
   flip it on, paste in a Google OAuth Client ID/Secret (created in
   [Google Cloud Console](https://console.cloud.google.com/) under
   **APIs & Services -> Credentials**), and set the redirect URL Supabase
   shows you as an **Authorized redirect URI** on that Google OAuth client.
2. Nothing in `schema.sql` needs to change for this, or for adding a
   second/third provider later - every table's Row Level Security policy
   is written against `auth.uid()`, which is the same regardless of which
   provider a user signed in with.

## How to run this

1. Create a Supabase project at [supabase.com](https://supabase.com) if you
   don't have one yet.
2. Dashboard -> **SQL Editor** -> New query -> paste in the full contents
   of `schema.sql` -> Run. It's safe to re-run any time you pull a newer
   version of this file - every statement is written with
   `if not exists` / `create or replace` / `drop ... if exists` (plus
   `alter table ... add column if not exists` for columns added after a
   table's first release, like `sales.document_type`/`sales.meta`) so it
   won't error, and won't miss new columns, on a project that already has
   an older version applied.
3. Enable whichever sign-in provider(s) you want, per the section above.
4. `app.html`'s Settings → Premium ("Account & Subscription") and Settings
   → Backup → Cloud Sync are already wired up to call this
   (`modules/account.js`/`modules/cloud-sync.js`) - once the schema is
   applied and a provider is enabled, anyone can sign in, land on the
   free tier automatically, and redeem a code (see "Adding redemption
   codes" above) to unlock Premium features including Cloud Sync - see
   `CLAUDE.md`'s "Account & Subscription" and "Cloud Sync" sections.

## Notes

- Every table's primary key is a `uuid` (`gen_random_uuid()`), matching
  Supabase's own convention and avoiding sequential IDs that leak how many
  rows exist.
- `user_id` is stored directly on every table (not just reachable through
  a join) specifically so each table's Row Level Security policy can be a
  single fast `auth.uid() = user_id` check.
- `store_settings.settings`/`sales.meta` (`jsonb`) are deliberate catch-all
  columns for smaller fields that don't warrant their own column (e.g. a
  dismissed-notice flag, or a specific sale's currency symbol at the time
  it was made) - so a future new field in `app.html` doesn't automatically
  require a schema migration before it can round-trip through Supabase too.
- **`redemption_codes` has zero Row Level Security policies** (RLS is
  enabled, but nothing grants anon/authenticated access) - a signed-in
  user can never read or list codes directly through the app's public
  API, only redeem one by calling the `redeem_code(p_code)` function,
  which runs as `security definer` (bypasses RLS) and only ever touches
  the *caller's own* profile - there's no way to redeem "on behalf of"
  someone else. Redeeming is additive: doing it while already Premium
  extends from the current expiry rather than overwriting it, so
  redeeming early never costs anyone remaining time. The dashboard's
  Table Editor/SQL Editor use the project's service role, which also
  bypasses RLS - that's how you add codes (see "Adding redemption codes"
  above) without needing any policy to grant it.
- `profiles.subscription_status` is a convenience label for browsing the
  table in the dashboard - the app always computes actual Premium status
  from `premium_until` being in the future, and lazily corrects a stale
  `'premium'` label back to `'free'` the next time that profile loads
  after it expires, so the label doesn't just sit there being wrong
  indefinitely.
- This schema does not model Premium seat/device limits the way the
  retired `premium-validation/AppsScript.gs` used to - Premium now
  follows the signed-in account, not a per-browser code entry, so there's
  nothing to cap.
- "Backup to Cloud" / "Restore from Cloud" are full-replace operations
  (delete-then-reinsert for `products`/`cashiers`/`payment_methods`/
  `sales` and its children, upsert for the single `store_settings` row) -
  not incremental or bidirectional sync. Restoring overwrites everything
  currently on that device, same as the existing file-based Restore from
  Backup.
