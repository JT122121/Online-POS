"""
Video generation (Phase 5).

Free, local pipeline: Pillow composes each script "beat" into a branded
1080x1920 (vertical 9:16) PNG frame, then a locally installed ffmpeg binary
(free, open-source - see requirements.txt/README.md) concatenates the
frames into an MP4, each held on screen for the beat's own script duration.
No paid API, no network call.

Colors/fonts are pulled from GoOnlinePOS's own real, verified design
tokens (app.html's :root CSS custom properties - --ink/--accent/--gold),
not invented, so the video actually looks like it belongs to the product
it's marketing:
    --ink:         #16211d
    --accent:      #1b6e4c
    --accent-dark: #124f36
    --gold:        #d9a441

Where a real GoOnlinePOS screenshot exists (the guide-*.png files already
in the repo root, taken from the real running app), the SOLUTION beat
composites it in instead of plain text - actual product UI, not a mockup.

    class VideoGenerator:                      common interface
    class LocalVideoGenerator(VideoGenerator):  THIS - free, local, implemented
    class FutureAIVideoGenerator(VideoGenerator):     placeholder, paid, not connected
    class FutureTemplateVideoGenerator(VideoGenerator): placeholder, not connected
"""

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

AGENT_DIR = Path(__file__).resolve().parent.parent.parent  # ai-marketing-agent/
REPO_ROOT = AGENT_DIR.parent  # GoOnlinePOS repo root - READ ONLY, screenshots only
VIDEOS_DIR = AGENT_DIR / "videos"

WIDTH, HEIGHT = 1080, 1920
FPS = 30

COLOR_INK = (22, 33, 29)
COLOR_ACCENT = (27, 110, 76)
COLOR_ACCENT_DARK = (18, 79, 54)
COLOR_GOLD = (217, 164, 65)
COLOR_WHITE = (255, 255, 255)

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
FONT_BOLD = FONT_DIR / "DejaVuSans-Bold.ttf"
FONT_REGULAR = FONT_DIR / "DejaVuSans.ttf"

# Which real GoOnlinePOS screenshot (already in the repo root) best
# illustrates each feature's SOLUTION beat, where one exists. Verified by
# hand against the actual guide-*.png filenames present in the repo -
# not every feature has a matching screenshot (some postdate the
# screenshot set), and that's fine: those fall back to a text-only card.
FEATURE_SCREENSHOTS = {
    "inventory-management": "guide-inventory.png",
    "bulk-product-import": "guide-products.png",
    "product-photos": "guide-catalog.png",
    "multi-cashier-support": "guide-cashiers.png",
    "sales-history-and-end-of-day": "guide-salesHistory.png",
    "customer-facing-display": "guide-customerscreen-panel.png",
    "full-backup-restore": "guide-backup.png",
    "multi-currency": "guide-currency.png",
    "six-language-support": "guide-language.png",
    "configurable-paper-size": "guide-paper.png",
    "offline-mode": "guide-offline.png",
    "premium-subscription": "guide-premium.png",
}


class VideoGenerator:
    """Common interface every video backend implements."""

    def render(self, script_doc: dict, idea_id: str) -> Path:
        raise NotImplementedError("VideoGenerator subclasses must implement render().")


def _font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(str(path), size)


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list:
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = (current + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _draw_centered_text(img: Image.Image, text: str, font: ImageFont.FreeTypeFont,
                         color, y_center: int, max_width: int) -> None:
    draw = ImageDraw.Draw(img)
    lines = _wrap_text(draw, text, font, max_width)
    line_height = int(font.size * 1.3)
    total_height = line_height * len(lines)
    y = y_center - total_height // 2
    for line in lines:
        w = draw.textlength(line, font=font)
        x = (img.width - w) / 2
        draw.text((x, y), line, font=font, fill=color)
        y += line_height


def _draw_label(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont,
                 color, x: int, y: int, max_width: int) -> int:
    """Left-aligned, wrapped label (scene names like 'SOLUTION (screen
    recording of the real feature)' are too long for one line at this
    font size - unlike the centered body text, this was previously drawn
    with a single unwrapped draw.text() call and silently ran off the
    right edge of the frame). Returns the y just below the last line."""
    lines = _wrap_text(draw, text, font, max_width)
    line_height = int(font.size * 1.15)
    for line in lines:
        draw.text((x, y), line, font=font, fill=color)
        y += line_height
    return y


def _text_card_frame(scene_label: str, on_screen_text: str) -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), COLOR_INK)
    draw = ImageDraw.Draw(img)

    # A small gold accent bar + scene label near the top, matching the
    # site's own gold accent usage (badges/highlights in app.html/index.html)
    draw.rectangle([(0, 0), (WIDTH, 14)], fill=COLOR_GOLD)
    label_font = _font(40, bold=True)
    _draw_label(draw, scene_label.upper(), label_font, COLOR_GOLD, 60, 80, WIDTH - 120)

    body_font = _font(72, bold=True)
    _draw_centered_text(img, on_screen_text, body_font, COLOR_WHITE, HEIGHT // 2, WIDTH - 140)

    footer_font = _font(36, bold=False)
    draw.text((60, HEIGHT - 100), "GoOnlinePOS.com", font=footer_font, fill=(180, 190, 185))
    return img


def _screenshot_frame(scene_label: str, on_screen_text: str, screenshot_path: Path) -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), COLOR_INK)
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, 0), (WIDTH, 14)], fill=COLOR_GOLD)
    label_font = _font(36, bold=True)
    label_bottom = _draw_label(draw, scene_label.upper(), label_font, COLOR_GOLD, 50, 60, WIDTH - 100)

    # Fit the real screenshot into the top ~68% of the frame, preserving
    # aspect ratio (letterboxed on the brand background, never stretched).
    shot = Image.open(screenshot_path).convert("RGB")
    max_w, max_h = WIDTH - 80, int(HEIGHT * 0.62)
    scale = min(max_w / shot.width, max_h / shot.height)
    shot = shot.resize((int(shot.width * scale), int(shot.height * scale)))
    shot_x = (WIDTH - shot.width) // 2
    shot_y = max(150, label_bottom + 20)
    # thin white frame around the screenshot for a "real screen" look
    draw.rectangle(
        [(shot_x - 6, shot_y - 6), (shot_x + shot.width + 6, shot_y + shot.height + 6)],
        outline=COLOR_WHITE, width=4,
    )
    img.paste(shot, (shot_x, shot_y))

    caption_font = _font(48, bold=True)
    _draw_centered_text(img, on_screen_text, caption_font, COLOR_WHITE,
                         shot_y + shot.height + 160, WIDTH - 120)

    footer_font = _font(32, bold=False)
    draw.text((50, HEIGHT - 80), "GoOnlinePOS.com - the real product, no mockups", font=footer_font, fill=(180, 190, 185))
    return img


def _parse_duration_seconds(timing: str) -> float:
    """'8-20s' -> 12.0 seconds."""
    start_str, end_str = timing.replace("s", "").split("-")
    return float(end_str) - float(start_str)


class LocalVideoGenerator(VideoGenerator):
    def __init__(self, ffmpeg_bin: str = "ffmpeg"):
        self.ffmpeg_bin = ffmpeg_bin
        if shutil.which(self.ffmpeg_bin) is None:
            raise RuntimeError(
                f"'{self.ffmpeg_bin}' was not found on PATH. Install the free, open-source "
                f"ffmpeg package (e.g. `apt install ffmpeg` / `brew install ffmpeg`) and try again. "
                f"This is a one-time, no-cost system install - not a paid API."
            )

    def render(self, script_doc: dict, idea_id: str) -> Path:
        VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
        screenshot_name = FEATURE_SCREENSHOTS.get(idea_id)
        screenshot_path = REPO_ROOT / screenshot_name if screenshot_name else None
        if screenshot_path and not screenshot_path.exists():
            screenshot_path = None

        with tempfile.TemporaryDirectory(prefix="goonlinepos_video_") as tmp:
            tmp_dir = Path(tmp)
            concat_lines = []

            for i, beat in enumerate(script_doc["beats"]):
                duration = max(0.5, _parse_duration_seconds(beat["timing"]))
                is_solution_beat = "SOLUTION" in beat["scene"].upper()
                if is_solution_beat and screenshot_path:
                    frame = _screenshot_frame(beat["scene"], beat["on_screen_text"], screenshot_path)
                else:
                    frame = _text_card_frame(beat["scene"], beat["on_screen_text"])

                frame_path = tmp_dir / f"frame_{i:02d}.png"
                frame.save(frame_path)
                concat_lines.append(f"file '{frame_path.name}'")
                concat_lines.append(f"duration {duration}")

            # ffmpeg's concat demuxer requires the final file repeated once
            # more without a duration line, or the last frame's duration is
            # silently dropped.
            concat_lines.append(f"file '{tmp_dir}/frame_{len(script_doc['beats']) - 1:02d}.png'".replace(f"'{tmp_dir}/", "'"))

            concat_file = tmp_dir / "concat.txt"
            concat_file.write_text("\n".join(concat_lines), encoding="utf-8")

            output_path = VIDEOS_DIR / f"{idea_id}.mp4"
            cmd = [
                self.ffmpeg_bin, "-y",
                "-f", "concat", "-safe", "0", "-i", str(concat_file),
                "-vf", f"fps={FPS},format=yuv420p",
                "-pix_fmt", "yuv420p",
                str(output_path),
            ]
            result = subprocess.run(cmd, cwd=tmp_dir, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(f"ffmpeg failed (exit {result.returncode}):\n{result.stderr[-2000:]}")

        return output_path


class FutureAIVideoGenerator(VideoGenerator):
    def render(self, script_doc: dict, idea_id: str) -> Path:
        raise NotImplementedError(
            "FutureAIVideoGenerator is a placeholder adapter for an optional, "
            "paid AI video API. Not implemented, not required, not connected."
        )


class FutureTemplateVideoGenerator(VideoGenerator):
    def render(self, script_doc: dict, idea_id: str) -> Path:
        raise NotImplementedError(
            "FutureTemplateVideoGenerator is a placeholder adapter for an optional "
            "template-based video tool. Not implemented, not required, not connected."
        )
