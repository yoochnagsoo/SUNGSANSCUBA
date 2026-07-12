import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getAdminAccountById } from "@/lib/adminAccounts";
import {
  canAccessAdminMenu,
  type AdminMenuKey,
} from "@/lib/adminPermissions";
import {
  verifyAdminToken,
  type AdminTokenPayload,
} from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export type AdminAuthPayload =
  AdminTokenPayload;

export type RequireAdminResult =
  | {
      ok: true;
      payload: AdminAuthPayload;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function createUnauthorizedResponse(
  message: string,
) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status: 401,
    },
  );
}

function createForbiddenResponse(message: string) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status: 403,
    },
  );
}

function clearAdminToken(
  response: NextResponse,
) {
  response.cookies.set({
    name: "admin_token",
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function requireAdmin(
  request: NextRequest,
): Promise<RequireAdminResult> {
  const token =
    request.cookies.get(
      "admin_token",
    )?.value;

  if (!token) {
    return {
      ok: false,
      response:
        createUnauthorizedResponse(
          "관리자 인증이 필요합니다.",
        ),
    };
  }

  try {
    const payload =
      await verifyAdminToken(token);

    if (!payload) {
      return {
        ok: false,
        response: clearAdminToken(
          createUnauthorizedResponse(
            "관리자 인증이 만료되었거나 유효하지 않습니다.",
          ),
        ),
      };
    }

    const account =
      await getAdminAccountById(
        payload.adminId,
      );

    if (!account || !account.active) {
      return {
        ok: false,
        response: clearAdminToken(
          createUnauthorizedResponse(
            "비활성화되었거나 존재하지 않는 관리자 계정입니다.",
          ),
        ),
      };
    }

    if (
      account.name !==
        payload.adminName ||
      account.role !==
        payload.adminRole
    ) {
      return {
        ok: false,
        response: clearAdminToken(
          createUnauthorizedResponse(
            "관리자 계정 정보가 변경되었습니다. 다시 로그인해주세요.",
          ),
        ),
      };
    }

    return {
      ok: true,
      payload,
    };
  } catch (error) {
    console.error(
      "관리자 API 인증 오류:",
      error,
    );

    return {
      ok: false,
      response: clearAdminToken(
        createUnauthorizedResponse(
          "관리자 인증을 확인하는 중 오류가 발생했습니다.",
        ),
      ),
    };
  }
}

export async function requireAdminMutation(
  request: NextRequest,
): Promise<RequireAdminResult> {
  const originValidation =
    requireSameOrigin(request);

  if (!originValidation.ok) {
    return {
      ok: false,
      response:
        originValidation.response,
    };
  }

  return requireAdmin(request);
}

export async function requireAdminMenu(
  request: NextRequest,
  menuKey: AdminMenuKey,
): Promise<RequireAdminResult> {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth;
  }

  if (
    !canAccessAdminMenu(
      auth.payload.adminRole,
      auth.payload.menuPermissions,
      menuKey,
    )
  ) {
    return {
      ok: false,
      response: createForbiddenResponse(
        "해당 관리자 메뉴에 접근할 권한이 없습니다.",
      ),
    };
  }

  return auth;
}

export async function requireAdminMenuMutation(
  request: NextRequest,
  menuKey: AdminMenuKey,
): Promise<RequireAdminResult> {
  const originValidation = requireSameOrigin(request);

  if (!originValidation.ok) {
    return {
      ok: false,
      response: originValidation.response,
    };
  }

  return requireAdminMenu(request, menuKey);
}
