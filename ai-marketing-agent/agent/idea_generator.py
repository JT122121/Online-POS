"""
Content Idea Generator (Phase 4 - NOT YET IMPLEMENTED).

Planned behavior: read agent/product_knowledge.py's verified feature list
and produce short-form video idea objects - hook, topic, target audience,
problem, solution, 20-60s script, CTA, suggested visual scenes, caption,
hashtags, suggested title - using ONLY verified=True features, never an
invented capability. Output will be written to ideas/*.json.

Left as a stub until Phase 1 (product knowledge) has been reviewed, per
the project's own "work incrementally, phase by phase" instruction.
"""

from .product_knowledge import list_features  # noqa: F401  (will be used once implemented)


def generate_ideas(*args, **kwargs):
    raise NotImplementedError(
        "Content Idea Generator is planned for Phase 4 and has not been built yet. "
        "Run `python3 cli.py analyze-product` (Phase 1) first; idea generation comes next."
    )
