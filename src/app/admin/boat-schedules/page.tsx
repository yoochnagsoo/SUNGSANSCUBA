"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Ship,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  DragEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_EXPERIENCE_TIME,
  EXPERIENCE_TIME_OPTIONS,
} from "@/lib/experienceTimes";

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
  boatName: string;
  plannedPointName: string;
  actualPointName: string;
  passengerCapacity: number;
  status: BoatScheduleStatus;
  memo: string;
  createdAt: string;
  updatedAt: string;
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
  preferredTime?: string;
  startTime: string;
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
  trips: GroupDiveTrip[];
};

type BoatScheduleListResponse = {
  ok: boolean;
  boatSchedules?: BoatSchedule[];
  message?: string;
};

type GroupDiveListResponse = {
  ok: boolean;
  groupDives?: GroupDive[];
  message?: string;
};

type BoatScheduleCreateResponse = {
  ok: boolean;
  boatSchedule?: BoatSchedule;
  message?: string;
};

type AssignmentResponse = {
  ok: boolean;
  message?: string;
};

type TripCard = {
  groupDiveId: string;
  groupName: string;
  representativeName: string;
  trip: GroupDiveTrip;
  boardedCount: number;
};

type ScheduleFormState = {
  departureTime: string;
  plannedPointName: string;
  memo: string;
};

const DEFAULT_PASSENGER_CAPACITY = 11;

const initialScheduleForm: ScheduleFormState = {
  departureTime: DEFAULT_EXPERIENCE_TIME,
  plannedPointName: "",
  memo: "",
};

const STATUS_LABEL: Record<BoatScheduleStatus, string> = {
  SCHEDULED: "예정",
  BOARDING: "승선 중",
  DEPARTED: "출항",
  COMPLETED: "완료",
  CANCELLED: "취소",
  WEATHER_CANCELLED: "기상 취소",
};

const STATUS_STYLE: Record<BoatScheduleStatus, string> = {
  SCHEDULED: "border-slate-200 bg-slate-50 text-slate-700",
  BOARDING: "border-amber-200 bg-amber-50 text-amber-800",
  DEPARTED: "border-blue-200 bg-blue-50 text-blue-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
  WEATHER_CANCELLED:
    "border-violet-200 bg-violet-50 text-violet-800",
};

const TEAM_COLOR_STYLES = [
  {
    card: "border-blue-200 bg-blue-50/70",
    badge: "bg-blue-200 text-blue-900",
    accent: "text-blue-700",
    detail: "bg-white/80",
    leftBorder: "border-l-blue-500",
    dot: "bg-blue-500",
  },
  {
    card: "border-emerald-200 bg-emerald-50/70",
    badge: "bg-emerald-200 text-emerald-900",
    accent: "text-emerald-700",
    detail: "bg-white/80",
    leftBorder: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  {
    card: "border-amber-200 bg-amber-50/70",
    badge: "bg-amber-200 text-amber-900",
    accent: "text-amber-700",
    detail: "bg-white/80",
    leftBorder: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  {
    card: "border-violet-200 bg-violet-50/70",
    badge: "bg-violet-200 text-violet-900",
    accent: "text-violet-700",
    detail: "bg-white/80",
    leftBorder: "border-l-violet-500",
    dot: "bg-violet-500",
  },
  {
    card: "border-rose-200 bg-rose-50/70",
    badge: "bg-rose-200 text-rose-900",
    accent: "text-rose-700",
    detail: "bg-white/80",
    leftBorder: "border-l-rose-500",
    dot: "bg-rose-500",
  },
  {
    card: "border-cyan-200 bg-cyan-50/70",
    badge: "bg-cyan-200 text-cyan-900",
    accent: "text-cyan-700",
    detail: "bg-white/80",
    leftBorder: "border-l-cyan-500",
    dot: "bg-cyan-500",
  },
  {
    card: "border-orange-200 bg-orange-50/70",
    badge: "bg-orange-200 text-orange-900",
    accent: "text-orange-700",
    detail: "bg-white/80",
    leftBorder: "border-l-orange-500",
    dot: "bg-orange-500",
  },
  {
    card: "border-fuchsia-200 bg-fuchsia-50/70",
    badge: "bg-fuchsia-200 text-fuchsia-900",
    accent: "text-fuchsia-700",
    detail: "bg-white/80",
    leftBorder: "border-l-fuchsia-500",
    dot: "bg-fuchsia-500",
  },
] as const;


function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDate(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);

  return toDateKey(date);
}

function getKoreanDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function getBoardedCount(trip: GroupDiveTrip) {
  return trip.participants.filter(
    (participant) => participant.boarded,
  ).length;
}

function normalizePointName(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function getTripPointName(trip: GroupDiveTrip) {
  return (
    trip.actualPointName ||
    trip.plannedPointName ||
    "포인트 미정"
  );
}

function sortSchedules(schedules: BoatSchedule[]) {
  return [...schedules].sort((a, b) =>
    a.departureTime.localeCompare(b.departureTime),
  );
}

function getPreferredTime(trip: GroupDiveTrip) {
  return trip.preferredTime || trip.startTime || "";
}

function getActualDepartureTime(trip: GroupDiveTrip) {
  return trip.actualDepartureTime || "";
}

function sortTripCards(cards: TripCard[]) {
  return [...cards].sort((a, b) => {
    const aPreferredTime = getPreferredTime(a.trip);
    const bPreferredTime = getPreferredTime(b.trip);

    if (aPreferredTime !== bPreferredTime) {
      return aPreferredTime.localeCompare(bPreferredTime);
    }

    if (a.boardedCount !== b.boardedCount) {
      return b.boardedCount - a.boardedCount;
    }

    return a.groupName.localeCompare(b.groupName);
  });
}

export default function AdminBoatSchedulesPage() {
  const [selectedDate, setSelectedDate] = useState(() =>
    toDateKey(new Date()),
  );

  const [mounted, setMounted] = useState(false);

  const boatScheduleSectionRef =
    useRef<HTMLElement | null>(null);

  const [unassignedPanelTop, setUnassignedPanelTop] =
    useState(80);

  const [boatSchedules, setBoatSchedules] = useState<
    BoatSchedule[]
  >([]);

  const [groupDives, setGroupDives] = useState<GroupDive[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [movingTripKey, setMovingTripKey] = useState("");
  const [deletingScheduleId, setDeletingScheduleId] =
    useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] =
    useState<ScheduleFormState>(initialScheduleForm);

  const [errorMessage, setErrorMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [draggingTripKey, setDraggingTripKey] = useState("");

  const loadData = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const [boatResponse, groupDiveResponse] =
          await Promise.all([
            fetch(
              `/api/admin/boat-schedules?date=${encodeURIComponent(
                selectedDate,
              )}`,
              {
                cache: "no-store",
              },
            ),
            fetch("/api/admin/group-dives", {
              cache: "no-store",
            }),
          ]);

        const boatData =
          (await boatResponse.json()) as BoatScheduleListResponse;

        const groupDiveData =
          (await groupDiveResponse.json()) as GroupDiveListResponse;

        if (!boatResponse.ok || !boatData.ok) {
          throw new Error(
            boatData.message ??
              "보트 운항 스케줄을 불러오지 못했습니다.",
          );
        }

        if (!groupDiveResponse.ok || !groupDiveData.ok) {
          throw new Error(
            groupDiveData.message ??
              "펀다이빙 회차를 불러오지 못했습니다.",
          );
        }

        setBoatSchedules(
          sortSchedules(boatData.boatSchedules ?? []),
        );

        setGroupDives(groupDiveData.groupDives ?? []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "보트 스케줄 정보를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function updateUnassignedPanelTop() {
      const section = boatScheduleSectionRef.current;

      if (!section) {
        return;
      }

      const sectionTop =
        section.getBoundingClientRect().top;

      setUnassignedPanelTop(
        Math.max(80, Math.round(sectionTop)),
      );
    }

    updateUnassignedPanelTop();

    window.addEventListener(
      "scroll",
      updateUnassignedPanelTop,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "resize",
      updateUnassignedPanelTop,
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateUnassignedPanelTop,
      );

      window.removeEventListener(
        "resize",
        updateUnassignedPanelTop,
      );
    };
  }, [loading, formOpen, selectedDate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const allTripCards = useMemo(() => {
    const cards: TripCard[] = [];

    for (const groupDive of groupDives) {
      if (groupDive.status === "CANCELLED") {
        continue;
      }

      for (const trip of groupDive.trips ?? []) {
        if (trip.date !== selectedDate) {
          continue;
        }

        if (
          trip.status === "CANCELLED" ||
          trip.status === "WEATHER_CANCELLED"
        ) {
          continue;
        }

        cards.push({
          groupDiveId: groupDive.id,
          groupName: groupDive.groupName,
          representativeName: groupDive.representativeName,
          trip,
          boardedCount: getBoardedCount(trip),
        });
      }
    }

    return sortTripCards(cards);
  }, [groupDives, selectedDate]);

  const groupColorIndexById = useMemo(() => {
    const map = new Map<string, number>();

    /*
     * 선택 날짜에 등장한 그룹을 순서대로 색상에 배정합니다.
     * 해시를 사용하지 않으므로 서로 다른 그룹이 같은 색으로
     * 충돌하는 문제를 방지합니다.
     */
    for (const card of allTripCards) {
      if (map.has(card.groupDiveId)) {
        continue;
      }

      map.set(card.groupDiveId, map.size);
    }

    return map;
  }, [allTripCards]);

  const unassignedTrips = useMemo(
    () =>
      allTripCards.filter(
        (card) => !card.trip.boatScheduleId,
      ),
    [allTripCards],
  );

  const tripsByScheduleId = useMemo(() => {
    const map = new Map<string, TripCard[]>();

    for (const card of allTripCards) {
      const scheduleId = card.trip.boatScheduleId;

      if (!scheduleId) {
        continue;
      }

      if (!map.has(scheduleId)) {
        map.set(scheduleId, []);
      }

      map.get(scheduleId)?.push(card);
    }

    for (const [scheduleId, cards] of map.entries()) {
      map.set(scheduleId, sortTripCards(cards));
    }

    return map;
  }, [allTripCards]);


  const recommendationByTripKey = useMemo(() => {
    const recommendations = new Map<string, string>();

    for (const card of unassignedTrips) {
      const normalizedTripPoint = normalizePointName(
        getTripPointName(card.trip),
      );

      const candidates = boatSchedules
        .filter(
          (schedule) =>
            schedule.status !== "CANCELLED" &&
            schedule.status !== "WEATHER_CANCELLED" &&
            schedule.status !== "COMPLETED",
        )
        .map((schedule) => {
          const assigned =
            tripsByScheduleId.get(schedule.id) ?? [];

          const assignedPeople = assigned.reduce(
            (total, assignedCard) =>
              total + assignedCard.boardedCount,
            0,
          );

          const remainingSeats =
            schedule.passengerCapacity - assignedPeople;

          const normalizedSchedulePoint =
            normalizePointName(
              schedule.actualPointName ||
                schedule.plannedPointName,
            );

          const samePoint =
            Boolean(normalizedTripPoint) &&
            Boolean(normalizedSchedulePoint) &&
            normalizedTripPoint === normalizedSchedulePoint;

          return {
            schedule,
            remainingSeats,
            samePoint,
            fit:
              remainingSeats >= card.boardedCount
                ? remainingSeats - card.boardedCount
                : Number.MAX_SAFE_INTEGER,
          };
        })
        .filter(
          (candidate) =>
            candidate.remainingSeats >= card.boardedCount,
        )
        .sort((a, b) => {
          if (a.samePoint !== b.samePoint) {
            return a.samePoint ? -1 : 1;
          }

          if (a.fit !== b.fit) {
            return a.fit - b.fit;
          }

          return a.schedule.departureTime.localeCompare(
            b.schedule.departureTime,
          );
        });

      if (candidates[0]) {
        recommendations.set(
          `${card.groupDiveId}:${card.trip.id}`,
          candidates[0].schedule.id,
        );
      }
    }

    return recommendations;
  }, [boatSchedules, tripsByScheduleId, unassignedTrips]);

  function updateForm<Key extends keyof ScheduleFormState>(
    key: Key,
    value: ScheduleFormState[Key],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function openForm() {
    setForm(initialScheduleForm);
    setFormMessage("");
    setFormOpen(true);
  }

  function closeForm() {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setFormMessage("");
  }

  async function handleCreateSchedule(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormMessage("");

    if (!form.departureTime) {
      setFormMessage("출항 시간을 입력해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/admin/boat-schedules",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: selectedDate,
            departureTime: form.departureTime,
            boatName: "SUNG SAN SCUBA",
            plannedPointName:
              form.plannedPointName.trim(),
            passengerCapacity:
              DEFAULT_PASSENGER_CAPACITY,
            status: "SCHEDULED",
            memo: form.memo.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as BoatScheduleCreateResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.boatSchedule
      ) {
        throw new Error(
          data.message ??
            "보트 운항 스케줄을 등록하지 못했습니다.",
        );
      }

      setBoatSchedules((previous) =>
        sortSchedules([
          ...previous,
          data.boatSchedule as BoatSchedule,
        ]),
      );

      closeForm();
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : "보트 운항 스케줄을 등록하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function assignTrip(
    card: TripCard,
    scheduleId: string,
  ) {
    const tripKey = `${card.groupDiveId}:${card.trip.id}`;

    if (movingTripKey) {
      return;
    }

    setMovingTripKey(tripKey);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/boat-schedules/${scheduleId}/assignment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "ASSIGN",
            groupDiveId: card.groupDiveId,
            tripId: card.trip.id,
          }),
        },
      );

      const data =
        (await response.json()) as AssignmentResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "다이빙 회차를 배정하지 못했습니다.",
        );
      }

      await loadData(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "다이빙 회차를 배정하지 못했습니다.",
      );
    } finally {
      setMovingTripKey("");
      setDraggingTripKey("");
    }
  }

  async function unassignTrip(card: TripCard) {
    const scheduleId = card.trip.boatScheduleId;

    if (!scheduleId || movingTripKey) {
      return;
    }

    const tripKey = `${card.groupDiveId}:${card.trip.id}`;

    setMovingTripKey(tripKey);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/boat-schedules/${scheduleId}/assignment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "UNASSIGN",
            groupDiveId: card.groupDiveId,
            tripId: card.trip.id,
          }),
        },
      );

      const data =
        (await response.json()) as AssignmentResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "다이빙 회차 배정을 해제하지 못했습니다.",
        );
      }

      await loadData(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "다이빙 회차 배정을 해제하지 못했습니다.",
      );
    } finally {
      setMovingTripKey("");
    }
  }

  async function handleDeleteSchedule(
    schedule: BoatSchedule,
  ) {
    if (deletingScheduleId) {
      return;
    }

    const assigned =
      tripsByScheduleId.get(schedule.id) ?? [];

    if (assigned.length > 0) {
      setErrorMessage(
        "배정된 회차가 있습니다. 먼저 모든 회차의 배정을 해제해주세요.",
      );
      return;
    }

    if (
      !window.confirm(
        `${schedule.departureTime} 보트 운항을 삭제할까요?`,
      )
    ) {
      return;
    }

    setDeletingScheduleId(schedule.id);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/boat-schedules/${schedule.id}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "보트 운항 스케줄을 삭제하지 못했습니다.",
        );
      }

      setBoatSchedules((previous) =>
        previous.filter(
          (item) => item.id !== schedule.id,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "보트 운항 스케줄을 삭제하지 못했습니다.",
      );
    } finally {
      setDeletingScheduleId("");
    }
  }

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    card: TripCard,
  ) {
    const payload = JSON.stringify({
      groupDiveId: card.groupDiveId,
      tripId: card.trip.id,
    });

    event.dataTransfer.setData(
      "application/x-sungsan-trip",
      payload,
    );

    event.dataTransfer.effectAllowed = "move";

    setDraggingTripKey(
      `${card.groupDiveId}:${card.trip.id}`,
    );
  }

  function handleDragEnd() {
    setDraggingTripKey("");
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    scheduleId: string,
  ) {
    event.preventDefault();

    const raw = event.dataTransfer.getData(
      "application/x-sungsan-trip",
    );

    if (!raw) {
      return;
    }

    try {
      const payload = JSON.parse(raw) as {
        groupDiveId: string;
        tripId: string;
      };

      const card = allTripCards.find(
        (item) =>
          item.groupDiveId === payload.groupDiveId &&
          item.trip.id === payload.tripId,
      );

      if (!card) {
        return;
      }

      void assignTrip(card, scheduleId);
    } catch {
      setErrorMessage(
        "드래그한 다이빙 회차 정보를 읽지 못했습니다.",
      );
    }
  }

  function renderTripCard(
    card: TripCard,
    options?: {
      assigned?: boolean;
      compact?: boolean;
    },
  ) {
    const tripKey = `${card.groupDiveId}:${card.trip.id}`;
    const moving = movingTripKey === tripKey;
    const dragging = draggingTripKey === tripKey;
    const recommendedScheduleId =
      recommendationByTripKey.get(tripKey);

    const groupColorIndex =
      groupColorIndexById.get(card.groupDiveId) ?? 0;

    const teamColorStyle =
      TEAM_COLOR_STYLES[
        groupColorIndex % TEAM_COLOR_STYLES.length
      ];

    return (
      <div
        key={tripKey}
        draggable={!moving}
        onDragStart={(event) =>
          handleDragStart(event, card)
        }
        onDragEnd={handleDragEnd}
        className={[
          "rounded-2xl border-2 border-l-[8px] p-4 shadow-sm transition",
          teamColorStyle.card,
          teamColorStyle.leftBorder,
          moving
            ? "cursor-wait opacity-60"
            : "cursor-grab hover:shadow-md active:cursor-grabbing",
          dragging ? "scale-[0.98] opacity-60" : "",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={[
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    teamColorStyle.dot,
                  ].join(" ")}
                />

                <p
                  className={[
                    "truncate font-black",
                    teamColorStyle.accent,
                  ].join(" ")}
                >
                  {card.groupName}
                </p>
              </div>

            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              대표 {card.representativeName}
            </p>

          </div>

          <span
            className={[
              "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-black",
              teamColorStyle.badge,
            ].join(" ")}
          >
            <Users className="h-3.5 w-3.5" />
            {card.boardedCount}명
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
            <p className="text-[11px] font-black text-sky-700">
              희망 시간
            </p>
            <p className="mt-1 text-lg font-black text-sky-950">
              {getPreferredTime(card.trip) || "미정"}
            </p>
          </div>

          <div
            className={[
              "rounded-xl border px-3 py-2",
              options?.assigned &&
              getActualDepartureTime(card.trip)
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-300 bg-slate-100",
            ].join(" ")}
          >
            <p
              className={[
                "text-[11px] font-black",
                options?.assigned &&
                getActualDepartureTime(card.trip)
                  ? "text-emerald-700"
                  : "text-slate-600",
              ].join(" ")}
            >
              실제 출항 시간
            </p>
            <p
              className={[
                "mt-1 text-lg font-black",
                options?.assigned &&
                getActualDepartureTime(card.trip)
                  ? "text-emerald-950"
                  : "text-slate-700",
              ].join(" ")}
            >
              {options?.assigned
                ? getActualDepartureTime(card.trip) ||
                  "미기록"
                : "미배정"}
            </p>
          </div>
        </div>

        <div
          className={[
            "mt-2 rounded-xl px-3 py-2 text-xs",
            teamColorStyle.detail,
          ].join(" ")}
        >
          <p className="font-semibold text-slate-500">
            요청 포인트
          </p>
          <p className="mt-1 truncate font-black text-slate-900">
            {getTripPointName(card.trip)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/admin/group-dives/${card.groupDiveId}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            팀 상세
          </Link>

          {options?.assigned ? (
            <button
              type="button"
              onClick={() => void unassignTrip(card)}
              disabled={moving}
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {moving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="mr-1 h-3.5 w-3.5" />
              )}
              배정 해제
            </button>
          ) : recommendedScheduleId ? (
            <button
              type="button"
              onClick={() =>
                void assignTrip(
                  card,
                  recommendedScheduleId,
                )
              }
              disabled={moving}
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {moving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-3.5 w-3.5" />
              )}
              추천 배정
            </button>
          ) : null}
        </div>

        {!options?.assigned &&
        boatSchedules.length > 0 ? (
          <div className="mt-3 border-t border-slate-100 pt-3 xl:hidden">
            <label className="text-xs font-black text-slate-600">
              모바일 배정
            </label>
            <select
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) {
                  return;
                }

                void assignTrip(
                  card,
                  event.target.value,
                );

                event.target.value = "";
              }}
              disabled={moving}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">출항 시간 선택</option>
              {boatSchedules.map((schedule) => {
                const assigned =
                  tripsByScheduleId.get(schedule.id) ?? [];

                const assignedPeople = assigned.reduce(
                  (total, assignedCard) =>
                    total + assignedCard.boardedCount,
                  0,
                );

                const remaining =
                  schedule.passengerCapacity -
                  assignedPeople;

                return (
                  <option
                    key={schedule.id}
                    value={schedule.id}
                    disabled={remaining < card.boardedCount}
                  >
                    {schedule.departureTime} · 잔여{" "}
                    {remaining}석
                    {schedule.plannedPointName
                      ? ` · ${schedule.plannedPointName}`
                      : ""}
                  </option>
                );
              })}
            </select>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            관리자
          </p>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-black text-slate-900">
            <Ship className="h-7 w-7 text-blue-600" />
            보트 운항 스케줄
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            여러 펀다이빙 팀의 회차를 한 번의 출항으로
            묶어서 배정합니다. 고객 승선 정원은 최대
            11명입니다.
          </p>
        </div>

        <div className="flex w-full flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setSelectedDate((previous) =>
                shiftDate(previous, -1),
              )
            }
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            이전날
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedDate(toDateKey(new Date()))
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            오늘
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedDate((previous) =>
                shiftDate(previous, 1),
              )
            }
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            다음날
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "mr-2 h-4 w-4",
                refreshing ? "animate-spin" : "",
              ].join(" ")}
            />
            새로고침
          </button>

          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            출항 추가
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label
              htmlFor="boat-schedule-date"
              className="text-sm font-black text-slate-800"
            >
              운항 날짜
            </label>
            <input
              id="boat-schedule-date"
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:max-w-xs"
            />
          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-600">
              선택 날짜
            </p>
            <p className="mt-1 font-black text-blue-950">
              {getKoreanDateLabel(selectedDate)}
            </p>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {formOpen ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                보트 출항 추가
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {getKoreanDateLabel(selectedDate)}의 실제
                출항 시간을 등록합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg bg-white p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formMessage ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
              {formMessage}
            </div>
          ) : null}

          <form
            onSubmit={handleCreateSchedule}
            className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <div>
              <label className="text-sm font-black text-slate-700">
                실제 출항시간
              </label>
              <select
                value={form.departureTime}
                onChange={(event) =>
                  updateForm(
                    "departureTime",
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {EXPERIENCE_TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">
                예정 포인트
              </label>
              <input
                value={form.plannedPointName}
                onChange={(event) =>
                  updateForm(
                    "plannedPointName",
                    event.target.value,
                  )
                }
                placeholder="예: 우도 동굴"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">
                메모
              </label>
              <input
                value={form.memo}
                onChange={(event) =>
                  updateForm("memo", event.target.value)
                }
                placeholder="예: 조류 확인 후 포인트 변경 가능"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-auto inline-flex h-[46px] items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              등록
            </button>
          </form>
        </section>
      ) : null}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <span className="ml-3 text-sm font-bold text-slate-500">
            보트 스케줄을 불러오는 중입니다.
          </span>
        </div>
      ) : (
        <div className="min-w-0">
          <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_404px]">
            <section className="min-w-0 xl:hidden">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-900">
                    미배정 회차
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    아이패드와 모바일에서는 출항 시간을 선택해 배정합니다.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
                  {unassignedTrips.length}건
                </span>
              </div>

              <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
                {unassignedTrips.length > 0 ? (
                  unassignedTrips.map((card) =>
                    renderTripCard(card),
                  )
                ) : (
                  <div className="rounded-xl bg-white p-8 text-center">
                    <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-black text-slate-700">
                      미배정 회차가 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section
              ref={boatScheduleSectionRef}
              className="min-w-0"
            >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  보트 출항 슬롯
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  <span className="xl:hidden">
                    위 미배정 회차에서 출항 시간을 선택해 배정하세요.
                  </span>
                  <span className="hidden xl:inline">
                    오른쪽의 미배정 회차를 왼쪽 출항 슬롯으로 드래그하세요.
                  </span>
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                최대 11명
              </span>
            </div>

            <div className="space-y-4 xl:pr-2">
              {boatSchedules.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                {boatSchedules.map((schedule) => {
                  const assignedTrips =
                    tripsByScheduleId.get(schedule.id) ?? [];

                  const assignedPeople =
                    assignedTrips.reduce(
                      (total, card) =>
                        total + card.boardedCount,
                      0,
                    );

                  const remainingSeats = Math.max(
                    schedule.passengerCapacity -
                      assignedPeople,
                    0,
                  );

                  const occupancyPercent =
                    schedule.passengerCapacity > 0
                      ? Math.min(
                          (assignedPeople /
                            schedule.passengerCapacity) *
                            100,
                          100,
                        )
                      : 0;

                  return (
                    <div
                      key={schedule.id}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect =
                          "move";
                      }}
                      onDrop={(event) =>
                        handleDrop(event, schedule.id)
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xl font-black text-slate-900">
                              {schedule.departureTime}
                            </p>

                            <span
                              className={`rounded-full border px-2 py-1 text-[10px] font-black ${
                                STATUS_STYLE[
                                  schedule.status
                                ]
                              }`}
                            >
                              {STATUS_LABEL[
                                schedule.status
                              ]}
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-bold text-slate-600">
                            {schedule.actualPointName ||
                              schedule.plannedPointName ||
                              "포인트 미정"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteSchedule(
                              schedule,
                            )
                          }
                          disabled={
                            deletingScheduleId ===
                            schedule.id
                          }
                          className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="운항 삭제"
                        >
                          {deletingScheduleId ===
                          schedule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-black text-slate-700">
                            승선 {assignedPeople} /{" "}
                            {schedule.passengerCapacity}명
                          </span>
                          <span
                            className={[
                              "font-black",
                              remainingSeats === 0
                                ? "text-rose-600"
                                : remainingSeats <= 2
                                  ? "text-amber-600"
                                  : "text-emerald-600",
                            ].join(" ")}
                          >
                            잔여 {remainingSeats}석
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={[
                              "h-full rounded-full transition-all",
                              occupancyPercent >= 100
                                ? "bg-rose-500"
                                : occupancyPercent >= 80
                                  ? "bg-amber-500"
                                  : "bg-blue-500",
                            ].join(" ")}
                            style={{
                              width: `${occupancyPercent}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 min-h-28 space-y-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-3">
                        {assignedTrips.length > 0 ? (
                          assignedTrips.map((card) =>
                            renderTripCard(card, {
                              assigned: true,
                              compact: true,
                            }),
                          )
                        ) : (
                          <div className="flex min-h-24 flex-col items-center justify-center text-center">
                            <Ship className="h-7 w-7 text-blue-300" />
                            <p className="mt-2 text-xs font-black text-blue-700">
                              이곳에 회차 카드를
                              드래그하세요.
                            </p>
                          </div>
                        )}
                      </div>

                      {schedule.memo ? (
                        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                          {schedule.memo}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <Ship className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-black text-slate-700">
                    등록된 출항 슬롯이 없습니다.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    출항 추가 버튼으로 실제 운항 시간을
                    먼저 등록해주세요.
                  </p>
                  <button
                    type="button"
                    onClick={openForm}
                    className="mt-5 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    첫 출항 추가
                  </button>
                </div>
              )}
            </div>
          </section>

            <section
              className="hidden min-w-0 xl:block"
              aria-hidden="true"
            />

          </div>
        </div>
      )}
      {mounted
        ? createPortal(
            <aside
              className="fixed z-[9999] hidden w-[380px] xl:block"
              style={{
                top: `${unassignedPanelTop}px`,
                right: "24px",
                bottom: "24px",
              }}
              aria-label="미배정 회차"
            >
              <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                <div className="mb-3 flex shrink-0 items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      미배정 회차
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      회차 카드를 왼쪽 출항 슬롯으로 배정합니다.
                    </p>
                  </div>

                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
                    {unassignedTrips.length}건
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 pr-2">
                  {unassignedTrips.length > 0 ? (
                    unassignedTrips.map((card) =>
                      renderTripCard(card),
                    )
                  ) : (
                    <div className="rounded-xl bg-white p-8 text-center">
                      <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-sm font-black text-slate-700">
                        미배정 회차가 없습니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </aside>,
            document.body,
          )
        : null}

    </div>
  );
}