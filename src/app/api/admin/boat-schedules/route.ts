import { NextRequest, NextResponse } from "next/server";

import { getBoatScheduleRepository } from "@/lib/boatSchedules/boatScheduleRepository";
import type {
  BoatScheduleInput,
  BoatScheduleStatus,
} from "@/lib/boatSchedules/types";

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
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 11;
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

export async function GET(request: NextRequest) {
  try {
    const repository = getBoatScheduleRepository();
    const schedules = await repository.findAll();

    const date = request.nextUrl.searchParams.get("date");

    const filtered = date
      ? schedules.filter((schedule) => schedule.date === date)
      : schedules;

    return NextResponse.json({
      ok: true,
      boatSchedules: filtered,
      totalCount: filtered.length,
    });
  } catch (error) {
    console.error("Failed to fetch boat schedules:", error);

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const input: BoatScheduleInput = {
      date: normalizeText(body.date),
      departureTime: normalizeText(body.departureTime),

      boatName:
        normalizeText(body.boatName) || "SEONG SAN SCUBA",
      plannedPointName: normalizeText(
        body.plannedPointName,
      ),
      actualPointName: normalizeText(
        body.actualPointName,
      ),

      passengerCapacity: normalizePassengerCapacity(
        body.passengerCapacity,
      ),

      status: isStatus(body.status)
        ? body.status
        : "SCHEDULED",

      memo: normalizeText(body.memo),
    };

    if (!isValidDate(input.date)) {
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

    if (!isValidTime(input.departureTime)) {
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

    if (
      !input.passengerCapacity ||
      input.passengerCapacity < 1 ||
      input.passengerCapacity > 11
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

    const repository = getBoatScheduleRepository();
    const schedules = await repository.findAll();

    const duplicate = schedules.some(
      (schedule) =>
        schedule.date === input.date &&
        schedule.departureTime === input.departureTime &&
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

    const boatSchedule = await repository.create(input);

    return NextResponse.json(
      {
        ok: true,
        boatSchedule,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Failed to create boat schedule:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "보트 운항 스케줄을 등록하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
