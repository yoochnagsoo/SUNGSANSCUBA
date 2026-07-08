import { NextRequest, NextResponse } from "next/server";
import { getReservationRepository } from "@/lib/reservations/reservationRepository";
import { sendEmail } from "@/lib/email/sesEmailService";
import { customerReservationConfirmedEmail } from "@/lib/email/reservationEmailTemplates";
import type { ReservationStatus } from "@/lib/reservations/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

function isReservationStatus(value: unknown): value is ReservationStatus {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(value as ReservationStatus)
  );
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const repository = getReservationRepository();
    const reservation = await repository.findById(id);

    if (!reservation) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      reservation,
    });
  } catch (error) {
    console.error("[GET /api/reservations/[id]]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "예약 상세 정보를 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const repository = getReservationRepository();

    const currentReservation = await repository.findById(id);

    if (!currentReservation) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const nextStatus = body.status;

    if (nextStatus !== undefined && !isReservationStatus(nextStatus)) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 상태 값이 올바르지 않습니다.",
        },
        { status: 400 }
      );
    }

    const adminMemo =
      body.adminMemo === undefined ? undefined : String(body.adminMemo);

    const shouldSendConfirmedEmail =
      currentReservation.status !== "CONFIRMED" &&
      nextStatus === "CONFIRMED";

    const updatedReservation = await repository.update(id, {
      status: nextStatus ?? currentReservation.status,
      adminMemo,
    });

    if (!updatedReservation) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    if (shouldSendConfirmedEmail) {
      try {
        const confirmedEmail =
          customerReservationConfirmedEmail(updatedReservation);

        await sendEmail({
          to: updatedReservation.email,
          subject: confirmedEmail.subject,
          html: confirmedEmail.html,
        });
      } catch (emailError) {
        console.error(
          "[PATCH /api/reservations/[id]] confirmed email error:",
          emailError
        );
      }
    }

    return NextResponse.json({
      ok: true,
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error("[PATCH /api/reservations/[id]]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "예약 정보를 수정하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const repository = getReservationRepository();
    const deleted = await repository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("[DELETE /api/reservations/[id]]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "예약 정보를 삭제하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}