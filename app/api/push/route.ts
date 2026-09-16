import { NextRequest, NextResponse } from "next/server";
import { pushCustomApp, pushNotification, testConnection } from "@/lib/awtrix";
import {
  activateQuestion,
  getActiveQuestion,
  getDeviceConfig,
  listQuestions,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const config = await getDeviceConfig();

    if (body.mode === "test") {
      const result = await testConnection(config);
      return NextResponse.json(result, { status: result.success ? 200 : 502 });
    }

    if (body.mode === "notify" && body.text) {
      const result = await pushNotification(config, {
        text: String(body.text).slice(0, 120),
        color: [255, 107, 138],
        icon: "heart",
        duration: 10,
        wakeup: true,
        repeat: 2,
      });
      return NextResponse.json(result, { status: result.success ? 200 : 502 });
    }

    let question =
      (body.questionId
        ? (await listQuestions()).find((q) => q.id === body.questionId)
        : null) || (await getActiveQuestion());

    if (body.questionId && question) {
      question = await activateQuestion(question.id);
    }

    if (!question) {
      return NextResponse.json(
        { success: false, error: "No question available to push" },
        { status: 404 }
      );
    }

    const result = await pushCustomApp(config, question);
    return NextResponse.json(
      { ...result, question },
      { status: result.success ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Push failed",
      },
      { status: 500 }
    );
  }
}
