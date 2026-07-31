"""Captcha image preprocessing and OCR helpers."""

from __future__ import annotations

import logging
import re
from pathlib import Path

import cv2
import numpy as np
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


def _to_cv_image(image_path: str | Path) -> np.ndarray:
    data = np.fromfile(str(image_path), dtype=np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Unable to read captcha image: {image_path}")
    return image


def preprocess_captcha(image_path: str | Path) -> list[np.ndarray]:
    """Return several preprocessed variants to improve OCR hit rate."""
    image = _to_cv_image(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Upscale small captcha images
    gray = cv2.resize(gray, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)

    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    _, thresh_inv = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    kernel = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    cleaned_inv = cv2.morphologyEx(thresh_inv, cv2.MORPH_CLOSE, kernel)

    adaptive = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

    return [gray, thresh, thresh_inv, cleaned, cleaned_inv, adaptive]


def solve_captcha(
    image_path: str | Path,
    whitelist: str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    min_length: int = 4,
    max_length: int = 8,
) -> str | None:
    """
    Identify captcha text from an image using Tesseract OCR.

    Tries multiple preprocessing variants and OCR configs, then returns the
    best alphanumeric candidate within the expected length range.
    """
    configs = [
        f"--psm 7 -c tessedit_char_whitelist={whitelist}",
        f"--psm 8 -c tessedit_char_whitelist={whitelist}",
        f"--psm 13 -c tessedit_char_whitelist={whitelist}",
    ]

    candidates: list[str] = []
    for variant in preprocess_captcha(image_path):
        pil_image = Image.fromarray(variant)
        for config in configs:
            try:
                text = pytesseract.image_to_string(pil_image, config=config)
            except pytesseract.TesseractError as exc:
                logger.warning("Tesseract failed: %s", exc)
                continue

            cleaned = re.sub(r"[^A-Za-z0-9]", "", text).strip()
            if min_length <= len(cleaned) <= max_length:
                candidates.append(cleaned)

    if not candidates:
        logger.warning("OCR could not read captcha from %s", image_path)
        return None

    # Prefer the most common reading
    best = max(set(candidates), key=candidates.count)
    logger.info("Captcha OCR candidates=%s selected=%s", candidates, best)
    return best
