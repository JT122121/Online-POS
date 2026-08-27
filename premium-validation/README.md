# Premium code validation

The live site's Premium codes live in a Google Sheet, not in `app.html`.
`AppsScript.gs` in this folder is a Google Apps Script that reads that
sheet and is what `app.html` calls to check a code.

**Setup, once:**

1. In the Google Sheet, make sure the tab with your codes is named
   exactly `Premium Code`, with the code in column A and an (informational
   only — see below) validity date in column B.
2. Extensions → Apps Script in that sheet, paste in `AppsScript.gs`,
   then Deploy → New deployment → **Web app** → Execute as **Me** →
   Who has access **Anyone** (must be exactly this — "Anyone with a
   Google account" or "Only myself" makes every cross-origin request
   from the website fail) → Deploy. Copy the resulting URL (ends in
   `/exec`).
3. In `app.html`, search for `PREMIUM_VALIDATION_URL` and replace the
   placeholder with that URL.
4. Any time you edit `AppsScript.gs` afterward, you have to push a new
   deployment version (Deploy → Manage deployments → edit → new version)
   for the live URL to pick up the change.

The script creates a second tab, `Active Sessions`, on its own the first
time it runs — you don't need to create it. That's where it tracks which
browsers ("devices") have activated which code, to enforce the per-code
seat limit (`MAX_SEATS`, currently 5) on a rolling window
(`SEAT_WINDOW_DAYS`, currently 30 days — a browser that goes quiet longer
than that frees its seat automatically). Both are constants at the top of
`AppsScript.gs` if you want to change them.

**What this does and doesn't gate:**

- Only the *live website's* code entry (Settings → Premium) calls this.
- The downloadable offline package has its own separate, fully local code
  (`OFFLINE_PREMIUM_CODE` in `app.html`) and never calls this — it has no
  internet to call it with. See `CLAUDE.md`.
- The Validity column is shown to the user ("Valid until: …") but isn't
  enforced — a code doesn't stop working when that date passes. Once a
  browser has successfully activated a code, it stays unlocked locally
  until that browser's site data is cleared; this script is never
  consulted again to decide whether to lock it back out (a background
  heartbeat pings it occasionally just to keep the seat "warm," but its
  result is never used to revoke local access).

No spreadsheet URL or ID appears anywhere in this repo — the script is
bound directly to the sheet (`SpreadsheetApp.getActiveSpreadsheet()`), so
it never needs to reference it, and `PREMIUM_VALIDATION_URL` in `app.html`
is the Apps Script's own URL, not the sheet's.

**Why the app calls this with GET, not POST:** Google Apps Script Web
Apps have a long-documented history of not reliably sending CORS headers
back on POST responses — the browser blocks the response with "CORS
request was blocked because of invalid or missing response headers,"
even though the exact same call works fine as a direct browser visit or
via a tool that doesn't enforce CORS (curl, Postman). GET requests don't
have this problem, so `checkPremiumCode()` in `app.html` sends
`?code=...&deviceId=...` as query params and `AppsScript.gs`'s `doGet()`
is the real handler; `doPost()` is kept only as a fallback and will hit
the same CORS issue if actually called cross-origin.
