import unittest
from unittest.mock import patch

from evaluator import RUBRIC, evaluate_interaction, get_rendered_prompt


class EvaluatorTests(unittest.TestCase):
    def test_rendered_prompt_contains_interaction_transcript_and_rubric(self):
        prompt = get_rendered_prompt("INT-42", "[00:00] Agent: Hello")

        self.assertIn("INT-42", prompt)
        self.assertIn("[00:00] Agent: Hello", prompt)
        self.assertIn("Fails to/misses apology due to error or inconvenience", prompt)

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
        self.assertEqual(card_item["rating"], "No")
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
        self.assertEqual(apology_item["rating"], "No")
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
        self.assertEqual(repeat_item["rating"], "No")
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
        self.assertEqual(follow_item["rating"], "No")
        self.assertEqual(follow_item["timestamp"], "00:12")


if __name__ == "__main__":
    unittest.main()
