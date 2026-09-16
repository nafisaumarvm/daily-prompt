"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RadioTower,
  Save,
  Wifi,
} from "lucide-react";
import type { DeviceConfig } from "@/types";

export default function SettingsPage() {
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [ipOrUrl, setIpOrUrl] = useState("");
  const [relay, setRelay] = useState("");
  const [brightness, setBrightness] = useState(128);
  const [scrollSpeed, setScrollSpeed] = useState(100);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/device");
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setIpOrUrl(data.config.ip_or_url || "");
        setRelay(data.config.webhook_relay_url || "");
        setBrightness(data.config.brightness ?? 128);
        setScrollSpeed(data.config.scroll_speed ?? 100);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/device", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip_or_url: ipOrUrl.trim(),
          webhook_relay_url: relay.trim() || null,
          brightness,
          scroll_speed: scrollSpeed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setConfig(data.config);
      setOk(true);
      setMessage("Device settings saved");
    } catch (err) {
      setOk(false);
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function testPing() {
    setTesting(true);
    setMessage(null);
    try {
      // Persist current form values first so the push route uses them
      await save();
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "test" }),
      });
      const data = await res.json();
      setOk(Boolean(data.success));
      setMessage(
        data.success
          ? `Connected via ${data.endpoint || "device"} — check for “Hello Love!”`
          : data.error || "Could not reach the Ulanzi"
      );
    } catch {
      setOk(false);
      setMessage("Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]"
        >
          Hardware settings
        </motion.h1>
        <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">
          Point Daily Prompt at your Ulanzi TC001 (AWTRIX 3). Use a LAN IP on the
          same network, or a Tailscale / Nabu Casa / ngrok URL when away from home.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="space-y-5 rounded-[1.4rem] border border-white/60 bg-white/45 p-6 shadow-[0_20px_50px_rgba(42,21,32,0.06)] backdrop-blur-xl"
      >
        <label className="block text-sm font-medium text-[var(--ink)]">
          Device IP or public URL
          <input
            value={ipOrUrl}
            onChange={(e) => setIpOrUrl(e.target.value)}
            placeholder="192.168.1.42 or https://ulanzi.ts.net"
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none ring-[var(--rose)]/30 focus:ring-2"
          />
        </label>

        <label className="block text-sm font-medium text-[var(--ink)]">
          Fallback webhook / relay URL
          <span className="ml-1 font-normal text-[var(--muted)]">(optional)</span>
          <input
            value={relay}
            onChange={(e) => setRelay(e.target.value)}
            placeholder="https://hooks.example.com/awtrix"
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none ring-[var(--rose)]/30 focus:ring-2"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[var(--ink)]">
            Brightness ({brightness})
            <input
              type="range"
              min={0}
              max={255}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--rose)]"
            />
          </label>
          <label className="block text-sm font-medium text-[var(--ink)]">
            Scroll speed ({scrollSpeed})
            <input
              type="range"
              min={20}
              max={200}
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--rose)]"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={testPing}
            disabled={testing || !ipOrUrl.trim()}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--ink)] disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4 text-[var(--rose)]" />
            )}
            Test Connection
          </button>
        </div>

        {message && (
          <p
            className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${
              ok
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <RadioTower className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {message}
          </p>
        )}

        {config && (
          <p className="text-xs text-[var(--muted)]">
            Last updated{" "}
            {new Date(config.updated_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}
      </motion.section>

      <section className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/30 p-5 text-sm leading-relaxed text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">Home Wi‑Fi vs public gift</p>
        <p className="mt-2">
          Use <code className="rounded bg-white/70 px-1.5 py-0.5 text-[12px] text-[var(--ink)]">192.168.1.123</code> only while this app runs on a computer on the same Wi‑Fi as the clock.
        </p>
        <p className="mt-2">
          For a public website (Vercel) your friend can open from anywhere, the clock needs a public HTTPS tunnel URL here instead — see{" "}
          <code className="rounded bg-white/70 px-1.5 py-0.5 text-[12px] text-[var(--ink)]">GIFT_SETUP.md</code>.
        </p>
      </section>
    </div>
  );
}
