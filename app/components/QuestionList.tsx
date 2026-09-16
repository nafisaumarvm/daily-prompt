"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  Archive,
  GripVertical,
  Pencil,
  Radio,
  Trash2,
} from "lucide-react";
import type { Question } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface QuestionListProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  onEdit: (question: Question) => void;
  onPush: (question: Question) => void;
  pushingId?: string | null;
}

function SortableRow({
  question,
  onEdit,
  onDelete,
  onPush,
  pushing,
}: {
  question: Question;
  onEdit: () => void;
  onDelete: () => void;
  onPush: () => void;
  pushing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-white/50 bg-white/45 px-3 py-3 backdrop-blur-md transition",
        isDragging && "z-10 scale-[1.02] shadow-xl shadow-[var(--ink)]/10",
        question.is_active && "border-[var(--rose)]/40 bg-[var(--rose)]/8"
      )}
    >
      <button
        type="button"
        className="mt-1 touch-none rounded-md p-1 text-[var(--muted)] hover:bg-white/80 hover:text-[var(--ink)]"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: question.color_hex }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {CATEGORY_LABELS[question.category]}
          </span>
          {question.is_active && (
            <span className="rounded-full bg-[var(--rose)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Active
            </span>
          )}
          {question.shown_at && !question.is_active && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--muted)]">
              <Archive className="h-3 w-3" />
              {format(new Date(question.shown_at), "MMM d")}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">
          {question.text}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onPush}
          disabled={pushing}
          className="rounded-full p-2 text-[var(--rose)] hover:bg-[var(--rose)]/10 disabled:opacity-50"
          title="Push to board now"
        >
          <Radio className={cn("h-4 w-4", pushing && "animate-pulse")} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full p-2 text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full p-2 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export function QuestionList({
  questions,
  onChange,
  onEdit,
  onPush,
  pushingId,
}: QuestionListProps) {
  const [filter, setFilter] = useState<"upcoming" | "archive" | "all">(
    "upcoming"
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const visible = useMemo(() => {
    const sorted = [...questions].sort((a, b) => a.sort_order - b.sort_order);
    if (filter === "upcoming") {
      return sorted.filter((q) => q.is_active || !q.shown_at);
    }
    if (filter === "archive") {
      return sorted.filter((q) => Boolean(q.shown_at) && !q.is_active);
    }
    return sorted;
  }, [questions, filter]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
      ...q,
      sort_order: i,
    }));
    onChange(next);

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reorder",
        orderedIds: next.map((q) => q.id),
      }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/questions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) onChange(questions.filter((q) => q.id !== id));
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Question bank
        </h2>
        <div className="flex rounded-full border border-[var(--line)] bg-white/50 p-1 text-xs font-semibold">
          {(
            [
              ["upcoming", "Upcoming"],
              ["archive", "Archive"],
              ["all", "All"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-3 py-1.5 transition",
                filter === key
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visible.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2.5">
            {visible.map((question) => (
              <SortableRow
                key={question.id}
                question={question}
                onEdit={() => onEdit(question)}
                onDelete={() => handleDelete(question.id)}
                onPush={() => onPush(question)}
                pushing={pushingId === question.id}
              />
            ))}
            {visible.length === 0 && (
              <li className="rounded-2xl border border-dashed border-[var(--line)] bg-white/30 px-4 py-10 text-center text-sm text-[var(--muted)]">
                No questions in this view yet.
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
