#!/usr/bin/env python3
"""Offline validation for human-readable user/bot transcript extraction.

Mirrors cleaning + formatting used in customer_chatlog_extraction.sql:
  - strip HTML tags
  - decode a few entities
  - collapse whitespace
  - drop empty / noise lines
  - format: [YYYY-MM-DD HH:MM:SS] User|Bot: text  (newline-joined)
"""

from __future__ import annotations

import re
import unittest
from datetime import datetime, timezone
from pathlib import Path

HTML_TAG_PATTERN = re.compile(r"<[^>]*>")
WS_PATTERN = re.compile(r"\s+")
SQL_PATH = Path(__file__).resolve().parents[1] / "customer_chatlog_extraction.sql"


def clean_text(payload: str | None) -> str:
    if payload is None:
        return ""
    text = HTML_TAG_PATTERN.sub("", payload)
    text = (
        text.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )
    return WS_PATTERN.sub(" ", text).strip()


def is_usable(text: str) -> bool:
    if not text:
        return False
    if text in {"HAL-E", "Employee Information:"}:
        return False
    if text.startswith("/f "):
        return False
    if "card submitted intent:" in text.lower():
        return False
    return True


def format_ts(epoch: int) -> str:
    if epoch > 1_000_000_000_000:
        epoch = epoch // 1000
    return datetime.fromtimestamp(epoch, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def build_transcript(events: list[tuple[int, str | None, str]]) -> tuple[str, str, str]:
    """events: (epoch, payload, event_name) -> (transcript, user_log, bot_log)."""
    rows: list[tuple[int, str, str]] = []
    for epoch, payload, event_name in sorted(events, key=lambda e: e[0]):
        text = clean_text(payload)
        if not is_usable(text):
            continue
        speaker = "User" if event_name == "MESSAGE_RECEIVED" else "Bot"
        rows.append((epoch, speaker, text))

    transcript = "\n".join(
        f"[{format_ts(epoch)}] {speaker}: {text}" for epoch, speaker, text in rows
    )
    user_log = "\n".join(
        f"[{format_ts(epoch)}] User: {text}"
        for epoch, speaker, text in rows
        if speaker == "User"
    )
    bot_log = "\n".join(
        f"[{format_ts(epoch)}] Bot: {text}"
        for epoch, speaker, text in rows
        if speaker == "Bot"
    )
    return transcript, user_log, bot_log


class HumanReadableTranscriptTests(unittest.TestCase):
    def test_sql_has_human_readable_pieces(self) -> None:
        sql = SQL_PATH.read_text(encoding="utf-8")
        live = sql.split("/*")[0]
        self.assertIn("transcript", live)
        self.assertIn("User", live)
        self.assertIn("Bot", live)
        self.assertIn("formatDateTime", live)
        self.assertIn("'%Y-%m-%d %H:%M:%S'", live)
        self.assertIn("'\\n'", live)
        self.assertIn("replaceRegexpAll(ifNull(EventValue1, ''), '<[^>]*>', '')", live)
        self.assertIn("HAL-E", live)
        self.assertIn("card submitted Intent:", live)

    def test_cleans_hxelement_and_paragraph_html(self) -> None:
        raw = (
            '<div class="hxelement" version="1.0">'
            "<p style='color:black;'>Welcome to First Tech</p>"
            "</div>"
        )
        self.assertEqual(clean_text(raw), "Welcome to First Tech")

    def test_filters_noise_and_empty_divs(self) -> None:
        self.assertFalse(is_usable(clean_text('<div class="hxelement" version="1.0"></div>')))
        self.assertFalse(is_usable("HAL-E"))
        self.assertFalse(is_usable("/f FT_Bank_PCF"))
        self.assertFalse(is_usable("card submitted Intent: HAL_E"))
        self.assertTrue(is_usable("Main Menu"))
        self.assertTrue(is_usable("Online Banking"))

    def test_sample_style_transcript_with_timestamps(self) -> None:
        events = [
            (
                1_710_000_100,
                "<div class=\"hxelement\" version=\"1.0\"></div>",
                "MESSAGE_SENT",
            ),
            (1_710_000_100, "HAL-E", "MESSAGE_SENT"),
            (
                1_710_000_100,
                "<p style='color:black;'>👋 <strong>Welcome</strong> to First Tech</p>",
                "MESSAGE_SENT",
            ),
            (1_710_000_200, "Main Menu", "MESSAGE_RECEIVED"),
            (
                1_710_000_300,
                "<p>I'm happy to help with your online banking needs.</p>",
                "MESSAGE_SENT",
            ),
            (1_710_000_400, "Online Banking", "MESSAGE_RECEIVED"),
            (
                1_710_000_500,
                "<p>I am connecting you with an agent who can assist.</p>",
                "MESSAGE_SENT",
            ),
            (1_710_000_050, "/f FT_Bank_PCF", "MESSAGE_SENT"),
            (1_710_000_060, "card submitted Intent: HAL_E", "MESSAGE_RECEIVED"),
        ]
        transcript, user_log, bot_log = build_transcript(events)
        expected = "\n".join(
            [
                "[2024-03-09 16:01:40] Bot: 👋 Welcome to First Tech",
                "[2024-03-09 16:03:20] User: Main Menu",
                "[2024-03-09 16:05:00] Bot: I'm happy to help with your online banking needs.",
                "[2024-03-09 16:06:40] User: Online Banking",
                "[2024-03-09 16:08:20] Bot: I am connecting you with an agent who can assist.",
            ]
        )
        self.assertEqual(transcript, expected)
        self.assertIn("[2024-03-09 16:03:20] User: Main Menu", user_log)
        self.assertIn(
            "[2024-03-09 16:05:00] Bot: I'm happy to help with your online banking needs.",
            bot_log,
        )
        self.assertNotIn("HAL-E", transcript)
        self.assertNotIn("/f ", transcript)
        self.assertNotIn("card submitted", transcript)


if __name__ == "__main__":
    unittest.main()
