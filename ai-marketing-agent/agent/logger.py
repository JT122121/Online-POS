"""
Shared append-only JSON-lines logger for the marketing agent.

Every module that makes a decision the site owner might want to audit later
(what was verified, what idea was generated, what a publisher *would have*
published in dry-run mode, ...) should call log_event() rather than just
printing to stdout. This satisfies Safety rule 8 ("Log important agent
decisions") without introducing a database - one JSON object per line,
appended to a plain text file.
"""

import json
from datetime import datetime, timezone
from pathlib import Path


def log_event(log_file: Path, event_type: str, data: dict) -> None:
    log_file.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event_type,
        **data,
    }
    with log_file.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")


def read_events(log_file: Path) -> list:
    if not log_file.exists():
        return []
    events = []
    with log_file.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                events.append(json.loads(line))
    return events
