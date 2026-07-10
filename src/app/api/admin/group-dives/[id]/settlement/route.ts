import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDivePaymentMethod,
  GroupDiveSettlement,
  GroupDiveSettlementStatus,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_SETTLEMENT_STATUSES: GroupDiveSettlementStatus[] = [
  "UNPAID",
  "PARTIAL",
  "PAID",
];

const VALID_PAYMENT_METHODS: GroupDivePaymentMethod[] = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "OTHER",
];

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAmount(value: unknown) {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed);
}

function isSettlementStatus(
  value: unknown,
): value is GroupDiveSettlementStatus {
  return VALID_SETTLEMENT_STATUSES.includes(
    value as GroupDiveSettlementStatus,
  );
}

function isPaymentMethod(
  value: unknown,
): value is GroupDivePaymentMethod {
  return VALID_PAYMENT_METHODS.includes(
    value as GroupDivePaymentMethod,
  );
}

function calculateBaseAmount(
  trips: {
    status: string;
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
              : typeof defaultDiveUnitPrice === "number" &&
                  Number.isFinite(defaultDiveUnitPrice)
                ? Math.max(defaultDiveUnitPrice, 0)
                : 0;

          return tripTotal + unitPrice;
        },
        0,
      )
    );
  }, 0);
}

function calculateSettlementStatus(
  paidAmount: number,
  finalAmount: number,
): GroupDiveSettlementStatus {
  if (finalAmount <= 0) {
    return paidAmount > 0 ? "PAID" : "UNPAID";
  }

  if (paidAmount <= 0) {
    return "UNPAID";
  }

  if (paidAmount >= finalAmount) {
    return "PAID";
  }

  return "PARTIAL";
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

    const baseAmount = calculateBaseAmount(
      groupDive.trips,
      groupDive.defaultDiveUnitPrice,
    );

    const additionalAmount =
      groupDive.settlement.additionalAmount;

    const discountAmount =
      groupDive.settlement.discountAmount;

    const finalAmount = Math.max(
      baseAmount + additionalAmount - discountAmount,
      0,
    );

    const paidAmount = groupDive.settlement.paidAmount;

    const unpaidAmount = Math.max(
      finalAmount - paidAmount,
      0,
    );

    return NextResponse.json({
      ok: true,
      settlement: groupDive.settlement,
      summary: {
        baseAmount,
        additionalAmount,
        discountAmount,
        finalAmount,
        paidAmount,
        unpaidAmount,
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch group dive settlement:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙 정산 정보를 불러오는 중 오류가 발생했습니다.",
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

    const additionalAmount =
      typeof body.additionalAmount !== "undefined"
        ? normalizeAmount(body.additionalAmount)
        : groupDive.settlement.additionalAmount;

    if (additionalAmount === null) {
      return NextResponse.json(
        {
          ok: false,
          message: "추가 비용을 올바르게 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const discountAmount =
      typeof body.discountAmount !== "undefined"
        ? normalizeAmount(body.discountAmount)
        : groupDive.settlement.discountAmount;

    if (discountAmount === null) {
      return NextResponse.json(
        {
          ok: false,
          message: "할인 금액을 올바르게 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const paidAmount =
      typeof body.paidAmount !== "undefined"
        ? normalizeAmount(body.paidAmount)
        : groupDive.settlement.paidAmount;

    if (paidAmount === null) {
      return NextResponse.json(
        {
          ok: false,
          message: "결제 금액을 올바르게 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    let paymentMethod =
      groupDive.settlement.paymentMethod;

    if (typeof body.paymentMethod !== "undefined") {
      const normalizedPaymentMethod = normalizeText(
        body.paymentMethod,
      );

      if (!normalizedPaymentMethod) {
        paymentMethod = undefined;
      } else if (
        isPaymentMethod(normalizedPaymentMethod)
      ) {
        paymentMethod = normalizedPaymentMethod;
      } else {
        return NextResponse.json(
          {
            ok: false,
            message: "결제 방식을 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const baseAmount = calculateBaseAmount(
      groupDive.trips,
      groupDive.defaultDiveUnitPrice,
    );

    const finalAmount = Math.max(
      baseAmount + additionalAmount - discountAmount,
      0,
    );

    let status = calculateSettlementStatus(
      paidAmount,
      finalAmount,
    );

    if (typeof body.status !== "undefined") {
      if (!isSettlementStatus(body.status)) {
        return NextResponse.json(
          {
            ok: false,
            message: "정산 상태를 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      status = body.status;
    }

    if (status === "UNPAID" && paidAmount > 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "결제 금액이 있으면 미정산 상태로 저장할 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      status === "PARTIAL" &&
      (paidAmount <= 0 || paidAmount >= finalAmount)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "일부 정산은 결제 금액이 0원보다 크고 최종 금액보다 작아야 합니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      status === "PAID" &&
      paidAmount < finalAmount
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "정산 완료 처리하려면 결제 금액이 최종 정산 금액 이상이어야 합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const now = new Date().toISOString();

    const settlement: GroupDiveSettlement = {
      additionalAmount,
      discountAmount,
      paidAmount,

      status,
      paymentMethod,

      settledAt:
        status === "PAID"
          ? groupDive.settlement.settledAt || now
          : "",

      memo:
        typeof body.memo !== "undefined"
          ? normalizeText(body.memo)
          : groupDive.settlement.memo,

      updatedAt: now,
    };

    const updated = await repository.update(id, {
      settlement,
    });

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "그룹 다이빙 정산 정보를 수정할 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const unpaidAmount = Math.max(
      finalAmount - paidAmount,
      0,
    );

    return NextResponse.json({
      ok: true,
      settlement: updated.settlement,
      summary: {
        baseAmount,
        additionalAmount,
        discountAmount,
        finalAmount,
        paidAmount,
        unpaidAmount,
      },
    });
  } catch (error) {
    console.error(
      "Failed to update group dive settlement:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙 정산 정보를 저장하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}