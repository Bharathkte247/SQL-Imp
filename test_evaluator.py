import csv
import io
import unittest
from unittest.mock import patch

from app import build_bulk_evaluation_csv
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
                "Fails to understand or acknowledge the call reason/issue immediately",
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


if __name__ == "__main__":
    unittest.main()
