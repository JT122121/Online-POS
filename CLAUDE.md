# Online-POS (GoOnlinePOS.com)

Static site + single-page POS web app for **goonlinepos.com** (custom domain
via `CNAME`), served straight from this repo (GitHub Pages style — no build
step, no bundler, no package.json). Every page is a standalone `.html` file
with inline `<style>`/`<script>`; there is no framework and no backend.

## Repo layout

- **Marketing/site pages:** `index.html`, `contact.html`,
  `privacy.html`, `terms.html`, `blog.html` + its articles:
  `blog-why-your-business-needs-a-pos.html`,
  `blog-create-your-own-pos-with-appsheet.html`,
  `blog-from-excel-to-appsheet-expert.html`. All of these, plus
  `invoice-generator.html`/`receipt-generator.html` below, share one canonical site-wide
  header/nav/footer — see "Site-wide header, nav & footer" below.
  `guide.html`, `how-it-works.html`, and `about.html` still exist on disk
  but are **retired** — `noindex`, removed from every page's nav/footer
  and from `sitemap.xml`. `guide.html`/`how-it-works.html`'s content now
  lives inside `app.html` itself as the "How To Use" panel;
  `about.html`'s content now lives at the top of `index.html` itself.
  See "Site-wide header, nav & footer" and the SEO section below for the
  full story on both.
- **`app.html`** (~4,050 lines) — the actual POS application. Most logic
  still runs client-side in one big inline `<script>` block near the
  bottom of the file; a few self-contained pieces (barcode scanner,
  receipt rendering, the offline-package builder) have been split out
  into `modules/` — see "`modules/` — split-out app.html pieces" below.
- **`customer.html`** — a second, lightweight page meant to be opened in a
  separate window/tab/tablet facing the customer; mirrors live order state
  from `app.html`.
- **`invoice-generator.html`** — a standalone, free invoice generator, unrelated to
  the cart/checkout flow. See "`invoice-generator.html` — standalone invoice
  generator" below.
- **`receipt-generator.html`** — a standalone, free payment-receipt generator
  (simple summary, not itemized), a sibling tool to `invoice-generator.html`. See
  "`receipt-generator.html` — standalone receipt generator" below.
- **`end-of-day.html`** — a printable/saveable POS closing report, opened
  from `app.html`'s header toolbar; unlike `invoice-generator.html`/`receipt-generator.html`
  it reads `app.html`'s own storage directly and ships in the offline
  package. See "`end-of-day.html` — POS closing report" below.
- **`barcode-generator.html`** — a standalone, free barcode/QR code generator,
  `invoice-generator.html`/`receipt-generator.html`'s third sibling tool, linked from every
  page's header CTA row and `app.html`'s own header-links, indexable,
  and in `sitemap.xml` — it started out deliberately disconnected
  (URL-only, `noindex`) while still being built, then was wired in once
  ready. See "`barcode-generator.html` — standalone barcode / QR code generator"
  below.
- **`vat-calculator.html`** — a standalone, free VAT calculator, the fourth
  sibling in the `invoice-generator.html`/`receipt-generator.html`/`barcode-generator.html` family
  of free tools — add VAT to a net amount or remove VAT from a gross
  amount. Indexable and linked from every page's header CTA row and
  `app.html`'s own header-links from the day it shipped. See
  "`vat-calculator.html` — standalone VAT calculator" below.
- **`pricing-calculator.html`** — a standalone product pricing /
  markup-vs-margin calculator, the fifth sibling in the free-tools
  family, connected site-wide (indexable, in every page's `.cta-btn`
  row, `app.html`'s `.header-links`, and `sitemap.xml`) - see
  "`pricing-calculator.html` — standalone product pricing calculator"
  below. **All five free-tool filenames/URLs are descriptive two-word
  slugs, not the original bare one-word names** -
  `invoice-generator.html`/`receipt-generator.html`/
  `barcode-generator.html`/`vat-calculator.html`/
  `pricing-calculator.html`, matching their `.cta-btn` labels ("Free
  Invoice Generator", etc.) rather than the shorter `invoice.html`/
  `receipt.html`/`barcode.html`/`vat.html`/`pricing.html` they all
  originally shipped as. `pricing.html` was renamed first, once
  `/pricing` on its own turned out to read as ambiguous (easy to
  mistake for a SaaS "our pricing/plans" page rather than a calculator
  tool); the same reasoning was then applied to the other four so the
  whole family reads unambiguously and consistently. Every reference
  across the repo - the `.cta-btn` `href` on all 13 pages, each of
  `app.html`'s five `openCreateX()` functions, `sitemap.xml`, and
  `index.html`'s `SiteNavigationElement` JSON-LD - uses the longer,
  descriptive path for all five tools.
- **`modules/`** — `translations.js`, `usb-scanner.js`, `receipt.js`,
  `offline-builder.js`, plain global-scope scripts split out of
  `app.html`'s inline block to keep it smaller. See "`modules/` —
  split-out app.html pieces" below.
- **Images:** `guide-*.png` (in-app feature screenshots used in the
  "Every setting, explained" full walkthrough on the now-retired
  `guide.html` - see "Retired: `guide.html` and `how-it-works.html`"
  under "Site-wide header, nav & footer" and the SEO section below;
  `index.html` no longer links to or teases that page at all), `favicon.png` /
  `favicon.ico` (same artwork, PNG-in-ICO — kept in sync manually, see
  below), `og-image.jpg` (shared 1200×630 social-share card),
  `blog-hero-illustration.png` (featured-post image on `blog.html`,
  `.fp-img`, displayed at up to 640px wide — **plug-and-play by design**:
  swapping the blog's featured photo is just overwriting this exact
  filename with a new image and pushing, no HTML edit needed, since
  `blog.html` always references this fixed name. Keep any replacement
  as a `.png` at roughly 1200-1400px wide (2x the display width) rather
  than uploading a full-resolution original — this file was recovered
  from a 1536×1024/2.2MB source that GitHub's web "rename" editor had
  corrupted down to 2 bytes (it treats a binary file as text when you
  rename it there), and was resized to 1280×853/~1.5MB, matching the
  actual display size, before being committed via git directly. **Never
  rename a binary file through the GitHub web UI's file editor** for
  that reason — upload the correctly-named file fresh, or rename via a
  real git client/API instead. This replaced an earlier
  `blog-hero-illustration.svg` placeholder illustration.
  `blog-excel-photo.png` (1280×853, same sizing convention) is the
  `.pc-art` photo for the "From Excel to AppSheet Expert" post card -
  a generic office/spreadsheet stock photo, not an actual photo of the
  site owner or a real client.
- **`blog.html`'s `.post-grid`** (non-featured articles, below the one
  `.featured-post`) uses `grid-template-columns: repeat(auto-fit,
  minmax(340px, 1fr))`, not a fixed column count - with only one
  `.post-card` it stretches to fill the full 780px row (matching the
  featured post's width above it) instead of being stuck at half-width
  in an otherwise-empty two-column grid; it'll wrap into multiple
  columns automatically once more articles are added (now three posts
  total: the featured one plus two `.post-card`s side by side at
  ~377px each). Don't revert this to `repeat(2, 1fr)` while there's
  fewer than two non-featured posts. `.post-card h3`/`p`/`.pc-tag` are
  sized to match `.featured-post`'s h2/p/fp-tag exactly (27px title,
  14.5px body) - this was tuned for the single-card full-width case but
  reads fine at two-up too, so it wasn't split into a narrower variant.
  A `.post-card`'s `.pc-art` thumbnail is optional - it's just an
  `<img>` when a card has a photo, or a plain centered emoji on the
  existing `accent-tint` background when it doesn't, using the same
  font-size fallback already built into `.pc-art`'s CSS. No placeholder
  image asset needed either way.
- **`.photo-disclaimer`** - a small "Photo for illustration purposes
  only" badge overlaid on the bottom edge of any stock/generic photo
  used in the blog (the featured post's `blog-hero-illustration.png`
  inside its `.fp-photo` wrapper, and the Excel-to-AppSheet post card's
  `blog-excel-photo.png` inside its `.pc-art`), since neither photo is
  an actual picture of the site owner, a real client, or GoOnlinePOS in
  use. Both host elements need `position: relative` for the badge to
  anchor correctly. **Only applies to generic/stock photos** - the
  AppSheet post card's `appsheet-logo.png` is the real Google AppSheet
  logo, not a stand-in photo, so it's deliberately excluded. Add the
  same badge to any future blog photo that isn't a genuine, literal
  photo of the thing it's illustrating.
- **SEO/infra:** `CNAME` (`goonlinepos.com`), `robots.txt`, `sitemap.xml`
  (lists `/`, `app.html`, `invoice-generator.html`, `receipt-generator.html`, `barcode-generator.html`,
  `blog.html`, `blog-why-your-business-needs-a-pos.html`,
  `blog-create-your-own-pos-with-appsheet.html`,
  `blog-from-excel-to-appsheet-expert.html`, `contact.html`,
  `privacy.html`, `terms.html` — every page whose own
  `<meta name="robots">` says `index, follow`; `customer.html` is
  correctly excluded, its own meta tag says `noindex, nofollow` -
  referred to by filename throughout this doc for clarity/searchability,
  but every actual `<loc>` in `sitemap.xml`, and every internal link
  site-wide, drops the `.html` extension - see "No `.html` extension on
  internal links, anywhere" below), `ads.txt` (Google AdSense publisher
  id).

No README, no CI, no tests, no linter config. History is 50 commits, one
author, mostly titled "Add files via upload" — this repo has been edited
almost entirely through the GitHub web UI, not a local dev workflow.

## Site-wide header, nav & footer

Every marketing/tool page — `index.html`, `about.html`, `contact.html`,
`privacy.html`, `terms.html`, `blog.html` + its 3 articles, `invoice-generator.html`,
`receipt-generator.html` — shares one canonical `<header class="site-header">`
structure and CSS block, copied verbatim page to page (`.site-header`,
`.site-header .brand`/`.brand-mark`, `.site-header .header-right`,
`.site-nav`, `.cta-btn`). Before this, the site had **four divergent
header conventions** (`.site-header`, `.page-header`, `.masthead`,
`.article-header`) depending on which page you looked at; this unified
all of them under one pattern:

```html
<header class="site-header">
<a class="brand" href="/">
<div class="brand-mark"><img src="data:image/png;base64,..." alt=""></div>
<h1>GoOnlinePOS.com</h1>  <!-- or <h2> — see below -->
</a>
<div class="header-right">
<nav class="site-nav">
<a href="/">Homepage</a>
<a href="blog" class="nav-highlight">Blog</a>
</nav>
<a class="cta-btn" href="invoice-generator">Free Invoice Generator</a>
<a class="cta-btn" href="receipt-generator">Free Receipt Generator</a>
<a class="cta-btn" href="app">Free Point of Sale</a>
</div>
</header>
```

- **Brand-mark heading level depends on whether the page already has its
  own topic-specific `<h1>` elsewhere** — same rule already established
  for `privacy.html`/`terms.html` before this change (see SEO below):
  `index.html`/`about.html`/`contact.html`/`blog.html` (which have no
  other `<h1>`) use `<h1>GoOnlinePOS.com</h1>` here; `privacy.html`/
  `terms.html` (own `<h1 class="doc-title">`) and `invoice-generator.html`/
  `receipt-generator.html` (own `<h1>` reading "Create Invoice"/"Create Receipt")
  use `<h2>` so the page keeps exactly one real `<h1>`.
- **The 6-button `.cta-btn` row is identical and in the same order on
  every page** — Free Invoice Generator → Free Receipt Generator → Free
  Barcode & QR Code (`href="barcode-generator"`) → Free VAT Calculator
  (`href="vat-calculator"`) → Free Pricing Calculator (`href="pricing-calculator"`)
  → Free Point of Sale (`href="app"`), always extension-less.
  `index.html` used to be the only page with this row (2 buttons, no
  POS link); a later pass added the third button there and rolled the
  whole row out site-wide, a later pass added the fourth (Barcode & QR
  Code) once `barcode-generator.html` was ready to connect, a still-later pass
  added the fifth (VAT Calculator) once `vat-calculator.html` shipped, and a
  still-later pass added the sixth (Pricing Calculator) once
  `pricing-calculator.html` shipped — see each tool's own section below
  — so **any older note in this file
  describing the CTA row as unique to `index.html`, or as only 3, 4, or
  5 buttons, is stale**.
- **On narrow viewports (`@media (max-width: 640px)`), `.header-right`
  (the `.site-nav` pills plus all 6 `.cta-btn`s) switches from a
  right-aligned wrapping flex row to a 2-column CSS grid, full width**
  (`display: grid; grid-template-columns: repeat(2, 1fr); width: 100%`,
  with `.site-nav` itself set to `grid-column: 1 / -1` and its own
  2-column grid so Homepage/Blog occupy the top row) - every button
  stretches to fill its cell and its text is centered
  (`.site-header .header-right .site-nav a, .site-header .cta-btn {
  text-align: center; }`). This was a fix, not the original mobile
  layout: with 8 pills total (2 nav + 6 CTA) and the base rule's
  `justify-content: flex-end`, each one wrapped onto its own line but
  stayed hugged to the right edge, leaving a large ragged gap of empty
  background down the left side of every row instead of using the
  screen's own width - reported as the mobile header not being
  "arranged well" and not maximizing the space. The 2-column grid fills
  that gap and turns the row count from 8 lopsided single-item rows into
  4 balanced two-up rows. Applied identically across all 13 pages
  sharing this header (same copy-verbatim CSS block, two textually
  different variants - `index.html` and `contact.html`/`privacy.html`/
  `terms.html` lack the block's trailing `.site-header { margin-top:
  12px; }` line the other 9 pages have - both variants got the same
  three new/changed lines). Verified via Playwright at 360/390/414px on
  every one of the 13 pages: zero horizontal overflow, zero console
  errors. `app.html`'s own separate `.header-links`/`.header-actions`
  toolbar (see "`app.html` — architecture" below) was deliberately left
  alone - its buttons are natural-width (not right-hugged single-column)
  and already wrap into balanced multi-per-row lines with no wasted-space
  problem, confirmed via the same Playwright overflow check.
- **`.site-nav` is always Homepage → Blog, in that order, everywhere** —
  originally "About" (linking to `about.html`), renamed to "Homepage"
  (linking to `/`) once `about.html`'s content moved onto `index.html`
  itself — see "Retired: `about.html`" below for the full story. Before
  that rename, `index.html` briefly shipped with Blog first (with the
  `nav-highlight` "NEW" badge drawing the eye there) before being
  corrected to match every other page, which had About/Homepage first
  from the start. Keep new pages consistent with Homepage-then-Blog;
  don't copy `index.html`'s markup from before either fix.
- **`.site-nav a` (Homepage/Blog) renders as a solid dark-green pill, not
  a plain text link** — `background: var(--accent-dark)`, white text,
  same `border-radius: var(--radius-sm)` padding treatment as `.cta-btn`
  but visually distinct from it (`--accent-dark`, the darker of the two
  greens, vs. `.cta-btn`'s brighter `--accent`) so the nav items and the
  CTA buttons read as two different weights of action rather than one
  undifferentiated row. This replaced an earlier plain-text-link style
  (`color: var(--ink-soft)`, no background) on every page carrying this
  nav. The `nav-highlight` "NEW" badge on Blog still renders as a small
  absolutely-positioned corner tag on top of the pill (repositioned
  slightly tighter - `top: -8px; right: -8px` - to sit correctly against
  the smaller pill instead of a bare text link).
- **Footer is trimmed to exactly 4 links, same order, everywhere:**
  Contact → Privacy Policy → Terms of Service → Cookie Settings. Dropped
  from various pages' older footers: About, Blog, "How to Use", "Full
  Guide", and the Facebook link (Facebook now lives in `index.html`'s own
  Social section instead — see below). `app.html`'s own `<footer
  class="site-footer">` got the same trim (it used to carry How to Use/
  About/Blog/Facebook too); its Cookie Settings link stays wrapped in the
  `OFFLINE-STRIP:COOKIE-SETTINGS-LINK` marker like before, since the
  offline build has no cookie-consent flow to link to.
- **`invoice-generator.html`/`receipt-generator.html`** keep their own existing `<header
  class="masthead">` (with the page's real `<h1>` — "Create Invoice"/
  "Create Receipt" — and the doc's own from/logo controls) **unchanged
  below** the new `site-header`; the new header was added above it, not
  merged into it. Their old `.top-actions` div (a back-link plus, on
  `invoice-generator.html`, a second "Open the POS App" button) was removed
  entirely as redundant with the new nav — its CSS and the
  `.top-actions` mention in the print hide-list were removed too (the
  print hide-list now hides `.site-header` instead). Neither page had a
  logo before; the brand-mark PNG data URI was copied byte-for-byte from
  `index.html`.
- **`app.html` doesn't get a second copy of this header at all** — it
  already has its own `<header class="app-header">` with its own logo,
  and stacking a second full `site-header` (with its own brand-mark
  image) directly above it read as a duplicate logo rather than a
  unified nav, so that approach was tried and reverted. What shipped
  instead is a deliberately trimmed **two-row header**, split into a
  `.app-header-top` row (brand/title/badges plus a `.header-links` row
  of "leave the app" links) and the existing `.header-actions` toolbar
  below it, matching an explicit design brief for what the POS toolbar
  should show versus what only needs to live inside Settings:
  - **`.header-links`** (next to the app title/Premium/Special-Access
    badges): Homepage, Blog, Free Invoice Generator, Free Receipt
    Generator, Free Barcode & QR Code, Free VAT Calculator, Free
    Pricing Calculator, in that
    order - seven **text-only** buttons (no emoji icon, unlike most of
    the rest of the toolbar), all sharing the exact same dark-green
    (`--accent-dark`) pill styling so they read as one consistent row
    rather than differently-weighted actions. Free Barcode & QR Code
    (`#createBarcodeButton` → `openCreateBarcode()`) was added once `barcode-generator.html` was ready
    to connect - same `window.open(...)` new-tab pattern, same
    `OFFLINE-STRIP:CREATE-BARCODE-BUTTON`/`CREATE-BARCODE-JS` marker
    wrapping, and the same `createBarcodeShortcutLabel` translation key
    added across all six `modules/translations.js` language blocks, as
    Free Invoice/Receipt Generator below. **Its dark-green styling was
    missed at the time** - the shared CSS rule
    (`#homepageShortcutButton, #blogShortcutButton, #createInvoiceButton,
    #createReceiptButton { background: var(--accent-dark); ... }`) never
    had `#createBarcodeButton` added to its selector list, so the button
    silently fell back to the plain unstyled default and stood out from
    its four siblings until a later pass added it to both the
    `background`/`color` rule and its `:hover` rule - a reminder to grep
    for the new button's `id` across `app.html`'s CSS, not just its
    HTML/JS, whenever a new `.header-links` entry is added the same way.
    This
    row was briefly trimmed down to just the Homepage button alone (Blog/
    Invoice/Receipt/a separate Home button were deleted outright, per an
    earlier design call that the POS app shouldn't link out to any of
    them) before being reversed - Blog/Free Invoice Generator/Free
    Receipt Generator were explicitly asked to come back, since online
    visitors using the live app should still be able to reach them, just
    restyled to match Homepage's icon-free look instead of their old
    emoji-prefixed buttons. `openCreateInvoice()`/`openCreateReceipt()`
    (the "Free Invoice/Receipt Generator" `window.open(...)` handlers)
    and the `blogShortcutLabel`/`createInvoiceShortcutLabel`/
    `createReceiptShortcutLabel` translation keys across all six
    `modules/translations.js` language blocks were restored to their
    previous values verbatim. **The old separate Home button was not
    revived** - Homepage already covers that job and predates this
    round-trip. Blog/Create Invoice/Create Receipt are wrapped in their
    own `OFFLINE-STRIP:BLOG-BUTTON`/`CREATE-INVOICE-BUTTON`/
    `CREATE-RECEIPT-BUTTON` marker blocks (JS wrapped in
    `CREATE-INVOICE-JS`/`CREATE-RECEIPT-JS`), same as Homepage's own
    `OFFLINE-STRIP:HOMEPAGE-BUTTON`, and stripped by
    `buildOfflineAppHtml()` - none of `blog.html`/`invoice-generator.html`/
    `receipt-generator.html`/`index.html` ship in the offline package for them to
    open. **`#createVatButton` → `openCreateVat()` was added last**,
    once `vat-calculator.html` shipped - same `window.open(...)` new-tab pattern,
    same `OFFLINE-STRIP:CREATE-VAT-BUTTON`/`CREATE-VAT-JS` marker
    wrapping, and the same `createVatShortcutLabel` translation key
    added across all six `modules/translations.js` language blocks, as
    every button before it. Adding it surfaced a real, pre-existing
    bug: `changeLanguage()`'s `ids` map (the `{elementId:
    translationKey}` table that actually re-translates `.header-links`
    text on a language switch) never had `createBarcodeShortcutLabel`
    added to it when Free Barcode & QR Code shipped, so that button's
    translation key existed and its markup existed but nothing wired
    them together - it silently stayed in whatever language it loaded
    in and never re-translated. Fixed by adding both
    `createBarcodeShortcutLabel` and the new `createVatShortcutLabel`
    to that map in the same pass - the same class of oversight as the
    missing dark-green CSS entry two paragraphs up, and the same
    lesson: a new `.header-links` button needs the CSS color rule, the
    `changeLanguage()` `ids` map entry, *and* the
    `modules/translations.js` key, not just the button markup itself.
    **`#createPricingButton` → `openCreatePricing()` was added last**,
    once `pricing-calculator.html` shipped - same `window.open(...)`
    new-tab pattern (opening the extension-less `pricing-calculator`
    path, not `pricing` - see that page's own section below for why
    every tool in this family uses a descriptive multi-word path
    rather than the shorter names they all originally shipped as), same
    `OFFLINE-STRIP:CREATE-PRICING-BUTTON`/
    `CREATE-PRICING-JS` marker wrapping, and the same
    `createPricingShortcutLabel` translation key added across all six
    `modules/translations.js` language blocks - and this time the
    dark-green CSS selector and the `changeLanguage()` `ids` map entry
    were both added in the same pass as the button itself, per the
    lesson two paragraphs up, rather than being discovered missing
    afterward.
  - **`.header-actions` (the toolbar) now shows exactly six things:**
    Hide Toolbar, the Cashier select, How To Use, Settings, End of Day,
    Customer Screen, Backup - deliberately trimmed down from a longer
    list. **Premium, Print, and Inventory lost their dedicated toolbar
    buttons entirely** - Premium and Inventory were always just thin
    wrappers around `selectSettingsTab(...)` (their own
    `openPremiumSettings()`/`openInventoryPanel()` functions were deleted
    as dead code once nothing called them), so both remain exactly as
    reachable as before via Settings → Premium / Settings → Inventory,
    just by clicking that tab in `#settingsTabRail` directly instead of
    a shortcut. Removing `openInventoryPanel()` also removed its
    `renderInventoryList()` call, so the Inventory tab's own
    `data-tab="inventory"` button in the rail now calls
    `renderInventoryList()` itself on click, preserving that behavior.
    Print (manual "reprint the current draft receipt") was dropped
    without a replacement - `completeAndPrint()` already prints
    automatically on checkout, and a past sale can already be reprinted
    from Settings → Sales History, so nothing was actually lost.
    **How To Use kept its toolbar button** (`#howToUseButton` →
    `openHowToUse()`) - it briefly moved into `#settingsTabRail` as a
    plain, non-`data-tab` entry when the toolbar was first trimmed, but
    was moved back once **New Sale** needed its slot: New Sale
    (`#newSaleButton`, same `id` and same `--accent` styling, just a new
    `.new-sale-catalog-btn` layout class instead of the toolbar's button
    rules) now lives in `#catalogView` itself, directly under the
    Barcode Scanner toggle row and above the product search box -
    contextually grouped with the catalog controls rather than the
    account-level toolbar. Since `#catalogView` hides whenever
    `#checkoutView` is showing, New Sale is now only reachable from the
    product-browsing screen, not mid-checkout - use "Back to Catalog"
    first if you need to abandon a sale already at the payment step.
  - **`#settingsButton` got heavier visual treatment** now that it's the
    toolbar's primary gateway to everything that used to have its own
    shortcut (Premium, Inventory, How To Use): solid `--ink` background
    instead of the plain neutral panel style every other secondary
    button uses, plus a small `▾` appended via `#settingsButton::after`
    (CSS-only, not a translated string) hinting that it opens onto more
    options rather than performing a single action.
- **`blog.html`'s 3 article pages** keep their existing `.back-link-row`
  ("← Back to Blog") **unchanged**, now sitting just below the new
  header — deliberately preserved as a more specific, more useful link
  than the generic nav offers. `blog.html` itself dropped its own
  `.back-link-row` ("← Back to GoOnlinePOS.com") since the new header's
  brand-mark link already covers that. The 3 article pages also had a
  pre-existing **broken** `.site-brand` block referencing a nonexistent
  `logo.png`, which the new canonical header replaced outright rather
  than stacking alongside it.
- **`index.html`'s own "Social" section** — a `<section class="social-section">`
  (heading "Social", `.social-links` row of round `.social-icon`
  buttons) placed between the homepage's CTA band and its footer.
  Currently one icon: Facebook (`https://www.facebook.com/share/1F18wrqU3F/`),
  a real inline `<svg>` glyph, not a text link or emoji. **Instagram is
  deliberately not there yet** — there's no profile URL for it — but the
  markup has an HTML comment immediately after the Facebook `<a>`
  explaining exactly how to add it (mirror the same `.social-icon`
  markup, swap `href`/`aria-label`/`title`, use an Instagram glyph SVG).
  This section is `index.html`-only, not part of the shared site-header/
  footer pattern above.
- **Retired: `guide.html` and `how-it-works.html`.** Both files still
  exist on disk, unedited otherwise, but are no longer linked from any
  standardized page's nav or footer, and are no longer in `sitemap.xml`
  — see "SEO" below for the full reasoning and the exact meta-tag
  change. Their walkthrough content now lives inside `app.html` itself
  as the "How To Use" panel (see "`app.html` — architecture" below)
  instead of as a separate page. Any remaining prose in an older page's
  body copy that referenced "the full guide" or "how it works" as a
  separate page (e.g. `about.html`'s two `.guide-box` callouts) was
  repointed to just open `app.html` and click How To Use there, rather
  than linking to either retired page.
- **Retired: `about.html`.** Same treatment as `guide.html`/
  `how-it-works.html` above (`noindex, follow`, dropped from
  `sitemap.xml`, file left otherwise untouched on disk including its own
  stale nav/footer) - but for a different reason: its body content was
  copied into `index.html` itself, as a new
  `<section class="section" id="about-goonlinepos">` (heading "About
  GoOnlinePOS", then a `.doc` card). `index.html` needed `.doc`/
  `.audience-list` CSS added for this (it never had these classes
  before). **Its position on the page changed twice.** It first landed
  directly after `index.html`'s own `site-header`, before the hero -
  deliberately the first thing a visitor read, per an explicit early
  instruction. That was later reversed after a full-page "act as website
  expert" redundancy/landing-page-structure pass: the Hero (with its
  primary CTA) now sits immediately after the header instead, matching
  standard landing-page convention (value proposition + CTA above the
  fold, not a long essay first), and the About section was moved down to
  sit **between the "Set it up your way" feature-grid section and the
  FAQ section**. No collision with `index.html`'s own pre-existing
  `.hero`/`.cta-band` since the migrated content deliberately excludes
  `about.html`'s own mini-hero and closing CTA band - those would have
  been redundant with `index.html`'s hero and CTA band appearing
  elsewhere on the same page. **The `index.html` copy is trimmed well
  below what `about.html` itself has**, and was trimmed in three passes
  as more duplication surfaced. First pass (right after the initial
  migration): dropped the redundant `.guide-box` callout. Second pass:
  dropped "How GoOnlinePOS works" (restated what the hero/steps sections
  already say), "See the real GoOnlinePOS app" along with its
  `.guide-box` callout (another "open the app and click How To Use"
  prompt competing with the hero's own primary CTA), and "Free online POS
  software for small businesses" (generic filler restating points made
  earlier in the article) - `.guide-box`/`.inline-link` CSS was removed
  along with the last callout that used them. Third pass (the
  hero-reorder/redundancy pass above): dropped "What can you do with
  GoOnlinePOS?" (already covered by the "How it works" steps and the
  "Set it up your way" feature-grid cards) and "What does GoOnlinePOS
  require?" (its "free, no signup, no install" claims already covered by
  the Hero's own eyebrow/tagline and the FAQ's "Is it really free?"
  answer) - `.requirements`/`.doc ul`/`.doc li` CSS was removed along
  with them, since nothing on `index.html` uses those classes anymore.
  **What survives on `index.html` today is just two `<h2>` sections**:
  the intro (condensed to 4 paragraphs, folding the browser/device detail
  into the closing paragraph and dropping the standalone "No signup. No
  login. No monthly fee." paragraph as redundant with the Hero's own
  tagline) and "Who is GoOnlinePOS for?" (the `.audience-list` 6-card
  grid, kept because it's differentiated targeting content stated
  nowhere else on the page) - "Why choose a browser-based POS?" was also
  dropped in this third pass as generic filler. `about.html` itself still
  has all of this content in full, unedited, since its own file content
  was left untouched per the retirement policy - only the copy on
  `index.html` was trimmed/repositioned. The now-redundant
  `.about-teaser` blockquote pull-quote (`"GoOnlinePOS is an
  independently developed project..." → "Read the full story →"`) that
  used to sit further down `index.html` and link out to `about.html` was
  deleted outright, CSS and all, in the first trimming pass - the "full
  story" it teased is now already on the same page. Since the content
  lives on `index.html` now, every page's `.site-nav` "About" link was
  renamed **"Homepage"** and repointed from `about` to `/` - see the
  `.site-nav` bullet above. **The homepage's FAQ was also trimmed** in
  the same hero-reorder pass, from 16 `<details>` items down to 11:
  removed "Do I need to create an account?" (redundant with Hero/About
  messaging), "Can I scan product barcodes?" (redundant with the "Scan
  barcodes" feature-grid card), "Can multiple cashiers use the POS?"
  (redundant with the "Multiple cashiers" feature-grid card), "Can I
  export my sales?" (redundant with the "Sales history, editable"
  feature-grid card), and "Will it work with my printer?" (merged into
  "Can I print receipts?", which now also covers Auto paper size vs.
  choosing an exact size in Settings → Paper & Zoom). **"Do I need to
  create an account?" and "Can I export my sales?" were both brought
  back** in the later "Landing-page branding refresh" pass below, per
  an explicit new brief listing both as priority FAQ questions -
  superseding this trim's "redundant" rationale for those two
  specifically; the other three trims here still stand. See that
  section for the FAQ's current full order and count.
- **Landing-page branding refresh.** A messaging/hierarchy/copy pass
  over `index.html` only, per an explicit brief that the POS is the
  main product and the five free tools are supporting it - **no other
  page, no `app.html`, no tool page, no theme token, and no
  functionality changed**. Verified via `git diff` against the `:root`
  CSS-variable block that no color/font/radius/shadow token moved.
  - **Hero** - headline changed from "Ring up sales from any browser"
    to **"Free POS for Small Businesses"** (leads with the brand
    position directly). The supporting `<p>` was trimmed to a single
    sentence, **"Open your browser and start selling with a simple POS
    built for small businesses"** - it originally also opened with "No
    signup. No login. No installation.", but with the pre-existing
    `.eyebrow` pill above the headline *and* the new trust bar below
    the buttons (next bullet) both already carrying that exact claim,
    keeping it a third time in the paragraph too read as flatly
    repetitive on one screen - trimmed once reviewed via screenshot,
    not shipped as first written. CTAs: primary `.btn-primary` "Open
    the app" → **"Open POS - Free"** (same `href="app"`, unchanged) -
    a plain hyphen, not an em dash, per the site's own "No em dashes
    anywhere in site text" rule below - missed on the first pass and
    corrected once flagged;
    secondary `.btn-secondary` "See how it works" (`href="#how-it-works"`)
    → **"Explore Free Tools"**, retargeted to `href="#free-tools"` (the
    new tools section below). `#how-it-works` itself is untouched and
    still a valid in-page anchor, just no longer what the hero's second
    button points at.
  - **`.trust-bar`** - new, a single centered `<p>` right after
    `.hero .actions`, plain text (no pill/background, unlike
    `.eyebrow`, to avoid visually reading as a duplicate of it):
    **"Free · No Signup · No Installation · Browser-Based · Offline
    Capable"**. Every claim is already true and already documented
    elsewhere in this file (offline via `end-of-day.html`'s Offline
    Mode POS card and the "Download Offline POS" feature, browser-based
    via the whole `app.html` architecture).
  - **`#free-tools` - new section, "More Free Tools for Your
    Business"** (sub: "Useful tools that work alongside your everyday
    selling tasks."), placed directly after `.feature-grid`'s section.
    Five `.tool-card` anchors in a `.tools-grid`
    (`grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`,
    same auto-fit convention as `.feature-grid`/`blog.html`'s
    `.post-grid`) - Receipt Generator, Invoice Generator, Pricing
    Calculator, VAT Calculator, Barcode & QR Generator, each linking to
    its real page (`receipt-generator`/`invoice-generator`/
    `pricing-calculator`/`vat-calculator`/`barcode-generator`, all
    extension-less per this file's own convention). `.tool-card` reuses
    `.feature-card`'s exact visual tokens (`--panel`/`--line`/
    `--radius`/`--accent-tint`/`--accent-dark`, same `.fc-icon` icon
    treatment) but is its own class rather than `.feature-card` applied
    to an `<a>` - needed `display: block`, `text-decoration: none`,
    `color: inherit`, and a hover state (`border-color: var(--accent);
    box-shadow: var(--shadow);`) that plain informational
    `.feature-card`s never needed, since these cards are real
    navigation, not just information. This section is where the old
    "Create invoices"/"Create receipts" `.feature-card`s and the old
    `.tool-spotlight` Pricing Calculator panel both retired to - see
    the `.feature-grid` bullet above for the card-count consequences
    that had on that section.
  - **`.privacy-note` - new, small callout** ("Your Data, Your Device"),
    placed in its own `<section>` directly before the FAQ. A `.doc`-style
    bordered/shadowed card (reusing those exact tokens) but lighter -
    two short sentences: local-browser-storage/no-account messaging,
    then a backup reminder. Deliberately not a heavier full section;
    this same ground is already covered in more depth by the FAQ's
    "Where is my data stored?" answer, so the callout stays brief by
    design rather than duplicating it.
  - **FAQ** - two questions restored from the earlier "About" trim (see
    that bullet above) per this brief's explicit priority list: **"Do I
    need to create an account?"** (new answer, not the old one) and
    **"Can I export my sales?"**. Also **"Is it really free?" moved to
    the very first position** (previously ninth of eleven) since the
    brief lists it first among its FAQ priorities. Net: 11 items → 13,
    same simple one-`<p>`-answer style as every existing entry, no
    other reordering.
  - **Final `.cta-band`** - heading "Ready to ring up your first sale?"
    → **"Ready to Start Selling?"**; supporting `<p>` "No signup. No
    login. Just open the app." → **"Open GoOnlinePOS and try it without
    creating an account."**; button label → **"Open POS - Free"**
    (`href="app"` unchanged); a new `.cta-band-note` `<p>` added below
    the button, **"No signup. No login. No installation."** - kept
    separate from the existing `.cta-band p` (which sits *above* the
    button and needed its own, more prominent styling) via a more
    specific `.cta-band p.cta-band-note` selector, smaller/dimmer than
    the main supporting line.
  - **SEO meta** - `<title>`/`meta description`/`og:title`/
    `og:description`/`twitter:title`/`twitter:description` all
    re-worded to lead with "Free POS for Small Businesses" (matching
    the new hero headline) while keeping the existing supporting
    keywords (barcode scanning, inventory, split payments, multiple
    cashiers); `meta keywords` gained a few of the brief's specific
    supporting terms ("free pos for small business", "browser-based
    pos", "pos without signup/login", "small business pos", "online
    pos") in place of a couple of the weaker existing ones, not simply
    appended - kept to a reasonable total length rather than
    keyword-stuffed. `sitemap.xml`/canonical/JSON-LD were not touched -
    the URL itself didn't change, only on-page copy.
  - Verified end-to-end with Playwright: every new/changed CTA href
    resolves (including the new `#free-tools` anchor actually scrolling
    there), all five `.tool-card` links 200, `.feature-grid` still 15
    cards in 5 clean rows, FAQ is 13 items in the new order, zero
    console errors and zero horizontal overflow at 360/390/414px and at
    1400px desktop.
  - **Follow-up polish pass**, per an open-ended "make it the best
    landing page" request scoped down to "same theme, refine further"
    (confirmed before touching anything - a full visual redesign was
    explicitly declined). Two changes: `#free-tools` got a
    `background: var(--accent-tint); border-radius: var(--radius);
    padding: 44px 32px;` panel treatment - reusing the exact tint token
    the retired `.tool-spotlight` used, not a new color - so it reads
    as a visually distinct zone from the plain-background `.feature-grid`
    section right above it, reinforcing the POS-vs-tools separation
    this whole refresh was about, rather than the two grids blending
    into one undifferentiated 7-row stretch of near-identical cards.
    And the About section's tools paragraph was rewritten - it had
    drifted stale (still individually linking only 4 of the 5 tools,
    missing Pricing Calculator, a real content bug) and now duplicated
    the new `#free-tools` section's job; trimmed to one sentence naming
    all five tools plus a single link back up to `#free-tools` instead
    of four separate `<a>` tags repeating the same pitch - worded "See
    ... above", not "below", since `#free-tools` sits earlier on the
    page than the About section (wrong the first time this line was
    written, caught and fixed on review). The other three About
    paragraphs were also tightened for the same short-sentence brand
    voice already established elsewhere on this page, no content
    removed. A live full-page screenshot audit surfaced one other thing
    worth recording as a **known, deliberately-not-fixed issue**: the
    sitewide `.cookie-consent` banner (`position: fixed; bottom: 12px`)
    can overlap the bottom of the hero's `.app-preview` mock on a
    fresh visit at shorter viewport heights, since a fixed-bottom
    banner and a tall hero will always compete for the same screen
    space on some window sizes. This is pre-existing, identical on
    every page sharing the banner, not something this pass introduced
    or worsened, and fixing it would mean changing shared banner
    behavior site-wide - out of bounds for a landing-page-only pass.
    Verified with Playwright: `#free-tools`'s background resolves to
    the `--accent-tint` token, the About section's copy mentions all
    five tools and its `#free-tools` link actually scrolls there, and
    the full existing regression suite (hero copy, tool links,
    feature-grid card count, FAQ count, zero console errors, zero
    mobile overflow at 360/390/414px) still passes unchanged.
- **The Hero's `.app-preview` mock (the fake screenshot of the POS)
  lives inside a `.browser-frame` desktop-browser chrome mockup** -
  three traffic-light `.browser-dot`s plus a pill `.browser-url` bar
  reading "🔒 goonlinepos.com/app" (a lock SVG plus the text, not a
  real browser feature, just a static visual to read as a genuine
  desktop tab) - rather than sitting as a bare card straight on the
  page background like before. Two small rotated `.preview-badge`
  pills float at the frame's top-left and bottom-right corners ("⚡ No
  installs, opens instantly" / "🔒 Runs 100% in your browser") for a
  catchier, more typical modern-SaaS-landing-page look; both are
  `position: absolute` with small positive corner offsets (`top: -16px;
  left: 28px` / `bottom: -16px; right: 28px`), deliberately **not**
  negative-into-the-margin offsets - an earlier attempt positioned them
  further outside the card (`left: -22px` etc.) which read fine on very
  wide viewports but overlapped straight on top of the toolbar content
  on narrower ones, so it was corrected to sit just inside/at the
  frame's own corners instead. Both badges are hidden below `900px`
  (`@media (max-width: 900px) { .preview-badge { display: none; } }`)
  since there's no room for them once `.app-preview` collapses to a
  single column. **The mock's toolbar was also brought back in sync
  with `app.html`'s real, already-trimmed toolbar** (see
  "`app.html` — architecture" below) - it had drifted stale, still
  showing Premium/Summary/Print/Inventory icons and a toolbar "+ New
  Sale" pill that don't exist in the real app anymore. It now shows,
  in the real app's exact order: a "☰ Hide Toolbar" chip, the Cashier
  select, then icon buttons for How To Use (❓), Settings (⚙), End of
  Day (📅), Customer Screen (📺), and Backup (💾) - and "+ New Sale"
  moved out of the toolbar row entirely into the product panel itself,
  as a full-width `.ap-new-sale-btn` directly under the Barcode Scanner
  toggle and above the search box, mirroring exactly where
  `#newSaleButton` actually lives in `#catalogView`. **The toolbar row
  is grouped for wrapping, not a single flat flex row** - `.ap-toolbar`
  has two children, `.ap-toolbar-left` (Hide Toolbar chip + Cashier
  select) and `.ap-toolbar-icons` (the 5 icon buttons, `margin-left:
  auto`), with `flex-wrap: wrap` on the parent. This was a fix, not the
  original structure: a single flat row of Hide-Toolbar-chip / Cashier
  select / spacer / 5 icons had no `flex-wrap`, so on narrow mobile
  viewports the icons simply overflowed past the card's right edge
  (the Backup icon visibly rendered outside the white
  `.browser-frame`) instead of wrapping inside it. Grouping the icons
  into their own wrapper means the whole group wraps as one unit onto
  its own line under the left group when space is tight, rather than
  splitting mid-row and spilling the last icon or two outside the
  card - verified with Playwright at 360/390/414/480px that every
  `.ap-toolbar-icon`, Backup included, stays fully inside
  `.browser-frame`'s own box at each width. **The feature grid below
  (`.feature-grid`, "Set it up your way" section) was missing an End of
  Day card** - it listed Sales History, Full backup & restore, and
  Offline Mode POS but never mentioned the End of Day report feature
  (see `end-of-day.html` below) at all. Added a "End of Day report"
  `.feature-card` (a calendar SVG icon, matching the mock toolbar's own
  📅 End of Day icon) between "Sales history, editable" and "Full
  backup & restore", so it now sits in the same neighborhood as the
  other reporting/data-safety cards it was grouped with in the user's
  own framing ("along with backup and offline mode"). **"Create
  invoices"/"Create receipts" cards and the Pricing Calculator's
  `.tool-spotlight` panel, both once part of this grid, are now
  retired** - see "Landing-page branding refresh" below for the full
  story. All tool-promo content (all five free tools, not just
  Invoice/Receipt/Pricing) now lives in its own dedicated `#free-tools`
  section further down the page instead, so `.feature-grid` holds only
  genuine POS capabilities again. To keep a clean 5-full-rows-of-3
  layout once those cards left (which would otherwise have dropped the
  grid back to 13 cards and reopened the exact stranded-last-card
  problem the 13→15 change above was meant to fix), two more real,
  previously-undocumented-on-the-homepage capabilities were added
  instead of re-using tool promos: **"Search & filter products"** (a
  magnifying-glass icon, right after "Upload your products" -
  `#productSearch`'s live search plus `#categoryChips`'s category
  filter chips in `app.html`'s catalog panel, confirmed real via
  `app.html:536,538`) and **"Multiple currencies"** (a circled
  dollar-sign icon, right before "Six languages" - Settings → Currency's
  `#currencyCode`/`#currencySymbol` fields, confirmed real via
  `app.html:1005-1013` and the homepage's own pre-existing "Can I
  change the currency?" FAQ answer). `.feature-grid`'s
  `grid-template-columns` also changed from a fixed `repeat(3, 1fr)` to
  `repeat(auto-fit, minmax(260px, 1fr))` (the same pattern `blog.html`'s
  `.post-grid` already uses) as part of the same pass - **this alone
  does not fix a stranded last-row card**, a lesson worth keeping: a
  single CSS grid computes one shared set of column tracks for every
  row, so a lone item in the last row still sits in just the first
  track at full column width, with the remaining tracks empty beside it
  - identical to what a fixed `repeat(3, 1fr)` already did. `auto-fit`
  only changes how many columns exist at a given viewport width (useful
  for responsiveness), it does not center or stretch a short final row.
  The real fix for a stranded card is still what it always was on this
  page: keep the card count a clean multiple of the column count.
  Verified via Playwright (comparing each card's
  `getBoundingClientRect().top`/`width`) that the last row is a full,
  evenly-widthed row of 3 at 1400px desktop width, with zero console
  errors.
- **The `.app-preview` mock's 3 catalog products are Pepperoni Pizza /
  Cheeseburger / French Fries with real embedded photos**, not the
  earlier Coca Cola/White Bread/Bottled Water line-up (which used flat
  CSS-gradient thumbs and a 📦 emoji placeholder, no actual photos).
  Each `.ap-product-thumb` is now an `<img>` (`object-fit: cover`) with
  a `data:image/jpeg;base64,...` source - a 160×160 JPEG, quality 72,
  matching `app.html`'s own `compressProductPhoto()` convention (see
  "Product photos" under "`app.html` — architecture" below) even though
  this mock has no connection to that code. **Sourcing real, clearly-
  licensed food photos was the hard part** - this sandbox's egress
  proxy blocks essentially every stock-photo/image host outright
  (Unsplash, Pexels, Pixabay, Wikimedia's own upload CDN, Wikipedia,
  Freepik, foodiesfeed, etc. all return a hard 403 at the proxy) with
  the sole exception of GitHub's own CDN domains
  (`raw.githubusercontent.com`, `github.com` page fetches, `avatars`/
  `objects.githubusercontent.com`) - `api.github.com` and the
  `mcp__github__` tools stay scoped to this repo only and were
  deliberately **not** used to browse other people's repos, but a plain
  HTTPS fetch of a public raw file is unauthenticated CDN content, not
  a GitHub-API call, so it's outside that scoping. The three photos were
  sourced by searching for small, actively-forked "free to use" static
  HTML restaurant/food website template repos (the kind meant to be
  cloned and deployed as-is for a portfolio project) and cropping real
  product shots out of their bundled images, rather than guessing at
  ML-dataset repos (checked and rejected - e.g. `Ismael-Deka/Food-
  Classification-DL` openly says its images were "scraped from various
  sources (Pinterest, tumblr, reddit, etc)", clearly not reusable) or a
  paid-course repo whose images aren't the course author's to relicense.
  Pizza and the burger crop both came from `atulcodex/Restaurant-
  website` (`img1.jpg`, `bg2.jpg` - repo README states "This work is
  totally open-source and free to use"); French fries was cropped from
  `codewithsadee/foodhub-restaurant-website`'s `menu4.jpg`, a single
  photo showing both a burger and a metal cup of fries side by side -
  **the burger crop from that same photo was rejected** because its
  background visibly shows a branded "GOURMET BURGER KITCHEN" cup (a
  real UK restaurant chain), so a tighter, brand-free crop of just the
  fries cup was used instead and the burger photo came from the other
  repo. If either source repo ever disappears or a new set of photos is
  wanted, redo this same search-and-crop process rather than reaching
  for a random stock site - this sandbox genuinely cannot reach one.
  Category chips changed from All/Bakery/Beverages to All/Food/Sides to
  match, and the receipt line items/totals were recomputed to match the
  new catalog (Pepperoni Pizza $8.50 + French Fries ×2 $5.00 = $13.50
  subtotal, $1.35 tax, $14.85 total) so the mock stays internally
  consistent. The now-dead `.ap-thumb-cola`/`.ap-thumb-bread`/
  `.ap-thumb-placeholder` gradient/placeholder CSS rules were removed
  along with the HTML that used them. **`.ap-receipt-store`/
  `.ap-receipt-details`** (the mock's own store name/Tel/Email/Website
  lines) read "Demo Store" / "Tel: +000 000 000" / "Email:
  Demo@example.com" / "Website: Goonlinepos.com" - matching
  `app.html`'s own default Store Name/Store Details exactly (see
  "Default store name/details are obviously-fake placeholder data"
  under "`app.html` — architecture" below) rather than showing the
  site's real brand name/domain as if it were an actual store.

## `app.html` — architecture

Client-only, no server. All persistence is local to the browser. The one
exception is the optional Account & Subscription / Cloud Sync system,
which calls out to Supabase — see "Account & Subscription" and "Cloud
Sync" below; everything else still has zero network calls.

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
- **Default store name/details are obviously-fake placeholder data, not
  the site's own brand.** `#storeName`'s default `value` and
  `#storeDetails`' default `<textarea>` content (Settings → Store) read
  "Demo Store" / "Your Company Address: / Tel: +000 000 000 / Email:
  Demo@example.com / Website: Goonlinepos.com" - deliberately unreal
  contact info (`+000 000 000`, `Demo@example.com`) so nobody mistakes
  it for a real phone/email and so it's obvious at a glance this needs
  replacing with the shop's actual details before printing real
  receipts. This used to default to the literal site brand
  ("GoOnlinePOS.com" as both store name and website, `example@`/`+1
  123-4567` as contact info) - a real problem, since a shop owner who
  never opened Settings → Store would otherwise print receipts
  branded with this site's own name instead of their business, or a
  contact number that looked real enough to not obviously be a
  placeholder. Every other **fallback** that shows when `storeName` is
  literally blank was changed to match (`"Demo Store"`, not
  `"GoOnlinePOS.com"`) - `receiptStoreName`'s initial HTML text and its
  fallback in both `modules/receipt.js` and the sale-reprint path in
  `app.html` itself, `customer.html`'s `csStoreName` (initial text +
  fallback), and `end-of-day.html`'s `rhStoreName` (initial text +
  fallback) - so a blank store name reads the same "this is a demo"
  signal everywhere a receipt-like store name can appear, not just on
  the main checkout receipt. The homepage's `.app-preview` mock (see
  below) was updated to match too, for the same reason plus simple
  consistency between the marketing screenshot and the real default.
  Legitimate uses of the actual site brand - the header's own
  `<title>`/meta tags, `customer.html`'s "Powered by GoOnlinePOS.com"
  footer, the site-wide header/footer links - were deliberately left
  alone; only the store-name placeholder/fallback occurrences changed.
- **`init()`** (bottom of the script, called immediately) sequentially
  awaits `loadSettings → loadPaymentMethods → loadCashiers →
  loadActiveCashier → loadProductsFromStorage → loadLogo →
  loadSalesHistory → loadBackupNoticeState → loadReceiptPrefix →
  loadPremiumStatus → startFirstSale`, then wires up paper size/zoom/date/
  language/receipt rendering and a 1s clock tick.
- **i18n:** one `translations` object keyed by language code — `en`, `ar`,
  `fil`, `hi`, `es`, `th` — each a flat string dictionary, split out into
  `modules/translations.js` (loaded before the main inline script, same
  as the other `modules/` files — see below). `tr(key)` looks up
  `currentLang()` and falls back to `en`. New user-facing strings must
  be added to **all six** language blocks (or at least `en` as fallback).
- **Header toolbar toggle:** `.header-actions` (the second of the
  `app-header`'s two rows - see "Site-wide header, nav & footer" above
  for the first) wraps its shortcut buttons - just the Cashier select,
  How To Use, Settings, End of Day, Customer Screen, and Backup, the
  deliberately trimmed-down set described above (New Sale moved out of
  this row entirely - see the same section for where) - in `#headerActionsGroup`
  (`display: contents`, so it doesn't affect the flex layout), preceded by
  `#toolbarToggleBtn` (`toggleToolbar()`) which toggles `.hidden` on that
  group to collapse the whole row down to just itself — reclaiming
  vertical space for the product grid/receipt below. **The top row's
  `.header-links` (Homepage/Blog/Free Invoice Generator/Free Receipt
  Generator - see "Site-wide header, nav & footer" above) is a sibling
  of `.header-actions`, not inside `#headerActionsGroup`** - hiding the
  toolbar never hides that row, since those are "leave the app" links
  rather than per-sale operational shortcuts. Deliberately **not persisted** — every fresh page load
  starts expanded regardless of what was chosen last time;
  `renderToolbarToggle()` keeps the button's own label
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
  badge) is a plain `<div>`, not an `<a href="/">` — it used to
  double as an unguarded way back to the homepage, but that bypassed
  the in-progress-cart safety check entirely (`cart` is in-memory only,
  never persisted — navigating away loses it) and was easy to trigger
  by accident. There used to be a dedicated `#homeShortcutButton` →
  `goHome()` (confirm-then-navigate-in-place) for this; both the button
  and the function were **deleted outright** once `.header-links`'
  `#homepageShortcutButton` (see "Site-wide header, nav & footer" above)
  became the only "leave the app" link left in the toolbar - and unlike
  the old Home button, it opens `/` in a **new tab**
  (`window.open('/', '_blank')`), so the cart-loss risk `goHome()` was
  written to guard against doesn't exist for it in the first place: the
  original tab with the in-progress sale never navigates anywhere.
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
- **Cart/checkout:** `addProductToCart` → `computeTotals()` → `goToCheckout`
  → split payments via `paymentRows` → `printReceipt()`.
  `computeTotals()` is a thin wrapper around the shared
  `computeTotalsFromItems(items, taxRate, discountType, discountValue)`,
  which also powers the Sales History detail editor
  (`recomputeSaleDetailTotals`/`saveSaleDetailEdits`) so both places use
  identical math. **Discount is flexible per transaction, applied directly
  at checkout** — `#discountType` (`percent` | `amount`, defaults to
  `percent`) sits next to `#discountRate` in `#checkoutView` itself, right
  under the Total Due box, above Customer Name — not in Settings, since
  it's a per-sale action the cashier makes at the point of sale, not a
  store-level config. `amount` mode clamps to the subtotal so the total
  can never go negative. It's still persisted via
  `storageSet("pos-settings")` like tax rate/name (so a mid-transaction
  page refresh doesn't lose it), but `startNewSale()` explicitly resets
  both fields back to `percent`/`0` after every completed sale (or an
  explicit "New Sale") — otherwise a one-off discount for one customer
  would silently carry over and discount every sale after it. It does
  **not** reset on Back → Checkout within the same still-in-progress sale.
  Settings → Tax (renamed from "Tax & Discount" now that Discount moved
  out) keeps only Tax Name/Tax Rate, genuine store-level config that
  should persist indefinitely, plus a one-line `#discountMovedInfo` note
  pointing to checkout.
  **Tax exemption is per item, settable both on the product and at
  checkout** — each `products[]`/`cart[]` entry carries a `taxExempt`
  boolean; a checkbox in Settings → Products (add form + each row in the
  manage-list) sets the catalog default, and a matching checkbox on every
  cart line (`.cart-tax-exempt-label`, next to qty/remove) lets the
  cashier override it per sale, including for custom/manual items. The
  discount is spread proportionally across taxable vs. exempt line totals
  before tax is computed on the taxable share only, so a flat or percent
  discount doesn't shift how much of the total counts as taxable. Both
  `discountType` and each item's `taxExempt` are saved on the
  `salesHistory` record so reopening a past sale for editing recomputes
  correctly instead of silently reverting to percent-only/all-taxable.
  **Optional per-item description, tick-to-reveal, at checkout and in
  Sales History editing only** — each `cart[]`/`saleDetailItems[]` entry
  carries `description` (string) and `showDescription` (boolean); the
  tick (`.cart-description-label` in the cart, `.sdi-description-toggle`
  in the Sales History edit modal) toggles a small text field under the
  item name (`.receipt-item-description-input`, a `contenteditable` div
  in the cart, matching `.receipt-item-name-input`'s own pattern; a
  plain `<input class="sdi-description">` in the edit modal). Unticking
  hides the field but keeps whatever was typed, so re-ticking restores
  it — same "toggle hides, doesn't clear" convention as
  `receipt-generator.html`'s Remarks toggle. **Deliberately not on the
  product itself** — `products[]` has no `description` field and
  Settings → Products was not touched; a description is something a
  cashier adds fresh per sale (e.g. "no onions", "gift wrapped"), not a
  catalog default. Persisted onto the `salesHistory` record only when
  the tick is on and the text isn't blank
  (`(c.showDescription && c.description) ? c.description.trim() : ""`
  in `saveCurrentSaleToHistory()`/`saveSaleDetailEdits()`), so a plain
  sale with no descriptions used produces byte-identical `items[]`
  entries to before this feature existed. Prints as a small italic line
  under the item name (`.receipt-item-detail-print`'s same muted-gray
  treatment, forced to solid black in `@media print` like every other
  receipt line) - **only when non-empty**, so an item without a
  description gets zero extra vertical space on the printed receipt,
  not an empty line. The tick/checkbox itself lives inside
  `.receipt-item-controls`, which already carries `no-print`, so it
  never appears on paper. `printHistoricalReceipt()` (the Sales History
  reprint path) renders the same conditional description line from the
  saved record. Ships in the offline package same as the rest of
  `app.html`/`modules/receipt.js` - no `OFFLINE-STRIP` marker, since
  this isn't a network-dependent or Premium-only feature. Verified with
  Playwright end-to-end: tick reveals the field, text persists through
  untick/retick, print media hides the controls row and renders the
  description in black with `pointer-events: none`, a completed sale
  saves the description into `salesHistory`, reopening it in Sales
  History shows and lets you edit it, the edit persists back to
  `salesHistory`, the reprint path renders it, an item with no
  description produces no stray `.receipt-item-description-input` div
  at all, and the built offline `app.html` carries the CSS/markup with
  zero leftover `OFFLINE-STRIP` markers.
- **Sales history:** completed sales pushed into `salesHistory` and
  rendered grouped by date (`renderSalesHistoryPanel`,
  `saleDateKey`/`toggleHistoryGroup`); each sale can be reopened
  (`openSaleDetail`), edited, and reprinted. Summary panel
  (`renderSalesSummary`) breaks totals down by payment method and by
  cashier.
- **Inventory:** optional per-product stock tracking, decremented on sale;
  editable in Settings → Inventory (`renderInventoryList`); exportable.
- **Products:** manual add, or bulk upload from **either CSV or Excel
  (`.xlsx`/`.xls`)** (`handleProductFileUpload`, columns Name/Price/
  Category/SKU, optionally Stock and TaxExempt — `Yes`/`Y`/`True`/`1`
  all parse as exempt, anything else as taxable) that **replaces** the
  whole catalog. The file input's `accept` covers both extensions/MIME
  types; `handleProductFileUpload` sniffs the filename
  (`/\.xlsx?$/i`) to decide whether to `reader.readAsArrayBuffer()` +
  `XLSX.read(...)` (the same `vendor/xlsx.full.min.js`/SheetJS library
  already used for `.xlsx` exports below - it reads workbooks too, not
  just writes them) or `reader.readAsText()` + the existing hand-rolled
  `parseCSV()`. Both paths converge on the same
  `XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false })`-
  shaped array-of-arrays, so the actual column-detection/row-building
  logic (`productRowsFromParsed()`, extracted verbatim from the old
  CSV-only `handleCsvUpload`) is shared and format-agnostic - it doesn't
  know or care whether a row came from a spreadsheet or a text file.
  "Download Sample CSV" and "Download Sample Excel" sit side by side
  (`downloadSampleCsv()`/`downloadSampleExcel()`, both built from the
  same `sampleProductRows()` data so the two files always stay in sync),
  plus "Clear Products". This was a deliberate add-Excel-without-
  breaking-CSV choice, not a replacement - Excel is the more familiar
  format for most shop owners maintaining a product list, but nothing
  about the existing CSV workflow (or any external tooling built around
  it) changes.
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
- **Barcode scanning:** USB barcode scanner support, keyboard-wedge style
  (a USB scanner acts as a keyboard — it "types" the scanned code then
  presses Enter). `modules/usb-scanner.js` listens for `keydown` on
  `document`; a burst of keystrokes arriving less than
  `USB_SCAN_MAX_GAP_MS` (50ms) apart, ending in Enter, at least
  `USB_SCAN_MIN_LENGTH` (3) characters long, is treated as a scan and
  matched against product SKU (`handleUsbScannedCode`) — human typing
  speed is well above that gap, so it's never mistaken for a scan.
  Capture is **global but pauses whenever a text-entry element is
  focused** (`isTextEntryElement()` checks `document.activeElement` for
  `INPUT`/`TEXTAREA`/`SELECT`/`contenteditable`) so a scan never leaks
  keystrokes into whatever field a cashier happens to be editing — it
  only fires when focus is elsewhere (a button, the body, nothing).
  Toggleable via the **"Barcode Scanner" toggle** (`#barcodeScannerToggle`,
  the same toggle/storage key — `barcodeScannerEnabled` — that predates
  this feature) on the main screen, **default ON**: the checkbox carries
  `checked` in the markup and `loadSettings()` only unchecks it when
  `pos-settings` has `barcodeScannerEnabled` explicitly stored as
  `false`, so both a brand-new visitor and a returning user who never
  touched the setting default to on. `toggleBarcodeScannerSetting()`
  just persists the checkbox state via `saveSettings()` — no separate
  enable/disable call into the module, since `handleUsbScanKeydown()`
  reads the checkbox live on every keydown. A match calls
  `addProductToCart()` and shows a floating `.usb-scan-toast` (reusing
  the `scannerFound`/`scannerNotFound` translation keys); no match shows
  the same toast with the "not found" text. This replaced an earlier
  camera-based scanner (`@zxing/browser` driving `getUserMedia()`) that
  was disabled/WIP in the shipped build (`openScanner()` opened with
  `alert("Coming soon"); return;` before any camera code ran) and, per
  the site owner, wasn't working out after repeated attempts to fix it —
  removed entirely rather than left half-working: `modules/scanner.js`,
  `vendor/zxing-browser.min.js`, the `#scannerOverlay` camera/video/torch
  UI, its `.scanner-overlay`/`.scanner-body`/`.scanner-frame`/
  `.scanner-torch-btn`/`.scanner-hint`/`.scanner-message` CSS, and the
  `scannerTitle`/`scannerHint`/`scannerUnsupported`/`scannerNoCamera`
  translation keys (all six languages) are gone. `.scanner-modal`/
  `.scanner-header` CSS **stayed** — despite the name, those are the
  generic modal-box classes reused by the Customer Screen, Offline
  Download, and Buy Premium modals, not scanner-specific. Verified
  end-to-end with Playwright: a fast keystroke burst + Enter with no
  field focused adds the matching product and shows the toast; the same
  burst while a text input is focused types normally into that field
  with zero cart effect; disabling the toggle suppresses scanning
  entirely; slow (human-speed, >50ms/char) keystrokes are never treated
  as a scan; and a freshly built offline package carries
  `modules/usb-scanner.js` (not `scanner.js`) and reproduces the same
  behavior with zero network calls.
- **Backup/restore:** "Download Backup" serializes all local state to a
  JSON file; "Restore from Backup" (`handleBackupFileSelect`) replaces
  everything and reloads the page. This is one of two ways data survives a
  cleared browser/new device now - the other is the optional Cloud Sync
  feature immediately below. `downloadFullBackup()`/`handleBackupFileSelect()`
  were refactored to route through two shared helpers,
  `buildBackupPayload()`/`applyBackupPayload(backup)`, with byte-identical
  behavior - Cloud Sync (below) reuses both instead of duplicating the
  local-state serialization/restore logic.
- **Cloud Sync (Premium)** - an optional, local-first-by-default
  alternative to the file-based Backup/Restore above, in the same
  Settings → Backup panel, right below "Restore from Backup".
  Deliberately does **not** change the core "no signup, no login" promise
  made throughout `index.html` (hero, trust bar, FAQ) - the app works
  exactly as before with zero signup; Cloud Sync is purely an opt-in
  extra for shop owners who want it, wrapped in its own
  `OFFLINE-STRIP:CLOUD-SYNC-SECTION`/`ACCOUNT-SCRIPT` markers (HTML +
  the `vendor/supabase.min.js`/`modules/account.js`/`modules/cloud-sync.js`
  script tags) so it never ships in the "Download Offline POS" package -
  cloud sync needs a network connection, which the offline copy
  deliberately has none of.
  - **Gated on `premiumUnlocked` directly**, the same global every other
    Premium feature checks - `applyPremiumLocks()` toggles
    `#cloudSyncLockMsg`/`#cloudSyncUnlockedContent` from it inline,
    alongside logo/receipt-number/inventory/customer-screen/offline-
    download. Since the only way to become Premium on the live site now
    is signing in and redeeming a code (see "Account & Subscription"
    below), `premiumUnlocked` being true already implies being signed
    in - there's no separate PROMO1-style exclusion check needed the way
    an earlier version of this feature had. The Backup tab's Cloud Sync
    section has no sign-in button of its own; its lock message points to
    Settings → Premium (now "Account & Subscription") to sign in and
    redeem a code.
  - **Auth is Supabase Auth** (Google, or any other provider enabled in
    the Supabase dashboard - see `supabase/README.md`), but the session/
    client layer now lives in **`modules/account.js`**, not here -
    `getSupabaseClient()`, `initAccount()`, `signInWithGoogle()`/
    `signOutAccount()` are all defined there and shared by both this
    feature and the Account & Subscription panel (one Supabase session
    for the whole app, not a separate one per feature - see "Account &
    Subscription" below for the full breakdown). `modules/cloud-sync.js`
    itself only calls `getSupabaseClient()` and checks the shared
    `premiumUnlocked` flag - it has no sign-in/session code of its own
    anymore. `SUPABASE_URL`/`SUPABASE_ANON_KEY` (the project's public URL
    and anon/publishable key - safe to embed client-side by design,
    Supabase's own model) live in `modules/account.js` near the top; every
    read/write is still enforced by the Row Level Security policies in
    `supabase/schema.sql` regardless.
  - **"Backup to Cloud" / "Restore from Cloud" are full-replace
    operations**, not incremental/bidirectional sync - deliberately kept
    as simple as the existing file-based Backup/Restore rather than
    building a conflict-resolution engine for a feature nobody asked for
    that level of complexity on. `pushBackupToCloud()` builds the same
    payload `buildBackupPayload()` already produces for the downloadable
    JSON backup, then **upserts** `store_settings` (one row, keyed on
    `user_id`) and **replaces** (`delete` all existing rows for that
    user, then bulk `insert` the current state) `products`, `cashiers`,
    `payment_methods`, and `sales` (whose `sale_items`/`sale_payments`
    cascade-delete via the FK in `supabase/schema.sql`, then get
    re-inserted alongside their new parent `sales` rows, referenced by a
    client-generated `crypto.randomUUID()` so children can be inserted
    right after their parent without a round-trip to read back
    generated ids). Inserts are chunked at 500 rows
    (`bulkInsert()`/`chunkArray()`) as a simple defensive measure for
    shops with a lot of history. `pullBackupFromCloud()` does the
    reverse - reads every table for the signed-in user and reconstructs
    the exact same payload shape `buildBackupPayload()` produces, then
    hands it to the shared `applyBackupPayload()` (same function the
    file-based Restore uses) and reloads.
  - **Fields without their own column round-trip through jsonb catch-alls**
    already present in `supabase/schema.sql` (`store_settings.settings`,
    `sales.meta`) rather than growing the schema for every minor display
    field - e.g. discount rate/type, zoom, decimal places, active
    cashier name, and (per-sale) currency code/symbol/decimal places at
    the moment of that specific sale. `sales.document_type` **was** added
    as a first-class column (not jsonb) since it's a real, meaningful
    field ("Receipt"/"Invoice"/"Payment") - both `document_type` and
    `meta` were added to `supabase/schema.sql` in the same pass that
    wired up this feature (the schema was authored, then merged,
    *before* Cloud Sync was built; these two additions are why
    `schema.sql` has `alter table ... add column if not exists`
    statements right after the `create table` block for `sales` - so
    re-running the file against a project that already had the
    pre-Cloud-Sync version applied still picks up the new columns
    instead of silently missing them).
  - Sale date/time round-trips through `saleDateTimeToIso()`/
    `isoToSaleDateTime()`, converting between `app.html`'s own
    `"DD/MM/YYYY HH:MM:SS"` local-time string format (see `updateDate()`)
    and the `timestamptz` column Postgres expects - matching
    `updateDate()`'s own construction exactly so the round trip is
    lossless up to display precision.
  - **Verified with a real local Postgres instance plus a mocked
    Supabase client, not a live project** - this sandbox's egress proxy
    has a hard, unrelated organizational policy blocking `*.supabase.co`
    entirely (confirmed via the proxy's own status endpoint - not a
    project-specific or credentials problem), so an actual live
    connection could not be exercised from here, the same class of
    limitation `contact.html`'s OTP flow and (formerly)
    `premium-validation/AppsScript.gs` already documented for their own
    Apps Script endpoints. What *was*
    verified: `supabase/schema.sql` (fresh install, a second idempotent
    run, and an upgrade-from-the-pre-`document_type`/`meta` version) all
    ran cleanly against a throwaway local PostgreSQL 16 instance;
    `vendor/supabase.min.js` genuinely loads in a real browser and
    `createClient()` produces a working client; and, against a
    hand-written mock standing in for the real Supabase client (matching
    this repo's established pattern for untestable third-party
    endpoints), `pushBackupToCloud()` issues the correct
    delete-then-insert sequence with correctly-mapped rows for a seeded
    cart/sale, and `pullBackupFromCloud()` reconstructs a `salesHistory`
    record byte-for-byte identical in shape to what
    `saveCurrentSaleToHistory()` itself produces. (The Premium-gate/
    sign-in verification itself now lives under "Account & Subscription"
    below, alongside the code it tests.) Confirm the actual live round
    trip once deployed - this sandbox cannot.
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
  package, and now Cloud Sync too) via `applyPremiumLocks()`, which just
  toggles `disabled`/hidden classes on DOM elements — UI-level gating,
  not a real entitlement check. **No auto-unlock on the live site** — a
  fresh sign-in starts on the free tier and stays that way until a code
  is redeemed (see "Account & Subscription" below); the offline build
  still auto-unlocks on first launch via its own separate local code,
  unchanged from before. How Premium gets granted is now two entirely
  different mechanisms depending on build — see "Account & Subscription"
  and "Download Offline POS" below.
  `applyPremiumLocks()` also calls `renderAppTitleBadge()`, which reflects
  actual status in the header — `#premiumBadgeAppTitle` reads "Premium"
  (gold `.premium-badge`) only once really unlocked, "Basic" (gray
  `.basic-badge`) otherwise; it used to always read "Premium" regardless
  of status. `changeLanguage()` also calls it directly, so it re-translates
  on a language switch without needing a status change.
- **Retired: `#premiumPromoNotice`.** A dismissible "Activate Your Free
  Premium Now" banner used to sit here, nudging every visitor to
  one-click-activate the old auto-granted `PROMO1` code
  (`refreshPremiumPromoNotice()`/`dismissPremiumPromoNotice()`/
  `activateFreePremiumFromNotice()`). Removed outright, HTML/CSS-class
  reuse and all, once the live Premium system moved to the sign-in +
  redeem model under "Account & Subscription" - there's no more
  auto-granted free code to promote, so the banner had nothing left to
  do. `#backupNotice` (the sibling banner it was styled after) is
  unaffected and still works exactly as before.
- **Cookies/consent + analytics/ads:** `loadAnalyticsAndAds()` at the top
  of the script conditionally injects Google gtag/AdSense based on a
  stored cookie-consent choice (`onlinepos` cookie-banner flow at the
  bottom of the file, separate from the app's own `onlinepos_*` storage
  keys).
- **"How To Use" panel** (`#howToUseOverlay`, `openHowToUse()`/
  `closeHowToUse()`) — an in-app walkthrough covering every setting,
  reachable via the header toolbar's **`#howToUseButton`**. Briefly moved
  into `#settingsTabRail` as a plain, non-`data-tab` entry when the
  toolbar was first trimmed down (see "Site-wide header, nav & footer"
  above), then moved back to the toolbar once New Sale needed that
  settings-tab-rail idea's slot instead - New Sale ended up relocated to
  `#catalogView` itself, not into Settings, so How To Use kept its own
  toolbar button after all. Replaces the old standalone `guide.html`
  marketing page as the walkthrough's home — see "Retired pages" under
  SEO below for why that page was pulled out of navigation rather than
  deleted. Deliberately **text-only** (a `.htu-item` title +
  description per section, 18 sections total including one new "End of
  Day" section `guide.html` never had) — no screenshots, unlike
  `guide.html`'s photo-heavy original. Screenshots showing "what does
  Settings → Store look like" are redundant once you're already inside
  the app and can just click over and look, and skipping them avoids
  bundling 17 more `guide-*.png` images into the offline package. Both
  functions live **outside** the `OFFLINE-STRIP:BUY-PREMIUM-JS` marker
  block right above them (easy to mix up since they sit immediately
  after it in the file) since this panel ships in the offline build —
  unlike Buy Premium, there's nothing about it that depends on the
  network. `howToUseShortcutLabel` is the only piece of this feature in
  `modules/translations.js` (the button label, all six languages); the
  panel's own content is English-only, same as `invoice-generator.html`/
  `receipt-generator.html`/`end-of-day.html`.

## `modules/` — split-out app.html pieces

Four self-contained slices of `app.html`'s logic live in their own files
under `modules/`, loaded via plain `<script src="modules/...">` tags
(classic scripts, **not** `type="module"`) placed right after the
`vendor/` script tags and before the main inline `<script>` block. This
was a deliberate choice over ES modules: `type="module"` scripts are
blocked by browsers on `file://`, which would break the documented
"double-click `app.html` to run it, no server needed" path (see
"Download Offline POS" below) — plain classic scripts share the same
global scope as the main inline block regardless of load order (`let`/
`const`/functions declared in one classic `<script>` are visible to
every other classic `<script>` in the same document), so this is a
drop-in split with no behavior change, not a rewrite.

- **`modules/translations.js`** — the entire `const translations = {...}`
  i18n dictionary (all six languages), extracted verbatim. By far the
  single biggest contributor to `app.html`'s line count before the
  split (~550 lines of largely repetitive key/value pairs) and the one
  piece with zero logic — pure data — so it was the first candidate to
  pull out once `receipt.js`/`usb-scanner.js`/`offline-builder.js`
  already existed. Loaded first among the `modules/` scripts since nothing
  else depends on load order here, just needs to exist before any
  `tr(key)` call fires at runtime.
- **`modules/usb-scanner.js`** — USB barcode scanner support (see
  "Barcode scanning" above for the full behavior): `handleUsbScanKeydown`
  (the `document` `keydown` listener), `isTextEntryElement`,
  `handleUsbScannedCode`, `showUsbScanToast`, and their backing state
  (`usbScanBuffer`, `usbScanLastCharTime`, `usbScanToastTimeout`). This
  replaced the earlier `modules/scanner.js` (camera-based, `@zxing/browser`)
  when the camera scanner was removed for not working out — see "Barcode
  scanning" above for why.
- **`modules/receipt.js`** — receipt/checkout math and rendering:
  `printReceipt`, `computeTotalsFromItems`/`computeTotals`,
  `renderReceiptItems`, `updateTotalsAndHeader`, `updateReceipt`,
  `getDocumentTitle`. `updatePrintStyle()` and `updateZoom()` stayed
  behind in `app.html` (paper-size/settings glue shared with the Settings
  panel, not receipt content itself) and are called from here as globals.
- **`modules/offline-builder.js`** — the "Download Offline POS" zip
  builder: `OFFLINE_PREMIUM_CODE`, the download modal's open/close/agree
  handlers, `fetchOfflineText`/`fetchOfflineBlob`, `stripMarked`,
  `buildOfflineAppHtml`/`buildOfflineCustomerHtml`, and
  `confirmOfflineDownload`. Its own `<script src="modules/offline-builder.js">`
  tag is wrapped in a `<!-- OFFLINE-STRIP:OFFLINE-BUILDER-SCRIPT:START/END -->`
  marker (same pattern as the `JSZIP` script tag right above it) so it's
  dropped from the generated offline package entirely — an offline copy
  has no download button to trigger it, and it would otherwise try to
  fetch/rebuild a zip of itself. `modules/translations.js`,
  `modules/usb-scanner.js`, and `modules/receipt.js` are **not**
  marker-wrapped since the offline copy still needs all three;
  `confirmOfflineDownload()` fetches them alongside `app.html`/
  `customer.html` and adds them to the zip at those same
  `modules/...` paths so they land where the generated `app.html`'s
  `<script src>` tags expect them. See "Download Offline POS" below for
  the full file list.

`modules/translations.js`, `modules/receipt.js`, and
`modules/offline-builder.js` were extracted verbatim (moved, not
rewritten); `modules/usb-scanner.js` is new code replacing the removed
camera scanner. All verified end-to-end with Playwright: adding a
product, clicking it into the cart, qty +/-, and printing all still
work through `modules/receipt.js`; language switching and `tr()`
lookups across all six languages still work through
`modules/translations.js`; a USB-scanner-speed keystroke burst adds the
matching product while the same burst is inert when a text field is
focused; and a live "Download Offline POS" run produces a zip whose
`app.html` has zero leftover `OFFLINE-STRIP`/`OFFLINE-SWAP` markers,
still defines `translations`/`handleUsbScanKeydown`/`printReceipt` from
the bundled modules, and has no `buildOfflineAppHtml` (correctly
absent, since that module was stripped).

## `vendor/` — self-hosted third-party libraries

Root-level `vendor/xlsx.full.min.js` and `vendor/jszip.min.js` are
unmodified builds pulled straight from the npm registry
(`vendor/LICENSES.txt` has versions/licenses/attribution). `app.html`
loads both via local `<script src="vendor/...">` tags — **not**
cdnjs/unpkg — so the live site has zero third-party CDN dependency.
`customer.html` needs neither. `jszip.min.js` is used only by the
"Download Offline POS" feature below; `xlsx.full.min.js` is also what
gets pulled into the generated offline package. (`vendor/zxing-browser.min.js`
was removed along with the camera barcode scanner — see "Barcode
scanning" above.) `vendor/jsbarcode.min.js` and `vendor/qrcode.js` +
`vendor/qrcode_UTF8.js` (load in that order — the `_UTF8` file patches
the core file) are the same "unmodified npm build" convention, used
only by `barcode-generator.html` — see that page's own section below. None of
the three are referenced by `app.html`/`offline-builder.js`, so they
have no bearing on the offline package. `vendor/supabase.min.js`
(`@supabase/supabase-js`'s own `dist/umd/supabase.js`, unmodified) is
the same convention again, used only by `app.html`'s optional Cloud
Sync feature - see "Cloud Sync" under "`app.html` — architecture" above
and `supabase/` below. Wrapped in its own `OFFLINE-STRIP` marker
alongside `modules/cloud-sync.js`, so it's excluded from the offline
package the same way `jszip.min.js` is.

## `supabase/` — Supabase schema (connected via app.html's Cloud Sync)

`supabase/schema.sql` + `supabase/README.md` are a Supabase PostgreSQL
schema (tables, indexes, RLS policies, a `handle_new_user()` trigger).
It started out authored-but-not-connected, per an explicit "without
connecting yet" request; a later request ("can you connect it to pos
app now?") wired it up for real as `app.html`'s optional Cloud Sync
feature - see "Cloud Sync" under "`app.html` — architecture" above for
the integration itself (`modules/cloud-sync.js`,
`vendor/supabase.min.js`, the Settings → Backup UI). Tables:
`store_settings` (Settings panel, one row per user, plus a catch-all
`settings jsonb` column for anything not worth its own column),
`products`, `cashiers`, `payment_methods`, `sales` (header/totals, with
store name/details/footer snapshotted at sale time for reprints, same
as `app.html`'s own `salesHistory`, plus a first-class `document_type`
column and its own `meta jsonb` catch-all - both added once Cloud Sync
needed them, with `alter table ... add column if not exists` statements
so re-running the file against an already-applied older copy still
picks them up), `sale_items` (line items, including the optional
per-item `description` field), `sale_payments`. Every table carries its
own `user_id` (not just reachable via a join) so RLS can be a single
`auth.uid() = user_id` policy per table. Auth is Supabase's own
built-in `auth.users` - there is no separate users table here - so
enabling Google (or any other OAuth provider) is a
Supabase-dashboard-only step (Authentication -> Providers), not a SQL
change; see `supabase/README.md` for the exact steps.
`SUPABASE_URL`/`SUPABASE_ANON_KEY` (the project's public URL and
anon/publishable key, safe to embed client-side by Supabase's own
design) live in `modules/cloud-sync.js`, not in this folder - this
folder is schema-only. Confirmed via a throwaway local PostgreSQL 16
instance (fresh install, idempotent re-run, and the pre-Cloud-Sync
upgrade path) that the schema itself runs cleanly and the
`handle_new_user()` trigger correctly auto-provisions a default
`store_settings` row - see the Cloud Sync bullet above for what could
and couldn't be verified against the actual live project from this
sandbox. Follow this same "dedicated folder + setup README, no live
credentials in the repo" convention (matching
`contact-form/`/`premium-validation/`) if this schema is extended
further.

## Account & Subscription (live site only) — replaced the old Premium code system

The live site's Premium gate is now Supabase Auth + a `profiles`/
`redemption_codes` pair of tables (`supabase/schema.sql`,
`modules/account.js`) — **not** the Google Sheet + Apps Script system
this section used to describe. Per an explicit "everyone can sign in or
register... redeem a code that extends their subscription" request,
replacing the old system entirely (not running the two in parallel): a
visitor signs in with Google (or any other provider enabled in the
Supabase dashboard - see `supabase/README.md`), gets a free-tier profile
automatically, and redeems a code to become Premium for a limited time
rather than getting an unlimited free grant the moment they show up.
`premium-validation/AppsScript.gs`/`README.md` are **left on disk,
unused** - same "retire, don't delete" convention as `guide.html`/
`about.html`/`how-it-works.html` - in case the site owner still has that
Apps Script deployed and wants to decommission it at their own pace; no
live code calls it anymore.

- **Sign-in is open to everyone, unlike the old code-entry flow which was
  itself the "free" tier.** A new `profiles` row (`subscription_status:
  'free'`, `premium_until: null`) is auto-created for every new
  `auth.users` row by `handle_new_user()` in `supabase/schema.sql` -
  extended from the trigger that already provisioned a default
  `store_settings` row (see "Cloud Sync" above). There is **no more
  auto-grant** - unlike the old `PROMO1`/`autoGrantDefaultPremium()`
  behavior, a brand-new signed-in account starts genuinely free and stays
  that way until a code is redeemed. `PROMO1`/`DEFAULT_PREMIUM_CODE`/
  `CODE_SEAT_LIMITS`/per-device seat limiting are all gone from the live
  system - Premium now follows the signed-in **account**, not a
  per-browser code entry, so there's no device cap to enforce; sign in
  anywhere, Premium comes with you.
- **`modules/account.js`** is the live site's only Premium mechanism now
  - `getSupabaseClient()` (shared with `modules/cloud-sync.js`),
  `initAccount()` (session restore + auth-state listener, called from
  `initPremiumSystem()` in `init()`), `fetchOrCreateProfile()` (reads the
  trigger-provisioned profile; falls back to inserting one itself if
  somehow missing - `profiles` has an owner-insert RLS policy for exactly
  this), `isProfilePremium()` (the actual source of truth -
  `premium_until` in the future - never trusts the `subscription_status`
  text label alone), `lazyExpireProfileIfStale()` (corrects a profile's
  label back to `'free'` in the database the next time it's loaded after
  `premium_until` has passed, so the site owner's own view of the table
  in the Supabase dashboard stays accurate without needing a cron job),
  `signInWithGoogle()`/`signOutAccount()`, `renderAccountPanel()`, and
  `redeemCodeNow()` (calls the `redeem_code` Postgres RPC - see
  `supabase/schema.sql` - and refreshes local state on success).
  `premiumUnlocked` (the same global every Premium-gated feature already
  checked) is now set from `isProfilePremium(currentProfile)` instead of
  a locally-stored flag.
- **Settings → Premium is now "Account & Subscription"**, wrapped in a
  new `<!-- OFFLINE-SWAP:PREMIUM-PANEL:START/END -->` marker (the tab
  itself, `data-tab="premium"`/`premiumTabLabel`, is unchanged - only the
  panel's inner content is swapped, the same "Backup" tab leading to a
  "Backup & Restore" heading precedent already established elsewhere in
  this file) - signed-out shows a single "Sign in with Google" button
  (`#accountSignedOut`); signed-in shows the account's email
  (`#accountEmail`), a Free/Premium status line with the premium-until
  date when applicable (`#accountStatusFree`/`#accountStatusPremium`/
  `#accountPremiumUntil`, formatted by `formatPremiumUntil()`), a Redeem
  Code field + button (`#redeemCodeInput`/`redeemCodeNow()`), and Sign
  Out. **"Get Your Free Trial"** (`#freeTrialBtn` → `openFreeTrial()`,
  wrapped in its own `OFFLINE-STRIP:FREE-TRIAL-BUTTON`/`FREE-TRIAL-JS`
  marker pair) sits directly above "Buy Premium Code" - a single click
  opens `contact` in a new tab (`window.open("contact", "_blank")`, the
  same new-tab pattern every other "leave the app" link already uses),
  so a visitor who wants to try Premium first just messages the site
  owner for a trial code rather than being asked to pay immediately.
  "Buy Premium Code" (`#buyPremiumBtn`/`#buyPremiumOverlay`) is
  unchanged in mechanism - still a purely informational modal pointing to
  `contact.html`, still `OFFLINE-STRIP`-wrapped. Its price changed from a
  one-time `$9.99 USD` to **`$3.99 USD / month`, "Billed monthly"**
  (`#buyPremiumPrice`/`#buyPremiumPriceNote`) - no more lifetime/
  one-time framing, matching the redeemable-code-with-a-duration model
  `redeem_code()` actually implements (a code's `duration_days` already
  meant "not lifetime" from the moment that table was designed - this
  just makes the marketing copy say so too). Its two feature bullets stay
  as reworded (`buyPremiumFeature1`/`2` - "Redeem to extend your
  subscription" / "Works on any device you sign in on"), still accurate
  under the new monthly framing.
- **Cloud Sync's own gating simplified** now that there's exactly one way
  to be Premium on the live site: `applyPremiumLocks()` toggles
  `#cloudSyncLockMsg`/`#cloudSyncUnlockedContent` directly from
  `premiumUnlocked`, the same as every other Premium-gated element in
  that function (logo, receipt number, inventory, customer screen,
  offline download) - the earlier `hasRealPremiumCode()`/
  `refreshCloudSyncLock()` PROMO1-exclusion logic in
  `modules/cloud-sync.js` is gone, since there's no PROMO1-equivalent
  free code to exclude anymore. The Backup tab's Cloud Sync section no
  longer has its own separate sign-in button either - being
  `premiumUnlocked` already implies being signed in (that's the only way
  to get there now), so it just shows Backup/Restore buttons directly
  once unlocked, with the lock message pointing to Settings → Premium to
  sign in and redeem a code.
- **`redemption_codes` is where the site owner creates codes** - open the
  Supabase dashboard, Table Editor → `redemption_codes` → Insert row,
  fill in `code` (redemption is case/whitespace-insensitive -
  `redeem_code()` does `upper(trim(p_code))`) and `duration_days` (how
  many days that specific code grants), optionally a `note` for the
  owner's own reference (e.g. "batch for Facebook promo, Aug 2026"). No
  app code or extra tooling is needed for this - see
  `supabase/README.md`. The table has **zero RLS policies** (default
  deny for anon/authenticated) precisely so a signed-in user can never
  browse, enumerate, or tamper with it directly - the dashboard's own
  service-role access bypasses RLS the same way the `redeem_code()`
  function's `SECURITY DEFINER` does.
- **`redeem_code(p_code)`** (Postgres function, `supabase/schema.sql`) is
  the *only* way `redemption_codes` is ever read or written by anything
  other than the dashboard - called via `supabase.rpc('redeem_code', {
  p_code: '...' })`. Requires a real `auth.uid()` (never takes a user id
  as a parameter, so there's no way to redeem "on behalf of" someone
  else), row-locks the matching code (`for update`) so two people
  redeeming the same code at the same instant can't both succeed, marks
  it used (`is_used`/`used_by`/`used_at`), and extends the caller's own
  `profiles.premium_until` **additively** - redeeming while already
  Premium stacks the new code's days on top of whatever time remains,
  rather than overwriting it, so redeeming early never costs a
  subscriber any remaining days. Returns a small JSON result
  (`{success, reason}` on failure - `not_authenticated`/`invalid`/
  `already_used`; `{success: true, premium_until}` on success) that
  `redeemCodeNow()` maps to the right translated message
  (`redeemCodeInvalid`/`redeemCodeAlreadyUsed`/`redeemCodeSuccess`/
  `redeemCodeNetworkError`).
- **The offline package keeps its own, completely separate, network-free
  Premium mechanism** - unchanged in spirit from before this rework, just
  relocated. `vendor/supabase.min.js`/`modules/account.js`/
  `modules/cloud-sync.js` are wrapped in one
  `OFFLINE-STRIP:ACCOUNT-SCRIPT` marker (renamed from the old
  `CLOUD-SYNC-SCRIPT`, same idea, now covering all three since none of
  them can do anything useful without a network connection) and excluded
  entirely - a downloaded copy has no `window.supabase`, no
  `getSupabaseClient`, no `initAccount`. In their place,
  `modules/offline-builder.js` still uses the
  `OFFLINE-SWAP:PREMIUM-ACTIVATION` marker (same name as before, content
  rewritten) to inject a self-contained `initPremiumSystem()` +
  `activatePremiumCode()` + `unlockPremiumLocally()` +
  `renderPremiumStatus()` that auto-grants Premium on first launch
  (`pos-premium-unlocked` is `null`) using the same
  `OFFLINE_PREMIUM_CODE` constant it always has (`"GOOFFLINE-LIFETIME"`
  placeholder - change it before distributing), and a new
  `OFFLINE-SWAP:PREMIUM-PANEL` marker injects the **old** simple
  status-box + single-input + Activate-button HTML (reusing the
  `premiumPanelTitle`/`premiumPanelInfo`/`premiumActiveLabel`/
  `premiumCodeLabel`/`premiumActivateBtn`/`premiumCodeInvalid`
  translation keys, which are consequently now offline-only - harmless
  dead references on the live build, where those element ids no longer
  exist, same as the `cloudSyncTitle` precedent noted under "Cloud Sync"
  above). The old dropdown-with-a-default-option / change-code / edit
  mode / validity-display machinery (`premiumCodeSelect`,
  `OFFLINE-SWAP:DEFAULT-CODE-OPTION`, `openPremiumCodeEdit()`,
  `pos-premium-validity`) was dropped in the same pass - it existed to
  accommodate the old PROMO1-vs-custom-code distinction, which has no
  offline equivalent (the offline copy only ever recognizes the one
  `OFFLINE_PREMIUM_CODE` string) - so the offline form is now a plain
  text input, no dropdown.
- **Verified two ways, not just by reading the code**: (1) against a
  throwaway local PostgreSQL 16 instance with stub `auth.users`/
  `auth.uid()`/`authenticated` role objects standing in for Supabase's
  own built-ins - a brand-new `auth.users` insert correctly
  auto-provisions a `'free'` profile via the trigger; redeeming a valid
  code correctly extends `premium_until`, marks the code used, and a
  second redeem of the *same* code correctly fails with
  `already_used`; redeeming a second, different code while already
  Premium correctly **stacks** (extends from the existing
  `premium_until`, not from `now()`); an invalid code fails cleanly;
  an unauthenticated call correctly returns `not_authenticated`; the full
  file is idempotent on a second run and upgrades a database that
  already had the pre-`profiles`/`redemption_codes` version applied. (2)
  End-to-end with Playwright against the real app.html (mocking only the
  Supabase client itself, the same pattern used for Cloud Sync and for
  the old Google-Sheet-based Premium system before it, since this
  sandbox's egress policy blocks `*.supabase.co` outright - see "Cloud
  Sync" above): signed-out
  state correctly locks every Premium feature including Cloud Sync;
  signing in on the **free** tier correctly still leaves everything
  locked (a plain account is not enough - a redemption is required);
  simulating a Premium profile correctly unlocks logo/receipt-number/
  inventory/customer-screen/offline-download/cloud-sync all at once and
  flips the header badge to "Premium"; a stale expired-but-still-labeled-
  `'premium'` profile is correctly lazily corrected back to `'free'`;
  the redeem flow correctly handles both success and an
  already-used-code failure with the right messages. Separately, the
  *actual built offline `app.html`* (not just a string check) was loaded
  in a real browser and exercised end-to-end: it auto-grants Premium on
  first launch with zero network calls and zero console errors, correctly
  rejects a wrong code and accepts `GOOFFLINE-LIFETIME` when entered
  manually, defines none of `account.js`'s functions or `window.supabase`
  at all, and has zero leftover `OFFLINE-STRIP`/`OFFLINE-SWAP` markers.
- **Monthly pricing + a free-trial path, added once the account model was
  live.** `$3.99 USD / month` / "Billed monthly" replaced the old
  one-time `$9.99 USD` in the Buy Premium modal (`#buyPremiumPrice`/
  `#buyPremiumPriceNote`, all 6 languages) - a code's `duration_days`
  always meant "not lifetime," this just made the price line say so.
  "Get Your Free Trial" (`#freeTrialBtn` → `openFreeTrial()`) sits above
  "Buy Premium Code" in the same panel, `window.open("contact", "_blank")`
  - a visitor can ask for a trial code before paying, same contact-form
  mechanism the purchase flow already used, just a lower-commitment first
  step. Wrapped in its own `OFFLINE-STRIP:FREE-TRIAL-BUTTON`/
  `FREE-TRIAL-JS` markers, same treatment as "Buy Premium Code" - nothing
  to sell or trial once a copy is already offline. `index.html`'s "Full
  backup & restore" feature-card and the "Where is my data stored?" FAQ
  answer both picked up a one-sentence mention that Cloud Sync is an
  optional, sign-in-based alternative to file-based backup - the feature
  existed already (see "Cloud Sync" above) but was never mentioned on the
  landing page itself until this pass. Deliberately **not** a new
  `.feature-grid` card - the grid was already a clean 15 (5 rows of 3);
  adding a 16th would have reopened the stranded-last-row problem
  documented above, so the mention was folded into existing copy instead.

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
- On confirm, it `fetch()`es the **currently live** `app.html`,
  `customer.html`, and `end-of-day.html` (same-origin, `cache: "no-store"`)
  - **not** `invoice-generator.html`/`receipt-generator.html`/`barcode-generator.html`, all three
  deliberately excluded (see their own sections above) - plus the
  static ingredients under `offline/`
  (`README.txt`, the three `start-server.*` launchers,
  `offline/vendor/LICENSES.txt`), `vendor/xlsx.full.min.js`, and
  `modules/translations.js`/`modules/usb-scanner.js`/`modules/receipt.js`
  (the offline copy still needs all three, at those same paths, since
  `app.html`'s `<script src="modules/...">` tags aren't marker-stripped
  for them), runs `app.html`'s text through `buildOfflineAppHtml()`,
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
- `buildOfflineAppHtml()`/`buildOfflineCustomerHtml()`/
  `buildOfflineEndOfDayHtml()` edit the fetched HTML by stripping
  `<!-- OFFLINE-STRIP:<name>:START/END -->` (HTML) or
  `/* OFFLINE-STRIP:<name>:START/END */` (JS) marker comments already
  present in `app.html`/`customer.html`/`end-of-day.html` — **search
  `OFFLINE-STRIP` to find
  every edit point** before restructuring any of the marked sections, or
  the generated package silently drops the edit (a `console.warn` fires
  if a marker goes missing, but nothing hard-fails). Currently stripped:
  Google Fonts links, the cookie-consent/GA/AdSense bootstrap + banner,
  the "Cookie Settings" footer link, the `jszip.min.js` script tag, the
  `modules/offline-builder.js` script tag (its own module, dead code
  once there's no button to trigger it), the download section/modal
  HTML, the Premium heartbeat call site (no network calls offline), the
  "Homepage"/"Blog" `.header-links` buttons (`HOMEPAGE-BUTTON`/
  `BLOG-BUTTON` - see "Site-wide header, nav & footer" above), since
  neither `index.html` nor `blog.html` ships in the offline package for
  them to open, and the "Free Invoice Generator" button + its
  `openCreateInvoice()` function (`CREATE-INVOICE-BUTTON`/
  `CREATE-INVOICE-JS` - there's no `invoice-generator.html` in the offline copy
  for it to open), the "Free Receipt Generator" button + its
  `openCreateReceipt()` function (`CREATE-RECEIPT-BUTTON`/
  `CREATE-RECEIPT-JS`, the same treatment for `receipt-generator.html`), and the
  "Free Barcode & QR Code" button + its `openCreateBarcode()` function
  (`CREATE-BARCODE-BUTTON`/`CREATE-BARCODE-JS`, the same treatment for
  `barcode-generator.html`).
- **Gate B — the offline copy's own Premium lock is separate from the
  live site's.** The `/* OFFLINE-SWAP:PREMIUM-ACTIVATION:START/END */`
  marked block (the live site's `initPremiumSystem()` → Supabase Account
  & Subscription flow — see "Account & Subscription" above) gets replaced
  wholesale with a self-contained local `entered === OFFLINE_PREMIUM_CODE`
  string compare, and the `<!-- OFFLINE-SWAP:PREMIUM-PANEL:START/END -->`
  marked HTML (the live sign-in/redeem panel) gets replaced with a plain
  status-box + single-input + Activate-button form - so a downloaded copy
  needs zero network to unlock, and auto-unlocks on first launch exactly
  like it always has. `OFFLINE_PREMIUM_CODE` is a placeholder value in
  the source — **change it to something not published anywhere before
  distributing**. It's a plain string compared client-side inside a file
  every offline copy ships with, so it's a soft/honor-system gate, not
  real DRM — anyone with dev tools open on an offline copy can read it.
  This is deliberately disconnected from the live site's Supabase-based
  system (per design: the download button itself already required being
  Premium online, so the offline copy doesn't need to re-prove that
  against the network - and couldn't anyway, since it has none).
- `offline/README.txt` + `offline/start-server.sh` / `-mac.command` /
  `.bat` are static, rarely-changing files (not generated) that get pulled
  into the zip as-is. The launchers run a local Python `http.server` and
  open the app at `http://localhost:8080/app.html` — this is what makes
  the customer-screen broadcast (`BroadcastChannel`/`localStorage`)
  reliable across browsers offline (the USB scanner needs no such
  help — it's just `keydown` events, which work identically via
  `file://`); double-clicking `app.html` directly via `file://` also works (confirmed
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

## `invoice-generator.html` — standalone invoice generator

A free-standing invoice builder, loosely modeled after invoice-generator.com
(a reference copy was provided for the request) but **not a copy of it** -
own design system (same `--ink`/`--accent`/`--gold` tokens and
Space Grotesk/Inter fonts as the rest of the site, not their Tailwind/
dark-mode skin), own simplified feature set, and no third-party branding,
ads network, account system, or footer link farm to tools that don't
exist here. It's for one-off invoices sent to a customer (net terms,
formal billing) - a different job from `app.html`'s point-of-sale
receipts, which is why it's `app.html`'s own **"Free Invoice Generator"**
header-links button (`openCreateInvoice()`, text-only per "Site-wide
header, nav & footer" above) that opens it, via `window.open(...)` in a
**new tab** rather than in-place navigation - a cashier mid-sale
shouldn't risk losing their unsaved cart by clicking it. It's also
directly reachable/shareable on its own (indexable, in `sitemap.xml`,
linked from every marketing page's `.cta-btn` row) as a free tool
independent of the POS app. The page's own `<h1>` reads **"Create
Invoice"** (the `<title>`/meta description lead with "Free Invoice
Generator" for its SEO search-term value, matching the marketing-page
CTA wording and the header-links button, while
the on-page heading stays the more natural "Create Invoice").
- **Header layout follows common commercial-invoice convention**: a
  `.doc-header` two-column row - `.doc-header-left` (logo + "From",
  formerly "Bill From") on the left, `.doc-header-right` (the
  right-aligned "INVOICE" title, `#` number, and a `.doc-meta` mini-table
  of Date/Due Date/Terms/PO #, each a `.doc-meta-row` with the label on
  the left and the value right-aligned) on the right - followed by
  "Bill To" as its own `.bill-to-block` below the header, not
  side-by-side with From anymore. The Currency `<select>` moved into a
  small `.currency-inline` control (`no-print`) tucked above the title,
  since the printed document already shows currency via the symbol in
  every amount ($/€/£/etc.) - there's no separate "Currency" field/label
  cluttering the printed page. Only markup/CSS changed here; every
  field kept its original `id` (`invFrom`, `invTo`, `invDate`, etc.) so
  none of the JS (`collectState`/`applyState`/`recalcTotals`) needed to
  change.
- **Every page's header `.cta-btn` row** (next to the `Homepage`/`Blog`
  nav links, `.site-header .cta-btn`) links here (`href="invoice-generator"`, labeled
  "Free Invoice Generator", first of the 4 CTA buttons) - a deliberate
  choice to give the free tool prime header real estate as a lead-in,
  since `app.html` still has its own prominent "Open the app" buttons in
  the hero section and the CTA band further down `index.html`. This CTA
  row is now shared by every marketing/tool page, not just `index.html`
  - see "Site-wide header, nav & footer" above for the full pattern.
- **No dependency on `app.html`'s data** - deliberately simple/decoupled:
  plain manual-entry fields (business name/address typed directly, no
  pulling from the POS's own Store Settings), matching the reference
  tool's own approach. A closer integration (e.g. prefilling Bill From
  from the POS's store settings) is a reasonable future enhancement,
  not done here. It has its **own** logo upload though (`invLogoInput`)
  - unrelated to `app.html`'s separate Premium-gated logo, since this
  page has no concept of Premium/unlocking. A selected image is
  downsized client-side via canvas (max 320px wide, matching the
  compression approach `app.html` already uses for product photos) and
  stored as a data URL in the autosaved draft (`state.logo`); `setLogo()`
  toggles the upload button/preview/remove-button visibility. **No
  Shipping field** - removed after initial feedback that it wasn't
  needed.
- **Line items, tax, discount, amount paid, and balance due** are
  computed client-side (`recalcTotals()`) - discount/tax each have a
  Percent/Flat toggle (`invDiscountType`/`invTaxType`), mirroring
  `app.html`'s own `discountType` terminology for consistency. Each
  line item also has its own **Tax Free checkbox** (`.line-tax-exempt`),
  and the discount-then-tax math mirrors `app.html`'s own per-item
  `taxExempt` handling exactly: the discount is spread proportionally
  across taxable vs. tax-free line totals before tax is computed on the
  taxable share only (see `computeTotalsFromItems` in
  `modules/receipt.js` for the app-side equivalent).
- **Mobile line-item layout bug (fixed)** - the responsive stacked-row
  CSS (`@media (max-width: 720px)`) originally lost to the desktop
  `.col-qty`/`.col-rate`/`.col-amount` column-width rules on
  specificity (`.items-table .col-qty` beats the plain-element mobile
  override), squeezing every field into a ~90px box with no visible
  label - reported as "line items not working." Fixed with `!important`
  on the mobile override plus `data-label` attributes on each `<td>`
  (rendered via a `::before` pseudo-element) so each field is labeled once
  the table header is hidden on small screens. Also switched
  `.items-table input` from a transparent default border to a visible
  one, matching every other input on the page, so fields don't look
  inert before hover/focus.
- **PDF export reuses the exact technique `app.html` already uses for
  receipts** - a plain `window.print()` call plus `@media print` CSS
  (turning every input/textarea/select borderless so the printed page
  reads as a document, not a form) - not a new PDF library dependency.
  `.no-print` hides the buttons/back-link/footer/info section from the
  printed output, same class name and purpose as `app.html`'s own.
  **`@page { margin: 0; }`**, matching `app.html`'s own POS-receipt print
  CSS exactly - the visual page margin is instead applied by `.wrap`
  itself (`padding: 12mm` in print) rather than left to the browser.
  This was a deliberate fix, not the original design: a nonzero `@page`
  margin (the original `12mm`) leaves room for the browser's own print
  header/footer (page title, URL, date, page number) to render into,
  which read as clutter on a document meant to look clean/professional;
  `@page { margin: 0 }` is the same trick `app.html` already relies on to
  keep its printed receipts free of that browser chrome. Every `<select>`
  (Currency, Discount %/Flat, Tax %/Flat) also gets
  `-webkit-appearance: none; -moz-appearance: none; appearance: none;`
  in print, so the native dropdown-arrow icon doesn't print alongside
  the now-borderless select - printed selects read as plain text.
- **Autosaves as you type** to plain `localStorage` (`goonlinepos-invoice-draft`,
  debounced) so a refresh doesn't lose an in-progress invoice - this is a
  fully standalone page like `customer.html`, outside `app.html`'s
  embedded-host storage abstraction, so it uses raw `localStorage`
  directly rather than `storageGet`/`storageSet` (same reasoning as
  `customer.html`'s own `localStorage` use). "Clear / New Invoice" wipes
  both the on-screen form and the saved draft after a confirm.
- **"Save Invoice" / "Saved Invoices"** - a separate, explicit save
  action distinct from the silent autosave draft above, added after a
  report that a saved invoice couldn't be found: the draft only ever
  holds the one in-progress invoice, with no way to browse past ones.
  "💾 Save Invoice" pushes the current form into a `goonlinepos-invoice-history`
  `localStorage` array (list of `{id, number, to, total, date, savedAt,
  state}`, `state` being a full `collectState()` snapshot) and shows a
  brief `.save-toast` confirmation; "📂 Saved Invoices" opens a
  `.modal-overlay`/`.modal-box` listing them (newest first), each row
  reopening that invoice into the form on click or removable via its
  own ✕ with a confirm. `currentInvoiceId` (generated once per invoice,
  carried through `collectState()`/`applyState()`, and persisted in the
  autosave draft too) is what lets re-saving the same invoice **update**
  its existing history entry instead of creating a duplicate - only
  "Clear / New Invoice" resets it to `null` for a genuinely new one.
- **Has its own full cookie-consent banner** (same `.cookie-consent`/
  `.cc-*` markup/behavior as `blog.html`/`about.html`/etc., a separate
  `goonlinepos-cookie-consent` check from `app.html`'s, since this page
  can be visited directly and isn't guaranteed to share a browsing
  session with `app.html`) - unlike `customer.html`, which reuses
  `app.html`'s consent choice since it's only ever opened alongside it.
- **Deliberately NOT bundled into the "Download Offline POS" package**
  (see below) - it's a separate free web tool, not part of the offline
  POS itself. It was briefly included (a `buildOfflineInvoiceHtml()`
  step, mirroring `app.html`/`customer.html`'s own marker-stripping)
  before being pulled back out. `app.html`'s own **"Free Invoice
  Generator"** button and `openCreateInvoice()` function are wrapped in
  their own `OFFLINE-STRIP:CREATE-INVOICE-BUTTON`/`CREATE-INVOICE-JS`
  marker blocks so they don't appear in the offline copy either - there
  would be nothing for the button to open there. `offline/README.txt`
  explicitly calls out this exclusion in its "except" list, next to the
  cookie-banner/analytics/fonts differences that were already there.
- Six-language UI strings are **not** part of this page - `app.html`'s
  `translations` dictionary only supplies the `createInvoiceShortcutLabel`
  header-links text; the invoice tool itself is English-only for now,
  consistent with it being a new, separate feature rather than a
  from-day-one part of the translated POS app.

## `receipt-generator.html` — standalone receipt generator

A free-standing **payment receipt** builder, `invoice-generator.html`'s sibling tool
and built by mirroring its architecture closely (own `--ink`/`--accent`/
`--gold` design tokens, own cookie-consent banner, own autosave-draft +
explicit Save/Saved-list pattern, `window.print()` + `@media print` for
PDF export). It now supports line items and a payment split (added after
initial feedback that the first version, a non-itemized single Total/
Received summary, was missing both) - see the items/payment bullet
below - though it's still lighter than `invoice-generator.html`: no tax/discount
math, since a receipt records what was already paid rather than
computing a bill.
`app.html`'s own **"Free Receipt Generator"** header-links button
(`openCreateReceipt()`, next to Create Invoice) opens it via
`window.open(...)` in a **new tab**, same reasoning as Create Invoice - a
cashier mid-sale shouldn't risk losing their unsaved cart. It's also
directly reachable/shareable on its own (indexable, in `sitemap.xml`,
linked from every marketing page's `.cta-btn` row) as a free tool
independent of the POS app. The page's
own `<h1>` reads **"Create Receipt"** (the `<title>`/meta description
lead with "Free Receipt Generator" for SEO search-term value, same
pattern as `invoice-generator.html`).
- **Every page's header `.cta-btn` row** has "Free Invoice Generator"
  (`href="invoice-generator"`) and "Free Receipt Generator" (`href="receipt-generator"`) as
  its first two buttons, in that order, before "Free Point of Sale" -
  see "Site-wide header, nav & footer" above for the full pattern.
- **Header layout follows common commercial-receipt convention**, the
  same `.doc-header`/`.doc-header-left`/`.doc-header-right`/`.doc-meta`/
  `.bill-to-block`/`.currency-inline` structure as `invoice-generator.html` (see
  its own section above for the full breakdown) - logo + "From" on the
  left, the right-aligned "RECEIPT" title/number/Date on the right, a
  no-print `.currency-inline` picker tucked above the title instead of a
  printed "Currency" field, and "Received From" (renamed from
  `invoice-generator.html`'s "Bill To") as its own block below the header. Only
  markup/CSS changed - every field kept its original `id` so no JS
  needed to change.
- **Line items and a payment split**: an `.items-table` (`#rcItemsBody`,
  Description/Amount - no Qty/Rate split like `invoice-generator.html`, since a
  receipt line is usually a flat amount, not a quantity × rate
  calculation) whose row amounts sum into **Total**, and a
  **Payment Received** block (`#rcPaymentsBody`, one `.payment-row` per
  payment method + amount) whose row amounts sum into **Total Received**.
  Both start with one row on a new receipt and can't go below one (the
  remove button disables itself on the last row), mirroring
  `invoice-generator.html`'s own items table. **Total Due** stays computed as
  Total − Total Received. Payment methods are a `<select>` seeded from
  `DEFAULT_PAYMENT_METHODS` (Cash/Card/Bank Transfer/Cheque/Other) plus
  any custom ones a user has typed before (persisted in
  `localStorage["goonlinepos-receipt-payment-methods"]`, shared across
  all receipts in that browser) - picking "+ Add New..." prompts for a
  name and adds it to that list. There is still no discount/tax math
  (unlike `invoice-generator.html`) - itemizing here is about listing what was
  paid for and how, not computing a bill.
- **Amount in Words** (`amountToWords()`) - auto-converts the Total into
  words underneath the totals box, currency-aware via a `CURRENCIES` map
  (`{symbol, name, subunit, decimals}` per code) richer than
  `invoice-generator.html`'s plain `{code: symbol}` map, since it needs the
  currency's spoken name/subunit and decimal precision (e.g. Bahraini
  Dinar/Kuwaiti Dinar use 3 decimals/"Fils", not the usual 2). Whole
  amounts read e.g. "Five Hundred Seventeen Bahraini Dinars Only";
  amounts with a fractional part add the subunit, e.g. "Twelve Dollars
  and Fifty Cents Only" for $12.50. Zero fractional value omits the
  subunit clause entirely rather than saying "and Zero Cents."
- **Remarks field with a "Show Remarks" toggle** (`#rcShowRemarks`,
  default **checked**) - a multi-line `#rcRemarks` textarea inside
  `#remarksBlock`, placed after the totals/Amount-in-Words block and
  before the footer note, matching the requested layout. Unchecking the
  toggle adds `.hidden` to `#remarksBlock` (`.remarks-block.hidden {
  display: none !important; }`, defined outside the print block so it
  applies identically on screen and when printed) - the block is
  actually removed from layout, not just visually faded, so disabling it
  leaves no empty gap on the receipt either in the live preview or on
  the printed 80mm output. Both `showRemarks` and the remarks text are
  part of `collectState()`/`applyState()`, so they round-trip through
  the autosave draft and through Saved Receipts (reopening a saved
  receipt restores the original remarks and toggle state exactly).
- **"Save Receipt" / "Saved Receipts"** - the same explicit-save-plus-list
  pattern as `invoice-generator.html`'s "Save Invoice"/"Saved Invoices": "💾 Save
  Receipt" pushes the current form into a `goonlinepos-receipt-history`
  `localStorage` array (`{id, number, receivedFrom, total, date,
  savedAt, state}`) and shows a `.save-toast`; "📂 Saved Receipts" opens
  a `.modal-overlay`/`.modal-box` (`#savedReceiptsOverlay`) listing
  entries newest-first, each row (`.saved-receipt-row` /
  `.saved-receipt-main` / `.saved-receipt-delete`) reopening on click or
  deletable via its own ✕ with a `confirm()`. `currentReceiptId`
  (generated once, carried through `collectState()`/`applyState()`, also
  persisted in the autosave draft) makes re-saving the same receipt
  **update** its existing history entry instead of duplicating it - only
  "Clear / New Receipt" resets it to `null`.
- **A4/Letter print sizing** (`@page { size: A4; margin: 0; }`), matching
  `invoice-generator.html`'s own print CSS rather than `app.html`'s 80mm thermal
  receipt convention - this tool is meant to print or save as a regular
  document/PDF, not on a thermal receipt printer. (An earlier version
  used `@page { size: 80mm auto; margin: 0; }` to match `app.html`'s
  thermal receipts, but was changed to A4/Letter to match `invoice-generator.html`
  instead, per explicit feedback.) Like `invoice-generator.html`, `@page` margin is
  `0` and the visual page margin comes from `.wrap { padding: 12mm }` in
  print instead, so the browser's own print header/footer (title, URL,
  date, page number) has no room to render - and every `<select>`
  (Currency, each payment row's method picker) gets
  `appearance: none` (plus the `-webkit-`/`-moz-` prefixes) in print so
  no dropdown-arrow icon shows next to the now-borderless select.
- **Has its own full cookie-consent banner**, same reasoning as
  `invoice-generator.html` - a separate `goonlinepos-cookie-consent` check since
  this page can be visited directly.
- **Deliberately NOT bundled into the "Download Offline POS" package** -
  same policy as `invoice-generator.html`, a separate free web tool rather than
  part of the offline POS itself. `app.html`'s own "Free Receipt
  Generator" button and `openCreateReceipt()` function are wrapped in
  their own `OFFLINE-STRIP:CREATE-RECEIPT-BUTTON`/`CREATE-RECEIPT-JS`
  marker blocks (mirroring Create Invoice's exact markers) so they
  don't appear in the offline copy either.
- Six-language UI strings are **not** part of this page, same as
  `invoice-generator.html` - `app.html`'s `translations` dictionary only supplies
  the `createReceiptShortcutLabel` header-links text; the receipt tool
  itself is English-only.

## `barcode-generator.html` — standalone barcode / QR code generator

A free-standing barcode and QR code generator, `invoice-generator.html`/
`receipt-generator.html`'s third sibling free tool, built by mirroring their
exact architecture (own `--ink`/`--accent`/`--gold` design tokens
copied verbatim, own cookie-consent banner, own autosave-draft +
explicit Save/Saved-list pattern, an "info-section" How-to + FAQ
block). **There is no Print/PDF output** - a `window.print()` action
plus a dynamically rewritten `@page` rule existed early on but was
removed at the site owner's explicit request; see the "chosen size
drives the on-screen preview" bullet below for the full removal and
what replaced it. **Now fully connected**, the same
way Invoice/Receipt already were: `<meta name="robots">` is
`index, follow`, it has a `sitemap.xml` entry, it's one of the five
`SiteNavigationElement` entries in `index.html`'s own JSON-LD (see
"SEO" below), and every page's shared header carries a fourth
**"Free Barcode & QR Code"** `.cta-btn` linking to it (see "Site-wide
header, nav & footer" below) - it started out deliberately
disconnected (URL-only, `noindex`) while the tool itself was still
being built, and was wired in only once the feature set was confirmed
ready. `app.html`'s own `.header-links` row picked up a matching
`#createBarcodeButton` → `openCreateBarcode()` (`window.open(...)` to
`barcode-generator`, same new-tab pattern as Create Invoice/Create Receipt, same
`OFFLINE-STRIP:CREATE-BARCODE-BUTTON`/`CREATE-BARCODE-JS` marker
wrapping since `barcode-generator.html` isn't in the offline package either -
`modules/offline-builder.js` strips both), and
`modules/translations.js` picked up a `createBarcodeShortcutLabel` key
across all six language blocks to match. `vendor/LICENSES.txt`'s "not
yet linked from any other page" note for `jsbarcode.min.js`/
`qrcode.js`/`qrcode_UTF8.js` is now stale now that the page linking to
them is connected - the libraries themselves are still barcode-generator.html-only,
just no longer via an unlinked page.
- **Type toggle**: two `.type-tab` pill buttons, Barcode vs QR Code
  (`#tabBarcode`/`#tabQr`), switching which form rows/size-preset list
  apply.
- **Label size**: a `<select id="sizePreset">` populated per-type from
  `BARCODE_SIZES` (2x1in/1.5x1in/3x2in/4x6in) or `QR_SIZES`
  (1x1in/2x2in/3x3in/4x4in) - real-world common label sizes, each
  labeled with both inches and millimeters - plus a "Custom size"
  entry. Custom reveals **Width + Height** number inputs for barcodes
  (`#customSizeBarcodeRow`, rectangular) but a **single Size** input
  for QR (`#customSizeQrRow`) - deliberately square-only, since letting
  QR width/height differ would distort the code. All sizing is in
  millimeters throughout, matching `app.html`'s own Paper & Zoom
  convention (58mm/80mm/A4/A5/custom, never inches) rather than
  introducing a new unit to the codebase.
- **The chosen size drives the on-screen preview directly** -
  `#previewBox`'s CSS `width`/`height` are set directly in `mm` (a real
  physical CSS unit, same trick `.receipt`'s fixed `80mm` width in
  `app.html` already relies on) via `applyBoxSize()`. **There is no
  Print option** - an earlier version had one (a "🖨 Print / Save as
  PDF" action-bar button, a `@page { size: <w>mm <h>mm; margin: 0; }`
  rule kept in sync with the chosen size via a `<style
  id="dynamicPageSize">` tag rewritten from `applyBoxSize()` - the same
  "dynamic page-size style tag" pattern `end-of-day.html`'s
  `applyPaperSize()` uses for its own 80mm-thermal-vs-A4 choice - and a
  full `@media print` block hiding everything but `#previewBox`), but it
  was removed outright at the site owner's explicit request, along with
  every supporting piece: the button, its CSS rule, the `@page`/`@media
  print` block, the `dynamicPageSizeTag`/`ensureDynamicPageSizeTag()`
  mechanism, the `.no-print` class from every element that carried it
  (it had nothing left to gate once the print stylesheet was gone), and
  every piece of copy that mentioned printing (meta description, OG/
  Twitter descriptions, the masthead paragraph, the "How to create"
  steps, two FAQ entries). **Download PNG and Save are now the only two
  ways to take a code out of the browser.** Since Border (below) used to
  rely entirely on the print stylesheet to ever show up anywhere real,
  removing print without also fixing Border would have left it a
  purely decorative, functionally pointless on-screen-only toggle - see
  the Border bullet below for how that was addressed in the same pass.
- **Barcode rendering** uses the self-hosted `vendor/jsbarcode.min.js`
  (see "`vendor/` — self-hosted third-party libraries" below) via
  `JsBarcode(canvas, value, options)`, format chosen from a curated
  7-option `<select id="barcodeFormat">` (CODE128, EAN-13, UPC-A,
  CODE39, ITF-14, Codabar, Pharmacode) covering the common
  "market-standard" symbologies without overwhelming the page.
  JsBarcode's own `valid` callback option drives a live inline hint
  under the value field (`#codeValueHint`) - e.g. "isn't valid for
  EAN-13 - needs 12 or 13 digits" - rather than letting an invalid
  value silently fail or throw.
- **FAQ has a "Can I scan this with my phone?" entry** flagging that a
  phone's stock Camera app generally only reads QR codes out of the
  box - scanning a traditional barcode (CODE128/EAN-13/UPC-A/etc.)
  needs a dedicated barcode scanner app, unlike QR which needs nothing
  extra. This is a real device/OS limitation, not something this page
  can work around - added since a visitor generating a barcode here
  and then trying to test-scan it with their phone's plain camera
  could otherwise conclude the generated code itself is broken.
- **FAQ also has an "Is there a limit on how many codes I can generate?"
  entry**, right after the "Is this generator free?" one - answers "No"
  and explains why: generation is entirely client-side (JsBarcode/
  qrcode-generator running in the browser, no server call), so there's
  no usage cap, only the browser's own `localStorage` capacity as a
  practical ceiling if someone saves a very large number of codes to
  their Saved Codes list.
- **QR rendering** uses the self-hosted `vendor/qrcode.js` +
  `vendor/qrcode_UTF8.js` (the `qrcode-generator` npm package's own
  optional UTF-8 patch file, which must load after the core file - see
  `vendor/LICENSES.txt`). Rather than use the library's own
  `createImgTag`/`createSvgTag` helpers, the code walks the raw module
  matrix itself (`qr.getModuleCount()`/`qr.isDark(row, col)`) and
  paints it onto `#codeCanvas` by hand, with its own 4-module quiet
  zone - originally chosen because it's what made the now-retired
  center-content overlay possible (see below), since the matrix was
  available as data rather than a pre-rendered image. Kept as-is after
  that feature's removal since it's no worse than the library's own
  helpers for plain rendering either way.
- **Both the "value" text and any "text above" are plain HTML, not
  baked into the canvas** - `#previewTopText`/`#previewValueText` are
  separate `<div>`s positioned above/below `#codeCanvas` inside
  `#previewBox`, toggled by their own checkboxes
  (`#showTopText`/`#showValueBelow` for barcodes,
  `#showQrValueBelow` for QR). This is deliberately **not** JsBarcode's
  own built-in `displayValue`/`textPosition` text rendering
  (`displayValue` is always passed as `false`) - JsBarcode can only
  place one piece of text (the encoded value) at one position, but the
  page needs two independent, differently-sourced pieces of text (an
  arbitrary label above, and the raw encoded value below) shown or
  hidden independently, which is simpler to get right as ordinary DOM
  text than by fighting the library's own text layout.
- **`fitCanvasInBox()`** re-measures `#previewBox` after every render
  and scales `#codeCanvas`'s CSS `width`/`height` (not its underlying
  pixel buffer) to fit whatever room is left once the optional top/value
  text rows are accounted for, preserving the raster's aspect ratio.
- **Source raster resolution is a fixed `RENDER_PX_PER_MM` (12, ≈300 DPI)**,
  and both renderers target it directly rather than a small fixed size
  that then gets *upscaled* by `fitCanvasInBox()` to fill a bigger label -
  the first shipped version rendered barcodes at a flat 2px module width/
  small bar height and QR at a flat 10px/module regardless of the chosen
  label size, so anything bigger than a small label was stretching a
  low-res source image, and a site owner reported both barcode and QR
  scans failing as a result. QR now computes `pxPerModule` straight from
  the chosen label width (`RENDER_PX_PER_MM * widthMm / (moduleCount +
  quietZone*2)`), so the raster is generated already close to its true
  final size instead of being resized into it. Barcode can't do that
  precisely up front (JsBarcode decides the raster width itself, from
  module count × module width, and module count isn't known until
  content length is known), so it renders at a constant, resolution-
  matched module width/bar height instead (`RENDER_PX_PER_MM * 0.4` and
  `heightMm * RENDER_PX_PER_MM * 0.6`) and lets `fitCanvasInBox()` only
  ever scale *down* for the common case.
- **The "too dense to scan" hint under `#sizeHint` is computed from real
  physical geometry, not from the on-screen fit scale** - `fitScale`
  conflates two unrelated things (the ~96 DPI screen vs. the ~300 DPI
  source raster, and genuine content density) and using it directly for
  the warning meant the warning would fire on essentially *every*
  render once the raster resolution above was fixed, screen-DPI mismatch
  alone was enough to trip it. `updateSizeHint()` instead computes the
  real final module width in millimeters - exactly, for QR
  (`labelWidthMm / (moduleCount + quietZone*2)`, matching how the raster
  was generated), and approximately for barcode (`moduleWidthPx *
  labelWidthMm / codeCanvas.width`, assuming the common width-bound fit
  case) - and only warns below `0.25mm`, a realistic minimum module width
  for reliable scanning. Verified by actually decoding generated codes
  with `pyzbar`/`zbar` (installed into the sandbox for this one check,
  not a repo dependency): a 12-digit EAN-13 and a 45-character CODE128
  value both render on a 1.5x1in label, the EAN-13 decodes correctly and
  shows the plain "Label size" caption, while the 45-character value
  correctly fails to decode *and* correctly shows the density warning
  (530+ modules doesn't fit legibly even on the largest 4x6in preset at
  a safe module width) - confirming the warning threshold means what it
  says rather than being either a false alarm or silent about a real
  problem. A plain QR and one at the largest QR preset both decoded
  correctly too.
- **Retired: QR center content.** QR codes used to support adding up to
  4 characters of text into the middle of the code
  (`#enableCenterContent`, QR-only - always bumping the QR
  error-correction level from `M` to `H` so the extra ~30% redundancy
  budget could absorb the obscured center, a plain white square covering
  ~26% of the code's width painted first, then the text drawn on top of
  it). This was itself a text-only replacement for an even earlier
  Image-or-Text choice (a small Image/Text toggle, an uploaded logo
  drawn via `drawImage`) that had already been removed once at the site
  owner's request. The whole feature - the checkbox, the `Center Text`
  input and its surrounding `.center-content-block`, the EC-level bump
  (`renderQrToCanvas()` now always uses a plain `var ecLevel = "M";`),
  the center-square-and-text drawing in `renderQrToCanvas()`, its
  `collectState()`/`applyState()` round-trip, the "add short text to the
  center" mention in the meta description, the "For a QR code, you can
  also add up to 4 characters..." How-to step, and the "Can I add text
  to the middle of a QR code?" FAQ entry - was removed outright at the
  site owner's explicit request, not just hidden, following this
  repo's established convention of not leaving dead code/CSS behind
  when a feature is cut (see e.g. Print's removal above).
- **Border** (`#borderStyle`, shared by both Barcode and QR) applies a
  line style around `#previewBox` - None, Solid Strong, Solid Medium,
  Dashed, or Dotted - via `applyBorderStyle()` setting
  `previewBox.style.border` directly from a `BORDER_STYLES` map (a
  plain inline style, so it always wins over the base `.preview-box`
  rule's own `border: 1px solid var(--line-soft)` on-screen framing
  default with no `!important` needed). **Also baked into the
  downloaded PNG**, via a second, physical-units map,
  `BORDER_EXPORT` (`{ widthMm, dash }` per style, `dash` as a
  millimeter-based on/off pattern for `ctx.setLineDash()`) - added in
  the same pass that removed Print (above): with print gone, Download
  PNG became the only remaining way to take a border out of the
  browser at all, so `buildExportCanvas()` now `ctx.strokeRect()`s the
  chosen border around the composited image, after the code/text are
  drawn, scaled by the same `pxPerMm` the rest of the export uses.
  Before this, the border was screen-only decoration with no real
  output; leaving it that way once Print was removed would have made
  the whole control pointless. **Solid Strong's export width was
  deliberately tuned down from an initial `0.8mm` to `0.5mm`** after
  `pyzbar`/zbar decode testing (same methodology as the raster-
  resolution fix documented above) caught a real regression: a CODE128
  barcode downloaded with the strong border looked visually correct
  (a clean white quiet-zone gap between the border and the bars) but
  **failed to decode** - a thick solid black frame evidently confuses
  zbar's global thresholding/scanline algorithm even with adequate
  clearance from the bars themselves. QR with the identical border
  style decoded fine, so this was specific to barcode's greater
  sensitivity to a heavy near-field frame. Verified by generating and
  decoding all 5 border styles x both code types (10 combinations) -
  all 10 decode correctly at the current widths (`solid-strong: 0.5mm`,
  `solid-medium: 0.4mm`, `dashed: 0.5mm`, `dotted: 0.6mm`).
- **Save/Saved Codes** follows the exact same explicit-save-plus-list
  pattern as `invoice-generator.html`/`receipt-generator.html`'s own Save/Saved
  Invoices/Receipts: "💾 Save" pushes the current form into a
  `goonlinepos-barcode-history` `localStorage` array (`{id, type,
  value, sizeLabel, savedAt, state}`) and shows a `.save-toast`;
  "📂 Saved Codes" opens a `.modal-overlay` (`#savedCodesOverlay`)
  listing entries newest-first, each row carrying a small `Barcode`/`QR`
  `.saved-code-badge` pill (green for barcode, gold for QR - matching
  the site's two-accent-color convention) and reopening the full state
  on click, or deletable via its own ✕ with a `confirm()`.
  `currentCodeId` (generated once, carried through
  `collectState()`/`applyState()`, persisted in the autosave draft too)
  makes re-saving the same code **update** its existing history entry
  instead of duplicating it - only "Clear / New" resets it to `null`.
  The current in-progress code also autosaves to
  `goonlinepos-barcode-draft` exactly like the other two tools.
- **"⬇ Download PNG"** is, alongside Save, one of only two ways to take
  a code out of the browser now that Print is gone (see above) -
  `buildExportCanvas()` composites a fresh, higher-resolution
  (`12px/mm`) canvas from scratch (white background, the top text and
  value text drawn as real canvas text, the live `#codeCanvas` raster
  scaled/centered into the remaining space, then the chosen border
  stroked on top - see the Border bullet above) so the downloaded image
  matches what the on-screen label actually shows, rather than just
  exporting the bare code without its surrounding text or border.
- **Sourcing the vendored libraries**: both `jsbarcode` (3.12.3, MIT)
  and `qrcode-generator` (2.0.4, MIT) were pulled directly from
  `registry.npmjs.org` (reachable in this sandbox even when most of the
  open web isn't - see the `.app-preview` mock's product-photo bullet
  above for the same discovery) and used unmodified, matching
  `vendor/`'s existing convention for `xlsx.full.min.js`/`jszip.min.js`.
  The `qrcode` (soldair) npm package was tried first since it renders
  straight to a `<canvas>`, but its published tarball only ships
  CommonJS source meant to be run through a bundler - no prebuilt
  browser file - which doesn't fit a repo with no build step, so
  `qrcode-generator` (a single ready-to-use classic script, no bundler
  needed) was used instead.

## `vat-calculator.html` — standalone VAT calculator

A free-standing VAT calculator, `invoice-generator.html`/`receipt-generator.html`/
`barcode-generator.html`'s fourth sibling free tool, built by mirroring their
exact architecture (own `--ink`/`--accent`/`--gold` design tokens
copied verbatim, own cookie-consent banner, own autosave-draft +
explicit Save/Saved-list pattern, an "info-section" How-to + FAQ
block, own `<meta name="robots">` of `index, follow`, its own
`sitemap.xml` entry, its own `SiteNavigationElement` JSON-LD entry on
`index.html`). Indexable and connected from day one - unlike
`barcode-generator.html`, there was no unlinked/building period, since the
calculator/save-list pattern was already proven three times over by
the time this was built.
- **Every page's header `.cta-btn` row** picked up a fifth button,
  **"Free VAT Calculator"** (`href="vat-calculator"`), inserted right after "Free
  Barcode & QR Code" and before "Free Point of Sale" - see "Site-wide
  header, nav & footer" below for the full row and why the order is
  what it is. `app.html`'s own `.header-links` row picked up a
  matching `#createVatButton` → `openCreateVat()` (`window.open(...)`
  to `vat-calculator`, same new-tab pattern as Create Invoice/Receipt/Barcode,
  same `OFFLINE-STRIP:CREATE-VAT-BUTTON`/`CREATE-VAT-JS` marker
  wrapping since `vat-calculator.html` isn't in the offline package either -
  `modules/offline-builder.js` strips both), and
  `modules/translations.js` picked up a `createVatShortcutLabel` key
  across all six language blocks to match. This surfaced a real,
  pre-existing `changeLanguage()` translation-map bug affecting the
  Barcode & QR Code button too - see "Site-wide header, nav & footer"
  above, under `.header-links`, for the full story and fix.
- **Two modes, one shared result set**: `#tabAddVat`/`#tabRemoveVat`
  (the same `.type-tabs`/`.type-tab` pill pattern `barcode-generator.html` uses
  for Barcode/QR Code) switch between "Add VAT" (the entered amount is
  treated as Net, before tax) and "Remove VAT" (the entered amount is
  treated as Gross, already including tax) - `#vatAmountLabel`'s text
  swaps between "Net Amount (excl. VAT)" and "Gross Amount (incl.
  VAT)" to match. Both modes always show all three figures - Net
  Amount, VAT Amount, Gross Amount - computed via
  `computeResults()`: Add mode does `vat = net * (rate/100); gross =
  net + vat`, Remove mode does `net = gross / (1 + rate/100); vat =
  gross - net`, the standard VAT math either direction.
- **VAT Rate is a curated preset list plus Custom**, the same
  `<select>`-with-a-`Custom`-option-that-reveals-a-field pattern
  `barcode-generator.html`'s Label Size uses: `VAT_RATES` holds common standard
  rates (20%/UK, France; 21%/Netherlands, Belgium; 19%/Germany;
  15%/South Africa, NZ GST; 12%/Philippines; 10%/Australia GST;
  7%/Thailand; 5%/UAE; 0%/zero-rated) each labeled with the rate and a
  parenthetical of representative countries, plus a `Custom rate`
  entry that reveals `#customRateRow`'s `#customRate` number input.
  These labels are explicitly **for reference only** - the FAQ has a
  dedicated entry making clear that real VAT rates vary by country and
  by product/service type, and that this tool doesn't provide tax
  advice; the presets exist to save typing a common rate, not to
  assert a rate is correct for any specific business.
- **Currency is the same plain `{code: symbol}` map `invoice-generator.html`
  already has** (`CURRENCIES`, copied verbatim - see `invoice-generator.html`'s
  own section above) via a `.currency-inline` picker (same class/CSS
  as `invoice-generator.html`/`receipt-generator.html`'s own currency control) above the
  amount field. `formatAmount(value, code)` is the shared money
  formatter, always 2 decimals regardless of currency, matching
  `invoice-generator.html`'s own `money()` - this tool doesn't need
  `receipt-generator.html`'s richer per-currency decimals/subunit handling since
  there's no "Amount in Words" feature here.
- **No Print/Download output** - unlike `barcode-generator.html` (Download PNG)
  or `invoice-generator.html`/`receipt-generator.html` (print-to-PDF), a VAT calculation is
  just three numbers, not a document or image, so there's nothing
  meaningful to export as a file. The action bar is Save/Saved
  Calculations/Clear-New only, three buttons instead of the other
  tools' four.
- **Save/Saved Calculations** follows the exact same
  explicit-save-plus-list pattern as `invoice-generator.html`/`receipt-generator.html`/
  `barcode-generator.html`'s own Save/Saved Invoices/Receipts/Codes: "💾 Save"
  pushes the current calculation into a `goonlinepos-vat-history`
  `localStorage` array (`{id, mode, currency, rateLabel, net, vat,
  gross, savedAt, state}`) and shows a `.save-toast`; "📂 Saved
  Calculations" opens a `.modal-overlay` (`#savedVatOverlay`) listing
  entries newest-first, each row carrying a small `Add VAT`/`Remove
  VAT` badge (reusing `barcode-generator.html`'s `.saved-code-badge`/`.type-qr`
  CSS verbatim - green for Add VAT, gold for Remove VAT, same
  two-accent-color convention) and reopening the full state on click,
  or deletable via its own ✕ with a `confirm()`. `currentCalcId`
  (generated once, carried through `collectState()`/`applyState()`,
  persisted in the autosave draft too) makes re-saving the same
  calculation **update** its existing history entry instead of
  duplicating it - only "Clear / New" resets it to `null`. The current
  in-progress calculation also autosaves to `goonlinepos-vat-draft`
  exactly like the other three tools.
- **FAQ includes the now-standard "Is there a limit on how many
  calculations I can do?" entry** (matching `barcode-generator.html`'s own
  "Is there a limit on how many codes I can generate?" - see that
  page's section above), since every tool in this free-tools family
  now answers that question the same way: no, everything runs
  client-side with no server call and no usage cap.
- **Deliberately NOT bundled into the "Download Offline POS" package** -
  same policy as `invoice-generator.html`/`receipt-generator.html`/`barcode-generator.html`, a
  separate free web tool rather than part of the offline POS itself.
- Six-language UI strings are **not** part of this page, same as
  `invoice-generator.html`/`receipt-generator.html`/`barcode-generator.html` - `app.html`'s
  `translations` dictionary only supplies the `createVatShortcutLabel`
  header-links text; the calculator itself is English-only.

## `pricing-calculator.html` — standalone product pricing calculator

A free-standing product pricing / markup-vs-margin calculator, the fifth
sibling in the `invoice-generator.html`/`receipt-generator.html`/`barcode-generator.html`/`vat-calculator.html`
family of free tools, built on the same architecture (own
`--ink`/`--accent`/`--gold` design tokens copied verbatim, own
cookie-consent banner, own autosave-draft + explicit Save/Saved-list
pattern, the same `invoice-generator.html`-derived `CURRENCIES` map). It started
out deliberately disconnected (URL-only, `noindex, follow`) while the
site owner reviewed it - the same "unlinked" phase `barcode-generator.html` went
through - then was wired in site-wide the same way `barcode-generator.html`/
`vat-calculator.html` were once ready: `<meta name="robots">` is `index, follow`,
it has a `sitemap.xml` entry, it's one of the six `SiteNavigationElement`
entries in `index.html`'s own JSON-LD, and every page's shared header
carries a sixth **"Free Pricing Calculator"** `.cta-btn` linking to it
(see "Site-wide header, nav & footer" above - inserted right after "Free
VAT Calculator" and before "Free Point of Sale"). **Shipped first as
`pricing.html`, then renamed to `pricing-calculator.html`** shortly
after connecting it site-wide - `/pricing` on its own read as
ambiguous (easy to mistake for a SaaS "our pricing/plans" page rather
than a calculator tool), so every reference (the `.cta-btn` `href` on
all 13 pages, `app.html`'s own link, `sitemap.xml`, the JSON-LD entry,
and this file's own `<link rel="canonical">`/`og:url`) points at the
longer `pricing-calculator` path instead. This was the first of the
five free tools to get a descriptive multi-word URL - `invoice.html`/
`receipt.html`/`barcode.html`/`vat.html` were each renamed to
`invoice-generator.html`/`receipt-generator.html`/
`barcode-generator.html`/`vat-calculator.html` shortly after, for the
same clarity reason (see the repo-layout bullet near the top of this
file). Don't rename any of the five back to their original bare names.
`app.html`'s own `.header-links` row picked up a matching
`#createPricingButton` → `openCreatePricing()` (`window.open(...)` to
`pricing-calculator`, same new-tab pattern as Create Invoice/Receipt/
Barcode/VAT, same `OFFLINE-STRIP:CREATE-PRICING-BUTTON`/
`CREATE-PRICING-JS` marker wrapping since `pricing-calculator.html`
isn't in the offline package either -
`modules/offline-builder.js` strips both), and `modules/translations.js`
picked up a `createPricingShortcutLabel` key across all six language
blocks to match - the dark-green CSS selector list and the
`changeLanguage()` `ids` map both got their `#createPricingButton`/
`createPricingShortcutLabel` entries in the same pass this time, avoiding
the two easy-to-forget omissions that bit the Barcode button rollout
(see "Site-wide header, nav & footer" above).
- **Built to address a specific, named problem, not just to be another
  markup calculator** - the tool was scoped around researching what
  actually trips up small sellers (mostly the site's own target
  audience of market stalls, home bakers, food carts, and new
  businesses - see `index.html`'s "Who is GoOnlinePOS for?" section)
  when they price a product: confusing markup with margin (they are
  different percentages of different bases and are never equal except
  at 0%), pricing off raw material cost alone and forgetting labor or
  packaging, and not knowing how to turn a batch/recipe cost into a
  per-unit cost before they can even start. The `info-section`'s "Why
  pricing your product correctly matters" and "Markup vs. margin"
  sections exist to explain the actual problem, not just document the
  UI, per an explicit request for "more explanation why this tool is
  important."
- **Two calculators in one page, connected by a single button.** The
  main calculator (always visible) takes a **Cost Per Unit**, a choice
  between **Target Margin %** or **Target Markup %** (the same
  `.type-tabs` pill pattern `barcode-generator.html`/`vat-calculator.html` use), and shows
  **all four** figures at once - Suggested Selling Price, Profit Per
  Unit, Margin, and Markup - regardless of which one was the input, so
  the markup/margin gap described above is always visible rather than
  hidden behind whichever mode happens to be selected. A checkbox ("I
  don't know my cost per unit yet...") reveals a second, optional
  **Batch / Recipe Cost Calculator** above it - Total Batch Cost, Batch
  Yield (units), optional Labor Cost for the batch, optional Packaging/
  Other Cost Per Unit - whose "Use This Cost Below ↓" button copies its
  computed per-unit cost straight into the main calculator's Cost Per
  Unit field. This two-stage flow (batch → per-unit cost → price) is
  the piece that differentiates it from a generic online markup
  calculator and is specifically aimed at the food/handmade-goods
  segment of the site's audience, who normally know a batch cost long
  before they know a per-unit one.
- **The math, standard and currency/region-agnostic on purpose** (per
  an explicit "make sure it's standard international use" requirement -
  no country-specific tax entanglement, no region-locked reference
  numbers, and the same ~150-currency `CURRENCIES` map `invoice-generator.html`
  already has, not a USD-only tool): given cost `C` and a target margin
  `m` (as a decimal), `price = C / (1 - m)`; given cost `C` and a target
  markup `k`, `price = C * (1 + k)`. Once price is known, `profit =
  price - cost`, `actualMarginPct = profit / price * 100`, and
  `actualMarkupPct = profit / cost * 100` (shown as `0%` when cost is
  `0`, since markup-on-zero-cost is undefined). A margin of 100% or
  more is mathematically invalid (`price` would be infinite or
  negative) - `computeResults()` returns an `invalid` flag in that case
  and the UI shows a `field-hint warn` message plus `--` in every result
  field instead of a nonsense number, the same "don't silently compute
  garbage" pattern `barcode-generator.html`'s density warning uses. Deliberately
  **no VAT/sales-tax math anywhere on this page** - that's `vat-calculator.html`'s
  job; mixing the two would make this page's math depend on the
  visitor's jurisdiction, defeating the international-by-default goal.
- **Save/Saved Calculations** follows the exact same
  explicit-save-plus-list pattern as `barcode-generator.html`/`vat-calculator.html`'s own
  Save/Saved Codes/Calculations: "💾 Save" pushes the current
  calculation into a `goonlinepos-pricing-history` `localStorage` array
  (`{id, mode, currency, cost, targetPercent, price, profit, savedAt,
  state}` - `state` also carries the batch-helper's own fields, so
  reopening a saved entry restores whether the helper was shown and
  what was in it, not just the final numbers) and shows a `.save-toast`;
  "📂 Saved Calculations" opens a `.modal-overlay` listing entries
  newest-first with a `Margin`/`Markup` badge (green/gold, reusing
  `barcode-generator.html`'s `.saved-code-badge`/`.type-qr` CSS verbatim). The
  current in-progress calculation - main fields and batch-helper fields
  both - also autosaves to `goonlinepos-pricing-draft`, same as the
  other three calculators.
- **No Print/Download output**, same reasoning as `vat-calculator.html` - a price
  is a few numbers, not a document or image, so the action bar is
  Save/Saved Calculations/Clear-New only.
- **FAQ deliberately avoids prescribing a "correct" margin or markup**
  ("What margin or markup should I aim for?" answers that it varies by
  industry/product/market and that any number shown online is a
  reference point, not a rule, this tool doesn't provide business
  advice) - consistent with `vat-calculator.html`'s own disclaimer about its rate
  presets being for reference only, and for the same reason: real
  answers depend on a business's actual costs and market, not a single
  global constant.
- **Deliberately NOT bundled into the "Download Offline POS" package** -
  same policy as `invoice-generator.html`/`receipt-generator.html`/`barcode-generator.html`/
  `vat-calculator.html`, a separate free web tool rather than part of the offline
  POS itself. Since it also isn't linked from `app.html` at all yet
  (see above), there is currently no button anywhere that would need an
  `OFFLINE-STRIP` marker for it regardless.
- Six-language UI strings are **not** part of this page, matching
  `invoice-generator.html`/`receipt-generator.html`/`barcode-generator.html`/`vat-calculator.html` - the
  calculator itself is English-only; a `createPricingShortcutLabel`
  translation key only gets added once `app.html`'s `.header-links`
  button is added, per the rollout checklist above.
- Verified with Playwright against the worked example in the page's own
  FAQ (cost $10: 50% markup → $15.00 price, $5.00 profit, 33.3% margin,
  50% markup; 50% margin → $20.00 price, $10.00 profit, 50% margin,
  100% markup - both match by hand), the batch calculator (`$45` total
  ÷ `30` yield → `$1.50`/unit, then with `$15` labor and `$0.20`
  packaging → `(45+15)/30+0.20 = $2.20`/unit, both correct), "Use This
  Cost Below" correctly filling the main Cost Per Unit field, the ≥100%
  margin warning correctly blocking a nonsense result, currency
  switching, and Save/Saved Calculations round-tripping (this pass ran
  before the page was connected site-wide - see above for the later
  rollout and rename). Zero console errors throughout.

## `end-of-day.html` — POS closing report

Replaces the old in-app "Sales Summary" panel (`toggleSalesSummary()`/
`renderSalesSummary()`/`saleMethodBreakdown()`, all removed from
`app.html`) with a standalone, printable, saveable report. Unlike
`invoice-generator.html`/`receipt-generator.html`, this page is **not** decoupled from
`app.html` - it's a real POS report, so it deliberately reads the same
storage keys `app.html` writes (`pos-sales-history`, `pos-cashiers`,
`pos-settings`, `pos-logo`), via the exact same
`hasArtifactStorage`/`storageGet`/`storageSet` implementation copied
verbatim (so it works identically whether `app.html` is running against
the injected-host storage or the `localStorage` fallback). `noindex,
nofollow`, not in `sitemap.xml` - it's an internal tool, useless without
existing sales data, not a public lead-gen page like invoice/receipt.
- `app.html`'s header toolbar has a **"📅 End of Day"** button
  (`#endOfDayButton` → `openEndOfDayReport()`, replacing the old
  `#summaryButton`) that opens this page in a **new tab**, same
  `window.open(...)` pattern the `#homepageShortcutButton` link uses -
  except it opens the literal `end-of-day.html` filename rather than an
  extension-less URL, the same reasoning `customerScreenUrl()` already
  follows for `customer.html`: this page **does** ship in the offline
  package (see below), where extension-less resolution doesn't exist.
- **Report Date is selectable** (`#reportDateInput`, defaults to today) -
  changing it recomputes live from `salesHistory` filtered by
  `saleDateKey(s.dateTime) === selectedDate` (the identical date-key
  helper `app.html` uses for its own Sales History grouping, copied
  verbatim so the two never disagree about which calendar day a sale
  falls on).
- **Cash/change netting matches the old Summary panel's logic exactly**
  (`saleMethodBreakdown()`, copied verbatim into this page's own script):
  a `payments[]` row's `amount` is what was tendered/entered at checkout,
  not necessarily what was actually kept - a cash payment can include
  change handed back, which is tracked only as a single scalar
  `sale.change`, not broken out per payment method. The function
  subtracts that scalar from whichever row is named "Cash" (case
  insensitive), falling back to the last row if none is - a heuristic,
  not perfectly precise for exotic cases (change given on a non-cash
  tender, two "Cash" rows), but exactly what the app's own prior Summary
  panel already did, so numbers stay consistent with history. This same
  function backs both the Payment Breakdown section and each Cashier
  Collection block - "Cash" is never just summed from raw tendered
  amounts anywhere on this report.
- **Items Sold** aggregates every sale's `items[]` (already
  self-sufficient per line - `name`/`qty`/`price`/`lineTotal` snapshotted
  at sale time, no need to cross-reference the live `products` catalog,
  which could have since renamed/deleted the item) by name, summing
  qty and line total. **Top 5 Best Sellers** is the same aggregation
  sorted by qty descending, sliced to 5.
- **Cashier Collection** buckets by `s.cashierName || "No Cashier"` -
  `cashierName` is stored as a plain empty string (never `null`) when no
  cashier was active at checkout, matching `app.html`'s own
  representation exactly. The whole section is hidden when there are no
  cashiers configured at all or no sales that date, same rule the old
  Summary panel used.
- **Paper size is selectable, 80mm thermal or A4** (`#paperSizeSelect`,
  persisted via `storageGet`/`storageSet("eod-paper-size")`) -
  `applyPaperSize()` toggles a `body.paper-80mm`/`body.paper-a4` class
  for regular CSS (narrower widths/smaller fonts at 80mm) and rewrites
  a dedicated `<style id="dynamicPageSize">` tag's `@page` rule, since
  `@page` size can't be scoped by a body class the way ordinary
  selectors can - this is the standard trick for letting a print size
  be chosen at runtime rather than fixed in the stylesheet.
- **Save Report / Saved Reports** works like Save Invoice/Save Receipt,
  but saves a **frozen snapshot** of the fully computed report (not just
  the selected date) into `storageGet`/`storageSet("eod-report-history")`
  - deliberately an immutable closing record: if a past sale is later
  edited or deleted in Sales History, an already-saved End of Day report
  keeps showing the numbers as they were the moment it was saved, the
  same way a real end-of-day closing report would. Reopening one shows a
  dismissible "Viewing a saved report" banner and displays the frozen
  numbers directly (no recomputation); changing the Report Date switches
  back to a live, freshly-computed report for that date.
- Reads Sales History **once, when the page loads** - if a new sale is
  rung up in `app.html` while an End of Day tab is already open in
  another tab, that open tab does not update live; reopen it (click
  "📅 End of Day" again) to see the new sale reflected. There is no
  cross-tab sync mechanism here (unlike the customer-facing screen's
  `BroadcastChannel`), since this report is meant to be pulled up
  on demand at closing time, not kept open continuously.
- **Included in the offline package** (unlike `invoice-generator.html`/
  `receipt-generator.html`) - `modules/offline-builder.js` fetches
  `end-of-day.html` alongside `app.html`/`customer.html` and runs it
  through its own `buildOfflineEndOfDayHtml()`, which strips the same
  `GOOGLE-FONTS` marker every offline page strips plus its own
  `EOD-ANALYTICS` marker (mirroring `customer.html`'s
  `CUSTOMER-ANALYTICS` marker exactly - a GA pageview gated on the
  existing `goonlinepos-cookie-consent` key, no AdSense, since a report
  showing real sales figures shouldn't carry ads either).
- Verified end-to-end with Playwright: two full checkout sales through
  `app.html` (one cash-with-change under an active cashier, one exact
  card payment with no cashier selected) produced a report whose Total
  Sales, Items Sold, Top 5 Best Sellers, Payment Breakdown (cash netted
  correctly), and Cashier Collection (including the "No Cashier" bucket)
  all matched hand-computed expectations exactly; Save/Saved Reports
  round-tripped correctly; switching between 80mm and A4 applied the
  right body class and page size; zero console errors throughout on
  both `app.html` and `end-of-day.html`.

## `contact.html` — OTP-verified contact form

Used to be a plain click-to-reveal email address (an anti-spam-bot
pattern: the address stayed out of the page source until a button was
clicked, so scrapers never saw it). Replaced entirely with a proper
contact form, since a bare mailto: link has no way to stop spam once
the address is visible and gives no confirmation the message actually
reached anyone. The whole three-step flow lives in `contact.html`
itself; there is no server of ours involved, just a Google Apps Script
Web App in `contact-form/` (see `contact-form/README.md` for full setup
- deploy steps, constants, debugging) that the page calls with GET
requests and query params, the same convention `app.html` used to use
for its own (now-retired, see "Account & Subscription") Premium code
checks against `premium-validation/AppsScript.gs`, for the same
documented CORS reason (Apps Script Web Apps don't reliably send CORS
headers back on
POST responses).

- **Step 1 - the form:** Name/Email/Message, all required, with basic
  client-side validation (non-empty, an email-shaped `Email` value)
  before anything hits the network. `Message` is capped at
  `maxlength="1000"` with a live character counter - long enough for a
  real inquiry, short enough to keep the GET request's query string
  well within every browser's URL-length limit, since the whole message
  travels as a URL-encoded query param (`callApi()` builds it with a
  manual `encodeURIComponent()` string-building style, not
  `URLSearchParams`, matching the same convention the now-retired
  `checkPremiumCode()` used to use in `app.html`). Submitting calls
  `action=requestOtp` - Apps Script emails a 6-digit code to the address
  entered and holds the name/email/message server-side (see
  `contact-form/README.md` for exactly where) until it's verified or
  expires.
- **Step 2 - verify:** a 6-digit code input (digits-only, auto-stripped
  of anything else on `input`), "Verify & Send", "Resend code" (starts
  disabled with a live client-side countdown matching
  `RESEND_COOLDOWN_SECONDS` in `AppsScript.gs` - purely a UX nicety, the
  real cooldown enforcement is server-side so a modified client can't
  bypass it), and "← Edit your message" (goes back to Step 1 without
  losing what was typed, since the fields aren't cleared). A wrong code
  shows how many attempts remain (`attemptsLeft` from the API response);
  running out or letting the code expire surfaces a clear message to
  request a fresh one rather than a dead end.
- **Step 3 - success:** confirms the message was sent and a confirmation
  email is on its way, plus "Send another message" which fully resets
  the form (including the character counter and any error boxes) back
  to Step 1.
- **Two emails go out on a successful verify**, both from
  `contact-form/AppsScript.gs`: one to the site owner (`OWNER_EMAIL` in
  that file), subject `GoOnlinePOS.com Site Inquiry`, with the visitor's
  name/email/message and `Reply-To` set to the visitor's address so
  replying is a single click in Gmail; and one to the visitor, same
  subject, a short "thank you for your inquiry, I've received your
  message and will get back to you" auto-reply that echoes their
  message back, explicitly labeled as an automated message in both
  emails. This was a deliberate design decision, not just following the
  request literally - a contact form that only auto-replies to the
  visitor and never actually notifies the site owner would leave every
  inquiry undiscovered unless someone thought to check their own Gmail
  "Sent" folder, which defeats the point of having a contact form at
  all.
- **`CONTACT_FORM_URL`** near the top of `contact.html`'s script is a
  placeholder (`"REPLACE_WITH_YOUR_CONTACT_FORM_APPS_SCRIPT_URL"`) -
  must be replaced with the deployed Apps Script's own `/exec` URL
  before this works, the same pattern `PREMIUM_VALIDATION_URL` used to
  follow in `app.html` before the Premium system moved to Supabase (see
  "Account & Subscription"). This Apps Script project is **not** bound
  to any Google Sheet (see `contact-form/README.md`) - it holds the
  in-progress name/email/message/OTP in `CacheService` between the two
  steps, a built-in short-lived key-value store, since nothing here
  needs to persist longer than one contact-form submission.
- Verified end-to-end with Playwright against a mocked endpoint (can't
  deploy the real Apps Script without the site owner's Google account,
  the same class of limitation the old Premium code system's own testing
  had): empty-field and invalid-email submissions are caught client-side before any
  network call; a valid submission moves to Step 2 and shows the
  address the code was sent to; a wrong code shows the correct
  attempts-remaining message and stays on Step 2; the resend cooldown
  button is disabled immediately after a successful send and its
  countdown actually ticks down; the correct code moves to Step 3; and
  "Send another message" fully resets back to Step 1 with the name
  field genuinely empty. Zero console errors throughout.

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
- **Google AdSense compliance:** `ads.txt` (root) declares `ca-pub-4312510288776967` as a `DIRECT` seller, matching the same publisher ID every page's `loadAnalyticsAndAds()` uses to load `adsbygoogle.js`. `robots.txt` allows every crawler (`Allow: /`), so nothing blocks Google's ad-serving crawler either. **No page places any `<ins class="adsbygoogle">` ad unit or `enable_page_level_ads` Auto ads push call** - every page only loads the base library, so whether ads actually render anywhere depends entirely on Auto ads being switched on for this site in the AdSense account dashboard; there's nothing broken in the code either way, just nothing to point to here if that setting is off. `privacy.html` has a dedicated **"Advertising"** section (added after an audit found the policy discussed Google Analytics at length but never mentioned AdSense at all - a real gap against AdSense's own privacy-policy requirements) disclosing that Google/its partners use cookies to serve ads based on prior visits, linking to Google Ads Settings (`adssettings.google.com`) and `aboutads.info` for opt-out, and folding "Google AdSense" into the existing third-party-services list and the "Cookies"/"Children's privacy" sections; `terms.html`'s own third-party-services paragraph got the same one-line addition, pointing back to the privacy policy for detail. The existing cookie-consent banner (see "Cookies/consent + analytics/ads" in `app.html` — architecture above) already gated `adsbygoogle.js` behind explicit consent before this pass - that part didn't need fixing, just documenting as already compliant. **Wording was later corrected from present-tense "shows ads"/"serves ads" to "may show ads"/"may serve ads"** in both `privacy.html` (the Advertising section's opening sentence and its Third-party services list entry) and `terms.html`'s matching third-party-infrastructure sentence - since Auto ads isn't actually switched on in the AdSense dashboard yet (see the bullet above), the site wasn't literally showing any ads at the time, and the original wording overstated what was actually happening. The rest of the disclosure (cookies, opt-out links, Children's privacy) was left as unconditional since the AdSense script itself still loads and could start serving ads/cookies the moment Auto ads is switched on remotely, with no code change on this end.
- **`index.html` carries two `<script type="application/ld+json">` blocks**
  — the original `SoftwareApplication` schema (name/description/
  featureList/offer), and a second block: a JSON array of
  `SiteNavigationElement` entries (Free Point of Sale, Free Invoice
  Generator, Free Receipt Generator, Free Barcode & QR Code, Free VAT
  Calculator, Free Pricing Calculator, Blog), each
  with its own `name`/`url`. This is a **best-effort hint**, not a
  guarantee - Google decides
  on its own whether to render sitelinks beneath a search result, and
  there's no way to force it - but `SiteNavigationElement` is the
  standard schema.org signal for "these are the site's important
  sub-pages," and giving Google that signal is the most a site can
  actually do to make Free Invoice Generator/Free Receipt Generator more
  likely to show up as sitelinks under the main goonlinepos.com search
  result. Only on `index.html`, matching where the existing
  `SoftwareApplication` schema already lives - no other page has any
  JSON-LD.
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
  `invoice-generator.html`, `receipt-generator.html`, `barcode-generator.html`,
  `blog.html`, `blog-why-your-business-needs-a-pos.html`,
  `blog-create-your-own-pos-with-appsheet.html`,
  `blog-from-excel-to-appsheet-expert.html`, `contact.html`,
  `privacy.html`, `terms.html` — matching each page's own
  `index, follow` robots meta tag. `customer.html` is deliberately absent
  (its own tag says `noindex, nofollow`). If a page's robots meta changes,
  update this file to match. **Every new blog article needs its own
  sitemap entry** (`yearly`/`0.5`, matching the existing article) - this
  was missed once when a second article (`blog-create-your-own-pos-with-
  appsheet.html`) was added directly via the GitHub web UI, so double
  check this file whenever a new `blog-*.html` page shows up.
- **`guide.html`** was the full, screenshot-by-screenshot "Every setting,
  explained" walkthrough (all 17 `guide-item`s, the same `.guide-nav`
  jump links), originally split out of `index.html` into its own page
  because it's the section that goes stale every time a setting changes
  or a screenshot needs retaking, and a shop-owner visitor reading it
  didn't need the rest of `index.html`'s marketing copy in the way.
  **Now retired** — its `<meta name="robots">` was changed from
  `index, follow` to `noindex, follow` (still `follow`, not `nofollow`,
  since the page's own internal links, e.g. to `app.html`, are still
  worth crawlers following even though the page itself shouldn't be
  indexed), it was dropped from `sitemap.xml` and from every other
  page's nav/footer, and `index.html` lost the 4-image teaser grid/CTA
  that used to link to it. The file itself is otherwise **untouched** —
  still has its old body content and its own old header/footer/nav
  referencing the pre-overhaul link set — kept on disk unlinked rather
  than deleted, in case anything external still links to it directly.
  Its walkthrough content lives on inside `app.html` itself as the
  text-only "How To Use" panel instead (see "`app.html` — architecture"
  above) — not a byte-for-byte copy, rewritten to be screenshot-free
  since you're already looking at the real UI once you're in the app.
- **`how-it-works.html`** was a genuinely broken/orphaned page before an
  earlier fix, all in one pass: (1) its `<head>` had a duplicated, nested
  `<!DOCTYPE html><html><head>` wrapper with two conflicting
  title/description/robots blocks (malformed HTML, not just a missing-tag
  gap); (2) its Google Analytics script loaded unconditionally, unlike
  every other page's consent-gated `loadAnalyticsAndAds()` — it was fixed
  to use the exact same cookie-consent banner/gating pattern as
  `about.html`/`contact.html`/`blog.html`; (3) **not one other page
  linked to it** at the time, making it an orphan page Google would
  rarely recrawl regardless of its own meta tags; (4) its own "Open the
  app" buttons linked to `index.html` instead of `app.html`. **Now
  retired** the same way as `guide.html` above — `noindex, follow`,
  removed from `sitemap.xml` and every nav/footer, file left otherwise
  untouched on disk. Its own walkthrough content is likewise superseded
  by `app.html`'s in-app "How To Use" panel.
- `privacy.html`/`terms.html` each used to render **two `<h1>` tags** (the
  shared brand-mark heading in the page header, plus the real
  page-specific title — "Privacy Policy"/"Terms of Service" — below it).
  Fixed by demoting the brand-mark heading to `<h2>` (CSS selector
  `.page-header h1` renamed to `.page-header h2` alongside it, no visual
  change) so the page's actual topic is the page's only `<h1>`. Keep this
  in mind before copying `about.html`'s/`contact.html`'s header markup
  onto a page that already has its own `<h1>` elsewhere.
- **`about.html`'s cookie-consent `<script>` had stray literal
  `` ``` `` markdown code-fence lines** embedded directly in the JS (4
  of them, likely pasted in from an AI response or markdown source via
  the GitHub web UI without stripping the fences first) - not a comment,
  an actual syntax problem: three backticks parse as an empty template
  literal immediately followed by another unclosed template literal, and
  when the next line happens to start with `(`, JS's automatic semicolon
  insertion doesn't kick in, so it tries to **call the empty string as a
  function** - `TypeError: "" is not a function`, thrown from `showView()`
  on every single page load before the fix (it silently broke the entire
  cookie banner, meaning analytics/ads never loaded on this page since
  `acceptCookies()` was unreachable). Fixed by deleting the 4 stray
  `` ``` `` lines; confirmed via Playwright the banner now shows and
  closes/accepts with zero console errors. If a page ever again shows a
  `TypeError: "" is not a function` (or similar "empty string is not a
  function/not defined" errors), search that file for stray `` ``` ``
  first - it's a fast, easy-to-miss mistake when copy-pasting AI output
  into the GitHub web UI without stripping the markdown fences.

## Conventions / working on this repo

- No build/test/lint tooling exists — verify changes by opening the HTML
  file directly (or a local static server) and exercising the UI; there is
  nothing to `npm install` or `npm run`.
- Keep new persisted keys behind `storageGet`/`storageSet`, not raw
  `localStorage`, to preserve the embedded-host code path.
- Keep `sitemap.xml` in sync with each page's own `<meta name="robots">`
  when adding/removing/re-gating an indexable page — see "SEO" above.
- **No `.html` extension on internal links, anywhere.** GitHub Pages
  natively serves `page.html` at both `/page.html` and `/page` (no
  redirect, no config needed - confirmed via GitHub's own community
  docs/discussions, since this sandbox can't reach the live custom
  domain directly to verify it firsthand). Every internal `href="X.html"`
  and OG/canonical `content="https://goonlinepos.com/X.html"` across
  every page was swept to the extension-less form (`href="X"`,
  `content="https://goonlinepos.com/X"`), including the ones baked into
  `modules/translations.js`'s HTML strings (`buyPremiumContactText` →
  `href="contact"`, `offlineAgreeLabel` → `href="terms"`, across all six
  languages - easy to miss since these aren't in a `*.html` file's own
  markup, they're rendered via `innerHTML` from a JS string). The
  homepage link specifically became `href="/"` rather than `href=""` or
  `href="/index"`. `sitemap.xml`'s `<loc>` entries were updated to match.
  This is safe for every marketing page (`index.html`, `about.html`,
  `contact.html`, `guide.html`, `how-it-works.html`, `privacy.html`,
  `terms.html`, `blog.html` + its articles, `invoice-generator.html`, `receipt-generator.html`)
  since none of them are bundled into the offline `.zip`, where extension-less
  resolution doesn't exist (plain Python `http.server` and `file://`
  both need the real filename). **Two deliberate exceptions inside
  `app.html`, both still using the real `.html` filename:**
  `customerScreenUrl()` (returns `.../customer.html` - this URL is
  shown to the user to open on another device, and must work
  identically whether they're on the live site or the offline package,
  where `customer.html` genuinely is bundled) and any instructional
  text telling someone to literally **double-click `app.html`** (that's
  a real filename on their filesystem, not a browser link - occurs in
  `app.html`'s own offline-download modal copy and in
  `modules/translations.js`'s `offlineModalHowList`, all six
  languages). `openCreateInvoice()`/`openCreateReceipt()`, by contrast,
  **were** changed to extension-less `"invoice-generator"`/
  `"receipt-generator"`, since
  neither `invoice-generator.html` nor `receipt-generator.html` is in the offline package
  (see their own sections above) - the buttons that call them are
  stripped from the offline copy entirely, so these functions only ever
  run on the live site. `app.html`'s own `#homepageShortcutButton`/
  `#blogShortcutButton` (see "Site-wide header, nav & footer" above) are
  extension-less the same way (`window.open('/', ...)`/
  `window.open('blog', ...)`) and don't need any directory-relative
  trick either, since both are wrapped in their own `OFFLINE-STRIP`
  markers and only ever run on the live site - the offline package has
  neither `index.html` nor `blog.html` to open. The now-deleted
  `goHome()` (the old Home button, distinct from the current Homepage
  link - see "Header brand mark is not a link" above) is the one
  exception that predates this sweep and needed the directory-relative
  trick instead, because it had to work identically on **both** the
  live site and the offline package.
- **No em dashes ("—") anywhere in site text** - explicit standing
  instruction. Every em dash across every page (marketing pages and
  `app.html`, all UI strings and all six `translations` language blocks)
  was swept to a plain hyphen (`-`) with surrounding spacing left as-is.
  Write new copy with a plain hyphen or a period/comma instead of an em
  dash from now on - this applies to visible site text (labels,
  descriptions, translations), not to this file or other developer docs.
- Git workflow observed in history: work happens on `main`; this session's
  designated branch is `claude/repo-code-access-jpjg54`.
