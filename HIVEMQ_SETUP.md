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
7. Topic prefix / device prefix: set to **`awtrix`** (lowercase — must match Streamlit)
8. Save & reboot if asked

Topics this app publishes (correct paths):
- `awtrix/notify` — pop-up alerts / Test connection
- `awtrix/custom/question` — persistent daily question app

Incorrect examples that will **not** show on the clock:
- `notify` (missing prefix)
- `Awtrix/notify` (wrong capitalization)
- `awtrix_9b9304/notify` (only if your AWTRIX Prefix is actually that uid string)

## 3) Put HiveMQ secrets in Streamlit

### Local (`.streamlit/secrets.toml`)

```toml
HIVEMQ_HOST = "xxxxxxxx.s1.eu.hivemq.cloud"
HIVEMQ_PORT = "8883"
HIVEMQ_USERNAME = "your_user"
HIVEMQ_PASSWORD = "your_password"
AWTRIX_MQTT_PREFIX = "awtrix"
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

### Streamlit says success, but clock shows nothing

That success only means **HiveMQ accepted the publish**. The clock still has to be online on MQTT and subscribed to the **same prefix**.

1. AWTRIX web UI → MQTT → confirm it is **connected** (green MQTT status on the matrix is a good sign).
2. On the clock, AWTRIX MQTT **Prefix** should be `awtrix` (lowercase).
3. Put the same value in Streamlit **AWTRIX MQTT prefix** / `AWTRIX_MQTT_PREFIX`.
4. Topics must be exactly:
   - `awtrix/notify`
   - `awtrix/custom/question`
   Not `notify`, not `Awtrix/notify`, not `…/daily_question` unless you changed the app name.
5. HiveMQ Cloud → **Access Management / Permissions**: grant the MQTT user publish + subscribe on `#` while testing.
6. Same username/password on **both** the clock and Streamlit.

### Clock stuck on Time / lagging / no other apps

MQTT misconfig can make the ESP32 busy reconnecting.

1. Power-cycle the Ulanzi (unplug / hold power).
2. In AWTRIX: **disable MQTT** → Save → reboot. Built-in apps (Time, etc.) should animate again.
3. Re-enable MQTT with host, port `8883`, TLS on, correct user/pass, correct prefix.
4. Test again from Streamlit.

### Quick proof that the display still works

On the same Wi‑Fi as the clock:

```bash
curl -X POST "http://CLOCK_IP/api/notify" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello Love!","duration":8,"wakeup":true}'
```

If HTTP works but HiveMQ does not, the problem is MQTT prefix / broker permissions / clock MQTT connection — not Streamlit.
