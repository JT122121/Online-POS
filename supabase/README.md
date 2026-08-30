# Supabase schema (connected - Cloud Sync)

This folder holds the Supabase PostgreSQL schema behind `app.html`'s
optional **Cloud Sync** feature (Settings → Backup → Cloud Sync) - sign in
with Google (or any other provider you enable), back up your data to the
cloud, and restore it on any device, in addition to (not instead of) the
browser's own `localStorage`, which stays the primary/default storage with
zero signup required. See `modules/cloud-sync.js` and the "Cloud Sync"
section of `CLAUDE.md` for the integration itself; this file covers the
database side.

**Before Cloud Sync will work, run this file (or the updated version of
it) against your Supabase project's SQL Editor** - see "How to run this"
below. If you ran an earlier version of this file before the
`document_type`/`meta` columns existed on `sales`, just re-run the current
version; it upgrades an existing table in place (see "Notes" below).

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

A `handle_new_user()` trigger on Supabase's own `auth.users` table
auto-creates a default `store_settings` row (same "Demo Store" defaults
`app.html` already ships) the moment a new account first signs in - no
app code has to remember to provision one.

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
4. `app.html`'s Settings → Backup → Cloud Sync is already wired up to call
   this (`modules/cloud-sync.js`) - once the schema is applied and a
   provider is enabled, sign in from the app and Backup/Restore to Cloud
   will work. Cloud Sync itself also needs a purchased Premium code (not
   the free `PROMO1` code) to unlock, same as the app's other Premium
   features - see `CLAUDE.md`'s "Cloud Sync" section.

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
- This schema does not model Premium seat/device tracking
  (`premium-validation/AppsScript.gs`'s own Google Sheet) - that's a
  separate system and out of scope here.
- "Backup to Cloud" / "Restore from Cloud" are full-replace operations
  (delete-then-reinsert for `products`/`cashiers`/`payment_methods`/
  `sales` and its children, upsert for the single `store_settings` row) -
  not incremental or bidirectional sync. Restoring overwrites everything
  currently on that device, same as the existing file-based Restore from
  Backup.
