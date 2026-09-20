"""
Script Generator (Phase 4).

Takes one idea (as produced by agent.idea_generator.build_idea /
ideas/<feature_id>.json) and expands it into a full, human-readable,
timed shooting script - the document you'd actually hand to whoever is
recording screen captures and writing captions. Writes to
scripts_output/<idea_id>.txt (plain text, easy to read/print) and
scripts_output/<idea_id>.json (same content, structured, for the video
pipeline to consume in Phase 5).

Purely a formatting/expansion step over data that's already verified in
knowledge/features.json via agent.idea_generator - no new claims are
introduced here.
"""

import json
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_OUTPUT_DIR = AGENT_DIR / "scripts_output"


def render_script_text(idea: dict) -> str:
    lines = []
    lines.append(f"GOONLINEPOS SHORT-FORM VIDEO SCRIPT — {idea['topic']}")
    lines.append("=" * 60)
    lines.append(f"Idea ID:          {idea['idea_id']}")
    lines.append(f"Suggested title:  {idea['suggested_title']}")
    lines.append(f"Target audience:  {idea['target_audience']}")
    lines.append(f"Premium feature:  {idea['is_premium']}")
    lines.append("")
    lines.append("HOOK")
    lines.append(f"  {idea['hook']}")
    lines.append("")
    lines.append("PROBLEM")
    lines.append(f"  {idea['problem']}")
    lines.append("")
    lines.append("SOLUTION")
    lines.append(f"  {idea['solution']}")
    lines.append("")
    lines.append("TIMED SCRIPT")
    for beat in idea["script"]:
        lines.append(f"  [{beat['timing']}] {beat['scene']}")
        lines.append(f"      On screen: {beat['on_screen_text']}")
        lines.append(f"      Voiceover: {beat['voiceover']}")
    lines.append("")
    lines.append("SUGGESTED VISUAL SCENES")
    for i, scene in enumerate(idea["visual_scenes"], 1):
        lines.append(f"  {i}. {scene}")
    lines.append("")
    lines.append("CALL TO ACTION")
    lines.append(f"  {idea['cta']}")
    lines.append("")
    lines.append("CAPTION (for the post itself)")
    lines.append(f"  {idea['caption']}")
    lines.append("")
    lines.append("HASHTAGS")
    lines.append("  " + " ".join(idea["hashtags"]))
    lines.append("")
    lines.append("SOURCE EVIDENCE (why every claim above is real)")
    for ev in idea["evidence"]:
        status = "OK" if ev["found"] else "MISSING - RE-VERIFY BEFORE USING"
        lines.append(f"  [{status}] {ev['file']}: {ev['pattern']}")
    return "\n".join(lines)


def generate_script(idea: dict, write: bool = True) -> dict:
    script_doc = {
        "idea_id": idea["idea_id"],
        "topic": idea["topic"],
        "suggested_title": idea["suggested_title"],
        "beats": idea["script"],
        "visual_scenes": idea["visual_scenes"],
        "cta": idea["cta"],
        "caption": idea["caption"],
        "hashtags": idea["hashtags"],
    }

    if write:
        SCRIPTS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        (SCRIPTS_OUTPUT_DIR / f"{idea['idea_id']}.json").write_text(
            json.dumps(script_doc, indent=2), encoding="utf-8"
        )
        (SCRIPTS_OUTPUT_DIR / f"{idea['idea_id']}.txt").write_text(
            render_script_text(idea), encoding="utf-8"
        )

    return script_doc
