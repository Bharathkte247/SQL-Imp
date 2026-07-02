import csv
import io
import json
import unittest
from unittest.mock import patch

from app import (
    _looks_like_csv,
    _parse_json_or_csv_bulk_body,
    _parse_multipart_bulk_body,
    build_bulk_evaluation_csv,
)
from evaluator import (
    RUBRIC,
    evaluate_interaction,
    get_llm_config,
    get_llm_endpoint,
    get_rendered_prompt,
)


class EvaluatorTests(unittest.TestCase):
    def test_rendered_prompt_contains_interaction_transcript_and_rubric(self):
        prompt = get_rendered_prompt("INT-42", "[00:00] Agent: Hello")

        self.assertIn("INT-42", prompt)
        self.assertIn("[00:00] Agent: Hello", prompt)
        self.assertIn("Fails to/misses apology due to error or inconvenience", prompt)

    def test_rendered_prompt_marks_info_and_system_lines_as_non_auditable(self):
        prompt = get_rendered_prompt(
            "INT-SYSTEM",
            "\n".join(
                [
                    "INFO(10:09:23):BJ's virtual assistant: I can help with that.",
                    "System: Transcript started after authentication.",
                    "Sammy(10:09:43):Thank you for contacting BJ's Wholesale Club.",
                    "Visitor(10:10:14):Hi.",
                ]
            ),
        )

        self.assertIn(
            "SYSTEM_CONTEXT_DO_NOT_AUDIT | INFO(10:09:23):",
            prompt,
        )
        self.assertIn("SYSTEM_CONTEXT_DO_NOT_AUDIT | BJ's virtual assistant", prompt)
        self.assertIn("SYSTEM_CONTEXT_DO_NOT_AUDIT | System: Transcript started", prompt)
        self.assertIn("AUDIT_AGENT | Sammy(10:09:43):Thank you", prompt)
        self.assertIn("MEMBER | Visitor(10:10:14):Hi.", prompt)

    @patch.dict("os.environ", {}, clear=True)
    def test_request_llm_config_normalizes_litellm_base_url(self):
        config = get_llm_config(
            {
                "api_key": "test-key",
                "base_url": "https://litellm-stg.cloud.247-inc.net",
                "model": "gpt-41-mini",
                "temperature": "0.2",
            }
        )

        self.assertIsNotNone(config)
        self.assertEqual(
            config.api_url,
            "https://litellm-stg.cloud.247-inc.net/v1/chat/completions",
        )
        self.assertEqual(config.model, "gpt-41-mini")
        self.assertEqual(config.temperature, 0.2)

    @patch.dict("os.environ", {}, clear=True)
    def test_llm_endpoint_can_be_derived_without_api_key(self):
        endpoint = get_llm_endpoint(
            {
                "base_url": "https://litellm-stg.cloud.247-inc.net",
            }
        )

        self.assertEqual(
            endpoint,
            "https://litellm-stg.cloud.247-inc.net/v1/chat/completions",
        )

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_returns_all_rubric_items(self):
        result = evaluate_interaction(
            "INT-LOCAL",
            "[00:00] Agent: Thank you for calling.\n[00:05] Member: Hi.",
        )

        self.assertEqual(result["interaction_id"], "INT-LOCAL")
        self.assertEqual(result["engine"], "local_heuristic")
        self.assertEqual(len(result["attributes"]), len(RUBRIC))
        self.assertTrue(all(item["rating"] in {"Yes", "No"} for item in result["attributes"]))

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_flags_full_card_number_from_agent(self):
        result = evaluate_interaction(
            "INT-CARD",
            "[00:00] Agent: I entered 4111 1111 1111 1111 in the notes.",
        )

        card_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"]
            == "Entered a full credit card number anywhere in the ticket or notes"
        )
        self.assertEqual(card_item["rating"], "Yes")
        self.assertTrue(result["auto_fail"])
        self.assertEqual(result["overall_result"], "Fail")

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_flags_missed_apology_after_frustration(self):
        result = evaluate_interaction(
            "INT-APOLOGY",
            "\n".join(
                [
                    "[00:00] Agent: Thank you for calling BJ's Member Care, this is Taylor.",
                    "[00:05] Member: My order is late and I am really frustrated.",
                    "[00:10] Agent: What is your order number?",
                ]
            ),
        )

        apology_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"] == "Fails to/misses apology due to error or inconvenience"
        )
        self.assertEqual(apology_item["rating"], "Yes")
        self.assertEqual(apology_item["timestamp"], "00:10")

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_flags_excessive_repeated_apologies(self):
        result = evaluate_interaction(
            "INT-EXCESSIVE-APOLOGY",
            "\n".join(
                [
                    "[00:00] Agent: Thank you for calling BJ's Member Care.",
                    "[00:05] Member: My order is late and I am frustrated.",
                    "[00:10] Agent: I am sorry for the delay. I can check the order.",
                    "[00:18] Agent: I apologize again for the delay while I check this.",
                ]
            ),
        )

        apology_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"] == "Uses excessive apologies"
        )
        self.assertEqual(apology_item["rating"], "Yes")
        self.assertEqual(apology_item["timestamp"], "00:18")

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_flags_agent_spacing_and_grammar_issue(self):
        result = evaluate_interaction(
            "INT-GRAMMAR",
            "\n".join(
                [
                    "[00:00] Agent: Thank you for calling BJ's Member Care.",
                    "[00:05] Member: Can you help with my order?",
                    "[00:10] Agent: I can help.You will recieve an update soon.",
                ]
            ),
        )

        grammar_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"] == "Uses slang or inappropriate grammar/spelling"
        )
        self.assertEqual(grammar_item["rating"], "Yes")
        self.assertEqual(grammar_item["timestamp"], "00:10")

    @patch.dict("os.environ", {"QA_LLM_API_KEY": "test-key"}, clear=True)
    @patch("evaluator._evaluate_with_llm")
    def test_llm_result_keeps_local_rule_defects_as_guardrail(self, mock_llm):
        mock_llm.return_value = {
            "interaction_id": "INT-HYBRID",
            "attributes": [
                {
                    "attribute": item["attribute"],
                    "sub_attribute": item["sub_attribute"],
                    "rating": "No",
                    "rationale": "",
                    "timestamp": "",
                    "agent_quote": "",
                    "coaching": "",
                }
                for item in RUBRIC
            ],
            "summary": {"strengths": [], "opportunities": [], "next_steps": []},
        }

        result = evaluate_interaction(
            "INT-HYBRID",
            "\n".join(
                [
                    "[00:00] Agent: Thank you for calling BJ's Member Care.",
                    "[00:05] Member: Can you help with my order?",
                    "[00:10] Agent: I can help.You will recieve an update soon.",
                ]
            ),
        )

        grammar_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"] == "Uses slang or inappropriate grammar/spelling"
        )
        self.assertEqual(result["engine"], "llm_with_local_rules")
        self.assertEqual(grammar_item["rating"], "Yes")
        self.assertEqual(grammar_item["timestamp"], "00:10")
        self.assertIn("Local rules guardrail added", result["summary"]["next_steps"][0])

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_flags_repeated_agent_question(self):
        result = evaluate_interaction(
            "INT-REPEAT",
            "\n".join(
                [
                    "[00:00] Agent: Thank you for calling BJ's Member Care.",
                    "[00:03] Agent: Can you confirm your phone number?",
                    "[00:09] Member: It is 555-0100.",
                    "[00:15] Agent: Can you confirm your phone number?",
                ]
            ),
        )

        repeat_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"] == "Unnecessarily repeats questions or information"
        )
        self.assertEqual(repeat_item["rating"], "Yes")
        self.assertEqual(repeat_item["timestamp"], "00:15")

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_flags_requested_follow_up_not_established(self):
        result = evaluate_interaction(
            "INT-FOLLOW",
            "\n".join(
                [
                    "[00:00] Agent: Thank you for calling BJ's Member Care.",
                    "[00:05] Member: Can someone call me back with an update?",
                    "[00:12] Agent: Is there anything else I can help with today?",
                ]
            ),
        )

        follow_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"] == "Does not establish follow-up when required or member requested"
        )
        self.assertEqual(follow_item["rating"], "Yes")
        self.assertEqual(follow_item["timestamp"], "00:12")

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_flags_hold_over_two_minutes_without_extra_time_request(self):
        result = evaluate_interaction(
            "INT-HOLD",
            "\n".join(
                [
                    "[00:00] Agent: Thank you for calling BJ's Member Care.",
                    "[00:05] Member: Can you check my order?",
                    "[00:10] Agent: Please hold while I review the order.",
                    "[02:31] Agent: The order is still processing.",
                ]
            ),
        )

        concern_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"] == "Fails to or delays in acknowledging member concerns"
        )
        self.assertEqual(concern_item["rating"], "Yes")
        self.assertEqual(concern_item["timestamp"], "00:10")

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_allows_hold_over_two_minutes_with_extra_time_request(self):
        result = evaluate_interaction(
            "INT-HOLD-OK",
            "\n".join(
                [
                    "[00:00] Agent: Thank you for calling BJ's Member Care.",
                    "[00:05] Member: Can you check my order?",
                    "[00:10] Agent: Please hold while I review the order.",
                    "[02:11] Agent: Thank you for holding. I need a little more time to finish reviewing this.",
                ]
            ),
        )

        concern_item = next(
            item
            for item in result["attributes"]
            if item["sub_attribute"] == "Fails to or delays in acknowledging member concerns"
        )
        self.assertEqual(concern_item["rating"], "No")

    @patch.dict("os.environ", {}, clear=True)
    def test_local_heuristic_matches_human_scored_bjs_sample(self):
        transcript = "\n".join(
            [
                "BJ's virtual assistant: Hi! I'm the BJ's Virtual Assistant!",
                "Visitor: Renewal Charge",
                "BJ's virtual assistant: BJ's Easy Renewal automatically renews your membership.",
                "Visitor: I want to cancel my membership fee",
                "BJ's virtual assistant: There are three ways to cancel your membership.",
                "Visitor: Chat with agent now please",
                "BJ's virtual assistant: Ok.",
                "Visitor: Speak to a team member",
                "BJ's virtual assistant: I'm finding a team member who can help.",
                "Sammy(10:09:43):Thank you for contacting BJ's Wholesale Club. My name is Sammy. Could you please confirm your first and last name and membership number?",
                "Visitor-901476009-26298(10:10:14):Christopher Guerra XXXX-XXXX-630",
                "Sammy(10:11:37):Thank you, Christopher.",
                "Sammy(10:11:39):I am sorry to hear that you are looking to cancel your membership.",
                "Sammy(10:12:33):Good morning! May I know the reason for the cancellation?",
                "Visitor-901476009-26298(10:13:53):I'm handicap and am unable to travel the distance, I used my membership once ans it was a hardship to travel to",
                "Sammy(10:15:53):I understand, and I'm sorry for the inconvenience. I will help you cancel your membership and process a refund for the renewal fee.",
                "Visitor-901476009-26298(10:16:37):Thank you",
                "Sammy(10:17:26):You're welcome!",
                "Sammy(10:18:25):I have issued a refund for the renewal charges and your membership will be cancelled. The refund of $64.80 will be credited to the original mode of payment within 2-3 days.",
                "Sammy(10:18:30):Mastercard",
                "Sammy(10:18:48):Here is your refund confirmation#11518278.",
                "Sammy(10:19:25):It was a pleasure chatting with you. Is there anything else I can assist you with?",
                "Sammy(10:19:28):I hope I was able to assist you.",
                "Sammy(10:21:34):Are we still connected?",
                "Sammy(10:23:23):Since I haven't heard from you, I would be closing this chat. Please do not hesitate to reach out to us if you need further assistance.",
                "Sammy(10:23:25):You were so polite and kind. Thank you for contacting BJ's Wholesale Club, please stay on the line to provide a rating of our chat today. Have a nice day and take care.",
            ]
        )

        result = evaluate_interaction("HUMAN-SAMPLE", transcript)
        yes_items = {
            item["sub_attribute"]
            for item in result["attributes"]
            if item["rating"] == "Yes"
        }

        self.assertEqual(
            yes_items,
            {
                "Unnecessarily repeats questions or information",
                "Agent or member misunderstands info/statement",
                "Uses slang or inappropriate grammar/spelling",
                "Fails to understand or acknowledge the contact reason/issue immediately",
            },
        )
        self.assertEqual(result["score"], 86)

    @patch.dict("os.environ", {}, clear=True)
    def test_bulk_evaluation_csv_outputs_rating_and_feedback_columns(self):
        input_buffer = io.StringIO()
        writer = csv.DictWriter(
            input_buffer,
            fieldnames=["Interaction ID", "Transcript"],
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerow(
            {
                "Interaction ID": "BULK-001",
                "Transcript": (
                    "[00:00] Agent: Thank you for calling BJ's Member Care.\n"
                    "[00:05] Member: My order is late and I am frustrated.\n"
                    "[00:10] Agent: What is your order number?"
                ),
            }
        )

        output_csv = build_bulk_evaluation_csv(input_buffer.getvalue())
        rows = list(csv.DictReader(io.StringIO(output_csv)))

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["Interaction ID"], "BULK-001")
        self.assertEqual(len(rows[0]), 1 + len(RUBRIC) * 2)

        rating_column = "1 Fails to/misses apology due to error or inconvenience - Rating"
        self.assertEqual(rows[0][rating_column], "Yes")
        self.assertIn("What is your order number?", rows[0]["Feedback 1"])

    def test_bulk_multipart_parser_reads_uploaded_csv_and_llm_config(self):
        boundary = "----test-boundary"
        csv_text = (
            "Interaction ID,Transcript\n"
            "BULK-002,\"[00:00] Agent: Thank you for calling.\"\n"
        )
        body = (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="csv_file"; filename="input.csv"\r\n'
            "Content-Type: text/csv\r\n\r\n"
            f"{csv_text}\r\n"
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="llm_config"\r\n\r\n'
            '{"api_key":"test-key","base_url":"https://example.test","model":"model"}\r\n'
            f"--{boundary}--\r\n"
        ).encode("utf-8")

        payload = _parse_multipart_bulk_body(
            body,
            f"multipart/form-data; boundary={boundary}",
        )

        self.assertEqual(payload["csv_text"], csv_text)
        self.assertEqual(payload["llm_config"], '{"api_key":"test-key","base_url":"https://example.test","model":"model"}')

    def test_bulk_csv_detection_identifies_header_line(self):
        self.assertTrue(_looks_like_csv("Interaction ID,Transcript\nA,B\n"))
        self.assertFalse(_looks_like_csv('{"csv_text": "missing end quote}'))

    def test_bulk_json_string_is_treated_as_csv_text(self):
        csv_text = "Interaction ID,Transcript\nBULK-003,Hello\n"

        payload = _parse_json_or_csv_bulk_body(json.dumps(csv_text))

        self.assertEqual(payload["csv_text"], csv_text)

    def test_bulk_malformed_json_falls_back_to_csv_validation(self):
        raw_text = '{"not valid json"'

        payload = _parse_json_or_csv_bulk_body(raw_text)

        self.assertEqual(payload["csv_text"], raw_text)


if __name__ == "__main__":
    unittest.main()
