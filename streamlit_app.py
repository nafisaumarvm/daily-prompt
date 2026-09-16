"""
Daily Prompt — Streamlit app for Ulanzi TC001 (AWTRIX 3).

Recommended gift setup (always-on, no laptop):
  Streamlit Cloud (HTTPS)  →  HiveMQ Cloud (MQTT)  →  AWTRIX clock (home Wi‑Fi)

The clock connects *out* to HiveMQ, so nothing needs to run on your laptop.
"""

from __future__ import annotations

import json

import streamlit as st

from awtrix import push_question as push_http
from awtrix import test_connection as test_http
from mqtt_awtrix import (
    mqtt_configured,
    push_question_mqtt,
    test_connection_mqtt,
)
from questions_data import (
    CATEGORIES,
    activate,
    active_question,
    add_question,
    advance_daily,
    build_seed_questions,
    delete_question,
)

st.set_page_config(
    page_title="Daily Prompt",
    page_icon="💌",
    layout="centered",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Figtree:wght@400;500;600;700&display=swap');

html, body, [class*="css"] {
  font-family: 'Figtree', sans-serif;
}

.stApp {
  background:
    radial-gradient(ellipse 90% 55% at 8% -10%, rgba(232,90,122,0.18), transparent 55%),
    radial-gradient(ellipse 70% 45% at 100% 0%, rgba(196,165,116,0.22), transparent 50%),
    linear-gradient(180deg, #fff8fa 0%, #faf4f6 45%, #f7ebe8 100%);
}

h1, h2, h3, .brand-title {
  font-family: 'Cormorant Garamond', Georgia, serif !important;
  color: #2a1520 !important;
}

.block-container { padding-top: 1.5rem; max-width: 720px; }

.hero-card, .q-card {
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(42,21,32,0.10);
  border-radius: 1.25rem;
  padding: 1.25rem 1.35rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 40px rgba(42,21,32,0.06);
}

.eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
  color: #e85a7a;
  margin-bottom: 0.35rem;
}

.active-text {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.75rem;
  line-height: 1.25;
  color: #2a1520;
  margin: 0.4rem 0 0.8rem;
}

.matrix {
  background: #141012;
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  color: #f3a0b3;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  overflow: hidden;
  white-space: nowrap;
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 16px 40px rgba(28,12,16,0.28);
}

.matrix-label {
  color: rgba(255,255,255,0.45);
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 0.45rem;
}

.hint {
  color: #8a6a76;
  font-size: 0.92rem;
  line-height: 1.45;
}

div.stButton > button[kind="primary"] {
  background: #e85a7a;
  border: none;
  color: white;
  font-weight: 600;
}
</style>
""",
    unsafe_allow_html=True,
)


def _secret(name: str, default: str = "") -> str:
    try:
        return str(st.secrets.get(name, default) or default)
    except Exception:
        return default


def init_state() -> None:
    if "questions" not in st.session_state:
        st.session_state.questions = build_seed_questions()
    if "transport" not in st.session_state:
        st.session_state.transport = (
            "HiveMQ MQTT" if mqtt_configured() else "Local HTTP"
        )
    if "mqtt_prefix" not in st.session_state:
        st.session_state.mqtt_prefix = _secret("AWTRIX_MQTT_PREFIX", "awtrix_9b9304")
    if "hivemq_host" not in st.session_state:
        st.session_state.hivemq_host = _secret("HIVEMQ_HOST")
    if "hivemq_user" not in st.session_state:
        st.session_state.hivemq_user = _secret("HIVEMQ_USERNAME")
    if "hivemq_pass" not in st.session_state:
        st.session_state.hivemq_pass = _secret("HIVEMQ_PASSWORD")
    if "hivemq_port" not in st.session_state:
        st.session_state.hivemq_port = int(_secret("HIVEMQ_PORT", "8883") or 8883)
    if "clock_url" not in st.session_state:
        st.session_state.clock_url = _secret("CLOCK_URL", "192.168.1.123")
    if "relay_url" not in st.session_state:
        st.session_state.relay_url = _secret("CLOCK_RELAY_URL")
    if "toast" not in st.session_state:
        st.session_state.toast = None


def do_test() -> tuple[bool, str]:
    if st.session_state.transport.startswith("HiveMQ"):
        return test_connection_mqtt(
            st.session_state.mqtt_prefix,
            host=st.session_state.hivemq_host,
            port=st.session_state.hivemq_port,
            username=st.session_state.hivemq_user,
            password=st.session_state.hivemq_pass,
        )
    return test_http(st.session_state.clock_url, st.session_state.relay_url or None)


def do_push(text: str, color_hex: str) -> tuple[bool, str]:
    if st.session_state.transport.startswith("HiveMQ"):
        return push_question_mqtt(
            st.session_state.mqtt_prefix,
            text,
            color_hex,
            host=st.session_state.hivemq_host,
            port=st.session_state.hivemq_port,
            username=st.session_state.hivemq_user,
            password=st.session_state.hivemq_pass,
        )
    return push_http(
        st.session_state.clock_url,
        text,
        color_hex,
        st.session_state.relay_url or None,
    )


def sidebar() -> None:
    with st.sidebar:
        st.markdown("### Connection")
        st.session_state.transport = st.radio(
            "How to reach the clock",
            ["HiveMQ MQTT", "Local HTTP"],
            index=0 if st.session_state.transport.startswith("HiveMQ") else 1,
            help="HiveMQ = always-on from Streamlit Cloud. Local HTTP = laptop on same Wi‑Fi.",
        )

        if st.session_state.transport.startswith("HiveMQ"):
            st.caption(
                "Clock stays connected to HiveMQ on its own. "
                "No laptop / tunnel needed. See `HIVEMQ_SETUP.md`."
            )
            st.session_state.hivemq_host = st.text_input(
                "HiveMQ host",
                value=st.session_state.hivemq_host,
                placeholder="xxxx.s1.eu.hivemq.cloud",
            )
            st.session_state.hivemq_port = st.number_input(
                "Port",
                min_value=1,
                max_value=65535,
                value=int(st.session_state.hivemq_port or 8883),
            )
            st.session_state.hivemq_user = st.text_input(
                "Username", value=st.session_state.hivemq_user
            )
            st.session_state.hivemq_pass = st.text_input(
                "Password", value=st.session_state.hivemq_pass, type="password"
            )
            st.session_state.mqtt_prefix = st.text_input(
                "AWTRIX MQTT prefix",
                value=st.session_state.mqtt_prefix,
                help="From AWTRIX stats / MQTT settings, e.g. awtrix_9b9304",
            )
        else:
            st.caption("Works only when this Streamlit process can reach the clock IP.")
            st.session_state.clock_url = st.text_input(
                "Clock IP or URL",
                value=st.session_state.clock_url,
                placeholder="192.168.1.123",
            )
            st.session_state.relay_url = st.text_input(
                "Fallback relay URL (optional)",
                value=st.session_state.relay_url,
            )

        c1, c2 = st.columns(2)
        with c1:
            if st.button("Test connection", use_container_width=True):
                ok, detail = do_test()
                if ok:
                    st.success(detail)
                    if st.session_state.transport.startswith("HiveMQ"):
                        st.warning(
                            "Broker accepted the message. If the clock stays on Time "
                            "and shows nothing, the clock is not subscribed to that topic "
                            "(wrong MQTT prefix, MQTT not connected on AWTRIX, or HiveMQ permissions)."
                        )
                else:
                    st.error(detail)
        with c2:
            if st.button("Next daily", use_container_width=True):
                st.session_state.questions = advance_daily(st.session_state.questions)
                active = active_question(st.session_state.questions)
                if active:
                    ok, detail = do_push(active["text"], active["color_hex"])
                    st.session_state.toast = (
                        "Advanced & pushed" if ok else f"Advanced, push failed: {detail}"
                    )
                st.rerun()

        if st.session_state.transport.startswith("HiveMQ"):
            prefix = (st.session_state.mqtt_prefix or "").strip() or "awtrix_XXXXXX"
            with st.expander("Clock stuck on Time? Read this"):
                st.markdown(
                    f"""
1. **Streamlit success ≠ clock received it.** It only means HiveMQ got the publish.
2. On the clock web UI → **MQTT**: must show connected (often a green MQTT indicator).
3. Prefix in Streamlit must match AWTRIX exactly. We publish to:
   - `{prefix}/notify`
   - `{prefix}/custom/daily_question`
4. Open `http://CLOCK_IP/api/stats` → copy `uid` into **AWTRIX MQTT prefix**.
5. In **HiveMQ Cloud → Access Management**: allow this user to publish & subscribe on `#` (or at least `{prefix}/#`).
6. If the display is frozen: power-cycle the Ulanzi. If still stuck, temporarily **disable MQTT** in AWTRIX, save, reboot — normal apps should return — then re-enable with the correct broker settings.
7. Quick LAN check: switch sidebar to **Local HTTP**, set `192.168.x.x`, Test — if that works, HiveMQ/prefix is the problem.
                    """
                )

        st.divider()
        st.markdown("### Backup")
        st.download_button(
            "Download questions JSON",
            data=json.dumps(st.session_state.questions, indent=2),
            file_name="daily-prompt-questions.json",
            mime="application/json",
            use_container_width=True,
        )
        uploaded = st.file_uploader("Restore from JSON", type=["json"])
        if uploaded is not None:
            try:
                data = json.loads(uploaded.read().decode("utf-8"))
                if isinstance(data, list) and data:
                    st.session_state.questions = data
                    st.success(f"Loaded {len(data)} questions")
                    st.rerun()
            except Exception as exc:
                st.error(f"Could not load file: {exc}")

        if st.button("Reset to 50 starter questions", use_container_width=True):
            st.session_state.questions = build_seed_questions()
            st.rerun()


def main() -> None:
    init_state()
    sidebar()

    st.markdown('<p class="eyebrow">For your forever mornings</p>', unsafe_allow_html=True)
    st.markdown('<h1 class="brand-title">Daily Prompt</h1>', unsafe_allow_html=True)
    mode = (
        "via HiveMQ · works from anywhere"
        if st.session_state.transport.startswith("HiveMQ")
        else "via local HTTP · same Wi‑Fi only"
    )
    st.markdown(
        f'<p class="hint">Add questions on your phone, then push one to the Ulanzi. Currently {mode}.</p>',
        unsafe_allow_html=True,
    )

    if st.session_state.toast:
        st.info(st.session_state.toast)
        st.session_state.toast = None

    questions = st.session_state.questions
    active = active_question(questions)
    preview = active["text"] if active else "Add your first question…"
    color = active["color_hex"] if active else "#FF6B8A"

    st.markdown(
        f"""
        <div class="matrix">
          <div class="matrix-label">Ulanzi preview · {color}</div>
          <div>❤  {preview}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.write("")

    st.markdown('<div class="hero-card">', unsafe_allow_html=True)
    st.markdown('<p class="eyebrow">Current active question</p>', unsafe_allow_html=True)
    st.markdown(
        f'<p class="active-text">{active["text"] if active else "Nothing active yet"}</p>',
        unsafe_allow_html=True,
    )

    b1, b2 = st.columns([1.2, 1])
    with b1:
        if st.button(
            "Push to board now",
            type="primary",
            use_container_width=True,
            disabled=not active,
        ):
            assert active is not None
            ok, detail = do_push(active["text"], active["color_hex"])
            if ok:
                st.success(f"Pushed ({detail})")
            else:
                st.error(detail)
    with b2:
        st.caption(
            "HiveMQ mode: laptop can be off. "
            "Clock only needs home Wi‑Fi + MQTT settings."
        )
    st.markdown("</div>", unsafe_allow_html=True)

    st.write("")
    st.subheader("Add a question")
    with st.form("add_question", clear_on_submit=True):
        text = st.text_area(
            "Prompt", max_chars=120, placeholder="What made you smile about us today?"
        )
        c1, c2 = st.columns(2)
        with c1:
            category = st.selectbox("Category", CATEGORIES, index=0)
        with c2:
            color_hex = st.color_picker("LED color", "#FF6B8A")
        submitted = st.form_submit_button("Save question", use_container_width=True)
        if submitted:
            try:
                st.session_state.questions = add_question(
                    st.session_state.questions, text, category, color_hex
                )
                st.success("Saved")
                st.rerun()
            except ValueError as exc:
                st.error(str(exc))

    st.subheader("Question bank")
    filter_mode = st.radio(
        "Show",
        ["Upcoming", "Archive", "All"],
        horizontal=True,
        label_visibility="collapsed",
    )

    def visible(q: dict) -> bool:
        if filter_mode == "Upcoming":
            return bool(q.get("is_active") or not q.get("shown_at"))
        if filter_mode == "Archive":
            return bool(q.get("shown_at") and not q.get("is_active"))
        return True

    filtered = [q for q in questions if visible(q)]
    if not filtered:
        st.caption("No questions in this view.")

    for q in filtered:
        with st.container(border=True):
            top = st.columns([0.15, 3.2, 1.1, 1.1, 0.7])
            with top[0]:
                st.markdown(
                    f"<div style='width:12px;height:12px;border-radius:50%;background:{q['color_hex']};margin-top:0.55rem'></div>",
                    unsafe_allow_html=True,
                )
            with top[1]:
                badge = " · **ACTIVE**" if q.get("is_active") else ""
                st.markdown(f"**{q['category']}**{badge}  \n{q['text']}")
            with top[2]:
                if st.button("Push", key=f"push_{q['id']}", use_container_width=True):
                    st.session_state.questions = activate(
                        st.session_state.questions, q["id"]
                    )
                    ok, detail = do_push(q["text"], q["color_hex"])
                    st.session_state.toast = "Pushed" if ok else detail
                    st.rerun()
            with top[3]:
                if st.button("Activate", key=f"act_{q['id']}", use_container_width=True):
                    st.session_state.questions = activate(
                        st.session_state.questions, q["id"]
                    )
                    st.rerun()
            with top[4]:
                if st.button("✕", key=f"del_{q['id']}", use_container_width=True):
                    st.session_state.questions = delete_question(
                        st.session_state.questions, q["id"]
                    )
                    st.rerun()


if __name__ == "__main__":
    main()
