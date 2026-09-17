"""Logic checks for Chat + AIVA digital interaction union.

Mirrors the ClickHouse query in sql/chat_and_aiva_interactions.sql without
requiring a live ClickHouse instance.
"""

from __future__ import annotations

import unittest
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Optional


ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = ROOT / "sql" / "chat_and_aiva_interactions.sql"


@dataclass(frozen=True)
class Row:
    row_id: str
    session_start_time: datetime
    chat_interaction_id: Optional[str]
    aiva_interaction_id: Optional[str]


def in_window(ts: datetime, start: date, end: date) -> bool:
    d = ts.date()
    return start <= d <= end


def chat_and_aiva(rows: list[Row], start: date, end: date) -> list[Row]:
    """Python equivalent of the optimized SQL semantics."""
    period = [r for r in rows if in_window(r.session_start_time, start, end)]
    chat = [r for r in period if r.chat_interaction_id is not None]
    chat_linked_aiva = {
        r.aiva_interaction_id
        for r in chat
        if r.aiva_interaction_id is not None
    }
    aiva_only = [
        r
        for r in period
        if r.aiva_interaction_id is not None
        and r.aiva_interaction_id not in chat_linked_aiva
    ]
    return chat + aiva_only


AUG_START = date(2026, 8, 1)
AUG_END = date(2026, 8, 31)


FIXTURE: list[Row] = [
    # Chat-only
    Row("c1", datetime(2026, 8, 5, 10, 0), "chat-1", None),
    # Chat + linked AIVA (should appear once via chat; aiva id excluded from aiva_only)
    Row("c2", datetime(2026, 8, 10, 11, 0), "chat-2", "aiva-shared"),
    # Standalone AIVA (included)
    Row("a1", datetime(2026, 8, 12, 9, 0), None, "aiva-solo"),
    # Standalone AIVA that shares id with chat row (excluded from aiva_only)
    Row("a2", datetime(2026, 8, 15, 9, 0), None, "aiva-shared"),
    # Neither id (excluded — matches NULL NOT IN / aiva IS NOT NULL filter)
    Row("n1", datetime(2026, 8, 20, 9, 0), None, None),
    # Outside date window (excluded)
    Row("o1", datetime(2026, 7, 31, 9, 0), "chat-old", "aiva-old"),
    Row("o2", datetime(2026, 9, 1, 9, 0), None, "aiva-sep"),
]


class TestChatAndAivaInteractions(unittest.TestCase):
    def test_sql_file_exists_and_has_core_pieces(self) -> None:
        text = SQL_PATH.read_text(encoding="utf-8")
        self.assertIn("ftbank.digital_interaction_view", text)
        self.assertIn("LEFT ANTI JOIN", text)
        self.assertIn("UNION ALL", text)
        self.assertIn("chat_interaction_id IS NOT NULL", text)
        self.assertIn("aiva_interaction_id IS NOT NULL", text)
        self.assertIn("bounds AS", text)
        self.assertIn("period AS", text)

    def test_result_ids(self) -> None:
        result = chat_and_aiva(FIXTURE, AUG_START, AUG_END)
        ids = [r.row_id for r in result]
        self.assertEqual(ids, ["c1", "c2", "a1"])

    def test_no_duplicate_shared_aiva(self) -> None:
        result = chat_and_aiva(FIXTURE, AUG_START, AUG_END)
        aiva_ids = [r.aiva_interaction_id for r in result if r.aiva_interaction_id]
        self.assertEqual(aiva_ids.count("aiva-shared"), 1)
        self.assertIn("aiva-solo", aiva_ids)

    def test_excludes_outside_window_and_neither(self) -> None:
        result = chat_and_aiva(FIXTURE, AUG_START, AUG_END)
        ids = {r.row_id for r in result}
        self.assertNotIn("n1", ids)
        self.assertNotIn("o1", ids)
        self.assertNotIn("o2", ids)
        self.assertNotIn("a2", ids)

    def test_empty_input(self) -> None:
        self.assertEqual(chat_and_aiva([], AUG_START, AUG_END), [])


if __name__ == "__main__":
    unittest.main()
