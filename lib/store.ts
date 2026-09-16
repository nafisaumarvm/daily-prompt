import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  CreateQuestionInput,
  DeviceConfig,
  Question,
  UpdateQuestionInput,
} from "@/types";
import { DEFAULT_QUESTION_COLOR } from "@/types";
import { buildSeedQuestions } from "@/lib/seed";
import {
  createServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const DATA_DIR = path.join(process.cwd(), ".data");
const QUESTIONS_FILE = path.join(DATA_DIR, "questions.json");
const DEVICE_FILE = path.join(DATA_DIR, "device.json");

const DEFAULT_DEVICE: DeviceConfig = {
  id: "local-device",
  ip_or_url: process.env.ULANZI_DEFAULT_URL || "",
  brightness: 128,
  scroll_speed: 100,
  webhook_relay_url: process.env.ULANZI_WEBHOOK_RELAY || null,
  updated_at: new Date().toISOString(),
};

async function ensureLocalFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(QUESTIONS_FILE);
  } catch {
    await fs.writeFile(
      QUESTIONS_FILE,
      JSON.stringify(buildSeedQuestions(), null, 2),
      "utf8"
    );
  }
  try {
    await fs.access(DEVICE_FILE);
  } catch {
    await fs.writeFile(
      DEVICE_FILE,
      JSON.stringify(DEFAULT_DEVICE, null, 2),
      "utf8"
    );
  }
}

async function readLocalQuestions(): Promise<Question[]> {
  await ensureLocalFiles();
  const raw = await fs.readFile(QUESTIONS_FILE, "utf8");
  return JSON.parse(raw) as Question[];
}

async function writeLocalQuestions(questions: Question[]) {
  await ensureLocalFiles();
  await fs.writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2), "utf8");
}

async function readLocalDevice(): Promise<DeviceConfig> {
  await ensureLocalFiles();
  const raw = await fs.readFile(DEVICE_FILE, "utf8");
  return JSON.parse(raw) as DeviceConfig;
}

async function writeLocalDevice(config: DeviceConfig) {
  await ensureLocalFiles();
  await fs.writeFile(DEVICE_FILE, JSON.stringify(config, null, 2), "utf8");
}

export async function listQuestions(): Promise<Question[]> {
  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data as Question[]) || [];
  }

  return readLocalQuestions();
}

export async function getActiveQuestion(): Promise<Question | null> {
  const questions = await listQuestions();
  return questions.find((q) => q.is_active) || null;
}

export async function createQuestion(
  input: CreateQuestionInput
): Promise<Question> {
  const text = input.text.trim().slice(0, 120);
  if (!text) throw new Error("Question text is required");

  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    const existing = await listQuestions();
    const sort_order =
      existing.length > 0
        ? Math.max(...existing.map((q) => q.sort_order)) + 1
        : 0;

    const { data, error } = await supabase
      .from("questions")
      .insert({
        text,
        category: input.category || "custom",
        color_hex: input.color_hex || DEFAULT_QUESTION_COLOR,
        scheduled_for: input.scheduled_for || null,
        is_active: false,
        sort_order,
        shown_at: null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Question;
  }

  const questions = await readLocalQuestions();
  const sort_order =
    questions.length > 0
      ? Math.max(...questions.map((q) => q.sort_order)) + 1
      : 0;

  const question: Question = {
    id: randomUUID(),
    text,
    category: input.category || "custom",
    color_hex: input.color_hex || DEFAULT_QUESTION_COLOR,
    scheduled_for: input.scheduled_for || null,
    is_active: false,
    sort_order,
    shown_at: null,
    created_at: new Date().toISOString(),
  };

  questions.push(question);
  await writeLocalQuestions(questions);
  return question;
}

export async function updateQuestion(
  input: UpdateQuestionInput
): Promise<Question> {
  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    const { id, ...rest } = input;
    const patch: Record<string, unknown> = { ...rest };
    if (typeof rest.text === "string") {
      patch.text = rest.text.trim().slice(0, 120);
    }

    const { data, error } = await supabase
      .from("questions")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Question;
  }

  const questions = await readLocalQuestions();
  const index = questions.findIndex((q) => q.id === input.id);
  if (index === -1) throw new Error("Question not found");

  const current = questions[index];
  const updated: Question = {
    ...current,
    text:
      typeof input.text === "string"
        ? input.text.trim().slice(0, 120)
        : current.text,
    category: input.category ?? current.category,
    color_hex: input.color_hex ?? current.color_hex,
    scheduled_for:
      input.scheduled_for !== undefined
        ? input.scheduled_for
        : current.scheduled_for,
    sort_order: input.sort_order ?? current.sort_order,
    is_active: input.is_active ?? current.is_active,
  };

  questions[index] = updated;
  await writeLocalQuestions(questions);
  return updated;
}

export async function deleteQuestion(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }

  const questions = await readLocalQuestions();
  await writeLocalQuestions(questions.filter((q) => q.id !== id));
}

export async function reorderQuestions(orderedIds: string[]): Promise<Question[]> {
  const questions = await listQuestions();
  const byId = new Map(questions.map((q) => [q.id, q]));

  const reordered = orderedIds
    .map((id, index) => {
      const q = byId.get(id);
      if (!q) return null;
      return { ...q, sort_order: index };
    })
    .filter(Boolean) as Question[];

  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    await Promise.all(
      reordered.map((q) =>
        supabase.from("questions").update({ sort_order: q.sort_order }).eq("id", q.id)
      )
    );
    return listQuestions();
  }

  // Keep any ids not in orderedIds at the end
  const remaining = questions
    .filter((q) => !orderedIds.includes(q.id))
    .map((q, i) => ({ ...q, sort_order: reordered.length + i }));

  const next = [...reordered, ...remaining];
  await writeLocalQuestions(next);
  return next;
}

export async function activateQuestion(id: string): Promise<Question> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    await supabase
      .from("questions")
      .update({ is_active: false })
      .eq("is_active", true);

    const { data, error } = await supabase
      .from("questions")
      .update({ is_active: true, shown_at: now })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Question;
  }

  const questions = await readLocalQuestions();
  const next = questions.map((q) => ({
    ...q,
    is_active: q.id === id,
    shown_at: q.id === id ? now : q.shown_at,
  }));
  await writeLocalQuestions(next);
  const active = next.find((q) => q.id === id);
  if (!active) throw new Error("Question not found");
  return active;
}

/** Pick the next unshown / upcoming question, activate it, and return it. */
export async function advanceDailyQuestion(): Promise<Question | null> {
  const questions = await listQuestions();
  if (questions.length === 0) return null;

  const current = questions.find((q) => q.is_active);
  const upcoming = questions
    .filter((q) => !q.is_active && !q.shown_at)
    .sort((a, b) => a.sort_order - b.sort_order);

  const next =
    upcoming[0] ||
    questions
      .filter((q) => q.id !== current?.id)
      .sort((a, b) => a.sort_order - b.sort_order)[0] ||
    current;

  if (!next) return null;
  return activateQuestion(next.id);
}

export async function getDeviceConfig(): Promise<DeviceConfig> {
  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("device_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (data) return data as DeviceConfig;

    const { data: created, error: insertError } = await supabase
      .from("device_config")
      .insert({
        ip_or_url: "",
        brightness: 128,
        scroll_speed: 100,
        webhook_relay_url: null,
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);
    return created as DeviceConfig;
  }

  return readLocalDevice();
}

export async function updateDeviceConfig(
  patch: Partial<
    Pick<
      DeviceConfig,
      "ip_or_url" | "brightness" | "scroll_speed" | "webhook_relay_url"
    >
  >
): Promise<DeviceConfig> {
  const updated_at = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const current = await getDeviceConfig();
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("device_config")
      .update({ ...patch, updated_at })
      .eq("id", current.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DeviceConfig;
  }

  const current = await readLocalDevice();
  const next = { ...current, ...patch, updated_at };
  await writeLocalDevice(next);
  return next;
}

export async function seedIfEmpty(): Promise<Question[]> {
  const existing = await listQuestions();
  if (existing.length > 0) return existing;

  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    const seeds = buildSeedQuestions().map(({ id, ...rest }) => {
      void id;
      return rest;
    });
    const { data, error } = await supabase
      .from("questions")
      .insert(seeds)
      .select();
    if (error) throw new Error(error.message);
    return (data as Question[]) || [];
  }

  const seeds = buildSeedQuestions();
  await writeLocalQuestions(seeds);
  return seeds;
}
