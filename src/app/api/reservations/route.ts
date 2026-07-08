import { NextResponse } from "next/server";
import { getReservationRepository } from "@/lib/reservations/reservationRepository";
import { sendEmail } from "@/lib/email/sesEmailService";
import {
  adminReservationReceivedEmail,
  customerReservationReceivedEmail,
} from "@/lib/email/reservationEmailTemplates";

export async function GET() {
  try {
    const repository = getReservationRepository();
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
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const program = String(body.program ?? "").trim();

    const reservationDate = String(
      body.reservationDate ?? body.date ?? ""
    ).trim();

    const peopleValue = body.people ?? body.participants ?? body.persons ?? 1;
    const people = Number(peopleValue);

    const message = String(body.message ?? "").trim();

    if (!name || !email || !phone || !program || !reservationDate) {
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
        { status: 400 }
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
        { status: 400 }
      );
    }

    const repository = getReservationRepository();

    const reservation = await repository.create({
      name,
      email,
      phone,
      program,
      reservationDate,
      date: reservationDate,
      people,
      message,
      status: "PENDING",
    });

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
        customerEmailError
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
        adminEmailError
      );
    }

    return NextResponse.json(
      {
        ok: true,
        reservation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/reservations]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "예약 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}