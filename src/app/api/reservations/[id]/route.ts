import { NextRequest, NextResponse } from "next/server";

import {
  requireAdmin,
  requireAdminMutation,
} from "@/lib/adminAuth";
import { getAdminAccounts } from "@/lib/adminAccounts";
import { reservationRepository } from "@/lib/reservations/reservationRepository";
import {
  sendReservationCancelledEmail,
  sendReservationConfirmedEmail,
} from "@/lib/reservations/reservationEmail";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "ETC";

type Reservation = {
  id: string;
  source?: "CUSTOMER" | "ADMIN";
  name: string;
  phone: string;
  email?: string;
  program: string;
  reservationDate: string;
  date?: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;

  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentMemo?: string;
  completedAt?: string;

  primaryStaffId?: string;
  primaryStaffName?: string;
  assistantStaffIds?: string[];
  assistantStaffNames?: string[];

  createdAt?: string;
  updatedAt?: string;
};

type ReservationPatchBody = {
  name?: string;
  phone?: string;
  email?: string;
  program?: string;
  reservationDate?: string;
  people?: number;
  status?: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;

  paymentAmount?: number;
  paymentMethod?: PaymentMethod | "";
  paymentMemo?: string;
  completedAt?: string;

  primaryStaffId?: string;
  assistantStaffIds?: string[];
};

type ReservationRepositoryLike = {
  findById?: (
    id: string,
  ) => Promise<Reservation | null>;

  getById?: (
    id: string,
  ) => Promise<Reservation | null>;

  update: (
    id: string,
    input: Partial<Reservation>,
  ) => Promise<Reservation | null>;

  delete: (
    id: string,
  ) => Promise<boolean>;
};

const VALID_STATUSES: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "CARD",
  "TRANSFER",
  "NAVER_PAY",
  "KAKAO_PAY",
  "ETC",
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIsoDateTime(value: string) {
  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

function normalizeStaffId(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeStaffIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => normalizeStaffId(item))
        .filter(Boolean),
    ),
  );
}

async function resolveStaffAssignment(
  primaryStaffIdValue: unknown,
  assistantStaffIdsValue: unknown,
) {
  const accounts = await getAdminAccounts();

  const activeAccounts = accounts.filter(
    (account) => account.active,
  );

  const accountMap = new Map(
    activeAccounts.map((account) => [
      normalizeStaffId(account.id),
      account,
    ]),
  );

  const primaryStaffId = normalizeStaffId(
    primaryStaffIdValue,
  );

  if (
    primaryStaffId &&
    !accountMap.has(primaryStaffId)
  ) {
    throw new Error(
      "선택한 주 담당 직원을 찾을 수 없습니다.",
    );
  }

  /*
   * 주 담당자와 동일한 계정은 보조 담당자에서 제외합니다.
   *
   * 삭제되었거나 비활성화된 기존 보조 담당자 ID도
   * 저장 오류를 발생시키지 않고 자동으로 제외합니다.
   */
  const assistantStaffIds = normalizeStaffIds(
    assistantStaffIdsValue,
  ).filter(
    (staffId) =>
      staffId !== primaryStaffId &&
      accountMap.has(staffId),
  );

  return {
    primaryStaffId,

    primaryStaffName: primaryStaffId
      ? accountMap.get(primaryStaffId)?.name || ""
      : "",

    assistantStaffIds,

    assistantStaffNames: assistantStaffIds.map(
      (staffId) =>
        accountMap.get(staffId)?.name || staffId,
    ),
  };
}

async function getReservationById(id: string) {
  const repo =
    reservationRepository as unknown as ReservationRepositoryLike;

  if (repo.findById) {
    return repo.findById(id);
  }

  if (repo.getById) {
    return repo.getById(id);
  }

  throw new Error(
    "예약 조회 메서드를 찾을 수 없습니다.",
  );
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const reservation =
      await getReservationById(id);

    if (!reservation) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "예약 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      reservation,
    });
  } catch (error) {
    console.error(
      "[GET /api/reservations/[id]]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "예약 정보를 불러오지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const body =
      (await request.json()) as ReservationPatchBody;

    const previousReservation =
      await getReservationById(id);

    if (!previousReservation) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "예약 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const updateInput: Partial<Reservation> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof body.name === "string") {
      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "이름을 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.name = name;
    }

    if (typeof body.phone === "string") {
      const phone = body.phone.trim();

      if (!phone) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "연락처를 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.phone = phone;
    }

    if (typeof body.email === "string") {
      const email = body.email.trim();

      if (
        email &&
        !isValidEmail(email)
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "올바른 이메일 주소를 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.email = email;
    }

    if (typeof body.program === "string") {
      const program = body.program.trim();

      if (!program) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "프로그램을 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.program = program;
    }

    if (
      typeof body.reservationDate ===
      "string"
    ) {
      const reservationDate =
        body.reservationDate.trim();

      if (!reservationDate) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "예약 희망일을 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.reservationDate =
        reservationDate;

      updateInput.date =
        reservationDate;
    }

    if (
      typeof body.people !== "undefined"
    ) {
      const people = Number(body.people);

      if (
        !Number.isFinite(people) ||
        people < 1
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "인원은 1명 이상이어야 합니다.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.people =
        Math.floor(people);
    }

    if (
      typeof body.status !== "undefined"
    ) {
      if (
        !VALID_STATUSES.includes(body.status)
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "올바른 예약 상태가 아닙니다.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.status = body.status;
    }

    if (
      typeof body.adminMemo === "string"
    ) {
      updateInput.adminMemo =
        body.adminMemo;
    }

    if (
      typeof body.experienceTime ===
      "string"
    ) {
      updateInput.experienceTime =
        body.experienceTime.trim();
    }

    if (
      typeof body.primaryStaffId !==
        "undefined" ||
      typeof body.assistantStaffIds !==
        "undefined"
    ) {
      try {
        const assignment =
          await resolveStaffAssignment(
            body.primaryStaffId,
            body.assistantStaffIds,
          );

        updateInput.primaryStaffId =
          assignment.primaryStaffId;

        updateInput.primaryStaffName =
          assignment.primaryStaffName;

        updateInput.assistantStaffIds =
          assignment.assistantStaffIds;

        updateInput.assistantStaffNames =
          assignment.assistantStaffNames;
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "담당 직원 정보를 확인하지 못했습니다.",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (
      typeof body.paymentAmount !==
      "undefined"
    ) {
      const paymentAmount = Number(
        body.paymentAmount,
      );

      if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount < 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "결제금액을 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.paymentAmount =
        Math.floor(paymentAmount);
    }

    if (
      typeof body.paymentMethod !==
      "undefined"
    ) {
      if (!body.paymentMethod) {
        updateInput.paymentMethod =
          undefined;
      } else if (
        !VALID_PAYMENT_METHODS.includes(
          body.paymentMethod,
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "올바른 결제방법이 아닙니다.",
          },
          {
            status: 400,
          },
        );
      } else {
        updateInput.paymentMethod =
          body.paymentMethod;
      }
    }

    if (
      typeof body.paymentMemo === "string"
    ) {
      updateInput.paymentMemo =
        body.paymentMemo;
    }

    if (
      typeof body.completedAt === "string"
    ) {
      const completedAt =
        body.completedAt.trim();

      if (
        completedAt &&
        !isValidIsoDateTime(completedAt)
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "완료일시 형식이 올바르지 않습니다.",
          },
          {
            status: 400,
          },
        );
      }

      updateInput.completedAt =
        completedAt || undefined;
    }

    const nextStatus =
      updateInput.status ||
      previousReservation.status;

    if (nextStatus === "COMPLETED") {
      const nextPaymentAmount =
        typeof updateInput.paymentAmount ===
        "number"
          ? updateInput.paymentAmount
          : previousReservation.paymentAmount;

      const nextPaymentMethod =
        typeof updateInput.paymentMethod ===
        "string"
          ? updateInput.paymentMethod
          : previousReservation.paymentMethod;

      if (
        typeof nextPaymentAmount !==
          "number" ||
        !Number.isFinite(
          nextPaymentAmount,
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "완료 처리 시 결제금액을 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      if (!nextPaymentMethod) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "완료 처리 시 결제방법을 선택해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        !updateInput.completedAt &&
        !previousReservation.completedAt
      ) {
        updateInput.completedAt =
          new Date().toISOString();
      }
    }

    /*
     * 완료 상태가 아닐 때는 기존 결제 정보를
     * 현재 프로젝트의 기존 정책대로 변경하지 않습니다.
     */
    if (nextStatus !== "COMPLETED") {
      delete updateInput.paymentAmount;
      delete updateInput.paymentMethod;
      delete updateInput.paymentMemo;
      delete updateInput.completedAt;
    }

    const updatedReservation = await (
      reservationRepository as unknown as ReservationRepositoryLike
    ).update(id, updateInput);

    if (!updatedReservation) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "예약 정보를 수정하지 못했습니다.",
        },
        {
          status: 500,
        },
      );
    }

    const statusChanged =
      previousReservation.status !==
      updatedReservation.status;

    let emailSent = false;
    let emailSkippedReason = "";
    let emailError = "";

    if (
      statusChanged &&
      updatedReservation.status ===
        "CONFIRMED"
    ) {
      const result =
        await sendReservationConfirmedEmail(
          updatedReservation,
        );

      emailSent = result.sent;
      emailSkippedReason =
        result.skippedReason || "";
      emailError = result.error || "";
    }

    if (
      statusChanged &&
      updatedReservation.status ===
        "CANCELLED"
    ) {
      const result =
        await sendReservationCancelledEmail(
          updatedReservation,
        );

      emailSent = result.sent;
      emailSkippedReason =
        result.skippedReason || "";
      emailError = result.error || "";
    }

    return NextResponse.json({
      ok: true,
      reservation: updatedReservation,
      email: {
        sent: emailSent,
        skippedReason:
          emailSkippedReason,
        error: emailError,
      },
    });
  } catch (error) {
    console.error(
      "[PATCH /api/reservations/[id]]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "예약 정보를 저장하지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  const auth =
    await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const reservation =
      await getReservationById(id);

    if (!reservation) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "예약 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const deleted = await (
      reservationRepository as unknown as ReservationRepositoryLike
    ).delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "예약 정보를 삭제하지 못했습니다.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "예약 정보가 삭제되었습니다.",
      reservationId: id,
    });
  } catch (error) {
    console.error(
      "[DELETE /api/reservations/[id]]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "예약 정보를 삭제하지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}