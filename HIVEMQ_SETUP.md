# Always-on gift setup: Streamlit Cloud + HiveMQ Cloud + AWTRIX
#
# Architecture:
#   Phone → Streamlit (HTTPS) → HiveMQ Cloud (MQTT) → Ulanzi clock
# The clock connects OUT to HiveMQ on home Wi‑Fi. Laptop can be off.

## 1) Create a free HiveMQ Cloud cluster

1. Sign up at https://www.hivemq.com/mqtt-cloud-broker/
2. Create a **Serverless** / free cluster
3. Create a user (username + password)
4. Copy the **Cluster URL / host** (e.g. `xxxxxxxx.s1.eu.hivemq.cloud`)
5. Port for TLS MQTT is usually **8883**

## 2) Point the Ulanzi (AWTRIX) at HiveMQ

On the clock web UI (`http://CLOCK_IP`):

1. Open **MQTT** settings
2. Enable MQTT
3. Broker: your HiveMQ host
4. Port: `8883`
5. Enable **SSL / TLS**
6. Username / password: the HiveMQ user you created
7. Topic prefix / device prefix: leave as default (often `awtrix_XXXXXX`)
8. Save & reboot if asked

Find the exact prefix:
- AWTRIX **Stats** / API `http://CLOCK_IP/api/stats` → field `uid`  
  Example: `"uid": "awtrix_9b9304"` → prefix is `awtrix_9b9304`

Topics this app publishes:
- `{prefix}/notify` — test / fallback
- `{prefix}/custom/daily_question` — standing daily question app

## 3) Put HiveMQ secrets in Streamlit

### Local (`.streamlit/secrets.toml`)

```toml
HIVEMQ_HOST = "xxxxxxxx.s1.eu.hivemq.cloud"
HIVEMQ_PORT = "8883"
HIVEMQ_USERNAME = "your_user"
HIVEMQ_PASSWORD = "your_password"
AWTRIX_MQTT_PREFIX = "awtrix_9b9304"
```

### Streamlit Community Cloud

App → **Settings → Secrets** → paste the same TOML.

## 4) Deploy the website (Streamlit Cloud)

1. Push this repo to GitHub
2. https://share.streamlit.io → New app → main file `streamlit_app.py`
3. Add Secrets from step 3
4. Open the public HTTPS URL on your phone from anywhere

In the app sidebar choose **HiveMQ MQTT** → **Test connection**.

## 5) What stays running?

| Piece | Needs to stay on? |
|---|---|
| Ulanzi clock on home Wi‑Fi | Yes (plugged in / charged) |
| HiveMQ Cloud | Yes (their free cloud) |
| Streamlit Cloud | Yes (sleeps when idle, wakes on visit) |
| Your laptop | **No** |

## Troubleshooting

- Test fails / clock silent: confirm AWTRIX MQTT shows “connected”
- Wrong prefix: check `/api/stats` → `uid`
- Auth errors: recreate HiveMQ credentials; update both clock + Streamlit secrets
- Works on HTTP locally but not Cloud: you’re still on Local HTTP mode — switch sidebar to HiveMQ MQTT
