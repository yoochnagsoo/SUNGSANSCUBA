import { NextRequest, NextResponse } from "next/server";
import { createAdminToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const adminId = process.env.ADMIN_ID || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

    const id = String(body.id || "").trim();
    const password = String(body.password || "");

    if (id !== adminId || password !== adminPassword) {
      return NextResponse.json(
        {
          ok: false,
          message: "아이디 또는 비밀번호가 올바르지 않습니다.",
        },
        { status: 401 },
      );
    }

    const token = await createAdminToken();

    const response = NextResponse.json({
      ok: true,
      message: "로그인되었습니다.",
    });

    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "로그인 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}