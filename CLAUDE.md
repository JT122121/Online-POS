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
- **Images:** `guide-*.png` (in-app feature screenshots used in help/guide
  content), `favicon.png`, `blog-hero-illustration.svg`.
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
- **Exports:** uses `xlsx.full.min.js` (cdnjs) for `.xlsx` inventory/sales
  reports (`exportInventoryToExcel`, `exportSalesToExcel`) and a
  hand-rolled CSV/text export path (`rowsToCsv`, `downloadTextFile`).
- **Barcode scanning:** `@zxing/browser` (unpkg) drives a camera-based
  scanner (`barcodeReader`), toggleable in Settings; matches scanned code
  against product SKU.
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
  screen). This is UI-level gating only, not a real entitlement check —
  worth keeping in mind before treating it as a security boundary.
- **Cookies/consent + analytics/ads:** `loadAnalyticsAndAds()` at the top
  of the script conditionally injects Google gtag/AdSense based on a
  stored cookie-consent choice (`onlinepos` cookie-banner flow at the
  bottom of the file, separate from the app's own `onlinepos_*` storage
  keys).

## `offline/` — downloadable offline package

A self-contained, zero-network copy of the app for users who want to
download and run GoOnlinePOS without internet access.

- `offline/app.html` / `offline/customer.html` are **generated**, not
  hand-edited — derived from the root `app.html`/`customer.html` by
  `offline/build-offline.py`. Re-run that script after changing the root
  files to keep the offline copies in sync (it asserts on each expected
  edit point, so it fails loudly rather than silently drifting).
- The script: (1) points the `xlsx`/`@zxing/browser` `<script src>` tags
  at `offline/vendor/` instead of cdnjs/unpkg — those two files are
  vendored, unmodified builds pulled from the npm registry (see
  `offline/vendor/LICENSES.txt`); (2) strips the Google Fonts `<link>`
  tags (the CSS already has system-font fallbacks, so this is cosmetic
  only); (3) strips the cookie-consent/GA/AdSense bootstrap script and
  banner markup from `app.html` (nothing to track offline).
- `offline/start-server.sh` / `-mac.command` / `.bat` run a local Python
  `http.server` and open the app at `http://localhost:8080/app.html`.
  This is what makes the customer-screen broadcast
  (`BroadcastChannel`/`localStorage`) and the camera barcode scanner
  reliable across browsers offline — double-clicking `app.html` directly
  via `file://` works too (confirmed in Chromium), but Firefox/Safari can
  isolate separate double-clicked local files from each other, breaking
  cross-tab sync. `offline/README.txt` explains both paths to end users.
- Verified end-to-end with a headless-Chromium smoke test (vendored libs
  load, cart math, checkout, and live customer-screen mirroring across
  two localhost tabs) — zero console/page errors.

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
