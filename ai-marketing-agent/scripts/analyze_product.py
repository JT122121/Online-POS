#!/usr/bin/env python3
"""
analyze_product.py

Phase 1 of the GoOnlinePOS AI Marketing Agent.

READ-ONLY inspection of the GoOnlinePOS source tree. This script never
writes to, deletes, or restructures anything outside ai-marketing-agent/.

What it does:
  1. Walks a declarative list of "feature probes" - each probe names a real
     GoOnlinePOS feature and a small set of source-code anchors (function
     names, element ids, marker comments) that must exist for the claim
     "this feature exists" to be true.
  2. Opens the referenced GoOnlinePOS source files (app.html, modules/*.js,
     etc.) with a plain read - no execution, no modification - and checks
     each anchor with re.search().
  3. A feature is marked "verified": true only if every one of its anchors
     is still found in the current source. If GoOnlinePOS changes later and
     an anchor disappears (a function renamed/removed, a marker deleted),
     re-running this script will flip that feature to "verified": false and
     print a warning - this is the "refresh when the code changes"
     mechanism the project brief asked for. It is intentionally simple
     (regex anchor-matching, not a real AST/static analyzer) - good enough
     to catch drift, not a guarantee of semantic correctness.
  4. Writes the verified inventory to knowledge/features.json (JSON only,
     no database, per the project's persistence rule).
  5. Appends one run record to data/logs/agent.log.jsonl (Safety rule 8:
     log important agent decisions).

Every "feature" below was found by hand during a real inspection of the
GoOnlinePOS source (app.html, modules/, and the project's own CLAUDE.md
documentation) before this script was written - nothing here is invented.
The `evidence` anchors are what make that claim checkable by anyone,
including future re-runs of this exact script.

Usage:
    python3 scripts/analyze_product.py            # verify + write features.json
    python3 scripts/analyze_product.py --check    # verify only, exit 1 if any drift
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = AGENT_DIR.parent  # the GoOnlinePOS repo root - READ ONLY, never written to
KNOWLEDGE_FILE = AGENT_DIR / "knowledge" / "features.json"
LOG_FILE = AGENT_DIR / "data" / "logs" / "agent.log.jsonl"

sys.path.insert(0, str(AGENT_DIR))
from agent.logger import log_event  # noqa: E402


# ---------------------------------------------------------------------------
# Feature probes: the declarative source of truth. Each entry names a real,
# hand-verified GoOnlinePOS feature and the source anchors that prove it
# exists. `evidence` entries are {file, pattern, description} - `file` is
# relative to REPO_ROOT (read-only), `pattern` is a plain regex checked with
# re.search against that file's text.
# ---------------------------------------------------------------------------
FEATURE_PROBES = [
    {
        "feature_id": "inventory-management",
        "feature": "Inventory Management",
        "description": (
            "Optional per-product stock tracking. Stock decrements automatically "
            "on every sale and can be corrected/restocked from Settings -> Inventory."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function renderInventoryList\(\)"},
            {"file": "app.html", "pattern": r'data-tab="inventory"'},
        ],
        "page_or_location": "app.html - Settings -> Inventory",
        "benefit": "Know what's actually left on the shelf without a separate spreadsheet, and never oversell an item you're out of.",
        "marketing_angles": [
            "Track your stock without relying on manual spreadsheets.",
            "Stock updates itself the moment you make a sale.",
        ],
        "confidence": "high",
        "is_premium": "partial",
        "problem": "Still counting stock by hand or guessing what's left on the shelf?",
        "target_audience": "Shop owners who track their own inventory - convenience stores, small retail, home-based sellers.",
        "premium_note": "Viewing and tracking stock is free; editing stock numbers or exporting the inventory list requires Premium (see app.html's applyPremiumLocks()).",
    },
    {
        "feature_id": "product-photos",
        "feature": "Product Photos in the Catalog",
        "description": (
            "Each product can carry a photo, auto-compressed client-side to a small "
            "160px JPEG so the whole catalog still fits comfortably in browser storage."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function compressProductPhoto\(file\)"},
            {"file": "app.html", "pattern": r"function renderProductCatalog\(\)"},
        ],
        "page_or_location": "app.html - Settings -> Products / the main catalog grid",
        "benefit": "Cashiers find items faster by sight, especially useful for food, bakery, or lookalike products.",
        "marketing_angles": [
            "Add a real photo to every product - find items by sight, not just by name.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Cashiers wasting time squinting at a text-only product list to find the right item.",
        "target_audience": "Cashiers and shop staff working a busy counter, especially with lookalike products like food or bakery items.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "bulk-product-import",
        "feature": "Bulk Product Import (CSV or Excel)",
        "description": (
            "The whole product catalog can be replaced in one step by uploading a "
            "CSV or .xlsx/.xls file (Name/Price/Category/SKU, optional Stock/TaxExempt)."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function handleProductFileUpload\(event\)"},
            {"file": "app.html", "pattern": r"vendor/xlsx\.full\.min\.js"},
        ],
        "page_or_location": "app.html - Settings -> Products",
        "benefit": "Load hundreds of products in minutes from a spreadsheet you already have, instead of typing each one in by hand.",
        "marketing_angles": [
            "Already have your product list in Excel? Upload it and you're ready to sell.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Typing in a hundred products one at a time before you can even open for business.",
        "target_audience": "New shop owners setting up their catalog for the first time, or anyone migrating from a spreadsheet.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "usb-barcode-scanning",
        "feature": "USB Barcode Scanner Support",
        "description": (
            "Keyboard-wedge style USB barcode scanner support - a fast keystroke burst "
            "ending in Enter is matched against product SKU and added to the cart automatically."
        ),
        "evidence": [
            {"file": "modules/usb-scanner.js", "pattern": r"function handleUsbScanKeydown\(e\)"},
            {"file": "app.html", "pattern": r'id="barcodeScannerToggle"'},
        ],
        "page_or_location": "app.html - main catalog screen, Barcode Scanner toggle",
        "benefit": "Ring up items as fast as a real checkout counter - plug in any standard USB barcode scanner, no special drivers.",
        "marketing_angles": [
            "Plug in a $20 USB barcode scanner and start scanning - no setup, no drivers.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Ringing up items by typing the name in manually, one by one, while a line builds up.",
        "target_audience": "Retail cashiers and convenience-store staff who already own a standard USB barcode scanner.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "split-payments",
        "feature": "Split Payments Across Multiple Methods",
        "description": (
            "A single sale can be paid using more than one payment method (e.g. part cash, "
            "part card) by adding extra payment rows at checkout."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function addPaymentRow\(\)"},
            {"file": "app.html", "pattern": r"paymentRows"},
        ],
        "page_or_location": "app.html - checkout screen",
        "benefit": "Handle real-world customers who want to pay part cash, part card, without any workaround.",
        "marketing_angles": [
            "Customer paying half cash, half card? One sale, one receipt, no problem.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "A customer wants to pay part cash, part card, and the register can't handle it in one sale.",
        "target_audience": "Cashiers handling walk-in retail or food-service customers with mixed payment habits.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "per-sale-discount-and-tax-exempt",
        "feature": "Per-Sale Discounts & Per-Item Tax Exemption",
        "description": (
            "A percent or fixed-amount discount can be applied at checkout, and any item "
            "(catalog default or overridden per sale) can be marked tax-exempt."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r'id="discountType"'},
            {"file": "app.html", "pattern": r"cart-tax-exempt"},
        ],
        "page_or_location": "app.html - checkout screen / cart lines",
        "benefit": "Apply a one-off discount to a single customer, or exempt specific items from tax, without changing your store-wide settings.",
        "marketing_angles": [
            "Give one customer a discount without touching your store-wide pricing.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Needing to give one customer a one-off discount without touching your store-wide prices.",
        "target_audience": "Shop owners who occasionally negotiate price or serve tax-exempt customers or organizations.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "multi-cashier-support",
        "feature": "Multiple Cashiers",
        "description": (
            "Multiple named cashiers can be configured; each sale records which cashier "
            "rang it up, and End of Day / Sales History report totals broken down per cashier."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"async function loadCashiers\(\)"},
            {"file": "app.html", "pattern": r"activeCashierName"},
        ],
        "page_or_location": "app.html - Settings -> Cashiers, End of Day report",
        "benefit": "See exactly how much each staff member sold and collected during a shift.",
        "marketing_angles": [
            "Know exactly which cashier rang up which sale - no guessing at shift-close.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "No way to tell which staff member rang up which sale when the register comes up short.",
        "target_audience": "Shop owners with more than one person working the register across shifts.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "sales-history-and-end-of-day",
        "feature": "Sales History + Printable End of Day Report",
        "description": (
            "Every completed sale is saved and browsable/editable in Sales History. A "
            "separate End of Day report (end-of-day.html) totals a chosen day's sales, "
            "items sold, payment-method breakdown, and per-cashier collection, and can "
            "be printed or saved as a frozen snapshot."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function openEndOfDayReport\(\)"},
            {"file": "end-of-day.html", "pattern": r"saleMethodBreakdown"},
        ],
        "page_or_location": "app.html header -> End of Day, end-of-day.html",
        "benefit": "Close out the register with a real report - total sales, best sellers, and cash-vs-card breakdown - not a mental tally.",
        "marketing_angles": [
            "Close your register with a real report, not a guess - totals, best sellers, and payment breakdown in one click.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Closing the register with a mental guess instead of a real total.",
        "target_audience": "Shop owners and managers closing out a business day.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "sales-export-excel",
        "feature": "Export Sales & Inventory to Excel",
        "description": (
            "Sales History (optionally filtered by date range) and Inventory can both "
            "be exported to a real .xlsx workbook, or CSV as a fallback."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function exportSalesToExcel\(\)"},
        ],
        "page_or_location": "app.html - Settings -> Sales History",
        "benefit": "Hand your accountant a real spreadsheet of sales for any date range, no manual re-typing.",
        "marketing_angles": [
            "Download your sales as a real Excel file for any date range - ready for your accountant.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Hand-copying sales numbers into a spreadsheet every time your accountant asks for them.",
        "target_audience": "Shop owners who work with an accountant or bookkeeper, or file their own taxes.",
        "premium_note": "Sales export is not Premium-gated (only Inventory export is - see applyPremiumLocks()).",
    },
    {
        "feature_id": "customer-facing-display",
        "feature": "Customer-Facing Order Screen",
        "description": (
            "A second, lightweight page (customer.html) mirrors the live cart/order "
            "state in real time, meant for a second monitor or a screen facing the "
            "customer. This is a Premium feature - app.html's applyPremiumLocks() "
            "keeps it locked until Premium is active."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function customerScreenUrl\(\)"},
            {"file": "app.html", "pattern": r"function broadcastCustomerScreenState\(state\)"},
        ],
        "page_or_location": "app.html header -> Customer Screen, customer.html",
        "benefit": "Let the customer see exactly what's being rung up and the running total, the way a supermarket checkout does.",
        "marketing_angles": [
            "Give your customer their own screen showing exactly what they're being charged.",
        ],
        "confidence": "high",
        "is_premium": "yes",
        "problem": "A customer at the counter has no way to see what they're actually being charged until the receipt prints.",
        "target_audience": "Retail and food-service shop owners who want a supermarket-style checkout experience - Premium subscribers.",
        "premium_note": "Fully Premium-gated - app.html's applyPremiumLocks() hides the unlocked customer-screen content entirely until Premium is active.",
    },
    {
        "feature_id": "full-backup-restore",
        "feature": "Full Backup & Restore",
        "description": (
            "One-click download of every piece of local data (products, sales, settings, "
            "cashiers, logo) as a JSON file, and a matching restore that loads it back in."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"async function downloadFullBackup\(\)"},
        ],
        "page_or_location": "app.html - Settings -> Backup",
        "benefit": "Move to a new computer or recover from a cleared browser without losing your product list or sales history.",
        "marketing_angles": [
            "Your data lives in your browser - back it up with one click so you never lose it.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "A cleared browser or a new computer wiping out your entire product list and sales history.",
        "target_audience": "Any shop owner relying on a browser-based POS for day-to-day data.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "multi-currency",
        "feature": "Multiple Currencies",
        "description": (
            "Store currency code/symbol is configurable, affecting every price, receipt, "
            "and total shown throughout the app."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r'id="currencyCode"'},
        ],
        "page_or_location": "app.html - Settings -> Currency",
        "benefit": "Runs correctly for a business pricing in dollars, dinars, pesos, or any other currency, not just USD.",
        "marketing_angles": [
            "Set your own currency once - every receipt, price, and report follows.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "A POS that only prices in US dollars, when your business runs in a different currency entirely.",
        "target_audience": "Shop owners outside the US, or anyone pricing in a currency other than USD.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "six-language-support",
        "feature": "Six-Language Interface",
        "description": (
            "The entire app UI (and the marketing site, and the free tools) can be "
            "switched between English, Arabic (with full RTL layout), Filipino, Hindi, "
            "Spanish, and Thai."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function changeLanguage\(\)"},
            {"file": "modules/translations.js", "pattern": r"\bar:\s*\{"},
        ],
        "page_or_location": "app.html - Settings -> Language",
        "benefit": "Staff and customers can use the POS in the language they're actually comfortable with, including full right-to-left Arabic.",
        "marketing_angles": [
            "Switch the entire POS between English, Arabic, Filipino, Hindi, Spanish, and Thai.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Staff or customers who aren't comfortable reading the POS in English.",
        "target_audience": "Multilingual staff and customer-facing businesses, including Arabic-speaking markets needing full right-to-left layout.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "configurable-paper-size",
        "feature": "Configurable Receipt Paper Size",
        "description": (
            "Printed receipts can target 58mm/80mm thermal paper, A4, A5, or a custom "
            "width, with the on-screen preview and the real printed output kept in sync."
        ),
        "evidence": [
            {"file": "app.html", "pattern": r"function changePaperSize\(\)"},
        ],
        "page_or_location": "app.html - Settings -> Paper & Zoom",
        "benefit": "Print on whatever printer you already own - a thermal receipt printer or a normal A4/Letter printer - no extra hardware required.",
        "marketing_angles": [
            "No thermal printer? Print receipts on any regular A4 printer instead.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Feeling like you need to buy a special thermal printer just to use a POS.",
        "target_audience": "Shop owners using a regular A4/Letter printer instead of a dedicated thermal receipt printer.",
        "premium_note": "Included in the free Basic plan.",
    },
    {
        "feature_id": "offline-mode",
        "feature": "Downloadable Offline POS",
        "description": (
            "A Premium feature that builds a self-contained, zero-network .zip of the "
            "entire app, live in the browser, that runs with a local Python server or "
            "directly via file:// with no internet connection required."
        ),
        "evidence": [
            {"file": "modules/offline-builder.js", "pattern": r"async function confirmOfflineDownload\(\)"},
            {"file": "app.html", "pattern": r"OFFLINE-SWAP:PREMIUM-ACTIVATION"},
        ],
        "page_or_location": "app.html - Settings -> Backup -> Download Offline POS (Premium)",
        "benefit": "Keep selling even with no internet connection at all - a real concern for market stalls, pop-ups, and spotty-wifi locations.",
        "marketing_angles": [
            "No internet at your market stall? Download the offline version and keep selling.",
        ],
        "confidence": "high",
        "is_premium": "yes",
        "problem": "Losing the ability to sell the moment the wifi drops.",
        "target_audience": "Market stall vendors, pop-up shops, and any location with unreliable internet - Premium subscribers.",
        "premium_note": "Requires an active Premium subscription to download.",
    },
    {
        "feature_id": "free-invoice-generator",
        "feature": "Free Invoice Generator (standalone tool)",
        "description": (
            "A free-standing invoice builder (invoice-generator.html) for formal, "
            "net-terms billing to a customer - separate from POS checkout receipts."
        ),
        "evidence": [
            {"file": "invoice-generator.html", "pattern": r"invFrom"},
            {"file": "invoice-generator.html", "pattern": r"recalcTotals"},
        ],
        "page_or_location": "invoice-generator.html",
        "benefit": "Send a proper, professional invoice to a customer on net terms - not every sale is a same-day cash sale.",
        "marketing_angles": [
            "Need to bill a customer on terms, not just ring up a cash sale? Create a real invoice free.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "Needing to bill a customer on net terms instead of a same-day cash sale, without dedicated invoicing software.",
        "target_audience": "Freelancers, small service businesses, and shop owners who occasionally invoice rather than ring up a sale.",
        "premium_note": "A separate free tool with no Premium concept at all.",
    },
    {
        "feature_id": "free-barcode-qr-generator",
        "feature": "Free Barcode & QR Code Generator (standalone tool)",
        "description": (
            "A free-standing generator (barcode-generator.html) for common barcode "
            "symbologies (CODE128, EAN-13, UPC-A, and more) and QR codes, with "
            "print-ready label sizing and PNG export."
        ),
        "evidence": [
            {"file": "barcode-generator.html", "pattern": r"window\.JsBarcode\(codeCanvas"},
            {"file": "vendor/jsbarcode.min.js", "pattern": r"."},
        ],
        "page_or_location": "barcode-generator.html",
        "benefit": "Generate real, scannable barcodes for products that don't already have one, ready to print on labels.",
        "marketing_angles": [
            "New product with no barcode yet? Generate a scannable one free, sized for your label printer.",
        ],
        "confidence": "high",
        "is_premium": "no",
        "problem": "A new product with no barcode yet, and no easy way to generate one.",
        "target_audience": "Shop owners adding new products that don't already have a manufacturer barcode.",
        "premium_note": "A separate free tool with no Premium concept at all.",
    },
    {
        "feature_id": "premium-subscription",
        "feature": "Premium Subscription (sign in once, use anywhere)",
        "description": (
            "Signing in with Google grants a free 15-day Premium trial automatically; "
            "Premium unlocks logo upload, receipt numbering, inventory export, the "
            "customer screen, and the offline download, and follows the signed-in "
            "account to any device rather than being tied to one browser."
        ),
        "evidence": [
            {"file": "modules/account.js", "pattern": r"async function redeemCodeNow\(\)"},
            {"file": "supabase/README.md", "pattern": r"."},
        ],
        "page_or_location": "app.html - Settings -> Premium",
        "benefit": "Unlock extra features on a free trial with just a Google sign-in, no card required, and it follows you to any device you sign into.",
        "marketing_angles": [
            "Get 15 days of Premium free - just sign in with Google, no card needed.",
        ],
        "confidence": "high",
        "is_premium": "n/a",
        "problem": "Wanting to try extra features without committing to a paid plan first.",
        "target_audience": "Any GoOnlinePOS user curious about Premium features.",
        "premium_note": "This entry describes the Premium system itself, not a Premium-gated feature.",
    },
]


def verify_feature(probe: dict) -> dict:
    """Check every evidence anchor for one probe against the real GoOnlinePOS
    source tree (read-only). Returns the probe enriched with verification
    results - never mutates GoOnlinePOS files."""
    results = []
    all_ok = True
    for ev in probe["evidence"]:
        target = REPO_ROOT / ev["file"]
        found = False
        if target.exists():
            try:
                text = target.read_text(encoding="utf-8", errors="ignore")
                found = re.search(ev["pattern"], text) is not None
            except OSError:
                found = False
        results.append({"file": ev["file"], "pattern": ev["pattern"], "found": found})
        if not found:
            all_ok = False

    return {
        **{k: v for k, v in probe.items() if k != "evidence"},
        "evidence": results,
        "verified": all_ok,
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> int:
    check_only = "--check" in sys.argv

    verified_features = [verify_feature(p) for p in FEATURE_PROBES]
    drifted = [f for f in verified_features if not f["verified"]]

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_repo": str(REPO_ROOT),
        "note": (
            "Every feature below was hand-inspected in the real GoOnlinePOS "
            "source before being added here, and is re-verified against that "
            "same source every time this script runs. 'verified': false means "
            "an expected anchor no longer matches - the claim needs re-checking "
            "before it's used in marketing content."
        ),
        "feature_count": len(verified_features),
        "verified_count": len(verified_features) - len(drifted),
        "drifted_count": len(drifted),
        "features": verified_features,
    }

    if drifted:
        print(f"WARNING: {len(drifted)} feature(s) failed re-verification against the current source:")
        for f in drifted:
            missing = [e["pattern"] for e in f["evidence"] if not e["found"]]
            print(f"  - {f['feature']} ({f['feature_id']}): missing anchor(s) {missing}")

    if not check_only:
        KNOWLEDGE_FILE.parent.mkdir(parents=True, exist_ok=True)
        KNOWLEDGE_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"Wrote {len(verified_features)} features ({payload['verified_count']} verified, "
              f"{payload['drifted_count']} drifted) to {KNOWLEDGE_FILE.relative_to(AGENT_DIR)}")

    log_event(LOG_FILE, "analyze_product", {
        "mode": "check" if check_only else "write",
        "feature_count": len(verified_features),
        "verified_count": payload["verified_count"],
        "drifted_count": len(drifted),
        "drifted_ids": [f["feature_id"] for f in drifted],
    })

    return 1 if (check_only and drifted) else 0


if __name__ == "__main__":
    raise SystemExit(main())
