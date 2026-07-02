"""QA monitoring evaluator service helpers.

The production path calls an OpenAI-compatible chat completions API with the
rubric prompt in ``prompts/qa_monitoring_prompt.md``. A conservative local
heuristic fallback keeps the web app usable when an API key is not configured.
"""

from __future__ import annotations

import json
import os
import re
import socket
import time
import urllib.error
import urllib.parse
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
        "sub_attribute": "Agent or member misunderstands info/statement",
        "definition": (
            "The agent or team member has incorrectly interpreted, misread, or "
            "misunderstood the information or statement provided, leading to an "
            "inaccurate response, action, or assumption."
        ),
    },
    {
        "attribute": "Communication Skills",
        "sub_attribute": "Uses slang or inappropriate grammar/spelling",
        "definition": (
            "The agent or member uses informal slang, incorrect grammar, or "
            "misspelled words in communication, which may reduce clarity, "
            "professionalism, or adherence to language standards."
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
            "Uses excessive authentication and/or incorrect greeting/ending"
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
        "sub_attribute": "Fails to understand or acknowledge the contact reason/issue immediately",
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
        "sub_attribute": "Fails to comply with client terminology guidelines",
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
    temperature: float
    max_retries: int
    retry_delay: float


@dataclass(frozen=True)
class TranscriptLine:
    raw: str
    speaker: str
    message: str
    timestamp: str
    seconds: int | None
    index: int


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


def get_llm_config(request_config: dict[str, Any] | None = None) -> LlmConfig | None:
    request_config = request_config or {}
    api_key = (
        _clean_config_value(request_config.get("api_key"))
        or os.getenv("QA_LLM_API_KEY")
        or os.getenv("OPENAI_API_KEY")
    )
    if not api_key:
        return None

    timeout_seconds = _int_config_value(
        request_config.get("timeout_seconds"),
        os.getenv("QA_LLM_TIMEOUT_SECONDS", "60"),
        default=60,
        minimum=10,
    )
    max_retries = _int_config_value(
        request_config.get("max_retries"),
        os.getenv("QA_LLM_MAX_RETRIES", "3"),
        default=3,
        minimum=0,
    )
    retry_delay = _float_config_value(
        request_config.get("retry_delay"),
        os.getenv("QA_LLM_RETRY_DELAY", "1"),
        default=1,
        minimum=0,
    )
    temperature = _float_config_value(
        request_config.get("temperature"),
        os.getenv("QA_LLM_TEMPERATURE", "0.2"),
        default=0.2,
        minimum=0,
    )

    return LlmConfig(
        api_key=api_key,
        api_url=get_llm_endpoint(request_config),
        model=_clean_config_value(request_config.get("model"))
        or os.getenv("QA_LLM_MODEL", "gpt-4o-mini"),
        timeout_seconds=timeout_seconds,
        temperature=temperature,
        max_retries=max_retries,
        retry_delay=retry_delay,
    )


def evaluate_interaction(
    interaction_id: str,
    transcript: str,
    llm_config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Evaluate a transcript and return the normalized QA result."""
    config = get_llm_config(llm_config)
    if config:
        result = _evaluate_with_llm(config, interaction_id, transcript)
        return _normalize_result(result, interaction_id, engine="llm")

    result = _evaluate_with_local_heuristics(interaction_id, transcript)
    return _normalize_result(result, interaction_id, engine="local_heuristic")


def _clean_config_value(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _int_config_value(value: Any, fallback: Any, default: int, minimum: int) -> int:
    raw_value = _clean_config_value(value) or _clean_config_value(fallback)
    try:
        return max(minimum, int(raw_value))
    except (TypeError, ValueError):
        return default


def _float_config_value(value: Any, fallback: Any, default: float, minimum: float) -> float:
    raw_value = _clean_config_value(value) or _clean_config_value(fallback)
    try:
        return max(minimum, float(raw_value))
    except (TypeError, ValueError):
        return default


def _chat_completions_url(raw_url: str) -> str:
    url = raw_url.rstrip("/")
    if url.endswith("/chat/completions"):
        return url
    if url.endswith("/v1"):
        return f"{url}/chat/completions"
    return f"{url}/v1/chat/completions"


def get_llm_endpoint(request_config: dict[str, Any] | None = None) -> str:
    request_config = request_config or {}
    raw_url = (
        _clean_config_value(request_config.get("api_url"))
        or _clean_config_value(request_config.get("base_url"))
        or os.getenv("QA_LLM_API_URL")
        or os.getenv("QA_LLM_BASE_URL")
        or "https://api.openai.com/v1/chat/completions"
    )
    return _chat_completions_url(raw_url)


def check_llm_connectivity(request_config: dict[str, Any] | None = None) -> dict[str, Any]:
    endpoint = get_llm_endpoint(request_config)
    parsed = urllib.parse.urlparse(endpoint)
    host = parsed.hostname
    if not host:
        return {
            "ok": False,
            "endpoint": endpoint,
            "error": "LLM base URL is invalid or missing a host.",
        }

    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    timeout = _int_config_value(
        (request_config or {}).get("connect_timeout_seconds"),
        "10",
        default=10,
        minimum=1,
    )
    try:
        resolved_addresses = sorted({item[4][0] for item in socket.getaddrinfo(host, port)})
        with socket.create_connection((host, port), timeout=timeout):
            pass
    except OSError as exc:
        return {
            "ok": False,
            "endpoint": endpoint,
            "host": host,
            "port": port,
            "error": str(exc),
            "message": (
                "The server running this app cannot connect to the LLM host. "
                "Check VPN/corporate network access, firewall/proxy settings, and the base URL."
            ),
        }

    return {
        "ok": True,
        "endpoint": endpoint,
        "host": host,
        "port": port,
        "resolved_addresses": resolved_addresses,
        "message": "TCP connectivity to the LLM host succeeded.",
    }


def _evaluate_with_llm(config: LlmConfig, interaction_id: str, transcript: str) -> dict[str, Any]:
    prompt = get_rendered_prompt(interaction_id, transcript)
    payload = {
        "model": config.model,
        "temperature": config.temperature,
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
    raw_response = _post_llm_request(config, payload)

    response_payload = json.loads(raw_response)
    try:
        content = response_payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("LLM response did not include choices[0].message.content") from exc

    return _parse_json_object(content)


def _post_llm_request(config: LlmConfig, payload: dict[str, Any]) -> str:
    data = json.dumps(payload).encode("utf-8")
    attempts = config.max_retries + 1
    last_error: RuntimeError | None = None

    for attempt in range(attempts):
        request = urllib.request.Request(
            config.api_url,
            data=data,
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=config.timeout_seconds) as response:
                return response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            last_error = RuntimeError(f"LLM provider returned HTTP {exc.code}: {body}")
            if exc.code < 500 or attempt == attempts - 1:
                raise last_error from exc
        except urllib.error.URLError as exc:
            last_error = RuntimeError(f"Unable to reach LLM provider: {exc.reason}")
            if attempt == attempts - 1:
                raise last_error from exc

        if config.retry_delay:
            time.sleep(config.retry_delay)

    raise last_error or RuntimeError("LLM request failed")


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
    lines = _parse_transcript_lines(transcript)
    agent_lines = [line for line in lines if line.speaker == "agent"]
    member_lines = [line for line in lines if line.speaker == "member"]
    first_agent_index = agent_lines[0].index if agent_lines else -1
    audited_member_lines = [line for line in member_lines if line.index > first_agent_index]
    lower_transcript = transcript.lower()
    findings: dict[str, dict[str, str]] = {}

    _evaluate_soft_skills(findings, lines, agent_lines, audited_member_lines)
    _evaluate_communication(findings, lines, agent_lines, member_lines)
    _evaluate_call_handling(findings, lines, agent_lines, member_lines, lower_transcript)
    _evaluate_completion(findings, lines, agent_lines, audited_member_lines)
    _evaluate_professional_conduct(findings, agent_lines, lower_transcript)

    attributes = []
    for item in RUBRIC:
        finding = findings.get(item["sub_attribute"])
        rating = "Yes" if finding else "No"
        attributes.append(
            {
                "attribute": item["attribute"],
                "sub_attribute": item["sub_attribute"],
                "rating": rating,
                "rationale": finding["rationale"] if finding else "",
                "timestamp": finding["timestamp"] if finding else "",
                "agent_quote": finding["agent_quote"] if finding else "",
                "coaching": finding["coaching"] if finding else "",
            }
        )

    defect_items = [attribute for attribute in attributes if attribute["rating"] == "Yes"]
    return {
        "interaction_id": interaction_id,
        "overall_result": "Fail" if defect_items else "Pass",
        "auto_fail": any(
            attribute["rating"] == "Yes"
            and attribute["attribute"] == "Professional Conduct (Auto Fail)"
            for attribute in attributes
        ),
        "score": round(((len(attributes) - len(defect_items)) / len(attributes)) * 100),
        "attributes": attributes,
        "summary": {
            "strengths": _local_strengths(agent_lines, defect_items),
            "opportunities": [
                f"{item['sub_attribute']}: {item['rationale']}" for item in defect_items[:5]
            ]
            or ["No rules-based defects detected."],
            "next_steps": [
                "Review all local-rules findings against the source transcript.",
                "Configure QA_LLM_API_KEY for nuanced production grading and policy interpretation.",
            ],
        },
    }


def _evaluate_soft_skills(
    findings: dict[str, dict[str, str]],
    lines: list[TranscriptLine],
    agent_lines: list[TranscriptLine],
    member_lines: list[TranscriptLine],
) -> None:
    concern = _first_member_line(
        member_lines,
        r"\b(frustrated|upset|angry|mad|annoyed|unacceptable|ridiculous|late|delay|delayed|"
        r"wrong|error|mistake|complaint|inconvenien|waiting|no one|nobody|charged|overcharged)\b",
    )
    if concern:
        next_agent = _next_agent_after(lines, concern.index)
        if next_agent and not _has_apology(next_agent.message):
            _set_finding(
                findings,
                "Fails to/misses apology due to error or inconvenience",
                next_agent,
                "Member expressed frustration, inconvenience, or possible company error and the next agent response did not acknowledge it with an apology.",
                "Acknowledge the inconvenience naturally and apologize before moving into resolution.",
            )
        if next_agent and not _has_empathy(next_agent.message):
            _set_finding(
                findings,
                "Misses or uses inappropriate empathy or rapport",
                next_agent,
                "Member gave an emotional cue, but the agent response did not include empathy or rapport.",
                "Use a brief, relevant empathy statement tied to the member's concern.",
            )
        if next_agent and not _has_acknowledgment(next_agent.message):
            _set_finding(
                findings,
                "Fails to or delays in acknowledging member concerns",
                next_agent,
                "Member concern was not promptly acknowledged in the following agent response.",
                "Confirm the concern before asking additional questions or moving to research.",
            )

    excessive_apology = _find_excessive_apology(agent_lines, member_lines)
    if excessive_apology:
        _set_finding(
            findings,
            "Uses excessive apologies",
            excessive_apology,
            "Agent apologized repeatedly when additional apologies did not add value or move the interaction forward.",
            "Use one sincere apology for the issue, then focus on ownership, action, expectations, and resolution.",
        )

    inability = _first_agent_line(
        agent_lines,
        r"\b(i can'?t help|not my job|i don'?t know what we can do|nothing i can do|"
        r"can'?t do anything|you'?re on your own)\b",
    )
    if inability:
        _set_finding(
            findings,
            "Fails to state desire to assist and follow through",
            inability,
            "Agent used language that signals unwillingness or inability to assist.",
            "State willingness to help and explain the next available action or process.",
        )
    else:
        issue = _first_member_line(member_lines, r"\b(help|issue|problem|need|question|order|refund|membership|account)\b")
        next_agent = _next_agent_after(lines, issue.index) if issue else None
        if next_agent and not re.search(r"\b(help|assist|look|review|check|take care|resolve|work on)\b", next_agent.message, re.IGNORECASE):
            _set_finding(
                findings,
                "Fails to state desire to assist and follow through",
                next_agent,
                "Agent did not clearly express willingness to assist after the member explained the issue.",
                "Use a clear ownership statement such as 'I can help review that for you.'",
            )

    hostile = _first_member_line(
        member_lines,
        r"\b(angry|furious|manager|supervisor|lawsuit|cancel|ridiculous|unacceptable|stupid|terrible)\b",
    )
    if hostile:
        next_agent = _next_agent_after(lines, hostile.index)
        if next_agent and not _has_diffusion(next_agent.message):
            _set_finding(
                findings,
                "Fails to use effective hostility diffusion skills",
                next_agent,
                "Member showed hostility or escalation risk, but the agent did not use a calming or ownership statement.",
                "Lower the temperature with empathy, ownership, and a clear next step.",
            )


def _evaluate_communication(
    findings: dict[str, dict[str, str]],
    lines: list[TranscriptLine],
    agent_lines: list[TranscriptLine],
    member_lines: list[TranscriptLine],
) -> None:
    first_agent_index = agent_lines[0].index if agent_lines else -1
    audited_member_lines = [line for line in member_lines if line.index > first_agent_index]

    repeated = _find_repeated_agent_message(agent_lines)
    if repeated:
        _set_finding(
            findings,
            "Unnecessarily repeats questions or information",
            repeated,
            "Agent repeated substantially the same question or information instead of progressing the interaction.",
            "Use the member's prior answer and move to the next resolution step.",
        )

    misunderstanding = _find_misunderstanding(lines, agent_lines, member_lines)
    if misunderstanding:
        line, rationale = misunderstanding
        _set_finding(
            findings,
            "Agent or member misunderstands info/statement",
            line,
            rationale,
            "Confirm the member's intent and restate the issue before taking action.",
        )

    grammar = _find_agent_language_quality_issue(agent_lines)
    if grammar:
        _set_finding(
            findings,
            "Uses slang or inappropriate grammar/spelling",
            grammar,
            "Agent message contains slang, spacing, grammar, spelling, punctuation, or encoding issues that reduce professionalism or clarity.",
            "Use clear professional grammar, correct spacing/punctuation, and proofread chat messages before sending.",
        )

    argument = _first_agent_line(
        agent_lines,
        r"\b(you are wrong|you'?re wrong|that'?s not true|as i already told you|not our fault|"
        r"you should have|i told you already|listen to me)\b",
    )
    if argument:
        _set_finding(
            findings,
            "Courtesy: Argues with the member",
            argument,
            "Agent contradicted the member in a way that can sound argumentative.",
            "Acknowledge the member's perspective and clarify policy without arguing.",
        )

    ignored = _find_ignored_member_request(lines, audited_member_lines)
    if ignored:
        _set_finding(
            findings,
            "Courtesy: Ignores a member request",
            ignored,
            "Member made a direct request or asked a question, and the next agent response did not acknowledge it.",
            "Acknowledge direct questions or requests before changing topics.",
        )


def _evaluate_call_handling(
    findings: dict[str, dict[str, str]],
    lines: list[TranscriptLine],
    agent_lines: list[TranscriptLine],
    member_lines: list[TranscriptLine],
    lower_transcript: str,
) -> None:
    first_agent = agent_lines[0] if agent_lines else None
    if first_agent and not re.search(r"\b(thank you|thanks|welcome|bj'?s|member care|my name is|this is)\b", first_agent.message, re.IGNORECASE):
        _set_finding(
            findings,
            "Uses excessive authentication and/or incorrect greeting/ending",
            first_agent,
            "Opening agent message does not include an appropriate greeting or identification.",
            "Open with the approved greeting and identify BJ's/member care where required.",
        )

    if agent_lines and not _has_authentication(agent_lines, lower_transcript):
        _set_finding(
            findings,
            "Uses excessive authentication and/or incorrect greeting/ending",
            agent_lines[min(1, len(agent_lines) - 1)],
            "Transcript does not show authentication using the required 1/3 rule or a clear indication that authentication was already completed.",
            "Follow the authentication rule: one additional item after IVR account info, otherwise three required items.",
        )

    if len(lines) >= 4 and agent_lines:
        last_agent = agent_lines[-1]
        if not re.search(r"\b(anything else|survey|thank you|thanks|goodbye|bye|have a (great|good)|stay on the line)\b", last_agent.message, re.IGNORECASE):
            _set_finding(
                findings,
                "Uses excessive authentication and/or incorrect greeting/ending",
                last_agent,
                "Closing does not show an appropriate ending or survey offer.",
                "Close professionally and offer the survey when required.",
            )

    issue = _first_member_line(member_lines, r"\b(calling|contacting|issue|problem|need|order|refund|membership|account|charged|delivery)\b")
    next_agent = _next_agent_after(lines, issue.index) if issue else None
    if next_agent and not _has_acknowledgment(next_agent.message):
        _set_finding(
            findings,
            "Fails to understand or acknowledge the contact reason/issue immediately",
            next_agent,
            "Agent did not immediately show understanding of the member's reason for contact.",
            "Restate or acknowledge the issue before proceeding.",
        )

    uncertain = _first_agent_line(
        agent_lines,
        r"\b(i think|maybe|probably|i guess|not sure|should be fine|i assume|whatever)\b",
    )
    if uncertain:
        _set_finding(
            findings,
            "Provides inaccurate or incomplete information to member",
            uncertain,
            "Agent gave uncertain or incomplete information rather than verified guidance.",
            "Use verified policy or research the answer before providing information.",
        )

    terminology = _first_agent_line(agent_lines, r"\b(customer|customers)\b")
    if terminology:
        _set_finding(
            findings,
            "Fails to comply with client terminology guidelines",
            terminology,
            "Agent used 'customer' instead of BJ's member terminology.",
            "Use BJ's approved terminology, such as 'member'.",
        )

    help_desk = _first_agent_line(agent_lines, r"\b(help desk|support desk|tier 2|supervisor)\b")
    kb_before_help = re.search(r"\b(kb|knowledge base|article|policy)\b", lower_transcript)
    if help_desk and not kb_before_help:
        _set_finding(
            findings,
            "Fails to use KB when appropriate",
            help_desk,
            "Agent escalated or contacted help desk without transcript evidence of reviewing the Knowledge Base first.",
            "Search the KB before escalation when policy or process guidance is needed.",
        )

    unresolved = _first_agent_line(
        agent_lines,
        r"\b(call back|contact us again|nothing (else )?i can do|can'?t resolve|not able to resolve|"
        r"someone else will have to|you need to call)\b",
    )
    if unresolved:
        _set_finding(
            findings,
            "Fails to resolve the issue and/or follow the process to closure",
            unresolved,
            "Agent left the issue unresolved or referred the member unnecessarily based on the transcript.",
            "Follow the available process to closure or explain the valid next step with ownership.",
        )


def _evaluate_completion(
    findings: dict[str, dict[str, str]],
    lines: list[TranscriptLine],
    agent_lines: list[TranscriptLine],
    member_lines: list[TranscriptLine],
) -> None:
    vague_expectation = _first_agent_line(
        agent_lines,
        r"\b(asap|soon|right away|immediately|guarantee|promise|definitely today|whenever)\b",
    )
    if vague_expectation:
        _set_finding(
            findings,
            "Does not set, or sets unrealistic, expectations",
            vague_expectation,
            "Agent set a vague, unrealistic, or overly absolute expectation.",
            "Give a realistic timeframe and avoid guarantees unless policy supports them.",
        )

    follow_request = _first_member_line(
        member_lines,
        r"\b(call me back|callback|call back|follow up|follow-up|email me|let me know|update me)\b",
    )
    if follow_request:
        later_agent_text = " ".join(
            line.message for line in agent_lines if line.index > follow_request.index
        ).lower()
        if not re.search(r"\b(follow up|follow-up|call back|callback|email|update|3 business days|three business days)\b", later_agent_text):
            next_agent = _next_agent_after(lines, follow_request.index)
            _set_finding(
                findings,
                "Does not establish follow-up when required or member requested",
                next_agent or follow_request,
                "Member requested follow-up, but the agent did not establish it.",
                "Confirm the follow-up channel and timeframe when the member requests it or process requires it.",
            )

    proactive_follow = _first_agent_line(
        [line for line in agent_lines if not follow_request or line.index < follow_request.index],
        r"\b(i'?ll|i will|we will|we'?ll).{0,30}\b(call you|call back|follow up|follow-up|email you|update you)\b",
    )
    if proactive_follow:
        _set_finding(
            findings,
            "Offers follow-up without member request",
            proactive_follow,
            "Agent proactively offered follow-up before the member requested it.",
            "Let the member drive follow-up requests unless process requires follow-up.",
        )

    documented_lines = [
        line
        for line in agent_lines
        if re.search(r"\b(documented|documenting|notes?|zendesk|ticket)\b", line.message, re.IGNORECASE)
    ]
    if len(documented_lines) >= 3:
        _set_finding(
            findings,
            "Excessive/repetitive documentation",
            documented_lines[2],
            "Agent appears to document repeatedly or redundantly during the interaction.",
            "Document once with concise, accurate notes unless an update is required.",
        )

    inaccurate_note = _first_agent_line(
        documented_lines,
        r"\b(incorrect|wrong|oops|mistake|i put|i entered).{0,50}\b(note|ticket|zendesk|documentation)\b",
    )
    if inaccurate_note:
        _set_finding(
            findings,
            "Inaccurate documentation",
            inaccurate_note,
            "Agent indicated the ticket or notes contained incorrect information.",
            "Correct documentation immediately and ensure notes match the interaction.",
        )


def _evaluate_professional_conduct(
    findings: dict[str, dict[str, str]],
    agent_lines: list[TranscriptLine],
    lower_transcript: str,
) -> None:
    profanity = _first_agent_line(
        agent_lines,
        re.compile(r"\b(damn|hell|shit|fuck|bitch|asshole)\b", re.IGNORECASE),
    )
    if profanity:
        _set_finding(
            findings,
            "Uses profanity",
            profanity,
            "Agent used language that may be considered profanity.",
            "Maintain professional language throughout the interaction.",
        )

    pii_line = _first_agent_line(
        agent_lines,
        r"\b(ssn|social security)\b.{0,30}\b\d{3}[- ]?\d{2}[- ]?\d{4}\b|\b\d{3}[- ]?\d{2}[- ]?\d{4}\b",
    )
    if pii_line:
        _set_finding(
            findings,
            "PII failure",
            pii_line,
            "Agent message appears to expose sensitive personally identifiable information.",
            "Do not enter or repeat sensitive PII in chat, ticket notes, or unsecured fields.",
        )

    disconnect_line = _first_agent_line(
        agent_lines,
        r"\b(disconnecting|ending this chat|closing this chat|terminating this chat)\b",
    )
    member_closure = re.search(r"\b(thanks|thank you|that'?s all|goodbye|bye)\b", lower_transcript)
    if disconnect_line and not member_closure:
        _set_finding(
            findings,
            "Purposely disconnects with member prematurely (Chat only)",
            disconnect_line,
            (
                "Agent appears to end the chat without clear member consent or closure. "
                "Confirm manually for voice interactions."
            ),
            "Follow chat closure policy and confirm no further assistance is needed before disconnecting.",
        )

    fraud_line = _first_agent_line(
        agent_lines,
        r"\b(fake|falsify|bypass payment|use my account|change it to my account|refund it to me|"
        r"keep the credit|unauthorized refund)\b",
    )
    if fraud_line:
        _set_finding(
            findings,
            "Any fraud related to the member or call",
            fraud_line,
            "Agent language indicates potential fraudulent handling of account, credit, or payment details.",
            "Escalate suspected fraud and follow approved account/payment handling procedures.",
        )

    unauthorized_tool = _first_agent_line(
        agent_lines,
        r"\b(personal email|gmail|google sheet|spreadsheet|whatsapp|text my phone|notepad|unauthorized tool)\b",
    )
    if unauthorized_tool:
        _set_finding(
            findings,
            "Uses unauthorized tools",
            unauthorized_tool,
            "Agent referenced an unapproved tool or channel for handling member information.",
            "Use only approved BJ's systems and channels for member information.",
        )

    card_line = _first_agent_line(agent_lines, re.compile(r"\b(?:\d[ -]*?){13,19}\b"))
    if card_line and _looks_like_card_number(card_line.message):
        _set_finding(
            findings,
            "Entered a full credit card number anywhere in the ticket or notes",
            card_line,
            "Agent message appears to include a full payment card number.",
            "Never record full card numbers in chats, tickets, or notes; use approved PCI workflows.",
        )


def _parse_transcript_lines(transcript: str) -> list[TranscriptLine]:
    parsed: list[TranscriptLine] = []
    speaker_pattern = re.compile(
        r"^\s*(?:\[(?P<bracket_ts>[^\]]+)\]\s*)?"
        r"(?:(?P<prefix_ts>\d{1,2}:\d{2}(?::\d{2})?)\s+)?"
        r"(?P<speaker>agent|representative|rep|associate|member|caller|customer|client)\s*:\s*"
        r"(?P<message>.*)$",
        re.IGNORECASE,
    )
    named_speaker_pattern = re.compile(
        r"^\s*(?P<speaker>[A-Za-z][A-Za-z0-9' ._-]*?)"
        r"(?:\((?P<paren_ts>\d{1,2}:\d{2}(?::\d{2})?)\))?\s*:\s*"
        r"(?P<message>.*)$",
        re.IGNORECASE,
    )

    for index, raw_line in enumerate(_split_transcript_records(transcript)):
        if not raw_line.strip():
            continue
        match = speaker_pattern.match(raw_line)
        if match:
            raw_speaker = match.group("speaker").lower()
            speaker = "agent" if raw_speaker in {"agent", "representative", "rep", "associate"} else "member"
            timestamp = match.group("bracket_ts") or match.group("prefix_ts") or _extract_timestamp(raw_line)
            message = match.group("message").strip()
        else:
            named_match = named_speaker_pattern.match(raw_line)
            if named_match:
                speaker = _classify_named_speaker(named_match.group("speaker"))
                timestamp = named_match.group("paren_ts") or _extract_timestamp(raw_line)
                message = named_match.group("message").strip()
            else:
                speaker = "agent" if _is_agent_line(raw_line) else "member" if _is_member_line(raw_line) else "unknown"
                timestamp = _extract_timestamp(raw_line)
                message = _strip_timestamp(raw_line)

        parsed.append(
            TranscriptLine(
                raw=raw_line.strip(),
                speaker=speaker,
                message=message,
                timestamp=timestamp,
                seconds=_timestamp_to_seconds(timestamp),
                index=index,
            )
        )
    return parsed


def _split_transcript_records(transcript: str) -> list[str]:
    normalized = transcript.replace("\r\n", "\n").replace("\r", "\n")
    # Chat exports often concatenate messages. Insert record boundaries before
    # known chat speaker labels while preserving their timestamp tokens.
    boundary = re.compile(
        r"(?<!^)(?=\s*(?:"
        r"BJ'?s virtual assistant\s*:"
        r"|Visitor(?:-[A-Za-z0-9-]+)?(?:\(\d{1,2}:\d{2}(?::\d{2})?\))?\s*:"
        r"|[A-Z][A-Za-z' ._-]{1,40}\(\d{1,2}:\d{2}(?::\d{2})?\)\s*:"
        r"))",
        re.MULTILINE,
    )
    normalized = boundary.sub("\n", normalized)
    return [line.strip() for line in normalized.splitlines() if line.strip()]


def _classify_named_speaker(label: str) -> str:
    normalized = label.lower().strip()
    if re.search(r"\b(visitor|member|customer|caller|client)\b", normalized):
        return "member"
    if "virtual assistant" in normalized or normalized == "info":
        return "bot"
    if re.search(r"\b(agent|representative|rep|associate)\b", normalized):
        return "agent"
    # In BJ's chat exports, named timestamped speakers such as "Sammy(10:09)"
    # are the human agent after the virtual assistant handoff.
    return "agent"


def _set_finding(
    findings: dict[str, dict[str, str]],
    sub_attribute: str,
    line: TranscriptLine,
    rationale: str,
    coaching: str,
) -> None:
    if sub_attribute in findings:
        return
    findings[sub_attribute] = {
        "rationale": rationale,
        "timestamp": line.timestamp or "No timestamp present",
        "agent_quote": line.raw,
        "coaching": coaching,
    }


def _first_agent_line(
    agent_lines: list[TranscriptLine],
    pattern: str | re.Pattern[str],
) -> TranscriptLine | None:
    return _first_line(agent_lines, pattern)


def _first_member_line(
    member_lines: list[TranscriptLine],
    pattern: str | re.Pattern[str],
) -> TranscriptLine | None:
    return _first_line(member_lines, pattern)


def _first_line(
    lines: list[TranscriptLine],
    pattern: str | re.Pattern[str],
) -> TranscriptLine | None:
    for line in lines:
        if _line_matches(line.message, pattern) or _line_matches(line.raw, pattern):
            return line
    return None


def _line_matches(text: str, pattern: str | re.Pattern[str]) -> bool:
    if isinstance(pattern, re.Pattern):
        return bool(pattern.search(text))
    return bool(re.search(pattern, text, re.IGNORECASE))


def _next_agent_after(lines: list[TranscriptLine], index: int) -> TranscriptLine | None:
    for line in lines:
        if line.index > index and line.speaker == "agent":
            return line
    return None


def _has_apology(message: str) -> bool:
    return bool(re.search(r"\b(sorry|apologize|apologies|regret)\b", message, re.IGNORECASE))


def _has_empathy(message: str) -> bool:
    return bool(
        re.search(
            r"\b(i understand|understand how|i can understand|i know this|that must|"
            r"i appreciate|sorry|apologize|i realize|i see why)\b",
            message,
            re.IGNORECASE,
        )
    )


def _has_acknowledgment(message: str) -> bool:
    return bool(
        re.search(
            r"\b(i understand|understand|i see|sorry|apologize|let me|i can help|"
            r"i'?ll|i will|we can|i can check|i can review|thank you for explaining|"
            r"happy to help|glad to help)\b",
            message,
            re.IGNORECASE,
        )
    )


def _has_diffusion(message: str) -> bool:
    return _has_empathy(message) or bool(
        re.search(
            r"\b(let me help|i can help|we'?ll work|i will review|i can take a look|"
            r"i want to get this resolved|i can certainly)\b",
            message,
            re.IGNORECASE,
        )
    )


def _find_repeated_agent_message(agent_lines: list[TranscriptLine]) -> TranscriptLine | None:
    seen: dict[str, TranscriptLine] = {}
    for line in agent_lines:
        if re.search(r"\b(anything else|assist|help|thank you|thanks|connected)\b", line.message, re.IGNORECASE):
            normalized = re.sub(r"[^a-z0-9? ]", "", line.message.lower())
        else:
            normalized = re.sub(r"[^a-z0-9? ]", "", line.message.lower())
        normalized = re.sub(r"\s+", " ", normalized).strip()
        if len(normalized) < 12:
            continue
        if re.search(r"\b(assist|help)\b", normalized) and len(seen) >= 1:
            prior_assist = next(
                (
                    prior
                    for key, prior in seen.items()
                    if re.search(r"\b(assist|help)\b", key)
                ),
                None,
            )
            if prior_assist:
                return line
        if normalized in seen:
            return line
        seen[normalized] = line
    return None


def _find_excessive_apology(
    agent_lines: list[TranscriptLine],
    member_lines: list[TranscriptLine],
) -> TranscriptLine | None:
    apology_lines = [
        line
        for line in agent_lines
        if re.search(r"\b(sorry|apologize|apologies|apologetic)\b", line.message, re.IGNORECASE)
    ]
    if len(apology_lines) >= 3:
        return apology_lines[2]

    if len(apology_lines) < 2:
        return None

    concern_lines = [
        line
        for line in member_lines
        if re.search(
            r"\b(frustrated|upset|angry|mad|annoyed|unacceptable|ridiculous|late|delay|"
            r"delayed|wrong|error|mistake|complaint|inconvenien|hardship|charged|overcharged)\b",
            line.message,
            re.IGNORECASE,
        )
    ]
    first_apology = apology_lines[0]
    second_apology = apology_lines[1]
    new_concern_between = any(
        first_apology.index < concern.index < second_apology.index
        for concern in concern_lines
    )
    return None if new_concern_between else second_apology


def _find_agent_language_quality_issue(agent_lines: list[TranscriptLine]) -> TranscriptLine | None:
    patterns = [
        (r"\b(i would be closing|kindly|okies|gonna|wanna|lemme)\b", re.IGNORECASE),
        (r"\b(u|ur|pls|plz|thx|ans|recieve|seperate|definately|teh|adress)\b", re.IGNORECASE),
        (r"(?<![A-Za-z])i(?![A-Za-z])", 0),
        (r"\s{2,}", 0),
        (r"\s+[,.!?;:]", 0),
        (r"[,.!?;:](?=[A-Za-z])", 0),
        (r"â|Â|�", 0),
    ]
    for line in agent_lines:
        for pattern, flags in patterns:
            if re.search(pattern, line.message, flags):
                return line
    return None


def _find_misunderstanding(
    lines: list[TranscriptLine],
    agent_lines: list[TranscriptLine],
    member_lines: list[TranscriptLine],
) -> tuple[TranscriptLine, str] | None:
    explicit = _first_line(
        lines,
        r"\b(misunderstood|not what i asked|that'?s not what i said|i didn'?t ask|confused|what do you mean)\b",
    )
    if explicit:
        return explicit, "Transcript contains explicit misunderstanding or confusion language."

    for member_line in member_lines:
        if re.search(r"\bcancel\b.{0,30}\b(membership fee|renewal fee|charge)\b", member_line.message, re.IGNORECASE):
            next_agent_text = " ".join(
                line.message for line in agent_lines if line.index > member_line.index
            )
            if re.search(r"\bcancel\b.{0,30}\bmembership\b", next_agent_text, re.IGNORECASE):
                next_agent = _next_agent_after(lines, member_line.index)
                if next_agent:
                    return (
                        next_agent,
                        "Member asked about canceling the membership/renewal fee, but the agent framed the action as canceling the membership.",
                    )
    return None


def _find_hold_issue(
    lines: list[TranscriptLine],
    agent_lines: list[TranscriptLine],
) -> tuple[TranscriptLine, str] | None:
    silence = _first_line(
        lines,
        r"\b(dead air|silence|mute|mumbling)\b.*\b([7-9]|[1-9]\d+)\s*(seconds?|secs?)\b",
    )
    if silence:
        return silence, "Transcript indicates more than 6 seconds of silence, dead air, mute, or mumbling."

    for line in agent_lines:
        if not re.search(r"\b(hold|one moment|bear with me)\b", line.message, re.IGNORECASE):
            continue
        explained = re.search(
            r"\b(while|so i can|to check|to review|look into|pull up|research|verify|check)\b",
            line.message,
            re.IGNORECASE,
        )
        if not explained:
            return line, "Agent placed or implied a hold without explaining why it was needed."

        next_agent = _next_agent_after(lines, line.index)
        if line.seconds is not None and next_agent and next_agent.seconds is not None:
            gap = next_agent.seconds - line.seconds
            if gap > 120 and not re.search(r"\b(thank you for holding|thanks for holding|still checking|update)\b", next_agent.message, re.IGNORECASE):
                return line, "Hold appears to exceed 2 minutes without a clear check-in."
    return None


def _find_ignored_member_request(
    lines: list[TranscriptLine],
    member_lines: list[TranscriptLine],
) -> TranscriptLine | None:
    for member_line in member_lines:
        if re.search(r"\b(call me back|callback|follow up|follow-up|email me|update me)\b", member_line.message, re.IGNORECASE):
            continue
        if not re.search(r"\?|can you|could you|please|i need|i want|tell me|explain|why\b", member_line.message, re.IGNORECASE):
            continue

        next_agent = _next_agent_after(lines, member_line.index)
        if not next_agent:
            continue
        if re.search(r"\b(anything else|is there anything|thank you for calling|goodbye|bye)\b", next_agent.message, re.IGNORECASE):
            return next_agent
        if not _has_acknowledgment(next_agent.message) and not _shares_meaning(member_line.message, next_agent.message):
            return next_agent
    return None


def _shares_meaning(member_message: str, agent_message: str) -> bool:
    member_words = _meaningful_words(member_message)
    agent_words = _meaningful_words(agent_message)
    return len(member_words & agent_words) >= 2


def _meaningful_words(message: str) -> set[str]:
    stop_words = {
        "the",
        "and",
        "for",
        "you",
        "can",
        "could",
        "please",
        "this",
        "that",
        "with",
        "have",
        "need",
        "want",
        "what",
        "when",
        "where",
        "why",
        "how",
        "tell",
    }
    return {
        word
        for word in re.findall(r"[a-zA-Z]{3,}", message.lower())
        if word not in stop_words
    }


def _has_authentication(agent_lines: list[TranscriptLine], lower_transcript: str) -> bool:
    if re.search(r"\b(already verified|authenticated already|verification complete|authenticated in ivr)\b", lower_transcript):
        return True

    auth_text = " ".join(line.message for line in agent_lines[:8]).lower()
    has_ivr = bool(re.search(r"\b(ivr|automated system|account info came through)\b", lower_transcript))
    auth_items = 0
    auth_patterns = [
        r"\b(name on (the )?account|full name)\b",
        r"\b(phone|telephone|mobile)\b",
        r"\b(address|street)\b",
        r"\b(email|e-mail)\b",
        r"\b(date of birth|dob|birthday)\b",
        r"\b(zip|postal)\b",
        r"\b(member(ship)? number|member id|account number)\b",
        r"\b(order number|order id)\b",
        r"\b(last four|last 4)\b",
    ]
    for pattern in auth_patterns:
        if re.search(pattern, auth_text):
            auth_items += 1

    chat_name_and_membership = bool(
        re.search(r"\b(first and last name|full name)\b", auth_text)
        and re.search(r"\b(member(ship)? number|member id)\b", auth_text)
    )
    if chat_name_and_membership:
        return True

    if has_ivr:
        return auth_items >= 1
    return auth_items >= 3


def _local_strengths(agent_lines: list[TranscriptLine], no_items: list[dict[str, str]]) -> list[str]:
    strengths: list[str] = []
    agent_text = " ".join(line.message for line in agent_lines)
    if re.search(r"\b(help|assist|review|check|look into)\b", agent_text, re.IGNORECASE):
        strengths.append("Agent used assistance or ownership language.")
    if re.search(r"\b(thank you|thanks|survey|anything else)\b", agent_text, re.IGNORECASE):
        strengths.append("Agent used some professional greeting or closing language.")
    if not no_items:
        strengths.append("No rules-based defects were detected in the transcript.")
    return strengths[:3]


def _is_member_line(line: str) -> bool:
    return bool(re.search(r"\b(member|caller|customer|client)\b\s*:", line, re.IGNORECASE))


def _strip_timestamp(line: str) -> str:
    stripped = re.sub(r"^\s*\[[^\]]+\]\s*", "", line)
    stripped = re.sub(r"^\s*\d{1,2}:\d{2}(?::\d{2})?\s+", "", stripped)
    return stripped.strip()


def _timestamp_to_seconds(timestamp: str) -> int | None:
    match = re.search(r"(?P<time>\d{1,2}:\d{2}(?::\d{2})?)", timestamp or "")
    if not match:
        return None
    parts = [int(part) for part in match.group("time").split(":")]
    if len(parts) == 2:
        minutes, seconds = parts
        return minutes * 60 + seconds
    hours, minutes, seconds = parts
    return hours * 3600 + minutes * 60 + seconds


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
        r"\((?P<ts>\d{1,2}:\d{2}(?::\d{2})?)\)",
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
        rating = str(raw.get("rating", "No")).strip().title()
        if rating not in {"Yes", "No"}:
            rating = "Yes" if rating in {"Fail", "Failed", "Defect"} else "No"

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

    defect_count = sum(1 for attribute in normalized_attributes if attribute["rating"] == "Yes")
    auto_fail = any(
        attribute["rating"] == "Yes"
        and attribute["attribute"] == "Professional Conduct (Auto Fail)"
        for attribute in normalized_attributes
    )
    summary = result.get("summary", {})
    if not isinstance(summary, dict):
        summary = {}

    return {
        "interaction_id": str(result.get("interaction_id") or interaction_id),
        "overall_result": "Fail" if auto_fail or defect_count else "Pass",
        "auto_fail": auto_fail,
        "score": round(((len(normalized_attributes) - defect_count) / len(normalized_attributes)) * 100),
        "engine": engine,
        "prompt_version": "qa-monitoring-v2",
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
