# New-signup email notification

Every genuinely brand-new account (first time that email has ever signed
in) now sends the site owner a short email - "New GoOnlinePOS sign-up:
someone@example.com" - the moment it happens. No code, no trial, nothing
sent to the new user at all - this is purely a heads-up to you.

This replaced an earlier design that auto-issued a 7-day Premium trial
code to the new user instead - dropped in favor of this simpler
notify-only version per explicit request. Manually-created codes
(Supabase dashboard -> Table Editor -> `redemption_codes`) are completely
unaffected either way - this feature never touches that table.

## How it works

1. A visitor signs in with Google (or any other provider you've enabled)
   for the very first time. Supabase Auth inserts a new row into
   `auth.users` - `auth.users` has exactly one row per unique email, so
   this insert *is* the "first time this email has ever authenticated"
   signal; nothing else needs to check uniqueness.
2. `handle_new_user()` (in `supabase/schema.sql`) already fires on every
   new `auth.users` row to provision default `store_settings`/`profiles`
   rows - it now also fires an async webhook (via Supabase's `pg_net`
   extension - `net.http_post()`) to this folder's `AppsScript.gs`,
   passing `{ email, secret }`. This call is fire-and-forget - sign-in
   never waits on it - and wrapped in its own exception handler, so a
   webhook hiccup can never break someone's actual sign-in.
3. `AppsScript.gs` checks the shared secret, then emails you (`OWNER_EMAIL`)
   with the new user's address and the time they signed up.

## Setup, once

1. **Deploy `AppsScript.gs`.** Go to [script.google.com](https://script.google.com)
   -> New project (a plain standalone project, same as `contact-form/` and
   `paypal-premium/` - it doesn't need a Google Sheet). Paste in
   `AppsScript.gs`, then replace:
   - `WEBHOOK_SECRET` with any random string you make up (this is *not* a
     real credential from anywhere else - just a shared password only your
     database and this script know, to stop random callers from turning
     this endpoint into a spam relay against your own inbox).
   - `OWNER_EMAIL` with your real email address - this is where the
     notification actually gets sent.

   Deploy -> New deployment -> **Web app** -> Execute as **Me** -> Who has
   access **Anyone** (same CORS reasoning as every other Apps Script in
   this repo - Apps Script Web Apps don't reliably send CORS headers back
   on POST responses otherwise, and Supabase's outbound call needs to
   reach it too). Copy the resulting URL (ends in `/exec`).
2. **Test it once** - in the Apps Script editor, select
   `testSendSignupNotify` in the function dropdown, click Run, and confirm
   the email arrives at `OWNER_EMAIL`.
3. **Wire the URL and secret into `supabase/schema.sql`.** Search for
   `REPLACE_WITH_YOUR_SIGNUP_NOTIFY_APPS_SCRIPT_URL` and
   `REPLACE_WITH_YOUR_SIGNUP_NOTIFY_WEBHOOK_SECRET` inside
   `handle_new_user()` and replace both - the Apps Script URL from step 1,
   and the exact same `WEBHOOK_SECRET` value you put in the script.
4. **Run the full, updated `supabase/schema.sql`** in the Supabase SQL
   Editor (it's idempotent, safe to re-run) - copy the *entire file*, not
   just the changed section, and paste/run it there. This both enables the
   `pg_net` extension (if it isn't already) and installs the updated
   `handle_new_user()`.
5. **Test with a real fresh sign-in.** Use a Google account that has never
   signed into your site before (or delete a test row from `auth.users` in
   the Supabase dashboard first - Authentication -> Users -> ... -> Delete
   user). Sign in, and confirm the notification email arrives at
   `OWNER_EMAIL` within a few seconds.

**Never commit `AppsScript.gs` back to this repo with real values filled
in** - the copy in git stays a template with the `REPLACE_WITH_...`
placeholders; your real `WEBHOOK_SECRET`/`OWNER_EMAIL` live only in the
deployed Apps Script project (script.google.com) and in your Supabase
project's own copy of `handle_new_user()` (which also never gets
committed back here with real values).

## If the email doesn't arrive

- Check the Apps Script's own **Executions** log (script.google.com -> your
  project -> Executions) for the most recent run - it'll show `bad_secret`
  if the two `WEBHOOK_SECRET` values don't match, or `bad_request` if
  `email` came through empty.
- Check Supabase's `pg_net` request log: SQL Editor ->
  `select * from net._http_response order by created desc limit 5;` - this
  shows the actual HTTP status/response your database got back from the
  Apps Script call, which is the fastest way to tell whether Supabase even
  reached the webhook at all. This table only exists once the `pg_net`
  extension has actually been enabled (step 4 above) and at least one
  request has been attempted.
- If neither shows anything at all, double-check you ran the *entire*
  updated `supabase/schema.sql` file in the SQL Editor (not just a
  snippet) after filling in your real URL/secret.
