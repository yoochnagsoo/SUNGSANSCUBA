"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  Download,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "ETC";

type Reservation = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  program: string;
  reservationDate: string;
  date?: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;
  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentMemo?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ReservationListResponse = {
  ok: boolean;
  reservations?: Reservation[];
  data?: Reservation[];
  items?: Reservation[];
  message?: string;
};

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "현금",
  CARD: "카드",
  TRANSFER: "계좌이체",
  NAVER_PAY: "네이버페이",
  KAKAO_PAY: "카카오페이",
  ETC: "기타",
};

const PAYMENT_METHOD_OPTIONS: Array<PaymentMethod | "ALL"> = [
  "ALL",
  "CASH",
  "CARD",
  "TRANSFER",
  "NAVER_PAY",
  "KAKAO_PAY",
  "ETC",
];

function formatCurrency(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}

function getSalesDate(reservation: Reservation) {
  return (
    reservation.completedAt ||
    reservation.updatedAt ||
    reservation.reservationDate ||
    reservation.date ||
    ""
  );
}

function getDateOnly(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function isSameMonth(value?: string) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isSameYear(value?: string) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return date.getFullYear() === now.getFullYear();
}

function isToday(value?: string) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export default function AdminSalesPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "ALL">(
    "ALL",
  );

  async function fetchSales() {
    try {
      setErrorMessage("");

      const res = await fetch("/api/reservations?status=COMPLETED&limit=100", {
        cache: "no-store",
      });

      const data = (await res.json()) as ReservationListResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "매출 정보를 불러오지 못했습니다.");
      }

      const nextReservations = data.reservations || data.data || data.items || [];

      setReservations(nextReservations);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "매출 정보를 불러오지 못했습니다.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchSales();
  }, []);

  const completedSales = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.status === "COMPLETED")
      .filter((reservation) => typeof reservation.paymentAmount === "number")
      .sort((a, b) => {
        const aDate = getSalesDate(a);
        const bDate = getSalesDate(b);

        return bDate.localeCompare(aDate);
      });
  }, [reservations]);

  const filteredSales = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase();

    return completedSales.filter((reservation) => {
      const salesDate = getDateOnly(getSalesDate(reservation));

      if (dateFrom && salesDate < dateFrom) {
        return false;
      }

      if (dateTo && salesDate > dateTo) {
        return false;
      }

      if (
        paymentMethod !== "ALL" &&
        reservation.paymentMethod !== paymentMethod
      ) {
        return false;
      }

      if (!trimmedKeyword) {
        return true;
      }

      return (
        reservation.name.toLowerCase().includes(trimmedKeyword) ||
        reservation.phone.toLowerCase().includes(trimmedKeyword) ||
        reservation.program.toLowerCase().includes(trimmedKeyword) ||
        String(reservation.paymentMemo ?? "")
          .toLowerCase()
          .includes(trimmedKeyword)
      );
    });
  }, [completedSales, dateFrom, dateTo, keyword, paymentMethod]);

  const totalSales = useMemo(() => {
    return filteredSales.reduce(
      (sum, reservation) => sum + Number(reservation.paymentAmount || 0),
      0,
    );
  }, [filteredSales]);

  const todaySales = useMemo(() => {
    return completedSales
      .filter((reservation) => isToday(getSalesDate(reservation)))
      .reduce(
        (sum, reservation) => sum + Number(reservation.paymentAmount || 0),
        0,
      );
  }, [completedSales]);

  const monthSales = useMemo(() => {
    return completedSales
      .filter((reservation) => isSameMonth(getSalesDate(reservation)))
      .reduce(
        (sum, reservation) => sum + Number(reservation.paymentAmount || 0),
        0,
      );
  }, [completedSales]);

  const yearSales = useMemo(() => {
    return completedSales
      .filter((reservation) => isSameYear(getSalesDate(reservation)))
      .reduce(
        (sum, reservation) => sum + Number(reservation.paymentAmount || 0),
        0,
      );
  }, [completedSales]);

  const averageSales = useMemo(() => {
    if (filteredSales.length === 0) return 0;

    return Math.round(totalSales / filteredSales.length);
  }, [filteredSales.length, totalSales]);

  const salesByMethod = useMemo(() => {
    const result: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      NAVER_PAY: 0,
      KAKAO_PAY: 0,
      ETC: 0,
    };

    for (const reservation of filteredSales) {
      const method = reservation.paymentMethod || "ETC";
      result[method] += Number(reservation.paymentAmount || 0);
    }

    return result;
  }, [filteredSales]);

  function handleRefresh() {
    setRefreshing(true);
    fetchSales();
  }

  function handleDownloadCsv() {
    const rows = [
      [
        "완료일시",
        "예약일",
        "고객명",
        "연락처",
        "프로그램",
        "인원",
        "결제금액",
        "결제방법",
        "결제메모",
      ],
      ...filteredSales.map((reservation) => [
        formatDateTime(getSalesDate(reservation)),
        reservation.reservationDate || reservation.date || "",
        reservation.name,
        reservation.phone,
        reservation.program,
        String(reservation.people),
        String(reservation.paymentAmount || 0),
        reservation.paymentMethod
          ? PAYMENT_METHOD_LABEL[reservation.paymentMethod]
          : "기타",
        reservation.paymentMemo || "",
      ]),
    ];

    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`sungsan-scuba-sales-${today}.csv`, rows);
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">매출 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">매출관리</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            결제 매출 현황
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            완료 처리된 예약의 결제금액을 기준으로 집계합니다.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            새로고침
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            CSV 다운로드
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="필터 기준 매출"
          value={formatCurrency(totalSales)}
          description={`${filteredSales.length.toLocaleString("ko-KR")}건`}
          icon={Wallet}
        />

        <SummaryCard
          title="오늘 매출"
          value={formatCurrency(todaySales)}
          description="오늘 완료 처리 기준"
          icon={CalendarDays}
        />

        <SummaryCard
          title="이번 달 매출"
          value={formatCurrency(monthSales)}
          description="완료일시 기준"
          icon={TrendingUp}
        />

        <SummaryCard
          title="올해 매출"
          value={formatCurrency(yearSales)}
          description={`평균 ${formatCurrency(averageSales)}`}
          icon={Banknote}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_170px_170px_180px]">
          <div>
            <label className="text-sm font-semibold text-slate-600">
              검색어
            </label>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="고객명, 연락처, 프로그램, 결제메모"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">
              시작일
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">
              종료일
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">
              결제방법
            </label>
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod | "ALL")
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {PAYMENT_METHOD_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "전체" : PAYMENT_METHOD_LABEL[item]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">매출 내역</h2>
              <p className="mt-1 text-sm text-slate-500">
                완료 처리된 예약만 표시됩니다.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">완료일시</th>
                  <th className="px-5 py-4">고객</th>
                  <th className="px-5 py-4">프로그램</th>
                  <th className="px-5 py-4">인원</th>
                  <th className="px-5 py-4">결제방법</th>
                  <th className="px-5 py-4 text-right">결제금액</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      표시할 매출 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-slate-600">
                        {formatDateTime(getSalesDate(reservation))}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {reservation.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {reservation.phone}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {reservation.program}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          예약일:{" "}
                          {reservation.reservationDate ||
                            reservation.date ||
                            "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {reservation.people}명
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          {reservation.paymentMethod
                            ? PAYMENT_METHOD_LABEL[reservation.paymentMethod]
                            : "기타"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-base font-black text-slate-950">
                        {formatCurrency(Number(reservation.paymentAmount || 0))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                결제수단별 매출
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              {PAYMENT_METHOD_OPTIONS.filter(
                (item): item is PaymentMethod => item !== "ALL",
              ).map((method) => {
                const amount = salesByMethod[method];
                const ratio = totalSales > 0 ? (amount / totalSales) * 100 : 0;

                return (
                  <div key={method}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">
                        {PAYMENT_METHOD_LABEL[method]}
                      </span>
                      <span className="font-bold text-slate-950">
                        {formatCurrency(amount)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.min(ratio, 100)}%` }}
                      />
                    </div>

                    <p className="mt-1 text-right text-xs text-slate-500">
                      {ratio.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <h2 className="text-lg font-bold">정산 참고</h2>

            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              <p>· 완료 처리된 예약만 매출로 집계됩니다.</p>
              <p>· 완료 취소 시 결제정보가 삭제되므로 매출에서 제외됩니다.</p>
              <p>· CSV 다운로드 후 엑셀에서 월별 정산이 가능합니다.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}