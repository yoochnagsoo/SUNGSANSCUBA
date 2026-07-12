"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  PROGRAM_OPTIONS,
  getProgramOption,
  normalizeProgramValue,
} from "@/lib/programs";
import {
  DEFAULT_EXPERIENCE_TIME,
  EXPERIENCE_TIME_OPTIONS,
} from "@/lib/experienceTimes";
import { normalizeSearchText } from "@/lib/search";

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
  primaryStaffId?: string;
  primaryStaffName?: string;
  assistantStaffIds?: string[];
  assistantStaffNames?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type GroupDiveTripStatus =
  | "SCHEDULED"
  | "BOARDING"
  | "DEPARTED"
  | "COMPLETED"
  | "CANCELLED"
  | "WEATHER_CANCELLED";

type GroupDiveTripParticipant = {
  participantId: string;
  participantName: string;
  boarded: boolean;
};

type GroupDiveTrip = {
  id: string;
  groupDiveId: string;
  date: string;

  /*
   * startTime은 기존 데이터 호환용 희망 시간입니다.
   */
  startTime: string;
  preferredTime?: string;

  /*
   * 보트 운항 스케줄에 배정된 실제 출항 정보입니다.
   */
  actualDepartureTime?: string;
  boatScheduleId?: string;

  plannedPointName: string;
  actualPointName: string;
  boatName: string;
  guideName: string;
  capacity: number;
  status: GroupDiveTripStatus;
  participants: GroupDiveTripParticipant[];
  memo: string;
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
  trips: GroupDiveTrip[];
};

type GroupDiveListResponse = {
  ok: boolean;
  groupDives?: GroupDive[];
  message?: string;
};

type CalendarGroupDiveTrip = GroupDiveTrip & {
  groupName: string;
  groupStatus: GroupDive["status"];
};

type BoatScheduleStatus =
  | "SCHEDULED"
  | "BOARDING"
  | "DEPARTED"
  | "COMPLETED"
  | "CANCELLED"
  | "WEATHER_CANCELLED";

type BoatSchedule = {
  id: string;
  date: string;
  departureTime: string;
  plannedPointName: string;
  actualPointName: string;
  passengerCapacity: number;
  status: BoatScheduleStatus;
  memo: string;
};

type BoatScheduleResponse = {
  ok: boolean;
  boatSchedule?: BoatSchedule;
  message?: string;
};

type CalendarBoatDeparture = {
  boatScheduleId: string;
  date: string;
  time: string;
  pointName: string;
  status: BoatScheduleStatus;
  trips: CalendarGroupDiveTrip[];
  totalPeople: number;
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
  staffId?: string;
  staffName: string;
  type: StaffScheduleType;
  date: string;
  endDate?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

type StaffOption = {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  roleLabel: string;
};

type StaffOptionsResponse = {
  ok: boolean;
  staffOptions?: StaffOption[];
  message?: string;
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

type StaffScheduleUpdateResponse = {
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

const STATUS_DOT_STYLE: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-400",
  CONFIRMED: "bg-blue-500",
  CANCELLED: "bg-rose-400",
  COMPLETED: "bg-emerald-500",
};

const SOURCE_LABEL: Record<NonNullable<Reservation["source"]>, string> = {
  CUSTOMER: "고객 예약",
  ADMIN: "관리자 등록",
};

const SOURCE_STYLE: Record<NonNullable<Reservation["source"]>, string> = {
  CUSTOMER: "bg-slate-100 text-slate-600",
  ADMIN: "bg-blue-100 text-blue-700",
};

const GROUP_DIVE_TRIP_STATUS_LABEL: Record<GroupDiveTripStatus, string> = {
  SCHEDULED: "예정",
  BOARDING: "승선 중",
  DEPARTED: "출항",
  COMPLETED: "완료",
  CANCELLED: "취소",
  WEATHER_CANCELLED: "기상 취소",
};

const GROUP_DIVE_TRIP_STYLE: Record<GroupDiveTripStatus, string> = {
  SCHEDULED: "border-cyan-200 bg-cyan-50 text-cyan-800",
  BOARDING: "border-amber-200 bg-amber-50 text-amber-800",
  DEPARTED: "border-blue-200 bg-blue-50 text-blue-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
  WEATHER_CANCELLED: "border-violet-200 bg-violet-50 text-violet-800",
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

function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatKoreanMobilePhone(value: string) {
  const digits = getPhoneDigits(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidKoreanMobilePhone(value: string) {
  const digits = getPhoneDigits(value);

  return /^01[016789]\d{7,8}$/.test(digits);
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

function formatScheduleTimeRange(time?: string) {
  if (!time) {
    return "시간 미정";
  }

  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return time;
  }

  const start = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0",
  )}`;
  const endHour = (hour + 1) % 24;
  const end = `${String(endHour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0",
  )}`;

  return `${start} - ${end}`;
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

type ReservationCalendarGroup = {
  key: string;
  time: string;
  program: string;
  programLabel: string;
  reservations: Reservation[];
  totalPeople: number;
};

type CalendarTimedItem =
  | {
      kind: "RESERVATION_GROUP";
      time: string;
      group: ReservationCalendarGroup;
    }
  | {
      kind: "GROUP_DIVE";
      time: string;
      departure: CalendarBoatDeparture;
    };

function groupReservationsByTimeAndProgram(
  reservations: Reservation[],
): ReservationCalendarGroup[] {
  const groupMap = new Map<string, ReservationCalendarGroup>();

  for (const reservation of sortReservationsByTime(reservations)) {
    const time = reservation.experienceTime || "";
    const normalizedProgram = normalizeProgramValue(reservation.program) || reservation.program;
    const key = `${time}__${normalizedProgram}`;
    const existing = groupMap.get(key);

    if (existing) {
      existing.reservations.push(reservation);
      existing.totalPeople += Number(reservation.people || 0);
      continue;
    }

    groupMap.set(key, {
      key,
      time,
      program: normalizedProgram,
      programLabel: getProgramLabel(normalizedProgram),
      reservations: [reservation],
      totalPeople: Number(reservation.people || 0),
    });
  }

  return Array.from(groupMap.values()).sort((a, b) => {
    const timeDiff = getTimeValue(a.time) - getTimeValue(b.time);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return a.programLabel.localeCompare(b.programLabel);
  });
}

function getReservationGroupStatusCounts(group: ReservationCalendarGroup) {
  return group.reservations.reduce<Record<ReservationStatus, number>>(
    (counts, reservation) => {
      counts[reservation.status] += 1;
      return counts;
    },
    {
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    },
  );
}

function getReservationGroupStyle(group: ReservationCalendarGroup) {
  const statuses = Array.from(
    new Set(group.reservations.map((reservation) => reservation.status)),
  );

  if (statuses.length === 1) {
    return STATUS_STYLE[statuses[0]];
  }

  return "border-slate-300 bg-slate-50 text-slate-800";
}

function sortCalendarTimedItems(items: CalendarTimedItem[]) {
  return [...items].sort((a, b) => {
    const timeDiff = getTimeValue(a.time) - getTimeValue(b.time);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    if (a.kind !== b.kind) {
      return a.kind === "GROUP_DIVE" ? -1 : 1;
    }

    const labelA =
      a.kind === "RESERVATION_GROUP"
        ? a.group.programLabel
        : a.departure.pointName;

    const labelB =
      b.kind === "RESERVATION_GROUP"
        ? b.group.programLabel
        : b.departure.pointName;

    return labelA.localeCompare(labelB);
  });
}

function sortGroupDiveTrips(items: CalendarGroupDiveTrip[]) {
  return [...items].sort((a, b) => {
    const timeDiff =
      getTimeValue(a.actualDepartureTime) -
      getTimeValue(b.actualDepartureTime);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return a.groupName.localeCompare(b.groupName);
  });
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

function getKoreanDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${
    DAY_NAMES[date.getDay()]
  }요일`;
}

function getAssignedStaffNames(reservation: Reservation) {
  return Array.from(
    new Set(
      [reservation.primaryStaffName, ...(reservation.assistantStaffNames || [])]
        .map((name) => String(name || "").trim())
        .filter(Boolean),
    ),
  );
}

export default function AdminCalendarPage() {
  const searchParams = useSearchParams();
  const isTabletDisplay = searchParams.get("display") === "tablet";

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [groupDives, setGroupDives] = useState<GroupDive[]>([]);
  const [boatSchedulesById, setBoatSchedulesById] = useState<
    Record<string, BoatSchedule>
  >({});
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date()),
  );

  const [loading, setLoading] = useState(true);
  const [groupDiveLoading, setGroupDiveLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [savingStaffSchedule, setSavingStaffSchedule] = useState(false);
  const [savingReservation, setSavingReservation] = useState(false);
  const [deletingStaffScheduleId, setDeletingStaffScheduleId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reservationNameKeyword, setReservationNameKeyword] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const [showReservationPanel, setShowReservationPanel] = useState(false);

  const [reservationName, setReservationName] = useState("");
  const [reservationPhone, setReservationPhone] = useState("");
  const [reservationEmail, setReservationEmail] = useState("");
  const [reservationProgram, setReservationProgram] = useState("");
  const [reservationDate, setReservationDate] = useState(() =>
    toDateKey(new Date()),
  );
  const [reservationTime, setReservationTime] = useState(
    DEFAULT_EXPERIENCE_TIME,
  );
  const [reservationPeople, setReservationPeople] = useState("1");
  const [reservationStatus, setReservationStatus] =
    useState<ReservationStatus>("CONFIRMED");
  const [reservationMemo, setReservationMemo] = useState("");
  const [reservationFormError, setReservationFormError] = useState("");

  const [editingStaffScheduleId, setEditingStaffScheduleId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [staffScheduleType, setStaffScheduleType] =
    useState<StaffScheduleType>("VACATION");
  const [staffScheduleDate, setStaffScheduleDate] = useState(() =>
    toDateKey(new Date()),
  );
  const [staffScheduleEndDate, setStaffScheduleEndDate] = useState("");
  const [staffScheduleMemo, setStaffScheduleMemo] = useState("");
  const [staffFormError, setStaffFormError] = useState("");

  const isEditingStaffSchedule = Boolean(editingStaffScheduleId);

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

  const filteredReservations = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(reservationNameKeyword);

    if (!normalizedKeyword) {
      return reservations;
    }

    return reservations.filter((reservation) =>
      normalizeSearchText(reservation.name).includes(normalizedKeyword),
    );
  }, [reservationNameKeyword, reservations]);

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();

    for (const reservation of filteredReservations) {
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
  }, [filteredReservations]);

  const groupDiveTripsByDate = useMemo(() => {
    const departuresByDate = new Map<
      string,
      Map<string, CalendarBoatDeparture>
    >();

    for (const groupDive of groupDives) {
      for (const trip of groupDive.trips || []) {
        if (
          !trip.date ||
          !trip.boatScheduleId ||
          !trip.actualDepartureTime
        ) {
          continue;
        }

        const boatSchedule =
          boatSchedulesById[trip.boatScheduleId];

        if (!boatSchedule) {
          continue;
        }

        if (
          boatSchedule.status === "CANCELLED" ||
          boatSchedule.status === "WEATHER_CANCELLED"
        ) {
          continue;
        }

        if (!departuresByDate.has(trip.date)) {
          departuresByDate.set(trip.date, new Map());
        }

        const dateMap = departuresByDate.get(trip.date)!;
        const existing = dateMap.get(trip.boatScheduleId);
        const boardedCount = trip.participants.filter(
          (participant) => participant.boarded,
        ).length;

        const calendarTrip: CalendarGroupDiveTrip = {
          ...trip,
          groupName: groupDive.groupName,
          groupStatus: groupDive.status,
        };

        if (existing) {
          existing.trips.push(calendarTrip);
          existing.totalPeople += boardedCount;
          continue;
        }

        dateMap.set(trip.boatScheduleId, {
          boatScheduleId: trip.boatScheduleId,
          date: boatSchedule.date,
          time: boatSchedule.departureTime,
          pointName:
            boatSchedule.actualPointName ||
            boatSchedule.plannedPointName ||
            "포인트 미정",
          status: boatSchedule.status,
          trips: [calendarTrip],
          totalPeople: boardedCount,
        });
      }
    }

    const result = new Map<string, CalendarBoatDeparture[]>();

    for (const [dateKey, departureMap] of departuresByDate.entries()) {
      const departures = Array.from(departureMap.values())
        .map((departure) => ({
          ...departure,
          trips: sortGroupDiveTrips(departure.trips),
        }))
        .sort((a, b) => {
          const timeDiff =
            getTimeValue(a.time) - getTimeValue(b.time);

          if (timeDiff !== 0) {
            return timeDiff;
          }

          return a.pointName.localeCompare(b.pointName);
        });

      result.set(dateKey, departures);
    }

    return result;
  }, [boatSchedulesById, groupDives]);

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

  const selectedReservations = useMemo(() => {
    return reservationsByDate.get(selectedDateKey) || [];
  }, [reservationsByDate, selectedDateKey]);

  const selectedGroupDiveTrips = useMemo(() => {
    return groupDiveTripsByDate.get(selectedDateKey) || [];
  }, [groupDiveTripsByDate, selectedDateKey]);

  const selectedTimedItems = useMemo(() => {
    const reservationGroups = groupReservationsByTimeAndProgram(
      selectedReservations,
    );

    const items: CalendarTimedItem[] = [
      ...reservationGroups.map((group) => ({
        kind: "RESERVATION_GROUP" as const,
        time: group.time,
        group,
      })),
      ...selectedGroupDiveTrips.map((departure) => ({
        kind: "GROUP_DIVE" as const,
        time: departure.time,
        departure,
      })),
    ];

    return sortCalendarTimedItems(items);
  }, [selectedGroupDiveTrips, selectedReservations]);

  const selectedStaffSchedules = useMemo(() => {
    return staffSchedulesByDate.get(selectedDateKey) || [];
  }, [selectedDateKey, staffSchedulesByDate]);

  useEffect(() => {
    const today = new Date();
    const todayKey = toDateKey(today);

    if (today.getFullYear() === year && today.getMonth() === month) {
      setSelectedDateKey(todayKey);
      return;
    }

    setSelectedDateKey(toDateKey(new Date(year, month, 1)));
  }, [month, year]);

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

  async function fetchGroupDives() {
    try {
      setGroupDiveLoading(true);
      setErrorMessage("");

      const res = await fetch("/api/admin/group-dives", {
        cache: "no-store",
      });

      const data = (await res.json()) as GroupDiveListResponse;

      if (!res.ok || !data.ok) {
        throw new Error(
          data.message || "보트 출항 일정을 불러오지 못했습니다.",
        );
      }

      const nextGroupDives = data.groupDives || [];
      setGroupDives(nextGroupDives);

      const boatScheduleIds = Array.from(
        new Set(
          nextGroupDives.flatMap((groupDive) =>
            (groupDive.trips || [])
              .map((trip) => trip.boatScheduleId || "")
              .filter(Boolean),
          ),
        ),
      );

      const boatScheduleEntries = await Promise.all(
        boatScheduleIds.map(async (boatScheduleId) => {
          const boatResponse = await fetch(
            `/api/admin/boat-schedules/${boatScheduleId}`,
            {
              cache: "no-store",
            },
          );

          const boatData =
            (await boatResponse.json()) as BoatScheduleResponse;

          if (
            !boatResponse.ok ||
            !boatData.ok ||
            !boatData.boatSchedule
          ) {
            return null;
          }

          return [
            boatScheduleId,
            boatData.boatSchedule,
          ] as const;
        }),
      );

      setBoatSchedulesById(
        Object.fromEntries(
          boatScheduleEntries.filter(
            (
              entry,
            ): entry is readonly [string, BoatSchedule] =>
              entry !== null,
          ),
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "보트 출항 일정을 불러오지 못했습니다.";

      setErrorMessage(message);
    } finally {
      setGroupDiveLoading(false);
    }
  }

  async function fetchStaffOptions() {
    try {
      const res = await fetch("/api/admin/staff-options", {
        cache: "no-store",
      });

      const data = (await res.json()) as StaffOptionsResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "직원 목록을 불러오지 못했습니다.");
      }

      setStaffOptions(data.staffOptions || []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "직원 목록을 불러오지 못했습니다.";

      setStaffFormError(message);
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

  async function refreshCalendarData(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsRefreshing(true);
    }

    try {
      await Promise.all([
        fetchReservations(),
        fetchGroupDives(),
        fetchStaffOptions(),
        fetchStaffSchedules(),
      ]);

      setLastUpdatedAt(new Date());
    } finally {
      if (!options?.silent) {
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    refreshCalendarData();
  }, []);

  useEffect(() => {
    if (!isTabletDisplay) {
      return;
    }

    const intervalId = window.setInterval(() => {
      refreshCalendarData({ silent: true });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [isTabletDisplay]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "전체화면 모드로 전환하지 못했습니다.",
      );
    }
  }

  function goPrevMonth() {
    setIsDayDetailOpen(false);
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setIsDayDetailOpen(false);
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }

  function goToday() {
    const today = new Date();

    setCurrentDate(today);
    setSelectedDateKey(toDateKey(today));
    setIsDayDetailOpen(true);
  }

  function resetStaffScheduleForm(dateKey?: string) {
    setEditingStaffScheduleId("");
    setStaffId("");
    setStaffScheduleType("VACATION");
    setStaffScheduleDate(dateKey || selectedDateKey || toDateKey(new Date()));
    setStaffScheduleEndDate("");
    setStaffScheduleMemo("");
    setStaffFormError("");
  }

  function openReservationPanel(dateKey?: string) {
    const nextDateKey = dateKey || selectedDateKey || toDateKey(new Date());

    setReservationDate(nextDateKey);
    setSelectedDateKey(nextDateKey);
    setShowReservationPanel(true);
  }

  function openStaffPanel(dateKey?: string) {
    const nextDateKey = dateKey || selectedDateKey || toDateKey(new Date());

    if (!isEditingStaffSchedule) {
      setStaffScheduleDate(nextDateKey);
    }

    setSelectedDateKey(nextDateKey);
    setShowStaffPanel(true);
  }

  function toggleReservationPanel() {
    if (showReservationPanel) {
      setShowReservationPanel(false);
      return;
    }

    openReservationPanel();
  }

  function toggleStaffPanel() {
    if (showStaffPanel) {
      setShowStaffPanel(false);
      resetStaffScheduleForm();
      return;
    }

    openStaffPanel();
  }

  function handleEditStaffSchedule(schedule: StaffSchedule) {
    setEditingStaffScheduleId(schedule.id);

    const matchedStaff =
      staffOptions.find((staff) => staff.id === schedule.staffId) ||
      staffOptions.find((staff) => staff.name === schedule.staffName);

    setStaffId(matchedStaff?.id || schedule.staffId || "");
    setStaffScheduleType(schedule.type);
    setStaffScheduleDate(schedule.date);
    setStaffScheduleEndDate(schedule.endDate || "");
    setStaffScheduleMemo(schedule.memo || "");
    setStaffFormError("");
    setSelectedDateKey(schedule.date);
    setShowStaffPanel(true);
  }

  function handleCancelEditStaffSchedule() {
    resetStaffScheduleForm();
  }

  async function handleAddReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = reservationName.trim();
    const nextPhone = formatKoreanMobilePhone(reservationPhone);
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

    if (!isValidKoreanMobilePhone(nextPhone)) {
      setReservationFormError("연락처는 010-1234-5678 형식으로 입력해주세요.");
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

      const res = await fetch("/api/admin/reservations", {
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
          reservationDate,
          experienceTime: reservationTime,
          people: Number(reservationPeople || 1),
          message: nextMemo,
          adminMemo: nextMemo,
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

      setSelectedDateKey(reservationDate);
      setReservationName("");
      setReservationPhone("");
      setReservationEmail("");
      setReservationProgram("");
      setReservationDate(toDateKey(new Date()));
      setReservationTime(DEFAULT_EXPERIENCE_TIME);
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

  async function handleSaveStaffSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedStaff = staffOptions.find((staff) => staff.id === staffId);
    const nextMemo = staffScheduleMemo.trim();

    if (!selectedStaff) {
      setStaffFormError("직원을 선택해주세요.");
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

      if (editingStaffScheduleId) {
        const res = await fetch("/api/staff-schedules", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            id: editingStaffScheduleId,
            staffId: selectedStaff.id,
            staffName: selectedStaff.name,
            type: staffScheduleType,
            date: staffScheduleDate,
            endDate: staffScheduleEndDate || undefined,
            memo: nextMemo,
          }),
        });

        const data = (await res.json()) as StaffScheduleUpdateResponse;

        if (!res.ok || !data.ok || !data.staffSchedule) {
          throw new Error(data.message || "직원 일정을 수정하지 못했습니다.");
        }

        await fetchStaffSchedules();

        setSelectedDateKey(data.staffSchedule.date);
        resetStaffScheduleForm(data.staffSchedule.date);

        return;
      }

      const res = await fetch("/api/staff-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          staffId: selectedStaff.id,
          staffName: selectedStaff.name,
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

      await fetchStaffSchedules();

      setSelectedDateKey(data.staffSchedule.date);
      resetStaffScheduleForm(data.staffSchedule.date);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : editingStaffScheduleId
            ? "직원 일정을 수정하지 못했습니다."
            : "직원 일정을 등록하지 못했습니다.";

      setStaffFormError(message);
    } finally {
      setSavingStaffSchedule(false);
    }
  }

  async function handleDeleteStaffSchedule(id: string) {
    if (deletingStaffScheduleId) {
      return;
    }

    const target = staffSchedules.find((schedule) => schedule.id === id);
    const targetName = target?.staffName ? ` (${target.staffName})` : "";

    if (!window.confirm(`직원 일정${targetName}을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setDeletingStaffScheduleId(id);
      setStaffFormError("");

      const res = await fetch("/api/staff-schedules", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "직원 일정을 삭제하지 못했습니다.");
      }

      setStaffSchedules((prev) =>
        prev.filter((schedule) => schedule.id !== id),
      );

      if (editingStaffScheduleId === id) {
        resetStaffScheduleForm();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "직원 일정을 삭제하지 못했습니다.";

      setStaffFormError(message);
    } finally {
      setDeletingStaffScheduleId("");
    }
  }

  const calendarMinWidth = isTabletDisplay
    ? "min-w-[980px] xl:min-w-0"
    : showStaffPanel || showReservationPanel
      ? "min-w-[760px] xl:min-w-0"
      : "min-w-[760px] lg:min-w-0";

  return (
    <div
      className={[
        "max-w-full space-y-4 overflow-hidden p-3 sm:space-y-6 sm:p-6 lg:p-8",
        isTabletDisplay
          ? "fixed inset-0 z-[100] overflow-y-auto bg-slate-100 lg:p-5"
          : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">관리자</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            예약 캘린더
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            고객 예약, 보트 운항 스케줄에 배정된 보트 출항별 그룹 다이빙,
            직원 휴가/근무불가 일정을 함께 확인합니다.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={goPrevMonth}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            이전달
          </button>

          <button
            type="button"
            onClick={goToday}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            오늘
          </button>

          <button
            type="button"
            onClick={goNextMonth}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            다음달
          </button>

          <button
            type="button"
            onClick={() => refreshCalendarData()}
            disabled={isRefreshing}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isRefreshing ? "새로고침 중" : "새로고침"}
          </button>

          {isTabletDisplay ? (
            <>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700 sm:w-auto"
              >
                {isFullscreen ? "전체화면 종료" : "전체화면"}
              </button>

              <Link
                href="/admin/calendar"
                className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                관리자 화면
              </Link>
            </>
          ) : (
            <Link
              href="/admin/calendar?display=tablet"
              className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700 sm:w-auto"
            >
              태블릿 전체화면
            </Link>
          )}

          {!isTabletDisplay ? (
            <>
              <button
                type="button"
                onClick={toggleReservationPanel}
                className={[
                  "w-full rounded-xl px-4 py-2 text-sm font-black transition sm:w-auto",
                  showReservationPanel
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    : "bg-blue-600 text-white hover:bg-blue-700",
                ].join(" ")}
              >
                {showReservationPanel ? "예약 등록 닫기" : "예약 직접 등록"}
              </button>

              <button
                type="button"
                onClick={toggleStaffPanel}
                className={[
                  "w-full rounded-xl px-4 py-2 text-sm font-black transition sm:w-auto",
                  showStaffPanel
                    ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                    : "bg-slate-900 text-white hover:bg-slate-700",
                ].join(" ")}
              >
                {showStaffPanel ? "직원 일정 닫기" : "직원 일정 등록"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {!isTabletDisplay ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="calendar-reservation-name-search"
                className="text-sm font-black text-slate-800"
              >
                고객 이름 검색
              </label>
              <p className="mt-1 text-xs font-medium text-slate-500">
                입력한 이름과 일치하는 예약만 캘린더에 표시됩니다.
              </p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto sm:min-w-[360px]">
              <input
                id="calendar-reservation-name-search"
                type="search"
                value={reservationNameKeyword}
                onChange={(event) =>
                  setReservationNameKeyword(event.target.value)
                }
                placeholder="고객 이름 입력"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              {reservationNameKeyword ? (
                <button
                  type="button"
                  onClick={() => setReservationNameKeyword("")}
                  className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  초기화
                </button>
              ) : null}
            </div>
          </div>

          {reservationNameKeyword.trim() ? (
            <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">
              “{reservationNameKeyword.trim()}” 검색 결과{" "}
              {filteredReservations.length}건
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          <span>태블릿 표시 모드 · 60초마다 자동 새로고침</span>
          <span>
            마지막 업데이트:{" "}
            {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString("ko-KR") : "-"}
          </span>
        </div>
      )}

      <section
        className={[
          "grid max-w-full grid-cols-1 gap-4 overflow-hidden sm:gap-6",
          !isTabletDisplay && (showStaffPanel || showReservationPanel)
            ? "lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]"
            : "",
        ].join(" ")}
      >
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
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

              <div className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800">
                그룹 다이빙
              </div>

              <div className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-800">
                직원 일정
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
                    onClick={() => openStaffPanel()}
                    className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-black text-white hover:bg-purple-800"
                  >
                    목록/등록 열기
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {currentMonthStaffSchedules.slice(0, 8).map((schedule) => (
                  <button
                    type="button"
                    key={schedule.id}
                    onClick={() => handleEditStaffSchedule(schedule)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition hover:scale-[1.02] hover:shadow-sm ${
                      STAFF_SCHEDULE_STYLE[schedule.type]
                    }`}
                    title="클릭하면 직원 일정을 수정합니다."
                  >
                    {schedule.date}
                    {schedule.endDate ? `~${schedule.endDate}` : ""} ·{" "}
                    {schedule.staffName} · {STAFF_SCHEDULE_LABEL[schedule.type]}
                  </button>
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

          {loading || groupDiveLoading || staffLoading ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              예약 캘린더를 불러오는 중입니다.
            </div>
          ) : (
            <>
              <div className="mt-5 sm:hidden">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="grid grid-cols-7 bg-slate-50">
                    {DAY_NAMES.map((dayName, index) => (
                      <div
                        key={dayName}
                        className={`py-2 text-center text-xs font-black ${
                          index === 0
                            ? "text-rose-500"
                            : index === 6
                              ? "text-blue-500"
                              : "text-slate-500"
                        }`}
                      >
                        {dayName}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-px bg-slate-200">
                    {calendarDays.map((day) => {
                      const dayReservations =
                        reservationsByDate.get(day.dateKey) || [];
                      const dayGroupDiveTrips =
                        groupDiveTripsByDate.get(day.dateKey) || [];
                      const dayStaffSchedules =
                        staffSchedulesByDate.get(day.dateKey) || [];
                      const selected = selectedDateKey === day.dateKey;
                      const hasReservation = dayReservations.length > 0;
                      const hasGroupDive = dayGroupDiveTrips.length > 0;
                      const hasStaffSchedule = dayStaffSchedules.length > 0;

                      return (
                        <button
                          type="button"
                          key={day.dateKey}
                          onClick={() => setSelectedDateKey(day.dateKey)}
                          className={[
                            "relative aspect-square bg-white p-1 text-left transition",
                            day.isCurrentMonth ? "" : "bg-slate-50",
                            selected
                              ? "z-10 ring-2 ring-inset ring-blue-600"
                              : "",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "flex h-full flex-col rounded-xl p-1.5",
                              selected ? "bg-blue-50" : "",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                                day.isToday
                                  ? "bg-blue-600 text-white"
                                  : day.isCurrentMonth
                                    ? "text-slate-800"
                                    : "text-slate-400",
                              ].join(" ")}
                            >
                              {day.date.getDate()}
                            </span>

                            <div className="mt-auto flex flex-wrap gap-0.5">
                              {hasReservation ? (
                                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-black text-blue-700">
                                  {dayReservations.length}
                                </span>
                              ) : null}

                              {hasGroupDive ? (
                                <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] font-black text-cyan-700">
                                  G{dayGroupDiveTrips.length}
                                </span>
                              ) : null}

                              {hasStaffSchedule ? (
                                <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-700">
                                  휴
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {getKoreanDateLabel(selectedDateKey)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        예약 {selectedReservations.length}건 · 그룹 다이빙{" "}
                        {selectedGroupDiveTrips.length}건 · 직원 일정{" "}
                        {selectedStaffSchedules.length}건
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openReservationPanel(selectedDateKey)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white"
                      >
                        예약
                      </button>
                      <button
                        type="button"
                        onClick={() => openStaffPanel(selectedDateKey)}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white"
                      >
                        직원
                      </button>
                    </div>
                  </div>

                  {selectedTimedItems.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-black text-slate-700">
                        시간순 일정
                      </p>

                      {selectedTimedItems.map((item) => {
                        if (item.kind === "GROUP_DIVE") {
                          const departure = item.departure;

                          return (
                            <div
                              key={`boat-${departure.boatScheduleId}`}
                              className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-3 text-xs font-semibold text-cyan-950"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-black">
                                    {departure.time || "시간 미정"} 출항
                                  </p>
                                  <p className="mt-1 truncate font-bold text-cyan-800">
                                    {departure.pointName}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-cyan-800">
                                  총 {departure.totalPeople}명
                                </span>
                              </div>

                              <div className="mt-3 space-y-1.5 border-t border-cyan-200 pt-3">
                                {departure.trips.map((trip) => {
                                  const boardedCount =
                                    trip.participants.filter(
                                      (participant) =>
                                        participant.boarded,
                                    ).length;

                                  return (
                                    <Link
                                      key={trip.id}
                                      href={`/admin/group-dives/${trip.groupDiveId}`}
                                      className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 transition hover:bg-white"
                                    >
                                      <span className="min-w-0 truncate font-black text-slate-900">
                                        {trip.groupName}
                                      </span>
                                      <span className="shrink-0 font-black text-cyan-800">
                                        {boardedCount}명
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        const group = item.group;
                        const statusCounts =
                          getReservationGroupStatusCounts(group);

                        return (
                          <div
                            key={`reservation-group-${group.key}`}
                            className={`rounded-xl border px-3 py-3 text-xs font-semibold ${getReservationGroupStyle(
                              group,
                            )}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-black">
                                  {group.time || "미정"} · {group.programLabel}
                                </p>
                                <p className="mt-1 font-bold opacity-80">
                                  예약 {group.reservations.length}건 · 총 {group.totalPeople}명
                                </p>
                              </div>

                              
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                              {(Object.keys(STATUS_LABEL) as ReservationStatus[])
                                .filter((status) => statusCounts[status] > 0)
                                .map((status) => (
                                  <span
                                    key={status}
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${STATUS_STYLE[status]}`}
                                  >
                                    {STATUS_LABEL[status]} {statusCounts[status]}
                                  </span>
                                ))}
                            </div>

                            <div className="mt-3 space-y-1.5 border-t border-current/10 pt-3">
                              {group.reservations.map((reservation) => {
                                const source = reservation.source || "CUSTOMER";

                                return (
                                  <Link
                                    key={reservation.id}
                                    href={`/admin/reservations/${reservation.id}`}
                                    className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 transition hover:bg-white"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-black">
                                        {reservation.name} · {reservation.people}명
                                      </p>
                                      <p className="mt-0.5 truncate text-[10px] font-bold opacity-70">
                                        {STATUS_LABEL[reservation.status]} · 담당 {getAssignedStaffNames(reservation).length > 0
                                          ? getAssignedStaffNames(reservation).join(" · ")
                                          : "미배정"}
                                      </p>
                                    </div>

                                    <span
                                      className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${SOURCE_STYLE[source]}`}
                                    >
                                      {SOURCE_LABEL[source]}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {selectedReservations.length === 0 &&
                  selectedGroupDiveTrips.length === 0 &&
                  selectedStaffSchedules.length === 0 ? (
                    <div className="mt-4 rounded-xl bg-white p-4 text-center text-sm font-semibold text-slate-500">
                      선택한 날짜에 등록된 예약, 보트 출항 또는 직원 일정이 없습니다.
                    </div>
                  ) : null}
                </div>
              </div>

              {isDayDetailOpen ? (
                <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white sm:block">
                  <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsDayDetailOpen(false)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
                        >
                          월간 보기
                        </button>
                        <p className="text-sm font-black text-blue-700">
                          일자 상세
                        </p>
                      </div>

                      <h3 className="mt-3 text-2xl font-black text-slate-950">
                        {getKoreanDateLabel(selectedDateKey)}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        예약 {selectedReservations.length}건 · 그룹 다이빙{" "}
                        {selectedGroupDiveTrips.length}건 · 직원 일정{" "}
                        {selectedStaffSchedules.length}건
                      </p>
                    </div>

                    {!isTabletDisplay ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openReservationPanel(selectedDateKey)}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
                        >
                          예약 등록
                        </button>
                        <button
                          type="button"
                          onClick={() => openStaffPanel(selectedDateKey)}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700"
                        >
                          직원 일정
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid min-h-[620px] grid-cols-[96px_minmax(0,1fr)] bg-white">
                    <div className="border-r border-slate-200 bg-slate-50">
                      {EXPERIENCE_TIME_OPTIONS.map((time) => (
                        <div
                          key={time}
                          className="flex h-16 items-start justify-end border-b border-slate-200 px-3 pt-2 text-xs font-bold text-slate-500"
                        >
                          {time}
                        </div>
                      ))}
                    </div>

                    <div className="relative min-w-0">
                      {EXPERIENCE_TIME_OPTIONS.map((time) => (
                        <div
                          key={`line-${time}`}
                          className="h-16 border-b border-slate-100"
                        />
                      ))}

                      <div className="absolute inset-0 space-y-3 overflow-y-auto p-4">
                        {selectedStaffSchedules.length > 0 ? (
                          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-700">
                              All Day
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedStaffSchedules.map((schedule) => (
                                <button
                                  type="button"
                                  key={schedule.id}
                                  onClick={() => handleEditStaffSchedule(schedule)}
                                  className={`rounded-xl border px-3 py-2 text-xs font-black transition hover:shadow-sm ${
                                    STAFF_SCHEDULE_STYLE[schedule.type]
                                  }`}
                                >
                                  {schedule.staffName} ·{" "}
                                  {STAFF_SCHEDULE_LABEL[schedule.type]}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {selectedTimedItems.map((item) => {
                          if (item.kind === "GROUP_DIVE") {
                            const departure = item.departure;

                            return (
                              <div
                                key={`detail-boat-${departure.boatScheduleId}`}
                                className="grid grid-cols-[132px_minmax(0,1fr)] gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-950 shadow-sm"
                              >
                                <div className="text-sm font-black text-cyan-800">
                                  {formatScheduleTimeRange(departure.time)}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-base font-black">
                                        보트 출항 · {departure.pointName}
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-cyan-800">
                                        총 승선 {departure.totalPeople}명
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    {departure.trips.map((trip) => {
                                      const boardedCount =
                                        trip.participants.filter(
                                          (participant) =>
                                            participant.boarded,
                                        ).length;

                                      return (
                                        <Link
                                          key={trip.id}
                                          href={`/admin/group-dives/${trip.groupDiveId}`}
                                          className="rounded-xl bg-white/85 px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-white"
                                        >
                                          <span className="block truncate">
                                            {trip.groupName}
                                          </span>
                                          <span className="mt-1 block text-xs font-black text-cyan-800">
                                            {boardedCount}명 승선
                                          </span>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const group = item.group;
                          const statusCounts =
                            getReservationGroupStatusCounts(group);

                          return (
                            <div
                              key={`detail-reservation-${group.key}`}
                              className={`grid grid-cols-[132px_minmax(0,1fr)] gap-4 rounded-2xl border p-4 shadow-sm ${getReservationGroupStyle(
                                group,
                              )}`}
                            >
                              <div className="text-sm font-black">
                                {formatScheduleTimeRange(group.time)}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-base font-black">
                                      {group.programLabel}
                                    </p>
                                    <p className="mt-1 text-sm font-bold opacity-80">
                                      예약 {group.reservations.length}건 · 총{" "}
                                      {group.totalPeople}명
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-1">
                                    {(Object.keys(
                                      STATUS_LABEL,
                                    ) as ReservationStatus[])
                                      .filter(
                                        (status) =>
                                          statusCounts[status] > 0,
                                      )
                                      .map((status) => (
                                        <span
                                          key={status}
                                          className={`rounded-full border px-2 py-1 text-[10px] font-black ${STATUS_STYLE[status]}`}
                                        >
                                          {STATUS_LABEL[status]}{" "}
                                          {statusCounts[status]}
                                        </span>
                                      ))}
                                  </div>
                                </div>

                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                  {group.reservations.map((reservation) => {
                                    const source =
                                      reservation.source || "CUSTOMER";

                                    return (
                                      <Link
                                        key={reservation.id}
                                        href={`/admin/reservations/${reservation.id}`}
                                        className="rounded-xl bg-white/75 px-3 py-2 text-sm transition hover:bg-white"
                                      >
                                        <span className="block truncate font-black">
                                          {reservation.name} ·{" "}
                                          {reservation.people}명
                                        </span>
                                        <span className="mt-1 block truncate text-xs font-bold opacity-75">
                                          {SOURCE_LABEL[source]} · 담당{" "}
                                          {getAssignedStaffNames(reservation)
                                            .length > 0
                                            ? getAssignedStaffNames(
                                                reservation,
                                              ).join(" · ")
                                            : "미배정"}
                                        </span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {selectedTimedItems.length === 0 &&
                        selectedStaffSchedules.length === 0 ? (
                          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-500">
                            선택한 날짜에 등록된 예약, 보트 출항 또는 직원 일정이 없습니다.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div
                className={[
                  "-mx-3 mt-5 max-w-none overflow-x-auto px-3 sm:mx-0 sm:max-w-full sm:px-0",
                  isDayDetailOpen ? "hidden" : "hidden sm:block",
                ].join(" ")}
              >
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
                      const dayGroupDiveTrips =
                        groupDiveTripsByDate.get(day.dateKey) || [];
                      const dayStaffSchedules =
                        staffSchedulesByDate.get(day.dateKey) || [];

                      const dayReservationGroups =
                        groupReservationsByTimeAndProgram(dayReservations);

                      const dayTimedItems = sortCalendarTimedItems([
                        ...dayReservationGroups.map((group) => ({
                          kind: "RESERVATION_GROUP" as const,
                          time: group.time,
                          group,
                        })),
                        ...dayGroupDiveTrips.map((departure) => ({
                          kind: "GROUP_DIVE" as const,
                          time: departure.time,
                          departure,
                        })),
                      ]);

                      return (
                        <div
                          key={day.dateKey}
                          className={[
                            "border-b border-r border-slate-200 p-2",
                            showStaffPanel || showReservationPanel
                              ? "min-h-40 sm:min-h-44"
                              : "min-h-40 sm:min-h-48",
                            day.isCurrentMonth ? "bg-white" : "bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDateKey(day.dateKey);
                                setIsDayDetailOpen(true);
                              }}
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                                day.isToday
                                  ? "bg-blue-600 text-white"
                                  : day.isCurrentMonth
                                    ? "text-slate-800"
                                    : "text-slate-400"
                              }`}
                              aria-label={`${day.dateKey} 상세 일정 보기`}
                            >
                              {day.date.getDate()}
                            </button>

                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                              {dayStaffSchedules.length > 0 ? (
                                <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black text-purple-700">
                                  휴가 {dayStaffSchedules.length}
                                </span>
                              ) : null}

                              {dayGroupDiveTrips.length > 0 ? (
                                <span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-black text-cyan-700">
                                  그룹 {dayGroupDiveTrips.length}
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
                            {dayTimedItems.map((item) => {
                              if (item.kind === "GROUP_DIVE") {
                                const departure = item.departure;

                                return (
                                  <div
                                    key={`boat-${departure.boatScheduleId}`}
                                    className="rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2 text-[11px] font-semibold leading-4 text-cyan-950"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="shrink-0 font-black">
                                        {departure.time || "미정"} 출항
                                      </span>
                                      <span className="shrink-0 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-black text-cyan-800">
                                        {departure.totalPeople}명
                                      </span>
                                    </div>

                                    <div className="mt-1 truncate font-bold text-cyan-800">
                                      {departure.pointName}
                                    </div>

                                    <div className="mt-2 space-y-1 border-t border-cyan-200 pt-2">
                                      {departure.trips.map((trip) => {
                                        const boardedCount =
                                          trip.participants.filter(
                                            (participant) =>
                                              participant.boarded,
                                          ).length;

                                        return (
                                          <Link
                                            key={trip.id}
                                            href={`/admin/group-dives/${trip.groupDiveId}`}
                                            className="flex items-center justify-between gap-2 rounded-lg bg-white/80 px-2 py-1.5 transition hover:bg-white"
                                          >
                                            <span className="min-w-0 truncate text-[10px] font-black text-slate-900">
                                              {trip.groupName}
                                            </span>
                                            <span className="shrink-0 text-[10px] font-black text-cyan-800">
                                              {boardedCount}명
                                            </span>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }

                              const group = item.group;
                              const statusCounts =
                                getReservationGroupStatusCounts(group);

                              return (
                                <div
                                  key={`reservation-group-${day.dateKey}-${group.key}`}
                                  className={`rounded-xl border px-2 py-2 text-[11px] font-semibold leading-4 ${getReservationGroupStyle(
                                    group,
                                  )}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate font-black">
                                        {group.time || "미정"} · {group.programLabel}
                                      </p>
                                      <p className="mt-0.5 truncate text-[10px] font-bold opacity-80">
                                        예약 {group.reservations.length}건 · 총 {group.totalPeople}명
                                      </p>
                                    </div>

                                  
                                  </div>

                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {(Object.keys(STATUS_LABEL) as ReservationStatus[])
                                      .filter((status) => statusCounts[status] > 0)
                                      .map((status) => (
                                        <span
                                          key={status}
                                          className={`rounded-full border px-1.5 py-0.5 text-[9px] font-black ${STATUS_STYLE[status]}`}
                                        >
                                          {STATUS_LABEL[status]} {statusCounts[status]}
                                        </span>
                                      ))}
                                  </div>

                                  <div className="mt-2 space-y-1 border-t border-current/10 pt-2">
                                    {group.reservations.map((reservation) => (
                                      <Link
                                        key={reservation.id}
                                        href={`/admin/reservations/${reservation.id}`}
                                        className="block rounded-lg bg-white/70 px-2 py-1.5 transition hover:bg-white"
                                      >
                                        <p className="truncate text-[10px] font-black">
                                          {reservation.name} · {reservation.people}명
                                        </p>
                                        <p className="mt-0.5 truncate text-[9px] font-bold opacity-70">
                                          담당 {getAssignedStaffNames(reservation).length > 0
                                            ? getAssignedStaffNames(reservation).join(" · ")
                                            : "미배정"}
                                        </p>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {!isTabletDisplay && (showReservationPanel || showStaffPanel) ? (
          <aside className="min-w-0 space-y-4 sm:space-y-6 lg:sticky lg:top-20 lg:self-start">
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

                <form
                  onSubmit={handleAddReservation}
                  className="mt-5 space-y-4"
                >
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
                        type="tel"
                        inputMode="numeric"
                        value={reservationPhone}
                        onChange={(event) =>
                          setReservationPhone(
                            formatKoreanMobilePhone(event.target.value),
                          )
                        }
                        onBlur={() =>
                          setReservationPhone((prev) =>
                            formatKoreanMobilePhone(prev),
                          )
                        }
                        placeholder="010-0000-0000"
                        maxLength={13}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        예: 010-1234-5678
                      </p>
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
                      onChange={(event) =>
                        setReservationDate(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      예약 시간
                    </label>
                    <select
                      value={reservationTime}
                      onChange={(event) =>
                        setReservationTime(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      {EXPERIENCE_TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
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
                      onChange={(event) =>
                        setReservationMemo(event.target.value)
                      }
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
                        {isEditingStaffSchedule
                          ? "직원 일정 수정"
                          : "직원 휴가 등록"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {isEditingStaffSchedule
                          ? "선택한 직원 일정을 수정합니다."
                          : "휴가/반차/근무불가 직원을 표시합니다."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowStaffPanel(false);
                        resetStaffScheduleForm();
                      }}
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
                    onSubmit={handleSaveStaffSchedule}
                    className="mt-5 space-y-4"
                  >
                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        직원
                      </label>
                      <select
                        value={staffId}
                        onChange={(event) => setStaffId(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">직원 선택</option>

                        {staffOptions.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} 
                          </option>
                        ))}
                      </select>

                      {staffOptions.length === 0 ? (
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          선택 가능한 활성 직원 계정이 없습니다.
                        </p>
                      ) : null}
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

                    <div className="space-y-2">
                      <button
                        type="submit"
                        disabled={savingStaffSchedule}
                        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingStaffSchedule
                          ? isEditingStaffSchedule
                            ? "수정 중..."
                            : "등록 중..."
                          : isEditingStaffSchedule
                            ? "수정 저장"
                            : "직원 일정 등록"}
                      </button>

                      {isEditingStaffSchedule ? (
                        <button
                          type="button"
                          onClick={handleCancelEditStaffSchedule}
                          disabled={savingStaffSchedule}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          수정 취소
                        </button>
                      ) : null}
                    </div>
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
                      currentMonthStaffSchedules.map((schedule) => {
                        const deleting =
                          deletingStaffScheduleId === schedule.id;
                        const editing = editingStaffScheduleId === schedule.id;

                        return (
                          <div
                            key={schedule.id}
                            className={[
                              "rounded-xl border bg-white p-4 shadow-sm",
                              editing
                                ? "border-purple-400 ring-4 ring-purple-100"
                                : "border-slate-200",
                            ].join(" ")}
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

                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditStaffSchedule(schedule)
                                }
                                disabled={savingStaffSchedule || deleting}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                수정
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteStaffSchedule(schedule.id)
                                }
                                disabled={deletingStaffScheduleId !== ""}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deleting ? "삭제중..." : "삭제"}
                              </button>
                            </div>
                          </div>
                        );
                      })
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
