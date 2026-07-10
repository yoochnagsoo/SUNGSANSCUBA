import {
  NextRequest,
  NextResponse,
} from "next/server";

import { authenticateAdminAccount } from "@/lib/adminAccounts";
import { createAdminToken } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
) {
  const originValidation =
    requireSameOrigin(request);

  if (!originValidation.ok) {
    return originValidation.response;
  }

  try {
    const body = await request.json();

    const id = String(body.id ?? "")
      .trim()
      .toLowerCase();

    const password = String(
      body.password ?? "",
    );

    if (!id || !password) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "아이디와 비밀번호를 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const account =
      await authenticateAdminAccount(
        id,
        password,
      );

    if (!account) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "아이디 또는 비밀번호가 올바르지 않습니다.",
        },
        {
          status: 401,
        },
      );
    }

    const token =
      await createAdminToken(account);

    const response =
      NextResponse.json({
        ok: true,
        message:
          "로그인되었습니다.",
        admin: {
          id: account.id,
          name: account.name,
          role: account.role,
        },
      });

    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.headers.set(
      "Cache-Control",
      "no-store",
    );

    return response;
  } catch (error) {
    console.error(
      "[POST /api/admin/login]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "로그인 처리 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}