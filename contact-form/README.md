# Contact form (OTP-verified email)

`contact.html`'s contact form doesn't send email directly from the browser
(there's no server for it to talk to) - it calls `AppsScript.gs` in this
folder, a small Google Apps Script Web App that:

1. **`action=requestOtp`** - takes a name, email, and message, emails a
   6-digit verification code to that email address, and holds the message
   in a short-lived server-side cache (not a spreadsheet - see below).
2. **`action=verifyOtp`** - takes an email and a code; if it matches what's
   cached (and hasn't expired), it sends **two** emails and reports success:
   - to **you**, subject `GoOnlinePOS.com Site Inquiry`, with their name,
     email, and message - `Reply-To` is set to their address, so you can
     just hit Reply in Gmail to answer them directly.
   - to **them**, same subject, a short "thanks, I got your message and
     will get back to you" auto-reply that echoes their message back, with
     a line making clear it's an automated message.

This whole thing exists to solve one problem without exposing your email
address in the page source (where scrapers grab it) or asking visitors to
sign up for anything: a visitor has to prove they control the email address
they typed before their message actually reaches you, which keeps the vast
majority of contact-form spam out.

**Setup, once:**

1. Go to [script.google.com](https://script.google.com) → **New project**.
   Unlike `premium-validation/AppsScript.gs`, **this script does not need
   to be created from inside a Google Sheet** - it never calls
   `SpreadsheetApp`, so a plain standalone project is correct and simpler.
2. Paste in `AppsScript.gs`, replacing the placeholder
   `OWNER_EMAIL` near the top with the Gmail address you want inquiries
   sent to. This should be the same Google account you'll deploy the
   script under - `MailApp.sendEmail()` always sends *from* whichever
   account authorized the script, so if you deploy under a different
   account than the one you want to receive replies at, use that account's
   own address for `OWNER_EMAIL` (you'll still get "Site Inquiry" emails
   sent to it either way).
3. Deploy → New deployment → **Web app** → Execute as **Me** → Who has
   access **Anyone** (must be exactly this - "Anyone with a Google
   account" or "Only myself" makes every cross-origin request from the
   website fail, the same CORS behavior documented in
   `premium-validation/README.md`) → Deploy. Grant the permissions it asks
   for (it needs to send email as you). Copy the resulting URL (ends in
   `/exec`).
4. In `contact.html`, search for `CONTACT_FORM_URL` and replace the
   placeholder with that URL.
5. Any time you edit `AppsScript.gs` afterward, push a **new deployment
   version** (Deploy → Manage deployments → edit → New version) for the
   live URL to pick up the change - same as the Premium script.

**Where the message actually lives between the two steps:** `CacheService`
(`CacheService.getScriptCache()`), not a spreadsheet. It's a simple
key-value store built into every Apps Script project with a built-in
expiration, which is exactly what a one-time verification code needs and
means there's nothing to set up (no sheet, no tab names to get right) and
nothing left behind afterward - a verified inquiry is emailed out and the
cache entry is deleted in the same step; an abandoned one (someone requests
a code and never enters it) simply expires on its own after
`OTP_TTL_SECONDS` (1 minute) with nothing to clean up manually. This is a
deliberate difference from `premium-validation/AppsScript.gs`, which *does*
need a spreadsheet since Premium seat records have to persist indefinitely
- there's nothing here that needs to survive longer than one contact-form
submission.

**Constants at the top of `AppsScript.gs`, all safe to tune:**

- `OTP_TTL_SECONDS` (60 = 1 minute) - how long a code stays valid. Set to
  match `RESEND_COOLDOWN_SECONDS` deliberately - a code lasts exactly as
  long as the wait before "Resend code" unlocks, so a visitor is never
  stuck holding an expired code with no way to request a fresh one yet.
- `RESEND_COOLDOWN_SECONDS` (60) - minimum gap between two OTP requests
  for the same email address, so "Resend code" can't be hammered.
- `MAX_VERIFY_ATTEMPTS` (5) - wrong-code guesses allowed before the code
  is invalidated outright and a fresh one has to be requested. Guessing
  wrong doesn't extend the code's lifetime either - it always expires at
  its original 1-minute mark regardless of how many attempts were made
  against it.

**Why `contact.html` calls this with GET, not POST:** the exact same
CORS behavior documented in `premium-validation/README.md` - Apps Script
Web Apps don't reliably send CORS headers back on POST responses, so a
cross-origin `fetch()` POST fails in the browser even though the identical
request works fine as a direct visit or via curl. `doPost()` exists only
as a fallback and will hit the same issue if actually called cross-origin.

**Debugging "I never got the code" or "the inquiry email never arrived":**
run **`testSendOtp`** from the function dropdown in the Apps Script editor
(edit the placeholder test email at its top first), then **View → Logs**
- it prints the raw JSON response, which tells you immediately whether the
call itself failed (`ok: false`) versus the email just landing in spam.
Also double-check the deployment's access is exactly **Anyone** (see step
3) - a wrong setting here fails silently from the website with a generic
"couldn't reach the server" message, the same class of mistake documented
for the Premium script.

No spreadsheet, sheet URL, or sheet ID is involved anywhere in this setup
- there's nothing to bind this script to.
