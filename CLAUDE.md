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

Client-only, no server, no `fetch`/API calls anywhere. All persistence is
local to the browser.

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
- **"Premium" gating:** a client-side-only paywall.
  `PREMIUM_CODE = "PROMO1"` is hardcoded in the page source, and
  `loadPremiumStatus()` **auto-unlocks premium by default** the first
  time a browser has no saved status (comment in code: "PROMO1 is the
  default, no-expiration code, so start unlocked"). `applyPremiumLocks()`
  just toggles `disabled`/hidden classes on DOM elements (logo upload,
  receipt number/prefix editing, inventory stock editing/export, customer
  screen, downloading the offline package). This is UI-level gating only,
  not a real entitlement check — worth keeping in mind before treating it
  as a security boundary. The downloadable offline copy runs this same
  mechanism with different defaults — see "Download Offline POS" below.
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
  download section/modal HTML, and the whole download-building JS block
  itself (dead code once there's no button to trigger it).
- **Gate B — the offline copy's own Premium lock is separate from the
  live site's.** Two more markers handle this: `/* OFFLINE-SWAP:PREMIUM_CODE
  */` swaps `PREMIUM_CODE` to `OFFLINE_PREMIUM_CODE` (a different code
  than the live site's `PROMO1`), and `/* OFFLINE-STRIP:AUTO-UNLOCK:...
  */` removes the auto-unlock-on-first-load branch, so a freshly
  downloaded offline copy starts **locked** and needs
  `OFFLINE_PREMIUM_CODE` entered once. `OFFLINE_PREMIUM_CODE` is a
  placeholder value in the source — **change it to something not published
  anywhere before distributing**. Like `PREMIUM_CODE`, it's a plain string
  compared client-side inside a file every offline copy ships with, so
  it's a soft/honor-system gate, not real DRM — anyone with dev tools open
  on an offline copy can read it.
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
  offline `app.html` has zero leftover `OFFLINE-STRIP` markers, starts
  Premium-locked, rejects the live site's `PROMO1` code, accepts
  `OFFLINE_PREMIUM_CODE`, and has no download button/modal of its own.

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
