import { NextRequest, NextResponse } from "next/server";

import { normalizeProgramValue } from "@/lib/programs";
import { reservationRepository } from "@/lib/reservations/reservationRepository";
import type { ReservationStatus } from "@/lib/reservations/types";

const validStatuses: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value: unknown): ReservationStatus {
  if (
    typeof value === "string" &&
    validStatuses.includes(value as ReservationStatus)
  ) {
    return value as ReservationStatus;
  }

  return "CONFIRMED";
}

function normalizePeople(value: unknown) {
  const people = Number(value ?? 1);

  if (!Number.isFinite(people)) {
    return 1;
  }

  return Math.max(1, Math.floor(people));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const name = normalizeString(body.name);
    const phone = normalizeString(body.phone);
    const email = normalizeString(body.email);

    const rawProgram = normalizeString(body.program ?? body.title);
    const program = normalizeProgramValue(rawProgram);

    const reservationDate = normalizeString(body.reservationDate ?? body.date);
    const experienceTime = normalizeString(body.experienceTime);
    const people = normalizePeople(body.people);
    const memo = normalizeString(body.memo ?? body.message);
    const status = normalizeStatus(body.status);

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
          message: "프로그램 / 예약 내용을 선택해주세요.",
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
          message: "예약일을 선택해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!experienceTime) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 시간을 선택해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const adminMemo = memo
      ? `관리자가 캘린더에서 직접 등록한 예약입니다.\n\n${memo}`
      : "관리자가 캘린더에서 직접 등록한 예약입니다.";

    const reservation = await reservationRepository.create({
      source: "ADMIN",

      name,
      email,
      phone,
      program,

      reservationDate,
      date: reservationDate,

      experienceTime,

      people,
      message: memo,

      status,
      adminMemo,
    });

    return NextResponse.json({
      ok: true,
      reservation,
    });
  } catch (error) {
    console.error("[POST /api/admin/calendar-reservations]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "예약 등록 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}