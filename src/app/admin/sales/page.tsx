"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CreditCard,
  Download,
  Minus,
  ReceiptText,
  RefreshCw,
  Scale,
  TrendingDown,
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

type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "BOAT"
  | "FUEL"
  | "EQUIPMENT"
  | "SUPPLIES"
  | "MAINTENANCE"
  | "TRANSPORTATION"
  | "MEAL"
  | "SALARY"
  | "INSURANCE"
  | "TAX"
  | "MARKETING"
  | "EDUCATION"
  | "FEE"
  | "OTHER";

type ExpensePaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "OTHER";

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

type Expense = {
  id: string;
  expenseDate: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  vendor: string;
  memo: string;
  hasReceipt: boolean;
  receiptKey: string;
  receiptUrl: string;
  receiptFileName: string;
  receiptMimeType: string;
  receiptSize: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

type ExpenseListResponse = {
  ok: boolean;
  expenses?: Expense[];
  summary?: {
    count: number;
    totalAmount: number;
  };
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

type MonthlyProfitItem = {
  key: string;
  label: string;
  sales: number;
  expenses: number;
  profit: number;
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

const EXPENSE_CATEGORY_LABEL: Record<
  ExpenseCategory,
  string
> = {
  RENT: "임대료",
  UTILITIES: "공과금",
  BOAT: "선박 관련",
  FUEL: "유류비",
  EQUIPMENT: "장비 구입",
  SUPPLIES: "소모품",
  MAINTENANCE: "수리·정비",
  TRANSPORTATION: "교통비",
  MEAL: "식비",
  SALARY: "급여",
  INSURANCE: "보험료",
  TAX: "세금",
  MARKETING: "광고·마케팅",
  EDUCATION: "교육비",
  FEE: "수수료",
  OTHER: "기타",
};

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString(
    "ko-KR",
  )}원`;
}

function formatSignedCurrency(value: number) {
  if (value > 0) {
    return `+${formatCurrency(value)}`;
  }

  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`;
  }

  return "0원";
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

function getMonthKey(value?: string) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) {
    return "";
  }

  return dateOnly.slice(0, 7);
}

function getCurrentMonthKey() {
  return getMonthKey(
    new Date().toISOString(),
  );
}

function getCurrentYear() {
  return String(new Date().getFullYear());
}

function isToday(value?: string) {
  if (!value) {
    return false;
  }

  return (
    getDateOnly(value) ===
    getDateOnly(new Date().toISOString())
  );
}

function isCurrentMonth(value?: string) {
  return (
    getMonthKey(value) === getCurrentMonthKey()
  );
}

function isCurrentYear(value?: string) {
  return getDateOnly(value).startsWith(
    getCurrentYear(),
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

          return `"${value.replaceAll(
            '"',
            '""',
          )}"`;
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

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function createRecentMonthKeys(
  count: number,
) {
  const months: Array<{
    key: string;
    label: string;
  }> = [];

  const now = new Date();

  for (
    let offset = count - 1;
    offset >= 0;
    offset -= 1
  ) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1,
    );

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");

    months.push({
      key: `${year}-${month}`,
      label: `${year}.${month}`,
    });
  }

  return months;
}

export default function AdminSalesPage() {
  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [groupDives, setGroupDives] =
    useState<GroupDive[]>([]);

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [keyword, setKeyword] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | "ALL">("ALL");

  const [salesSource, setSalesSource] =
    useState<SalesSourceFilter>("ALL");

  async function fetchSalesAndExpenses() {
    try {
      setErrorMessage("");

      const [
        reservationResponse,
        groupDiveResponse,
        expenseResponse,
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

        fetch("/api/admin/expenses", {
          cache: "no-store",
        }),
      ]);

      const reservationData =
        (await reservationResponse.json()) as ReservationListResponse;

      const groupDiveData =
        (await groupDiveResponse.json()) as GroupDiveListResponse;

      const expenseData =
        (await expenseResponse.json()) as ExpenseListResponse;

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

      if (
        !expenseResponse.ok ||
        !expenseData.ok
      ) {
        throw new Error(
          expenseData.message ||
            "경비 정보를 불러오지 못했습니다.",
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

      setExpenses(
        expenseData.expenses || [],
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "매출과 경비 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchSalesAndExpenses();
  }, []);

  const allSales = useMemo(() => {
    const reservationSales: SalesItem[] =
      reservations
        .filter(
          (reservation) =>
            reservation.status ===
            "COMPLETED",
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
            getReservationSalesDate(
              reservation,
            ),

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
            reservation.paymentMethod ||
            "ETC",

          paymentMemo:
            reservation.paymentMemo || "",
        }));

    const groupDiveSales: SalesItem[] =
      groupDives.flatMap((groupDive) => {
        if (
          groupDive.settlement?.status !==
            "PAID" ||
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

            salesDate:
              groupDive.settlement.settledAt,

            serviceDate:
              groupDive.startDate ===
              groupDive.endDate
                ? groupDive.startDate
                : `${groupDive.startDate} ~ ${groupDive.endDate}`,

            customerName:
              groupDive.groupName,

            phone:
              groupDive.representativePhone,

            description:
              `그룹 다이빙 · 대표 ${groupDive.representativeName}`,

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
      b.salesDate.localeCompare(
        a.salesDate,
      ),
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

      if (
        dateFrom &&
        salesDate < dateFrom
      ) {
        return false;
      }

      if (
        dateTo &&
        salesDate > dateTo
      ) {
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

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (
        dateFrom &&
        expense.expenseDate < dateFrom
      ) {
        return false;
      }

      if (
        dateTo &&
        expense.expenseDate > dateTo
      ) {
        return false;
      }

      return true;
    });
  }, [
    dateFrom,
    dateTo,
    expenses,
  ]);

  const totalSales = useMemo(
    () =>
      filteredSales.reduce(
        (sum, sale) =>
          sum + sale.paymentAmount,
        0,
      ),
    [filteredSales],
  );

  const totalExpenses = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, expense) =>
          sum + expense.amount,
        0,
      ),
    [filteredExpenses],
  );

  const totalProfit =
    totalSales - totalExpenses;

  const todaySales = useMemo(
    () =>
      allSales
        .filter((sale) =>
          isToday(sale.salesDate),
        )
        .reduce(
          (sum, sale) =>
            sum + sale.paymentAmount,
          0,
        ),
    [allSales],
  );

  const todayExpenses = useMemo(
    () =>
      expenses
        .filter((expense) =>
          isToday(expense.expenseDate),
        )
        .reduce(
          (sum, expense) =>
            sum + expense.amount,
          0,
        ),
    [expenses],
  );

  const monthSales = useMemo(
    () =>
      allSales
        .filter((sale) =>
          isCurrentMonth(
            sale.salesDate,
          ),
        )
        .reduce(
          (sum, sale) =>
            sum + sale.paymentAmount,
          0,
        ),
    [allSales],
  );

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((expense) =>
          isCurrentMonth(
            expense.expenseDate,
          ),
        )
        .reduce(
          (sum, expense) =>
            sum + expense.amount,
          0,
        ),
    [expenses],
  );

  const monthProfit =
    monthSales - monthExpenses;

  const yearSales = useMemo(
    () =>
      allSales
        .filter((sale) =>
          isCurrentYear(
            sale.salesDate,
          ),
        )
        .reduce(
          (sum, sale) =>
            sum + sale.paymentAmount,
          0,
        ),
    [allSales],
  );

  const yearExpenses = useMemo(
    () =>
      expenses
        .filter((expense) =>
          isCurrentYear(
            expense.expenseDate,
          ),
        )
        .reduce(
          (sum, expense) =>
            sum + expense.amount,
          0,
        ),
    [expenses],
  );

  const yearProfit =
    yearSales - yearExpenses;

  const averageSales = useMemo(() => {
    if (filteredSales.length === 0) {
      return 0;
    }

    return Math.round(
      totalSales /
        filteredSales.length,
    );
  }, [
    filteredSales.length,
    totalSales,
  ]);

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

  const expenseByCategory = useMemo(() => {
    const result = new Map<
      ExpenseCategory,
      number
    >();

    for (const expense of filteredExpenses) {
      result.set(
        expense.category,
        (result.get(expense.category) || 0) +
          expense.amount,
      );
    }

    return [...result.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort(
        (a, b) =>
          b.amount - a.amount,
      );
  }, [filteredExpenses]);

  const monthlyProfitItems =
    useMemo<MonthlyProfitItem[]>(() => {
      return createRecentMonthKeys(
        12,
      ).map((month) => {
        const sales = allSales
          .filter(
            (sale) =>
              getMonthKey(
                sale.salesDate,
              ) === month.key,
          )
          .reduce(
            (sum, sale) =>
              sum + sale.paymentAmount,
            0,
          );

        const monthlyExpenses =
          expenses
            .filter(
              (expense) =>
                getMonthKey(
                  expense.expenseDate,
                ) === month.key,
            )
            .reduce(
              (sum, expense) =>
                sum + expense.amount,
              0,
            );

        return {
          key: month.key,
          label: month.label,
          sales,
          expenses: monthlyExpenses,
          profit:
            sales - monthlyExpenses,
        };
      });
    }, [allSales, expenses]);

  const maxMonthlyAmount =
    useMemo(() => {
      return Math.max(
        ...monthlyProfitItems.flatMap(
          (item) => [
            item.sales,
            item.expenses,
          ],
        ),
        1,
      );
    }, [monthlyProfitItems]);

  const previousMonthProfit =
    monthlyProfitItems.length >= 2
      ? monthlyProfitItems[
          monthlyProfitItems.length - 2
        ].profit
      : 0;

  const profitChange =
    monthProfit - previousMonthProfit;

  function handleRefresh() {
    setRefreshing(true);

    void fetchSalesAndExpenses();
  }

  function handleResetFilters() {
    setKeyword("");
    setDateFrom("");
    setDateTo("");
    setPaymentMethod("ALL");
    setSalesSource("ALL");
  }

  function handleDownloadCsv() {
    const rows = [
      [
        "구분",
        "일시/지출일",
        "항목",
        "고객/거래처",
        "금액",
        "결제방법/지출분류",
        "메모",
      ],

      ...filteredSales.map(
        (sale) => [
          "매출",
          formatDateTime(
            sale.salesDate,
          ),
          `${SALES_SOURCE_LABEL[sale.source]} · ${sale.description}`,
          sale.customerName,
          String(sale.paymentAmount),
          PAYMENT_METHOD_LABEL[
            sale.paymentMethod
          ],
          sale.paymentMemo,
        ],
      ),

      ...filteredExpenses.map(
        (expense) => [
          "경비",
          expense.expenseDate,
          expense.title,
          expense.vendor,
          String(-expense.amount),
          EXPENSE_CATEGORY_LABEL[
            expense.category
          ],
          expense.memo,
        ],
      ),

      [
        "합계",
        "",
        "매출 합계",
        "",
        String(totalSales),
        "",
        "",
      ],

      [
        "합계",
        "",
        "경비 합계",
        "",
        String(-totalExpenses),
        "",
        "",
      ],

      [
        "합계",
        "",
        "순이익",
        "",
        String(totalProfit),
        "",
        "",
      ],
    ];

    const today = getDateOnly(
      new Date().toISOString(),
    );

    downloadCsv(
      `sungsan-scuba-profit-${today}.csv`,
      rows,
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            매출과 경비 정보를 불러오는 중입니다.
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
            매출·손익 관리
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            매출 및 순이익 현황
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            완료된 매출과 등록된 경비를 비교하여
            실제 운영 손익을 확인합니다.
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
            손익 CSV 다운로드
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
          title="검색 기간 매출"
          value={formatCurrency(
            totalSales,
          )}
          description={`${filteredSales.length.toLocaleString(
            "ko-KR",
          )}건`}
          icon={Wallet}
          tone="blue"
        />

        <SummaryCard
          title="검색 기간 경비"
          value={formatCurrency(
            totalExpenses,
          )}
          description={`${filteredExpenses.length.toLocaleString(
            "ko-KR",
          )}건`}
          icon={ReceiptText}
          tone="rose"
        />

        <SummaryCard
          title="검색 기간 순이익"
          value={formatSignedCurrency(
            totalProfit,
          )}
          description="매출 - 경비"
          icon={
            totalProfit >= 0
              ? TrendingUp
              : TrendingDown
          }
          tone={
            totalProfit >= 0
              ? "emerald"
              : "rose"
          }
        />

        <SummaryCard
          title="이번 달 순이익"
          value={formatSignedCurrency(
            monthProfit,
          )}
          description={
            profitChange === 0
              ? "전월과 동일"
              : `전월 대비 ${formatSignedCurrency(
                  profitChange,
                )}`
          }
          icon={
            profitChange > 0
              ? ArrowUpRight
              : profitChange < 0
                ? ArrowDownRight
                : Minus
          }
          tone={
            monthProfit >= 0
              ? "emerald"
              : "rose"
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PeriodProfitCard
          title="오늘"
          sales={todaySales}
          expenses={todayExpenses}
        />

        <PeriodProfitCard
          title="이번 달"
          sales={monthSales}
          expenses={monthExpenses}
        />

        <PeriodProfitCard
          title="올해"
          sales={yearSales}
          expenses={yearExpenses}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_150px_170px_170px_180px_auto]">
          <div>
            <label className="text-sm font-semibold text-slate-600">
              매출 검색어
            </label>

            <input
              value={keyword}
              onChange={(event) =>
                setKeyword(
                  event.target.value,
                )
              }
              placeholder="고객명, 팀명, 연락처, 프로그램, 메모"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">
              매출 구분
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
                setDateFrom(
                  event.target.value,
                )
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
                setDateTo(
                  event.target.value,
                )
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

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 lg:w-auto"
            >
              초기화
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          시작일과 종료일은 매출 반영일과 경비
          지출일에 동일하게 적용됩니다. 검색어와
          결제방법, 매출 구분은 매출 내역에만
          적용됩니다.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              최근 12개월 손익
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              월별 매출, 경비 및 순이익을 비교합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              매출
            </span>

            <span className="inline-flex items-center gap-2 text-rose-700">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              경비
            </span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-12 gap-3">
              {monthlyProfitItems.map(
                (item) => (
                  <MonthlyChartColumn
                    key={item.key}
                    item={item}
                    maxAmount={
                      maxMonthlyAmount
                    }
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
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
                {filteredSales.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      표시할 매출 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(
                    (sale) => (
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
                              {
                                sale.customerName
                              }
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/reservations/${sale.sourceId}`}
                              className="font-bold text-slate-900 hover:text-blue-700"
                            >
                              {
                                sale.customerName
                              }
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
                            {sale.serviceDate ||
                              "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {sale.people}명
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            {
                              PAYMENT_METHOD_LABEL[
                                sale
                                  .paymentMethod
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
                    ),
                  )
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
                    ? (amount /
                        totalSales) *
                      100
                    : 0;

                return (
                  <RatioRow
                    key={method}
                    label={
                      PAYMENT_METHOD_LABEL[
                        method
                      ]
                    }
                    amount={amount}
                    ratio={ratio}
                    tone="blue"
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-rose-600" />

              <h2 className="text-lg font-bold text-slate-900">
                분류별 경비
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              {expenseByCategory.length ===
              0 ? (
                <p className="text-sm text-slate-500">
                  표시할 경비가 없습니다.
                </p>
              ) : (
                expenseByCategory.map(
                  (item) => {
                    const ratio =
                      totalExpenses > 0
                        ? (item.amount /
                            totalExpenses) *
                          100
                        : 0;

                    return (
                      <RatioRow
                        key={item.category}
                        label={
                          EXPENSE_CATEGORY_LABEL[
                            item.category
                          ]
                        }
                        amount={item.amount}
                        ratio={ratio}
                        tone="rose"
                      />
                    );
                  },
                )
              )}
            </div>

            <Link
              href="/admin/expenses"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              경비 내역 관리
            </Link>
          </div>

          <div
            className={[
              "rounded-2xl p-5 text-white shadow-sm",
              totalProfit >= 0
                ? "bg-slate-950"
                : "bg-rose-950",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5" />

              <h2 className="text-lg font-bold">
                검색 기간 손익
              </h2>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-300">
                  매출
                </dt>

                <dd className="font-bold">
                  {formatCurrency(
                    totalSales,
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-300">
                  경비
                </dt>

                <dd className="font-bold text-rose-300">
                  -{formatCurrency(
                    totalExpenses,
                  )}
                </dd>
              </div>

              <div className="border-t border-white/20 pt-3">
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-bold">
                    순이익
                  </dt>

                  <dd
                    className={[
                      "text-xl font-black",
                      totalProfit >= 0
                        ? "text-emerald-300"
                        : "text-rose-300",
                    ].join(" ")}
                  >
                    {formatSignedCurrency(
                      totalProfit,
                    )}
                  </dd>
                </div>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-5 text-slate-300">
              순이익은 세무상 확정 소득이 아니라 등록된
              매출에서 등록된 경비를 차감한 운영 참고
              수치입니다.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-bold text-slate-900">
              집계 기준
            </h2>

            <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
              <p>
                · 완료 처리된 일반 예약만 매출로
                집계됩니다.
              </p>

              <p>
                · 그룹 다이빙은 정산 완료 시점에
                반영됩니다.
              </p>

              <p>
                · 취소된 그룹 결제는 매출에서
                제외됩니다.
              </p>

              <p>
                · 경비는 경비·지출 관리에 등록된
                지출일 기준입니다.
              </p>

              <p>
                · 매출과 경비의 부가세 및 세무 조정은
                별도로 반영되지 않습니다.
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
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone:
    | "blue"
    | "emerald"
    | "rose";
}) {
  const toneClass = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      value: "text-slate-950",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-700",
    },

    rose: {
      icon: "bg-rose-50 text-rose-600",
      value: "text-rose-700",
    },
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p
            className={[
              "mt-3 truncate text-2xl font-black",
              toneClass.value,
            ].join(" ")}
          >
            {value}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            toneClass.icon,
          ].join(" ")}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function PeriodProfitCard({
  title,
  sales,
  expenses,
}: {
  title: string;
  sales: number;
  expenses: number;
}) {
  const profit = sales - expenses;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-slate-500" />

          <h2 className="font-bold text-slate-900">
            {title} 손익
          </h2>
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-bold",
            profit >= 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700",
          ].join(" ")}
        >
          {profit >= 0 ? "흑자" : "적자"}
        </span>
      </div>

      <dl className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-slate-500">
            매출
          </dt>

          <dd className="font-bold text-blue-700">
            {formatCurrency(sales)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-slate-500">
            경비
          </dt>

          <dd className="font-bold text-rose-700">
            -{formatCurrency(expenses)}
          </dd>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-bold text-slate-700">
              순이익
            </dt>

            <dd
              className={[
                "text-lg font-black",
                profit >= 0
                  ? "text-emerald-700"
                  : "text-rose-700",
              ].join(" ")}
            >
              {formatSignedCurrency(profit)}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}

function MonthlyChartColumn({
  item,
  maxAmount,
}: {
  item: MonthlyProfitItem;
  maxAmount: number;
}) {
  const salesHeight =
    item.sales > 0
      ? Math.max(
          (item.sales / maxAmount) * 160,
          4,
        )
      : 0;

  const expensesHeight =
    item.expenses > 0
      ? Math.max(
          (item.expenses /
            maxAmount) *
            160,
          4,
        )
      : 0;

  return (
    <div className="min-w-0">
      <div className="flex h-[180px] items-end justify-center gap-1.5">
        <div
          title={`매출 ${formatCurrency(
            item.sales,
          )}`}
          className="w-3 rounded-t bg-blue-600"
          style={{
            height: `${salesHeight}px`,
          }}
        />

        <div
          title={`경비 ${formatCurrency(
            item.expenses,
          )}`}
          className="w-3 rounded-t bg-rose-500"
          style={{
            height: `${expensesHeight}px`,
          }}
        />
      </div>

      <p className="mt-3 text-center text-xs font-bold text-slate-500">
        {item.label}
      </p>

      <p
        className={[
          "mt-1 truncate text-center text-xs font-black",
          item.profit >= 0
            ? "text-emerald-700"
            : "text-rose-700",
        ].join(" ")}
        title={formatSignedCurrency(
          item.profit,
        )}
      >
        {item.profit >= 0 ? "+" : "-"}
        {Math.abs(
          Math.round(
            item.profit / 10000,
          ),
        ).toLocaleString("ko-KR")}
        만
      </p>
    </div>
  );
}

function RatioRow({
  label,
  amount,
  ratio,
  tone,
}: {
  label: string;
  amount: number;
  ratio: number;
  tone: "blue" | "rose";
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-semibold text-slate-700">
          {label}
        </span>

        <span className="shrink-0 font-bold text-slate-950">
          {formatCurrency(amount)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={[
            "h-full rounded-full",
            tone === "blue"
              ? "bg-blue-600"
              : "bg-rose-500",
          ].join(" ")}
          style={{
            width: `${Math.min(
              Math.max(ratio, 0),
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
}