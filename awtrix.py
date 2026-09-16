"""AWTRIX HTTP helpers for Daily Prompt."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

import requests

TIMEOUT_S = 4.0


def hex_to_rgb(hex_color: str) -> list[int]:
    cleaned = hex_color.replace("#", "").strip()
    if len(cleaned) == 3:
        cleaned = "".join(c * 2 for c in cleaned)
    if not re.fullmatch(r"[0-9a-fA-F]{6}", cleaned):
        return [255, 107, 138]
    value = int(cleaned, 16)
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255]


def normalize_base_url(ip_or_url: str) -> str:
    trimmed = ip_or_url.strip().rstrip("/")
    if re.match(r"^https?://", trimmed, re.I):
        return trimmed
    return f"http://{trimmed}"


def _post(url: str, payload: dict[str, Any]) -> tuple[bool, str]:
    try:
        response = requests.post(url, json=payload, timeout=TIMEOUT_S)
        if response.ok:
            return True, url
        body = (response.text or "").strip()
        return False, body or f"HTTP {response.status_code}"
    except requests.Timeout:
        return False, f"Device did not respond within {int(TIMEOUT_S)}s"
    except requests.RequestException as exc:
        return False, str(exc)


def send_to_awtrix(
    ip_or_url: str,
    path: str,
    payload: dict[str, Any],
    relay_url: str | None = None,
) -> tuple[bool, str]:
    endpoints: list[str] = []
    if ip_or_url.strip():
        endpoints.append(f"{normalize_base_url(ip_or_url)}{path}")
    if relay_url and relay_url.strip():
        relay = normalize_base_url(relay_url)
        endpoints.append(relay if "/api/" in relay else f"{relay}{path}")

    if not endpoints:
        return False, "No clock URL set. Add the IP in the sidebar."

    last_error = "All endpoints failed"
    for endpoint in endpoints:
        ok, detail = _post(endpoint, payload)
        if ok:
            return True, detail
        last_error = detail
    return False, last_error


def test_connection(ip_or_url: str, relay_url: str | None = None) -> tuple[bool, str]:
    return send_to_awtrix(
        ip_or_url,
        "/api/notify",
        {
            "text": "Hello Love!",
            "color": [255, 107, 138],
            "duration": 8,
            "wakeup": True,
            "repeat": 2,
        },
        relay_url=relay_url,
    )


def push_question(
    ip_or_url: str,
    text: str,
    color_hex: str = "#FF6B8A",
    relay_url: str | None = None,
    app_name: str = "daily_question",
) -> tuple[bool, str]:
    payload = {
        "text": text[:120],
        "color": hex_to_rgb(color_hex),
        "duration": 10,
        "repeat": -1,
        "rainbow": False,
        "wakeup": True,
    }
    ok, detail = send_to_awtrix(
        ip_or_url,
        f"/api/custom?name={quote(app_name)}",
        payload,
        relay_url=relay_url,
    )
    if ok:
        return True, detail

    # Fallback notification if custom app fails
    notify_ok, notify_detail = send_to_awtrix(
        ip_or_url,
        "/api/notify",
        {
            "text": text[:120],
            "color": hex_to_rgb(color_hex),
            "duration": 12,
            "wakeup": True,
            "repeat": 3,
        },
        relay_url=relay_url,
    )
    if notify_ok:
        return True, notify_detail
    return False, detail
