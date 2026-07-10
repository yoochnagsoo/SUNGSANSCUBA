import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDiveTrip,
  GroupDiveTripInput,
  GroupDiveTripParticipant,
  GroupDiveTripStatus,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_TRIP_STATUSES: GroupDiveTripStatus[] = [
  "SCHEDULED",
  "BOARDING",
  "DEPARTED",
  "COMPLETED",
  "CANCELLED",
  "WEATHER_CANCELLED",
];

function createId() {
  return crypto.randomUUID();
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCapacity(value: unknown) {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(Math.floor(parsed), 0);
}

function normalizeParticipantIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => normalizeText(item))
        .filter(Boolean),
    ),
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
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

function isTripStatus(
  value: unknown,
): value is GroupDiveTripStatus {
  return VALID_TRIP_STATUSES.includes(
    value as GroupDiveTripStatus,
  );
}

function sortTrips(trips: GroupDiveTrip[]) {
  return [...trips].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    if (a.startTime !== b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const repository = getGroupDiveRepository();
    const groupDive = await repository.findById(id);

    if (!groupDive) {
      return NextResponse.json(
        {
          ok: false,
          message: "그룹 다이빙 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const trips = sortTrips(groupDive.trips);

    return NextResponse.json({
      ok: true,
      trips,
      totalCount: trips.length,
    });
  } catch (error) {
    console.error(
      "Failed to fetch group dive trips:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "다이빙 회차 목록을 불러오는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const repository = getGroupDiveRepository();
    const groupDive = await repository.findById(id);

    if (!groupDive) {
      return NextResponse.json(
        {
          ok: false,
          message: "그룹 다이빙 정보를 찾을 수 없습니다.",
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

    const input: GroupDiveTripInput = {
      date: normalizeText(body.date),
      startTime: normalizeText(body.startTime),

      plannedPointName: normalizeText(
        body.plannedPointName,
      ),

      actualPointName: normalizeText(
        body.actualPointName,
      ),

      boatName: normalizeText(body.boatName),
      guideName: normalizeText(body.guideName),

      capacity: normalizeCapacity(body.capacity),

      status: isTripStatus(body.status)
        ? body.status
        : "SCHEDULED",

      participantIds: normalizeParticipantIds(
        body.participantIds,
      ),

      memo: normalizeText(body.memo),
    };

    if (!isValidDate(input.date)) {
      return NextResponse.json(
        {
          ok: false,
          message: "다이빙 날짜를 올바르게 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      input.date < groupDive.startDate ||
      input.date > groupDive.endDate
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "다이빙 날짜는 그룹 이용 기간 안에 있어야 합니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidTime(input.startTime)) {
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

    if (!input.plannedPointName) {
      return NextResponse.json(
        {
          ok: false,
          message: "예정 다이빙 포인트를 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const duplicateTrip = groupDive.trips.some(
      (trip) =>
        trip.date === input.date &&
        trip.startTime === input.startTime,
    );

    if (duplicateTrip) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "같은 날짜와 시간의 다이빙 회차가 이미 등록되어 있습니다.",
        },
        {
          status: 409,
        },
      );
    }

    const activeParticipants =
      groupDive.participants.filter(
        (participant) => participant.active,
      );

    const selectedIds = new Set(
      input.participantIds ?? [],
    );

    const invalidParticipantIds = [
      ...selectedIds,
    ].filter(
      (participantId) =>
        !activeParticipants.some(
          (participant) =>
            participant.id === participantId,
        ),
    );

    if (invalidParticipantIds.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "존재하지 않거나 비활성 상태인 참가자가 포함되어 있습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const selectedParticipants =
      selectedIds.size > 0
        ? activeParticipants.filter((participant) =>
            selectedIds.has(participant.id),
          )
        : activeParticipants;

    const tripParticipants: GroupDiveTripParticipant[] =
      selectedParticipants.map((participant) => ({
        participantId: participant.id,
        participantName: participant.name,

        /*
         * 회차 생성 시 선택된 참가자는 기본 승선 처리합니다.
         * 승선 여부가 곧 이용 및 정산 대상 여부입니다.
         */
        boarded: true,

        nitrox: participant.nitroxDefault,
        rentalItems: [...participant.rentalItems],

        unitPrice: groupDive.defaultDiveUnitPrice,
        memo: "",
      }));

    const capacity = input.capacity ?? 0;

    if (
      capacity > 0 &&
      tripParticipants.length > capacity
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "선택된 참가자 수가 보트 정원을 초과합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const now = new Date().toISOString();

    const trip: GroupDiveTrip = {
      id: createId(),
      groupDiveId: groupDive.id,

      date: input.date,
      startTime: input.startTime,

      plannedPointName: input.plannedPointName,
      actualPointName:
        input.actualPointName ?? "",

      boatName: input.boatName ?? "",
      guideName: input.guideName ?? "",

      capacity,
      status: input.status ?? "SCHEDULED",

      participants: tripParticipants,

      memo: input.memo ?? "",

      createdAt: now,
      updatedAt: now,
    };

    const trips = sortTrips([
      ...groupDive.trips,
      trip,
    ]);

    const updated = await repository.update(groupDive.id, {
      trips,
    });

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "그룹 다이빙 정보를 수정할 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        trip,
        trips: updated.trips,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Failed to create group dive trip:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "다이빙 회차를 등록하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}