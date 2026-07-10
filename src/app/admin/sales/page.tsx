"use client";

import Link from "next/link";
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

type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "ETC";

type SalesSource =
  | "RESERVATION"
  | "GROUP_DIVE";

type SalesSourceFilter =
  | "ALL"
  | SalesSource;

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

type GroupDivePaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CARD"
  | "OTHER";

type GroupDivePayment = {
  id: string;
  groupDiveId: string;
  amount: number;
  paymentMethod: GroupDivePaymentMethod;
  paidAt: string;
  processedById: string;
  processedByName: string;
  memo: string;
  status: "ACTIVE" | "CANCELLED";
  cancelledAt: string;
  cancelledById: string;
  cancelledByName: string;
  cancelReason: string;
  createdAt: string;
  updatedAt: string;
};

type GroupDive = {
  id: string;
  groupName: string;
  representativeName: string;
  representativePhone: string;
  startDate: string;
  endDate: string;
  expectedPeople: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  participants: Array<{
    id: string;
    active: boolean;
  }>;
  trips: unknown[];
  settlement: {
    additionalAmount: number;
    discountAmount: number;
    paidAmount: number;
    status: "UNPAID" | "PARTIAL" | "PAID";
    paymentMethod?: GroupDivePaymentMethod;
    settledAt: string;
    memo: string;
    updatedAt: string;
  };
  payments: GroupDivePayment[];
  createdAt: string;
  updatedAt: string;
};

type GroupDiveListResponse = {
  ok: boolean;
  groupDives?: GroupDive[];
  message?: string;
};

type SalesItem = {
  id: string;
  source: SalesSource;
  sourceId: string;
  salesDate: string;
  serviceDate: string;
  customerName: string;
  phone: string;
  description: string;
  people: number;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentMemo: string;
};

const PAYMENT_METHOD_LABEL: Record<
  PaymentMethod,
  string
> = {
  CASH: "현금",
  CARD: "카드",
  TRANSFER: "계좌이체",
  NAVER_PAY: "네이버페이",
  KAKAO_PAY: "카카오페이",
  ETC: "기타",
};

const PAYMENT_METHOD_OPTIONS: Array<
  PaymentMethod | "ALL"
> = [
  "ALL",
  "CASH",
  "CARD",
  "TRANSFER",
  "NAVER_PAY",
  "KAKAO_PAY",
  "ETC",
];

const SALES_SOURCE_LABEL: Record<
  SalesSource,
  string
> = {
  RESERVATION: "일반 예약",
  GROUP_DIVE: "그룹 다이빙",
};

const SALES_SOURCE_OPTIONS: SalesSourceFilter[] = [
  "ALL",
  "RESERVATION",
  "GROUP_DIVE",
];

function formatCurrency(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}

function getReservationSalesDate(
  reservation: Reservation,
) {
  return (
    reservation.completedAt ||
    reservation.updatedAt ||
    reservation.reservationDate ||
    reservation.date ||
    ""
  );
}

function getDateOnly(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(
      date.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return value.slice(0, 10);
}

function isSameMonth(value?: string) {
  if (!value) {
    return false;
  }

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
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getFullYear() === new Date().getFullYear();
}

function isToday(value?: string) {
  if (!value) {
    return false;
  }

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

function mapGroupPaymentMethod(
  method: GroupDivePaymentMethod,
): PaymentMethod {
  if (method === "BANK_TRANSFER") {
    return "TRANSFER";
  }

  if (method === "CASH") {
    return "CASH";
  }

  if (method === "CARD") {
    return "CARD";
  }

  return "ETC";
}

function downloadCsv(
  filename: string,
  rows: string[][],
) {
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
  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [groupDives, setGroupDives] =
    useState<GroupDive[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | "ALL">("ALL");

  const [salesSource, setSalesSource] =
    useState<SalesSourceFilter>("ALL");

  async function fetchSales() {
    try {
      setErrorMessage("");

      const [
        reservationResponse,
        groupDiveResponse,
      ] = await Promise.all([
        fetch(
          "/api/reservations?status=COMPLETED&limit=100",
          {
            cache: "no-store",
          },
        ),

        fetch("/api/admin/group-dives", {
          cache: "no-store",
        }),
      ]);

      const reservationData =
        (await reservationResponse.json()) as ReservationListResponse;

      const groupDiveData =
        (await groupDiveResponse.json()) as GroupDiveListResponse;

      if (
        !reservationResponse.ok ||
        !reservationData.ok
      ) {
        throw new Error(
          reservationData.message ||
            "예약 매출 정보를 불러오지 못했습니다.",
        );
      }

      if (
        !groupDiveResponse.ok ||
        !groupDiveData.ok
      ) {
        throw new Error(
          groupDiveData.message ||
            "그룹 다이빙 매출 정보를 불러오지 못했습니다.",
        );
      }

      setReservations(
        reservationData.reservations ||
          reservationData.data ||
          reservationData.items ||
          [],
      );

      setGroupDives(
        groupDiveData.groupDives || [],
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "매출 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchSales();
  }, []);

  const allSales = useMemo(() => {
    const reservationSales: SalesItem[] =
      reservations
        .filter(
          (reservation) =>
            reservation.status === "COMPLETED",
        )
        .filter(
          (reservation) =>
            typeof reservation.paymentAmount ===
            "number",
        )
        .map((reservation) => ({
          id: `reservation-${reservation.id}`,
          source: "RESERVATION",
          sourceId: reservation.id,
          salesDate:
            getReservationSalesDate(reservation),
          serviceDate:
            reservation.reservationDate ||
            reservation.date ||
            "",
          customerName: reservation.name,
          phone: reservation.phone,
          description: reservation.program,
          people: reservation.people,
          paymentAmount: Number(
            reservation.paymentAmount || 0,
          ),
          paymentMethod:
            reservation.paymentMethod || "ETC",
          paymentMemo:
            reservation.paymentMemo || "",
        }));

    const groupDiveSales: SalesItem[] =
      groupDives.flatMap((groupDive) => {
        if (
          groupDive.settlement?.status !== "PAID" ||
          !groupDive.settlement.settledAt
        ) {
          return [];
        }

        const activePayments =
          groupDive.payments?.filter(
            (payment) =>
              payment.status === "ACTIVE",
          ) || [];

        return activePayments.map(
          (payment): SalesItem => ({
            id: `group-dive-${groupDive.id}-${payment.id}`,
            source: "GROUP_DIVE",
            sourceId: groupDive.id,

            /*
             * 그룹 다이빙은 정산 완료 시점에 매출로 반영합니다.
             * 분할 결제는 결제 수단별로 각각 한 줄씩 표시합니다.
             */
            salesDate:
              groupDive.settlement.settledAt,

            serviceDate:
              groupDive.startDate ===
              groupDive.endDate
                ? groupDive.startDate
                : `${groupDive.startDate} ~ ${groupDive.endDate}`,

            customerName: groupDive.groupName,
            phone:
              groupDive.representativePhone,
            description: `그룹 다이빙 · 대표 ${groupDive.representativeName}`,
            people:
              groupDive.participants?.filter(
                (participant) =>
                  participant.active,
              ).length ||
              groupDive.expectedPeople ||
              0,

            paymentAmount: payment.amount,
            paymentMethod:
              mapGroupPaymentMethod(
                payment.paymentMethod,
              ),

            paymentMemo:
              payment.memo ||
              groupDive.settlement.memo ||
              "",
          }),
        );
      });

    return [
      ...reservationSales,
      ...groupDiveSales,
    ].sort((a, b) =>
      b.salesDate.localeCompare(a.salesDate),
    );
  }, [groupDives, reservations]);

  const filteredSales = useMemo(() => {
    const normalizedKeyword = keyword
      .trim()
      .toLowerCase()
      .replace(/-/g, "");

    return allSales.filter((sale) => {
      const salesDate = getDateOnly(
        sale.salesDate,
      );

      if (dateFrom && salesDate < dateFrom) {
        return false;
      }

      if (dateTo && salesDate > dateTo) {
        return false;
      }

      if (
        paymentMethod !== "ALL" &&
        sale.paymentMethod !== paymentMethod
      ) {
        return false;
      }

      if (
        salesSource !== "ALL" &&
        sale.source !== salesSource
      ) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const searchTarget = [
        sale.customerName,
        sale.phone,
        sale.description,
        sale.paymentMemo,
      ]
        .join(" ")
        .toLowerCase()
        .replace(/-/g, "");

      return searchTarget.includes(
        normalizedKeyword,
      );
    });
  }, [
    allSales,
    dateFrom,
    dateTo,
    keyword,
    paymentMethod,
    salesSource,
  ]);

  const totalSales = useMemo(() => {
    return filteredSales.reduce(
      (sum, sale) =>
        sum + sale.paymentAmount,
      0,
    );
  }, [filteredSales]);

  const todaySales = useMemo(() => {
    return allSales
      .filter((sale) =>
        isToday(sale.salesDate),
      )
      .reduce(
        (sum, sale) =>
          sum + sale.paymentAmount,
        0,
      );
  }, [allSales]);

  const monthSales = useMemo(() => {
    return allSales
      .filter((sale) =>
        isSameMonth(sale.salesDate),
      )
      .reduce(
        (sum, sale) =>
          sum + sale.paymentAmount,
        0,
      );
  }, [allSales]);

  const yearSales = useMemo(() => {
    return allSales
      .filter((sale) =>
        isSameYear(sale.salesDate),
      )
      .reduce(
        (sum, sale) =>
          sum + sale.paymentAmount,
        0,
      );
  }, [allSales]);

  const averageSales = useMemo(() => {
    if (filteredSales.length === 0) {
      return 0;
    }

    return Math.round(
      totalSales / filteredSales.length,
    );
  }, [filteredSales.length, totalSales]);

  const salesByMethod = useMemo(() => {
    const result: Record<
      PaymentMethod,
      number
    > = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      NAVER_PAY: 0,
      KAKAO_PAY: 0,
      ETC: 0,
    };

    for (const sale of filteredSales) {
      result[sale.paymentMethod] +=
        sale.paymentAmount;
    }

    return result;
  }, [filteredSales]);

  function handleRefresh() {
    setRefreshing(true);
    void fetchSales();
  }

  function handleDownloadCsv() {
    const rows = [
      [
        "매출일시",
        "구분",
        "이용일",
        "고객/팀명",
        "연락처",
        "프로그램/내용",
        "인원",
        "결제금액",
        "결제방법",
        "결제메모",
      ],

      ...filteredSales.map((sale) => [
        formatDateTime(sale.salesDate),
        SALES_SOURCE_LABEL[sale.source],
        sale.serviceDate,
        sale.customerName,
        sale.phone,
        sale.description,
        String(sale.people),
        String(sale.paymentAmount),
        PAYMENT_METHOD_LABEL[
          sale.paymentMethod
        ],
        sale.paymentMemo,
      ]),
    ];

    const today = getDateOnly(
      new Date().toISOString(),
    );

    downloadCsv(
      `sungsan-scuba-sales-${today}.csv`,
      rows,
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            매출 정보를 불러오는 중입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            매출관리
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            결제 매출 현황
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            완료된 일반 예약과 정산 완료된 그룹
            다이빙 매출을 함께 집계합니다.
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
              className={[
                "h-4 w-4",
                refreshing
                  ? "animate-spin"
                  : "",
              ].join(" ")}
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
          description={`${filteredSales.length.toLocaleString(
            "ko-KR",
          )}건`}
          icon={Wallet}
        />

        <SummaryCard
          title="오늘 매출"
          value={formatCurrency(todaySales)}
          description="매출 반영일 기준"
          icon={CalendarDays}
        />

        <SummaryCard
          title="이번 달 매출"
          value={formatCurrency(monthSales)}
          description="매출 반영일 기준"
          icon={TrendingUp}
        />

        <SummaryCard
          title="올해 매출"
          value={formatCurrency(yearSales)}
          description={`평균 ${formatCurrency(
            averageSales,
          )}`}
          icon={Banknote}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_150px_170px_170px_180px]">
          <div>
            <label className="text-sm font-semibold text-slate-600">
              검색어
            </label>

            <input
              value={keyword}
              onChange={(event) =>
                setKeyword(event.target.value)
              }
              placeholder="고객명, 팀명, 연락처, 프로그램, 메모"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">
              구분
            </label>

            <select
              value={salesSource}
              onChange={(event) =>
                setSalesSource(
                  event.target
                    .value as SalesSourceFilter,
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {SALES_SOURCE_OPTIONS.map(
                (source) => (
                  <option
                    key={source}
                    value={source}
                  >
                    {source === "ALL"
                      ? "전체"
                      : SALES_SOURCE_LABEL[
                          source
                        ]}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">
              시작일
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(event.target.value)
              }
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
              onChange={(event) =>
                setDateTo(event.target.value)
              }
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
                setPaymentMethod(
                  event.target.value as
                    | PaymentMethod
                    | "ALL",
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {PAYMENT_METHOD_OPTIONS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === "ALL"
                      ? "전체"
                      : PAYMENT_METHOD_LABEL[
                          item
                        ]}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                매출 내역
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                완료 예약과 정산 완료된 그룹
                다이빙만 표시됩니다.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    매출일시
                  </th>
                  <th className="px-5 py-4">
                    구분
                  </th>
                  <th className="px-5 py-4">
                    고객/팀
                  </th>
                  <th className="px-5 py-4">
                    프로그램/내용
                  </th>
                  <th className="px-5 py-4">
                    인원
                  </th>
                  <th className="px-5 py-4">
                    결제방법
                  </th>
                  <th className="px-5 py-4 text-right">
                    결제금액
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      표시할 매출 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-slate-600">
                        {formatDateTime(
                          sale.salesDate,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                            sale.source ===
                            "GROUP_DIVE"
                              ? "bg-cyan-50 text-cyan-700"
                              : "bg-slate-100 text-slate-700",
                          ].join(" ")}
                        >
                          {
                            SALES_SOURCE_LABEL[
                              sale.source
                            ]
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {sale.source ===
                        "GROUP_DIVE" ? (
                          <Link
                            href={`/admin/group-dives/${sale.sourceId}`}
                            className="font-bold text-slate-900 hover:text-cyan-700"
                          >
                            {sale.customerName}
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/reservations/${sale.sourceId}`}
                            className="font-bold text-slate-900 hover:text-blue-700"
                          >
                            {sale.customerName}
                          </Link>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          {sale.phone || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {sale.description}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          이용일:{" "}
                          {sale.serviceDate || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {sale.people}명
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          {
                            PAYMENT_METHOD_LABEL[
                              sale.paymentMethod
                            ]
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-base font-black text-slate-950">
                        {formatCurrency(
                          sale.paymentAmount,
                        )}
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
                (
                  item,
                ): item is PaymentMethod =>
                  item !== "ALL",
              ).map((method) => {
                const amount =
                  salesByMethod[method];

                const ratio =
                  totalSales > 0
                    ? (amount / totalSales) *
                      100
                    : 0;

                return (
                  <div key={method}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">
                        {
                          PAYMENT_METHOD_LABEL[
                            method
                          ]
                        }
                      </span>

                      <span className="font-bold text-slate-950">
                        {formatCurrency(
                          amount,
                        )}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${Math.min(
                            ratio,
                            100,
                          )}%`,
                        }}
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
            <h2 className="text-lg font-bold">
              정산 참고
            </h2>

            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              <p>
                · 완료 처리된 일반 예약만
                매출로 집계됩니다.
              </p>

              <p>
                · 그룹 다이빙은 정산 완료
                시점에 매출로 반영됩니다.
              </p>

              <p>
                · 취소된 그룹 결제는 매출에서
                제외됩니다.
              </p>

              <p>
                · 분할 결제는 결제 수단별로
                각각 표시됩니다.
              </p>
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
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-black text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}