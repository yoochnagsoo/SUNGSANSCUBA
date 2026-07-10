import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDive,
  GroupDivePayment,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CompleteAction =
  | "COMPLETE"
  | "REOPEN";

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
      trip.participants.reduce(
        (tripTotal, participant) => {
          if (!participant.boarded) {
            return tripTotal;
          }

          const unitPrice =
            typeof participant.unitPrice === "number" &&
            Number.isFinite(participant.unitPrice)
              ? Math.max(participant.unitPrice, 0)
              : typeof groupDive.defaultDiveUnitPrice ===
                    "number" &&
                  Number.isFinite(
                    groupDive.defaultDiveUnitPrice,
                  )
                ? Math.max(
                    groupDive.defaultDiveUnitPrice,
                    0,
                  )
                : 0;

          return tripTotal + unitPrice;
        },
        0,
      )
    );
  }, 0);
}

function calculatePaidAmount(
  payments: GroupDivePayment[],
) {
  return payments.reduce((total, payment) => {
    if (payment.status !== "ACTIVE") {
      return total;
    }

    return total + payment.amount;
  }, 0);
}

function isTerminalTripStatus(status: string) {
  return (
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "WEATHER_CANCELLED"
  );
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
          message:
            "그룹 다이빙 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const body = (await request.json()) as {
      action?: CompleteAction;
    };

    if (
      body.action !== "COMPLETE" &&
      body.action !== "REOPEN"
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "올바른 상태 변경 작업이 아닙니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (body.action === "REOPEN") {
      const updated = await repository.update(id, {
        status: "ACTIVE",
      });

      if (!updated) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "그룹 다이빙을 복구하지 못했습니다.",
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json({
        ok: true,
        groupDive: updated,
      });
    }

    if (groupDive.status === "CANCELLED") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "취소된 그룹은 마감할 수 없습니다. 먼저 진행 중 상태로 변경해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (groupDive.trips.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "등록된 다이빙 회차가 없어 마감할 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const unfinishedTrips = groupDive.trips.filter(
      (trip) => !isTerminalTripStatus(trip.status),
    );

    if (unfinishedTrips.length > 0) {
      const firstTrip = unfinishedTrips[0];

      return NextResponse.json(
        {
          ok: false,
          message: `${firstTrip.date} ${firstTrip.startTime} 회차가 아직 완료되지 않았습니다. 모든 회차를 완료 또는 취소 처리해주세요.`,
        },
        {
          status: 400,
        },
      );
    }

    const baseAmount =
      calculateBaseAmount(groupDive);

    const finalAmount = Math.max(
      baseAmount +
        groupDive.settlement.additionalAmount -
        groupDive.settlement.discountAmount,
      0,
    );

    const paidAmount = calculatePaidAmount(
      groupDive.payments || [],
    );

    const unpaidAmount = Math.max(
      finalAmount - paidAmount,
      0,
    );

    if (unpaidAmount > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `미수금 ${unpaidAmount.toLocaleString(
            "ko-KR",
          )}원이 남아 있어 마감할 수 없습니다.`,
        },
        {
          status: 400,
        },
      );
    }

    if (paidAmount > finalAmount) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "결제 금액이 최종 정산금액을 초과한 상태라 마감할 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const updated = await repository.update(id, {
      status: "COMPLETED",
    });

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "그룹 다이빙을 마감하지 못했습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      groupDive: updated,
    });
  } catch (error) {
    console.error(
      "Failed to complete group dive:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙 상태를 변경하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}