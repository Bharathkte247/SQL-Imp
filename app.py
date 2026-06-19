"""Dependency-free web server for QA monitoring transcript evaluation."""

from __future__ import annotations

import json
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote

from evaluator import RUBRIC, evaluate_interaction, get_llm_config, get_prompt_template


ROOT = Path(__file__).parent
STATIC_DIR = ROOT / "static"


class QaMonitoringHandler(BaseHTTPRequestHandler):
    server_version = "QaMonitoringHTTP/1.0"

    def do_GET(self) -> None:  # noqa: N802 - stdlib hook name
        if self.path in {"/", "/index.html"}:
            self._serve_static("index.html")
            return
        if self.path == "/api/rubric":
            self._send_json(
                {
                    "rubric": RUBRIC,
                    "prompt_template": get_prompt_template(),
                    "prompt_version": "qa-monitoring-v1",
                    "llm_configured": get_llm_config() is not None,
                }
            )
            return
        if self.path.startswith("/static/"):
            self._serve_static(unquote(self.path.removeprefix("/static/")))
            return
        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:  # noqa: N802 - stdlib hook name
        if self.path != "/api/evaluate":
            self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)
            return

        try:
            payload = self._read_json_body()
            interaction_id = str(payload.get("interaction_id", "")).strip()
            transcript = str(payload.get("transcript", "")).strip()
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

            result = evaluate_interaction(interaction_id, transcript)
            self._send_json(result)
        except json.JSONDecodeError:
            self._send_json({"error": "Request body must be valid JSON"}, status=HTTPStatus.BAD_REQUEST)
        except RuntimeError as exc:
            self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
        except Exception as exc:  # pragma: no cover - defensive HTTP boundary
            self._send_json({"error": f"Unexpected server error: {exc}"}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"{self.address_string()} - {format % args}")

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length).decode("utf-8")
        body = json.loads(raw_body or "{}")
        if not isinstance(body, dict):
            raise json.JSONDecodeError("Expected JSON object", raw_body, 0)
        return body

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


def run() -> None:
    host = "0.0.0.0"
    port = 8000
    server = ThreadingHTTPServer((host, port), QaMonitoringHandler)
    print(f"QA Monitoring app running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
