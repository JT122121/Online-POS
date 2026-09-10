"""
Scheduler (Phase 8 - NOT YET IMPLEMENTED).

Planned behavior: the READ -> IDEATE -> SCRIPT -> VIDEO -> DRY-RUN PUBLISH
-> LOG loop described in the project brief's Phase 8, run either on
demand (`run-agent`) or on a schedule (e.g. a cron job calling
`python3 cli.py run-agent`). Never auto-publishes for real - see
agent/publishing/, which only supports dry-run mode until real
credentials and explicit approval are wired in.
"""


def run_agent(*args, **kwargs):
    raise NotImplementedError(
        "The agentic run-agent loop is planned for Phase 8 and has not been built yet. "
        "Currently available: `analyze-product` / `refresh-features` (Phase 1)."
    )
