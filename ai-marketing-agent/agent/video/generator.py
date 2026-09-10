"""
Video generation interface (Phase 5 - NOT YET IMPLEMENTED).

Planned shape, per the project brief:

    class VideoGenerator:
        def render(self, script: dict, assets: list[Path]) -> Path:
            raise NotImplementedError

    class LocalVideoGenerator(VideoGenerator):
        # Free, local, no paid API: compose text + real GoOnlinePOS
        # screenshots + simple transitions/captions into a vertical 9:16
        # MP4, using Pillow (already available, see requirements.txt) for
        # frame/image composition plus a free, locally-installed ffmpeg
        # binary (NOT bundled - the site owner installs it once, same as
        # any other free open-source tool) to encode frames -> MP4.
        ...

    class FutureAIVideoGenerator(VideoGenerator):
        # Adapter for a real AI video-generation API, added later, only
        # if/when the site owner chooses to pay for one. Not implemented,
        # not required, not assumed.
        ...

    class FutureTemplateVideoGenerator(VideoGenerator):
        # Adapter for a template-based tool (e.g. a Remotion/After
        # Effects-style pipeline), added later if wanted.
        ...

None of these are implemented yet - this file exists to document the
intended interface so Phase 5 slots in without redesigning the rest of
the pipeline around it.
"""


class VideoGenerator:
    """Common interface every video backend will implement."""

    def render(self, script: dict, assets: list) -> str:
        raise NotImplementedError("VideoGenerator subclasses must implement render().")


class LocalVideoGenerator(VideoGenerator):
    def render(self, script: dict, assets: list) -> str:
        raise NotImplementedError(
            "LocalVideoGenerator (free, local Pillow + ffmpeg pipeline) is planned "
            "for Phase 5 and has not been built yet."
        )


class FutureAIVideoGenerator(VideoGenerator):
    def render(self, script: dict, assets: list) -> str:
        raise NotImplementedError(
            "FutureAIVideoGenerator is a placeholder adapter for an optional, "
            "paid AI video API. Not implemented, not required, not connected."
        )


class FutureTemplateVideoGenerator(VideoGenerator):
    def render(self, script: dict, assets: list) -> str:
        raise NotImplementedError(
            "FutureTemplateVideoGenerator is a placeholder adapter for an optional "
            "template-based video tool. Not implemented, not required, not connected."
        )
