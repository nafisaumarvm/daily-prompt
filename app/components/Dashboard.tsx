"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Send } from "lucide-react";
import { DisplayPreview } from "@/app/components/DisplayPreview";
import { QuestionForm } from "@/app/components/QuestionForm";
import { QuestionList } from "@/app/components/QuestionList";
import type { Question } from "@/types";

export function Dashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const active = useMemo(
    () => questions.find((q) => q.is_active) || null,
    [questions]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setToast("Could not load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function pushQuestion(question?: Question) {
    const id = question?.id || active?.id;
    if (!id) {
      setToast("No question to push");
      return;
    }
    setPushingId(id);
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: id }),
      });
      const data = await res.json();
      if (data.question) {
        setQuestions((prev) =>
          prev.map((q) => ({
            ...q,
            is_active: q.id === data.question.id,
            shown_at:
              q.id === data.question.id
                ? data.question.shown_at
                : q.shown_at,
          }))
        );
      }
      setToast(
        data.success
          ? "Pushed to your Ulanzi board"
          : data.error || "Push failed — is the clock online?"
      );
      if (data.success) await load();
    } catch {
      setToast("Network error while pushing");
    } finally {
      setPushingId(null);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rose)]">
            Good morning, loves
          </p>
          <h1 className="max-w-xl font-[family-name:var(--font-display)] text-4xl leading-[1.1] text-[var(--ink)] sm:text-5xl">
            Daily Prompt
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            One question on your bedside clock — every morning, or whenever you
            tap push.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.45 }}
        >
          <DisplayPreview
            text={active?.text || "Add your first question…"}
            colorHex={active?.color_hex}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[1.4rem] border border-white/60 bg-white/45 p-5 shadow-[0_20px_50px_rgba(42,21,32,0.06)] backdrop-blur-xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Current active question
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--ink)] sm:text-3xl">
            {active?.text || "Nothing active yet"}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => pushQuestion()}
              disabled={!active || Boolean(pushingId)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--rose)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--rose)]/30 transition hover:brightness-105 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {pushingId ? "Pushing…" : "Push to Board Now"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white"
            >
              <Plus className="h-4 w-4" />
              Add question
            </button>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full px-3 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </motion.div>
      </section>

      {loading && questions.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Loading your question bank…</p>
      ) : (
        <QuestionList
          questions={questions}
          onChange={setQuestions}
          onEdit={(q) => {
            setEditing(q);
            setFormOpen(true);
          }}
          onPush={(q) => pushQuestion(q)}
          pushingId={pushingId}
        />
      )}

      <QuestionForm
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={(q) => {
          setQuestions((prev) => {
            const exists = prev.some((item) => item.id === q.id);
            if (exists) return prev.map((item) => (item.id === q.id ? q : item));
            return [...prev, q];
          });
        }}
      />

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full border border-white/60 bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white shadow-xl"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
