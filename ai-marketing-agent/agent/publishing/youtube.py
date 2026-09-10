"""
YouTubePublisher (Phase 6 - NOT YET IMPLEMENTED, DRY-RUN ONLY by design).

Planned behavior once built: DRY-RUN mode only until the site owner
supplies real YouTube Data API OAuth credentials (via environment
variables - see .env.example - never committed to source) AND gives
explicit approval to enable real publishing (Safety rules 3 and 9).

Even once implemented, calling publish() without OAUTH configured must
print exactly what *would* be uploaded and return without making any
network call - matching the project brief's example:

    DRY RUN:
    Would publish to YouTube:
    Title: ...
    Description: ...
    Video: ...
    Hashtags: ...
"""


class YouTubePublisher:
    def publish(self, video_path: str, title: str, description: str, hashtags: list):
        raise NotImplementedError(
            "YouTubePublisher is planned for Phase 6 and has not been built yet. "
            "It will start in dry-run mode with no credentials required."
        )
