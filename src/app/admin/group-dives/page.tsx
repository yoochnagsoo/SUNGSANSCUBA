"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Ship,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  GroupDive,
  GroupDiveBillingType,
  GroupDiveSettlementStatus,
  GroupDiveStatus,
} from "@/lib/groupDives/types";
import {
  formatPhoneInput,
  isValidKoreanMobilePhone,
} from "@/lib/phone";

type GroupDiveListResponse = {
  ok: boolean;
  groupDives?: GroupDive[];
  message?: string;
};

type GroupDiveCreateResponse = {
  ok: boolean;
  groupDive?: GroupDive;
  message?: string;
};

type GroupDiveFilter =
  | "ALL"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "UNPAID";

type GroupDiveSort =
  | "OPERATION"
  | "START_DATE"
  | "RECENT"
  | "UNPAID_DESC";

type FormState = {
  groupName: string;
  representativeName: string;
  representativePhone: string;
  startDate: string;
  endDate: string;
  expectedPeople: string;
  billingType: GroupDiveBillingType;
  defaultDiveUnitPrice: string;
  memo: string;
};

const initialFormState: FormState = {
  groupName: "",
  representativeName: "",
  representativePhone: "",
  startDate: "",
  endDate: "",
  expectedPeople: "1",
  billingType: "GROUP",
  defaultDiveUnitPrice: "",
  memo: "",
};

const statusLabels: Record<GroupDiveStatus, string> = {
  ACTIVE: "진행 중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const statusClasses: Record<GroupDiveStatus, string> = {
  ACTIVE:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
  COMPLETED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED:
    "border-rose-200 bg-rose-50 text-rose-700",
};


const settlementStatusLabels: Record<
  GroupDiveSettlementStatus,
  string
> = {
  UNPAID: "미정산",
  PARTIAL: "일부 정산",
  PAID: "정산 완료",
};

const settlementStatusClasses: Record<
  GroupDiveSettlementStatus,
  string
> = {
  UNPAID:
    "border-rose-200 bg-rose-50 text-rose-700",
  PARTIAL:
    "border-amber-200 bg-amber-50 text-amber-700",
  PAID:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
};


const filterLabels: Record<GroupDiveFilter, string> = {
  ALL: "전체",
  ACTIVE: "진행 중",
  COMPLETED: "완료",
  CANCELLED: "취소",
  UNPAID: "미수금 있음",
};


const sortLabels: Record<GroupDiveSort, string> = {
  OPERATION: "운영 우선",
  START_DATE: "이용 시작일순",
  RECENT: "최근 등록순",
  UNPAID_DESC: "미수금 많은 순",
};

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${year}.${month}.${day}`;
}

function formatDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}

function formatCurrency(value?: number) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "미설정";
  }

  return `${value.toLocaleString("ko-KR")}원`;
}

function calculateBaseAmount(groupDive: GroupDive) {
  return groupDive.trips.reduce((total, trip) => {
    if (
      trip.status === "CANCELLED" ||
      trip.status === "WEATHER_CANCELLED"
    ) {
      return total;
    }

    return (
      total +
      (trip.participants.length === 0 &&
      typeof trip.boardedCount === "number" &&
      Number.isFinite(trip.boardedCount)
        ? Math.max(
            Math.floor(trip.boardedCount) -
              Math.max(Math.floor(trip.focCount ?? 0), 0),
            0,
          ) *
          (trip.unitPrice ?? groupDive.defaultDiveUnitPrice ?? 0)
        : trip.participants.reduce(
            (tripTotal, participant, index) => {
              if (!participant.boarded) {
                return tripTotal;
              }

              if (index < Math.max(Math.floor(trip.focCount ?? 0), 0)) {
                return tripTotal;
              }

              return (
                tripTotal +
                (participant.unitPrice ??
                  trip.unitPrice ??
                  groupDive.defaultDiveUnitPrice ??
                  0)
              );
            },
            0,
          ))
    );
  }, 0);
}

function calculatePaidAmount(groupDive: GroupDive) {
  return (groupDive.payments ?? []).reduce(
    (total, payment) =>
      payment.status === "ACTIVE"
        ? total + payment.amount
        : total,
    0,
  );
}

function getSettlementSummary(groupDive: GroupDive) {
  const baseAmount = calculateBaseAmount(groupDive);
  const additionalAmount =
    groupDive.settlement?.additionalAmount ?? 0;
  const discountAmount =
    groupDive.settlement?.discountAmount ?? 0;
  const finalAmount = Math.max(
    baseAmount + additionalAmount - discountAmount,
    0,
  );
  const paidAmount = calculatePaidAmount(groupDive);
  const unpaidAmount = Math.max(
    finalAmount - paidAmount,
    0,
  );

  const status: GroupDiveSettlementStatus =
    paidAmount <= 0
      ? "UNPAID"
      : unpaidAmount > 0
        ? "PARTIAL"
        : "PAID";

  return {
    status,
    unpaidAmount,
  };
}


function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

export default function AdminGroupDivesPage() {
  const [groupDives, setGroupDives] = useState<GroupDive[]>(
    [],
  );

  const [form, setForm] =
    useState<FormState>(initialFormState);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formOpen, setFormOpen] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedFilter, setSelectedFilter] =
    useState<GroupDiveFilter>("ALL");

  const [selectedSort, setSelectedSort] =
    useState<GroupDiveSort>("OPERATION");

  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDateKey, setSelectedCalendarDateKey] = useState(() =>
    toDateKey(new Date()),
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const loadGroupDives = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const response = await fetch(
          "/api/admin/group-dives",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as GroupDiveListResponse;

        if (!response.ok || !data.ok) {
          throw new Error(
            data.message ??
              "그룹 다이빙 목록을 불러오지 못했습니다.",
          );
        }

        setGroupDives(data.groupDives ?? []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "그룹 다이빙 목록을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadGroupDives();
  }, [loadGroupDives]);

  const summary = useMemo(() => {
    return {
      total: groupDives.length,

      active: groupDives.filter(
        (groupDive) => groupDive.status === "ACTIVE",
      ).length,

      participants: groupDives.reduce(
        (total, groupDive) =>
          total + groupDive.participants.length,
        0,
      ),

      trips: groupDives.reduce(
        (total, groupDive) =>
          total + groupDive.trips.length,
        0,
      ),
    };
  }, [groupDives]);

  const filteredGroupDives = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(
      searchKeyword,
    );

    const filtered = groupDives.filter((groupDive) => {
      const settlement =
        getSettlementSummary(groupDive);

      const matchesFilter =
        selectedFilter === "ALL" ||
        selectedFilter === groupDive.status ||
        (selectedFilter === "UNPAID" &&
          settlement.unpaidAmount > 0);

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const searchTarget = normalizeSearchText(
        [
          groupDive.groupName,
          groupDive.representativeName,
          groupDive.representativePhone,
        ].join(" "),
      );

      return searchTarget.includes(normalizedKeyword);
    });

    return [...filtered].sort((a, b) => {
      if (selectedSort === "RECENT") {
        return b.createdAt.localeCompare(a.createdAt);
      }

      if (selectedSort === "UNPAID_DESC") {
        const unpaidA =
          getSettlementSummary(a).unpaidAmount;
        const unpaidB =
          getSettlementSummary(b).unpaidAmount;

        if (unpaidA !== unpaidB) {
          return unpaidB - unpaidA;
        }

        return a.startDate.localeCompare(b.startDate);
      }

      if (selectedSort === "START_DATE") {
        const dateCompare =
          a.startDate.localeCompare(b.startDate);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return b.createdAt.localeCompare(a.createdAt);
      }

      const statusPriority: Record<GroupDiveStatus, number> = {
        ACTIVE: 0,
        COMPLETED: 1,
        CANCELLED: 2,
      };

      const statusCompare =
        statusPriority[a.status] -
        statusPriority[b.status];

      if (statusCompare !== 0) {
        return statusCompare;
      }

      const dateCompare =
        a.startDate.localeCompare(b.startDate);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [
    groupDives,
    searchKeyword,
    selectedFilter,
    selectedSort,
  ]);

  const groupDivesByTripDate = useMemo(() => {
    const map = new Map<string, GroupDive[]>();

    for (const groupDive of groupDives) {
      if (groupDive.status === "CANCELLED") {
        continue;
      }

      const activeTripDates = new Set(
        groupDive.trips
          .filter((trip) => trip.date && isCountableTripStatus(trip.status))
          .map((trip) => trip.date),
      );

      for (const dateKey of activeTripDates) {
        const items = map.get(dateKey) ?? [];
        items.push(groupDive);
        map.set(dateKey, items);
      }
    }

    for (const [dateKey, items] of map.entries()) {
      map.set(
        dateKey,
        [...items].sort((a, b) => {
          const dateCompare = a.startDate.localeCompare(b.startDate);

          if (dateCompare !== 0) {
            return dateCompare;
          }

          return a.groupName.localeCompare(b.groupName);
        }),
      );
    }

    return map;
  }, [groupDives]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDate = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0);
    const firstDay = firstDate.getDay();
    const days: Array<{
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      groupCount: number;
    }> = [];
    const todayKey = toDateKey(new Date());

    for (let index = firstDay - 1; index >= 0; index -= 1) {
      const date = new Date(year, month, -index);
      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        groupCount: groupDivesByTripDate.get(dateKey)?.length ?? 0,
      });
    }

    for (let day = 1; day <= lastDate.getDate(); day += 1) {
      const date = new Date(year, month, day);
      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        groupCount: groupDivesByTripDate.get(dateKey)?.length ?? 0,
      });
    }

    while (days.length % 7 !== 0) {
      const previousDate = days[days.length - 1].date;
      const date = new Date(previousDate);
      date.setDate(previousDate.getDate() + 1);
      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        groupCount: groupDivesByTripDate.get(dateKey)?.length ?? 0,
      });
    }

    return days;
  }, [calendarDate, groupDivesByTripDate]);

  const selectedDateGroupDives = useMemo(() => {
    return groupDivesByTripDate.get(selectedCalendarDateKey) ?? [];
  }, [groupDivesByTripDate, selectedCalendarDateKey]);

  function goPrevCalendarMonth() {
    setCalendarDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }

  function goNextCalendarMonth() {
    setCalendarDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }

  function getTripCountForDate(groupDive: GroupDive, dateKey: string) {
    return groupDive.trips.filter(
      (trip) => trip.date === dateKey && isCountableTripStatus(trip.status),
    ).length;
  }

  function updateForm<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function openCreateForm() {
    setForm(initialFormState);
    setFormMessage("");
    setFormOpen(true);
  }

  function closeCreateForm() {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setFormMessage("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormMessage("");

    if (!form.groupName.trim()) {
      setFormMessage("팀명을 입력해주세요.");
      return;
    }

    if (!form.representativeName.trim()) {
      setFormMessage("대표자 이름을 입력해주세요.");
      return;
    }

    if (
      !isValidKoreanMobilePhone(
        form.representativePhone,
      )
    ) {
      setFormMessage(
        "대표자 연락처는 010으로 시작하는 휴대폰 번호를 입력해주세요.",
      );
      return;
    }

    if (!form.startDate || !form.endDate) {
      setFormMessage(
        "이용 시작일과 종료일을 입력해주세요.",
      );
      return;
    }

    if (form.endDate < form.startDate) {
      setFormMessage(
        "종료일은 시작일보다 빠를 수 없습니다.",
      );
      return;
    }

    const expectedPeople = Number(form.expectedPeople);

    if (
      !Number.isFinite(expectedPeople) ||
      expectedPeople < 1
    ) {
      setFormMessage(
        "예상 인원은 1명 이상이어야 합니다.",
      );
      return;
    }

    const defaultDiveUnitPrice =
      form.defaultDiveUnitPrice.trim()
        ? Number(form.defaultDiveUnitPrice)
        : undefined;

    if (
      typeof defaultDiveUnitPrice !== "undefined" &&
      (!Number.isFinite(defaultDiveUnitPrice) ||
        defaultDiveUnitPrice < 0)
    ) {
      setFormMessage(
        "기본 다이빙 단가를 올바르게 입력해주세요.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/admin/group-dives",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupName: form.groupName.trim(),
            representativeName:
              form.representativeName.trim(),
            representativePhone:
              form.representativePhone,
            startDate: form.startDate,
            endDate: form.endDate,
            expectedPeople,
            billingType: form.billingType,
            defaultDiveUnitPrice,
            status: "ACTIVE",
            memo: form.memo.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as GroupDiveCreateResponse;

      if (!response.ok || !data.ok || !data.groupDive) {
        throw new Error(
          data.message ??
            "그룹 다이빙을 등록하지 못했습니다.",
        );
      }

      setGroupDives((previous) =>
        [data.groupDive as GroupDive, ...previous].sort(
          (a, b) => {
            const dateCompare =
              b.startDate.localeCompare(a.startDate);

            if (dateCompare !== 0) {
              return dateCompare;
            }

            return b.createdAt.localeCompare(a.createdAt);
          },
        ),
      );

      setForm(initialFormState);
      setFormOpen(false);
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : "그룹 다이빙을 등록하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-cyan-600">
            GROUP DIVE OPERATIONS
          </p>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            그룹 다이빙
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            펀다이빙 팀의 참가자 명단, 출항 회차,
            포인트별 승선 인원과 정산 기준을 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadGroupDives(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                refreshing ? "animate-spin" : "",
              ].join(" ")}
            />
            새로고침
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            그룹 등록
          </button>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-bold text-slate-500">
            전체 그룹
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {summary.total}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-bold text-slate-500">
            진행 중
          </p>

          <p className="mt-2 text-2xl font-black text-cyan-600">
            {summary.active}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-bold text-slate-500">
            등록 참가자
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {summary.participants}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-bold text-slate-500">
            등록 회차
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {summary.trips}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchKeyword}
              onChange={(event) =>
                setSearchKeyword(event.target.value)
              }
              placeholder="팀명, 대표자, 연락처 검색"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedSort}
              onChange={(event) =>
                setSelectedSort(
                  event.target.value as GroupDiveSort,
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500"
            >
              {(
                Object.keys(
                  sortLabels,
                ) as GroupDiveSort[]
              ).map((sort) => (
                <option key={sort} value={sort}>
                  {sortLabels[sort]}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2">
              {(
                Object.keys(
                  filterLabels,
                ) as GroupDiveFilter[]
              ).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() =>
                  setSelectedFilter(filter)
                }
                className={[
                  "rounded-full border px-3 py-2 text-xs font-black transition",
                  selectedFilter === filter
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                {filterLabels[filter]}
              </button>
            ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span>
            검색 결과 {filteredGroupDives.length}건
          </span>

          {searchKeyword ||
          selectedFilter !== "ALL" ||
          selectedSort !== "OPERATION" ? (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                setSelectedFilter("ALL");
                setSelectedSort("OPERATION");
              }}
              className="font-black text-cyan-700 hover:text-cyan-800"
            >
              검색 초기화
            </button>
          ) : null}
        </div>
      </section>

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="mt-6">
        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-600" />

              <p className="mt-3 text-sm font-semibold text-slate-500">
                그룹 다이빙 목록을 불러오는 중입니다.
              </p>
            </div>
          </div>
        ) : groupDives.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <Ship className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-lg font-black text-slate-950">
              등록된 그룹 다이빙이 없습니다
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              관리자 등록 버튼을 눌러 첫 번째 펀다이빙
              팀을 등록해주세요.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              그룹 등록
            </button>
          </div>
        ) : filteredGroupDives.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center shadow-sm">
            <Search className="h-9 w-9 text-slate-300" />

            <p className="mt-3 text-sm font-black text-slate-700">
              검색 조건에 맞는 그룹이 없습니다.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                setSelectedFilter("ALL");
                setSelectedSort("OPERATION");
              }}
              className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white"
            >
              검색 초기화
            </button>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-2">
              {filteredGroupDives.map((groupDive) => {
              const activeParticipantCount =
                groupDive.participants.filter(
                  (participant) => participant.active,
                ).length;

              const settlement =
                getSettlementSummary(groupDive);

              return (
                <article
                  key={groupDive.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/30"
                >
                  <div className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
                              statusClasses[groupDive.status],
                            ].join(" ")}
                          >
                            {statusLabels[groupDive.status]}
                          </span>

                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
                              settlementStatusClasses[
                                settlement.status
                              ],
                            ].join(" ")}
                          >
                            {
                              settlementStatusLabels[
                                settlement.status
                              ]
                            }
                          </span>
                        </div>

                        <h2 className="mt-2 truncate text-base font-black text-slate-950">
                          {groupDive.groupName}
                        </h2>

                        <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          {formatDateRange(
                            groupDive.startDate,
                            groupDive.endDate,
                          )}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          대표자 {groupDive.representativeName}
                          {groupDive.representativePhone
                            ? ` · ${groupDive.representativePhone}`
                            : ""}
                        </p>
                      </div>

                      <Link
                        href={`/admin/group-dives/${groupDive.id}`}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                      >
                        상세 관리
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white">
                      <div className="px-3 py-2 text-center">
                        <p className="text-xs font-semibold text-slate-400">
                          참가 인원
                        </p>
                        <p className="mt-1 text-base font-black text-slate-900">
                          {activeParticipantCount}명
                        </p>
                      </div>

                      <div className="px-3 py-2 text-center">
                        <p className="text-xs font-semibold text-slate-400">
                          회차
                        </p>
                        <p className="mt-1 text-base font-black text-slate-900">
                          {groupDive.trips.length}회
                        </p>
                      </div>

                      <div className="px-3 py-2 text-center">
                        <p className="text-xs font-semibold text-slate-400">
                          미수금
                        </p>
                        <p
                          className={[
                            "mt-1 text-base font-black",
                            settlement.unpaidAmount > 0
                              ? "text-rose-600"
                              : "text-emerald-600",
                          ].join(" ")}
                        >
                          {formatCurrency(
                            settlement.unpaidAmount,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
              })}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-cyan-600">
                      GROUP CALENDAR
                    </p>
                    <h2 className="mt-1 text-base font-black text-slate-950">
                      그룹 다이빙 달력
                    </h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={goPrevCalendarMonth}
                      aria-label="이전 달"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goNextCalendarMonth}
                      aria-label="다음 달"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-center text-sm font-black text-slate-900">
                  {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월
                </div>

                <div className="mt-4 grid grid-cols-7 border-y border-slate-100 text-center text-[11px] font-black text-slate-400">
                  {["일", "월", "화", "수", "목", "금", "토"].map((dayName) => (
                    <div key={dayName} className="py-2">
                      {dayName}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 overflow-hidden rounded-b-xl border-x border-b border-slate-100">
                  {calendarDays.map((day, index) => {
                    const isSelected =
                      day.dateKey === selectedCalendarDateKey;

                    return (
                      <button
                        key={`${day.dateKey}-${index}`}
                        type="button"
                        onClick={() => setSelectedCalendarDateKey(day.dateKey)}
                        className={[
                          "min-h-[62px] border-r border-b border-slate-100 p-1.5 text-left transition",
                          isSelected
                            ? "bg-cyan-600 text-white"
                            : day.isCurrentMonth
                              ? "bg-white text-slate-800 hover:bg-cyan-50"
                              : "bg-slate-50 text-slate-300",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                            day.isToday && !isSelected
                              ? "border border-cyan-500 text-cyan-700"
                              : "",
                          ].join(" ")}
                        >
                          {day.date.getDate()}
                        </span>

                        {day.groupCount > 0 ? (
                          <span
                            className={[
                              "mt-1 block w-fit rounded-md px-1.5 py-0.5 text-[10px] font-black",
                              isSelected
                                ? "bg-white/20 text-white"
                                : day.groupCount >= 4
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                  : day.groupCount >= 2
                                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                            ].join(" ")}
                          >
                            {day.groupCount}그룹
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-black text-slate-950">
                    {getKoreanDateLabel(selectedCalendarDateKey)} 진행 예정
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                    {selectedDateGroupDives.length}그룹
                  </span>
                </div>

                {selectedDateGroupDives.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {selectedDateGroupDives.map((groupDive) => {
                      const dayTripCount = getTripCountForDate(
                        groupDive,
                        selectedCalendarDateKey,
                      );
                      const activeParticipantCount =
                        groupDive.participants.filter(
                          (participant) => participant.active,
                        ).length;

                      return (
                        <Link
                          key={groupDive.id}
                          href={`/admin/group-dives/${groupDive.id}`}
                          className="block rounded-xl border border-slate-100 px-3 py-3 transition hover:border-cyan-200 hover:bg-cyan-50/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-950">
                                {groupDive.groupName}
                              </p>
                              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                대표자 {groupDive.representativeName}
                              </p>
                            </div>
                            <span
                              className={[
                                "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black",
                                statusClasses[groupDive.status],
                              ].join(" ")}
                            >
                              {statusLabels[groupDive.status]}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                            <span>다이빙 {dayTripCount}회</span>
                            <span>참여 {activeParticipantCount}명</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
                    선택한 날짜에 진행 예정인 그룹이 없습니다.
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="등록 화면 닫기"
            onClick={closeCreateForm}
            className="absolute inset-0"
          />

          <div className="relative z-10 flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-black text-cyan-600">
                  NEW GROUP DIVE
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  그룹 다이빙 등록
                </h2>
              </div>

              <button
                type="button"
                onClick={closeCreateForm}
                disabled={submitting}
                aria-label="등록 화면 닫기"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="min-h-0 overflow-y-auto"
            >
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    팀명
                  </span>

                  <input
                    type="text"
                    value={form.groupName}
                    onChange={(event) =>
                      updateForm(
                        "groupName",
                        event.target.value,
                      )
                    }
                    placeholder="예: 서울 펀다이빙팀"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    대표자 이름
                  </span>

                  <input
                    type="text"
                    value={form.representativeName}
                    onChange={(event) =>
                      updateForm(
                        "representativeName",
                        event.target.value,
                      )
                    }
                    placeholder="대표자 이름"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    대표자 연락처
                  </span>

                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={13}
                    value={form.representativePhone}
                    onChange={(event) =>
                      updateForm(
                        "representativePhone",
                        formatPhoneInput(
                          event.target.value,
                        ),
                      )
                    }
                    placeholder="010-0000-0000"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />

                  <p className="mt-1.5 text-xs font-medium text-slate-400">
                    010으로 시작하는 휴대폰 번호를 입력해주세요.
                  </p>
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    시작일
                  </span>

                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateForm(
                        "startDate",
                        event.target.value,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    종료일
                  </span>

                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(event) =>
                      updateForm(
                        "endDate",
                        event.target.value,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    예상 인원
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={form.expectedPeople}
                    onChange={(event) =>
                      updateForm(
                        "expectedPeople",
                        event.target.value,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    정산 방식
                  </span>

                  <select
                    value={form.billingType}
                    onChange={(event) =>
                      updateForm(
                        "billingType",
                        event.target
                          .value as GroupDiveBillingType,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="GROUP">
                      팀 대표자 일괄 정산
                    </option>

                    <option value="INDIVIDUAL">
                      참가자 개인별 정산
                    </option>
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    기본 1회 다이빙 단가
                  </span>

                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.defaultDiveUnitPrice}
                    onChange={(event) =>
                      updateForm(
                        "defaultDiveUnitPrice",
                        event.target.value,
                      )
                    }
                    placeholder="예: 60000"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    메모
                  </span>

                  <textarea
                    value={form.memo}
                    onChange={(event) =>
                      updateForm(
                        "memo",
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="팀 관련 요청사항이나 운영 메모"
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                {formMessage ? (
                  <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {formMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  {submitting ? "등록 중" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getKoreanDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${Number(month)}월 ${Number(day)}일`;
}

function isCountableTripStatus(status: string) {
  return status !== "CANCELLED" && status !== "WEATHER_CANCELLED";
}
