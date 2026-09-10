"""
Product Knowledge module (Phase 1 / Phase 3 component).

Loads the verified GoOnlinePOS feature inventory from
knowledge/features.json so the rest of the agent (idea generator, script
generator, ...) never has to re-read or re-parse GoOnlinePOS source files
directly - it only reads this already-verified JSON.

To refresh this file after GoOnlinePOS source changes, run:
    python3 scripts/analyze_product.py
(or `python3 cli.py refresh-features`)
"""

import json
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_FILE = AGENT_DIR / "knowledge" / "features.json"


class ProductKnowledgeError(Exception):
    pass


def load_knowledge(path: Path = KNOWLEDGE_FILE) -> dict:
    if not path.exists():
        raise ProductKnowledgeError(
            f"{path} does not exist yet. Run `python3 cli.py analyze-product` first."
        )
    return json.loads(path.read_text(encoding="utf-8"))


def list_features(verified_only: bool = True, path: Path = KNOWLEDGE_FILE) -> list:
    """Return the feature list, optionally restricted to features whose
    source-code evidence still verifies against the live GoOnlinePOS repo.
    Marketing content should always be generated from verified_only=True."""
    data = load_knowledge(path)
    features = data["features"]
    if verified_only:
        features = [f for f in features if f.get("verified")]
    return features


def get_feature(feature_id: str, path: Path = KNOWLEDGE_FILE) -> dict:
    for f in list_features(verified_only=False, path=path):
        if f["feature_id"] == feature_id:
            return f
    raise ProductKnowledgeError(f"No feature with id '{feature_id}' in {path}")
