import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getTwilioClient() {
  if (!client) {
    client = twilio(
      requireEnv("TWILIO_ACCOUNT_SID"),
      requireEnv("TWILIO_AUTH_TOKEN")
    );
  }

  return client;
}

export async function sendSMS(to: string, body: string) {
  const message = await getTwilioClient().messages.create({
    to,
    body,
    from: requireEnv("TWILIO_PHONE_NUMBER")
  });

  return message;
}

export function validateTwilioWebhook(
  signature: string | null,
  url: string,
  params: Record<string, string>
) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!signature || !token) {
    return false;
  }

  return twilio.validateRequest(token, signature, url, params);
}
