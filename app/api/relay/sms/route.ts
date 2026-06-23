import { NextRequest, NextResponse } from "next/server";
import { appendMessage } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RelayPayload = {
  body?: unknown;
  device?: unknown;
  from?: unknown;
  message?: unknown;
  receivedAt?: unknown;
  sender?: unknown;
  senderNumber?: unknown;
  text?: unknown;
  timestamp?: unknown;
  to?: unknown;
};

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

async function parsePayload(request: NextRequest): Promise<RelayPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as RelayPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const payload: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        payload[key] = value;
      }
    }

    return payload;
  }

  return { body: await request.text() };
}

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.RELAY_SECRET;
  if (!configuredSecret && process.env.NODE_ENV !== "production") {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const suppliedSecret =
    request.headers.get("x-relay-secret") ??
    bearer ??
    request.nextUrl.searchParams.get("secret");

  return Boolean(configuredSecret && suppliedSecret === configuredSecret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Invalid relay secret", 401);
  }

  let payload: RelayPayload;
  try {
    payload = await parsePayload(request);
  } catch {
    return jsonError("Unable to parse relay payload", 400);
  }

  const body = stringValue(payload.body, payload.message, payload.text);
  if (!body) {
    return jsonError("Missing message body", 400);
  }

  const from =
    stringValue(payload.from, payload.senderNumber, payload.sender) ||
    "Carrier SMS";
  const to = stringValue(payload.to, payload.device);
  const timestamp =
    stringValue(payload.receivedAt, payload.timestamp) ||
    new Date().toISOString();

  const message = await appendMessage({
    id: `relay-${crypto.randomUUID()}`,
    from,
    to,
    body,
    direction: "inbound",
    source: "relay",
    timestamp
  });

  return NextResponse.json({ message, success: true });
}
