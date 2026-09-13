import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/api/auth-cookies";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
