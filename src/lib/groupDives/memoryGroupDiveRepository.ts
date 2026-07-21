import type {
  GroupDive,
  GroupDiveInput,
  GroupDivePayment,
  GroupDivePaymentMethod,
  GroupDivePaymentStatus,
  GroupDiveRepository,
  GroupDiveSettlement,
  GroupDiveSettlementStatus,
  GroupDiveTrip,
  GroupDiveUpdateInput,
} from "./types";

const groupDives: GroupDive[] = [];

function createId() {
  return crypto.randomUUID();
}

function normalizeExpectedPeople(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(Math.floor(parsed), 0);
}

function normalizeUnitPrice(value: unknown) {
  if (typeof value === "undefined") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(parsed, 0);
}

function normalizeAmount(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(parsed, 0);
}

function normalizeSettlementStatus(
  value: unknown,
): GroupDiveSettlementStatus {
  if (value === "PARTIAL") {
    return "PARTIAL";
  }

  if (value === "PAID") {
    return "PAID";
  }

  return "UNPAID";
}

function normalizePaymentMethod(
  value: unknown,
): GroupDivePaymentMethod | undefined {
  if (
    value === "CASH" ||
    value === "BANK_TRANSFER" ||
    value === "CARD" ||
    value === "OTHER"
  ) {
    return value;
  }

  return undefined;
}

function normalizePaymentStatus(
  value: unknown,
): GroupDivePaymentStatus {
  if (value === "CANCELLED") {
    return "CANCELLED";
  }

  return "ACTIVE";
}

function createDefaultSettlement(): GroupDiveSettlement {
  return {
    additionalAmount: 0,
    discountAmount: 0,
    paidAmount: 0,

    status: "UNPAID",
    paymentMethod: undefined,

    settledAt: "",
    memo: "",
    updatedAt: "",
  };
}

function normalizeSettlement(
  value: unknown,
): GroupDiveSettlement {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return createDefaultSettlement();
  }

  const settlement =
    value as Partial<GroupDiveSettlement>;

  return {
    additionalAmount: normalizeAmount(
      settlement.additionalAmount,
    ),

    discountAmount: normalizeAmount(
      settlement.discountAmount,
    ),

    paidAmount: normalizeAmount(
      settlement.paidAmount,
    ),

    status: normalizeSettlementStatus(
      settlement.status,
    ),

    paymentMethod: normalizePaymentMethod(
      settlement.paymentMethod,
    ),

    settledAt:
      typeof settlement.settledAt === "string"
        ? settlement.settledAt
        : "",

    memo:
      typeof settlement.memo === "string"
        ? settlement.memo
        : "",

    updatedAt:
      typeof settlement.updatedAt === "string"
        ? settlement.updatedAt
        : "",
  };
}

function normalizePayment(
  value: unknown,
  groupDiveId: string,
): GroupDivePayment | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  const payment =
    value as Partial<GroupDivePayment>;

  const paymentMethod = normalizePaymentMethod(
    payment.paymentMethod,
  );

  if (!paymentMethod) {
    return null;
  }

  const now = new Date().toISOString();

  const createdAt =
    typeof payment.createdAt === "string"
      ? payment.createdAt
      : now;

  const updatedAt =
    typeof payment.updatedAt === "string"
      ? payment.updatedAt
      : createdAt;

  return {
    id:
      typeof payment.id === "string" &&
      payment.id.trim()
        ? payment.id
        : createId(),

    groupDiveId:
      typeof payment.groupDiveId === "string" &&
      payment.groupDiveId.trim()
        ? payment.groupDiveId
        : groupDiveId,

    amount: normalizeAmount(payment.amount),

    paymentMethod,

    paidAt:
      typeof payment.paidAt === "string"
        ? payment.paidAt
        : createdAt,

    processedById:
      typeof payment.processedById === "string"
        ? payment.processedById
        : "",

    processedByName:
      typeof payment.processedByName === "string"
        ? payment.processedByName
        : "",

    memo:
      typeof payment.memo === "string"
        ? payment.memo
        : "",

    status: normalizePaymentStatus(
      payment.status,
    ),

    cancelledAt:
      typeof payment.cancelledAt === "string"
        ? payment.cancelledAt
        : "",

    cancelledById:
      typeof payment.cancelledById === "string"
        ? payment.cancelledById
        : "",

    cancelledByName:
      typeof payment.cancelledByName === "string"
        ? payment.cancelledByName
        : "",

    cancelReason:
      typeof payment.cancelReason === "string"
        ? payment.cancelReason
        : "",

    createdAt,
    updatedAt,
  };
}

function normalizePayments(
  value: unknown,
  groupDiveId: string,
): GroupDivePayment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((payment) =>
      normalizePayment(payment, groupDiveId),
    )
    .filter(
      (
        payment,
      ): payment is GroupDivePayment =>
        payment !== null,
    )
    .sort((a, b) =>
      b.paidAt.localeCompare(a.paidAt),
    );
}

function normalizeTrips(
  value: unknown,
): GroupDiveTrip[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return (value as GroupDiveTrip[]).map((trip) => {
    const participants = Array.isArray(trip.participants)
      ? trip.participants
      : [];
    const parsedBoardedCount = Number(trip.boardedCount);
    const boardedCount = Number.isFinite(parsedBoardedCount)
      ? Math.max(Math.floor(parsedBoardedCount), 0)
      : participants.filter((participant) => participant.boarded).length;

    return {
      ...trip,
      participants,
      boardedCount,
    };
  });
}

function normalizeGroupDive(
  groupDive: GroupDive,
): GroupDive {
  return {
    ...groupDive,

    expectedPeople: normalizeExpectedPeople(
      groupDive.expectedPeople,
    ),

    defaultDiveUnitPrice: normalizeUnitPrice(
      groupDive.defaultDiveUnitPrice,
    ),

    participants: Array.isArray(
      groupDive.participants,
    )
      ? groupDive.participants
      : [],

    trips: normalizeTrips(groupDive.trips),

    settlement: normalizeSettlement(
      groupDive.settlement,
    ),

    payments: normalizePayments(
      groupDive.payments,
      groupDive.id,
    ),
  };
}

function sortGroupDives(items: GroupDive[]) {
  return [...items].sort((a, b) => {
    const startDateCompare =
      b.startDate.localeCompare(a.startDate);

    if (startDateCompare !== 0) {
      return startDateCompare;
    }

    return b.createdAt.localeCompare(
      a.createdAt,
    );
  });
}

export const memoryGroupDiveRepository: GroupDiveRepository =
  {
    async create(
      input: GroupDiveInput,
    ): Promise<GroupDive> {
      const now = new Date().toISOString();

      const groupDive: GroupDive = {
        id: createId(),

        groupName: input.groupName,

        representativeName:
          input.representativeName,

        representativePhone:
          input.representativePhone ?? "",

        startDate: input.startDate,
        endDate: input.endDate,

        expectedPeople:
          normalizeExpectedPeople(
            input.expectedPeople,
          ),

        billingType:
          input.billingType ?? "GROUP",

        defaultDiveUnitPrice:
          normalizeUnitPrice(
            input.defaultDiveUnitPrice,
          ),

        status: input.status ?? "ACTIVE",
        memo: input.memo ?? "",

        participants: [],
        trips: [],

        settlement:
          createDefaultSettlement(),

        payments: [],

        createdAt: now,
        updatedAt: now,
      };

      groupDives.push(groupDive);

      return normalizeGroupDive(groupDive);
    },

    async findAll(): Promise<GroupDive[]> {
      return sortGroupDives(
        groupDives,
      ).map(normalizeGroupDive);
    },

    async findById(
      id: string,
    ): Promise<GroupDive | null> {
      const groupDive = groupDives.find(
        (item) => item.id === id,
      );

      if (!groupDive) {
        return null;
      }

      return normalizeGroupDive(groupDive);
    },

    async update(
      id: string,
      input: GroupDiveUpdateInput,
    ): Promise<GroupDive | null> {
      const index = groupDives.findIndex(
        (item) => item.id === id,
      );

      if (index === -1) {
        return null;
      }

      const previous = normalizeGroupDive(
        groupDives[index],
      );

      const updated: GroupDive = {
        ...previous,

        groupName:
          input.groupName ??
          previous.groupName,

        representativeName:
          input.representativeName ??
          previous.representativeName,

        representativePhone:
          input.representativePhone ??
          previous.representativePhone,

        startDate:
          input.startDate ??
          previous.startDate,

        endDate:
          input.endDate ??
          previous.endDate,

        expectedPeople:
          typeof input.expectedPeople !==
          "undefined"
            ? normalizeExpectedPeople(
                input.expectedPeople,
              )
            : previous.expectedPeople,

        billingType:
          input.billingType ??
          previous.billingType,

        defaultDiveUnitPrice:
          typeof input.defaultDiveUnitPrice !==
          "undefined"
            ? normalizeUnitPrice(
                input.defaultDiveUnitPrice,
              )
            : previous.defaultDiveUnitPrice,

        status:
          input.status ?? previous.status,

        memo:
          input.memo ?? previous.memo,

        participants:
          typeof input.participants !==
          "undefined"
            ? input.participants
            : previous.participants,

        trips:
          typeof input.trips !== "undefined"
            ? input.trips
            : previous.trips,

        settlement:
          typeof input.settlement !==
          "undefined"
            ? normalizeSettlement(
                input.settlement,
              )
            : previous.settlement,

        payments:
          typeof input.payments !== "undefined"
            ? normalizePayments(
                input.payments,
                previous.id,
              )
            : previous.payments,

        updatedAt:
          new Date().toISOString(),
      };

      groupDives[index] = updated;

      return normalizeGroupDive(updated);
    },

    async delete(
      id: string,
    ): Promise<boolean> {
      const index = groupDives.findIndex(
        (item) => item.id === id,
      );

      if (index === -1) {
        return false;
      }

      groupDives.splice(index, 1);

      return true;
    },
  };
