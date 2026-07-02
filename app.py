"""Dependency-free web server for QA monitoring transcript evaluation."""

from __future__ import annotations

import csv
from email.parser import BytesParser
from email.policy import default as email_policy
import io
import json
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from evaluator import (
    RUBRIC,
    check_llm_connectivity,
    evaluate_interaction,
    get_llm_config,
    get_prompt_template,
)


ROOT = Path(__file__).parent
STATIC_DIR = ROOT / "static"
APP_ASSET_VERSION = "20260702-bulk-upload-v3"


class QaMonitoringHandler(BaseHTTPRequestHandler):
    server_version = "QaMonitoringHTTP/1.0"

    def do_GET(self) -> None:  # noqa: N802 - stdlib hook name
        request_path = urlparse(self.path).path
        if request_path in {"/", "/index.html"}:
            self._serve_static("index.html")
            return
        if request_path == "/api/version":
            self._send_json({"version": APP_ASSET_VERSION})
            return
        if request_path == "/api/rubric":
            self._send_json(
                {
                    "rubric": RUBRIC,
                    "prompt_template": get_prompt_template(),
                    "prompt_version": "qa-monitoring-v1",
                    "llm_configured": get_llm_config() is not None,
                }
            )
            return
        if request_path.startswith("/static/"):
            self._serve_static(unquote(request_path.removeprefix("/static/")))
            return
        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:  # noqa: N802 - stdlib hook name
        request_path = urlparse(self.path).path
        if request_path == "/api/llm/connectivity":
            self._handle_llm_connectivity()
            return
        if request_path == "/api/evaluate-bulk":
            self._handle_bulk_evaluation()
            return
        if request_path != "/api/evaluate":
            self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)
            return

        if _content_type_is_bulk_upload(self.headers.get("Content-Type", "")):
            self._handle_bulk_evaluation()
            return

        try:
            payload = self._read_json_body()
            interaction_id = str(payload.get("interaction_id", "")).strip()
            transcript = str(payload.get("transcript", "")).strip()
            llm_config = payload.get("llm_config")
            if llm_config is not None and not isinstance(llm_config, dict):
                self._send_json(
                    {"error": "llm_config must be an object when provided"},
                    status=HTTPStatus.BAD_REQUEST,
                )
                return
            if not interaction_id:
                self._send_json(
                    {"error": "interaction_id is required"},
                    status=HTTPStatus.BAD_REQUEST,
                )
                return
            if not transcript:
                self._send_json(
                    {"error": "transcript is required"},
                    status=HTTPStatus.BAD_REQUEST,
                )
                return

            result = evaluate_interaction(interaction_id, transcript, llm_config=llm_config)
            self._send_json(result)
        except json.JSONDecodeError:
            self._send_json(
                {
                    "error": (
                        "Single interaction evaluation expects JSON with interaction_id and transcript. "
                        "For CSV uploads, use the Bulk evaluation section and refresh the page if needed."
                    )
                },
                status=HTTPStatus.BAD_REQUEST,
            )
        except RuntimeError as exc:
            self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
        except Exception as exc:  # pragma: no cover - defensive HTTP boundary
            self._send_json({"error": f"Unexpected server error: {exc}"}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def _handle_bulk_evaluation(self) -> None:
        try:
            payload = self._read_bulk_body()
            csv_text = str(payload.get("csv_text", "")).strip()
            llm_config = _coerce_llm_config(payload.get("llm_config"))
            if not csv_text:
                self._send_json(
                    {"error": "CSV upload is required. Provide csv_text, csv_file, or a raw text/csv body."},
                    status=HTTPStatus.BAD_REQUEST,
                )
                return

            output_csv = build_bulk_evaluation_csv(csv_text, llm_config)
            self._send_csv(output_csv, filename="qa_bulk_evaluation_output.csv")
        except json.JSONDecodeError:
            self._send_json(
                {
                    "error": (
                        "Bulk upload could not be parsed. Refresh the page to load the latest upload script, "
                        "then upload a CSV file with Interaction ID and Transcript headers."
                    )
                },
                status=HTTPStatus.BAD_REQUEST,
            )
        except csv.Error as exc:
            self._send_json({"error": f"Invalid CSV: {exc}"}, status=HTTPStatus.BAD_REQUEST)
        except ValueError as exc:
            self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except RuntimeError as exc:
            self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
        except Exception as exc:  # pragma: no cover - defensive HTTP boundary
            self._send_json({"error": f"Unexpected server error: {exc}"}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def _handle_llm_connectivity(self) -> None:
        try:
            payload = self._read_json_body()
            llm_config = payload.get("llm_config")
            if llm_config is not None and not isinstance(llm_config, dict):
                self._send_json(
                    {"error": "llm_config must be an object when provided"},
                    status=HTTPStatus.BAD_REQUEST,
                )
                return
            result = check_llm_connectivity(llm_config)
            self._send_json(result, status=HTTPStatus.OK if result.get("ok") else HTTPStatus.BAD_GATEWAY)
        except json.JSONDecodeError:
            self._send_json(
                {"error": "LLM connectivity check expects a JSON request body."},
                status=HTTPStatus.BAD_REQUEST,
            )
        except Exception as exc:  # pragma: no cover - defensive HTTP boundary
            self._send_json({"error": f"Unexpected server error: {exc}"}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"{self.address_string()} - {format % args}")

    def _read_json_body(self) -> dict[str, Any]:
        raw_body = self._read_body_bytes().decode("utf-8")
        body = json.loads(raw_body or "{}")
        if not isinstance(body, dict):
            raise json.JSONDecodeError("Expected JSON object", raw_body, 0)
        return body

    def _read_bulk_body(self) -> dict[str, Any]:
        raw_body = self._read_body_bytes()
        content_type = self.headers.get("Content-Type", "")
        normalized_content_type = content_type.split(";", 1)[0].strip().lower()

        if normalized_content_type == "application/json":
            raw_text = _decode_request_bytes(raw_body)
            try:
                body = json.loads(raw_text or "{}")
            except json.JSONDecodeError as exc:
                if _looks_like_csv(raw_text):
                    return {"csv_text": raw_text}
                raise ValueError(
                    "Bulk upload was sent as application/json but could not be parsed. "
                    "Refresh the page to load the latest upload script, then upload the CSV again."
                ) from exc
            if not isinstance(body, dict):
                raise json.JSONDecodeError("Expected JSON object", raw_text, 0)
            return body

        if normalized_content_type == "multipart/form-data":
            return _parse_multipart_bulk_body(raw_body, content_type)

        if normalized_content_type == "application/x-www-form-urlencoded":
            parsed = parse_qs(_decode_request_bytes(raw_body), keep_blank_values=True)
            return {key: values[-1] if values else "" for key, values in parsed.items()}

        # Accept raw CSV bodies for curl/Postman and for clients that cannot send JSON.
        return {"csv_text": _decode_request_bytes(raw_body)}

    def _read_body_bytes(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0"))
        return self.rfile.read(length)

    def _serve_static(self, relative_path: str) -> None:
        path = (STATIC_DIR / relative_path).resolve()
        try:
            path.relative_to(STATIC_DIR.resolve())
        except ValueError:
            self._send_json({"error": "Invalid static path"}, status=HTTPStatus.BAD_REQUEST)
            return

        if not path.is_file():
            self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)
            return

        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        content = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        content = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_csv(self, content: str, filename: str) -> None:
        encoded = content.encode("utf-8-sig")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def build_bulk_evaluation_csv(csv_text: str, llm_config: dict[str, Any] | None = None) -> str:
    input_buffer = io.StringIO(csv_text)
    reader = csv.DictReader(input_buffer)
    if not reader.fieldnames:
        raise ValueError("CSV must include headers: Interaction ID, Transcript")

    interaction_field = _find_csv_field(reader.fieldnames, "Interaction ID")
    transcript_field = _find_csv_field(reader.fieldnames, "Transcript")
    if not interaction_field or not transcript_field:
        raise ValueError("CSV must include columns named Interaction ID and Transcript")

    output_buffer = io.StringIO()
    fieldnames = _bulk_output_fieldnames()
    writer = csv.DictWriter(output_buffer, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()

    for row_number, input_row in enumerate(reader, start=2):
        interaction_id = str(input_row.get(interaction_field, "")).strip()
        transcript = str(input_row.get(transcript_field, "")).strip()
        if not interaction_id and not transcript:
            continue
        if not interaction_id:
            raise ValueError(f"Row {row_number} is missing Interaction ID")
        if not transcript:
            raise ValueError(f"Row {row_number} is missing Transcript")

        result = evaluate_interaction(interaction_id, transcript, llm_config=llm_config)
        writer.writerow(_bulk_result_row(result))

    return output_buffer.getvalue()


def _parse_multipart_bulk_body(raw_body: bytes, content_type: str) -> dict[str, Any]:
    message_bytes = (
        f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8")
        + raw_body
    )
    message = BytesParser(policy=email_policy).parsebytes(message_bytes)
    if not message.is_multipart():
        raise ValueError("Multipart request did not include form parts")

    payload: dict[str, Any] = {}
    llm_fields: dict[str, Any] = {}
    for part in message.iter_parts():
        disposition = part.get("Content-Disposition", "")
        if "form-data" not in disposition:
            continue
        name = part.get_param("name", header="content-disposition")
        if not name:
            continue

        value = _decode_request_bytes(part.get_payload(decode=True) or b"")
        if name in {"csv_file", "file", "csv", "upload"}:
            payload["csv_text"] = value
        elif name == "csv_text":
            payload["csv_text"] = value
        elif name == "llm_config":
            payload["llm_config"] = value
        elif name.startswith("llm_"):
            llm_fields[name.removeprefix("llm_")] = value

    if "llm_config" not in payload and llm_fields.get("api_key"):
        payload["llm_config"] = {
            "api_key": llm_fields.get("api_key", ""),
            "base_url": llm_fields.get("base_url", ""),
            "model": llm_fields.get("model", ""),
            "temperature": llm_fields.get("temperature", ""),
            "max_retries": llm_fields.get("max_retries", 3),
            "retry_delay": llm_fields.get("retry_delay", 1),
            "timeout_seconds": llm_fields.get("timeout_seconds", 60),
        }

    return payload


def _decode_request_bytes(raw_body: bytes) -> str:
    return raw_body.decode("utf-8-sig", errors="replace")


def _looks_like_csv(text: str) -> bool:
    first_line = text.lstrip("\ufeff\r\n ").splitlines()[0] if text.strip() else ""
    normalized = _normalize_csv_field(first_line)
    return "interactionid" in normalized and "transcript" in normalized


def _content_type_is_bulk_upload(content_type: str) -> bool:
    normalized_content_type = content_type.split(";", 1)[0].strip().lower()
    return normalized_content_type in {
        "multipart/form-data",
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "application/x-www-form-urlencoded",
    }


def _coerce_llm_config(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            parsed = json.loads(stripped)
        except json.JSONDecodeError as exc:
            raise ValueError("llm_config must be a valid JSON object") from exc
        if parsed is None:
            return None
        if isinstance(parsed, dict):
            return parsed
    raise ValueError("llm_config must be an object when provided")


def _bulk_output_fieldnames() -> list[str]:
    fieldnames = ["Interaction ID"]
    for index, item in enumerate(RUBRIC, start=1):
        fieldnames.append(f"{index} {item['sub_attribute']} - Rating")
        fieldnames.append(f"Feedback {index}")
    return fieldnames


def _bulk_result_row(result: dict[str, Any]) -> dict[str, str]:
    output_row: dict[str, str] = {"Interaction ID": str(result.get("interaction_id", ""))}
    attributes = result.get("attributes", [])
    attributes_by_sub_attribute = {
        str(item.get("sub_attribute", "")): item
        for item in attributes
        if isinstance(item, dict)
    }

    for index, rubric_item in enumerate(RUBRIC, start=1):
        sub_attribute = rubric_item["sub_attribute"]
        attribute_result = attributes_by_sub_attribute.get(sub_attribute, {})
        rating = str(attribute_result.get("rating", "No"))
        feedback = ""
        if rating == "Yes":
            feedback_parts = [
                str(attribute_result.get("timestamp", "")).strip(),
                str(attribute_result.get("rationale", "")).strip(),
                str(attribute_result.get("agent_quote", "")).strip(),
                str(attribute_result.get("coaching", "")).strip(),
            ]
            feedback = " | ".join(part for part in feedback_parts if part)

        output_row[f"{index} {sub_attribute} - Rating"] = rating
        output_row[f"Feedback {index}"] = feedback
    return output_row


def _find_csv_field(fieldnames: list[str], expected_name: str) -> str | None:
    expected = _normalize_csv_field(expected_name)
    for fieldname in fieldnames:
        if _normalize_csv_field(fieldname) == expected:
            return fieldname
    return None


def _normalize_csv_field(fieldname: str) -> str:
    return "".join(char for char in fieldname.lower().strip("\ufeff ") if char.isalnum())


def run() -> None:
    host = "0.0.0.0"
    port = 8000
    server = ThreadingHTTPServer((host, port), QaMonitoringHandler)
    print(f"QA Monitoring app running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
