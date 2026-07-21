import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDivePayment,
  GroupDivePaymentMethod,
  GroupDiveSettlement,
  GroupDiveSettlementStatus,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_PAYMENT_METHODS: GroupDivePaymentMethod[] = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "OTHER",
];

function createId() {
  return crypto.randomUUID();
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAmount(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

function normalizePaidAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
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
    boardedCount?: number;
    focCount?: number;
    unitPrice?: number;
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
        typeof trip.unitPrice === "number" &&
        Number.isFinite(trip.unitPrice)
          ? Math.max(trip.unitPrice, 0)
          : typeof defaultDiveUnitPrice === "number" &&
              Number.isFinite(defaultDiveUnitPrice)
            ? Math.max(defaultDiveUnitPrice, 0)
            : 0;

      return (
        total +
        Math.max(
          Math.floor(trip.boardedCount) -
            Math.max(Math.floor(trip.focCount ?? 0), 0),
          0,
        ) * unitPrice
      );
    }

    const tripAmount = trip.participants.reduce(
      (tripTotal, participant, index) => {
        if (!participant.boarded) {
          return tripTotal;
        }

        if (
          index <
          Math.max(Math.floor(trip.focCount ?? 0), 0)
        ) {
          return tripTotal;
        }

        const unitPrice =
          typeof participant.unitPrice === "number" &&
          Number.isFinite(participant.unitPrice)
            ? Math.max(participant.unitPrice, 0)
            : typeof trip.unitPrice === "number" &&
                Number.isFinite(trip.unitPrice)
              ? Math.max(trip.unitPrice, 0)
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

    /*
     * 결제 이력이 여러 건일 수 있으므로
     * 정산의 단일 paymentMethod는 사용하지 않습니다.
     */
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

  return {
    baseAmount: params.baseAmount,
    additionalAmount: params.additionalAmount,
    discountAmount: params.discountAmount,
    finalAmount,
    paidAmount: params.paidAmount,
    unpaidAmount,
  };
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
          message:
            "그룹 다이빙 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const payments = sortPayments(
      groupDive.payments || [],
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

    return NextResponse.json({
      ok: true,
      payments,
      settlement: groupDive.settlement,
      summary,
    });
  } catch (error) {
    console.error(
      "Failed to fetch group dive payments:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "결제 내역을 불러오는 중 오류가 발생했습니다.",
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
          message:
            "그룹 다이빙 정보를 찾을 수 없습니다.",
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

    const amount = normalizeAmount(body.amount);

    if (amount === null) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "결제 금액은 0원보다 크게 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isPaymentMethod(body.paymentMethod)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "결제 방식을 선택해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const paidAt = normalizePaidAt(body.paidAt);

    if (paidAt === null) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "결제 일시를 올바르게 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const currentPayments = sortPayments(
      groupDive.payments || [],
    );

    const baseAmount = calculateBaseAmount(
      groupDive.trips,
      groupDive.defaultDiveUnitPrice,
    );

    const currentPaidAmount = calculatePaidAmount(
      currentPayments,
    );

    const currentSummary = createSummary({
      baseAmount,
      additionalAmount:
        groupDive.settlement.additionalAmount,
      discountAmount:
        groupDive.settlement.discountAmount,
      paidAmount: currentPaidAmount,
    });

    /*
     * 최종 정산금액이 0원이거나 이미 전액 결제된 경우
     * 추가 결제를 등록할 수 없습니다.
     */
    if (currentSummary.unpaidAmount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "이미 정산이 완료되어 추가 결제를 등록할 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * 입력한 결제 금액이 현재 미수금을 넘으면 거절합니다.
     */
    if (amount > currentSummary.unpaidAmount) {
      return NextResponse.json(
        {
          ok: false,
          message: `결제 금액은 현재 미수금 ${currentSummary.unpaidAmount.toLocaleString(
            "ko-KR",
          )}원을 초과할 수 없습니다.`,
        },
        {
          status: 400,
        },
      );
    }

    const now = new Date().toISOString();

    const payment: GroupDivePayment = {
      id: createId(),
      groupDiveId: groupDive.id,

      amount,
      paymentMethod: body.paymentMethod,

      paidAt,

      processedById: normalizeText(
        body.processedById,
      ),

      processedByName:
        normalizeText(body.processedByName) ||
        "관리자",

      memo: normalizeText(body.memo),

      status: "ACTIVE",

      cancelledAt: "",
      cancelledById: "",
      cancelledByName: "",
      cancelReason: "",

      createdAt: now,
      updatedAt: now,
    };

    const payments = sortPayments([
      ...currentPayments,
      payment,
    ]);

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
            "결제 내역을 저장하지 못했습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      payment,
      payments: updated.payments,
      settlement: updated.settlement,
      summary,
    });
  } catch (error) {
    console.error(
      "Failed to create group dive payment:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "결제 내역을 저장하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
