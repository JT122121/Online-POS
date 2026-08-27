#!/usr/bin/env python3
"""
Regenerates offline/app.html and offline/customer.html from the repo's
live app.html / customer.html, for the downloadable offline package.

What it changes (and nothing else):
  1. Points the xlsx.js / @zxing/browser <script src> tags at the vendored
     copies in offline/vendor/ instead of cdnjs/unpkg.
  2. Removes the Google Fonts <link> tags (preconnect + stylesheet). The
     CSS already declares system-font fallbacks (Arial / "Courier New" /
     sans-serif / monospace), so the app still renders correctly — it just
     uses system fonts instead of Space Grotesk/Inter/JetBrains Mono.
  3. Removes the cookie-consent / Google Analytics / AdSense bootstrap
     script in <head> (app.html only) and the cookie-consent banner markup
     at the bottom of <body> — there is nothing to track or advertise in
     an offline install, and the loader scripts would just be dead network
     calls. trackEvent() elsewhere already no-ops safely when `gtag` is
     undefined, so nothing else needs to change.
  4. Removes the now-dead "Cookie Settings" footer link (app.html only) —
     it called into the block removed in step 3.

Run this after editing the real app.html/customer.html to keep the
offline copies in sync:
    python3 offline/build-offline.py
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "offline"

FONT_LINK_BLOCK = re.compile(
    r'\n?<link rel="preconnect" href="https://fonts\.googleapis\.com">\n'
    r'<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>\n'
    r'<link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet">\n?'
)

HEAD_ANALYTICS_SCRIPT = re.compile(r'<script>\n\(function\(\) \{\n  var CONSENT_KEY.*?\n\}\)\(\);\n</script>\n', re.DOTALL)

COOKIE_BANNER_HTML = re.compile(
    r'\n<div id="cookieConsentBanner" class="cookie-consent hidden">.*?\n</div>\n\n</body>',
    re.DOTALL,
)

COOKIE_FOOTER_LINK = re.compile(
    r'\n<span>·</span>\n<a href="#" onclick="openCookieSettings\(\); return false;">Cookie Settings</a>'
)


def transform_app_html(text: str) -> str:
    text, n = FONT_LINK_BLOCK.subn("\n", text)
    assert n == 1, f"expected 1 font link block in app.html, found {n}"

    text, n = HEAD_ANALYTICS_SCRIPT.subn("", text)
    assert n == 1, f"expected 1 analytics head script in app.html, found {n}"

    text, n = COOKIE_BANNER_HTML.subn("\n</body>", text)
    assert n == 1, f"expected 1 cookie banner block in app.html, found {n}"

    text, n = COOKIE_FOOTER_LINK.subn("", text)
    assert n == 1, f"expected 1 cookie settings footer link in app.html, found {n}"

    text = text.replace(
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>',
        '<script src="vendor/xlsx.full.min.js"></script>',
    )
    text = text.replace(
        '<script src="https://unpkg.com/@zxing/browser@0.2.1"></script>',
        '<script src="vendor/zxing-browser.min.js"></script>',
    )
    return text


def transform_customer_html(text: str) -> str:
    text, n = FONT_LINK_BLOCK.subn("\n", text)
    assert n == 1, f"expected 1 font link block in customer.html, found {n}"
    return text


def main():
    app_src = (ROOT / "app.html").read_text(encoding="utf-8")
    customer_src = (ROOT / "customer.html").read_text(encoding="utf-8")

    (OUT / "app.html").write_text(transform_app_html(app_src), encoding="utf-8")
    (OUT / "customer.html").write_text(transform_customer_html(customer_src), encoding="utf-8")
    print("Wrote offline/app.html and offline/customer.html")


if __name__ == "__main__":
    main()
