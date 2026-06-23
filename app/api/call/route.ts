import { NextRequest, NextResponse } from "next/server";
import { appendCall, getCalls } from "@/lib/store";
import { validateTwilioWebhook } from "@/lib/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function xmlResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/xml"
    }
  });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function requestUrlForTwilio(request: NextRequest) {
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;

  return `${proto}://${host}${url.pathname}${url.search}`;
}

function paramsFromForm(formData: FormData) {
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      params[key] = value;
    }
  }

  return params;
}

export async function GET() {
  const calls = await getCalls();
  return NextResponse.json({ calls });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params = paramsFromForm(formData);
  const isValid = validateTwilioWebhook(
    request.headers.get("x-twilio-signature"),
    requestUrlForTwilio(request),
    params
  );

  if (!isValid) {
    return xmlResponse("<Response><Reject /></Response>", 403);
  }

  const callSid = params.CallSid;
  await appendCall({
    id: callSid ?? crypto.randomUUID(),
    from: params.From ?? "Unknown",
    to: params.To,
    callSid,
    status: params.CallStatus,
    duration: params.CallDuration,
    timestamp: new Date().toISOString()
  });

  const forwardTo = process.env.MY_REAL_PHONE;
  if (!forwardTo) {
    return xmlResponse(
      "<Response><Say>Forwarding number is not configured.</Say></Response>",
      500
    );
  }

  return xmlResponse(`<Response><Dial>${escapeXml(forwardTo)}</Dial></Response>`);
}
