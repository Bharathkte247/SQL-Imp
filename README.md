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

- `Yes`: the defect/subattribute was observed and should be counted as a QA miss.
- `No`: the defect/subattribute was not observed in the transcript.

For every `Yes`, the output includes a rationale, timestamp, agent quote, and
coaching. If the transcript has no timestamp, the app/prompt uses
`No timestamp present` rather than inventing one.

## Run locally

The app uses only the Python standard library.

```bash
python3 app.py
```

Open `http://localhost:8000`.

## Configure LLM evaluation

### Option 1: Paste the key in the browser

Run the app:

```bash
python3 app.py
```

Open `http://localhost:8000`, expand **LLM Configuration**, and enter:

- LiteLLM / OpenAI base URL: `https://litellm-stg.cloud.247-inc.net`
- Model: `gpt-41-mini`
- API key: your LiteLLM API key
- Temperature: `0.2`

The key is sent only with the evaluation request and is not committed to the
repository.

Click **Test LLM connection** before evaluating. This checks whether the machine
running `python3 app.py` can open a TCP connection to the LiteLLM host. It does
not call the model or spend tokens.

When LLM evaluation is enabled, the app uses a hybrid result: the LLM can add
nuanced defects, and calibrated local-rule defects are enforced as guardrails so
the API result does not clear issues the local evaluator detects.

### Option 2: Set environment variables

Set an API key before starting the app:

```bash
export QA_LLM_API_KEY="your-api-key"
export QA_LLM_BASE_URL="https://litellm-stg.cloud.247-inc.net"
export QA_LLM_MODEL="gpt-41-mini"
export QA_LLM_TEMPERATURE="0.2"
python3 app.py
```

Optional environment variables:

```bash
export QA_LLM_API_URL="https://api.openai.com/v1/chat/completions"
export QA_LLM_BASE_URL="https://litellm-stg.cloud.247-inc.net"
export QA_LLM_MODEL="gpt-41-mini"
export QA_LLM_TIMEOUT_SECONDS="60"
export QA_LLM_MAX_RETRIES="3"
export QA_LLM_RETRY_DELAY="1"
export QA_LLM_TEMPERATURE="0.2"
```

`QA_LLM_API_KEY` is preferred. `OPENAI_API_KEY` is also supported.
When `QA_LLM_BASE_URL` is provided, the app automatically calls
`/v1/chat/completions`.

### Troubleshooting LLM network errors

If you see an error like:

```text
Unable to reach LLM provider: [WinError 10060] A connection attempt failed...
```

the Python server could not connect to the LiteLLM host. Common causes:

- VPN or corporate network is not connected.
- Firewall/proxy blocks outbound access to `litellm-stg.cloud.247-inc.net:443`.
- The app is running in an environment that cannot reach internal staging
  services, such as a cloud VM outside the corporate network.
- The base URL is incorrect.

From the same machine running `python3 app.py`, verify connectivity:

Windows PowerShell:

```powershell
Test-NetConnection litellm-stg.cloud.247-inc.net -Port 443
```

Python:

```bash
python -c "import socket; socket.create_connection(('litellm-stg.cloud.247-inc.net', 443), timeout=10); print('connected')"
```

If these fail, connect to the required VPN/network or configure the required
proxy/firewall allowlist. The app will continue to work in local rules mode when
the API key is blank.

Without an API key, the app still runs in `local_heuristic` mode. The local
rules evaluator checks common QA defects, including missed apology/empathy,
unclear willingness to assist, repeated questions, misunderstanding, grammar or
spelling issues, greeting/authentication/closing indicators, follow-up handling,
documentation flags, profanity, PII, unauthorized tools, and full credit card
numbers. Use LLM mode for nuanced production QA, policy interpretation, and
transcript-specific judgment.

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

## Bulk CSV evaluation

Use the **Bulk evaluation** section in the browser to upload a CSV with exactly
these required headers:

```csv
Interaction ID,Transcript
INT-1001,"[00:00] Agent: Thank you for calling..."
```

The app evaluates one interaction per input row. If an API key is entered in
**LLM Configuration**, each interaction is sent to the LLM one at a time. If the
API key is blank, the same bulk flow runs in local rules mode, which is useful
while the external LiteLLM endpoint is unreachable.

The browser uploads the file as `multipart/form-data`. The `/api/evaluate-bulk`
endpoint also accepts JSON bodies with `csv_text` and raw `text/csv` bodies for
API clients.

The downloaded output CSV is wide:

```text
Interaction ID,
1 Fails to/misses apology due to error or inconvenience - Rating,
Feedback 1,
2 Uses excessive apologies - Rating,
Feedback 2,
...
```

Ratings follow the calibrated scorecard convention:

- `Yes` = the defect/subattribute was observed.
- `No` = the defect/subattribute was not observed.

Feedback is populated only when the rating is `Yes`, because that is the case
where the subattribute/expectation was not met. Feedback includes timestamp,
rationale, agent quote, and coaching when available.

## Prompt tuning

The prompt is in `prompts/qa_monitoring_prompt.md`. It includes:

- rating semantics;
- double-dip prevention rules;
- timestamp requirements;
- special handling for authentication, misunderstanding, grammar/spelling, KB
  usage, documentation, PII, and credit card auto-fail checks;
- the required JSON output schema.

To tune behavior, update this file and restart the app. Good tuning candidates
include adding policy-specific terminology examples, known KB usage triggers,
approved follow-up phrasing, and examples of correct/incorrect authentication.

## Run tests

```bash
python3 -m unittest
```
