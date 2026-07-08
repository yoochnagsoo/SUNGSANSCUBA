import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "@/lib/aws/dynamodb";
import type {
  Reservation,
  ReservationInput,
  ReservationListOptions,
  ReservationListResult,
  ReservationUpdateInput,
} from "./types";

const TABLE_NAME = process.env.DYNAMODB_RESERVATIONS_TABLE;

function getTableName() {
  if (!TABLE_NAME) {
    throw new Error("DYNAMODB_RESERVATIONS_TABLE is not set.");
  }

  return TABLE_NAME;
}

function createId() {
  return crypto.randomUUID();
}

function normalizeLimit(limit?: number) {
  if (!limit || !Number.isFinite(limit)) {
    return 50;
  }

  return Math.min(Math.max(Math.floor(limit), 1), 100);
}

function encodeCursor(value: Record<string, unknown> | undefined) {
  if (!value) {
    return undefined;
  }

  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeCursor(cursor?: string) {
  if (!cursor) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as
      | Record<string, unknown>
      | undefined;
  } catch {
    return undefined;
  }
}

function sortReservations(reservations: Reservation[]) {
  return [...reservations].sort((a, b) => {
    const createdAtCompare = b.createdAt.localeCompare(a.createdAt);

    if (createdAtCompare !== 0) {
      return createdAtCompare;
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function buildFilter(options: ReservationListOptions) {
  const expressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, string> = {};

  if (options.status && options.status !== "ALL") {
    expressions.push("#status = :status");
    expressionAttributeNames["#status"] = "status";
    expressionAttributeValues[":status"] = options.status;
  }

  const keyword = options.keyword?.trim();

  if (keyword) {
    expressions.push(
      "(contains(#name, :keyword) OR contains(#email, :keyword) OR contains(#phone, :keyword) OR contains(#program, :keyword) OR contains(#reservationDate, :keyword) OR contains(#date, :keyword) OR contains(#experienceTime, :keyword) OR contains(#paymentMethod, :keyword) OR contains(#paymentMemo, :keyword))",
    );

    expressionAttributeNames["#name"] = "name";
    expressionAttributeNames["#email"] = "email";
    expressionAttributeNames["#phone"] = "phone";
    expressionAttributeNames["#program"] = "program";
    expressionAttributeNames["#reservationDate"] = "reservationDate";
    expressionAttributeNames["#date"] = "date";
    expressionAttributeNames["#experienceTime"] = "experienceTime";
    expressionAttributeNames["#paymentMethod"] = "paymentMethod";
    expressionAttributeNames["#paymentMemo"] = "paymentMemo";
    expressionAttributeValues[":keyword"] = keyword;
  }

  if (expressions.length === 0) {
    return {};
  }

  return {
    FilterExpression: expressions.join(" AND "),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };
}

function removeUndefinedValues(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value !== "undefined"),
  );
}

export const dynamoReservationRepository = {
  async create(input: ReservationInput): Promise<Reservation> {
    const now = new Date().toISOString();
    const reservationDate = String(input.reservationDate ?? input.date ?? "");
    const status = input.status ?? "PENDING";

    const reservation: Reservation = {
      id: createId(),

      name: input.name,
      email: input.email,
      phone: input.phone,
      program: input.program,

      reservationDate,
      date: reservationDate,

      experienceTime: input.experienceTime ?? "",

      people: input.people,
      message: input.message ?? "",

      status,
      adminMemo: input.adminMemo ?? "",

      paymentAmount: status === "COMPLETED" ? input.paymentAmount : undefined,
      paymentMethod: status === "COMPLETED" ? input.paymentMethod : undefined,
      paymentMemo: status === "COMPLETED" ? input.paymentMemo ?? "" : "",
      completedAt: status === "COMPLETED" ? input.completedAt : undefined,

      createdAt: now,
      updatedAt: now,
    };

    const item = removeUndefinedValues(
      reservation as unknown as Record<string, unknown>,
    );

    await dynamoDb.send(
      new PutCommand({
        TableName: getTableName(),
        Item: item,
      }),
    );

    return reservation;
  },

  async findAll(): Promise<Reservation[]> {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: getTableName(),
      }),
    );

    const reservations = (result.Items ?? []) as Reservation[];

    return sortReservations(reservations);
  },

  async findPaginated(
    options: ReservationListOptions,
  ): Promise<ReservationListResult> {
    const limit = normalizeLimit(options.limit);
    const filter = buildFilter(options);

    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: getTableName(),
        Limit: limit,
        ExclusiveStartKey: decodeCursor(options.cursor),
        ...filter,
      }),
    );

    const reservations = sortReservations((result.Items ?? []) as Reservation[]);

    return {
      reservations,
      nextCursor: encodeCursor(result.LastEvaluatedKey),
    };
  },

  async findById(id: string): Promise<Reservation | null> {
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

    return result.Item as Reservation;
  },

  async update(
    id: string,
    input: ReservationUpdateInput,
  ): Promise<Reservation | null> {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const updatedAt = new Date().toISOString();

    const nextReservationDate =
      input.reservationDate ??
      input.date ??
      current.reservationDate ??
      current.date ??
      "";

    const nextStatus = input.status ?? current.status;

    const updateValues = removeUndefinedValues({
      name: input.name,
      email: input.email,
      phone: input.phone,
      program: input.program,

      reservationDate: nextReservationDate,
      date: nextReservationDate,

      people:
        typeof input.people !== "undefined"
          ? Number(input.people)
          : current.people,

      message: input.message,
      status: nextStatus,
      adminMemo: input.adminMemo ?? current.adminMemo ?? "",
      experienceTime: input.experienceTime ?? current.experienceTime ?? "",
      updatedAt,
    });

    if (nextStatus === "COMPLETED") {
      Object.assign(
        updateValues,
        removeUndefinedValues({
          paymentAmount:
            typeof input.paymentAmount !== "undefined"
              ? Number(input.paymentAmount)
              : current.paymentAmount,
          paymentMethod: input.paymentMethod ?? current.paymentMethod,
          paymentMemo: input.paymentMemo ?? current.paymentMemo ?? "",
          completedAt: input.completedAt ?? current.completedAt,
        }),
      );
    }

    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};
    const setExpressionParts: string[] = [];
    const removeExpressionParts: string[] = [];

    for (const [key, value] of Object.entries(updateValues)) {
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
      setExpressionParts.push(`#${key} = :${key}`);
    }

    if (nextStatus !== "COMPLETED") {
      const removeKeys = [
        "paymentAmount",
        "paymentMethod",
        "paymentMemo",
        "completedAt",
      ];

      for (const key of removeKeys) {
        expressionAttributeNames[`#${key}`] = key;
        removeExpressionParts.push(`#${key}`);
      }
    }

    const updateExpression = [
      setExpressionParts.length > 0
        ? `SET ${setExpressionParts.join(", ")}`
        : "",
      removeExpressionParts.length > 0
        ? `REMOVE ${removeExpressionParts.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: getTableName(),
        Key: {
          id,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    if (!result.Attributes) {
      return null;
    }

    return result.Attributes as Reservation;
  },

  async delete(id: string): Promise<boolean> {
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