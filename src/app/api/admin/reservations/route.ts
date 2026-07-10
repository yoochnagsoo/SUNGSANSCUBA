import { NextRequest, NextResponse } from "next/server";

import { requireAdminMutation } from "@/lib/adminAuth";
import { getReservationRepository } from "@/lib/reservations/reservationRepository";
import type { ReservationStatus } from "@/lib/reservations/types";

const allowedStatuses: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

type AdminReservationCreateBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  program?: unknown;
  reservationDate?: unknown;
  date?: unknown;
  experienceTime?: unknown;
  people?: unknown;
  participants?: unknown;
  persons?: unknown;
  message?: unknown;
  adminMemo?: unknown;
  status?: unknown;
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function isReservationStatus(value: unknown): value is ReservationStatus {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(value as ReservationStatus)
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "알 수 없는 오류가 발생했습니다.";
  }
}

async function readRequestBody(
  request: NextRequest,
): Promise<
  | {
      ok: true;
      body: AdminReservationCreateBody;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            ok: false,
            message: "요청 데이터가 올바르지 않습니다.",
          },
          {
            status: 400,
          },
        ),
      };
    }

    return {
      ok: true,
      body: body as AdminReservationCreateBody,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "요청 데이터를 읽을 수 없습니다.",
        },
        {
          status: 400,
        },
      ),
    };
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const parsedBody = await readRequestBody(request);

    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const body = parsedBody.body;

    const name = normalizeText(body.name);
    const email = normalizeOptionalText(body.email) || "";
    const phone = normalizeText(body.phone);
    const program = normalizeText(body.program);

    const reservationDate = normalizeText(
      body.reservationDate ?? body.date,
    );

    const experienceTime = normalizeOptionalText(body.experienceTime);

    const peopleValue =
      body.people ?? body.participants ?? body.persons ?? 1;

    const people = Number(peopleValue);

    const message = normalizeOptionalText(body.message);
    const adminMemo = normalizeOptionalText(body.adminMemo);

    const status = isReservationStatus(body.status)
      ? body.status
      : "CONFIRMED";

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          message: "이름을 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          message: "연락처를 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!program) {
      return NextResponse.json(
        {
          ok: false,
          message: "프로그램을 선택해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!reservationDate) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약일을 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidDate(reservationDate)) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약일 형식이 올바르지 않습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (!Number.isFinite(people) || people < 1) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 인원 정보가 올바르지 않습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const repository = getReservationRepository();

    const reservation = await repository.create({
      source: "ADMIN",
      name,
      email,
      phone,
      program,
      reservationDate,
      date: reservationDate,
      experienceTime,
      people,
      message,
      adminMemo,
      status,
    });

    return NextResponse.json(
      {
        ok: true,
        reservation,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    console.error("[POST /api/admin/reservations]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "관리자 예약 등록 중 오류가 발생했습니다.",
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}