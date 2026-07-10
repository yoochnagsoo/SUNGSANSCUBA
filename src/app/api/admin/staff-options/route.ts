import {
  NextRequest,
  NextResponse,
} from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import {
  ADMIN_ROLE_LABEL,
  getAdminAccounts,
} from "@/lib/adminAccounts";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
) {
  const auth =
    await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const accounts =
      await getAdminAccounts();

    const staffOptions = accounts
      .filter(
        (account) => account.active,
      )
      .map((account) => ({
        id: account.id,
        name: account.name,
        role: account.role,
        roleLabel:
          ADMIN_ROLE_LABEL[
            account.role
          ],
      }))
      .sort((a, b) =>
        a.name.localeCompare(
          b.name,
          "ko",
        ),
      );

    return NextResponse.json({
      ok: true,
      staffOptions,
    });
  } catch (error) {
    console.error(
      "[GET /api/admin/staff-options]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "직원 계정 목록을 불러오지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}