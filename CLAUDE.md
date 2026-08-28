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
  "Every setting, explained" walkthrough on `index.html`), `favicon.png` /
  `favicon.ico` (same artwork, PNG-in-ICO — kept in sync manually, see
  below), `og-image.jpg` (shared 1200×630 social-share card),
  `blog-hero-illustration.svg`.
- **SEO/infra:** `CNAME` (`goonlinepos.com`), `robots.txt`, `sitemap.xml`
  (lists `/`, `app.html`, `how-it-works.html`, `about.html`, `blog.html`,
  `blog-why-your-business-needs-a-pos.html`, `contact.html`, `privacy.html`,
  `terms.html` — every page whose own `<meta name="robots">` says
  `index, follow`; `customer.html` is correctly excluded, its own meta tag
  says `noindex, nofollow`), `ads.txt` (Google AdSense publisher id).

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
- **Header toolbar toggle:** `.header-actions` wraps its 8 shortcut
  buttons (Premium/Backup/Settings/Summary/Print/Inventory/Customer
  Screen/New Sale) in `#headerActionsGroup` (`display: contents`, so it
  doesn't affect the flex layout), preceded by `#toolbarToggleBtn`
  (`toggleToolbar()`) which toggles `.hidden` on that group to collapse
  the whole row down to just itself — reclaiming vertical space for the
  product grid/receipt below. Deliberately **collapses all 8 buttons
  together, including Print and New Sale** (not just the occasional/
  admin ones) per an explicit choice to prioritize maximum space over
  keeping per-sale actions always pinned. Deliberately **not persisted**
  — every fresh page load starts expanded regardless of what was chosen
  last time; `renderToolbarToggle()` keeps the button's own label
  (`toolbarHideLabel`/`toolbarShowLabel`) in sync with its current state
  and re-syncs it on every language switch.
- **Resizable product/receipt split:** `.app` is a 3-column CSS grid —
  `.left-panel` (catalog/checkout), `#panelResizeHandle` (a thin
  draggable divider), `.preview-area` (the receipt) — sized via the
  `--catalog-width` CSS custom property, defaulting to **75%** for the
  product side (`.app { grid-template-columns: minmax(320px,
  var(--catalog-width, 75%)) 14px minmax(220px, 1fr); }`). Chosen
  because `.receipt` has a fixed `width: 80mm` regardless of its
  container, so giving the receipt more than ~25% of a wide desktop
  screen is empty background space better spent on the catalog —
  especially now that products can carry photos. `initPanelResize()`
  wires mouse **and touch** drag (POS terminals are often touchscreens)
  on the handle, clamping the product side to 35%–85%; double-clicking
  the handle resets it to 75%. The chosen ratio **persists** via
  `storageGet`/`storageSet("pos-catalog-width")` and is applied by
  `loadPanelSplit()` before first paint. On mobile (`max-width: 900px`)
  `.app` already switches to a vertical flex stack, so
  `.panel-resize-handle` is simply hidden there — dragging left/right
  makes no sense once the panels aren't side-by-side.
- **Header brand mark is not a link.** `.brand` (logo + title + Premium
  badge) is a plain `<div>`, not an `<a href="index.html">` — it used to
  double as an unguarded way back to the homepage, but that bypassed
  the in-progress-cart safety check entirely (`cart` is in-memory only,
  never persisted — navigating away loses it) and was easy to trigger
  by accident. The only way back to the homepage now is the explicit
  **`#homeShortcutButton`** ("🏠 Home", last item in the header
  toolbar) → `goHome()`, which confirms first via `goHomeConfirm` if
  `cart.length` is non-zero, then navigates.
- **Product photos:** each `products[]` entry has an optional `photo`
  field (a compressed JPEG data URL) alongside `name`/`price`/
  `category`/`sku`/`stock`. `compressProductPhoto(file)` downsizes any
  upload to a max **160px** dimension and re-encodes at JPEG quality
  0.72 via canvas before it's ever stored — a typical photo lands
  around 1KB as a data URL, keeping the whole catalog well within
  localStorage's ~5-10MB budget even with photos on every product.
  `productThumbHtml(photo, sizeClass)` is the single shared renderer
  used by the main catalog (`renderProductCatalog`), Settings →
  Inventory (`renderInventoryList`), and Settings → Products'
  editable list (`renderManageProductsList`) — it renders the `<img>`
  when `photo` is set, or a `.product-thumb-placeholder` (a plain 📦
  emoji, zero extra bytes, no asset file) when it's empty. CSV-imported
  products always get `photo: ""`, since there's no practical way to
  carry binary image data through a CSV a shop owner edits in a
  spreadsheet — they fall back to the placeholder automatically, same
  as any manually-added product that skipped the photo step. Settings →
  Products has a photo upload row above the "Add Product" form
  (`newProductPhotoDataUrl`, reset after each add); each existing
  product's thumbnail in the manage-list is itself a clickable
  `<label>` wrapping a hidden file input (`handleExistingProductPhotoUpload`)
  so re-uploading is a single click, no separate "edit" mode needed.
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
  CSV/text export path (`rowsToCsv`, `downloadTextFile`). Sales History
  (Settings → Sales History) has optional `#salesExportFrom`/
  `#salesExportTo` date pickers, both blank by default (= export
  everything, the original behavior) — `filterSalesHistoryByDateRange()`
  filters `salesHistory` by `saleDateKey()` before
  `buildSalesExportRows()` builds the sheet, so both the `.xlsx` path
  and its CSV fallback respect the same range; `salesExportFileSuffix()`
  names the downloaded file after the chosen range (e.g.
  `sales-report-2026-08-01_to_2026-08-31.xlsx`) instead of just today's
  date when a range is set. A range matching zero sales shows
  `salesExportRangeEmptyAlert` rather than downloading an empty file.
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
  validity value from column B shows immediately, falling back to a
  local-only grant (no validity shown) only if the lookup can't be
  reached — so a visitor is never blocked by an infrastructure hiccup. A
  lookup that succeeds but comes back seat-limited/invalid does **not**
  auto-grant; the visitor is simply left in the normal locked state.
  `activatePremiumCode()` (manual entry) gives PROMO1 the same
  network-first-with-local-fallback treatment; any other code has no such
  fallback and shows the network-error message if unreachable.
  `handlePremiumCodeSelectChange()`/`getEnteredPremiumCode()`/
  `unlockPremiumLocally()`/`openPremiumCodeEdit()`/`cancelPremiumCodeEdit()`
  are shared with the offline build (they live outside the
  `PREMIUM-ACTIVATION` swap block) — only *which* code counts as valid,
  and whether checking one touches the network, differs per-build.
- A `#premiumShortcutButton` ("👑 Premium") sits in the main screen's
  header toolbar (`.header-actions`, alongside Backup/Settings/Summary/
  Print/Inventory/Customer Screen/New Sale) so Settings → Premium is
  reachable in one click from the main screen instead of needing
  Settings → the Premium tab specifically. `openPremiumSettings()`
  opens `#settingsOverlay` and calls `selectSettingsTab("premium")`,
  the same pattern `openBackupSettings()`/`openInventoryPanel()` already
  use for their own shortcut buttons.
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
  (`getDeviceId()`). A code is capped at a maximum number of
  simultaneously active devices, on a `SEAT_WINDOW_DAYS` (30-day) rolling
  window enforced server-side in the Apps Script — a device that stops
  checking in for that long silently frees its seat. The cap is
  `MAX_SEATS` (5) by default, except for entries in `CODE_SEAT_LIMITS`
  (`AppsScript.gs`) which override it per-code — currently just
  `{ "PROMO1": 30 }`, since every new visitor auto-activates PROMO1 over
  the network and a 5-device cap would lock out the site after only 5
  visitors ever. This is a deliberate soft cap while the site is new
  (chosen over full exemption), not full unlimited — the site owner can
  raise it, lower it, or remove PROMO1 from `CODE_SEAT_LIMITS` entirely
  (reverting it to the default 5) as traffic grows. Real purchased codes
  get the default `MAX_SEATS` (5) unless explicitly added to
  `CODE_SEAT_LIMITS`, to blunt one code being shared/leaked indefinitely
  — not to build real license management.
- **`#specialAccessBadge`** — a small blue pill next to the header's
  Premium badge, reading "Special Access", shown only when the code
  actually used to unlock (`pos-premium-code-used`, checked in
  `renderAppTitleBadge()`) is literally `"PROMO1"` — i.e. it marks
  access granted through the free/promotional program specifically, not
  a real purchased code, and never shows on the offline build (whose own
  default code is a different string). Explicitly a **temporary
  placeholder** while the site is new and building an audience — the
  site owner intends to remove it later once they decide; it's isolated
  to one CSS class, one HTML element, and a few lines in
  `renderAppTitleBadge()`, deliberately kept simple to delete later.
- **Codes never expire.** The sheet's Validity column is purely
  informational — shown to the user as "Valid until: …" via
  `renderPremiumValidity()` — and is never checked against today's date.
  Column B can hold a date (displayed as `dd-MMM-yyyy`), plain text like
  `Life Time Access` (displayed verbatim), or be left blank (nothing
  shown). This was a deliberate simplification after an earlier
  expiration-enforcement design proved to be an operational trap: an
  expired `PROMO1` row silently stopped the free auto-grant for every
  new visitor site-wide, discovered only when a site owner reported
  "expired but still active" for their own already-unlocked browser
  (correct per the old design's non-retroactive rule) while new visitors
  were quietly being locked out. The `premiumCodeExpired` translation key
  and its UI branch in `activatePremiumCode()` still exist client-side
  but are unreachable now that the server never returns `reason:
  "expired"` — harmless dead code, not wired to anything.
  `heartbeatPremiumCode()` still pings the endpoint in the background on
  load purely to keep an already-active seat "warm" (refresh `LastSeen`
  server-side); it has nothing to do with expiration.
- Failure modes are split three ways in the UI: unknown code
  (`premiumCodeInvalid`), code found but at its device cap
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
  the real validity value, and a validation-URL-unreachable fresh visit
  still auto-grants PROMO1 locally with no validity shown. The Apps
  Script's own logic (`findCode`, `checkOrClaimSeat`, `validateCode` —
  a code with a long-past date still succeeds, plain-text validity is
  echoed back verbatim, PROMO1 capped at exactly 30 via
  `CODE_SEAT_LIMITS`, a real code with no override still capped at the
  default 5) is separately unit-tested in isolation against mocked
  Sheets/Lock/Content objects.
- Every `AppsScript.gs` edit requires deploying a **new version** (Deploy
  → Manage deployments → edit → New version) before it takes effect on
  the existing `/exec` URL — the URL itself doesn't change, but the code
  behind it does nothing until redeployed. `Code.gs` must be a script
  created via **Extensions → Apps Script from inside the "Premium Code"
  sheet itself** — a standalone project (created from script.google.com
  or Google Drive directly) is never bound to any spreadsheet, so
  `SpreadsheetApp.getActiveSpreadsheet()` always returns `null` and
  every request 500s. Confirmed live: this exact mistake produced
  `TypeError: Cannot read properties of null (reading 'getSheetByName')`
  in the Apps Script execution log, which the browser then only ever
  saw as a generic "couldn't reach the activation server" (that crash
  page carries no CORS headers).
- **"Buy Premium Code"** — a `.small-btn` (`#buyPremiumBtn`) under the
  code-entry form in Settings → Premium opens a small info modal
  (`#buyPremiumOverlay`, `openBuyPremiumModal()`/`closeBuyPremiumModal()`)
  that leads with **why** — a "Why go Premium?" bullet list of the
  actual gated features (company logo, editable receipt numbers/prefix,
  customer screen, inventory tracking with export, the downloadable
  offline version) — before the price ($9.99 USD, one-time), three
  terms bullets (no expiration, up to 5 active browsers, non-refundable),
  and a line linking out to `contact.html` to actually buy — this repo
  has no payment processing, purchasing is handled manually by the site
  owner via that contact form. Purely informational; doesn't touch
  `activatePremiumCode()` or any validation logic. The whole feature
  (button + modal + its two JS functions) lives inside its own
  `OFFLINE-STRIP:BUY-PREMIUM-BUTTON`/`BUY-PREMIUM-MODAL`/`BUY-PREMIUM-JS`
  marker blocks and is stripped from the downloadable offline package —
  an offline copy is already Premium-unlocked via its own separate code,
  so there's nothing to sell it.

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
- **Usage analytics** via the shared `trackEvent(name, params)` helper
  (thin `gtag('event', ...)` wrapper, no-ops if `gtag` isn't defined —
  i.e. respects cookie consent same as every other GA call):
  `openOfflineDownloadModal()` fires `offline_download_viewed` the moment
  the modal opens (interest signal, independent of whether the user
  actually agrees to the ToS and downloads); `confirmOfflineDownload()`
  fires `offline_download` right after the zip download is triggered
  (completion signal), or `offline_download_failed` with an
  `error_message` param if the build throws (fetch failure, JSZip
  missing, etc.) — lets the site owner see the funnel and diagnose
  failures from the GA dashboard. All three calls live inside the
  `OFFLINE-STRIP:DOWNLOAD-JS` block so they're automatically absent from
  the generated offline package (which already has zero network calls).
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

Has Google Analytics (same `G-7WMTJVB3VY` measurement ID as the rest of
the site) but deliberately **no AdSense** — a customer standing at
checkout shouldn't see ads on the receipt-preview screen they're being
shown, but the site owner still wants visibility into whether/how often
this feature actually gets used, which a plain pageview already answers
(`gtag('config', ...)`'s automatic page_view). Gated by the same
`goonlinepos-cookie-consent` localStorage key `app.html`'s cookie banner
already writes — same origin, same browser, so no separate consent UI
is needed on this page; it silently does nothing if that key isn't
`"accepted"`. Lives inside its own `<!-- OFFLINE-STRIP:CUSTOMER-ANALYTICS
-->` marker, stripped by `buildOfflineCustomerHtml()` for the same reason
every other analytics/ads script is stripped from the offline package —
zero network calls there.

## SEO

- **Every indexable page** (i.e. every page whose own `<meta name="robots">`
  says `index, follow` — everything except `customer.html`, which is
  `noindex, nofollow`) carries: a unique `<title>`, a `meta description`,
  exactly one `<h1>`, a self-referencing `<link rel="canonical">`, a full
  Open Graph set (`og:type`/`og:url`/`og:title`/`og:description`/
  `og:site_name`/`og:image`+width/height), and a matching Twitter Card set
  (`twitter:card` = `summary_large_image`/`twitter:title`/
  `twitter:description`/`twitter:image`). Keep new pages consistent with
  this — copy an existing page's block rather than reinventing it.
- **`og-image.jpg`** (1200×630, root) is the shared social-share card used
  by every page's `og:image`/`twitter:image` — generated once via a
  Playwright screenshot of a small branded HTML template (not committed;
  it was a scratch file), not hand-designed. Swap it for a real designed
  asset if the site ever gets one; there's nothing else in the repo that
  depends on this specific file beyond those meta tags.
- **`favicon.ico`** (root) is a PNG-in-ICO wrapper around `favicon.png`
  (same 256×256 artwork, just re-packaged) — kept only because some
  crawlers/tools still probe `/favicon.ico` directly regardless of the
  `<link rel="icon">` tag. Every page links both
  (`<link rel="icon" type="image/png" sizes="256x256" href="favicon.png">`
  + `<link rel="shortcut icon" href="favicon.ico">`); if `favicon.png` is
  ever replaced, regenerate `favicon.ico` from the new artwork too (a
  plain PNG-in-ICO wrapper — see git history for the generation script) or
  the two will drift. The offline package (see below) bundles both.
- **`sitemap.xml` lists every indexable page** — `/`, `app.html`,
  `how-it-works.html`, `about.html`, `blog.html`,
  `blog-why-your-business-needs-a-pos.html`, `contact.html`,
  `privacy.html`, `terms.html` — matching each page's own
  `index, follow` robots meta tag. `customer.html` is deliberately absent
  (its own tag says `noindex, nofollow`). If a page's robots meta changes,
  update this file to match.
- **`how-it-works.html` was a genuinely broken/orphaned page** before this
  was fixed, all in one pass: (1) its `<head>` had a duplicated, nested
  `<!DOCTYPE html><html><head>` wrapper with two conflicting
  title/description/robots blocks (malformed HTML, not just a missing-tag
  gap); (2) its Google Analytics script loaded unconditionally, unlike
  every other page's consent-gated `loadAnalyticsAndAds()` — it now uses
  the exact same cookie-consent banner/gating pattern as `about.html`/
  `contact.html`/`blog.html` (including AdSense, and a "Cookie Settings"
  footer link); (3) **not one other page linked to it** — every page's
  footer "How to Use" link pointed at `index.html` instead, and
  `index.html` had no footer link to it at all, making it an orphan page
  Google would rarely recrawl regardless of its own meta tags — fixed
  site-wide (all footers, plus `index.html`'s own footer gained a "How to
  Use" entry); (4) its own "Open the app" buttons (header, hero, CTA band,
  footer — 4 places) linked to `index.html` instead of `app.html`, so the
  page's own primary call-to-action didn't actually open the app — fixed
  to `app.html`, matching every other page's convention.
- `privacy.html`/`terms.html` each used to render **two `<h1>` tags** (the
  shared brand-mark heading in the page header, plus the real
  page-specific title — "Privacy Policy"/"Terms of Service" — below it).
  Fixed by demoting the brand-mark heading to `<h2>` (CSS selector
  `.page-header h1` renamed to `.page-header h2` alongside it, no visual
  change) so the page's actual topic is the page's only `<h1>`. Keep this
  in mind before copying `about.html`'s/`contact.html`'s header markup
  onto a page that already has its own `<h1>` elsewhere.

## Conventions / working on this repo

- No build/test/lint tooling exists — verify changes by opening the HTML
  file directly (or a local static server) and exercising the UI; there is
  nothing to `npm install` or `npm run`.
- Keep new persisted keys behind `storageGet`/`storageSet`, not raw
  `localStorage`, to preserve the embedded-host code path.
- Keep `sitemap.xml` in sync with each page's own `<meta name="robots">`
  when adding/removing/re-gating an indexable page — see "SEO" above.
- Git workflow observed in history: work happens on `main`; this session's
  designated branch is `claude/repo-code-access-jpjg54`.
