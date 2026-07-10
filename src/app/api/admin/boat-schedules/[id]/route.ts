import { NextRequest, NextResponse } from "next/server";

import { getBoatScheduleRepository } from "@/lib/boatSchedules/boatScheduleRepository";
import type {
  BoatScheduleStatus,
  BoatScheduleUpdateInput,
} from "@/lib/boatSchedules/types";
import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_STATUSES: BoatScheduleStatus[] = [
  "SCHEDULED",
  "BOARDING",
  "DEPARTED",
  "COMPLETED",
  "CANCELLED",
  "WEATHER_CANCELLED",
];

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return !Number.isNaN(
    new Date(`${value}T00:00:00`).getTime(),
  );
}

function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

function normalizePassengerCapacity(value: unknown) {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.floor(parsed);
}

function isStatus(
  value: unknown,
): value is BoatScheduleStatus {
  return VALID_STATUSES.includes(
    value as BoatScheduleStatus,
  );
}

async function getAssignedTrips(scheduleId: string) {
  const groupDiveRepository = getGroupDiveRepository();
  const groupDives = await groupDiveRepository.findAll();

  return groupDives.flatMap((groupDive) =>
    groupDive.trips
      .filter((trip) => trip.boatScheduleId === scheduleId)
      .map((trip) => ({
        groupDive,
        trip,
      })),
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const repository = getBoatScheduleRepository();
    const boatSchedule = await repository.findById(id);

    if (!boatSchedule) {
      return NextResponse.json(
        {
          ok: false,
          message: "보트 운항 스케줄을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const assignedTrips = await getAssignedTrips(id);

    const assignedPeople = assignedTrips.reduce(
      (total, item) =>
        total +
        item.trip.participants.filter(
          (participant) => participant.boarded,
        ).length,
      0,
    );

    return NextResponse.json({
      ok: true,
      boatSchedule,
      assignedPeople,
      remainingSeats: Math.max(
        boatSchedule.passengerCapacity - assignedPeople,
        0,
      ),
      assignedTrips: assignedTrips.map(({ groupDive, trip }) => ({
        groupDiveId: groupDive.id,
        groupName: groupDive.groupName,
        trip,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch boat schedule:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "보트 운항 스케줄을 불러오는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const repository = getBoatScheduleRepository();
    const current = await repository.findById(id);

    if (!current) {
      return NextResponse.json(
        {
          ok: false,
          message: "보트 운항 스케줄을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const input: BoatScheduleUpdateInput = {};

    if (typeof body.date !== "undefined") {
      const date = normalizeText(body.date);

      if (!isValidDate(date)) {
        return NextResponse.json(
          {
            ok: false,
            message: "운항 날짜를 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.date = date;
    }

    if (typeof body.departureTime !== "undefined") {
      const departureTime = normalizeText(
        body.departureTime,
      );

      if (!isValidTime(departureTime)) {
        return NextResponse.json(
          {
            ok: false,
            message: "출항 시간을 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.departureTime = departureTime;
    }

    if (typeof body.boatName !== "undefined") {
      input.boatName =
        normalizeText(body.boatName) || "SUNG SAN SCUBA";
    }

    if (
      typeof body.plannedPointName !== "undefined"
    ) {
      input.plannedPointName = normalizeText(
        body.plannedPointName,
      );
    }

    if (
      typeof body.actualPointName !== "undefined"
    ) {
      input.actualPointName = normalizeText(
        body.actualPointName,
      );
    }

    if (
      typeof body.passengerCapacity !== "undefined"
    ) {
      const passengerCapacity =
        normalizePassengerCapacity(
          body.passengerCapacity,
        );

      if (
        !passengerCapacity ||
        passengerCapacity < 1 ||
        passengerCapacity > 11
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "고객 승선 정원은 1명 이상 11명 이하로 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.passengerCapacity = passengerCapacity;
    }

    if (typeof body.status !== "undefined") {
      if (!isStatus(body.status)) {
        return NextResponse.json(
          {
            ok: false,
            message: "운항 상태를 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.status = body.status;
    }

    if (typeof body.memo !== "undefined") {
      input.memo = normalizeText(body.memo);
    }

    const assignedTrips = await getAssignedTrips(id);
    const nextDate = input.date ?? current.date;

    if (
      assignedTrips.length > 0 &&
      nextDate !== current.date
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "배정된 다이빙 회차가 있어 운항 날짜를 변경할 수 없습니다. 먼저 회차 배정을 해제해주세요.",
        },
        {
          status: 409,
        },
      );
    }

    const assignedPeople = assignedTrips.reduce(
      (total, item) =>
        total +
        item.trip.participants.filter(
          (participant) => participant.boarded,
        ).length,
      0,
    );

    const nextCapacity =
      input.passengerCapacity ??
      current.passengerCapacity;

    if (assignedPeople > nextCapacity) {
      return NextResponse.json(
        {
          ok: false,
          message: `현재 배정 인원 ${assignedPeople}명보다 정원을 작게 변경할 수 없습니다.`,
        },
        {
          status: 400,
        },
      );
    }

    const schedules = await repository.findAll();
    const nextDepartureTime =
      input.departureTime ?? current.departureTime;

    const duplicate = schedules.some(
      (schedule) =>
        schedule.id !== id &&
        schedule.date === nextDate &&
        schedule.departureTime === nextDepartureTime &&
        schedule.status !== "CANCELLED" &&
        schedule.status !== "WEATHER_CANCELLED",
    );

    if (duplicate) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "같은 날짜와 출항 시간의 보트 운항이 이미 등록되어 있습니다.",
        },
        {
          status: 409,
        },
      );
    }

    const boatSchedule = await repository.update(id, input);

    if (!boatSchedule) {
      return NextResponse.json(
        {
          ok: false,
          message: "보트 운항 스케줄을 수정하지 못했습니다.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * 보트 출항 시간이 변경되면 연결된 모든 펀다이빙 회차의
     * 출항 시간도 실제 운항 시간으로 함께 갱신합니다.
     */
    if (
      typeof input.departureTime !== "undefined" &&
      input.departureTime !== current.departureTime
    ) {
      const groupDiveRepository = getGroupDiveRepository();
      const groupDives = await groupDiveRepository.findAll();

      await Promise.all(
        groupDives.map(async (groupDive) => {
          let changed = false;

          const trips = groupDive.trips.map((trip) => {
            if (trip.boatScheduleId !== id) {
              return trip;
            }

            changed = true;

            return {
              ...trip,
              startTime: boatSchedule.departureTime,
              updatedAt: new Date().toISOString(),
            };
          });

          if (!changed) {
            return;
          }

          await groupDiveRepository.update(groupDive.id, {
            trips,
          });
        }),
      );
    }

    return NextResponse.json({
      ok: true,
      boatSchedule,
    });
  } catch (error) {
    console.error("Failed to update boat schedule:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "보트 운항 스케줄을 수정하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const assignedTrips = await getAssignedTrips(id);

    if (assignedTrips.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "배정된 다이빙 회차가 있어 삭제할 수 없습니다. 먼저 모든 회차 배정을 해제해주세요.",
        },
        {
          status: 409,
        },
      );
    }

    const repository = getBoatScheduleRepository();
    const deleted = await repository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          message: "보트 운항 스케줄을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      deletedBoatScheduleId: id,
    });
  } catch (error) {
    console.error("Failed to delete boat schedule:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "보트 운항 스케줄을 삭제하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
