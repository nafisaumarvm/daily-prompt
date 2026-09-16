"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Question, QuestionCategory } from "@/types";
import { CATEGORY_LABELS, DEFAULT_QUESTION_COLOR } from "@/types";
import { cn } from "@/lib/utils";

interface QuestionFormProps {
  open: boolean;
  initial?: Question | null;
  onClose: () => void;
  onSaved: (question: Question) => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as QuestionCategory[];

const COLOR_PRESETS = [
  "#FF6B8A",
  "#F4A261",
  "#E8A0BF",
  "#7EB8DA",
  "#9B7EBD",
  "#C4A574",
];

export function QuestionForm({
  open,
  initial,
  onClose,
  onSaved,
}: QuestionFormProps) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<QuestionCategory>("romantic");
  const [colorHex, setColorHex] = useState(DEFAULT_QUESTION_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setText(initial?.text || "");
    setCategory(initial?.category || "romantic");
    setColorHex(initial?.color_hex || DEFAULT_QUESTION_COLOR);
    setError(null);
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const isEdit = Boolean(initial?.id);
      const res = await fetch("/api/questions", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { id: initial!.id, text, category, color_hex: colorHex }
            : { text, category, color_hex: colorHex }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved(data.question as Question);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[var(--ink)]/45 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.form
            onSubmit={handleSubmit}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl border border-white/50 bg-[color-mix(in_srgb,var(--pearl)_92%,white)] p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  {initial ? "Edit question" : "New question"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Keep it under 120 characters for the LED scroll.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--line)] p-2 text-[var(--muted)] hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block text-sm font-medium text-[var(--ink)]">
              Prompt
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 120))}
                rows={3}
                required
                placeholder="What made you smile about us today?"
                className="mt-2 w-full resize-none rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-[var(--ink)] outline-none ring-[var(--rose)]/30 placeholder:text-[var(--muted)] focus:ring-2"
              />
              <span className="mt-1 block text-right text-xs text-[var(--muted)]">
                {text.length}/120
              </span>
            </label>

            <div className="mt-4">
              <p className="text-sm font-medium text-[var(--ink)]">Category</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                      category === cat
                        ? "bg-[var(--rose)] text-white shadow-md shadow-[var(--rose)]/25"
                        : "bg-white/70 text-[var(--muted)] ring-1 ring-[var(--line)] hover:text-[var(--ink)]"
                    )}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-[var(--ink)]">LED color</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => setColorHex(c)}
                    className={cn(
                      "h-8 w-8 rounded-full transition",
                      colorHex === c
                        ? "ring-2 ring-[var(--ink)] ring-offset-2"
                        : "opacity-80 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded-md border border-[var(--line)] bg-transparent"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[var(--line)] bg-white/60 py-3 text-sm font-semibold text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !text.trim()}
                className="flex-1 rounded-full bg-[var(--rose)] py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--rose)]/30 transition hover:brightness-105 disabled:opacity-50"
              >
                {saving ? "Saving…" : initial ? "Save changes" : "Add question"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
