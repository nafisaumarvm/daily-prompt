import type {
  AwtrixCustomAppPayload,
  AwtrixNotifyPayload,
  DeviceConfig,
  PushResult,
  Question,
} from "@/types";

const REQUEST_TIMEOUT_MS = 4000;

/** Convert #RRGGBB or #RGB hex into an AWTRIX [R, G, B] tuple. */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return [255, 107, 138];
  }

  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function normalizeBaseUrl(ipOrUrl: string): string {
  const trimmed = ipOrUrl.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

async function postWithTimeout(
  url: string,
  body: unknown
): Promise<{ ok: boolean; status: number; error?: string; timedOut?: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        ok: false,
        status: response.status,
        error: text || `HTTP ${response.status}`,
      };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    const isAbort =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"));

    return {
      ok: false,
      status: 0,
      timedOut: isAbort,
      error: isAbort
        ? `Device did not respond within ${REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : "Unknown network error",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try primary device URL first, then optional webhook / Tailscale relay.
 * Idempotent: same payload is sent to whichever endpoint succeeds first.
 */
export async function sendToAwtrix(
  config: Pick<DeviceConfig, "ip_or_url" | "webhook_relay_url">,
  path: string,
  payload: AwtrixCustomAppPayload | AwtrixNotifyPayload
): Promise<PushResult> {
  const endpoints: string[] = [];

  if (config.ip_or_url?.trim()) {
    endpoints.push(`${normalizeBaseUrl(config.ip_or_url)}${path}`);
  }

  if (config.webhook_relay_url?.trim()) {
    const relay = normalizeBaseUrl(config.webhook_relay_url);
    // Relay can be a full custom path or a base AWTRIX URL
    endpoints.push(
      relay.includes("/api/") ? relay : `${relay}${path}`
    );
  }

  if (endpoints.length === 0) {
    return {
      success: false,
      error: "No device IP/URL configured. Add one in Settings.",
    };
  }

  let lastError = "All endpoints failed";
  let timedOut = false;

  for (const endpoint of endpoints) {
    const result = await postWithTimeout(endpoint, payload);
    if (result.ok) {
      return { success: true, endpoint };
    }
    lastError = result.error || lastError;
    timedOut = Boolean(result.timedOut);
  }

  return { success: false, error: lastError, timedOut };
}

export function buildQuestionPayload(
  question: Pick<Question, "text" | "color_hex">,
  options?: {
    icon?: string;
    scrollSpeed?: number;
    duration?: number;
    repeat?: number;
  }
): AwtrixCustomAppPayload {
  const payload: AwtrixCustomAppPayload = {
    text: question.text.slice(0, 120),
    color: hexToRgb(question.color_hex || "#FF6B8A"),
    // omit icon unless provided — named icons like "heart" fail unless downloaded
    repeat: options?.repeat ?? -1,
    duration: options?.duration ?? 10,
    rainbow: false,
    wakeup: true,
  };

  if (options?.icon) payload.icon = options.icon;
  if (typeof options?.scrollSpeed === "number") {
    payload.scrollSpeed = options.scrollSpeed;
  }

  return payload;
}

export async function pushCustomApp(
  config: Pick<DeviceConfig, "ip_or_url" | "webhook_relay_url" | "scroll_speed">,
  question: Pick<Question, "text" | "color_hex">,
  appName = "daily_question"
): Promise<PushResult> {
  const payload = buildQuestionPayload(question, {
    scrollSpeed: config.scroll_speed,
  });

  const custom = await sendToAwtrix(
    config,
    `/api/custom?name=${encodeURIComponent(appName)}`,
    payload
  );
  if (custom.success) return custom;

  // Fallback: one-shot notification (always works even if custom apps glitch)
  const notify = await pushNotification(config, {
    text: payload.text,
    color: payload.color,
    duration: 12,
    wakeup: true,
    repeat: 3,
  });

  if (notify.success) {
    return {
      ...notify,
      error: `Custom app failed (${custom.error}); sent as notification instead`,
    };
  }

  return custom;
}

export async function pushNotification(
  config: Pick<DeviceConfig, "ip_or_url" | "webhook_relay_url">,
  payload: AwtrixNotifyPayload
): Promise<PushResult> {
  return sendToAwtrix(config, "/api/notify", payload);
}

export async function testConnection(
  config: Pick<DeviceConfig, "ip_or_url" | "webhook_relay_url">
): Promise<PushResult> {
  return pushNotification(config, {
    text: "Hello Love!",
    color: [255, 107, 138],
    duration: 8,
    wakeup: true,
    repeat: 2,
  });
}
