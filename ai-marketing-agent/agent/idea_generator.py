"""
Content Idea Generator (Phase 4).

Turns each VERIFIED GoOnlinePOS feature (agent.product_knowledge.list_features,
verified_only=True by default) into one short-form video idea. Entirely
template-based - no LLM API call, no paid service - so the free proof of
concept has zero incremental cost per idea generated.

Every field in the generated idea is built from data that was already
hand-verified in Phase 1 (hook/problem/benefit/marketing_angles/is_premium)
or from small, fixed templates around that data - nothing here invents a
new claim about GoOnlinePOS that isn't already in knowledge/features.json.

Safety rule 5 ("never make unsupported marketing claims") is enforced two
ways:
  1. Only features with "verified": true are used by default.
  2. `is_premium` drives the CTA wording - a Premium-gated feature is never
     described as plainly "free"; it's described as "a Premium feature,
     with a free 15-day trial" (the free-trial claim itself is verified -
     see knowledge/features.json's premium-subscription entry).
"""

import json
from pathlib import Path

from .product_knowledge import list_features

AGENT_DIR = Path(__file__).resolve().parent.parent
IDEAS_DIR = AGENT_DIR / "ideas"

# Generic hashtags every idea can carry - all describe the real product
# (a point-of-sale app for small businesses), nothing platform-specific
# or unverifiable.
BASE_HASHTAGS = ["#SmallBusiness", "#POS", "#RetailTech", "#GoOnlinePOS"]

# One extra, feature-flavored hashtag per feature_id - short, generic,
# discovery-oriented tags, not invented product claims.
FEATURE_HASHTAGS = {
    "inventory-management": "#InventoryManagement",
    "product-photos": "#RetailTips",
    "bulk-product-import": "#ExcelToStore",
    "usb-barcode-scanning": "#BarcodeScanner",
    "split-payments": "#SplitPayment",
    "per-sale-discount-and-tax-exempt": "#RetailDiscounts",
    "multi-cashier-support": "#MultiCashier",
    "sales-history-and-end-of-day": "#EndOfDay",
    "sales-export-excel": "#Bookkeeping",
    "customer-facing-display": "#CustomerExperience",
    "full-backup-restore": "#DataBackup",
    "multi-currency": "#GlobalBusiness",
    "six-language-support": "#Multilingual",
    "configurable-paper-size": "#ReceiptPrinting",
    "offline-mode": "#OfflinePOS",
    "free-invoice-generator": "#FreeInvoice",
    "free-barcode-qr-generator": "#BarcodeGenerator",
    "premium-subscription": "#FreeTrial",
}


def _cta_for(feature: dict) -> str:
    """Craft a CTA that's accurate about whether the feature is free,
    partially free, or fully Premium - per feature['is_premium']."""
    is_premium = feature.get("is_premium", "no")
    if is_premium == "yes":
        return "This one's a Premium feature - try GoOnlinePOS free, then start your 15-day Premium trial with just a Google sign-in."
    if is_premium == "partial":
        return f"Try it free at GoOnlinePOS.com - {feature.get('premium_note', '')}".rstrip()
    if feature["feature_id"] in ("free-invoice-generator", "free-barcode-qr-generator"):
        return "Use it free, right now, no signup - linked from GoOnlinePOS.com."
    return "Try GoOnlinePOS free - no signup, no login needed to start."


def _script_for(feature: dict) -> list:
    """A simple timed scene list for a 20-40s vertical video, built
    entirely from already-verified strings (hook/problem/description/
    benefit/cta) - a template arrangement, not new copy."""
    hook = feature["marketing_angles"][0]
    return [
        {"timing": "0-3s", "scene": "HOOK", "on_screen_text": hook, "voiceover": hook},
        {
            "timing": "3-8s",
            "scene": "PROBLEM",
            "on_screen_text": feature["problem"],
            "voiceover": feature["problem"],
        },
        {
            "timing": "8-20s",
            "scene": "SOLUTION (screen recording of the real feature)",
            "on_screen_text": feature["feature"],
            "voiceover": f"Here's how GoOnlinePOS handles it: {feature['description']}",
        },
        {
            "timing": "20-28s",
            "scene": "BENEFIT",
            "on_screen_text": feature["benefit"],
            "voiceover": feature["benefit"],
        },
        {
            "timing": "28-35s",
            "scene": "CTA",
            "on_screen_text": "GoOnlinePOS.com",
            "voiceover": _cta_for(feature),
        },
    ]


def _visual_scenes_for(feature: dict) -> list:
    return [
        f"Screen recording: open {feature['page_or_location']} in a real browser.",
        f"Close-up / zoomed capture of the actual UI described: {feature['description']}",
        "Cut to a simple on-screen text card stating the benefit, over a plain background matching the site's own green/gold palette.",
        "End card: GoOnlinePOS logo + 'GoOnlinePOS.com' + the CTA text.",
    ]


def build_idea(feature: dict) -> dict:
    hook = feature["marketing_angles"][0]
    return {
        "idea_id": feature["feature_id"],
        "source_feature_id": feature["feature_id"],
        "hook": hook,
        "topic": feature["feature"],
        "target_audience": feature["target_audience"],
        "problem": feature["problem"],
        "solution": feature["description"],
        "script": _script_for(feature),
        "cta": _cta_for(feature),
        "visual_scenes": _visual_scenes_for(feature),
        "caption": f"{hook} {feature['benefit']}".strip(),
        "hashtags": BASE_HASHTAGS + [FEATURE_HASHTAGS.get(feature["feature_id"], "")],
        "suggested_title": f"{feature['feature']} in GoOnlinePOS (Free POS for Small Business)",
        "is_premium": feature.get("is_premium", "no"),
        "evidence": feature["evidence"],  # carried through so nothing downstream loses traceability
    }


def generate_ideas(verified_only: bool = True, write: bool = True) -> list:
    features = list_features(verified_only=verified_only)
    ideas = [build_idea(f) for f in features]

    if write:
        IDEAS_DIR.mkdir(parents=True, exist_ok=True)
        for idea in ideas:
            path = IDEAS_DIR / f"{idea['idea_id']}.json"
            path.write_text(json.dumps(idea, indent=2), encoding="utf-8")

    return ideas
