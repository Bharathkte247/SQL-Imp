#!/usr/bin/env python3
"""
Fetch university student results for USNs listed in an Excel file.

Features:
- Reads USNs from Excel
- Opens the results portal in a browser (Selenium)
- Identifies captcha via OCR (Tesseract) and enters it
- Refreshes and retries when the page fails to load
- Retries when captcha is wrong / unreadable
- Saves subject-wise results back to Excel
"""

from __future__ import annotations

import argparse
import logging
import re
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

import pandas as pd
import yaml
from selenium import webdriver
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from captcha_solver import solve_captcha

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("fetch_results")

DEFAULT_CONFIG = Path(__file__).resolve().parent / "config.yaml"


def load_config(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def create_driver(headless: bool, page_load_timeout: int, implicit_wait: int):
    options = ChromeOptions()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1400,1000")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    service = ChromeService(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_page_load_timeout(page_load_timeout)
    driver.implicitly_wait(implicit_wait)
    return driver


def open_results_page(driver, url: str, max_retries: int, delay: float) -> bool:
    """Open the results URL; refresh/retry if loading fails."""
    for attempt in range(1, max_retries + 1):
        try:
            logger.info("Loading results page (attempt %s/%s): %s", attempt, max_retries, url)
            driver.get(url)
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "body"))
            )
            # Basic readiness check: USN field should exist on VTU-style portals
            if _page_looks_ready(driver):
                return True
            logger.warning("Page loaded but form not ready; refreshing...")
            driver.refresh()
        except (TimeoutException, WebDriverException) as exc:
            logger.warning("Page load failed (%s). Refreshing...", exc.__class__.__name__)
            try:
                driver.refresh()
            except WebDriverException:
                pass
        time.sleep(delay)
    return False


def _page_looks_ready(driver) -> bool:
    try:
        driver.find_element(By.CSS_SELECTOR, "input[name='lns'], input[name='usn'], input[type='text']")
        return True
    except NoSuchElementException:
        return False


def _first_matching(driver, css_list: str):
    """Return the first element matching any comma-separated CSS selector."""
    for selector in [s.strip() for s in css_list.split(",") if s.strip()]:
        # Skip jQuery-like :contains which Selenium CSS does not support
        if ":contains" in selector:
            continue
        try:
            return driver.find_element(By.CSS_SELECTOR, selector)
        except NoSuchElementException:
            continue
    raise NoSuchElementException(f"No element matched selectors: {css_list}")


def download_captcha_image(driver, captcha_img_selectors: str, dest: Path) -> Path:
    img = _first_matching(driver, captcha_img_selectors)
    # Prefer element screenshot (works even for dynamic/base64 captchas)
    img.screenshot(str(dest))
    return dest


def enter_usn_and_captcha(
    driver,
    usn: str,
    selectors: dict[str, str],
    captcha_cfg: dict[str, Any],
    max_captcha_retries: int,
    captcha_delay: float,
    manual_captcha: bool,
) -> bool:
    """Fill USN + captcha and submit. Retries captcha on failure."""
    for attempt in range(1, max_captcha_retries + 1):
        try:
            usn_input = _first_matching(driver, selectors["usn_input"])
            usn_input.clear()
            usn_input.send_keys(usn)

            with tempfile.TemporaryDirectory() as tmp:
                captcha_path = Path(tmp) / "captcha.png"
                download_captcha_image(driver, selectors["captcha_image"], captcha_path)

                captcha_text = solve_captcha(
                    captcha_path,
                    whitelist=captcha_cfg.get(
                        "whitelist",
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                    ),
                    min_length=int(captcha_cfg.get("min_length", 4)),
                    max_length=int(captcha_cfg.get("max_length", 8)),
                )

                if not captcha_text and manual_captcha:
                    captcha_text = input(
                        f"[{usn}] OCR failed. Enter captcha shown in browser: "
                    ).strip()

                if not captcha_text:
                    logger.warning(
                        "[%s] Captcha OCR failed (attempt %s/%s); refreshing captcha...",
                        usn,
                        attempt,
                        max_captcha_retries,
                    )
                    _refresh_captcha(driver, selectors)
                    time.sleep(captcha_delay)
                    continue

                captcha_input = _first_matching(driver, selectors["captcha_input"])
                captcha_input.clear()
                captcha_input.send_keys(captcha_text)
                logger.info("[%s] Entered captcha: %s", usn, captcha_text)

            submit = _first_matching(driver, selectors["submit_button"])
            submit.click()
            time.sleep(2)

            if _is_captcha_error(driver):
                logger.warning(
                    "[%s] Wrong captcha (attempt %s/%s); retrying...",
                    usn,
                    attempt,
                    max_captcha_retries,
                )
                # Return to form if needed
                if not _page_looks_ready(driver):
                    driver.back()
                    time.sleep(1)
                _refresh_captcha(driver, selectors)
                time.sleep(captcha_delay)
                continue

            return True

        except (NoSuchElementException, TimeoutException, WebDriverException) as exc:
            logger.warning(
                "[%s] Form interaction failed (%s) attempt %s/%s",
                usn,
                exc,
                attempt,
                max_captcha_retries,
            )
            try:
                driver.refresh()
            except WebDriverException:
                pass
            time.sleep(captcha_delay)

    return False


def _refresh_captcha(driver, selectors: dict[str, str]) -> None:
    refresh_sel = selectors.get("captcha_refresh")
    if not refresh_sel:
        return
    try:
        btn = _first_matching(driver, refresh_sel)
        btn.click()
        time.sleep(0.8)
    except NoSuchElementException:
        # Some portals refresh captcha by reloading the page
        pass


def _is_captcha_error(driver) -> bool:
    page = driver.page_source.lower()
    patterns = [
        "invalid captcha",
        "wrong captcha",
        "captcha does not match",
        "incorrect captcha",
        "enter captcha",
        "captcha code does not match",
    ]
    return any(p in page for p in patterns) and "semester" not in page


def _is_invalid_usn(driver) -> bool:
    page = driver.page_source.lower()
    return any(
        p in page
        for p in (
            "invalid usn",
            "usn not found",
            "university seat number is not available",
            "results are not available",
            "seat number is not available",
        )
    )


def extract_results(driver, usn: str) -> list[dict[str, Any]]:
    """
    Parse result tables from the results page.

    Returns one or more row dicts. Subject rows include subject code/name/marks;
    if only a summary is found, a single summary row is returned.
    """
    if _is_invalid_usn(driver):
        return [{"USN": usn, "Status": "USN/results not available"}]

    student_name = _extract_student_name(driver)
    rows: list[dict[str, Any]] = []

    tables = driver.find_elements(By.CSS_SELECTOR, "table")
    for table in tables:
        headers = [c.text.strip() for c in table.find_elements(By.CSS_SELECTOR, "th")]
        body_rows = table.find_elements(By.CSS_SELECTOR, "tr")
        for tr in body_rows:
            cells = [c.text.strip() for c in tr.find_elements(By.CSS_SELECTOR, "td")]
            if len(cells) < 2:
                continue

            # Typical VTU subject row: Subject Code | Subject Name | Internal | External | Total | Result
            if len(cells) >= 4 and _looks_like_subject_code(cells[0]):
                row = {
                    "USN": usn,
                    "Student Name": student_name,
                    "Subject Code": cells[0],
                    "Subject Name": cells[1] if len(cells) > 1 else "",
                    "Internal": cells[2] if len(cells) > 2 else "",
                    "External": cells[3] if len(cells) > 3 else "",
                    "Total": cells[4] if len(cells) > 4 else "",
                    "Result": cells[5] if len(cells) > 5 else (cells[-1] if cells else ""),
                    "Status": "OK",
                }
                rows.append(row)
            elif headers and len(cells) == len(headers):
                # Generic header-aligned row
                mapped = dict(zip(headers, cells))
                mapped["USN"] = usn
                mapped["Student Name"] = student_name
                mapped["Status"] = "OK"
                rows.append(mapped)

    if not rows:
        # Fallback: dump visible text summary
        body_text = driver.find_element(By.TAG_NAME, "body").text
        snippet = " ".join(body_text.split())[:500]
        rows.append(
            {
                "USN": usn,
                "Student Name": student_name,
                "Status": "Parsed page (no subject table found)",
                "Raw Text": snippet,
            }
        )

    # Attach SGPA / totals if present on page
    sgpa = _extract_labeled_value(driver, r"SGPA\s*[:\-]?\s*([0-9.]+)")
    cgpa = _extract_labeled_value(driver, r"CGPA\s*[:\-]?\s*([0-9.]+)")
    for row in rows:
        if sgpa:
            row["SGPA"] = sgpa
        if cgpa:
            row["CGPA"] = cgpa

    return rows


def _looks_like_subject_code(value: str) -> bool:
    return bool(re.match(r"^[A-Z]{1,4}\d{2}[A-Z0-9]{2,}$", value.strip(), re.I))


def _extract_student_name(driver) -> str:
    text = driver.find_element(By.TAG_NAME, "body").text
    match = re.search(r"Student\s*Name\s*[:\-]?\s*(.+)", text, re.I)
    if match:
        return match.group(1).split("\n")[0].strip()
    return ""


def _extract_labeled_value(driver, pattern: str) -> str:
    text = driver.find_element(By.TAG_NAME, "body").text
    match = re.search(pattern, text, re.I)
    return match.group(1).strip() if match else ""


def read_usns(excel_path: Path, column: str) -> list[str]:
    df = pd.read_excel(excel_path)
    if column not in df.columns:
        # Case-insensitive fallback
        matches = [c for c in df.columns if str(c).strip().lower() == column.lower()]
        if not matches:
            raise ValueError(
                f"Column '{column}' not found in {excel_path}. Columns: {list(df.columns)}"
            )
        column = matches[0]

    usns = (
        df[column]
        .dropna()
        .astype(str)
        .str.strip()
        .str.upper()
        .tolist()
    )
    return [u for u in usns if u and u.lower() != "nan"]


def save_results(rows: list[dict[str, Any]], output_path: Path) -> None:
    if not rows:
        logger.warning("No results to save.")
        return
    df = pd.DataFrame(rows)
    # Prefer a stable column order when present
    preferred = [
        "USN",
        "Student Name",
        "Subject Code",
        "Subject Name",
        "Internal",
        "External",
        "Total",
        "Result",
        "SGPA",
        "CGPA",
        "Status",
        "Raw Text",
        "Error",
    ]
    ordered = [c for c in preferred if c in df.columns] + [
        c for c in df.columns if c not in preferred
    ]
    df = df[ordered]
    df.to_excel(output_path, index=False)
    logger.info("Saved %s result rows to %s", len(df), output_path)


def fetch_one_student(driver, usn: str, cfg: dict[str, Any], manual_captcha: bool) -> list[dict[str, Any]]:
    selectors = cfg["selectors"]
    captcha_cfg = cfg.get("captcha", {})

    if not open_results_page(
        driver,
        cfg["results_url"],
        cfg.get("max_page_retries", 5),
        cfg.get("page_retry_delay_seconds", 3),
    ):
        return [{"USN": usn, "Status": "FAILED", "Error": "Page failed to load after retries"}]

    ok = enter_usn_and_captcha(
        driver,
        usn,
        selectors,
        captcha_cfg,
        cfg.get("max_captcha_retries", 5),
        cfg.get("captcha_retry_delay_seconds", 1),
        manual_captcha=manual_captcha,
    )
    if not ok:
        return [{"USN": usn, "Status": "FAILED", "Error": "Captcha/form submission failed"}]

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table, body"))
        )
    except TimeoutException:
        return [{"USN": usn, "Status": "FAILED", "Error": "Results page timed out"}]

    return extract_results(driver, usn)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch student results from USN Excel list")
    parser.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG,
        help="Path to config.yaml",
    )
    parser.add_argument("--input", type=Path, help="Override input Excel path")
    parser.add_argument("--output", type=Path, help="Override output Excel path")
    parser.add_argument("--url", type=str, help="Override results portal URL")
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run Chrome headless (overrides config)",
    )
    parser.add_argument(
        "--manual-captcha",
        action="store_true",
        help="Ask user to type captcha when OCR fails",
    )
    parser.add_argument(
        "--usn",
        action="append",
        help="Fetch a single USN (can repeat). Skips reading Excel if provided.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    cfg = load_config(args.config)

    if args.input:
        cfg["input_excel"] = str(args.input)
    if args.output:
        cfg["output_excel"] = str(args.output)
    if args.url:
        cfg["results_url"] = args.url
    if args.headless:
        cfg["headless"] = True

    input_path = Path(cfg["input_excel"])
    output_path = Path(cfg["output_excel"])

    if args.usn:
        usns = [u.strip().upper() for u in args.usn]
    else:
        if not input_path.exists():
            logger.error(
                "Input Excel not found: %s\n"
                "Create one with a USN column, or run: python create_sample_excel.py",
                input_path,
            )
            return 1
        usns = read_usns(input_path, cfg.get("usn_column", "USN"))

    if not usns:
        logger.error("No USNs found to process.")
        return 1

    logger.info("Processing %s student(s). Portal: %s", len(usns), cfg["results_url"])

    driver = None
    all_rows: list[dict[str, Any]] = []
    try:
        driver = create_driver(
            headless=bool(cfg.get("headless", False)),
            page_load_timeout=int(cfg.get("page_load_timeout", 30)),
            implicit_wait=int(cfg.get("implicit_wait", 5)),
        )

        for index, usn in enumerate(usns, start=1):
            logger.info("==== (%s/%s) USN: %s ====", index, len(usns), usn)
            try:
                rows = fetch_one_student(driver, usn, cfg, manual_captcha=args.manual_captcha)
            except Exception as exc:  # noqa: BLE001 - keep batch running
                logger.exception("Unexpected error for %s", usn)
                rows = [{"USN": usn, "Status": "FAILED", "Error": str(exc)}]

            all_rows.extend(rows)
            # Incremental save so progress is not lost
            save_results(all_rows, output_path)

            if index < len(usns):
                time.sleep(float(cfg.get("delay_between_students_seconds", 2)))

    finally:
        if driver is not None:
            driver.quit()

    save_results(all_rows, output_path)
    failed = sum(1 for r in all_rows if r.get("Status") == "FAILED")
    logger.info("Done. Rows=%s Failed-status rows=%s Output=%s", len(all_rows), failed, output_path)
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
