import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getAdminAccountById } from "@/lib/adminAccounts";
import {
  requireAdmin,
  requireAdminMutation,
} from "@/lib/adminAuth";
import { staffScheduleRepository } from "@/lib/staffSchedules/staffScheduleRepository";
import type {
  StaffScheduleInput,
  StaffScheduleType,
} from "@/lib/staffSchedules/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_STAFF_SCHEDULE_TYPES: StaffScheduleType[] =
  [
    "VACATION",
    "HALF_DAY_AM",
    "HALF_DAY_PM",
    "SICK_LEAVE",
    "UNAVAILABLE",
    "TRAINING",
    "BUSINESS_TRIP",
  ];

type StaffScheduleRequestBody = {
  id?: unknown;
  staffId?: unknown;
  staffName?: unknown;
  type?: unknown;
  date?: unknown;
  endDate?: unknown;
  memo?: unknown;
};

function isValidStaffScheduleType(
  value: unknown,
): value is StaffScheduleType {
  return (
    typeof value === "string" &&
    VALID_STAFF_SCHEDULE_TYPES.includes(
      value as StaffScheduleType,
    )
  );
}

function isValidDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return false;
  }

  const [
    yearText,
    monthText,
    dayText,
  ] = value.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const date = new Date(
    year,
    month - 1,
    day,
  );

  return (
    date.getFullYear() === year &&
    date.getMonth() ===
      month - 1 &&
    date.getDate() === day
  );
}

function normalizeOptionalText(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized || undefined;
}

function normalizeRequiredText(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function normalizeId(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function getErrorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  try {
    return JSON.stringify(
      error,
    );
  } catch {
    return "알 수 없는 오류가 발생했습니다.";
  }
}

function validateStaffScheduleBody(
  body: StaffScheduleRequestBody,
):
  | {
      ok: true;
      input: StaffScheduleInput;
    }
  | {
      ok: false;
      message: string;
    } {
  const staffId =
    normalizeId(
      body.staffId,
    ).toLowerCase();

  const staffName =
    normalizeRequiredText(
      body.staffName,
    );

  const date =
    normalizeRequiredText(
      body.date,
    );

  const endDate =
    normalizeOptionalText(
      body.endDate,
    );

  const memo =
    normalizeOptionalText(
      body.memo,
    );

  if (!staffId) {
    return {
      ok: false,
      message:
        "직원을 선택해주세요.",
    };
  }

  if (!staffName) {
    return {
      ok: false,
      message:
        "선택한 직원 정보가 올바르지 않습니다.",
    };
  }

  if (
    !isValidStaffScheduleType(
      body.type,
    )
  ) {
    return {
      ok: false,
      message:
        "올바른 직원 일정 종류를 선택해주세요.",
    };
  }

  if (!date) {
    return {
      ok: false,
      message:
        "시작일을 입력해주세요.",
    };
  }

  if (!isValidDate(date)) {
    return {
      ok: false,
      message:
        "시작일 형식이 올바르지 않습니다.",
    };
  }

  if (
    endDate &&
    !isValidDate(endDate)
  ) {
    return {
      ok: false,
      message:
        "종료일 형식이 올바르지 않습니다.",
    };
  }

  if (
    endDate &&
    endDate < date
  ) {
    return {
      ok: false,
      message:
        "종료일은 시작일보다 빠를 수 없습니다.",
    };
  }

  return {
    ok: true,
    input: {
      staffId,
      staffName,
      type: body.type,
      date,
      endDate,
      memo,
    },
  };
}

async function resolveStaffScheduleInput(
  input: StaffScheduleInput,
): Promise<StaffScheduleInput> {
  /*
   * 브라우저가 전달한 staffName을 그대로 신뢰하지 않고
   * DynamoDB 관리자 계정에서 이름을 다시 가져옵니다.
   */
  const account =
    await getAdminAccountById(
      input.staffId,
    );

  if (!account) {
    throw new Error(
      "선택한 직원 계정을 찾을 수 없습니다.",
    );
  }

  if (!account.active) {
    throw new Error(
      "비활성화된 직원 계정은 일정에 지정할 수 없습니다.",
    );
  }

  return {
    ...input,
    staffId: account.id,
    staffName: account.name,
  };
}

async function readRequestBody(
  request: NextRequest,
): Promise<
  | {
      ok: true;
      body: StaffScheduleRequestBody;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  try {
    const body =
      (await request.json()) as unknown;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return {
        ok: false,
        response:
          NextResponse.json(
            {
              ok: false,
              message:
                "요청 데이터가 올바르지 않습니다.",
            },
            {
              status: 400,
            },
          ),
      };
    }

    return {
      ok: true,
      body:
        body as StaffScheduleRequestBody,
    };
  } catch {
    return {
      ok: false,
      response:
        NextResponse.json(
          {
            ok: false,
            message:
              "요청 데이터를 읽을 수 없습니다.",
          },
          {
            status: 400,
          },
        ),
    };
  }
}

async function requireStaffScheduleAdmin(
  request: NextRequest,
) {
  const auth =
    await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  return null;
}

async function requireStaffScheduleAdminMutation(
  request: NextRequest,
) {
  const auth =
    await requireAdminMutation(
      request,
    );

  if (!auth.ok) {
    return auth.response;
  }

  return null;
}

export async function GET(
  request: NextRequest,
) {
  const authResponse =
    await requireStaffScheduleAdmin(
      request,
    );

  if (authResponse) {
    return authResponse;
  }

  try {
    const staffSchedules =
      await staffScheduleRepository.list();

    return NextResponse.json({
      ok: true,
      staffSchedules,
    });
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "직원 일정 목록 조회 오류:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "직원 일정 목록을 불러오지 못했습니다.",
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  const authResponse =
    await requireStaffScheduleAdminMutation(
      request,
    );

  if (authResponse) {
    return authResponse;
  }

  try {
    const parsedBody =
      await readRequestBody(
        request,
      );

    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const validation =
      validateStaffScheduleBody(
        parsedBody.body,
      );

    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            validation.message,
        },
        {
          status: 400,
        },
      );
    }

    const resolvedInput =
      await resolveStaffScheduleInput(
        validation.input,
      );

    const staffSchedule =
      await staffScheduleRepository.create(
        resolvedInput,
      );

    return NextResponse.json(
      {
        ok: true,
        staffSchedule,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "직원 일정 등록 오류:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message: errorMessage,
      },
      {
        status: 400,
      },
    );
  }
}

async function updateStaffSchedule(
  request: NextRequest,
) {
  try {
    const parsedBody =
      await readRequestBody(
        request,
      );

    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const id = normalizeId(
      parsedBody.body.id,
    );

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "수정할 직원 일정 ID가 필요합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const validation =
      validateStaffScheduleBody(
        parsedBody.body,
      );

    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            validation.message,
        },
        {
          status: 400,
        },
      );
    }

    const resolvedInput =
      await resolveStaffScheduleInput(
        validation.input,
      );

    const staffSchedule =
      await staffScheduleRepository.update(
        id,
        resolvedInput,
      );

    if (!staffSchedule) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "수정할 직원 일정을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      staffSchedule,
    });
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "직원 일정 수정 오류:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message: errorMessage,
      },
      {
        status: 400,
      },
    );
  }
}

export async function PUT(
  request: NextRequest,
) {
  const authResponse =
    await requireStaffScheduleAdminMutation(
      request,
    );

  if (authResponse) {
    return authResponse;
  }

  return updateStaffSchedule(
    request,
  );
}

export async function PATCH(
  request: NextRequest,
) {
  const authResponse =
    await requireStaffScheduleAdminMutation(
      request,
    );

  if (authResponse) {
    return authResponse;
  }

  return updateStaffSchedule(
    request,
  );
}

export async function DELETE(
  request: NextRequest,
) {
  const authResponse =
    await requireStaffScheduleAdminMutation(
      request,
    );

  if (authResponse) {
    return authResponse;
  }

  try {
    const parsedBody =
      await readRequestBody(
        request,
      );

    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const id = normalizeId(
      parsedBody.body.id,
    );

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "삭제할 직원 일정 ID가 필요합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const deleted =
      await staffScheduleRepository.delete(
        id,
      );

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "삭제할 직원 일정을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      deletedId: id,
    });
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "직원 일정 삭제 오류:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "직원 일정을 삭제하지 못했습니다.",
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}