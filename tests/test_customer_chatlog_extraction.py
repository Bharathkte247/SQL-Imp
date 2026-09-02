#!/usr/bin/env python3
"""Offline validation for customer_chatlog_extraction.sql logic.

Simulates ClickHouse extractAll(payload, '&gt;([^&<>]{2,500})&lt;') plus
arrayFlatten / arrayStringConcat aggregation used in the SQL file.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

EXTRACT_PATTERN = re.compile(r"&gt;([^&<>]{2,500})&lt;")
SQL_PATH = Path(__file__).resolve().parents[1] / "customer_chatlog_extraction.sql"


def extract_snippets(payload: str) -> list[str]:
    """Mirror ClickHouse extractAll(..., '&gt;([^&<>]{2,500})&lt;')."""
    return EXTRACT_PATTERN.findall(payload)


def combined_chat_log(payloads: list[str]) -> str:
    """Mirror concat('info: ', arrayStringConcat(arrayFlatten(groupArray(...)), ' '))."""
    snippets: list[str] = []
    for payload in payloads:
        snippets.extend(extract_snippets(payload))
    return "info: " + " ".join(snippets)


class CustomerChatlogExtractionTests(unittest.TestCase):
    def test_sql_file_exists_and_has_required_pieces(self) -> None:
        sql = SQL_PATH.read_text(encoding="utf-8")
        self.assertIn("ftbank.eg_agentic_runtime_distributed", sql)
        self.assertIn("MESSAGE_RECEIVED", sql)
        self.assertIn("MESSAGE_SENT", sql)
        self.assertIn("EventValue2 = 'customer'", sql)
        self.assertIn("InteractionId IS NULL", sql)
        self.assertIn("EventValue1", sql)
        self.assertIn("&gt;([^&<>]{2,500})&lt;", sql)
        self.assertIn("combined_chat_log", sql)
        self.assertIn("0fe9edda-1c04-4097-9abc-d9741c5f1b10", sql)
        self.assertIn("c7e85ffa-435b-48da-ac74-f86c6882dd85", sql)
        self.assertIn("fa3f2424-7ba4-4cc5-8089-0d92efd00b27", sql)
        # Original draft referenced a non-existent `chatlog` column.
        self.assertNotRegex(sql, r"(?m)^\s*chatlog\b")
        self.assertIn("groupArray", sql)
        self.assertIn("arrayFlatten", sql)

    def test_extracts_text_between_gt_lt_entities(self) -> None:
        payload = "&lt;p&gt;I need help with my bill&lt;/p&gt;"
        self.assertEqual(extract_snippets(payload), ["I need help with my bill"])

    def test_ignores_snippets_shorter_than_two_chars(self) -> None:
        payload = "&lt;b&gt;A&lt;/b&gt;&lt;span&gt;OK&lt;/span&gt;"
        self.assertEqual(extract_snippets(payload), ["OK"])

    def test_aggregates_multiple_messages_in_order(self) -> None:
        payloads = [
            "&lt;div&gt;Hello, I lost my card&lt;/div&gt;",
            "&lt;div&gt;Can you freeze it?&lt;/div&gt;",
            "plain text without entities",
        ]
        self.assertEqual(
            combined_chat_log(payloads),
            "info: Hello, I lost my card Can you freeze it?",
        )

    def test_empty_payloads_yield_info_prefix_only(self) -> None:
        self.assertEqual(combined_chat_log(["", "no markers here"]), "info: ")


if __name__ == "__main__":
    unittest.main()
