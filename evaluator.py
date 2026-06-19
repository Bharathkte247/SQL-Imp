"""QA monitoring evaluator service helpers.

The production path calls an OpenAI-compatible chat completions API with the
rubric prompt in ``prompts/qa_monitoring_prompt.md``. A conservative local
heuristic fallback keeps the web app usable when an API key is not configured.
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROMPT_PATH = Path(__file__).parent / "prompts" / "qa_monitoring_prompt.md"


RUBRIC: list[dict[str, str]] = [
    {
        "attribute": "Soft Skills",
        "sub_attribute": "Fails to/misses apology due to error or inconvenience",
        "definition": (
            "The agent does not acknowledge or apologize when the member expresses "
            "dissatisfaction, when the company has made an error, or when any "
            "situation arises that reasonably warrants an apology."
        ),
    },
    {
        "attribute": "Soft Skills",
        "sub_attribute": "Uses excessive apologies",
        "definition": (
            "The agent provides repeated or unnecessary apologies that do not add "
            "value to the interaction and may come across as insincere or redundant."
        ),
    },
    {
        "attribute": "Soft Skills",
        "sub_attribute": "Misses or uses inappropriate empathy or rapport",
        "definition": (
            "The agent fails to demonstrate appropriate empathy or rapport when the "
            "situation calls for it, or uses empathy statements that feel forced, "
            "irrelevant, or insincere. Agents should respond naturally to cues rather "
            "than fishing for opportunities."
        ),
    },
    {
        "attribute": "Soft Skills",
        "sub_attribute": "Fails to state desire to assist and follow through",
        "definition": (
            "The agent does not clearly express willingness to help or fails to follow "
            "through on assistance. This includes statements that show inability or "
            "lack of knowledge, such as 'I can't help you,' 'That's not my job,' or "
            "'I don't know what we can do.'"
        ),
    },
    {
        "attribute": "Soft Skills",
        "sub_attribute": "Fails to use effective hostility diffusion skills",
        "definition": (
            "The agent makes little or no effort to calm or diffuse member anger or "
            "frustration, or uses ineffective techniques that escalate the situation "
            "instead of resolving it."
        ),
    },
    {
        "attribute": "Communication Skills",
        "sub_attribute": "Unnecessarily repeats questions or information",
        "definition": (
            "The agent repeats questions or information without purpose, often using "
            "repetitive phrases or questions as placeholders instead of progressing "
            "the conversation."
        ),
    },
    {
        "attribute": "Communication Skills",
        "sub_attribute": "Does not appropriately utilize hold",
        "definition": (
            "The agent misuses the hold function or fails to manage silence "
            "effectively. This includes using mute or mumbling while working to avoid "
            "silence, placing the member on hold unnecessarily or without explanation, "
            "allowing more than 6 seconds of silence (dead air), or failing to check "
            "in with the member every 2 minutes during a hold."
        ),
    },
    {
        "attribute": "Communication Skills",
        "sub_attribute": "Courtesy: Interrupts or talks over the member",
        "definition": (
            "The agent does not allow the member to finish speaking, interrupts "
            "mid-sentence, or talks over the member's explanation."
        ),
    },
    {
        "attribute": "Communication Skills",
        "sub_attribute": "Courtesy: Argues with the member",
        "definition": (
            "The agent disagrees with or contradicts the member in an argumentative "
            "or hostile manner, rather than handling the situation professionally."
        ),
    },
    {
        "attribute": "Communication Skills",
        "sub_attribute": "Courtesy: Ignores a member request",
        "definition": (
            "The agent fails to acknowledge or respond to a direct question or request "
            "from the member. This includes continuing to talk when the member tries "
            "to interject or ignoring their input."
        ),
    },
    {
        "attribute": "Call Handling Basics",
        "sub_attribute": (
            "Uses incorrect/excessive authentication and/or incorrect call greeting/ending"
        ),
        "definition": (
            "The agent fails to follow authentication and greeting/ending protocols "
            "accurately. Authentication: apply the 1/3 rule correctly. If member "
            "account info comes through IVR, only 1 additional piece of information is "
            "needed. If no info is provided, 3 pieces of information are required. "
            "Greeting/ending: incorrect or missing greeting, closing, or failure to "
            "offer the survey at the end of the call."
        ),
    },
    {
        "attribute": "Call Handling Basics",
        "sub_attribute": "Fails to understand or acknowledge the call reason/issue immediately",
        "definition": (
            "The agent does not demonstrate understanding of the member's reason for "
            "calling or fails to use reassuring statements to confirm comprehension."
        ),
    },
    {
        "attribute": "Call Handling Basics",
        "sub_attribute": "Fails to or delays in acknowledging member concerns",
        "definition": (
            "The agent does not promptly recognize or respond to concerns expressed "
            "during the call, leading to member frustration."
        ),
    },
    {
        "attribute": "Call Handling Basics",
        "sub_attribute": "Provides inaccurate or incomplete information to member",
        "definition": (
            "The agent gives flawed, misleading, or incomplete information, even if "
            "corrected later in the call."
        ),
    },
    {
        "attribute": "Call Handling Basics",
        "sub_attribute": "Fails to comply with BJ's terminology guidelines",
        "definition": "The agent uses incorrect terminology that does not align with BJ's standards.",
    },
    {
        "attribute": "Call Handling Basics",
        "sub_attribute": "Fails to use KB when appropriate",
        "definition": (
            "The agent does not utilize the Knowledge Base when required, resulting "
            "in delays or incorrect handling. Applies if search takes longer than 1 "
            "minute or agent contacts help desk without reviewing KB first."
        ),
    },
    {
        "attribute": "Call Handling Basics",
        "sub_attribute": "Fails to resolve the issue and/or follow the process to closure",
        "definition": (
            "The agent does not resolve the issue when it could have been resolved "
            "during the call or fails to follow the correct process. Mark No when the "
            "caller will need to call back unnecessarily or the issue is referred "
            "unnecessarily."
        ),
    },
    {
        "attribute": "Completing the Call",
        "sub_attribute": "Does not set, or sets unrealistic, expectations",
        "definition": (
            "The agent fails to set proper expectations, provides incorrect timing for "
            "actions, or promises actions that will not be taken."
        ),
    },
    {
        "attribute": "Completing the Call",
        "sub_attribute": "Offers follow-up without member request",
        "definition": (
            "The agent proactively offers follow-up without the member requesting it, "
            "instead of allowing the member to drive the request. Standard follow-up "
            "cadence: every 3 business days."
        ),
    },
    {
        "attribute": "Completing the Call",
        "sub_attribute": "Does not establish follow-up when required or member requested",
        "definition": (
            "The agent ignores a member's request for follow-up or fails to set it "
            "when required. Do not double dip with Communication Skills > Courtesy: "
            "Ignores a member request."
        ),
    },
    {
        "attribute": "Completing the Call",
        "sub_attribute": "Excessive/repetitive documentation",
        "definition": (
            "The agent creates redundant or unnecessary documentation in Zendesk or "
            "during email/chat interactions."
        ),
    },
    {
        "attribute": "Completing the Call",
        "sub_attribute": "Inaccurate documentation",
        "definition": (
            "The agent provides incorrect or incomplete information in post-call "
            "documentation, which can lead to confusion or errors in follow-up."
        ),
    },
    {
        "attribute": "Professional Conduct (Auto Fail)",
        "sub_attribute": "Uses profanity",
        "definition": "The agent uses offensive, vulgar, or inappropriate language during the interaction.",
    },
    {
        "attribute": "Professional Conduct (Auto Fail)",
        "sub_attribute": "PII failure",
        "definition": (
            "The agent mishandles Personally Identifiable Information, such as "
            "sharing, storing, or exposing sensitive data inappropriately."
        ),
    },
    {
        "attribute": "Professional Conduct (Auto Fail)",
        "sub_attribute": "Purposely disconnects with member prematurely (Chat only)",
        "definition": (
            "The agent intentionally disconnects the chat without proper closure or "
            "without the member's consent."
        ),
    },
    {
        "attribute": "Professional Conduct (Auto Fail)",
        "sub_attribute": "Any fraud related to the member or call",
        "definition": (
            "Any fraudulent activity by the agent involving the member's account, "
            "payment details, or call handling."
        ),
    },
    {
        "attribute": "Professional Conduct (Auto Fail)",
        "sub_attribute": "Uses unauthorized tools",
        "definition": (
            "The agent uses tools, applications, or systems that are not approved by "
            "BJ's for handling member information or completing tasks."
        ),
    },
    {
        "attribute": "Professional Conduct (Auto Fail)",
        "sub_attribute": "Entered a full credit card number anywhere in the ticket or notes",
        "definition": (
            "The agent records a full credit card number in any part of the ticket, "
            "notes, or documentation, violating PCI compliance standards."
        ),
    },
]


@dataclass(frozen=True)
class LlmConfig:
    api_key: str
    api_url: str
    model: str
    timeout_seconds: int


def get_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def get_rendered_prompt(interaction_id: str, transcript: str) -> str:
    rubric_json = json.dumps(RUBRIC, indent=2)
    return (
        get_prompt_template()
        .replace("{{RUBRIC_JSON}}", rubric_json)
        .replace("{{INTERACTION_ID}}", interaction_id)
        .replace("{{TRANSCRIPT}}", transcript)
    )


def get_llm_config() -> LlmConfig | None:
    api_key = os.getenv("QA_LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    timeout_raw = os.getenv("QA_LLM_TIMEOUT_SECONDS", "60")
    try:
        timeout_seconds = max(10, int(timeout_raw))
    except ValueError:
        timeout_seconds = 60

    return LlmConfig(
        api_key=api_key,
        api_url=os.getenv("QA_LLM_API_URL", "https://api.openai.com/v1/chat/completions"),
        model=os.getenv("QA_LLM_MODEL", "gpt-4o-mini"),
        timeout_seconds=timeout_seconds,
    )


def evaluate_interaction(interaction_id: str, transcript: str) -> dict[str, Any]:
    """Evaluate a transcript and return the normalized QA result."""
    config = get_llm_config()
    if config:
        result = _evaluate_with_llm(config, interaction_id, transcript)
        return _normalize_result(result, interaction_id, engine="llm")

    result = _evaluate_with_local_heuristics(interaction_id, transcript)
    return _normalize_result(result, interaction_id, engine="local_heuristic")


def _evaluate_with_llm(config: LlmConfig, interaction_id: str, transcript: str) -> dict[str, Any]:
    prompt = get_rendered_prompt(interaction_id, transcript)
    payload = {
        "model": config.model,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a meticulous quality analyst for BJ's member support. "
                    "Return only valid JSON that matches the requested schema."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    }
    request = urllib.request.Request(
        config.api_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=config.timeout_seconds) as response:
            raw_response = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LLM provider returned HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Unable to reach LLM provider: {exc.reason}") from exc

    response_payload = json.loads(raw_response)
    try:
        content = response_payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("LLM response did not include choices[0].message.content") from exc

    return _parse_json_object(content)


def _parse_json_object(content: str) -> dict[str, Any]:
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, flags=re.DOTALL)
        if not match:
            raise
        parsed = json.loads(match.group(0))

    if not isinstance(parsed, dict):
        raise ValueError("Expected LLM output to be a JSON object")
    return parsed


def _evaluate_with_local_heuristics(interaction_id: str, transcript: str) -> dict[str, Any]:
    lower_transcript = transcript.lower()
    findings: dict[str, dict[str, str]] = {}

    profanity = _find_agent_line(
        transcript,
        re.compile(r"\b(damn|hell|shit|fuck|bitch|asshole)\b", re.IGNORECASE),
    )
    if profanity:
        findings["Uses profanity"] = {
            "rationale": "Agent used language that may be considered profanity.",
            "timestamp": profanity["timestamp"],
            "agent_quote": profanity["quote"],
        }

    card_line = _find_agent_line(transcript, re.compile(r"\b(?:\d[ -]*?){13,19}\b"))
    if card_line and _looks_like_card_number(card_line["quote"]):
        findings["Entered a full credit card number anywhere in the ticket or notes"] = {
            "rationale": "Agent message appears to include a full payment card number.",
            "timestamp": card_line["timestamp"],
            "agent_quote": card_line["quote"],
        }

    inability_line = _find_agent_line(
        transcript,
        re.compile(
            r"\b(i can'?t help|not my job|i don'?t know what we can do|nothing i can do)\b",
            re.IGNORECASE,
        ),
    )
    if inability_line:
        findings["Fails to state desire to assist and follow through"] = {
            "rationale": "Agent used language that signals unwillingness or inability to assist.",
            "timestamp": inability_line["timestamp"],
            "agent_quote": inability_line["quote"],
        }

    disconnect_line = _find_agent_line(
        transcript,
        re.compile(r"\b(disconnecting|ending this chat|closing this chat)\b", re.IGNORECASE),
    )
    member_closure = re.search(r"\b(thanks|thank you|that'?s all|goodbye|bye)\b", lower_transcript)
    if disconnect_line and not member_closure:
        findings["Purposely disconnects with member prematurely (Chat only)"] = {
            "rationale": (
                "Agent appears to end the chat without clear member consent or closure. "
                "Confirm manually for voice interactions."
            ),
            "timestamp": disconnect_line["timestamp"],
            "agent_quote": disconnect_line["quote"],
        }

    attributes = []
    for item in RUBRIC:
        finding = findings.get(item["sub_attribute"])
        rating = "No" if finding else "Yes"
        attributes.append(
            {
                "attribute": item["attribute"],
                "sub_attribute": item["sub_attribute"],
                "rating": rating,
                "rationale": finding["rationale"] if finding else "",
                "timestamp": finding["timestamp"] if finding else "",
                "agent_quote": finding["agent_quote"] if finding else "",
                "coaching": (
                    "Review the timestamped message and align the response with the rubric."
                    if finding
                    else ""
                ),
            }
        )

    no_count = sum(1 for attribute in attributes if attribute["rating"] == "No")
    return {
        "interaction_id": interaction_id,
        "overall_result": "Fail" if no_count else "Pass",
        "auto_fail": any(
            attribute["rating"] == "No"
            and attribute["attribute"] == "Professional Conduct (Auto Fail)"
            for attribute in attributes
        ),
        "score": round(((len(attributes) - no_count) / len(attributes)) * 100),
        "attributes": attributes,
        "summary": {
            "strengths": [],
            "opportunities": [
                "Configure QA_LLM_API_KEY for full rubric evaluation."
            ]
            if not findings
            else ["Review the detected exception(s) and validate against the transcript."],
            "next_steps": [
                "Local heuristic mode only flags high-confidence text patterns; use LLM mode for production QA."
            ],
        },
    }


def _find_agent_line(transcript: str, pattern: re.Pattern[str]) -> dict[str, str] | None:
    for line in transcript.splitlines():
        if not _is_agent_line(line):
            continue
        if pattern.search(line):
            return {"timestamp": _extract_timestamp(line), "quote": line.strip()}
    return None


def _is_agent_line(line: str) -> bool:
    return bool(re.search(r"\b(agent|representative|rep|associate)\b\s*:", line, re.IGNORECASE))


def _extract_timestamp(line: str) -> str:
    patterns = [
        r"\[(?P<ts>\d{1,2}:\d{2}(?::\d{2})?)\]",
        r"^(?P<ts>\d{1,2}:\d{2}(?::\d{2})?)\s+",
        r"^(?P<ts>\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}(?::\d{2})?)\s+",
    ]
    for pattern in patterns:
        match = re.search(pattern, line)
        if match:
            return match.group("ts")
    return "No timestamp present"


def _looks_like_card_number(text: str) -> bool:
    for match in re.finditer(r"\b(?:\d[ -]*?){13,19}\b", text):
        digits = re.sub(r"\D", "", match.group(0))
        if 13 <= len(digits) <= 19 and _luhn_check(digits):
            return True
    return False


def _luhn_check(digits: str) -> bool:
    checksum = 0
    parity = len(digits) % 2
    for index, char in enumerate(digits):
        digit = int(char)
        if index % 2 == parity:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    return checksum % 10 == 0


def _normalize_result(result: dict[str, Any], interaction_id: str, engine: str) -> dict[str, Any]:
    attributes_by_key = {
        (item.get("attribute"), item.get("sub_attribute")): item
        for item in result.get("attributes", [])
        if isinstance(item, dict)
    }

    normalized_attributes: list[dict[str, str]] = []
    for rubric_item in RUBRIC:
        raw = attributes_by_key.get(
            (rubric_item["attribute"], rubric_item["sub_attribute"]),
            {},
        )
        rating = str(raw.get("rating", "Yes")).strip().title()
        if rating not in {"Yes", "No"}:
            rating = "No" if rating in {"Fail", "Failed", "Defect"} else "Yes"

        normalized_attributes.append(
            {
                "attribute": rubric_item["attribute"],
                "sub_attribute": rubric_item["sub_attribute"],
                "rating": rating,
                "rationale": str(raw.get("rationale", "")),
                "timestamp": str(raw.get("timestamp", "")),
                "agent_quote": str(raw.get("agent_quote", "")),
                "coaching": str(raw.get("coaching", "")),
            }
        )

    no_count = sum(1 for attribute in normalized_attributes if attribute["rating"] == "No")
    auto_fail = any(
        attribute["rating"] == "No"
        and attribute["attribute"] == "Professional Conduct (Auto Fail)"
        for attribute in normalized_attributes
    )
    summary = result.get("summary", {})
    if not isinstance(summary, dict):
        summary = {}

    return {
        "interaction_id": str(result.get("interaction_id") or interaction_id),
        "overall_result": "Fail" if auto_fail or no_count else "Pass",
        "auto_fail": auto_fail,
        "score": round(((len(normalized_attributes) - no_count) / len(normalized_attributes)) * 100),
        "engine": engine,
        "prompt_version": "qa-monitoring-v1",
        "attributes": normalized_attributes,
        "summary": {
            "strengths": _string_list(summary.get("strengths")),
            "opportunities": _string_list(summary.get("opportunities")),
            "next_steps": _string_list(summary.get("next_steps")),
        },
    }


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item) for item in value if str(item).strip()]
