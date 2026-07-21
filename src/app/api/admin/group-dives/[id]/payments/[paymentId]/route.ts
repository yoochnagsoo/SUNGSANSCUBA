import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDivePayment,
  GroupDiveSettlement,
  GroupDiveSettlementStatus,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
    paymentId: string;
  }>;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function calculateBaseAmount(
  trips: {
    status: string;
    boardedCount?: number;
    participants: {
      boarded: boolean;
      unitPrice?: number;
    }[];
  }[],
  defaultDiveUnitPrice?: number,
) {
  return trips.reduce((total, trip) => {
    if (
      trip.status === "CANCELLED" ||
      trip.status === "WEATHER_CANCELLED"
    ) {
      return total;
    }

    if (
      typeof trip.boardedCount === "number" &&
      Number.isFinite(trip.boardedCount) &&
      trip.participants.length === 0
    ) {
      const unitPrice =
        typeof defaultDiveUnitPrice === "number" &&
        Number.isFinite(defaultDiveUnitPrice)
          ? Math.max(defaultDiveUnitPrice, 0)
          : 0;

      return (
        total +
        Math.max(Math.floor(trip.boardedCount), 0) * unitPrice
      );
    }

    const tripAmount = trip.participants.reduce(
      (tripTotal, participant) => {
        if (!participant.boarded) {
          return tripTotal;
        }

        const unitPrice =
          typeof participant.unitPrice === "number" &&
          Number.isFinite(participant.unitPrice)
            ? Math.max(participant.unitPrice, 0)
            : typeof defaultDiveUnitPrice === "number" &&
                Number.isFinite(defaultDiveUnitPrice)
              ? Math.max(defaultDiveUnitPrice, 0)
              : 0;

        return tripTotal + unitPrice;
      },
      0,
    );

    return total + tripAmount;
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

function calculateSettlementStatus(
  paidAmount: number,
  finalAmount: number,
): GroupDiveSettlementStatus {
  if (paidAmount <= 0) {
    return "UNPAID";
  }

  if (paidAmount >= finalAmount) {
    return "PAID";
  }

  return "PARTIAL";
}

function createSettlement(
  current: GroupDiveSettlement,
  paidAmount: number,
  finalAmount: number,
  now: string,
): GroupDiveSettlement {
  const status = calculateSettlementStatus(
    paidAmount,
    finalAmount,
  );

  return {
    ...current,
    paidAmount,
    status,

    paymentMethod: undefined,

    settledAt:
      status === "PAID"
        ? current.settledAt || now
        : "",

    updatedAt: now,
  };
}

function sortPayments(
  payments: GroupDivePayment[],
) {
  return [...payments].sort((a, b) =>
    b.paidAt.localeCompare(a.paidAt),
  );
}

function createSummary(params: {
  baseAmount: number;
  additionalAmount: number;
  discountAmount: number;
  paidAmount: number;
}) {
  const finalAmount = Math.max(
    params.baseAmount +
      params.additionalAmount -
      params.discountAmount,
    0,
  );

  const unpaidAmount = Math.max(
    finalAmount - params.paidAmount,
    0,
  );

  const overpaidAmount = Math.max(
    params.paidAmount - finalAmount,
    0,
  );

  return {
    baseAmount: params.baseAmount,
    additionalAmount: params.additionalAmount,
    discountAmount: params.discountAmount,
    finalAmount,
    paidAmount: params.paidAmount,
    unpaidAmount,
    overpaidAmount,
  };
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id, paymentId } =
      await context.params;

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

    const payment = groupDive.payments.find(
      (item) => item.id === paymentId,
    );

    if (!payment) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "결제 내역을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    if (payment.status === "CANCELLED") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "이미 취소된 결제입니다.",
        },
        {
          status: 400,
        },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const cancelReason = normalizeText(
      body.cancelReason,
    );

    if (!cancelReason) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "결제 취소 사유를 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const now = new Date().toISOString();

    const payments = sortPayments(
      groupDive.payments.map((item) => {
        if (item.id !== paymentId) {
          return item;
        }

        return {
          ...item,

          status: "CANCELLED" as const,

          cancelledAt: now,

          cancelledById: normalizeText(
            body.cancelledById,
          ),

          cancelledByName:
            normalizeText(
              body.cancelledByName,
            ) || "관리자",

          cancelReason,

          updatedAt: now,
        };
      }),
    );

    const baseAmount = calculateBaseAmount(
      groupDive.trips,
      groupDive.defaultDiveUnitPrice,
    );

    const paidAmount = calculatePaidAmount(
      payments,
    );

    const summary = createSummary({
      baseAmount,
      additionalAmount:
        groupDive.settlement.additionalAmount,
      discountAmount:
        groupDive.settlement.discountAmount,
      paidAmount,
    });

    const settlement = createSettlement(
      groupDive.settlement,
      paidAmount,
      summary.finalAmount,
      now,
    );

    const updated = await repository.update(id, {
      payments,
      settlement,
    });

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "결제 취소 정보를 저장하지 못했습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const cancelledPayment =
      updated.payments.find(
        (item) => item.id === paymentId,
      );

    return NextResponse.json({
      ok: true,
      payment: cancelledPayment,
      payments: updated.payments,
      settlement: updated.settlement,
      summary,
    });
  } catch (error) {
    console.error(
      "Failed to cancel group dive payment:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "결제를 취소하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
