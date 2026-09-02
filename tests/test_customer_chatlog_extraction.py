#!/usr/bin/env python3
"""Offline validation for user + bot chatlog extraction (bot_info CTE).

Mirrors ClickHouse role mapping on EventValue2 = 'customer':
  user = MESSAGE_RECEIVED
  bot  = MESSAGE_SENT
plus HTML strip via replaceRegexpAll(..., '<[^>]*>', '') and epoch ordering.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

HTML_TAG_PATTERN = re.compile(r"<[^>]*>")
SQL_PATH = Path(__file__).resolve().parents[1] / "customer_chatlog_extraction.sql"


def strip_html(payload: str | None) -> str:
    if payload is None:
        return ""
    return HTML_TAG_PATTERN.sub("", payload)


def split_logs(events: list[tuple[int, str | None, str]]) -> tuple[str, str, str]:
    """Return (combined_chat_log, user_chat_log, bot_chat_log)."""
    ordered = sorted(events, key=lambda item: item[0])
    combined_parts: list[str] = []
    user_parts: list[str] = []
    bot_parts: list[str] = []
    for _epoch, payload, event_name in ordered:
        text = strip_html(payload)
        if event_name == "MESSAGE_RECEIVED":
            combined_parts.append(f"user: {text}")
            user_parts.append(text)
        elif event_name == "MESSAGE_SENT":
            combined_parts.append(f"bot: {text}")
            bot_parts.append(text)
    return (
        " ".join(combined_parts),
        " ".join(user_parts),
        " ".join(bot_parts),
    )


class CustomerChatlogExtractionTests(unittest.TestCase):
    def test_sql_file_exists_and_has_required_pieces(self) -> None:
        sql = SQL_PATH.read_text(encoding="utf-8")
        live = sql.split("/*")[0]
        self.assertIn("bot_info AS (", live)
        self.assertIn("{{ params.client_schema }}.eg_agentic_runtime_distributed", live)
        self.assertIn("MESSAGE_RECEIVED", live)
        self.assertIn("MESSAGE_SENT", live)
        self.assertIn("EventValue2 = 'customer'", live)
        self.assertIn("user_chat_log", live)
        self.assertIn("bot_chat_log", live)
        self.assertIn("combined_chat_log", live)
        self.assertIn("user: ", live)
        self.assertIn("bot: ", live)
        self.assertIn("groupArrayIf", live)
        self.assertIn("replaceRegexpAll", live)
        self.assertIn("EventTimeStampEpoch", live)

    def test_role_split_and_ordering(self) -> None:
        events = [
            (300, "<p>Can you freeze it?</p>", "MESSAGE_RECEIVED"),
            (100, "<p>Hello, I lost my card</p>", "MESSAGE_RECEIVED"),
            (200, "<div>Sorry to hear that. I can help.</div>", "MESSAGE_SENT"),
            (400, "<div>Card frozen.</div>", "MESSAGE_SENT"),
        ]
        combined, user, bot = split_logs(events)
        self.assertEqual(
            combined,
            "user: Hello, I lost my card "
            "bot: Sorry to hear that. I can help. "
            "user: Can you freeze it? "
            "bot: Card frozen.",
        )
        self.assertEqual(user, "Hello, I lost my card Can you freeze it?")
        self.assertEqual(bot, "Sorry to hear that. I can help. Card frozen.")

    def test_strips_html_tags(self) -> None:
        self.assertEqual(strip_html("<p>I need help</p>"), "I need help")

    def test_user_only_conversation(self) -> None:
        combined, user, bot = split_logs(
            [(1, "hi", "MESSAGE_RECEIVED"), (2, "still there?", "MESSAGE_RECEIVED")]
        )
        self.assertEqual(combined, "user: hi user: still there?")
        self.assertEqual(user, "hi still there?")
        self.assertEqual(bot, "")


if __name__ == "__main__":
    unittest.main()
