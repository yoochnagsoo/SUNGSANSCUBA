import { createHash } from "crypto";

import { getBoatScheduleRepository } from "@/lib/boatSchedules/boatScheduleRepository";
import type { BoatSchedule } from "@/lib/boatSchedules/types";
import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDive,
  GroupDiveTrip,
} from "@/lib/groupDives/types";
import { getProgramLabel } from "@/lib/programs";
import { getReservationRepository } from "@/lib/reservations/reservationRepository";
import type { Reservation } from "@/lib/reservations/types";
import { staffScheduleRepository } from "@/lib/staffSchedules/staffScheduleRepository";
import type { StaffSchedule } from "@/lib/staffSchedules/types";

import type {
  GoogleCalendarEventPayload,
  GoogleCalendarSyncItem,
} from "./types";

const TIME_ZONE = "Asia/Seoul";

function addOneHour(time?: string) {
  if (!time) {
    return "";
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
    return "";
  }

  return `${String((hour + 1) % 24).padStart(2, "0")}:${String(
    minute,
  ).padStart(2, "0")}`;
}

function addDays(dateText: string, days: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function createTimedEventDate(date: string, time: string) {
  return `${date}T${time}:00+09:00`;
}

function createChecksum(event: GoogleCalendarEventPayload) {
  return createHash("sha256")
    .update(JSON.stringify(event))
    .digest("hex");
}

function createTimedEvent(
  sourceType: GoogleCalendarSyncItem["sourceType"],
  sourceId: string,
  summary: string,
  date: string,
  time: string,
  details: string[],
  location?: string,
): GoogleCalendarSyncItem | null {
  const endTime = addOneHour(time);

  if (!date || !time || !endTime) {
    return null;
  }

  const event: GoogleCalendarEventPayload = {
    summary,
    description: details.filter(Boolean).join("\n"),
    location,
    start: {
      dateTime: createTimedEventDate(date, time),
      timeZone: TIME_ZONE,
    },
    end: {
      dateTime: createTimedEventDate(date, endTime),
      timeZone: TIME_ZONE,
    },
    extendedProperties: {
      private: {
        sourceType,
        sourceId,
      },
    },
  };

  return {
    sourceType,
    sourceId,
    checksum: createChecksum(event),
    event,
  };
}

function createAllDayEvent(
  sourceType: GoogleCalendarSyncItem["sourceType"],
  sourceId: string,
  summary: string,
  date: string,
  endDate: string | undefined,
  details: string[],
): GoogleCalendarSyncItem | null {
  if (!date) {
    return null;
  }

  const event: GoogleCalendarEventPayload = {
    summary,
    description: details.filter(Boolean).join("\n"),
    start: {
      date,
    },
    end: {
      date: addDays(endDate || date, 1),
    },
    extendedProperties: {
      private: {
        sourceType,
        sourceId,
      },
    },
  };

  return {
    sourceType,
    sourceId,
    checksum: createChecksum(event),
    event,
  };
}

function buildReservationItem(reservation: Reservation) {
  if (reservation.status === "CANCELLED") {
    return null;
  }

  const programLabel = getProgramLabel(reservation.program);

  return createTimedEvent(
    "RESERVATION",
    reservation.id,
    `${reservation.name} · ${programLabel} · ${reservation.people}명`,
    reservation.reservationDate || reservation.date || "",
    reservation.experienceTime || "",
    [
      `예약자: ${reservation.name}`,
      `연락처: ${reservation.phone}`,
      reservation.email ? `이메일: ${reservation.email}` : "",
      `프로그램: ${programLabel}`,
      `인원: ${reservation.people}명`,
      `상태: ${reservation.status}`,
      reservation.primaryStaffName
        ? `담당: ${reservation.primaryStaffName}`
        : "",
      reservation.adminMemo ? `메모: ${reservation.adminMemo}` : "",
    ],
  );
}

function buildBoatScheduleItem(
  schedule: BoatSchedule,
  trips: GroupDiveTrip[],
  groupDiveById: Map<string, GroupDive>,
) {
  if (
    schedule.status === "CANCELLED" ||
    schedule.status === "WEATHER_CANCELLED"
  ) {
    return null;
  }

  const totalPeople = trips.reduce(
    (sum, trip) =>
      sum +
      trip.participants.filter((participant) => participant.boarded).length,
    0,
  );
  const pointName =
    schedule.actualPointName || schedule.plannedPointName || "포인트 미정";
  const tripDetails = trips.map((trip) => {
    const groupDive = groupDiveById.get(trip.groupDiveId);
    const boardedCount = trip.participants.filter(
      (participant) => participant.boarded,
    ).length;

    return `- ${groupDive?.groupName || "그룹"}: ${boardedCount}명`;
  });

  return createTimedEvent(
    "BOAT_SCHEDULE",
    schedule.id,
    `보트 출항 · ${pointName} · ${totalPeople}명`,
    schedule.date,
    schedule.departureTime,
    [
      `포인트: ${pointName}`,
      `보트: ${schedule.boatName}`,
      `승선: ${totalPeople}명`,
      `상태: ${schedule.status}`,
      ...tripDetails,
      schedule.memo ? `메모: ${schedule.memo}` : "",
    ],
    pointName,
  );
}

function buildStaffScheduleItem(schedule: StaffSchedule) {
  const typeLabel: Record<StaffSchedule["type"], string> = {
    VACATION: "휴가",
    HALF_DAY_AM: "오전 반차",
    HALF_DAY_PM: "오후 반차",
    SICK_LEAVE: "병가",
    UNAVAILABLE: "근무 불가",
    TRAINING: "교육",
    BUSINESS_TRIP: "출장",
  };

  return createAllDayEvent(
    "STAFF_SCHEDULE",
    schedule.id,
    `${schedule.staffName} · ${typeLabel[schedule.type]}`,
    schedule.date,
    schedule.endDate,
    [
      `직원: ${schedule.staffName}`,
      `일정: ${typeLabel[schedule.type]}`,
      schedule.memo ? `메모: ${schedule.memo}` : "",
    ],
  );
}

export async function buildGoogleCalendarSyncItems() {
  const [reservations, boatSchedules, groupDives, staffSchedules] =
    await Promise.all([
      getReservationRepository().findAll(),
      getBoatScheduleRepository().findAll(),
      getGroupDiveRepository().findAll(),
      staffScheduleRepository.list(),
    ]);

  const groupDiveById = new Map(
    groupDives.map((groupDive) => [groupDive.id, groupDive]),
  );
  const tripsByBoatScheduleId = new Map<string, GroupDiveTrip[]>();

  for (const groupDive of groupDives) {
    if (groupDive.status === "CANCELLED") {
      continue;
    }

    for (const trip of groupDive.trips) {
      if (
        !trip.boatScheduleId ||
        trip.status === "CANCELLED" ||
        trip.status === "WEATHER_CANCELLED"
      ) {
        continue;
      }

      const trips = tripsByBoatScheduleId.get(trip.boatScheduleId) ?? [];
      trips.push(trip);
      tripsByBoatScheduleId.set(trip.boatScheduleId, trips);
    }
  }

  return [
    ...reservations.map(buildReservationItem),
    ...boatSchedules.map((schedule) =>
      buildBoatScheduleItem(
        schedule,
        tripsByBoatScheduleId.get(schedule.id) ?? [],
        groupDiveById,
      ),
    ),
    ...staffSchedules.map(buildStaffScheduleItem),
  ].filter((item): item is GoogleCalendarSyncItem => Boolean(item));
}
