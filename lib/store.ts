import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredMessage = {
  id: string;
  from: string;
  to?: string;
  body: string;
  messageSid?: string;
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
  const messages = await readJsonFile<StoredMessage[]>(messagesPath, []);
  return messages.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function appendMessage(message: StoredMessage) {
  const messages = await readJsonFile<StoredMessage[]>(messagesPath, []);
  messages.push(message);
  await writeJsonFile(messagesPath, messages);
  return message;
}

export async function getCalls() {
  const calls = await readJsonFile<StoredCall[]>(callsPath, []);
  return calls.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function appendCall(call: StoredCall) {
  const calls = await readJsonFile<StoredCall[]>(callsPath, []);
  calls.push(call);
  await writeJsonFile(callsPath, calls);
  return call;
}
