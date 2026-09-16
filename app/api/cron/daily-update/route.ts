import { NextRequest, NextResponse } from "next/server";
import { pushCustomApp } from "@/lib/awtrix";
import {
  advanceDailyQuestion,
  getDeviceConfig,
  seedIfEmpty,
} from "@/lib/store";

export const dynamic = "force-dynamic";

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow in local/dev without secret
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  return runDailyUpdate(request);
}

export async function POST(request: NextRequest) {
  return runDailyUpdate(request);
}

async function runDailyUpdate(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await seedIfEmpty();
    const question = await advanceDailyQuestion();

    if (!question) {
      return NextResponse.json({
        ok: false,
        message: "No questions in the bank",
      });
    }

    const config = await getDeviceConfig();
    const push = await pushCustomApp(config, question);

    return NextResponse.json({
      ok: true,
      question,
      push,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cron job failed",
      },
      { status: 500 }
    );
  }
}
