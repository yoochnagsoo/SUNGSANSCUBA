import { NextRequest, NextResponse } from "next/server";
import {
  createReservation,
  listReservations,
} from "@/lib/reservations/reservationRepository";

export async function GET() {
  try {
    const reservations = await listReservations();
    return NextResponse.json({ ok: true, reservations });
  } catch (error) {
    console.error("GET /api/reservations error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to list reservations",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const reservation = await createReservation(body);

    return NextResponse.json(
      {
        ok: true,
        reservation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reservations error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to create reservation",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}