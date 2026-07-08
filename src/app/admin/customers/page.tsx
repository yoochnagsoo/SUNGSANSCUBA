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
  people: number | string;
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
  totalPeople: number;
  latestReservation?: Reservation;
  reservations: Reservation[];
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

function normalizeText(value?: string) {
  return String(value ?? "").trim();
}

function normalizeName(value?: string) {
  return normalizeText(value).replaceAll(" ", "").toLowerCase();
}

function normalizePhone(value?: string) {
  return normalizeText(value).replaceAll("-", "").replaceAll(" ", "");
}

function getReservationDate(reservation: Reservation) {
  return reservation.reservationDate || reservation.date || "-";
}

function getPeople(value: Reservation["people"]) {
  const people = Number(value);

  if (!Number.isFinite(people) || people < 0) {
    return 0;
  }

  return people;
}

function getCreatedTime(reservation?: Reservation) {
  if (!reservation?.createdAt) {
    return 0;
  }

  const time = new Date(reservation.createdAt).getTime();

  if (Number.isNaN(time)) {
    return 0;
  }

  return time;
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

function makeCustomerKey(reservation: Reservation) {
  const name = normalizeName(reservation.name);
  const phone = normalizePhone(reservation.phone);

  if (!name || !phone) {
    return "";
  }

  return `name-phone:${name}:${phone}`;
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
      const key = makeCustomerKey(reservation);

      if (!key) {
        return;
      }

      const existing = map.get(key);
      const people = getPeople(reservation.people);

      if (!existing) {
        map.set(key, {
          key,
          name: normalizeText(reservation.name),
          email: normalizeText(reservation.email),
          phone: normalizeText(reservation.phone),
          reservationCount: 1,
          totalPeople: people,
          latestReservation: reservation,
          reservations: [reservation],
        });

        return;
      }

      const latestReservation =
        getCreatedTime(reservation) > getCreatedTime(existing.latestReservation)
          ? reservation
          : existing.latestReservation;

      map.set(key, {
        ...existing,
        email: existing.email || normalizeText(reservation.email),
        reservationCount: existing.reservationCount + 1,
        totalPeople: existing.totalPeople + people,
        latestReservation,
        reservations: [...existing.reservations, reservation],
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      return getCreatedTime(b.latestReservation) - getCreatedTime(a.latestReservation);
    });
  }, [reservations]);

  const filteredCustomers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const normalizedPhoneKeyword = normalizePhone(keyword);

    if (!normalizedKeyword) {
      return customers;
    }

    return customers.filter((customer) => {
      const latest = customer.latestReservation;

      return (
        customer.name.toLowerCase().includes(normalizedKeyword) ||
        customer.email.toLowerCase().includes(normalizedKeyword) ||
        customer.phone.toLowerCase().includes(normalizedKeyword) ||
        normalizePhone(customer.phone).includes(normalizedPhoneKeyword) ||
        latest?.program?.toLowerCase().includes(normalizedKeyword) ||
        getReservationDate(latest ?? ({} as Reservation))
          .toLowerCase()
          .includes(normalizedKeyword)
      );
    });
  }, [customers, keyword]);

  const skippedReservationCount = useMemo(() => {
    return reservations.filter((reservation) => !makeCustomerKey(reservation)).length;
  }, [reservations]);

  return (
    <main className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-600">Customers</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">고객 관리</h1>
          <p className="mt-2 text-sm text-slate-500">
            이름과 전화번호가 모두 같은 예약만 같은 고객으로 묶습니다.
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

      {skippedReservationCount > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          이름 또는 전화번호가 없는 예약 {skippedReservationCount}건은 고객 묶음에서 제외되었습니다.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                고객 목록{" "}
                <span className="text-sm font-medium text-slate-500">
                  ({filteredCustomers.length}명)
                </span>
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                예: 홍길동 + 010-1234-5678이 같을 때만 같은 고객으로 계산합니다.
              </p>
            </div>

            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="이름, 이메일, 연락처, 프로그램 검색"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 sm:w-80"
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
            {filteredCustomers.map((customer) => {
              const latest = customer.latestReservation;

              return (
                <div key={customer.key} className="px-5 py-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">
                        {customer.name || "-"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {customer.phone || "-"} · {customer.email || "-"}
                      </p>

                      {latest && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                              statusClassNames[latest.status]
                            }`}
                          >
                            최근 상태: {statusLabels[latest.status]}
                          </span>
                          <span className="text-xs text-slate-400">
                            최근 접수: {formatDateTime(latest.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[700px]">
                      <CustomerInfo
                        label="예약 횟수"
                        value={`${customer.reservationCount}회`}
                      />
                      <CustomerInfo
                        label="누적 인원"
                        value={`${customer.totalPeople}명`}
                      />
                      <CustomerInfo
                        label="최근 예약일"
                        value={latest ? getReservationDate(latest) : "-"}
                      />
                      <CustomerInfo
                        label="최근 프로그램"
                        value={latest?.program || "-"}
                      />
                    </div>

                    {latest && (
                      <Link
                        href={`/admin/reservations/${latest.id}`}
                        className="inline-flex shrink-0 justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700"
                      >
                        최근 예약 보기
                      </Link>
                    )}
                  </div>

                  {customer.reservations.length > 1 && (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">
                        예약 이력
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {customer.reservations
                          .slice()
                          .sort((a, b) => getCreatedTime(b) - getCreatedTime(a))
                          .slice(0, 5)
                          .map((reservation) => (
                            <Link
                              key={reservation.id}
                              href={`/admin/reservations/${reservation.id}`}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                            >
                              {getReservationDate(reservation)} ·{" "}
                              {reservation.program}
                            </Link>
                          ))}

                        {customer.reservations.length > 5 && (
                          <span className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-400">
                            +{customer.reservations.length - 5}건
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
      <p className="mt-1 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}