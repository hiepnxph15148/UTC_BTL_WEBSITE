import { promises as fs } from "fs";
import path from "path";

export type ContactTopic = "order" | "size" | "partner" | "other";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: ContactTopic;
  subject: string;
  message: string;
  status: "Open" | "Reviewed" | "Closed";
  createdAt: string;
};

export type ContactInput = {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
};

const TOPIC_SUBJECT: Record<ContactTopic, string> = {
  order: "Đơn hàng",
  size: "Đổi size",
  partner: "Hợp tác",
  other: "Khác",
};

const MAX_MESSAGES = 500;

function dataFilePath() {
  // Vercel/serverless: /tmp; local: ./data
  const base =
    process.env.CONTACT_DATA_DIR ||
    (process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data"));
  return path.join(base, "contacts.json");
}

async function ensureFile(): Promise<void> {
  const file = dataFilePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, "[]", "utf8");
  }
}

async function readAll(): Promise<ContactMessage[]> {
  await ensureFile();
  const raw = await fs.readFile(dataFilePath(), "utf8");
  try {
    const parsed = JSON.parse(raw) as ContactMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: ContactMessage[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(dataFilePath(), JSON.stringify(items, null, 2), "utf8");
}

export function topicLabel(topic: ContactTopic): string {
  return TOPIC_SUBJECT[topic] ?? TOPIC_SUBJECT.other;
}

export function isContactTopic(value: unknown): value is ContactTopic {
  return (
    value === "order" ||
    value === "size" ||
    value === "partner" ||
    value === "other"
  );
}

export async function listContacts(): Promise<ContactMessage[]> {
  const items = await readAll();
  return items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createContact(
  input: ContactInput,
): Promise<ContactMessage> {
  const items = await readAll();
  const entry: ContactMessage = {
    id: `CT-${Date.now().toString(36).toUpperCase()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    topic: input.topic,
    subject: topicLabel(input.topic),
    message: input.message.trim(),
    status: "Open",
    createdAt: new Date().toISOString(),
  };
  items.unshift(entry);
  await writeAll(items.slice(0, MAX_MESSAGES));
  return entry;
}
