import type { ContactMessage, ContactTopic } from "@/lib/contact-store";

export type { ContactMessage, ContactTopic };

export async function submitContact(input: {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}): Promise<ContactMessage> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const json = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
  } & Partial<ContactMessage>;

  if (!res.ok) {
    throw new Error(json.error?.message || "Gửi liên hệ thất bại");
  }

  return json as ContactMessage;
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const res = await fetch("/api/contact", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const json = (await res.json().catch(() => ({}))) as
    | ContactMessage[]
    | { error?: { message?: string } };

  if (!res.ok) {
    const err = json as { error?: { message?: string } };
    throw new Error(err.error?.message || "Không tải danh sách liên hệ");
  }

  return json as ContactMessage[];
}
