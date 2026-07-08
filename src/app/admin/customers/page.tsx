"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type Customer = {
  key: string;
  name: string;
  email: string;
  phone: string;
  reservationCount: number;
  latestReservation?: Reservation;
  totalPeople: number;
};

function getReservationDate(reservation: Reservation) {
  return reservation.reservationDate || reservation.date || "-";
}

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

export default function AdminCustomersPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [keyword, setKeyword] = useState("");
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
        throw new Error(data.message ?? "고객 목록을 불러오지 못했습니다.");
      }

      setReservations(data.reservations ?? []);
    } catch (error) {
      console.error("[AdminCustomersPage] loadReservations error:", error);
      setErrorMessage("고객 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();

    reservations.forEach((reservation) => {
      const key =
        reservation.email?.trim().toLowerCase() ||
        reservation.phone?.trim() ||
        reservation.name?.trim();

      if (!key) {
        return;
      }

      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          key,
          name: reservation.name,
          email: reservation.email,
          phone: reservation.phone,
          reservationCount: 1,
          latestReservation: reservation,
          totalPeople: reservation.people,
        });

        return;
      }

      const currentLatestTime = existing.latestReservation?.createdAt
        ? new Date(existing.latestReservation.createdAt).getTime()
        : 0;

      const nextTime = reservation.createdAt
        ? new Date(reservation.createdAt).getTime()
        : 0;

      map.set(key, {
        ...existing,
        name: existing.name || reservation.name,
        email: existing.email || reservation.email,
        phone: existing.phone || reservation.phone,
        reservationCount: existing.reservationCount + 1,
        totalPeople: existing.totalPeople + reservation.people,
        latestReservation:
          nextTime > currentLatestTime ? reservation : existing.latestReservation,
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      const aTime = a.latestReservation?.createdAt
        ? new Date(a.latestReservation.createdAt).getTime()
        : 0;
      const bTime = b.latestReservation?.createdAt
        ? new Date(b.latestReservation.createdAt).getTime()
        : 0;

      return bTime - aTime;
    });
  }, [reservations]);

  const filteredCustomers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(normalizedKeyword) ||
        customer.email.toLowerCase().includes(normalizedKeyword) ||
        customer.phone.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [customers, keyword]);

  return (
    <main className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-600">Customers</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">고객 관리</h1>
          <p className="mt-2 text-sm text-slate-500">
            예약 데이터를 기준으로 고객 정보를 정리합니다.
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-slate-900">
              고객 목록{" "}
              <span className="text-sm font-medium text-slate-500">
                ({filteredCustomers.length}명)
              </span>
            </h2>

            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="이름, 이메일, 연락처 검색"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 sm:w-72"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">
            고객 목록을 불러오는 중입니다.
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">
            표시할 고객 데이터가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.map((customer) => (
              <div key={customer.key} className="px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {customer.name || "-"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {customer.phone || "-"} · {customer.email || "-"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                    <CustomerInfo
                      label="예약 횟수"
                      value={`${customer.reservationCount}회`}
                    />
                    <CustomerInfo
                      label="누적 인원"
                      value={`${customer.totalPeople}명`}
                    />
                    <CustomerInfo
                      label="최근 예약"
                      value={
                        customer.latestReservation
                          ? getReservationDate(customer.latestReservation)
                          : "-"
                      }
                    />
                  </div>

                  {customer.latestReservation && (
                    <Link
                      href={`/admin/reservations/${customer.latestReservation.id}`}
                      className="inline-flex justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700"
                    >
                      최근 예약 보기
                    </Link>
                  )}
                </div>

                {customer.latestReservation && (
                  <p className="mt-3 text-xs text-slate-400">
                    최근 접수일시:{" "}
                    {formatDateTime(customer.latestReservation.createdAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CustomerInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}