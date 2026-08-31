# PayPal purchase -> automatic Premium (no code needed)

Before this, the only way to get Premium was a code the site owner typed into
Supabase's Table Editor by hand after being contacted directly (see "Buy
Premium Code" in `app.html`). This folder adds a second, automatic path
alongside that one - a real PayPal payment on any of the pricing tiers already
shown in the Buy Premium modal (3-Day Trial/1 Month/3 Months/1 Year) grants
Premium immediately, with nothing for the site owner to do per sale.
Manually-created codes still work exactly as before, for trials, giveaways,
or anyone you'd rather handle by hand.

## How it works

1. `app.html`'s Buy Premium modal renders a real PayPal Smart Payment Button
   under each pricing tier (only once the visitor is signed in - a button
   needs to know *whose* account to credit). Clicking one creates a PayPal
   order for that tier's price, tagged with the signed-in user's Supabase id
   (`custom_id`).
2. The buyer approves and pays through PayPal's own popup/redirect - their
   card details never touch this site at all.
3. Once PayPal confirms the payment client-side, the browser calls
   `AppsScript.gs` in this folder with just `{ orderID, userId }` - not
   secrets, just references.
4. `AppsScript.gs` does **not** trust that call by itself. It calls PayPal's
   own REST API directly, using your PayPal Client ID/Secret, and asks PayPal
   "is order `orderID` actually `COMPLETED`, for how much, and for which
   `custom_id`?" Only if PayPal's own answer confirms a completed payment for
   a recognized amount and the matching user id does it proceed.
5. It then calls the `grant_premium_from_paypal()` Postgres function (see
   `supabase/schema.sql`) using your Supabase **service role** key, which
   extends that user's Premium and logs the purchase in a new
   `paypal_purchases` table - a permanent record you can query anytime for
   your own bookkeeping.

Nothing here needs Cloud Sync or any account access beyond what Account &
Subscription already has - this only ever writes to `profiles.premium_until`
for the paying user's own row, the same column `redeem_code()` already
writes to.

## Setup, once

1. **Get PayPal API credentials.** Go to
   [developer.paypal.com](https://developer.paypal.com) → Apps & Credentials.
   Start in **Sandbox** mode (its own tab) - this lets you test full
   purchases with fake money before ever touching real payments. Create an
   app if you don't have one; copy its **Client ID** and **Secret**.
2. **Run the updated schema.** In the Supabase SQL Editor, run the current
   `supabase/schema.sql` again (it's idempotent, safe to re-run) so the new
   `paypal_purchases` table and `grant_premium_from_paypal()` function exist.
3. **Get your Supabase service role key.** Supabase dashboard → Project
   Settings → API → the `service_role` secret (not the `anon`/publishable
   key already in `modules/account.js` - this one bypasses Row Level
   Security entirely and must stay out of the repo and out of any
   client-side code, forever). Copy it somewhere safe for the next step.
4. **Deploy `AppsScript.gs`.** Go to [script.google.com](https://script.google.com)
   → New project (a plain standalone project, same as `contact-form/` - it
   doesn't need a Google Sheet). Paste in `AppsScript.gs`, then replace:
   - `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` with the Sandbox values from
     step 1.
   - `SUPABASE_SERVICE_ROLE_KEY` with the key from step 3.

   Deploy → New deployment → **Web app** → Execute as **Me** → Who has
   access **Anyone** (same CORS reasoning as `contact-form/README.md` and
   `premium-validation/README.md` - any other setting makes every
   cross-origin call from the site fail) → Deploy. Copy the resulting URL
   (ends in `/exec`).
5. **Wire up `app.html`.** Search for `PAYPAL_CLIENT_ID` and
   `PAYPAL_VERIFY_URL` near the top of the Buy Premium modal's script and
   replace both placeholders - the Client ID from step 1, the Apps Script
   URL from step 4.
6. **Test with a Sandbox buyer account.** developer.paypal.com → Sandbox →
   Accounts gives you fake buyer accounts with fake money, ready to use.
   Sign in to the live site with a real Google account, open Buy Premium,
   pay with a Sandbox account on any of the tiers, and confirm Premium
   activates within a few seconds (check the header badge, or query
   `paypal_purchases` in Supabase for the new row).
7. **Go live.** Once you're satisfied, switch PayPal's own dashboard to
   **Live** mode and create a live app there (a separate Client ID/Secret
   from Sandbox). In `AppsScript.gs`, update `PAYPAL_CLIENT_ID`/
   `PAYPAL_CLIENT_SECRET` to the live values and change `PAYPAL_API_BASE`
   from `https://api-m.sandbox.paypal.com` to `https://api-m.paypal.com`,
   then push a **new deployment version** (Deploy → Manage deployments →
   edit → New version) so the live URL picks up the change. Update
   `PAYPAL_CLIENT_ID` in `app.html` to the live Client ID too.

**Never commit `AppsScript.gs` back to this repo with real values filled
in** - the copy in git stays a template with the `REPLACE_WITH_...`
placeholders; your real credentials live only in the Apps Script project
itself (script.google.com), which is entirely separate from this GitHub
repo.

## A known, honest limitation

This intentionally does **not** use PayPal's official webhook-signature
verification, because Apps Script's `doPost(e)` cannot read the custom HTTP
headers (`PAYPAL-TRANSMISSION-SIG` etc.) that verification needs - a real
platform limitation, not an oversight. Instead, the browser tells this script
"go check order X" right after payment, and the script independently
confirms with PayPal before granting anything - which is secure (nobody can
fake "order X is COMPLETED" except PayPal itself) but does mean: if a buyer's
connection drops or they close the tab in the few seconds between paying and
that verification call completing, PayPal will have been paid but Premium
won't auto-grant. This should be rare in practice, and when it happens the
existing manual path is still there as a fallback - check PayPal's own
Transactions dashboard, cross-reference `paypal_purchases` in Supabase to
confirm nothing was recorded for that order, and redeem them a normal code
by hand (or insert a `paypal_purchases` row / call `grant_premium_from_paypal`
directly from the SQL Editor) the same way you always could.

## Why `grant_premium_from_paypal()` is locked down so tightly

Unlike `redeem_code()`, which is safe to expose to any signed-in visitor
(it requires possessing a real, unused code), `grant_premium_from_paypal()`
has no such check built in - it just extends whoever's `user_id` it's given.
If it were callable with the ordinary `anon`/`authenticated` key, anyone
could grant themselves unlimited free Premium by calling it directly with a
made-up order id. It's only ever granted to the **service role**, which is
why the verification step has to happen in a real backend (this Apps
Script) rather than client-side JavaScript - the service role key can never
be shipped to a browser.
