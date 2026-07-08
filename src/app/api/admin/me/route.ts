import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  const payload = await verifyAdminToken(token);

  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      role: "admin",
    },
  });
}