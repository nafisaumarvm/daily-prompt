import { NextRequest, NextResponse } from "next/server";
import {
  createQuestion,
  deleteQuestion,
  listQuestions,
  reorderQuestions,
  seedIfEmpty,
  updateQuestion,
} from "@/lib/store";
import type { CreateQuestionInput, QuestionCategory } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let questions = await listQuestions();
    if (questions.length === 0) {
      questions = await seedIfEmpty();
    }
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load questions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateQuestionInput & {
      action?: "reorder" | "seed";
      orderedIds?: string[];
    };

    if (body.action === "seed") {
      const questions = await seedIfEmpty();
      return NextResponse.json({ questions });
    }

    if (body.action === "reorder" && Array.isArray(body.orderedIds)) {
      const questions = await reorderQuestions(body.orderedIds);
      return NextResponse.json({ questions });
    }

    const question = await createQuestion({
      text: body.text,
      category: body.category as QuestionCategory | undefined,
      color_hex: body.color_hex,
      scheduled_for: body.scheduled_for,
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create question" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const question = await updateQuestion(body);
    return NextResponse.json({ question });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update question" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await deleteQuestion(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete question" },
      { status: 400 }
    );
  }
}
