import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";

import type {
  GroupDive,
  GroupDiveBillingType,
  GroupDiveInput,
  GroupDiveParticipant,
  GroupDivePayment,
  GroupDivePaymentMethod,
  GroupDivePaymentStatus,
  GroupDiveRepository,
  GroupDiveSettlement,
  GroupDiveSettlementStatus,
  GroupDiveStatus,
  GroupDiveTrip,
  GroupDiveUpdateInput,
} from "./types";

const TABLE_NAME =
  process.env.DYNAMODB_GROUP_DIVES_TABLE;

function getTableName() {
  if (!TABLE_NAME) {
    throw new Error(
      "DYNAMODB_GROUP_DIVES_TABLE is not set.",
    );
  }

  return TABLE_NAME;
}

function createId() {
  return crypto.randomUUID();
}

function normalizeBillingType(
  value: unknown,
): GroupDiveBillingType {
  if (value === "INDIVIDUAL") {
    return "INDIVIDUAL";
  }

  return "GROUP";
}

function normalizeStatus(
  value: unknown,
): GroupDiveStatus {
  if (value === "COMPLETED") {
    return "COMPLETED";
  }

  if (value === "CANCELLED") {
    return "CANCELLED";
  }

  return "ACTIVE";
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

function normalizeParticipants(
  value: unknown,
): GroupDiveParticipant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as GroupDiveParticipant[];
}

function normalizeTrips(
  value: unknown,
): GroupDiveTrip[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as GroupDiveTrip[];
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

function normalizeGroupDive(
  item: Partial<GroupDive>,
): GroupDive {
  const createdAt = String(
    item.createdAt ??
      new Date().toISOString(),
  );

  const updatedAt = String(
    item.updatedAt ?? createdAt,
  );

  const id = String(
    item.id ?? createId(),
  );

  return {
    id,

    groupName: String(
      item.groupName ?? "",
    ),

    representativeName: String(
      item.representativeName ?? "",
    ),

    representativePhone: String(
      item.representativePhone ?? "",
    ),

    startDate: String(
      item.startDate ?? "",
    ),

    endDate: String(
      item.endDate ?? "",
    ),

    expectedPeople:
      normalizeExpectedPeople(
        item.expectedPeople,
      ),

    billingType: normalizeBillingType(
      item.billingType,
    ),

    defaultDiveUnitPrice:
      normalizeUnitPrice(
        item.defaultDiveUnitPrice,
      ),

    status: normalizeStatus(
      item.status,
    ),

    memo: String(item.memo ?? ""),

    participants:
      normalizeParticipants(
        item.participants,
      ),

    trips: normalizeTrips(
      item.trips,
    ),

    settlement:
      normalizeSettlement(
        item.settlement,
      ),

    payments: normalizePayments(
      item.payments,
      id,
    ),

    createdAt,
    updatedAt,
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

function removeUndefinedValues(
  input: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) =>
        typeof value !== "undefined",
    ),
  );
}

function prepareSettlementForStorage(
  settlement: GroupDiveSettlement,
) {
  return removeUndefinedValues({
    additionalAmount:
      settlement.additionalAmount,

    discountAmount:
      settlement.discountAmount,

    paidAmount:
      settlement.paidAmount,

    status: settlement.status,

    paymentMethod:
      settlement.paymentMethod,

    settledAt:
      settlement.settledAt,

    memo: settlement.memo,

    updatedAt:
      settlement.updatedAt,
  });
}

function preparePaymentForStorage(
  payment: GroupDivePayment,
) {
  return removeUndefinedValues({
    id: payment.id,

    groupDiveId:
      payment.groupDiveId,

    amount: payment.amount,

    paymentMethod:
      payment.paymentMethod,

    paidAt: payment.paidAt,

    processedById:
      payment.processedById,

    processedByName:
      payment.processedByName,

    memo: payment.memo,

    status: payment.status,

    cancelledAt:
      payment.cancelledAt,

    cancelledById:
      payment.cancelledById,

    cancelledByName:
      payment.cancelledByName,

    cancelReason:
      payment.cancelReason,

    createdAt:
      payment.createdAt,

    updatedAt:
      payment.updatedAt,
  });
}

function prepareGroupDiveForStorage(
  groupDive: GroupDive,
) {
  return removeUndefinedValues({
    ...groupDive,

    settlement:
      prepareSettlementForStorage(
        groupDive.settlement,
      ),

    payments: groupDive.payments.map(
      preparePaymentForStorage,
    ),
  });
}

export const dynamoGroupDiveRepository: GroupDiveRepository =
  {
    async create(
      input: GroupDiveInput,
    ): Promise<GroupDive> {
      const now = new Date().toISOString();

      const groupDive: GroupDive = {
        id: createId(),

        groupName:
          input.groupName,

        representativeName:
          input.representativeName,

        representativePhone:
          input.representativePhone ?? "",

        startDate:
          input.startDate,

        endDate:
          input.endDate,

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

        status:
          input.status ?? "ACTIVE",

        memo:
          input.memo ?? "",

        participants: [],
        trips: [],

        settlement:
          createDefaultSettlement(),

        payments: [],

        createdAt: now,
        updatedAt: now,
      };

      await dynamoDb.send(
        new PutCommand({
          TableName:
            getTableName(),

          Item:
            prepareGroupDiveForStorage(
              groupDive,
            ),
        }),
      );

      return groupDive;
    },

    async findAll(): Promise<GroupDive[]> {
      const result =
        await dynamoDb.send(
          new ScanCommand({
            TableName:
              getTableName(),
          }),
        );

      const groupDives = (
        result.Items ?? []
      ).map((item) =>
        normalizeGroupDive(
          item as Partial<GroupDive>,
        ),
      );

      return sortGroupDives(
        groupDives,
      );
    },

    async findById(
      id: string,
    ): Promise<GroupDive | null> {
      const result =
        await dynamoDb.send(
          new GetCommand({
            TableName:
              getTableName(),

            Key: {
              id,
            },
          }),
        );

      if (!result.Item) {
        return null;
      }

      return normalizeGroupDive(
        result.Item as Partial<GroupDive>,
      );
    },

    async update(
      id: string,
      input: GroupDiveUpdateInput,
    ): Promise<GroupDive | null> {
      const current =
        await this.findById(id);

      if (!current) {
        return null;
      }

      const updated: GroupDive = {
        ...current,

        groupName:
          input.groupName ??
          current.groupName,

        representativeName:
          input.representativeName ??
          current.representativeName,

        representativePhone:
          input.representativePhone ??
          current.representativePhone,

        startDate:
          input.startDate ??
          current.startDate,

        endDate:
          input.endDate ??
          current.endDate,

        expectedPeople:
          typeof input.expectedPeople !==
          "undefined"
            ? normalizeExpectedPeople(
                input.expectedPeople,
              )
            : current.expectedPeople,

        billingType:
          input.billingType ??
          current.billingType,

        defaultDiveUnitPrice:
          typeof input.defaultDiveUnitPrice !==
          "undefined"
            ? normalizeUnitPrice(
                input.defaultDiveUnitPrice,
              )
            : current.defaultDiveUnitPrice,

        status:
          input.status ??
          current.status,

        memo:
          input.memo ??
          current.memo,

        participants:
          typeof input.participants !==
          "undefined"
            ? input.participants
            : current.participants,

        trips:
          typeof input.trips !==
          "undefined"
            ? input.trips
            : current.trips,

        settlement:
          typeof input.settlement !==
          "undefined"
            ? normalizeSettlement(
                input.settlement,
              )
            : current.settlement,

        payments:
          typeof input.payments !==
          "undefined"
            ? normalizePayments(
                input.payments,
                current.id,
              )
            : current.payments,

        updatedAt:
          new Date().toISOString(),
      };

      await dynamoDb.send(
        new PutCommand({
          TableName:
            getTableName(),

          Item:
            prepareGroupDiveForStorage(
              updated,
            ),
        }),
      );

      return updated;
    },

    async delete(
      id: string,
    ): Promise<boolean> {
      const current =
        await this.findById(id);

      if (!current) {
        return false;
      }

      await dynamoDb.send(
        new DeleteCommand({
          TableName:
            getTableName(),

          Key: {
            id,
          },
        }),
      );

      return true;
    },
  };