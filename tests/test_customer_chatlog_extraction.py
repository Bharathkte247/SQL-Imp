#!/usr/bin/env python3
"""Offline validation for HTML/JSON-stripped single-blob transcript extraction."""

from __future__ import annotations

import json
import re
import unittest
from datetime import datetime, timezone
from pathlib import Path

COMPLETE_TAG = re.compile(r"(?i)<[^>]*>")
LEFTOVER_TAG_NAME = re.compile(r"(?i)</?[A-Za-z][A-Za-z0-9]*")
ORPHAN_ATTR = re.compile(
    r"(?i)\s*(?:class|version|style|id|href|src|type|role|aria-[A-Za-z0-9-]+)\s*=\s*"
    r"""(?:"[^"]*"|'[^']*'|[^\s<>]+)"""
)
JSON_BLOB = re.compile(r"\{[^\n]*\}|\[[^\n]*\]")
JSON_KEY = re.compile(r'(?i)"[A-Za-z_][A-Za-z0-9_]*"\s*:\s*')
MARKUP_PUNCT = re.compile(r'[\{\}\[\]<>"]+')
WS = re.compile(r"\s+")
SQL_PATH = Path(__file__).resolve().parents[1] / "customer_chatlog_extraction.sql"
JSON_TEXT_KEYS = ("text", "message", "content", "body", "value")


def extract_json_text(payload: str) -> str:
    try:
        obj = json.loads(payload)
    except (TypeError, json.JSONDecodeError):
        return payload
    if isinstance(obj, dict):
        for key in JSON_TEXT_KEYS:
            val = obj.get(key)
            if isinstance(val, str) and val.strip():
                return val
    return payload


def clean_text(payload: str | None) -> str:
    if payload is None:
        return ""
    text = extract_json_text(payload)
    text = (
        text.replace("&amp;", "&")
        .replace("&nbsp;", " ")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&quot;", '"')
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )
    text = COMPLETE_TAG.sub("", text)
    text = COMPLETE_TAG.sub("", text)
    text = LEFTOVER_TAG_NAME.sub("", text)
    text = ORPHAN_ATTR.sub("", text)
    text = JSON_BLOB.sub(" ", text)
    text = JSON_KEY.sub(" ", text)
    text = MARKUP_PUNCT.sub(" ", text)
    return WS.sub(" ", text).strip()


def is_usable(text: str) -> bool:
    if not text:
        return False
    if text in {"HAL-E", "Employee Information:"}:
        return False
    if text.startswith("/f "):
        return False
    lowered = text.lower()
    if "card submitted intent:" in lowered or lowered == "intent: hal_e":
        return False
    if re.match(r"(?i)^(div|span|p|br|strong|hxelement|version)(\s|$)", text):
        return False
    return True


def format_ts(epoch: int) -> str:
    if epoch > 1_000_000_000_000:
        epoch = epoch // 1000
    return datetime.fromtimestamp(epoch, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def build_combined_chat_log(events: list[tuple[int, str | None, str]]) -> str:
    rows: list[str] = []
    for epoch, payload, event_name in sorted(events, key=lambda e: e[0]):
        text = clean_text(payload)
        if not is_usable(text):
            continue
        speaker = "User" if event_name == "MESSAGE_RECEIVED" else "Bot"
        rows.append(f"[{format_ts(epoch)}] {speaker}: {text}")
    return "\n".join(rows)


class HtmlJsonStripTests(unittest.TestCase):
    def test_sql_has_html_and_json_strip_steps(self) -> None:
        live = SQL_PATH.read_text(encoding="utf-8").split("/*")[0]
        self.assertIn("isValidJSON", live)
        self.assertIn("JSONExtractString", live)
        self.assertIn("&lt;", live)
        self.assertIn("<[^>]*>", live)
        self.assertIn("</?[A-Za-z][A-Za-z0-9]*", live)
        self.assertIn("combined_chat_log", live)
        self.assertNotIn("user_chat_log", live)

    def test_strips_hxelement_html(self) -> None:
        raw = (
            '<div class="hxelement" version="1.0">'
            "<p style='color:black;'>Welcome to First Tech</p>"
            "</div>"
        )
        self.assertEqual(clean_text(raw), "Welcome to First Tech")
        self.assertNotIn("<", clean_text(raw))
        self.assertNotIn(">", clean_text(raw))

    def test_strips_entity_encoded_html(self) -> None:
        raw = "&lt;p&gt;I'm happy to help&lt;/p&gt;"
        self.assertEqual(clean_text(raw), "I'm happy to help")
        self.assertNotIn("<", clean_text(raw))
        self.assertNotIn("p>", clean_text(raw))

    def test_strips_truncated_html_tags(self) -> None:
        raw = '<div class="hxelement" version="1.0"><ter Welcome back'
        self.assertEqual(clean_text(raw), "Welcome back")
        self.assertNotIn("<", clean_text(raw))

    def test_extracts_json_text_field(self) -> None:
        raw = '{"type":"message","text":"Main Menu","meta":{"id":1}}'
        self.assertEqual(clean_text(raw), "Main Menu")
        self.assertNotIn("type", clean_text(raw))
        self.assertNotIn("{", clean_text(raw))

    def test_strips_inline_json_noise(self) -> None:
        raw = 'Hello {"foo":"bar"} world'
        self.assertEqual(clean_text(raw), "Hello world")

    def test_sample_blob_has_no_html_or_json_markup(self) -> None:
        events = [
            (1_710_000_100, '<div class="hxelement" version="1.0"></div>', "MESSAGE_SENT"),
            (1_710_000_100, "HAL-E", "MESSAGE_SENT"),
            (
                1_710_000_100,
                "<p style='color:black;'>👋 <strong>Welcome</strong> to First Tech</p>",
                "MESSAGE_SENT",
            ),
            (1_710_000_150, "&lt;p&gt;Accounts with accept no transaction&lt;/p&gt;", "MESSAGE_SENT"),
            (1_710_000_200, "Main Menu", "MESSAGE_RECEIVED"),
            (1_710_000_250, '{"text":"Online Banking"}', "MESSAGE_RECEIVED"),
            (
                1_710_000_300,
                "<p>I'm happy to help with your online banking needs.</p>",
                "MESSAGE_SENT",
            ),
            (1_710_000_050, "/f FT_Bank_PCF", "MESSAGE_SENT"),
            (1_710_000_060, "card submitted Intent: HAL_E", "MESSAGE_RECEIVED"),
        ]
        blob = build_combined_chat_log(events)
        self.assertEqual(
            blob,
            "\n".join(
                [
                    "[2024-03-09 16:01:40] Bot: 👋 Welcome to First Tech",
                    "[2024-03-09 16:02:30] Bot: Accounts with accept no transaction",
                    "[2024-03-09 16:03:20] User: Main Menu",
                    "[2024-03-09 16:04:10] User: Online Banking",
                    "[2024-03-09 16:05:00] Bot: I'm happy to help with your online banking needs.",
                ]
            ),
        )
        self.assertNotRegex(blob, r"<[^>\n]*>")
        self.assertNotIn("{", blob)
        self.assertNotIn("}", blob)
        self.assertNotIn("&lt;", blob)
        self.assertNotIn("&gt;", blob)
        self.assertNotIn("hxelement", blob)


if __name__ == "__main__":
    unittest.main()
