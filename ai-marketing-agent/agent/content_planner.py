"""
Content Planner (Phase 4).

Sequences generated ideas into a simple local queue
(data/content_plan.json) and picks "what's next" - deterministically, not
randomly, and with the decision logged (Safety rule 8).

There is no real performance data yet (Phase 7's analytics module isn't
built), so `select_next_idea()` uses an honest, documented placeholder
heuristic rather than pretending to be data-driven: it prefers a fully
free (is_premium == "no") feature first, since a first video should have
the broadest possible "try this right now, no caveats" CTA, then falls
back to feature_id alphabetical order for determinism. Once Phase 7 exists,
this heuristic should be replaced with one that reads
agent.analytics.load_analytics() and prefers whatever topic/hook is
actually performing best - that hand-off point is intentionally kept
narrow (one function) so the swap is easy later.
"""

import json
from pathlib import Path

from .logger import log_event

AGENT_DIR = Path(__file__).resolve().parent.parent
PLAN_FILE = AGENT_DIR / "data" / "content_plan.json"
LOG_FILE = AGENT_DIR / "data" / "logs" / "agent.log.jsonl"


def plan_content(ideas: list, write: bool = True) -> dict:
    ordered = sorted(ideas, key=lambda i: (i["is_premium"] != "no", i["idea_id"]))
    plan = {
        "queue": [i["idea_id"] for i in ordered],
        "selection_reason": (
            "No real performance data yet (Phase 7 analytics not built). "
            "Ordered free (is_premium=no) features first for the broadest "
            "'try it right now' CTA, then alphabetically by feature_id."
        ),
    }
    if write:
        PLAN_FILE.parent.mkdir(parents=True, exist_ok=True)
        PLAN_FILE.write_text(json.dumps(plan, indent=2), encoding="utf-8")
    return plan


def select_next_idea(ideas: list) -> dict:
    plan = plan_content(ideas, write=True)
    chosen_id = plan["queue"][0]
    chosen = next(i for i in ideas if i["idea_id"] == chosen_id)
    log_event(LOG_FILE, "content_planner_select", {
        "chosen_idea_id": chosen_id,
        "reason": plan["selection_reason"],
        "queue_size": len(plan["queue"]),
    })
    return chosen
