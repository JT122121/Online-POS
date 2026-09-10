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

Commands implemented so far (Phase 1):
    analyze-product     Inspect GoOnlinePOS and (re)build knowledge/features.json
    refresh-features     Alias for analyze-product

Commands planned for later phases (currently print a clear "not yet
implemented" message rather than doing nothing silently or faking output):
    generate-ideas, generate-script, create-video, preview-publish,
    show-analytics, run-agent
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

    for name, phase in [
        ("generate-ideas", "Phase 4"),
        ("generate-script", "Phase 4"),
        ("create-video", "Phase 5"),
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
