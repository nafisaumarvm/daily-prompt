import { NextRequest, NextResponse } from "next/server";
import { getDeviceConfig, updateDeviceConfig } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getDeviceConfig();
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load config" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const config = await updateDeviceConfig({
      ip_or_url: body.ip_or_url,
      brightness:
        typeof body.brightness === "number" ? body.brightness : undefined,
      scroll_speed:
        typeof body.scroll_speed === "number" ? body.scroll_speed : undefined,
      webhook_relay_url:
        body.webhook_relay_url !== undefined ? body.webhook_relay_url : undefined,
    });
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save config" },
      { status: 400 }
    );
  }
}
