import { NextRequest, NextResponse } from "next/server";

import { reservationRepository } from "@/lib/reservations/reservationRepository";
import {
  sendReservationCancelledEmail,
  sendReservationConfirmedEmail,
} from "@/lib/reservations/reservationEmail";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Reservation = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  program: string;
  reservationDate: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ReservationRepositoryLike = {
  findById?: (id: string) => Promise<Reservation | null>;
  getById?: (id: string) => Promise<Reservation | null>;
};

async function getReservationById(id: string) {
  const repo = reservationRepository as unknown as ReservationRepositoryLike;

  if (repo.findById) {
    return repo.findById(id);
  }

  if (repo.getById) {
    return repo.getById(id);
  }

  throw new Error("예약 조회 메서드를 찾을 수 없습니다.");
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const reservation = await getReservationById(id);

    if (!reservation) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 정보를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    if (reservation.status === "CONFIRMED") {
      const result = await sendReservationConfirmedEmail(reservation);

      return NextResponse.json({
        ok: true,
        emailType: "CONFIRMED",
        email: result,
      });
    }

    if (reservation.status === "CANCELLED") {
      const result = await sendReservationCancelledEmail(reservation);

      return NextResponse.json({
        ok: true,
        emailType: "CANCELLED",
        email: result,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message:
          "예약확정 또는 취소 상태에서만 안내 메일을 다시 보낼 수 있습니다.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "메일을 다시 보내지 못했습니다.",
      },
      { status: 500 },
    );
  }
}