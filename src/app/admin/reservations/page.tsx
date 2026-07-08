"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Reservation = {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  reservationDate?: string;
  date?: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  createdAt: string;
  updatedAt: string;
};

type ReservationsResponse = {
  ok: boolean;
  reservations?: Reservation[];
  message?: string;
};

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: "대기",
  CONFIRMED: "확정",
  CANCELLED: "취소",
  COMPLETED: "완료",
};

const statusClassNames: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getReservationDate(reservation: Reservation) {
  return reservation.reservationDate || reservation.date || "-";
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadReservations() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/reservations", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as ReservationsResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "예약 목록을 불러오지 못했습니다.");
      }

      setReservations(data.reservations ?? []);
    } catch (error) {
      console.error("[AdminReservationsPage] loadReservations error:", error);
      setErrorMessage("예약 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  return (
    <main className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-600">Reservations</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">예약 관리</h1>
          <p className="mt-2 text-sm text-slate-500">
            고객 예약 신청 내역을 확인하고 상태를 관리합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReservations}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            예약 목록{" "}
            <span className="text-sm font-medium text-slate-500">
              ({reservations.length}건)
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">
            예약 목록을 불러오는 중입니다.
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">
            아직 접수된 예약이 없습니다.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      예약자
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      프로그램
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      예약일자
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      인원
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      상태
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      접수일시
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      상세
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {reservation.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {reservation.phone}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {reservation.email}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {reservation.program}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {getReservationDate(reservation)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {reservation.people}명
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                            statusClassNames[reservation.status]
                          }`}
                        >
                          {statusLabels[reservation.status]}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDateTime(reservation.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/reservations/${reservation.id}`}
                          className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {reservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  href={`/admin/reservations/${reservation.id}`}
                  className="block p-5 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">
                        {reservation.name}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {reservation.phone}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {reservation.email}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                        statusClassNames[reservation.status]
                      }`}
                    >
                      {statusLabels[reservation.status]}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">
                        프로그램
                      </div>
                      <div className="mt-1 font-semibold text-slate-800">
                        {reservation.program}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-500">
                        예약일자
                      </div>
                      <div className="mt-1 font-semibold text-slate-800">
                        {getReservationDate(reservation)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-500">
                        인원
                      </div>
                      <div className="mt-1 font-semibold text-slate-800">
                        {reservation.people}명
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-500">
                        접수일시
                      </div>
                      <div className="mt-1 font-semibold text-slate-800">
                        {formatDateTime(reservation.createdAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}