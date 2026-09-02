#!/usr/bin/env python3
"""Offline validation for customer_chatlog_extraction.sql (bot_info CTE).

Mirrors ClickHouse:
  arraySort(x -> x.1, groupArray((EventTimeStampEpoch, EventValue1)))
  arrayMap(x -> replaceRegexpAll(x.2, '<[^>]*>', ''), ...)
  concat('info: ', arrayStringConcat(..., ' '))
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

HTML_TAG_PATTERN = re.compile(r"<[^>]*>")
SQL_PATH = Path(__file__).resolve().parents[1] / "customer_chatlog_extraction.sql"


def strip_html(payload: str | None) -> str:
    """Mirror ClickHouse replaceRegexpAll(x.2, '<[^>]*>', '')."""
    if payload is None:
        return ""
    return HTML_TAG_PATTERN.sub("", payload)


def combined_chat_log(events: list[tuple[int, str | None]]) -> str:
    """Mirror bot_info aggregation: sort by epoch, strip HTML, join with spaces."""
    ordered = sorted(events, key=lambda item: item[0])
    cleaned = [strip_html(payload) for _, payload in ordered]
    return "info: " + " ".join(cleaned)


class CustomerChatlogExtractionTests(unittest.TestCase):
    def test_sql_file_exists_and_has_required_pieces(self) -> None:
        sql = SQL_PATH.read_text(encoding="utf-8")
        self.assertIn("bot_info AS (", sql)
        self.assertIn("{{ params.client_schema }}.eg_agentic_runtime_distributed", sql)
        self.assertIn("MESSAGE_RECEIVED", sql)
        self.assertIn("MESSAGE_SENT", sql)
        self.assertIn("EventValue2 = 'customer'", sql)
        self.assertIn("EventValue1", sql)
        self.assertIn("EventTimeStampEpoch", sql)
        self.assertIn("replaceRegexpAll", sql)
        self.assertIn("<[^>]*>", sql)
        self.assertIn("arraySort", sql)
        self.assertIn("groupArray((EventTimeStampEpoch, EventValue1))", sql)
        self.assertIn("combined_chat_log", sql)
        self.assertIn("interaction_id", sql)
        # Superseded entity-extract approach should not remain in the live CTE.
        self.assertNotIn("extractAll", sql.split("/*")[0])
        self.assertNotRegex(sql, r"(?m)^\s*chatlog\b")

    def test_strips_html_tags(self) -> None:
        self.assertEqual(
            strip_html("<p>I need help with my bill</p>"),
            "I need help with my bill",
        )

    def test_keeps_plain_text(self) -> None:
        self.assertEqual(strip_html("Please reset my password"), "Please reset my password")

    def test_orders_by_epoch_before_joining(self) -> None:
        events = [
            (300, "<div>Can you freeze it?</div>"),
            (100, "<div>Hello, I lost my card</div>"),
            (200, "plain follow-up"),
        ]
        self.assertEqual(
            combined_chat_log(events),
            "info: Hello, I lost my card plain follow-up Can you freeze it?",
        )

    def test_none_payload_becomes_empty_segment(self) -> None:
        self.assertEqual(
            combined_chat_log([(1, None), (2, "<b>OK</b>")]),
            "info:  OK",
        )


if __name__ == "__main__":
    unittest.main()
