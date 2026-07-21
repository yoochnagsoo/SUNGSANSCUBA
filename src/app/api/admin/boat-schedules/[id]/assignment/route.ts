import { NextRequest, NextResponse } from "next/server";

import { getBoatScheduleRepository } from "@/lib/boatSchedules/boatScheduleRepository";
import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type { GroupDiveTrip } from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBoardedCount(trip: GroupDiveTrip) {
  if (
    typeof trip.boardedCount === "number" &&
    Number.isFinite(trip.boardedCount)
  ) {
    return Math.max(Math.floor(trip.boardedCount), 0);
  }

  return trip.participants.filter((participant) => participant.boarded).length;
}

function getPreferredTime(trip: GroupDiveTrip) {
  return trip.preferredTime || trip.startTime || "";
}

function sortTrips(trips: GroupDiveTrip[]) {
  return [...trips].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    const aPreferredTime = getPreferredTime(a);
    const bPreferredTime = getPreferredTime(b);

    if (aPreferredTime !== bPreferredTime) {
      return aPreferredTime.localeCompare(bPreferredTime);
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: boatScheduleId } = await context.params;

    const body = (await request.json()) as Record<string, unknown>;

    const groupDiveId = normalizeText(body.groupDiveId);
    const tripId = normalizeText(body.tripId);
    const action = body.action === "UNASSIGN" ? "UNASSIGN" : "ASSIGN";

    if (!groupDiveId || !tripId) {
      return NextResponse.json(
        {
          ok: false,
          message: "그룹 다이빙과 다이빙 회차 정보가 필요합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const groupDiveRepository = getGroupDiveRepository();

    const groupDive = await groupDiveRepository.findById(groupDiveId);

    if (!groupDive) {
      return NextResponse.json(
        {
          ok: false,
          message: "펀다이빙 팀을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const tripIndex = groupDive.trips.findIndex((trip) => trip.id === tripId);

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

    const previousTrip = groupDive.trips[tripIndex];

    if (action === "UNASSIGN") {
      const updatedTrip: GroupDiveTrip = {
        ...previousTrip,
        boatScheduleId: "",
        actualDepartureTime: "",
        updatedAt: new Date().toISOString(),
      };

      const trips = [...groupDive.trips];
      trips[tripIndex] = updatedTrip;

      const updatedGroupDive = await groupDiveRepository.update(groupDive.id, {
        trips: sortTrips(trips),
      });

      return NextResponse.json({
        ok: true,
        trip: updatedTrip,
        groupDive: updatedGroupDive,
      });
    }

    const boatScheduleRepository = getBoatScheduleRepository();

    const boatSchedule = await boatScheduleRepository.findById(boatScheduleId);

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

    if (
      boatSchedule.status === "CANCELLED" ||
      boatSchedule.status === "WEATHER_CANCELLED" ||
      boatSchedule.status === "COMPLETED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "취소 또는 완료된 보트 운항에는 회차를 배정할 수 없습니다.",
        },
        {
          status: 409,
        },
      );
    }

    if (previousTrip.date !== boatSchedule.date) {
      return NextResponse.json(
        {
          ok: false,
          message: "다이빙 회차 날짜와 보트 운항 날짜가 다릅니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      previousTrip.status === "CANCELLED" ||
      previousTrip.status === "WEATHER_CANCELLED" ||
      previousTrip.status === "COMPLETED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "취소 또는 완료된 다이빙 회차는 배정할 수 없습니다.",
        },
        {
          status: 409,
        },
      );
    }

    const allGroupDives = await groupDiveRepository.findAll();

    /*
     * 같은 펀다이빙 그룹의 다른 회차를 동일한 보트 출항 슬롯에
     * 중복 배정할 수 없습니다. 한 팀이 같은 시간에 두 번 다이빙하는
     * 상황을 서버에서 확실하게 차단합니다.
     */
    const sameGroupTripInSchedule = groupDive.trips.find(
      (trip) => trip.id !== tripId && trip.boatScheduleId === boatScheduleId,
    );

    if (sameGroupTripInSchedule) {
      return NextResponse.json(
        {
          ok: false,
          message: `${groupDive.groupName}의 다른 다이빙 회차가 이미 ${boatSchedule.departureTime} 출항에 배정되어 있습니다. 같은 그룹의 여러 회차는 동일한 출항 시간에 배정할 수 없습니다.`,
        },
        {
          status: 409,
        },
      );
    }

    const currentlyAssignedPeople = allGroupDives.reduce(
      (total, currentGroupDive) =>
        total +
        currentGroupDive.trips.reduce((tripTotal, trip) => {
          if (
            trip.boatScheduleId !== boatScheduleId ||
            (currentGroupDive.id === groupDiveId && trip.id === tripId)
          ) {
            return tripTotal;
          }

          return tripTotal + getBoardedCount(trip);
        }, 0),
      0,
    );

    const assigningPeople = getBoardedCount(previousTrip);

    if (
      currentlyAssignedPeople + assigningPeople >
      boatSchedule.passengerCapacity
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: `승선 정원 ${boatSchedule.passengerCapacity}명을 초과합니다. 현재 ${currentlyAssignedPeople}명, 배정하려는 인원 ${assigningPeople}명입니다.`,
        },
        {
          status: 409,
        },
      );
    }

    const updatedTrip: GroupDiveTrip = {
      ...previousTrip,

      /*
       * 보트 운항 슬롯 배정은 실제 출항 시간만 기록합니다.
       *
       * preferredTime과 기존 데이터 호환용 startTime은
       * previousTrip의 값을 그대로 유지해야 하므로
       * 이곳에서는 두 필드를 다시 대입하지 않습니다.
       */
      actualDepartureTime: boatSchedule.departureTime,
      boatScheduleId,

      updatedAt: new Date().toISOString(),
    };

    const trips = [...groupDive.trips];
    trips[tripIndex] = updatedTrip;

    const updatedGroupDive = await groupDiveRepository.update(groupDive.id, {
      trips: sortTrips(trips),
    });

    return NextResponse.json({
      ok: true,
      trip: updatedTrip,
      groupDive: updatedGroupDive,
      assignedPeople: currentlyAssignedPeople + assigningPeople,
      remainingSeats:
        boatSchedule.passengerCapacity -
        currentlyAssignedPeople -
        assigningPeople,
    });
  } catch (error) {
    console.error("Failed to assign group dive trip:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "다이빙 회차를 보트 운항에 배정하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
