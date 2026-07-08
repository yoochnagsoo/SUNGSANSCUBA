import { NextRequest, NextResponse } from "next/server";
import { createAdminToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const adminId = process.env.ADMIN_ID || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

  if (body.id !== adminId || body.password !== adminPassword) {
    return NextResponse.json(
      { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const token = await createAdminToken();

  const response = NextResponse.json({ ok: true });

  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}