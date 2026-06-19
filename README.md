# QA Monitoring Web App

This repository contains a lightweight web application for auditing BJ's member
support chat or voice transcripts. The app accepts an interaction ID and
transcript, evaluates the transcript against the QA monitoring rubric, and
returns a yes/no rating for every subattribute with timestamped rationale for
defects.

## What the app provides

- Browser form for interaction ID and transcript input.
- JSON API endpoint for automated transcript evaluation.
- Full rubric coverage across:
  - Soft Skills
  - Communication Skills
  - Call Handling Basics
  - Completing the Call
  - Professional Conduct auto-fail items
- Tunable LLM prompt at `prompts/qa_monitoring_prompt.md`.
- OpenAI-compatible LLM integration when configured.
- Rules-based local evaluator when no LLM key is configured.

## Rating semantics

Each subattribute is rated:

- `Yes`: the agent complied with the expectation, or no transcript evidence of
  the defect exists.
- `No`: the agent failed the expectation or the defect occurred.

For every `No`, the output includes a rationale, timestamp, agent quote, and
coaching. If the transcript has no timestamp, the app/prompt uses
`No timestamp present` rather than inventing one.

## Run locally

The app uses only the Python standard library.

```bash
python3 app.py
```

Open `http://localhost:8000`.

## Configure LLM evaluation

Set an API key before starting the app:

```bash
export QA_LLM_API_KEY="your-api-key"
python3 app.py
```

Optional environment variables:

```bash
export QA_LLM_API_URL="https://api.openai.com/v1/chat/completions"
export QA_LLM_MODEL="gpt-4o-mini"
export QA_LLM_TIMEOUT_SECONDS="60"
```

`QA_LLM_API_KEY` is preferred. `OPENAI_API_KEY` is also supported.

Without an API key, the app still runs in `local_heuristic` mode. The local
rules evaluator checks common QA defects, including missed apology/empathy,
unclear willingness to assist, repeated questions, hold handling, greeting,
authentication indicators, follow-up handling, documentation flags, profanity,
PII, unauthorized tools, and full credit card numbers. Use LLM mode for nuanced
production QA, policy interpretation, and transcript-specific judgment.

## API usage

Evaluate a transcript:

```bash
curl -X POST http://localhost:8000/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "interaction_id": "INT-1001",
    "transcript": "[00:00] Agent: Thank you for calling BJ'\''s Member Care..."
  }'
```

Fetch the rubric and prompt template:

```bash
curl http://localhost:8000/api/rubric
```

## Prompt tuning

The prompt is in `prompts/qa_monitoring_prompt.md`. It includes:

- rating semantics;
- double-dip prevention rules;
- timestamp requirements;
- special handling for authentication, hold usage, KB usage, documentation, PII,
  and credit card auto-fail checks;
- the required JSON output schema.

To tune behavior, update this file and restart the app. Good tuning candidates
include adding policy-specific terminology examples, known KB usage triggers,
approved follow-up phrasing, and examples of correct/incorrect authentication.

## Run tests

```bash
python3 -m unittest
```
