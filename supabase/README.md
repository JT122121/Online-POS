# Supabase schema (not connected yet)

This folder holds a Supabase PostgreSQL schema for the POS app to
eventually save its data to, instead of (or in addition to) the browser's
own `localStorage`. **Nothing in this repo talks to Supabase yet** -
`app.html` has not been touched, there is no project URL or API key
anywhere in this codebase, and this schema has not been run against any
live database. `schema.sql` is authored ahead of time so it's ready to
apply whenever that integration work actually happens.

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
| `sales` | Completed sales (`salesHistory`) - totals/header only |
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

## How to run this (when you're ready to connect)

1. Create a Supabase project at [supabase.com](https://supabase.com) if you
   don't have one yet.
2. Dashboard -> **SQL Editor** -> New query -> paste in the full contents
   of `schema.sql` -> Run. It's safe to re-run any time you pull a newer
   version of this file - every statement is written with
   `if not exists` / `create or replace` / `drop ... if exists` so it
   won't error on a project that already has it applied.
3. Enable whichever sign-in provider(s) you want, per the section above.
4. That's it for this file's job. Actually wiring `app.html` up to call
   Supabase (reading/writing these tables instead of, or alongside,
   `localStorage`) is a separate, not-yet-done piece of work - this schema
   only prepares the database side so that work has somewhere to land.

## Notes

- Every table's primary key is a `uuid` (`gen_random_uuid()`), matching
  Supabase's own convention and avoiding sequential IDs that leak how many
  rows exist.
- `user_id` is stored directly on every table (not just reachable through
  a join) specifically so each table's Row Level Security policy can be a
  single fast `auth.uid() = user_id` check.
- `store_settings.settings jsonb` is a deliberate catch-all column for any
  smaller client-side setting that doesn't warrant its own column (e.g. a
  dismissed-notice flag) - so a future new setting in `app.html` doesn't
  automatically require a schema migration before it can round-trip
  through Supabase too.
- This schema does not model Premium seat/device tracking
  (`premium-validation/AppsScript.gs`'s own Google Sheet) - that's a
  separate system and out of scope here.
