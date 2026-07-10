import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
  requireAdminMutation,
} from "@/lib/adminAuth";
import {
  createAdminAccount,
  getAdminAccounts,
  isAdminRole,
  normalizeAdminId,
  updateAdminAccount,
  type AdminRole,
} from "@/lib/adminAccounts";
import {
  normalizeAdminMenuPermissions,
  type AdminMenuKey,
} from "@/lib/adminPermissions";

export const runtime = "nodejs";

type CreateAccountBody = {
  id?: unknown;
  name?: unknown;
  password?: unknown;
  role?: unknown;
  active?: unknown;
  menuPermissions?: unknown;
};

type UpdateAccountBody = {
  id?: unknown;
  name?: unknown;
  password?: unknown;
  role?: unknown;
  active?: unknown;
  menuPermissions?: unknown;
};

function createForbiddenResponse() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "최고 관리자만 직원 계정을 관리할 수 있습니다.",
    },
    {
      status: 403,
    },
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error
    ? error.message
    : fallback;
}

function parseMenuPermissions(
  value: unknown,
  role: AdminRole,
): AdminMenuKey[] {
  return normalizeAdminMenuPermissions(value, role);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (auth.payload.adminRole !== "OWNER") {
    return createForbiddenResponse();
  }

  try {
    const accounts = await getAdminAccounts();

    return NextResponse.json({
      ok: true,
      accounts,
      currentAdminId: auth.payload.adminId,
    });
  } catch (error) {
    console.error(
      "[GET /api/admin/accounts]",
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

export async function POST(request: NextRequest) {
  const auth = await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (auth.payload.adminRole !== "OWNER") {
    return createForbiddenResponse();
  }

  try {
    const body =
      (await request.json()) as CreateAccountBody;

    const id = normalizeAdminId(body.id);
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "") as AdminRole;

    if (!isAdminRole(role)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "올바른 계정 권한을 선택해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const account = await createAdminAccount({
      id,
      name,
      password,
      role,
      active:
        typeof body.active === "boolean"
          ? body.active
          : true,
      menuPermissions: parseMenuPermissions(
        body.menuPermissions,
        role,
      ),
    });

    return NextResponse.json(
      {
        ok: true,
        message:
          "직원 계정이 등록되었습니다.",
        account,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "[POST /api/admin/accounts]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(
          error,
          "직원 계정을 등록하지 못했습니다.",
        ),
      },
      {
        status: 400,
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (auth.payload.adminRole !== "OWNER") {
    return createForbiddenResponse();
  }

  try {
    const body =
      (await request.json()) as UpdateAccountBody;

    const id = normalizeAdminId(body.id);

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "수정할 계정 아이디가 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const nextActive =
      typeof body.active === "boolean"
        ? body.active
        : undefined;

    if (
      id === auth.payload.adminId &&
      nextActive === false
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "현재 로그인한 본인 계정은 비활성화할 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const role =
      typeof body.role === "string"
        ? body.role
        : undefined;

    if (
      typeof role !== "undefined" &&
      !isAdminRole(role)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "올바른 계정 권한을 선택해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const password =
      typeof body.password === "string"
        ? body.password
        : undefined;

    const menuPermissions =
      Array.isArray(body.menuPermissions)
        ? (body.menuPermissions as AdminMenuKey[])
        : undefined;

    const account = await updateAdminAccount(id, {
      name:
        typeof body.name === "string"
          ? body.name
          : undefined,
      password:
        password && password.length > 0
          ? password
          : undefined,
      role: role as AdminRole | undefined,
      active: nextActive,
      menuPermissions,
    });

    const currentAccountChanged =
      account.id === auth.payload.adminId;

    return NextResponse.json({
      ok: true,
      message: currentAccountChanged
        ? "본인 계정 정보가 수정되었습니다. 변경된 권한을 적용하려면 다시 로그인해주세요."
        : "직원 계정과 메뉴 권한이 수정되었습니다.",
      account,
      currentAccountChanged,
    });
  } catch (error) {
    console.error(
      "[PATCH /api/admin/accounts]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(
          error,
          "직원 계정을 수정하지 못했습니다.",
        ),
      },
      {
        status: 400,
      },
    );
  }
}