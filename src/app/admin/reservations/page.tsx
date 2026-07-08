import Link from "next/link";
import { CalendarDays, Phone, UserRound } from "lucide-react";
import ReservationStatusBadge from "@/components/admin/ReservationStatusBadge";
import type { Reservation } from "@/types/reservation";

async function getReservations(): Promise<Reservation[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/reservations`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.reservations)) {
      return data.reservations;
    }

    return [];
  } catch {
    return [];
  }
}

function formatDate(date: string) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

export default async function AdminReservationsPage() {
  const reservations = await getReservations();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            예약 관리
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            접수된 예약을 확인하고 상세 내용을 관리합니다.
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          총 {reservations.length}건
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[120px_1.2fr_1fr_1fr_100px_100px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-600 lg:grid">
          <div>상태</div>
          <div>예약자</div>
          <div>프로그램</div>
          <div>예약일</div>
          <div>인원</div>
          <div className="text-right">관리</div>
        </div>

        {reservations.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              아직 등록된 예약이 없습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[120px_1.2fr_1fr_1fr_100px_100px] lg:items-center"
              >
                <div>
                  <ReservationStatusBadge status={reservation.status} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-400" />
                    <p className="font-bold text-slate-900">
                      {reservation.name}
                    </p>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="h-4 w-4" />
                    {reservation.phone}
                  </div>
                </div>

                <div className="text-sm font-medium text-slate-700">
                  {reservation.program || "-"}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(reservation.date)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {reservation.time || "시간 미정"}
                  </p>
                </div>

                <div className="text-sm font-bold text-slate-800">
                  {reservation.people}명
                </div>

                <div className="lg:text-right">
                  <Link
                    href={`/admin/reservations/${reservation.id}`}
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                  >
                    상세
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}