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


if __name__ == "__main__":
    unittest.main()
