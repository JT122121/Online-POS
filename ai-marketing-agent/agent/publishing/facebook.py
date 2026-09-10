"""
FacebookPublisher (Phase 6 - NOT YET IMPLEMENTED, DRY-RUN ONLY by design).

Same rules as agent/publishing/youtube.py's YouTubePublisher - dry-run
only until real Meta Graph API credentials are supplied via environment
variables and the site owner explicitly approves real publishing.

    DRY RUN:
    Would publish to Facebook:
    Caption: ...
    Video: ...
"""


class FacebookPublisher:
    def publish(self, video_path: str, caption: str):
        raise NotImplementedError(
            "FacebookPublisher is planned for Phase 6 and has not been built yet. "
            "It will start in dry-run mode with no credentials required."
        )
