# Daily Prompt (Streamlit + HiveMQ)

Wedding gift app: manage daily questions on a public webpage and push them to a
**Ulanzi TC001** (AWTRIX 3).

## Recommended always-on setup (no laptop)

```
Phone  →  Streamlit Cloud (HTTPS)  →  HiveMQ Cloud (MQTT)  →  Clock on home Wi‑Fi
```

The clock connects **out** to HiveMQ. Your laptop can be off.

Full steps: **[HIVEMQ_SETUP.md](./HIVEMQ_SETUP.md)**

---

## Quick local run

```bash
cd "/Users/nafisaumar/Jeya Wedding"
python3 -m pip install -r requirements.txt
python3 -m streamlit run streamlit_app.py --server.address 0.0.0.0
```

- Local: http://localhost:8501  
- Phone on same Wi‑Fi: use the Network URL Streamlit prints  

Sidebar → choose **HiveMQ MQTT** (cloud) or **Local HTTP** (LAN IP).

---

## Files

| File | Role |
|---|---|
| `streamlit_app.py` | Website |
| `mqtt_awtrix.py` | HiveMQ → AWTRIX publisher |
| `awtrix.py` | Direct HTTP → AWTRIX (home LAN) |
| `questions_data.py` | 50 starter questions |
| `HIVEMQ_SETUP.md` | Cloud gift setup |

Legacy Next.js code under `app/` is unused.
