import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredMessage = {
  id: string;
  from: string;
  to?: string;
  body: string;
  messageSid?: string;
  source?: "twilio" | "relay";
  direction: "inbound" | "outbound";
  timestamp: string;
};

export type StoredCall = {
  id: string;
  from: string;
  to?: string;
  callSid?: string;
  status?: string;
  duration?: string;
  timestamp: string;
};

const dataDir = path.join(process.cwd(), "data");
const messagesPath = path.join(dataDir, "messages.json");
const callsPath = path.join(dataDir, "calls.json");
const messagesKey = "central-communication:messages";
const callsKey = "central-communication:calls";

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { token, url: url.replace(/\/$/, "") };
}

async function redisCommand<T>(command: unknown[]): Promise<T> {
  const config = redisConfig();
  if (!config) {
    throw new Error("Upstash Redis is not configured");
  }

  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([command]),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Upstash Redis request failed: ${response.status}`);
  }

  const [result] = (await response.json()) as Array<{
    error?: string;
    result: T;
  }>;

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result;
}

async function readStoredList<T>(key: string, filePath: string) {
  if (redisConfig()) {
    const raw = await redisCommand<string | null>(["GET", key]);
    return raw ? (JSON.parse(raw) as T[]) : [];
  }

  return readJsonFile<T[]>(filePath, []);
}

async function writeStoredList<T>(key: string, filePath: string, data: T[]) {
  if (redisConfig()) {
    await redisCommand<string>(["SET", key, JSON.stringify(data)]);
    return;
  }

  await writeJsonFile(filePath, data);
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      await mkdir(dataDir, { recursive: true });
      await writeFile(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getMessages() {
  const messages = await readStoredList<StoredMessage>(
    messagesKey,
    messagesPath
  );
  return messages.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function appendMessage(message: StoredMessage) {
  const messages = await readStoredList<StoredMessage>(
    messagesKey,
    messagesPath
  );
  messages.push(message);
  await writeStoredList(messagesKey, messagesPath, messages);
  return message;
}

export async function getCalls() {
  const calls = await readStoredList<StoredCall>(callsKey, callsPath);
  return calls.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function appendCall(call: StoredCall) {
  const calls = await readStoredList<StoredCall>(callsKey, callsPath);
  calls.push(call);
  await writeStoredList(callsKey, callsPath, calls);
  return call;
}
