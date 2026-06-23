import { NextRequest, NextResponse } from "next/server";
import { appendMessage } from "@/lib/store";
import { sendSMS } from "@/lib/twilio";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { to, body } = payload as { to?: unknown; body?: unknown };
  if (typeof to !== "string" || !to.trim()) {
    return NextResponse.json(
      { success: false, error: "A recipient phone number is required" },
      { status: 400 }
    );
  }

  if (typeof body !== "string" || !body.trim()) {
    return NextResponse.json(
      { success: false, error: "A message body is required" },
      { status: 400 }
    );
  }

  try {
    const message = await sendSMS(to.trim(), body.trim());
    await appendMessage({
      id: message.sid,
      from: process.env.TWILIO_PHONE_NUMBER ?? "Me",
      to: to.trim(),
      body: body.trim(),
      messageSid: message.sid,
      direction: "outbound",
      source: "twilio",
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to send message"
      },
      { status: 500 }
    );
  }
}
