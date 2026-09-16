export type QuestionCategory =
  | "romantic"
  | "funny"
  | "reflection"
  | "deep"
  | "custom";

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  is_active: boolean;
  sort_order: number;
  scheduled_for: string | null;
  shown_at: string | null;
  color_hex: string;
  created_at: string;
}

export interface DeviceConfig {
  id: string;
  ip_or_url: string;
  brightness: number;
  scroll_speed: number;
  webhook_relay_url: string | null;
  updated_at: string;
}

export interface AwtrixCustomAppPayload {
  text: string;
  color?: [number, number, number];
  icon?: string;
  repeat?: number;
  duration?: number;
  rainbow?: boolean;
  wakeup?: boolean;
  pushIcon?: number;
  scrollSpeed?: number;
  textCase?: number;
}

export interface AwtrixNotifyPayload {
  text: string;
  color?: [number, number, number];
  icon?: string;
  duration?: number;
  rainbow?: boolean;
  wakeup?: boolean;
  repeat?: number;
}

export interface PushResult {
  success: boolean;
  endpoint?: string;
  error?: string;
  timedOut?: boolean;
}

export interface CreateQuestionInput {
  text: string;
  category?: QuestionCategory;
  color_hex?: string;
  scheduled_for?: string | null;
}

export interface UpdateQuestionInput {
  id: string;
  text?: string;
  category?: QuestionCategory;
  color_hex?: string;
  scheduled_for?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  romantic: "Romantic",
  funny: "Funny",
  reflection: "Reflection",
  deep: "Deep",
  custom: "Custom",
};

export const DEFAULT_QUESTION_COLOR = "#FF6B8A";
