import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";

import type {
  BoatSchedule,
  BoatScheduleInput,
  BoatScheduleRepository,
  BoatScheduleStatus,
  BoatScheduleUpdateInput,
} from "./types";

const TABLE_NAME =
  process.env.DYNAMODB_BOAT_SCHEDULES_TABLE;

function getTableName() {
  if (!TABLE_NAME) {
    throw new Error(
      "DYNAMODB_BOAT_SCHEDULES_TABLE is not set.",
    );
  }

  return TABLE_NAME;
}

function createId() {
  return crypto.randomUUID();
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizePassengerCapacity(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 11;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), 11);
}

function normalizeStatus(value: unknown): BoatScheduleStatus {
  if (
    value === "BOARDING" ||
    value === "DEPARTED" ||
    value === "COMPLETED" ||
    value === "CANCELLED" ||
    value === "WEATHER_CANCELLED"
  ) {
    return value;
  }

  return "SCHEDULED";
}

function normalizeSchedule(
  item: Partial<BoatSchedule>,
): BoatSchedule {
  const now = new Date().toISOString();

  return {
    id: normalizeText(item.id),

    date: normalizeText(item.date),
    departureTime: normalizeText(item.departureTime),

    boatName: normalizeText(item.boatName) || "SUNG SAN SCUBA",
    plannedPointName: normalizeText(item.plannedPointName),
    actualPointName: normalizeText(item.actualPointName),

    passengerCapacity: normalizePassengerCapacity(
      item.passengerCapacity,
    ),

    status: normalizeStatus(item.status),
    memo: normalizeText(item.memo),

    createdAt: normalizeText(item.createdAt) || now,
    updatedAt:
      normalizeText(item.updatedAt) ||
      normalizeText(item.createdAt) ||
      now,
  };
}

function sortSchedules(items: BoatSchedule[]) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    if (a.departureTime !== b.departureTime) {
      return a.departureTime.localeCompare(b.departureTime);
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export const dynamoBoatScheduleRepository: BoatScheduleRepository = {
  async create(input: BoatScheduleInput) {
    const now = new Date().toISOString();

    const schedule: BoatSchedule = {
      id: createId(),

      date: input.date,
      departureTime: input.departureTime,

      boatName: input.boatName ?? "SUNG SAN SCUBA",
      plannedPointName: input.plannedPointName ?? "",
      actualPointName: input.actualPointName ?? "",

      passengerCapacity: normalizePassengerCapacity(
        input.passengerCapacity,
      ),

      status: input.status ?? "SCHEDULED",
      memo: input.memo ?? "",

      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: getTableName(),
        Item: schedule,
      }),
    );

    return schedule;
  },

  async findAll() {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: getTableName(),
      }),
    );

    return sortSchedules(
      (result.Items ?? []).map((item) =>
        normalizeSchedule(item as Partial<BoatSchedule>),
      ),
    );
  },

  async findById(id: string) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: getTableName(),
        Key: {
          id,
        },
      }),
    );

    if (!result.Item) {
      return null;
    }

    return normalizeSchedule(
      result.Item as Partial<BoatSchedule>,
    );
  },

  async update(id: string, input: BoatScheduleUpdateInput) {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const updated: BoatSchedule = {
      ...current,

      date: input.date ?? current.date,
      departureTime:
        input.departureTime ?? current.departureTime,

      boatName: input.boatName ?? current.boatName,
      plannedPointName:
        input.plannedPointName ?? current.plannedPointName,
      actualPointName:
        input.actualPointName ?? current.actualPointName,

      passengerCapacity:
        typeof input.passengerCapacity !== "undefined"
          ? normalizePassengerCapacity(input.passengerCapacity)
          : current.passengerCapacity,

      status: input.status ?? current.status,
      memo: input.memo ?? current.memo,

      updatedAt: new Date().toISOString(),
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: getTableName(),
        Item: updated,
      }),
    );

    return updated;
  },

  async delete(id: string) {
    const current = await this.findById(id);

    if (!current) {
      return false;
    }

    await dynamoDb.send(
      new DeleteCommand({
        TableName: getTableName(),
        Key: {
          id,
        },
      }),
    );

    return true;
  },
};
