"""Starter question pack + simple in-memory / session store helpers."""

from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone
from typing import Any

STARTER_QUESTIONS: list[dict[str, str]] = [
    {"text": "What made you smile about us today?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "What's one tiny thing I do that you secretly love?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "If our love had a soundtrack today, what song would it be?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What's a memory from this week you want to keep forever?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "Where do you feel safest with me?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "Compliment me like it's our first date again.", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "What's the silliest thing we've laughed about lately?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What are you most grateful for in our home right now?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "What's a dream of yours I can help carry?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "Describe us in three words — go!", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What does 'home' mean when we're together?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "Which of my habits should we turn into a tradition?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "What's something new you want us to try this month?", "category": "custom", "color_hex": "#E8A0BF"},
    {"text": "When did you last feel proud of us?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "What's your favorite way I say 'I love you' without words?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "If we were a sitcom episode tonight, what's the title?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What part of our wedding day still lives rent-free in your head?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "What do you need more of from me this week?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "What's a quiet moment with me you cherish?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "Who would play us in the movie of our life?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What made you choose me — still true today?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "What's one adventure still on our Year One bucket list?", "category": "custom", "color_hex": "#E8A0BF"},
    {"text": "How do you feel most loved — words, touch, acts, gifts, or time?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "What's a shared win we should celebrate tonight?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "What's the funniest photo of us and why?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What fear can we face a little better together?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "What's your favorite ordinary Tuesday with me?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "If we could teleport for dinner, where are we going?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What have you learned about love since we said yes?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "What's something you hope never changes about us?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "Leave me a love note in one sentence.", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "What's our couple superpower?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What tradition should we invent before anniversary #1?", "category": "custom", "color_hex": "#E8A0BF"},
    {"text": "When do you feel closest to me during a busy day?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "What does partnership look like for you right now?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "What's a soft place in my personality you lean on?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "Rate today's us from 1–10 and explain the score.", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What memory should we retell at dinner tonight?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "What's a boundary that helps our marriage thrive?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "What do you love about the way we argue and make up?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "Steal my heart again — how would you do it?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "What's the weirdest compatibility we have?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "Which season of us are we in — spring, summer, fall, winter?", "category": "reflection", "color_hex": "#7EB8DA"},
    {"text": "What future version of us are you most excited to meet?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "What's one kindness I showed you that you still remember?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "If our pets / plants could roast us, what would they say?", "category": "funny", "color_hex": "#F4A261"},
    {"text": "What does 'growing together' mean for this month?", "category": "deep", "color_hex": "#9B7EBD"},
    {"text": "What's a small ritual that always reconnects us?", "category": "romantic", "color_hex": "#FF6B8A"},
    {"text": "What question do you wish I'd ask you more often?", "category": "custom", "color_hex": "#E8A0BF"},
    {"text": "End the day with this: one hope for us tomorrow.", "category": "reflection", "color_hex": "#7EB8DA"},
]

CATEGORIES = ["romantic", "funny", "reflection", "deep", "custom"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_seed_questions() -> list[dict[str, Any]]:
    now = _now()
    questions: list[dict[str, Any]] = []
    for index, item in enumerate(STARTER_QUESTIONS):
        questions.append(
            {
                "id": str(uuid.uuid4()),
                "text": item["text"],
                "category": item["category"],
                "color_hex": item["color_hex"],
                "is_active": index == 0,
                "shown_at": now if index == 0 else None,
                "created_at": now,
            }
        )
    return questions


def active_question(questions: list[dict[str, Any]]) -> dict[str, Any] | None:
    return next((q for q in questions if q.get("is_active")), None)


def activate(questions: list[dict[str, Any]], question_id: str) -> list[dict[str, Any]]:
    now = _now()
    updated = copy.deepcopy(questions)
    for q in updated:
        if q["id"] == question_id:
            q["is_active"] = True
            q["shown_at"] = now
        else:
            q["is_active"] = False
    return updated


def add_question(
    questions: list[dict[str, Any]],
    text: str,
    category: str = "custom",
    color_hex: str = "#FF6B8A",
) -> list[dict[str, Any]]:
    cleaned = text.strip()[:120]
    if not cleaned:
        raise ValueError("Question text is required")
    updated = copy.deepcopy(questions)
    updated.append(
        {
            "id": str(uuid.uuid4()),
            "text": cleaned,
            "category": category if category in CATEGORIES else "custom",
            "color_hex": color_hex or "#FF6B8A",
            "is_active": False,
            "shown_at": None,
            "created_at": _now(),
        }
    )
    return updated


def delete_question(questions: list[dict[str, Any]], question_id: str) -> list[dict[str, Any]]:
    return [q for q in copy.deepcopy(questions) if q["id"] != question_id]


def advance_daily(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not questions:
        return questions
    current = active_question(questions)
    upcoming = [q for q in questions if not q.get("is_active") and not q.get("shown_at")]
    if upcoming:
        nxt = upcoming[0]
    else:
        others = [q for q in questions if q["id"] != (current or {}).get("id")]
        nxt = others[0] if others else current
    if not nxt:
        return questions
    return activate(questions, nxt["id"])
