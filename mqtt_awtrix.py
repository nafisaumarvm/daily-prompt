"""Publish Daily Prompt messages to AWTRIX via HiveMQ Cloud (MQTT)."""

from __future__ import annotations

import json
import ssl
import time
from typing import Any

import paho.mqtt.client as mqtt

from awtrix import hex_to_rgb


def _secret(name: str, default: str = "") -> str:
    try:
        import streamlit as st

        return str(st.secrets.get(name, default) or default)
    except Exception:
        return default


def mqtt_configured(host: str | None = None, username: str | None = None) -> bool:
    h = (host if host is not None else _secret("HIVEMQ_HOST")).strip()
    u = (username if username is not None else _secret("HIVEMQ_USERNAME")).strip()
    return bool(h and u)


def publish_json(
    topic: str,
    payload: dict[str, Any],
    *,
    host: str | None = None,
    port: int | None = None,
    username: str | None = None,
    password: str | None = None,
) -> tuple[bool, str]:
    host = (host if host is not None else _secret("HIVEMQ_HOST")).strip()
    username = (username if username is not None else _secret("HIVEMQ_USERNAME")).strip()
    password = password if password is not None else _secret("HIVEMQ_PASSWORD")
    port = int(port if port is not None else (_secret("HIVEMQ_PORT", "8883") or 8883))

    if not host or not username:
        return False, "HiveMQ not configured (need host + username)"

    body = json.dumps(payload)
    result: dict[str, Any] = {"ok": False, "error": "MQTT publish timed out"}

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id=f"daily-prompt-{int(time.time())}",
        protocol=mqtt.MQTTv311,
    )
    client.username_pw_set(username, password or None)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
    client.tls_insecure_set(False)

    def on_connect(client, userdata, flags, reason_code, properties=None):
        failed = False
        if hasattr(reason_code, "is_failure"):
            failed = bool(reason_code.is_failure)
        else:
            code = getattr(reason_code, "value", reason_code)
            failed = code not in (0, "Success")

        if failed:
            result["error"] = f"MQTT connect failed: {reason_code}"
            client.disconnect()
            return

        info = client.publish(topic, body, qos=1)
        if info.rc != mqtt.MQTT_ERR_SUCCESS:
            result["error"] = f"MQTT publish error code {info.rc}"
            client.disconnect()

    def on_publish(client, userdata, mid, reason_codes=None, properties=None):
        result["ok"] = True
        result["error"] = f"mqtt://{host}/{topic}"
        client.disconnect()

    client.on_connect = on_connect
    client.on_publish = on_publish

    try:
        client.connect(host, port, keepalive=30)
        client.loop_start()
        deadline = time.time() + 8
        while time.time() < deadline and not result["ok"] and "connect failed" not in result["error"]:
            time.sleep(0.05)
        client.loop_stop()
        try:
            client.disconnect()
        except Exception:
            pass
    except Exception as exc:
        return False, str(exc)

    return bool(result["ok"]), str(result["error"])


def prefix_for(device_prefix: str) -> str:
    p = device_prefix.strip().rstrip("/")
    if not p:
        p = _secret("AWTRIX_MQTT_PREFIX", "awtrix_9b9304")
    return p


def test_connection_mqtt(
    device_prefix: str,
    *,
    host: str | None = None,
    port: int | None = None,
    username: str | None = None,
    password: str | None = None,
) -> tuple[bool, str]:
    topic = f"{prefix_for(device_prefix)}/notify"
    return publish_json(
        topic,
        {
            "text": "Hello Love!",
            "color": [255, 107, 138],
            "duration": 8,
            "wakeup": True,
            "repeat": 2,
        },
        host=host,
        port=port,
        username=username,
        password=password,
    )


def push_question_mqtt(
    device_prefix: str,
    text: str,
    color_hex: str = "#FF6B8A",
    *,
    host: str | None = None,
    port: int | None = None,
    username: str | None = None,
    password: str | None = None,
) -> tuple[bool, str]:
    prefix = prefix_for(device_prefix)
    payload = {
        "text": text[:120],
        "color": hex_to_rgb(color_hex),
        "duration": 10,
        "repeat": -1,
        "rainbow": False,
        "wakeup": True,
    }
    ok, detail = publish_json(
        f"{prefix}/custom/daily_question",
        payload,
        host=host,
        port=port,
        username=username,
        password=password,
    )
    if ok:
        return True, detail

    notify_ok, notify_detail = publish_json(
        f"{prefix}/notify",
        {
            "text": text[:120],
            "color": hex_to_rgb(color_hex),
            "duration": 12,
            "wakeup": True,
            "repeat": 3,
        },
        host=host,
        port=port,
        username=username,
        password=password,
    )
    if notify_ok:
        return True, notify_detail
    return False, detail
