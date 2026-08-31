# Automatic 7-day welcome trial on first sign-in

Every genuinely brand-new account (first time that email has ever signed in)
now automatically gets a one-time Premium redemption code, valid for 7 days,
emailed to them - no button to click, nobody to contact, nothing for the
site owner to do per signup. This replaced the old "Request Your Free
Trial" button in `app.html` (a manual contact-us flow) once this automatic
version existed - see `CLAUDE.md` for that removal.

Manually-created codes (Supabase Table Editor -> `redemption_codes`) still
work exactly as before, for comps, promos, or anyone you'd rather handle by
hand - this is purely an additional, automatic path for new signups.

## How it works

1. A visitor signs in with Google (or any other provider you've enabled) for
   the very first time. Supabase Auth inserts a new row into `auth.users` -
   `auth.users` has exactly one row per unique email, so this insert *is*
   the "first time this email has ever authenticated" signal; nothing else
   needs to check uniqueness.
2. `handle_new_user()` (in `supabase/schema.sql`) already fires on every new
   `auth.users` row to provision default `store_settings`/`profiles` rows -
   it now also generates a random 10-character code, inserts it into
   `redemption_codes` with `duration_days = 7`, and fires an async webhook
   (via Supabase's `pg_net` extension - `net.http_post()`) to this folder's
   `AppsScript.gs`, passing `{ email, code, secret }`. This call is
   fire-and-forget - sign-in never waits on it - and the whole block is
   wrapped in its own exception handler, so a webhook hiccup can never break
   someone's actual sign-in.
3. `AppsScript.gs` checks the shared secret, then emails the code to the new
   account's address with plain instructions: sign in, open Settings ->
   Premium, paste the code into Redeem Code.
4. The new user redeems it exactly like any other code, through the
   existing `redeem_code()` function - Premium still isn't auto-granted the
   way the old `PROMO1` code used to be, the new account just never has to
   ask anyone for a code first.

## Setup, once

1. **Deploy `AppsScript.gs`.** Go to [script.google.com](https://script.google.com)
   -> New project (a plain standalone project, same as `contact-form/` and
   `paypal-premium/` - it doesn't need a Google Sheet). Paste in
   `AppsScript.gs`, then replace:
   - `WEBHOOK_SECRET` with any random string you make up (this is *not* a
     real credential from anywhere else - just a shared password only your
     database and this script know, to stop random callers from turning
     this endpoint into a spam relay).
   - `SITE_URL` if your domain isn't `https://goonlinepos.com`.

   Deploy -> New deployment -> **Web app** -> Execute as **Me** -> Who has
   access **Anyone** (same CORS reasoning as every other Apps Script in this
   repo - Apps Script Web Apps don't reliably send CORS headers back on POST
   responses otherwise, and Supabase's outbound call needs to reach it too).
   Copy the resulting URL (ends in `/exec`).
2. **Test it once** - in the Apps Script editor, replace the test email
   inside `testSendWelcomeTrial()` with your own address, select
   `testSendWelcomeTrial` in the function dropdown, click Run, and confirm
   the email arrives.
3. **Wire the URL and secret into `supabase/schema.sql`.** Search for
   `REPLACE_WITH_YOUR_WELCOME_TRIAL_APPS_SCRIPT_URL` and
   `REPLACE_WITH_YOUR_WELCOME_TRIAL_WEBHOOK_SECRET` inside
   `handle_new_user()` and replace both - the Apps Script URL from step 1,
   and the exact same `WEBHOOK_SECRET` value you put in the script.
4. **Run the updated `supabase/schema.sql`** in the Supabase SQL Editor
   (it's idempotent, safe to re-run) - this both enables the `pg_net`
   extension and installs the updated `handle_new_user()`.
5. **Test with a real fresh sign-in.** Use a Google account that has never
   signed into your site before (or delete the test row from `auth.users`
   in the Supabase dashboard first - Authentication -> Users -> ... -> Delete
   user). Sign in, and confirm: a new row appears in `redemption_codes`
   with `duration_days = 7` and a note starting with "auto welcome trial",
   and the welcome email arrives at that address within a few seconds.

**Never commit `AppsScript.gs` back to this repo with real values filled
in** - the copy in git stays a template with the `REPLACE_WITH_...`
placeholders; your real `WEBHOOK_SECRET` lives only in the deployed Apps
Script project (script.google.com) and in your Supabase project's own copy
of `handle_new_user()` (which also never gets committed back here with real
values).

## If the email doesn't arrive

- Check the Apps Script's own **Executions** log (script.google.com -> your
  project -> Executions) for the most recent run - it'll show `bad_secret`
  if the two `WEBHOOK_SECRET` values don't match, or `bad_request` if
  `email`/`code` came through empty.
- Check Supabase's `pg_net` request log: SQL Editor ->
  `select * from net._http_response order by created desc limit 5;` - this
  shows the actual HTTP status/response your database got back from the
  Apps Script call, which is the fastest way to tell whether Supabase even
  reached the webhook at all.
- Confirm a `redemption_codes` row was created regardless (`select * from
  redemption_codes order by created_at desc limit 5;`) - if there's a row
  but no email, the problem is specifically in the webhook/Apps Script step,
  not the trigger itself; if there's no row either, the code-generation step
  inside `handle_new_user()` itself is failing (check for a typo in the
  pasted SQL) or the account genuinely isn't brand-new (the trigger only
  fires on the very first sign-in for that email).
