import type { Question, QuestionCategory } from "@/types";
import { DEFAULT_QUESTION_COLOR } from "@/types";

/** 50 Couple Questions for Year One — starter pack */
export const STARTER_QUESTIONS: Array<{
  text: string;
  category: QuestionCategory;
  color_hex: string;
}> = [
  { text: "What made you smile about us today?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "What's one tiny thing I do that you secretly love?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "If our love had a soundtrack today, what song would it be?", category: "funny", color_hex: "#F4A261" },
  { text: "What's a memory from this week you want to keep forever?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "Where do you feel safest with me?", category: "deep", color_hex: "#9B7EBD" },
  { text: "Compliment me like it's our first date again.", category: "romantic", color_hex: "#FF6B8A" },
  { text: "What's the silliest thing we've laughed about lately?", category: "funny", color_hex: "#F4A261" },
  { text: "What are you most grateful for in our home right now?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "What's a dream of yours I can help carry?", category: "deep", color_hex: "#9B7EBD" },
  { text: "Describe us in three words — go!", category: "funny", color_hex: "#F4A261" },
  { text: "What does 'home' mean when we're together?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "Which of my habits should we turn into a tradition?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "What's something new you want us to try this month?", category: "custom", color_hex: "#E8A0BF" },
  { text: "When did you last feel proud of us?", category: "deep", color_hex: "#9B7EBD" },
  { text: "What's your favorite way I say 'I love you' without words?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "If we were a sitcom episode tonight, what's the title?", category: "funny", color_hex: "#F4A261" },
  { text: "What part of our wedding day still lives rent-free in your head?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "What do you need more of from me this week?", category: "deep", color_hex: "#9B7EBD" },
  { text: "What's a quiet moment with me you cherish?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "Who would play us in the movie of our life?", category: "funny", color_hex: "#F4A261" },
  { text: "What made you choose me — still true today?", category: "deep", color_hex: "#9B7EBD" },
  { text: "What's one adventure still on our Year One bucket list?", category: "custom", color_hex: "#E8A0BF" },
  { text: "How do you feel most loved — words, touch, acts, gifts, or time?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "What's a shared win we should celebrate tonight?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "What's the funniest photo of us and why?", category: "funny", color_hex: "#F4A261" },
  { text: "What fear can we face a little better together?", category: "deep", color_hex: "#9B7EBD" },
  { text: "What's your favorite ordinary Tuesday with me?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "If we could teleport for dinner, where are we going?", category: "funny", color_hex: "#F4A261" },
  { text: "What have you learned about love since we said yes?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "What's something you hope never changes about us?", category: "deep", color_hex: "#9B7EBD" },
  { text: "Leave me a love note in one sentence.", category: "romantic", color_hex: "#FF6B8A" },
  { text: "What's our couple superpower?", category: "funny", color_hex: "#F4A261" },
  { text: "What tradition should we invent before anniversary #1?", category: "custom", color_hex: "#E8A0BF" },
  { text: "When do you feel closest to me during a busy day?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "What does partnership look like for you right now?", category: "deep", color_hex: "#9B7EBD" },
  { text: "What's a soft place in my personality you lean on?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "Rate today's us from 1–10 and explain the score.", category: "funny", color_hex: "#F4A261" },
  { text: "What memory should we retell at dinner tonight?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "What's a boundary that helps our marriage thrive?", category: "deep", color_hex: "#9B7EBD" },
  { text: "What do you love about the way we argue and make up?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "Steal my heart again — how would you do it?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "What's the weirdest compatibility we have?", category: "funny", color_hex: "#F4A261" },
  { text: "Which season of us are we in — spring, summer, fall, winter?", category: "reflection", color_hex: "#7EB8DA" },
  { text: "What future version of us are you most excited to meet?", category: "deep", color_hex: "#9B7EBD" },
  { text: "What's one kindness I showed you that you still remember?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "If our pets / plants could roast us, what would they say?", category: "funny", color_hex: "#F4A261" },
  { text: "What does 'growing together' mean for this month?", category: "deep", color_hex: "#9B7EBD" },
  { text: "What's a small ritual that always reconnects us?", category: "romantic", color_hex: "#FF6B8A" },
  { text: "What question do you wish I'd ask you more often?", category: "custom", color_hex: "#E8A0BF" },
  { text: "End the day with this: one hope for us tomorrow.", category: "reflection", color_hex: "#7EB8DA" },
];

export function buildSeedQuestions(now = new Date()): Question[] {
  return STARTER_QUESTIONS.map((q, index) => ({
    id: `seed-${String(index + 1).padStart(2, "0")}`,
    text: q.text,
    category: q.category,
    is_active: index === 0,
    sort_order: index,
    scheduled_for: null,
    shown_at: index === 0 ? now.toISOString() : null,
    color_hex: q.color_hex || DEFAULT_QUESTION_COLOR,
    created_at: now.toISOString(),
  }));
}
