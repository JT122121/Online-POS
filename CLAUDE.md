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
  `invoice.html`/`receipt.html` below, share one canonical site-wide
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
- **`invoice.html`** — a standalone, free invoice generator, unrelated to
  the cart/checkout flow. See "`invoice.html` — standalone invoice
  generator" below.
- **`receipt.html`** — a standalone, free payment-receipt generator
  (simple summary, not itemized), a sibling tool to `invoice.html`. See
  "`receipt.html` — standalone receipt generator" below.
- **`end-of-day.html`** — a printable/saveable POS closing report, opened
  from `app.html`'s header toolbar; unlike `invoice.html`/`receipt.html`
  it reads `app.html`'s own storage directly and ships in the offline
  package. See "`end-of-day.html` — POS closing report" below.
- **`barcode.html`** — a standalone, free barcode/QR code generator,
  `invoice.html`/`receipt.html`'s third sibling tool, linked from every
  page's header CTA row and `app.html`'s own header-links, indexable,
  and in `sitemap.xml` — it started out deliberately disconnected
  (URL-only, `noindex`) while still being built, then was wired in once
  ready. See "`barcode.html` — standalone barcode / QR code generator"
  below.
- **`vat.html`** — a standalone, free VAT calculator, the fourth
  sibling in the `invoice.html`/`receipt.html`/`barcode.html` family
  of free tools — add VAT to a net amount or remove VAT from a gross
  amount. Indexable and linked from every page's header CTA row and
  `app.html`'s own header-links from the day it shipped. See
  "`vat.html` — standalone VAT calculator" below.
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
  (lists `/`, `app.html`, `invoice.html`, `receipt.html`, `barcode.html`,
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
`privacy.html`, `terms.html`, `blog.html` + its 3 articles, `invoice.html`,
`receipt.html` — shares one canonical `<header class="site-header">`
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
<a class="cta-btn" href="invoice">Free Invoice Generator</a>
<a class="cta-btn" href="receipt">Free Receipt Generator</a>
<a class="cta-btn" href="app">Free Point of Sale</a>
</div>
</header>
```

- **Brand-mark heading level depends on whether the page already has its
  own topic-specific `<h1>` elsewhere** — same rule already established
  for `privacy.html`/`terms.html` before this change (see SEO below):
  `index.html`/`about.html`/`contact.html`/`blog.html` (which have no
  other `<h1>`) use `<h1>GoOnlinePOS.com</h1>` here; `privacy.html`/
  `terms.html` (own `<h1 class="doc-title">`) and `invoice.html`/
  `receipt.html` (own `<h1>` reading "Create Invoice"/"Create Receipt")
  use `<h2>` so the page keeps exactly one real `<h1>`.
- **The 5-button `.cta-btn` row is identical and in the same order on
  every page** — Free Invoice Generator → Free Receipt Generator → Free
  Barcode & QR Code (`href="barcode"`) → Free VAT Calculator
  (`href="vat"`) → Free Point of Sale (`href="app"`), always
  extension-less. `index.html` used to be the only page with this row
  (2 buttons, no POS link); a later pass added the third button there
  and rolled the whole row out site-wide, a later pass added the
  fourth (Barcode & QR Code) once `barcode.html` was ready to connect,
  and a still-later pass added the fifth (VAT Calculator) once
  `vat.html` shipped — see each tool's own section below — so **any
  older note in this file describing the CTA row as unique to
  `index.html`, or as only 3 or 4 buttons, is stale**.
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
- **`invoice.html`/`receipt.html`** keep their own existing `<header
  class="masthead">` (with the page's real `<h1>` — "Create Invoice"/
  "Create Receipt" — and the doc's own from/logo controls) **unchanged
  below** the new `site-header`; the new header was added above it, not
  merged into it. Their old `.top-actions` div (a back-link plus, on
  `invoice.html`, a second "Open the POS App" button) was removed
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
    Generator, Free Barcode & QR Code, Free VAT Calculator, in that
    order - six **text-only** buttons (no emoji icon, unlike most of
    the rest of the toolbar), all sharing the exact same dark-green
    (`--accent-dark`) pill styling so they read as one consistent row
    rather than differently-weighted actions. Free Barcode & QR Code
    (`#createBarcodeButton` → `openCreateBarcode()`) was added once `barcode.html` was ready
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
    `buildOfflineAppHtml()` - none of `blog.html`/`invoice.html`/
    `receipt.html`/`index.html` ship in the offline package for them to
    open. **`#createVatButton` → `openCreateVat()` was added last**,
    once `vat.html` shipped - same `window.open(...)` new-tab pattern,
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
  choosing an exact size in Settings → Paper & Zoom).
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
  own framing ("along with backup and offline mode"). **Two more cards
  were added right after that** - "Create invoices" (a file/document
  icon) and "Create receipts" (a zigzag-bottomed receipt icon), each
  pointing at the free `invoice.html`/`receipt.html` tools reachable
  from the header's own "Free Invoice Generator"/"Free Receipt
  Generator" buttons - explicitly requested to balance the grid's row
  count: with the End of Day card the grid stood at 13 cards, leaving a
  single card alone on its own row-of-3 at the bottom
  (`grid-template-columns: repeat(3, 1fr)`); 13 → 15 makes it a clean 5
  full rows with nothing dangling. Verified via Playwright (comparing
  each card's `getBoundingClientRect().top`) that the last row is a
  full row of 3 at the 1400px desktop width the 3-column layout applies
  at.
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
  panel's own content is English-only, same as `invoice.html`/
  `receipt.html`/`end-of-day.html`.

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
only by `barcode.html` — see that page's own section below. None of
the three are referenced by `app.html`/`offline-builder.js`, so they
have no bearing on the offline package.

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
- On confirm, it `fetch()`es the **currently live** `app.html`,
  `customer.html`, and `end-of-day.html` (same-origin, `cache: "no-store"`)
  - **not** `invoice.html`/`receipt.html`/`barcode.html`, all three
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
  `CREATE-INVOICE-JS` - there's no `invoice.html` in the offline copy
  for it to open), the "Free Receipt Generator" button + its
  `openCreateReceipt()` function (`CREATE-RECEIPT-BUTTON`/
  `CREATE-RECEIPT-JS`, the same treatment for `receipt.html`), and the
  "Free Barcode & QR Code" button + its `openCreateBarcode()` function
  (`CREATE-BARCODE-BUTTON`/`CREATE-BARCODE-JS`, the same treatment for
  `barcode.html`).
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

## `invoice.html` — standalone invoice generator

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
  nav links, `.site-header .cta-btn`) links here (`href="invoice"`, labeled
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

## `receipt.html` — standalone receipt generator

A free-standing **payment receipt** builder, `invoice.html`'s sibling tool
and built by mirroring its architecture closely (own `--ink`/`--accent`/
`--gold` design tokens, own cookie-consent banner, own autosave-draft +
explicit Save/Saved-list pattern, `window.print()` + `@media print` for
PDF export). It now supports line items and a payment split (added after
initial feedback that the first version, a non-itemized single Total/
Received summary, was missing both) - see the items/payment bullet
below - though it's still lighter than `invoice.html`: no tax/discount
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
pattern as `invoice.html`).
- **Every page's header `.cta-btn` row** has "Free Invoice Generator"
  (`href="invoice"`) and "Free Receipt Generator" (`href="receipt"`) as
  its first two buttons, in that order, before "Free Point of Sale" -
  see "Site-wide header, nav & footer" above for the full pattern.
- **Header layout follows common commercial-receipt convention**, the
  same `.doc-header`/`.doc-header-left`/`.doc-header-right`/`.doc-meta`/
  `.bill-to-block`/`.currency-inline` structure as `invoice.html` (see
  its own section above for the full breakdown) - logo + "From" on the
  left, the right-aligned "RECEIPT" title/number/Date on the right, a
  no-print `.currency-inline` picker tucked above the title instead of a
  printed "Currency" field, and "Received From" (renamed from
  `invoice.html`'s "Bill To") as its own block below the header. Only
  markup/CSS changed - every field kept its original `id` so no JS
  needed to change.
- **Line items and a payment split**: an `.items-table` (`#rcItemsBody`,
  Description/Amount - no Qty/Rate split like `invoice.html`, since a
  receipt line is usually a flat amount, not a quantity × rate
  calculation) whose row amounts sum into **Total**, and a
  **Payment Received** block (`#rcPaymentsBody`, one `.payment-row` per
  payment method + amount) whose row amounts sum into **Total Received**.
  Both start with one row on a new receipt and can't go below one (the
  remove button disables itself on the last row), mirroring
  `invoice.html`'s own items table. **Total Due** stays computed as
  Total − Total Received. Payment methods are a `<select>` seeded from
  `DEFAULT_PAYMENT_METHODS` (Cash/Card/Bank Transfer/Cheque/Other) plus
  any custom ones a user has typed before (persisted in
  `localStorage["goonlinepos-receipt-payment-methods"]`, shared across
  all receipts in that browser) - picking "+ Add New..." prompts for a
  name and adds it to that list. There is still no discount/tax math
  (unlike `invoice.html`) - itemizing here is about listing what was
  paid for and how, not computing a bill.
- **Amount in Words** (`amountToWords()`) - auto-converts the Total into
  words underneath the totals box, currency-aware via a `CURRENCIES` map
  (`{symbol, name, subunit, decimals}` per code) richer than
  `invoice.html`'s plain `{code: symbol}` map, since it needs the
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
  pattern as `invoice.html`'s "Save Invoice"/"Saved Invoices": "💾 Save
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
  `invoice.html`'s own print CSS rather than `app.html`'s 80mm thermal
  receipt convention - this tool is meant to print or save as a regular
  document/PDF, not on a thermal receipt printer. (An earlier version
  used `@page { size: 80mm auto; margin: 0; }` to match `app.html`'s
  thermal receipts, but was changed to A4/Letter to match `invoice.html`
  instead, per explicit feedback.) Like `invoice.html`, `@page` margin is
  `0` and the visual page margin comes from `.wrap { padding: 12mm }` in
  print instead, so the browser's own print header/footer (title, URL,
  date, page number) has no room to render - and every `<select>`
  (Currency, each payment row's method picker) gets
  `appearance: none` (plus the `-webkit-`/`-moz-` prefixes) in print so
  no dropdown-arrow icon shows next to the now-borderless select.
- **Has its own full cookie-consent banner**, same reasoning as
  `invoice.html` - a separate `goonlinepos-cookie-consent` check since
  this page can be visited directly.
- **Deliberately NOT bundled into the "Download Offline POS" package** -
  same policy as `invoice.html`, a separate free web tool rather than
  part of the offline POS itself. `app.html`'s own "Free Receipt
  Generator" button and `openCreateReceipt()` function are wrapped in
  their own `OFFLINE-STRIP:CREATE-RECEIPT-BUTTON`/`CREATE-RECEIPT-JS`
  marker blocks (mirroring Create Invoice's exact markers) so they
  don't appear in the offline copy either.
- Six-language UI strings are **not** part of this page, same as
  `invoice.html` - `app.html`'s `translations` dictionary only supplies
  the `createReceiptShortcutLabel` header-links text; the receipt tool
  itself is English-only.

## `barcode.html` — standalone barcode / QR code generator

A free-standing barcode and QR code generator, `invoice.html`/
`receipt.html`'s third sibling free tool, built by mirroring their
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
`barcode`, same new-tab pattern as Create Invoice/Create Receipt, same
`OFFLINE-STRIP:CREATE-BARCODE-BUTTON`/`CREATE-BARCODE-JS` marker
wrapping since `barcode.html` isn't in the offline package either -
`modules/offline-builder.js` strips both), and
`modules/translations.js` picked up a `createBarcodeShortcutLabel` key
across all six language blocks to match. `vendor/LICENSES.txt`'s "not
yet linked from any other page" note for `jsbarcode.min.js`/
`qrcode.js`/`qrcode_UTF8.js` is now stale now that the page linking to
them is connected - the libraries themselves are still barcode.html-only,
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
  pattern as `invoice.html`/`receipt.html`'s own Save/Saved
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

## `vat.html` — standalone VAT calculator

A free-standing VAT calculator, `invoice.html`/`receipt.html`/
`barcode.html`'s fourth sibling free tool, built by mirroring their
exact architecture (own `--ink`/`--accent`/`--gold` design tokens
copied verbatim, own cookie-consent banner, own autosave-draft +
explicit Save/Saved-list pattern, an "info-section" How-to + FAQ
block, own `<meta name="robots">` of `index, follow`, its own
`sitemap.xml` entry, its own `SiteNavigationElement` JSON-LD entry on
`index.html`). Indexable and connected from day one - unlike
`barcode.html`, there was no unlinked/building period, since the
calculator/save-list pattern was already proven three times over by
the time this was built.
- **Every page's header `.cta-btn` row** picked up a fifth button,
  **"Free VAT Calculator"** (`href="vat"`), inserted right after "Free
  Barcode & QR Code" and before "Free Point of Sale" - see "Site-wide
  header, nav & footer" below for the full row and why the order is
  what it is. `app.html`'s own `.header-links` row picked up a
  matching `#createVatButton` → `openCreateVat()` (`window.open(...)`
  to `vat`, same new-tab pattern as Create Invoice/Receipt/Barcode,
  same `OFFLINE-STRIP:CREATE-VAT-BUTTON`/`CREATE-VAT-JS` marker
  wrapping since `vat.html` isn't in the offline package either -
  `modules/offline-builder.js` strips both), and
  `modules/translations.js` picked up a `createVatShortcutLabel` key
  across all six language blocks to match. This surfaced a real,
  pre-existing `changeLanguage()` translation-map bug affecting the
  Barcode & QR Code button too - see "Site-wide header, nav & footer"
  above, under `.header-links`, for the full story and fix.
- **Two modes, one shared result set**: `#tabAddVat`/`#tabRemoveVat`
  (the same `.type-tabs`/`.type-tab` pill pattern `barcode.html` uses
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
  `barcode.html`'s Label Size uses: `VAT_RATES` holds common standard
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
- **Currency is the same plain `{code: symbol}` map `invoice.html`
  already has** (`CURRENCIES`, copied verbatim - see `invoice.html`'s
  own section above) via a `.currency-inline` picker (same class/CSS
  as `invoice.html`/`receipt.html`'s own currency control) above the
  amount field. `formatAmount(value, code)` is the shared money
  formatter, always 2 decimals regardless of currency, matching
  `invoice.html`'s own `money()` - this tool doesn't need
  `receipt.html`'s richer per-currency decimals/subunit handling since
  there's no "Amount in Words" feature here.
- **No Print/Download output** - unlike `barcode.html` (Download PNG)
  or `invoice.html`/`receipt.html` (print-to-PDF), a VAT calculation is
  just three numbers, not a document or image, so there's nothing
  meaningful to export as a file. The action bar is Save/Saved
  Calculations/Clear-New only, three buttons instead of the other
  tools' four.
- **Save/Saved Calculations** follows the exact same
  explicit-save-plus-list pattern as `invoice.html`/`receipt.html`/
  `barcode.html`'s own Save/Saved Invoices/Receipts/Codes: "💾 Save"
  pushes the current calculation into a `goonlinepos-vat-history`
  `localStorage` array (`{id, mode, currency, rateLabel, net, vat,
  gross, savedAt, state}`) and shows a `.save-toast`; "📂 Saved
  Calculations" opens a `.modal-overlay` (`#savedVatOverlay`) listing
  entries newest-first, each row carrying a small `Add VAT`/`Remove
  VAT` badge (reusing `barcode.html`'s `.saved-code-badge`/`.type-qr`
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
  calculations I can do?" entry** (matching `barcode.html`'s own
  "Is there a limit on how many codes I can generate?" - see that
  page's section above), since every tool in this free-tools family
  now answers that question the same way: no, everything runs
  client-side with no server call and no usage cap.
- **Deliberately NOT bundled into the "Download Offline POS" package** -
  same policy as `invoice.html`/`receipt.html`/`barcode.html`, a
  separate free web tool rather than part of the offline POS itself.
- Six-language UI strings are **not** part of this page, same as
  `invoice.html`/`receipt.html`/`barcode.html` - `app.html`'s
  `translations` dictionary only supplies the `createVatShortcutLabel`
  header-links text; the calculator itself is English-only.

## `end-of-day.html` — POS closing report

Replaces the old in-app "Sales Summary" panel (`toggleSalesSummary()`/
`renderSalesSummary()`/`saleMethodBreakdown()`, all removed from
`app.html`) with a standalone, printable, saveable report. Unlike
`invoice.html`/`receipt.html`, this page is **not** decoupled from
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
- **Included in the offline package** (unlike `invoice.html`/
  `receipt.html`) - `modules/offline-builder.js` fetches
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
  Generator, Free Receipt Generator, Free Barcode & QR Code, Blog), each
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
  `invoice.html`, `receipt.html`, `barcode.html`,
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
  `terms.html`, `blog.html` + its articles, `invoice.html`, `receipt.html`)
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
  **were** changed to extension-less `"invoice"`/`"receipt"`, since
  neither `invoice.html` nor `receipt.html` is in the offline package
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
