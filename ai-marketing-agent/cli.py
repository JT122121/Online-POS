#!/usr/bin/env python3
"""
GoOnlinePOS AI Marketing Agent - command line interface.

The GoOnlinePOS project itself has no build step, no bundler, and no
package.json (confirmed by inspecting the repo root before writing this -
see ../CLAUDE.md's own "Repo layout" section: "Static site... served
straight from this repo... no build step, no bundler, no package.json").
Rather than bolt an npm/Node.js CLI onto a project that deliberately has
none, this agent uses plain Python 3 (already available in this
environment, zero extra install cost) with argparse - free, local,
stdlib only for the CLI plumbing itself.

Usage:
    python3 cli.py <command> [options]

Commands implemented so far (Phases 1, 4, 5):
    analyze-product     Inspect GoOnlinePOS and (re)build knowledge/features.json
    refresh-features    Alias for analyze-product
    generate-ideas      Turn verified features into video ideas (ideas/*.json)
    generate-script     Expand one idea into a timed shooting script (scripts_output/)
    create-video        Render a free, local vertical MP4 from a script (videos/*.mp4)

Commands planned for later phases (currently print a clear "not yet
implemented" message rather than doing nothing silently or faking output):
    preview-publish, show-analytics, run-agent
"""

import argparse
import subprocess
import sys
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(AGENT_DIR))


def cmd_analyze_product(args) -> int:
    script = AGENT_DIR / "scripts" / "analyze_product.py"
    proc_args = [sys.executable, str(script)]
    if args.check:
        proc_args.append("--check")
    return subprocess.call(proc_args)


def cmd_generate_ideas(args) -> int:
    from agent.idea_generator import generate_ideas
    from agent.product_knowledge import ProductKnowledgeError

    try:
        ideas = generate_ideas(verified_only=not args.include_unverified)
    except ProductKnowledgeError as e:
        print(f"Error: {e}")
        return 1

    print(f"Generated {len(ideas)} idea(s) -> ideas/*.json")
    for idea in ideas:
        flag = " [PREMIUM]" if idea["is_premium"] == "yes" else ""
        print(f"  - {idea['idea_id']}{flag}: {idea['hook']}")
    return 0


def cmd_generate_script(args) -> int:
    import json as json_mod

    from agent.script_generator import generate_script

    idea_path = AGENT_DIR / "ideas" / f"{args.idea_id}.json"
    if not idea_path.exists():
        print(f"No idea found at {idea_path}. Run `generate-ideas` first, or check the idea id (e.g. inventory-management).")
        return 1

    idea = json_mod.loads(idea_path.read_text(encoding="utf-8"))
    generate_script(idea)
    print(f"Wrote scripts_output/{args.idea_id}.txt and scripts_output/{args.idea_id}.json")
    return 0


def cmd_create_video(args) -> int:
    import json as json_mod

    from agent.video.generator import LocalVideoGenerator

    script_path = AGENT_DIR / "scripts_output" / f"{args.idea_id}.json"
    if not script_path.exists():
        print(f"No script found at {script_path}. Run `generate-script {args.idea_id}` first.")
        return 1

    script_doc = json_mod.loads(script_path.read_text(encoding="utf-8"))
    try:
        gen = LocalVideoGenerator()
        output_path = gen.render(script_doc, args.idea_id)
    except RuntimeError as e:
        print(f"Video render failed: {e}")
        return 1

    print(f"Wrote {output_path.relative_to(AGENT_DIR)}")
    return 0


def _not_yet_implemented(name: str, phase: str) -> int:
    print(f"'{name}' is planned for {phase} and has not been built yet.")
    print("Currently available: analyze-product / refresh-features (Phase 1).")
    print("See README.md's Roadmap section for what's planned next.")
    return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="cli.py",
        description="GoOnlinePOS AI Marketing Agent CLI",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("analyze-product", help="Inspect GoOnlinePOS and (re)build the feature knowledge base")
    p.add_argument("--check", action="store_true", help="Verify only; exit 1 if any feature's evidence no longer matches (for CI-style drift checks)")
    p.set_defaults(func=cmd_analyze_product)

    p = sub.add_parser("refresh-features", help="Alias for analyze-product")
    p.add_argument("--check", action="store_true")
    p.set_defaults(func=cmd_analyze_product)

    p = sub.add_parser("generate-ideas", help="Turn verified features into short-form video ideas (ideas/*.json)")
    p.add_argument("--include-unverified", action="store_true", help="Also generate ideas for features whose source evidence currently fails to verify (NOT recommended - for debugging only)")
    p.set_defaults(func=cmd_generate_ideas)

    p = sub.add_parser("generate-script", help="Expand one idea into a full timed shooting script")
    p.add_argument("idea_id", help="Idea id, e.g. inventory-management (see `generate-ideas` output, or ls ideas/)")
    p.set_defaults(func=cmd_generate_script)

    p = sub.add_parser("create-video", help="Render a free, local vertical MP4 from a generated script (scripts_output/*.json)")
    p.add_argument("idea_id", help="Idea id, e.g. inventory-management (must have a script already - run `generate-script` first)")
    p.set_defaults(func=cmd_create_video)

    for name, phase in [
        ("preview-publish", "Phase 6"),
        ("show-analytics", "Phase 7"),
        ("run-agent", "Phase 8"),
    ]:
        p = sub.add_parser(name, help=f"(not yet implemented - {phase})")
        p.set_defaults(func=lambda args, n=name, ph=phase: _not_yet_implemented(n, ph))

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
