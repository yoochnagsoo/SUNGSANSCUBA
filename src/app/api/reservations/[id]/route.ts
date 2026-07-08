import { NextRequest, NextResponse } from "next/server";
import {
  getReservationById,
  updateReservation,
} from "@/lib/reservations/reservationRepository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  const reservation = await getReservationById(id);

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
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  const body = await request.json();

  const reservation = await updateReservation(id, {
    status: body.status,
    adminMemo: body.adminMemo,
  });

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
}