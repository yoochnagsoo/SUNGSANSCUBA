import Link from "next/link";
import { Phone, UserRound, Users } from "lucide-react";
import type { Reservation } from "@/types/reservation";
import ReservationStatusBadge from "@/components/admin/ReservationStatusBadge";

async function getReservations(): Promise<Reservation[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/reservations`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.reservations)) return data.reservations;

    return [];
  } catch {
    return [];
  }
}

function formatDate(date?: string) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type CustomerRow = {
  key: string;
  name: string;
  phone: string;
  email?: string;
  totalReservations: number;
  lastReservation?: Reservation;
};

export default async function AdminCustomersPage() {
  const reservations = await getReservations();

  const customerMap = reservations.reduce<Record<string, CustomerRow>>(
    (acc, reservation) => {
      const key = `${reservation.name}-${reservation.phone}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          name: reservation.name,
          phone: reservation.phone,
          email: reservation.email,
          totalReservations: 0,
          lastReservation: reservation,
        };
      }

      acc[key].totalReservations += 1;

      const prevDate = new Date(acc[key].lastReservation?.date ?? 0);
      const nextDate = new Date(reservation.date);

      if (nextDate > prevDate) {
        acc[key].lastReservation = reservation;
      }

      return acc;
    },
    {}
  );

  const customers = Object.values(customerMap).sort((a, b) => {
    const aTime = new Date(a.lastReservation?.date ?? 0).getTime();
    const bTime = new Date(b.lastReservation?.date ?? 0).getTime();

    return bTime - aTime;
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            고객 관리
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            예약 내역을 기준으로 고객 정보를 자동 정리합니다.
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          총 {customers.length}명
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.2fr_1fr_120px_1fr_120px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-600 lg:grid">
          <div>고객</div>
          <div>연락처</div>
          <div>예약 횟수</div>
          <div>최근 예약</div>
          <div className="text-right">상세</div>
        </div>

        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              아직 등록된 고객 정보가 없습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <div
                key={customer.key}
                className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[1.2fr_1fr_120px_1fr_120px] lg:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-400" />
                    <p className="font-bold text-slate-900">
                      {customer.name}
                    </p>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {customer.email || "이메일 없음"}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {customer.phone}
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {customer.totalReservations}회
                </div>

                <div>
                  {customer.lastReservation ? (
                    <>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDate(customer.lastReservation.date)}
                      </p>
                      <div className="mt-1">
                        <ReservationStatusBadge
                          status={customer.lastReservation.status}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">-</p>
                  )}
                </div>

                <div className="lg:text-right">
                  {customer.lastReservation ? (
                    <Link
                      href={`/admin/reservations/${customer.lastReservation.id}`}
                      className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                    >
                      보기
                    </Link>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}