import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { sendEmail } from "@/lib/email/sesEmailService";
import {
  adminReservationReceivedEmail,
  customerReservationReceivedEmail,
} from "@/lib/email/reservationEmailTemplates";
import {
  checkRateLimit,
  getClientIp,
} from "@/lib/rateLimit";
import { getReservationRepository } from "@/lib/reservations/reservationRepository";
import type {
  Reservation,
  ReservationStatus,
} from "@/lib/reservations/types";
import { customerReservationReceivedSms } from "@/lib/sms/reservationSmsTemplate";
import { sendSms } from "@/lib/sms/smsProxyClient";

const allowedStatuses: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

const CUSTOMER_RESERVATION_RATE_LIMIT = 20;
const CUSTOMER_RESERVATION_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function isReservationStatus(value: string): value is ReservationStatus {
  return allowedStatuses.includes(value as ReservationStatus);
}

function parseLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

function normalizeCompareText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function createRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      ok: false,
      message: "예약 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

function createHoneypotSuccessResponse() {
  return NextResponse.json(
    {
      ok: true,
      reservation: null,
    },
    {
      status: 201,
    },
  );
}

function checkCustomerReservationRateLimit(request: Request) {
  const clientIp = getClientIp(request);

  return checkRateLimit({
    key: `customer-reservation:${clientIp}`,
    limit: CUSTOMER_RESERVATION_RATE_LIMIT,
    windowMs: CUSTOMER_RESERVATION_RATE_LIMIT_WINDOW_MS,
  });
}

function isDuplicateReservation(
  reservation: Reservation,
  input: {
    name: string;
    phone: string;
    program: string;
    reservationDate: string;
    people: number;
  },
) {
  const reservationDate = reservation.reservationDate || reservation.date || "";

  const targetStatuses: ReservationStatus[] = ["PENDING", "CONFIRMED"];

  if (!targetStatuses.includes(reservation.status)) {
    return false;
  }

  return (
    normalizeCompareText(reservation.name) === normalizeCompareText(input.name) &&
    normalizeCompareText(reservation.phone) === normalizeCompareText(input.phone) &&
    normalizeCompareText(reservation.program) ===
      normalizeCompareText(input.program) &&
    normalizeCompareText(reservationDate) ===
      normalizeCompareText(input.reservationDate) &&
    Number(reservation.people) === Number(input.people)
  );
}

async function findDuplicateReservation(input: {
  name: string;
  phone: string;
  program: string;
  reservationDate: string;
  people: number;
}) {
  const repository = getReservationRepository();
  const reservations = await repository.findAll();

  return (
    reservations.find((reservation) =>
      isDuplicateReservation(reservation, input),
    ) ?? null
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const repository = getReservationRepository();
    const searchParams = request.nextUrl.searchParams;

    const limit = parseLimit(searchParams.get("limit"));
    const cursor = searchParams.get("cursor") ?? undefined;
    const keyword = searchParams.get("keyword") ?? undefined;
    const rawStatus = searchParams.get("status") ?? "ALL";

    const status =
      rawStatus === "ALL" || isReservationStatus(rawStatus)
        ? rawStatus
        : "ALL";

    if (limit) {
      const result = await repository.findPaginated({
        limit,
        cursor,
        status,
        keyword,
      });

      return NextResponse.json({
        ok: true,
        reservations: result.reservations,
        nextCursor: result.nextCursor ?? null,
      });
    }

    const reservations = await repository.findAll();

    return NextResponse.json({
      ok: true,
      reservations,
    });
  } catch (error) {
    console.error("[GET /api/reservations]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "예약 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const rateLimit = checkCustomerReservationRateLimit(request);

  if (!rateLimit.ok) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();

    const company = String(body.company ?? "").trim();

    /*
     * Honeypot check
     *
     * 정상 사용자는 company 필드를 보거나 입력하지 않습니다.
     * 봇이 숨김 필드를 채운 경우 실제 저장/이메일 발송 없이 성공 응답처럼 반환합니다.
     */
    if (company) {
      console.warn("[POST /api/reservations] honeypot blocked request");

      return createHoneypotSuccessResponse();
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const program = String(body.program ?? "").trim();

    const reservationDate = String(
      body.reservationDate ?? body.date ?? "",
    ).trim();

    const experienceTime = String(body.experienceTime ?? "").trim();

    const peopleValue = body.people ?? body.participants ?? body.persons ?? 1;
    const people = Number(peopleValue);

    const message = String(body.message ?? "").trim();

    if (!name || !phone || !program || !reservationDate) {
      return NextResponse.json(
        {
          ok: false,
          message: "필수 예약 정보가 누락되었습니다.",
          received: {
            name,
            email,
            phone,
            program,
            reservationDate,
            date: body.date,
            people,
          },
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(people) || people < 1) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 인원 정보가 올바르지 않습니다.",
          received: {
            people: peopleValue,
          },
        },
        { status: 400 },
      );
    }

    const duplicateReservation = await findDuplicateReservation({
      name,
      phone,
      program,
      reservationDate,
      people,
    });

    if (duplicateReservation) {
      return NextResponse.json(
        {
          ok: true,
          duplicated: true,
          message: "이미 같은 예약이 접수되어 있습니다.",
          reservation: duplicateReservation,
        },
        { status: 200 },
      );
    }

    const repository = getReservationRepository();

    const reservation = await repository.create({
      source: "CUSTOMER",
      name,
      email,
      phone,
      program,
      reservationDate,
      date: reservationDate,
      experienceTime,
      people,
      message,
      status: "PENDING",
    });

    if (email) {
      try {
        const customerEmail = customerReservationReceivedEmail(reservation);

        await sendEmail({
          to: email,
          subject: customerEmail.subject,
          html: customerEmail.html,
        });
      } catch (customerEmailError) {
        console.error(
          "[POST /api/reservations] customer email error:",
          customerEmailError,
        );
      }
    }

    try {
      await sendSms({
        to: reservation.phone,
        message: customerReservationReceivedSms(reservation),
      });
    } catch (customerSmsError) {
      console.error(
        "[POST /api/reservations] customer sms error:",
        customerSmsError,
      );
    }

    try {
      const adminEmail = process.env.ADMIN_EMAIL;

      if (adminEmail) {
        const adminEmailContent = adminReservationReceivedEmail(reservation);

        await sendEmail({
          to: adminEmail,
          subject: adminEmailContent.subject,
          html: adminEmailContent.html,
        });
      } else {
        console.warn("[POST /api/reservations] ADMIN_EMAIL is not set.");
      }
    } catch (adminEmailError) {
      console.error(
        "[POST /api/reservations] admin email error:",
        adminEmailError,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        duplicated: false,
        reservation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/reservations]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "예약 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
