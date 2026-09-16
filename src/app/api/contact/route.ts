import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/api/config";
import {
  createContact,
  isContactTopic,
  listContacts,
} from "@/lib/contact-store";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public — gửi form liên hệ từ /contact */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Body JSON không hợp lệ" } },
      { status: 400 },
    );
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const topic = raw.topic;

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: { message: "Họ tên không hợp lệ" } },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: { message: "Email không hợp lệ" } },
      { status: 400 },
    );
  }
  if (!isContactTopic(topic)) {
    return NextResponse.json(
      { error: { message: "Chủ đề không hợp lệ" } },
      { status: 400 },
    );
  }
  if (!message || message.length < 5) {
    return NextResponse.json(
      { error: { message: "Nội dung quá ngắn" } },
      { status: 400 },
    );
  }
  if (message.length > 4000) {
    return NextResponse.json(
      { error: { message: "Nội dung quá dài" } },
      { status: 400 },
    );
  }

  try {
    const created = await createContact({ name, email, topic, message });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Không lưu được liên hệ";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

/** Admin — danh sách góp ý (cần cookie đăng nhập) */
export async function GET(request: NextRequest) {
  const sid = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!sid) {
    return NextResponse.json(
      { error: { message: "Bạn cần đăng nhập để xem danh sách liên hệ." } },
      { status: 401 },
    );
  }

  try {
    const items = await listContacts();
    return NextResponse.json(items);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Không tải được liên hệ";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
