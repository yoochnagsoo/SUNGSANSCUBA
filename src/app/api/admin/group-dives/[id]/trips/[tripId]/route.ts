import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDiveTrip,
  GroupDiveTripParticipant,
  GroupDiveTripStatus,
  GroupDiveTripUpdateInput,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
    tripId: string;
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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCapacity(value: unknown) {
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

  return Math.max(Math.floor(parsed), 0);
}

function normalizeOptionalPrice(value: unknown) {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function normalizeStringArray(value: unknown) {
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

function normalizeStoredTripParticipants(
  participants: GroupDiveTripParticipant[],
): GroupDiveTripParticipant[] {
  return participants.map((participant) => ({
    participantId: participant.participantId,
    participantName: participant.participantName,
    boarded: participant.boarded === true,
    nitrox: participant.nitrox === true,
    rentalItems: Array.isArray(participant.rentalItems)
      ? participant.rentalItems
      : [],
    unitPrice: participant.unitPrice,
    memo: participant.memo ?? "",
  }));
}

function parseTripParticipants(
  value: unknown,
  groupParticipants: {
    id: string;
    name: string;
    active: boolean;
    nitroxDefault: boolean;
    rentalItems: string[];
  }[],
  defaultDiveUnitPrice?: number,
):
  | {
      ok: true;
      participants: GroupDiveTripParticipant[];
    }
  | {
      ok: false;
      message: string;
    } {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      message: "승선 명단 형식을 확인해주세요.",
    };
  }

  const seenParticipantIds = new Set<string>();
  const participants: GroupDiveTripParticipant[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null
    ) {
      return {
        ok: false,
        message: "승선 명단 형식을 확인해주세요.",
      };
    }

    const record = item as Record<string, unknown>;

    const participantId = normalizeText(
      record.participantId,
    );

    if (!participantId) {
      return {
        ok: false,
        message:
          "승선 명단에 참가자 ID가 누락되어 있습니다.",
      };
    }

    if (seenParticipantIds.has(participantId)) {
      return {
        ok: false,
        message:
          "승선 명단에 같은 참가자가 중복되어 있습니다.",
      };
    }

    const participant = groupParticipants.find(
      (groupParticipant) =>
        groupParticipant.id === participantId,
    );

    if (!participant) {
      return {
        ok: false,
        message:
          "승선 명단에 존재하지 않는 참가자가 포함되어 있습니다.",
      };
    }

    if (!participant.active) {
      return {
        ok: false,
        message:
          "비활성 상태인 참가자는 승선 명단에 추가할 수 없습니다.",
      };
    }

    if (
      typeof record.boarded !== "undefined" &&
      typeof record.boarded !== "boolean"
    ) {
      return {
        ok: false,
        message: "승선 여부 값을 확인해주세요.",
      };
    }

    if (
      typeof record.nitrox !== "undefined" &&
      typeof record.nitrox !== "boolean"
    ) {
      return {
        ok: false,
        message:
          "나이트록스 사용 여부 값을 확인해주세요.",
      };
    }

    if (
      typeof record.rentalItems !== "undefined" &&
      !Array.isArray(record.rentalItems)
    ) {
      return {
        ok: false,
        message:
          "장비 대여 항목 형식을 확인해주세요.",
      };
    }

    const unitPrice = normalizeOptionalPrice(
      record.unitPrice,
    );

    if (
      record.unitPrice !== "" &&
      record.unitPrice !== null &&
      typeof record.unitPrice !== "undefined" &&
      typeof unitPrice === "undefined"
    ) {
      return {
        ok: false,
        message:
          "참가자별 다이빙 단가를 확인해주세요.",
      };
    }

    seenParticipantIds.add(participantId);

    participants.push({
      participantId,
      participantName: participant.name,

      /*
       * 승선 여부가 곧 해당 회차의 이용 및 정산 대상 여부입니다.
       */
      boarded:
        typeof record.boarded === "boolean"
          ? record.boarded
          : true,

      nitrox:
        typeof record.nitrox === "boolean"
          ? record.nitrox
          : participant.nitroxDefault,

      rentalItems:
        typeof record.rentalItems !== "undefined"
          ? normalizeStringArray(record.rentalItems)
          : [...participant.rentalItems],

      unitPrice:
        typeof unitPrice !== "undefined"
          ? unitPrice
          : defaultDiveUnitPrice,

      memo: normalizeText(record.memo),
    });
  }

  return {
    ok: true,
    participants,
  };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id, tripId } = await context.params;

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

    const trip = groupDive.trips.find(
      (item) => item.id === tripId,
    );

    if (!trip) {
      return NextResponse.json(
        {
          ok: false,
          message: "다이빙 회차를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const normalizedTrip: GroupDiveTrip = {
      ...trip,
      participants: normalizeStoredTripParticipants(
        trip.participants,
      ),
    };

    return NextResponse.json({
      ok: true,
      trip: normalizedTrip,
      boardedCount: normalizedTrip.participants.filter(
        (participant) => participant.boarded,
      ).length,
    });
  } catch (error) {
    console.error(
      "Failed to fetch group dive trip:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "다이빙 회차를 불러오는 중 오류가 발생했습니다.",
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
    const { id, tripId } = await context.params;

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

    const tripIndex = groupDive.trips.findIndex(
      (item) => item.id === tripId,
    );

    if (tripIndex === -1) {
      return NextResponse.json(
        {
          ok: false,
          message: "다이빙 회차를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const previous = groupDive.trips[tripIndex];

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const input: GroupDiveTripUpdateInput = {};

    if (typeof body.date !== "undefined") {
      const date = normalizeText(body.date);

      if (!isValidDate(date)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "다이빙 날짜를 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        date < groupDive.startDate ||
        date > groupDive.endDate
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

      input.date = date;
    }

    if (typeof body.startTime !== "undefined") {
      const startTime = normalizeText(body.startTime);

      if (!isValidTime(startTime)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "출항 시간을 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.startTime = startTime;
    }

    const nextDate = input.date ?? previous.date;
    const nextStartTime =
      input.startTime ?? previous.startTime;

    const duplicateTrip = groupDive.trips.some(
      (trip) =>
        trip.id !== tripId &&
        trip.date === nextDate &&
        trip.startTime === nextStartTime,
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

    if (
      typeof body.plannedPointName !== "undefined"
    ) {
      const plannedPointName = normalizeText(
        body.plannedPointName,
      );

      if (!plannedPointName) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "예정 다이빙 포인트를 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.plannedPointName = plannedPointName;
    }

    if (
      typeof body.actualPointName !== "undefined"
    ) {
      input.actualPointName = normalizeText(
        body.actualPointName,
      );
    }

    if (typeof body.boatName !== "undefined") {
      input.boatName = normalizeText(body.boatName);
    }

    if (typeof body.guideName !== "undefined") {
      input.guideName = normalizeText(body.guideName);
    }

    if (typeof body.capacity !== "undefined") {
      const capacity = normalizeCapacity(
        body.capacity,
      );

      if (typeof capacity === "undefined") {
        return NextResponse.json(
          {
            ok: false,
            message: "보트 정원을 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.capacity = capacity;
    }

    if (typeof body.status !== "undefined") {
      if (!isTripStatus(body.status)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "다이빙 회차 상태를 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.status = body.status;
    }

    if (
      typeof body.participants !== "undefined"
    ) {
      const parsedParticipants =
        parseTripParticipants(
          body.participants,
          groupDive.participants,
          groupDive.defaultDiveUnitPrice,
        );

      if (!parsedParticipants.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: parsedParticipants.message,
          },
          {
            status: 400,
          },
        );
      }

      input.participants =
        parsedParticipants.participants;
    }

    if (typeof body.memo !== "undefined") {
      input.memo = normalizeText(body.memo);
    }

    const nextParticipants =
      input.participants ??
      normalizeStoredTripParticipants(
        previous.participants,
      );

    const nextCapacity =
      input.capacity ?? previous.capacity;

    const boardedCount = nextParticipants.filter(
      (participant) => participant.boarded,
    ).length;

    if (
      nextCapacity > 0 &&
      boardedCount > nextCapacity
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "승선 인원이 보트 정원을 초과합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const updatedTrip: GroupDiveTrip = {
      ...previous,

      date: input.date ?? previous.date,
      startTime:
        input.startTime ?? previous.startTime,

      plannedPointName:
        input.plannedPointName ??
        previous.plannedPointName,

      actualPointName:
        input.actualPointName ??
        previous.actualPointName,

      boatName:
        input.boatName ?? previous.boatName,

      guideName:
        input.guideName ?? previous.guideName,

      capacity:
        input.capacity ?? previous.capacity,

      status:
        input.status ?? previous.status,

      participants: nextParticipants,

      memo: input.memo ?? previous.memo,

      updatedAt: new Date().toISOString(),
    };

    const trips = [...groupDive.trips];
    trips[tripIndex] = updatedTrip;

    const updated = await repository.update(groupDive.id, {
      trips: sortTrips(trips),
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

    return NextResponse.json({
      ok: true,
      trip: updatedTrip,
      boardedCount,
    });
  } catch (error) {
    console.error(
      "Failed to update group dive trip:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "다이빙 회차를 수정하는 중 오류가 발생했습니다.",
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
    const { id, tripId } = await context.params;

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

    const trip = groupDive.trips.find(
      (item) => item.id === tripId,
    );

    if (!trip) {
      return NextResponse.json(
        {
          ok: false,
          message: "다이빙 회차를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const trips = groupDive.trips.filter(
      (item) => item.id !== tripId,
    );

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

    return NextResponse.json({
      ok: true,
      deletedTripId: tripId,
      trips: updated.trips,
    });
  } catch (error) {
    console.error(
      "Failed to delete group dive trip:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "다이빙 회차를 삭제하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}