# Online-POS (GoOnlinePOS.com)

Static site + single-page POS web app for **goonlinepos.com** (custom domain
via `CNAME`), served straight from this repo (GitHub Pages style — no build
step, no bundler, no package.json). Every page is a standalone `.html` file
with inline `<style>`/`<script>`; there is no framework and no backend.

## Repo layout

- **Marketing/site pages:** `index.html`, `about.html`, `contact.html`,
  `how-it-works.html`, `privacy.html`, `terms.html`, `blog.html` +
  `blog-why-your-business-needs-a-pos.html`
- **`app.html`** (~3,600 lines) — the actual POS application. Everything
  runs client-side in one big inline `<script>` block near the bottom of
  the file.
- **`customer.html`** — a second, lightweight page meant to be opened in a
  separate window/tab/tablet facing the customer; mirrors live order state
  from `app.html`.
- **Images:** `guide-*.png` (in-app feature screenshots used in the
  "Every setting, explained" walkthrough on `index.html`), `favicon.png`,
  `blog-hero-illustration.svg`.
- **SEO/infra:** `CNAME` (`goonlinepos.com`), `robots.txt`, `sitemap.xml`
  (only lists `/`, `/about.html`, `/contact.html`, `/privacy.html`,
  `/terms.html` — **not** `app.html`, `blog.html`, `how-it-works.html`, or
  `customer.html`), `ads.txt` (Google AdSense publisher id).

No README, no CI, no tests, no linter config. History is 50 commits, one
author, mostly titled "Add files via upload" — this repo has been edited
almost entirely through the GitHub web UI, not a local dev workflow.

## `app.html` — architecture

Client-only, no server. All persistence is local to the browser. The one
exception is Premium code activation, which calls out to a Google Apps
Script — see "Premium code validation" below; everything else still has
zero network calls.

- **Storage abstraction** (`hasArtifactStorage`, `storageGet`/`storageSet`):
  prefers `window.storage.get/set` if present (an injected host API — this
  file may also run embedded, e.g. as a Claude/artifact-style sandbox),
  and falls back to `localStorage` with an `"onlinepos_"` key prefix.
  **Always go through `storageGet`/`storageSet`**, never call
  `localStorage` directly for app state, or the injected-host path breaks.
- **Global mutable state** (plain top-level `let`s, no framework/store):
  `cart`, `products`, `salesHistory`, `paymentMethods`, `paymentRows`,
  `cashiers`, `activeCashierName`, `logoDataUrl`, `premiumUnlocked`,
  `receiptPrefix`, `receiptCounterValue`, `currentReceiptNumber`,
  `activeCategory`, `settingsActiveTab`, `editingSaleRecord`,
  `saleDetailItems`/`saleDetailPayments`, `expandedHistoryDates`, barcode
  scanner state (`barcodeReader`, `scannerPollTimer`, ...).
- **`init()`** (bottom of the script, called immediately) sequentially
  awaits `loadSettings → loadPaymentMethods → loadCashiers →
  loadActiveCashier → loadProductsFromStorage → loadLogo →
  loadSalesHistory → loadBackupNoticeState → loadReceiptPrefix →
  loadPremiumStatus → startFirstSale`, then wires up paper size/zoom/date/
  language/receipt rendering and a 1s clock tick.
- **i18n:** one `translations` object keyed by language code — `en`, `ar`,
  `fil`, `hi`, `es`, `th` — each a flat string dictionary. `tr(key)` looks
  up `currentLang()` and falls back to `en`. New user-facing strings must
  be added to **all six** language blocks (or at least `en` as fallback).
- **Cart/checkout:** `addProductToCart` → `computeTotals()` (subtotal →
  discount% → tax% → grand total, all straight percentage math, no
  per-item tax) → `goToCheckout` → split payments via `paymentRows` →
  `printReceipt()`.
- **Sales history:** completed sales pushed into `salesHistory` and
  rendered grouped by date (`renderSalesHistoryPanel`,
  `saleDateKey`/`toggleHistoryGroup`); each sale can be reopened
  (`openSaleDetail`), edited, and reprinted. Summary panel
  (`renderSalesSummary`) breaks totals down by payment method and by
  cashier.
- **Inventory:** optional per-product stock tracking, decremented on sale;
  editable in Settings → Inventory (`renderInventoryList`); exportable.
- **Products:** manual add, or bulk CSV upload (`handleCsvUpload`, columns
  Name/Price/Category/SKU) that **replaces** the whole catalog; "Download
  Sample CSV" and "Clear Products" actions exist.
- **Exports:** uses `xlsx.full.min.js` for `.xlsx` inventory/sales reports
  (`exportInventoryToExcel`, `exportSalesToExcel`) and a hand-rolled
  CSV/text export path (`rowsToCsv`, `downloadTextFile`).
- **Barcode scanning:** `@zxing/browser` drives a camera-based scanner
  (`barcodeReader`), toggleable in Settings; matches scanned code against
  product SKU.
- **Backup/restore:** "Download Backup" serializes all local state to a
  JSON file; "Restore from Backup" (`handleBackupFileSelect`) replaces
  everything and reloads the page. This is the *only* way data survives a
  cleared browser/new device — there is no cloud sync.
- **Customer-facing screen:** `app.html` broadcasts live order state via
  **both** `localStorage.setItem("goonlinepos-customer-screen-state", …)`
  and a `BroadcastChannel("goonlinepos-customer-screen")`
  (`broadcastCustomerScreenState`/`...Order`/`...Completed`).
  `customer.html` listens on the same channel/key and renders the mirror
  view. Because `BroadcastChannel` only reaches same-origin tabs/windows
  on the same device/browser profile, the customer screen only works via
  a second window/extended monitor or OS-level screen mirroring on the
  *same computer* — not a genuinely separate device — and the in-app guide
  (`openCustomerScreenGuide`) says this explicitly.
- **"Premium" gating:** `premiumUnlocked` gates the same set of features
  it always has (logo upload, receipt number/prefix editing, inventory
  stock editing/export, customer screen, downloading the offline
  package) via `applyPremiumLocks()`, which just toggles `disabled`/
  hidden classes on DOM elements — UI-level gating, not a real
  entitlement check. There is **no auto-unlock** — `loadPremiumStatus()`
  reads the stored `pos-premium-unlocked` flag as-is, so a fresh browser
  starts locked and stays that way until a code is activated; once
  activated it stays unlocked locally until that browser's site data is
  cleared (never re-locked automatically). How a code gets *accepted* is
  now two entirely different mechanisms depending on build — see
  "Premium code validation" and "Download Offline POS" below.
  `applyPremiumLocks()` also calls `renderAppTitleBadge()`, which reflects
  actual status in the header — `#premiumBadgeAppTitle` reads "Premium"
  (gold `.premium-badge`) only once really unlocked, "Basic" (gray
  `.basic-badge`) otherwise; it used to always read "Premium" regardless
  of status. `changeLanguage()` also calls it directly, so it re-translates
  on a language switch without needing a status change.
- **`#premiumPromoNotice`** — a dismissible "Activate Your Free Premium
  Now" banner, styled/behaving exactly like the pre-existing
  `#backupNotice` (same `.backup-notice`/`.bn-*` classes, same
  dismiss-persists-via-storage pattern — `pos-premium-promo-dismissed`).
  Shown only while premium isn't unlocked, there's a default code to
  offer (`#premiumCodeDefaultOption` has a value — true for both builds),
  and it hasn't been dismissed; `refreshPremiumPromoNotice()` re-evaluates
  this from both `loadPremiumStatus()` and `unlockPremiumLocally()`, so it
  disappears the moment premium is unlocked through *any* path, not only
  by clicking this banner. Its own button
  (`activateFreePremiumFromNotice()`) is a single click that opens
  Settings, switches to the Premium tab, and immediately activates
  whatever the dropdown's default option is — safe to do unprompted since
  that default is always the local/no-network code (PROMO1 online,
  `OFFLINE_PREMIUM_CODE` offline).
- **Cookies/consent + analytics/ads:** `loadAnalyticsAndAds()` at the top
  of the script conditionally injects Google gtag/AdSense based on a
  stored cookie-consent choice (`onlinepos` cookie-banner flow at the
  bottom of the file, separate from the app's own `onlinepos_*` storage
  keys).

## `vendor/` — self-hosted third-party libraries

Root-level `vendor/xlsx.full.min.js`, `vendor/zxing-browser.min.js`, and
`vendor/jszip.min.js` are unmodified builds pulled straight from the npm
registry (`vendor/LICENSES.txt` has versions/licenses/attribution).
`app.html` loads all three via local `<script src="vendor/...">` tags —
**not** cdnjs/unpkg — so the live site has zero third-party CDN
dependency. `customer.html` needs none of them. `jszip.min.js` is used
only by the "Download Offline POS" feature below; the other two are also
what gets pulled into the generated offline package.

## Premium code validation (live site only)

The live site auto-grants Premium to every visitor — no code entry
required — while still validating that grant against a Google Sheet the
site owner edits directly (not hardcoded in this file), through a Google
Apps Script Web App (`activatePremiumCode()`/`autoGrantDefaultPremium()`,
inside the `/* OFFLINE-SWAP:PREMIUM-ACTIVATION:START/END */` marked
block). Full setup/schema/deployment steps are in
`premium-validation/README.md` and `premium-validation/AppsScript.gs`;
short version:

- **`loadPremiumStatus()` auto-grants Premium on a brand-new visit** — it
  calls `autoGrantDefaultPremium()` whenever the stored
  `pos-premium-unlocked` flag is `null` (i.e. truly first-ever visit, or a
  fresh offline install), with zero clicks required. That function looks
  `DEFAULT_PREMIUM_CODE` ("PROMO1") up against the sheet first so the real
  "Valid until" date from column B shows immediately, falling back to a
  local-only grant (no validity shown) only if the lookup can't be
  reached — so a visitor is never blocked by an infrastructure hiccup. A
  lookup that succeeds but comes back expired/seat-limited/invalid does
  **not** auto-grant; the visitor is simply left in the normal locked
  state. `activatePremiumCode()` (manual entry) gives PROMO1 the same
  network-first-with-local-fallback treatment; any other code has no such
  fallback and shows the network-error message if unreachable.
  `handlePremiumCodeSelectChange()`/`getEnteredPremiumCode()`/
  `unlockPremiumLocally()`/`openPremiumCodeEdit()`/`cancelPremiumCodeEdit()`
  are shared with the offline build (they live outside the
  `PREMIUM-ACTIVATION` swap block) — only *which* code counts as valid,
  and whether checking one touches the network, differs per-build.
- Settings → Premium is a `<select id="premiumCodeSelect">` defaulting to
  PROMO1 (offline build: its own `OFFLINE_PREMIUM_CODE`, swapped in via
  the `<!-- OFFLINE-SWAP:DEFAULT-CODE-OPTION:START/END -->` marker so the
  dropdown never advertises the wrong code for the build), with an
  "Enter a different code…" option that reveals `#premiumCodeInput` for
  anything else.
- A "Change code" link next to the "Premium is active" status re-reveals
  the form (`openPremiumCodeEdit()`, gated by the in-memory
  `premiumEditMode` flag — not persisted) so someone can switch to a
  different code — e.g. swap the auto-granted PROMO1 for a real purchased
  one — without clearing the browser's site data. `#premiumCancelEditBtn`
  backs out without changing anything; successfully activating any code
  (`unlockPremiumLocally()`) always clears edit mode back to the plain
  status view.
- `PREMIUM_VALIDATION_URL` (near the top of the marked block) must be
  your deployed Apps Script's `/exec` URL. It's fine for this URL to be
  public (it's a validation proxy, not the spreadsheet) — the actual
  sheet ID/URL never appears anywhere in this repo or in `app.html`; the
  Apps Script reaches its bound sheet via
  `SpreadsheetApp.getActiveSpreadsheet()`.
- Each browser gets a random, persisted `pos-device-id`
  (`getDeviceId()`). A code is capped at `MAX_SEATS` (5) simultaneously
  active devices, on a `SEAT_WINDOW_DAYS` (30-day) rolling window enforced
  server-side in the Apps Script — a device that stops checking in for
  that long silently frees its seat. **PROMO1 (`UNLIMITED_CODES` in
  `AppsScript.gs`) is exempt from this cap** — since every new visitor
  auto-activates it over the network, capping it at 5 devices would lock
  out the site after its 5th visitor. Real sheet-issued codes are not
  exempt, and this exists to blunt one purchased code being
  shared/leaked indefinitely, not to build real license management.
- The sheet's Validity column **is enforced, but only at the moment a
  code is looked up** — auto-grant, a manual Activate, or the background
  heartbeat. A date in the past there makes that lookup return `expired`
  instead of `ok` (shown via the `premiumCodeExpired` message). This is
  **not retroactive**: once a code has been successfully accepted on a
  browser, that browser stays unlocked locally (`pos-premium-unlocked`)
  until its site data is cleared, even if the code expires later — an
  expired/error response from a later lookup (e.g. the heartbeat) never
  revokes access already granted, it only blocks a *new* activation.
  Leave the sheet's Validity cell blank for a code that should never
  expire. `heartbeatPremiumCode()` pings the endpoint in the background
  on load purely to keep an already-active seat "warm" (refresh
  `LastSeen` server-side).
- Failure modes are split four ways in the UI: unknown code
  (`premiumCodeInvalid`), code found but past its Validity date
  (`premiumCodeExpired`), code found but at its device cap
  (`premiumCodeSeatLimit`), and the endpoint being unreachable
  (`premiumCodeNetworkError`).
- **`checkPremiumCode()` calls the Apps Script with GET, not POST** —
  `?code=...&deviceId=...` query params, handled by `AppsScript.gs`'s
  `doGet()` (the real handler; `doPost()` is kept only as a fallback).
  This was a deliberate fix, not the original design: Apps Script Web
  Apps have a documented history of not reliably sending CORS headers
  back on POST responses, so a cross-origin `fetch()` POST fails in the
  browser with "CORS request was blocked because of invalid or missing
  response headers" even though the identical request works fine as a
  direct browser visit or via curl (neither enforces CORS). GET doesn't
  have this problem. Confirmed live against the site owner's actual
  deployment. If `PREMIUM_VALIDATION_URL` is reachable but every code
  still fails with the network-error message, re-check the deployment's
  access setting is exactly **Anyone** (not "Anyone with a Google
  account" or "Only myself") — either of those redirects requests to a
  Google sign-in page instead of running the script, which fails the
  same way.
- Verified end-to-end against a mock endpoint standing in for the real
  Apps Script (can't deploy the real one without the site owner's Google
  account): a fresh visit auto-grants Premium with zero clicks and shows
  the real validity date, a validation-URL-unreachable fresh visit still
  auto-grants PROMO1 locally with no validity shown, a fresh visit where
  the lookup reports PROMO1 expired does **not** auto-grant and the badge
  stays "Basic", and manually activating an expired code shows the
  expired message. The Apps Script's own logic (`findCode`,
  `checkOrClaimSeat`, `validateCode` — expiration, blank-validity-never-
  expires, PROMO1's unlimited seats, a real code still capped at 5) is
  separately unit-tested in isolation against mocked Sheets/Lock/Content
  objects.
- Every `AppsScript.gs` edit requires deploying a **new version** (Deploy
  → Manage deployments → edit → New version) before it takes effect on
  the existing `/exec` URL — the URL itself doesn't change, but the code
  behind it does nothing until redeployed.
- `renewFreeCodes()` + `installRenewalTrigger()` (in `AppsScript.gs`)
  keep every sheet row's Validity date from ever landing in the past —
  a time-driven trigger (installed once by running
  `installRenewalTrigger` manually, not via deployment) runs
  `renewFreeCodes()` every 3 hours, pushing every row's Validity date
  (any cell that's an actual date) out to `FREE_CODE_RENEWAL_DAYS` (90)
  days from whenever it last ran. Applies to every code, no exceptions —
  a code only opts out by leaving its Validity cell blank in the sheet
  (which already means "never expires"). This means in practice no code
  with a date ever actually reaches its expiration in production, as
  long as the trigger keeps running — the `expired` check in
  `validateCode()` still exists and is still unit-tested, but is now a
  safety net rather than something real codes are expected to hit.

## "Download Offline POS" (Premium) — dynamic offline package

Settings → Backup has a Premium-gated "Download Offline POS" button that
builds a self-contained, zero-network `.zip` of the app **live, client-side,
in the browser**, rather than serving a pre-built file — so it's always
exactly what's currently deployed, with no separate build/publish step to
remember. The whole mechanism lives inside `app.html` itself:

- Clicking the button opens a modal (`#offlineDownloadOverlay`) with a
  condensed how-to-use summary, the update/migration flow (re-download
  anytime Premium is active; move data over with existing Backup/Restore),
  and a required "I agree to the Terms of Service" checkbox that gates the
  actual download — see `confirmOfflineDownload()`.
- On confirm, it `fetch()`es the **currently live** `app.html` and
  `customer.html` (same-origin, `cache: "no-store"`) plus the static
  ingredients under `offline/` (`README.txt`, the three `start-server.*`
  launchers, `offline/vendor/LICENSES.txt`) and the two libraries from
  root `vendor/`, runs `app.html`'s text through `buildOfflineAppHtml()`,
  zips everything with JSZip, and triggers the download
  (`GoOnlinePOS-Offline.zip`).
- `buildOfflineAppHtml()`/`buildOfflineCustomerHtml()` edit the fetched
  HTML by stripping `<!-- OFFLINE-STRIP:<name>:START/END -->` (HTML) or
  `/* OFFLINE-STRIP:<name>:START/END */` (JS) marker comments already
  present in `app.html`/`customer.html` — **search `OFFLINE-STRIP` to find
  every edit point** before restructuring any of the marked sections, or
  the generated package silently drops the edit (a `console.warn` fires
  if a marker goes missing, but nothing hard-fails). Currently stripped:
  Google Fonts links, the cookie-consent/GA/AdSense bootstrap + banner,
  the "Cookie Settings" footer link, the `jszip.min.js` script tag, the
  download section/modal HTML, the Premium heartbeat call site (no
  network calls offline), and the whole download-building JS block
  itself (dead code once there's no button to trigger it).
- **Gate B — the offline copy's own Premium lock is separate from the
  live site's.** The `/* OFFLINE-SWAP:PREMIUM-ACTIVATION:START/END */`
  marked block (the live site's Google-Sheet-validated activation flow —
  see "Premium code validation" above) gets replaced wholesale with a
  simple local `entered === OFFLINE_PREMIUM_CODE` string compare, so a
  downloaded copy needs zero network to unlock — it never even starts out
  auto-unlocked (same as the live site). `OFFLINE_PREMIUM_CODE` is a
  placeholder value in the source — **change it to something not published
  anywhere before distributing**. It's a plain string compared
  client-side inside a file every offline copy ships with, so it's a
  soft/honor-system gate, not real DRM — anyone with dev tools open on an
  offline copy can read it. This is deliberately disconnected from the
  live site's sheet/seat-limit system (per design: the download button
  itself already required being Premium online, so the offline copy
  doesn't need to re-prove that against the network).
- `offline/README.txt` + `offline/start-server.sh` / `-mac.command` /
  `.bat` are static, rarely-changing files (not generated) that get pulled
  into the zip as-is. The launchers run a local Python `http.server` and
  open the app at `http://localhost:8080/app.html` — this is what makes
  the customer-screen broadcast (`BroadcastChannel`/`localStorage`) and
  the camera barcode scanner reliable across browsers offline;
  double-clicking `app.html` directly via `file://` also works (confirmed
  in Chromium) but Firefox/Safari can isolate separate double-clicked
  local files from each other, breaking cross-tab sync.
- There is **no committed static copy** of the offline package anymore
  (an earlier `offline/app.html`/`offline/customer.html`/
  `offline/build-offline.py` were retired in favor of this always-current
  mechanism) — don't recreate them as a separate, driftable source of
  truth. If you need a one-off zip outside the browser flow, drive the
  live button instead.
- Verified end-to-end with headless Chromium: live download flow produces
  a valid zip (correct files, correct unix exec permissions on the
  launcher scripts via `generateAsync({ platform: "UNIX" })` — that option
  is required or the shell scripts extract non-executable); the generated
  offline `app.html` has zero leftover `OFFLINE-STRIP`/`OFFLINE-SWAP`
  markers, starts Premium-locked, rejects a live-site sheet code, accepts
  `OFFLINE_PREMIUM_CODE` with zero network calls, and has no download
  button/modal of its own.

## `customer.html`

Minimal receiver page: opens a `BroadcastChannel("goonlinepos-customer-screen")`
and also reads `localStorage["goonlinepos-customer-screen-state"]` (the
`STATE_KEY`) as a fallback/initial-state source, then renders whatever
order/payment/completed state `app.html` last broadcast.

## Conventions / working on this repo

- No build/test/lint tooling exists — verify changes by opening the HTML
  file directly (or a local static server) and exercising the UI; there is
  nothing to `npm install` or `npm run`.
- Keep new persisted keys behind `storageGet`/`storageSet`, not raw
  `localStorage`, to preserve the embedded-host code path.
- Keep `sitemap.xml` in mind if adding/removing indexable marketing pages
  (it currently omits `app.html`, `customer.html`, `blog.html`, and
  `how-it-works.html` — unclear if intentional).
- Git workflow observed in history: work happens on `main`; this session's
  designated branch is `claude/repo-code-access-jpjg54`.
