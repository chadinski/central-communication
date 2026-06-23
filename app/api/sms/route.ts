import { NextRequest, NextResponse } from "next/server";
import { appendMessage, getMessages } from "@/lib/store";
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
  const messages = await getMessages();
  return NextResponse.json({ messages });
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
    return xmlResponse("<Response><Message>Invalid signature</Message></Response>", 403);
  }

  const from = params.From ?? "Unknown";
  const body = params.Body ?? "";
  const messageSid = params.MessageSid;

  await appendMessage({
    id: messageSid ?? crypto.randomUUID(),
    from,
    to: params.To,
    body,
    messageSid,
    direction: "inbound",
    source: "twilio",
    timestamp: new Date().toISOString()
  });

  return xmlResponse("<Response><Message>Got it!</Message></Response>");
}
