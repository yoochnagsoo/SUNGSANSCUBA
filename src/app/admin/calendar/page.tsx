"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  PROGRAM_OPTIONS,
  getProgramOption,
  normalizeProgramValue,
} from "@/lib/programs";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Reservation = {
  id: string;
  source?: "CUSTOMER" | "ADMIN";
  name: string;
  email?: string;
  phone: string;
  program: string;
  reservationDate: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

type StaffScheduleType =
  | "VACATION"
  | "HALF_DAY_AM"
  | "HALF_DAY_PM"
  | "SICK_LEAVE"
  | "UNAVAILABLE"
  | "TRAINING"
  | "BUSINESS_TRIP";

type StaffSchedule = {
  id: string;
  staffName: string;
  type: StaffScheduleType;
  date: string;
  endDate?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

type StaffScheduleListResponse = {
  ok: boolean;
  staffSchedules?: StaffSchedule[];
  message?: string;
};

type StaffScheduleCreateResponse = {
  ok: boolean;
  staffSchedule?: StaffSchedule;
  message?: string;
};

type ReservationCreateResponse = {
  ok: boolean;
  reservation?: Reservation;
  message?: string;
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "접수대기",
  CONFIRMED: "예약확정",
  CANCELLED: "취소",
  COMPLETED: "완료",
};

const STATUS_STYLE: Record<ReservationStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  CONFIRMED: "border-blue-200 bg-blue-50 text-blue-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const SOURCE_LABEL: Record<NonNullable<Reservation["source"]>, string> = {
  CUSTOMER: "고객 예약",
  ADMIN: "관리자 등록",
};

const SOURCE_STYLE: Record<NonNullable<Reservation["source"]>, string> = {
  CUSTOMER: "bg-slate-100 text-slate-600",
  ADMIN: "bg-blue-100 text-blue-700",
};

const STAFF_SCHEDULE_LABEL: Record<StaffScheduleType, string> = {
  VACATION: "휴가",
  HALF_DAY_AM: "오전반차",
  HALF_DAY_PM: "오후반차",
  SICK_LEAVE: "병가",
  UNAVAILABLE: "근무불가",
  TRAINING: "교육",
  BUSINESS_TRIP: "출장",
};

const STAFF_SCHEDULE_STYLE: Record<StaffScheduleType, string> = {
  VACATION: "border-purple-200 bg-purple-50 text-purple-800",
  HALF_DAY_AM: "border-pink-200 bg-pink-50 text-pink-800",
  HALF_DAY_PM: "border-pink-200 bg-pink-50 text-pink-800",
  SICK_LEAVE: "border-red-200 bg-red-50 text-red-800",
  UNAVAILABLE: "border-slate-300 bg-slate-100 text-slate-800",
  TRAINING: "border-indigo-200 bg-indigo-50 text-indigo-800",
  BUSINESS_TRIP: "border-cyan-200 bg-cyan-50 text-cyan-800",
};

const STAFF_SCHEDULE_OPTIONS: StaffScheduleType[] = [
  "VACATION",
  "HALF_DAY_AM",
  "HALF_DAY_PM",
  "SICK_LEAVE",
  "UNAVAILABLE",
  "TRAINING",
  "BUSINESS_TRIP",
];

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTimeValue(time?: string) {
  if (!time) return 999999;

  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 999999;
  }

  return hour * 60 + minute;
}

function sortReservationsByTime(reservations: Reservation[]) {
  return [...reservations].sort((a, b) => {
    const timeA = getTimeValue(a.experienceTime);
    const timeB = getTimeValue(b.experienceTime);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return createdA - createdB;
  });
}

function getDateRange(startDate: string, endDate?: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate || startDate}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    return [];
  }

  if (Number.isNaN(end.getTime())) {
    return [startDate];
  }

  const from = start <= end ? start : end;
  const to = start <= end ? end : start;

  const dates: string[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function sortStaffSchedules(items: StaffSchedule[]) {
  return [...items].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return a.staffName.localeCompare(b.staffName);
  });
}

function getProgramLabel(program: string) {
  return getProgramOption(program)?.label || program;
}

export default function AdminCalendarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [savingStaffSchedule, setSavingStaffSchedule] = useState(false);
  const [savingReservation, setSavingReservation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const [showReservationPanel, setShowReservationPanel] = useState(false);

  const [reservationName, setReservationName] = useState("");
  const [reservationPhone, setReservationPhone] = useState("");
  const [reservationEmail, setReservationEmail] = useState("");
  const [reservationProgram, setReservationProgram] = useState("");
  const [reservationDate, setReservationDate] = useState(() =>
    toDateKey(new Date()),
  );
  const [reservationTime, setReservationTime] = useState("09:00");
  const [reservationPeople, setReservationPeople] = useState("1");
  const [reservationStatus, setReservationStatus] =
    useState<ReservationStatus>("CONFIRMED");
  const [reservationMemo, setReservationMemo] = useState("");
  const [reservationFormError, setReservationFormError] = useState("");

  const [staffName, setStaffName] = useState("");
  const [staffScheduleType, setStaffScheduleType] =
    useState<StaffScheduleType>("VACATION");
  const [staffScheduleDate, setStaffScheduleDate] = useState(() =>
    toDateKey(new Date()),
  );
  const [staffScheduleEndDate, setStaffScheduleEndDate] = useState("");
  const [staffScheduleMemo, setStaffScheduleMemo] = useState("");
  const [staffFormError, setStaffFormError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDate = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0);

    const firstDay = firstDate.getDay();
    const lastDay = lastDate.getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayKey = toDateKey(new Date());

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const date = new Date(year, month, -i);
      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      });
    }

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
      });
    }

    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      const date = new Date(last);
      date.setDate(last.getDate() + 1);

      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      });
    }

    return days;
  }, [year, month]);

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();

    for (const reservation of reservations) {
      const dateKey = reservation.reservationDate;

      if (!dateKey) {
        continue;
      }

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }

      map.get(dateKey)?.push(reservation);
    }

    for (const [dateKey, items] of map.entries()) {
      map.set(dateKey, sortReservationsByTime(items));
    }

    return map;
  }, [reservations]);

  const staffSchedulesByDate = useMemo(() => {
    const map = new Map<string, StaffSchedule[]>();

    for (const schedule of staffSchedules) {
      const dateKeys = getDateRange(schedule.date, schedule.endDate);

      for (const dateKey of dateKeys) {
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }

        map.get(dateKey)?.push(schedule);
      }
    }

    for (const [dateKey, items] of map.entries()) {
      map.set(dateKey, sortStaffSchedules(items));
    }

    return map;
  }, [staffSchedules]);

  const currentMonthStaffSchedules = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

    return sortStaffSchedules(
      staffSchedules.filter((schedule) => {
        const dateKeys = getDateRange(schedule.date, schedule.endDate);

        return dateKeys.some((dateKey) => dateKey.startsWith(monthPrefix));
      }),
    );
  }, [month, staffSchedules, year]);

  async function fetchReservations() {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await fetch("/api/reservations", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "예약 목록을 불러오지 못했습니다.");
      }

      setReservations(data.reservations || []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "예약 목록을 불러오지 못했습니다.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStaffSchedules() {
    try {
      setStaffLoading(true);
      setStaffFormError("");

      const res = await fetch("/api/staff-schedules", {
        cache: "no-store",
      });

      const data = (await res.json()) as StaffScheduleListResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "직원 일정을 불러오지 못했습니다.");
      }

      setStaffSchedules(data.staffSchedules || []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "직원 일정을 불러오지 못했습니다.";

      setStaffFormError(message);
    } finally {
      setStaffLoading(false);
    }
  }

  useEffect(() => {
    fetchReservations();
    fetchStaffSchedules();
  }, []);

  function goPrevMonth() {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  async function handleAddReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = reservationName.trim();
    const nextPhone = reservationPhone.trim();
    const nextEmail = reservationEmail.trim();
    const nextProgram = normalizeProgramValue(reservationProgram);
    const nextMemo = reservationMemo.trim();

    if (!nextName) {
      setReservationFormError("이름을 입력해주세요.");
      return;
    }

    if (!nextPhone) {
      setReservationFormError("연락처를 입력해주세요.");
      return;
    }

    if (!nextProgram) {
      setReservationFormError("프로그램 / 예약 내용을 선택해주세요.");
      return;
    }

    if (!reservationDate) {
      setReservationFormError("예약일을 선택해주세요.");
      return;
    }

    if (!reservationTime) {
      setReservationFormError("예약 시간을 선택해주세요.");
      return;
    }

    try {
      setSavingReservation(true);
      setReservationFormError("");

      const res = await fetch("/api/admin/calendar-reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          name: nextName,
          phone: nextPhone,
          email: nextEmail,
          program: nextProgram,
          title: nextProgram,
          reservationDate,
          experienceTime: reservationTime,
          people: Number(reservationPeople || 1),
          memo: nextMemo,
          status: reservationStatus,
        }),
      });

      const data = (await res.json()) as ReservationCreateResponse;

      if (!res.ok || !data.ok || !data.reservation) {
        throw new Error(data.message || "예약을 등록하지 못했습니다.");
      }

      setReservations((prev) =>
        sortReservationsByTime([...prev, data.reservation as Reservation]),
      );

      setReservationName("");
      setReservationPhone("");
      setReservationEmail("");
      setReservationProgram("");
      setReservationDate(toDateKey(new Date()));
      setReservationTime("09:00");
      setReservationPeople("1");
      setReservationStatus("CONFIRMED");
      setReservationMemo("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "예약을 등록하지 못했습니다.";

      setReservationFormError(message);
    } finally {
      setSavingReservation(false);
    }
  }

  async function handleAddStaffSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextStaffName = staffName.trim();
    const nextMemo = staffScheduleMemo.trim();

    if (!nextStaffName) {
      setStaffFormError("직원명을 입력해주세요.");
      return;
    }

    if (!staffScheduleDate) {
      setStaffFormError("시작일을 선택해주세요.");
      return;
    }

    if (
      staffScheduleEndDate &&
      new Date(`${staffScheduleEndDate}T00:00:00`) <
        new Date(`${staffScheduleDate}T00:00:00`)
    ) {
      setStaffFormError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    try {
      setSavingStaffSchedule(true);
      setStaffFormError("");

      const res = await fetch("/api/staff-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          staffName: nextStaffName,
          type: staffScheduleType,
          date: staffScheduleDate,
          endDate: staffScheduleEndDate || undefined,
          memo: nextMemo,
        }),
      });

      const data = (await res.json()) as StaffScheduleCreateResponse;

      if (!res.ok || !data.ok || !data.staffSchedule) {
        throw new Error(data.message || "직원 일정을 등록하지 못했습니다.");
      }

      setStaffSchedules((prev) =>
        sortStaffSchedules([...prev, data.staffSchedule as StaffSchedule]),
      );

      setStaffName("");
      setStaffScheduleType("VACATION");
      setStaffScheduleDate(toDateKey(new Date()));
      setStaffScheduleEndDate("");
      setStaffScheduleMemo("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "직원 일정을 등록하지 못했습니다.";

      setStaffFormError(message);
    } finally {
      setSavingStaffSchedule(false);
    }
  }

  async function handleDeleteStaffSchedule(id: string) {
    try {
      setStaffFormError("");

      const res = await fetch(`/api/staff-schedules/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "직원 일정을 삭제하지 못했습니다.");
      }

      setStaffSchedules((prev) =>
        prev.filter((schedule) => schedule.id !== id),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "직원 일정을 삭제하지 못했습니다.";

      setStaffFormError(message);
    }
  }

  const calendarMinWidth =
    showStaffPanel || showReservationPanel ? "min-w-[700px]" : "min-w-[980px]";

  return (
    <div className="max-w-full space-y-6 overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">관리자</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            예약 캘린더
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            고객 예약과 관리자가 직접 등록한 예약, 직원 휴가/근무불가 일정을
            함께 확인합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            이전달
          </button>

          <button
            type="button"
            onClick={goToday}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            오늘
          </button>

          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            다음달
          </button>

          <button
            type="button"
            onClick={() => setShowReservationPanel((prev) => !prev)}
            className={[
              "rounded-xl px-4 py-2 text-sm font-black transition",
              showReservationPanel
                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                : "bg-blue-600 text-white hover:bg-blue-700",
            ].join(" ")}
          >
            {showReservationPanel ? "예약 등록 닫기" : "예약 직접 등록"}
          </button>

          <button
            type="button"
            onClick={() => setShowStaffPanel((prev) => !prev)}
            className={[
              "rounded-xl px-4 py-2 text-sm font-black transition",
              showStaffPanel
                ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                : "bg-slate-900 text-white hover:bg-slate-700",
            ].join(" ")}
          >
            {showStaffPanel ? "직원 일정 닫기" : "직원 일정 등록"}
          </button>
        </div>
      </div>

      <section
        className={[
          "grid max-w-full gap-6 overflow-hidden",
          showStaffPanel || showReservationPanel
            ? "lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]"
            : "grid-cols-1",
        ].join(" ")}
      >
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {year}년 {month + 1}월
            </h2>

            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABEL).map(([status, label]) => (
                <div
                  key={status}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    STATUS_STYLE[status as ReservationStatus]
                  }`}
                >
                  {label}
                </div>
              ))}

              <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                관리자 등록
              </div>

              <div className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-800">
                직원 휴가
              </div>
            </div>
          </div>

          {currentMonthStaffSchedules.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-purple-900">
                    이번 달 직원 일정 {currentMonthStaffSchedules.length}건
                  </p>
                  <p className="mt-1 text-xs font-medium text-purple-700">
                    휴가/반차/근무불가 직원이 있는 날짜가 캘린더에 표시됩니다.
                  </p>
                </div>

                {!showStaffPanel ? (
                  <button
                    type="button"
                    onClick={() => setShowStaffPanel(true)}
                    className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-black text-white hover:bg-purple-800"
                  >
                    목록/등록 열기
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {currentMonthStaffSchedules.slice(0, 8).map((schedule) => (
                  <span
                    key={schedule.id}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      STAFF_SCHEDULE_STYLE[schedule.type]
                    }`}
                  >
                    {schedule.date}
                    {schedule.endDate ? `~${schedule.endDate}` : ""} ·{" "}
                    {schedule.staffName} · {STAFF_SCHEDULE_LABEL[schedule.type]}
                  </span>
                ))}

                {currentMonthStaffSchedules.length > 8 ? (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700">
                    +{currentMonthStaffSchedules.length - 8}건 더보기
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {loading || staffLoading ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              예약 캘린더를 불러오는 중입니다.
            </div>
          ) : (
            <div className="mt-5 max-w-full overflow-x-auto">
              <div className={["transition-all", calendarMinWidth].join(" ")}>
                <div className="grid grid-cols-7 border-y border-slate-200 bg-slate-50">
                  {DAY_NAMES.map((dayName, index) => (
                    <div
                      key={dayName}
                      className={`px-2 py-3 text-center text-sm font-bold ${
                        index === 0
                          ? "text-rose-500"
                          : index === 6
                            ? "text-blue-500"
                            : "text-slate-600"
                      }`}
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 border-l border-slate-200">
                  {calendarDays.map((day) => {
                    const dayReservations =
                      reservationsByDate.get(day.dateKey) || [];
                    const dayStaffSchedules =
                      staffSchedulesByDate.get(day.dateKey) || [];

                    return (
                      <div
                        key={day.dateKey}
                        className={[
                          "border-b border-r border-slate-200 p-2",
                          showStaffPanel || showReservationPanel
                            ? "min-h-44"
                            : "min-h-48",
                          day.isCurrentMonth ? "bg-white" : "bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                              day.isToday
                                ? "bg-blue-600 text-white"
                                : day.isCurrentMonth
                                  ? "text-slate-800"
                                  : "text-slate-400"
                            }`}
                          >
                            {day.date.getDate()}
                          </span>

                          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                            {dayStaffSchedules.length > 0 ? (
                              <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black text-purple-700">
                                휴가 {dayStaffSchedules.length}
                              </span>
                            ) : null}

                            {dayReservations.length > 0 ? (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                                예약 {dayReservations.length}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {dayStaffSchedules.length > 0 ? (
                          <div className="mb-2 space-y-1.5 rounded-xl border border-purple-200 bg-purple-50/60 p-2">
                            <p className="text-[10px] font-black text-purple-800">
                              직원 일정
                            </p>

                            {dayStaffSchedules.map((schedule) => (
                              <div
                                key={`${day.dateKey}-${schedule.id}`}
                                className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold leading-4 ${
                                  STAFF_SCHEDULE_STYLE[schedule.type]
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate">
                                    {schedule.staffName}
                                  </span>
                                  <span className="shrink-0 text-[10px]">
                                    {STAFF_SCHEDULE_LABEL[schedule.type]}
                                  </span>
                                </div>

                                {schedule.memo ? (
                                  <p className="mt-0.5 truncate text-[10px] font-medium opacity-80">
                                    {schedule.memo}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="space-y-1.5">
                          {dayReservations.map((reservation) => {
                            const source = reservation.source || "CUSTOMER";

                            return (
                              <Link
                                key={reservation.id}
                                href={`/admin/reservations/${reservation.id}`}
                                className={`block rounded-xl border px-2 py-2 text-[11px] font-semibold leading-4 transition hover:scale-[1.01] hover:shadow-sm ${
                                  STATUS_STYLE[reservation.status]
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="shrink-0 font-black">
                                    {reservation.experienceTime || "미정"}
                                  </span>
                                  <span className="truncate">
                                    {reservation.name}
                                  </span>
                                </div>

                                <div className="mt-1 flex items-center gap-1">
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                                      SOURCE_STYLE[source]
                                    }`}
                                  >
                                    {SOURCE_LABEL[source]}
                                  </span>
                                  <span className="truncate opacity-80">
                                    {reservation.people}명 ·{" "}
                                    {getProgramLabel(reservation.program)}
                                  </span>
                                </div>

                                <div className="mt-0.5 truncate opacity-80">
                                  {STATUS_LABEL[reservation.status]}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {showReservationPanel || showStaffPanel ? (
          <aside className="min-w-0 space-y-6 lg:sticky lg:top-20 lg:self-start">
            {showReservationPanel ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      예약 직접 등록
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      고객 예약과 동일한 예약 데이터로 저장됩니다.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReservationPanel(false)}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                  >
                    닫기
                  </button>
                </div>

                {reservationFormError ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {reservationFormError}
                  </div>
                ) : null}

                <form onSubmit={handleAddReservation} className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        이름
                      </label>
                      <input
                        value={reservationName}
                        onChange={(event) =>
                          setReservationName(event.target.value)
                        }
                        placeholder="예: 홍길동"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        연락처
                      </label>
                      <input
                        value={reservationPhone}
                        onChange={(event) =>
                          setReservationPhone(event.target.value)
                        }
                        placeholder="010-0000-0000"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={reservationEmail}
                      onChange={(event) =>
                        setReservationEmail(event.target.value)
                      }
                      placeholder="example@email.com"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      프로그램 / 예약 내용
                    </label>
                    <select
                      value={reservationProgram}
                      onChange={(event) =>
                        setReservationProgram(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">프로그램 선택</option>
                      {PROGRAM_OPTIONS.map((program) => (
                        <option key={program.value} value={program.value}>
                          {program.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      예약일
                    </label>
                    <input
                      type="date"
                      value={reservationDate}
                      onChange={(event) => setReservationDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      예약 시간
                    </label>
                    <input
                      type="time"
                      step="1800"
                      value={reservationTime}
                      onChange={(event) =>
                        setReservationTime(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      30분 단위로 선택됩니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        인원
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={reservationPeople}
                        onChange={(event) =>
                          setReservationPeople(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        상태
                      </label>
                      <select
                        value={reservationStatus}
                        onChange={(event) =>
                          setReservationStatus(
                            event.target.value as ReservationStatus,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="CONFIRMED">예약확정</option>
                        <option value="PENDING">접수대기</option>
                        <option value="COMPLETED">완료</option>
                        <option value="CANCELLED">취소</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      요청사항 / 메모
                    </label>
                    <textarea
                      value={reservationMemo}
                      onChange={(event) => setReservationMemo(event.target.value)}
                      placeholder="예: 장비 준비, 강사 배정, 고객 요청사항"
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingReservation}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingReservation ? "등록 중..." : "예약 등록"}
                  </button>
                </form>
              </div>
            ) : null}

            {showStaffPanel ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        직원 휴가 등록
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        휴가/반차/근무불가 직원을 표시합니다.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowStaffPanel(false)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                    >
                      닫기
                    </button>
                  </div>

                  {staffFormError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                      {staffFormError}
                    </div>
                  ) : null}

                  <form
                    onSubmit={handleAddStaffSchedule}
                    className="mt-5 space-y-4"
                  >
                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        직원명
                      </label>
                      <input
                        value={staffName}
                        onChange={(event) => setStaffName(event.target.value)}
                        placeholder="예: 김강사"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        구분
                      </label>
                      <select
                        value={staffScheduleType}
                        onChange={(event) =>
                          setStaffScheduleType(
                            event.target.value as StaffScheduleType,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        {STAFF_SCHEDULE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {STAFF_SCHEDULE_LABEL[type]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          시작일
                        </label>
                        <input
                          type="date"
                          value={staffScheduleDate}
                          onChange={(event) =>
                            setStaffScheduleDate(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700">
                          종료일
                        </label>
                        <input
                          type="date"
                          value={staffScheduleEndDate}
                          onChange={(event) =>
                            setStaffScheduleEndDate(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        메모
                      </label>
                      <textarea
                        value={staffScheduleMemo}
                        onChange={(event) =>
                          setStaffScheduleMemo(event.target.value)
                        }
                        placeholder="예: 가족여행, 오후 병원, 장비교육 등"
                        rows={3}
                        className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingStaffSchedule}
                      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingStaffSchedule ? "등록 중..." : "직원 일정 등록"}
                    </button>
                  </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        이번 달 직원 일정
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        휴가자가 있는 날을 확인합니다.
                      </p>
                    </div>

                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                      {currentMonthStaffSchedules.length}건
                    </span>
                  </div>

                  <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {currentMonthStaffSchedules.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        이번 달 등록된 직원 일정이 없습니다.
                      </div>
                    ) : (
                      currentMonthStaffSchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-900">
                                {schedule.staffName}
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-600">
                                {schedule.date}
                                {schedule.endDate
                                  ? ` ~ ${schedule.endDate}`
                                  : ""}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${
                                STAFF_SCHEDULE_STYLE[schedule.type]
                              }`}
                            >
                              {STAFF_SCHEDULE_LABEL[schedule.type]}
                            </span>
                          </div>

                          {schedule.memo ? (
                            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                              {schedule.memo}
                            </p>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteStaffSchedule(schedule.id)
                            }
                            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </aside>
        ) : null}
      </section>
    </div>
  );
}