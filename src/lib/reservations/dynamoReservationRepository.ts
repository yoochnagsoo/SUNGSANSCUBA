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
      "(contains(#name, :keyword) OR contains(#email, :keyword) OR contains(#phone, :keyword) OR contains(#program, :keyword) OR contains(#reservationDate, :keyword) OR contains(#date, :keyword) OR contains(#experienceTime, :keyword))"
    );

    expressionAttributeNames["#name"] = "name";
    expressionAttributeNames["#email"] = "email";
    expressionAttributeNames["#phone"] = "phone";
    expressionAttributeNames["#program"] = "program";
    expressionAttributeNames["#reservationDate"] = "reservationDate";
    expressionAttributeNames["#date"] = "date";
    expressionAttributeNames["#experienceTime"] = "experienceTime";
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

export const dynamoReservationRepository = {
  async create(input: ReservationInput): Promise<Reservation> {
    const now = new Date().toISOString();
    const reservationDate = String(input.reservationDate ?? input.date ?? "");

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

      status: input.status ?? "PENDING",
      adminMemo: "",

      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: getTableName(),
        Item: reservation,
      })
    );

    return reservation;
  },

  async findAll(): Promise<Reservation[]> {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: getTableName(),
      })
    );

    const reservations = (result.Items ?? []) as Reservation[];

    return sortReservations(reservations);
  },

  async findPaginated(
    options: ReservationListOptions
  ): Promise<ReservationListResult> {
    const limit = normalizeLimit(options.limit);
    const filter = buildFilter(options);

    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: getTableName(),
        Limit: limit,
        ExclusiveStartKey: decodeCursor(options.cursor),
        ...filter,
      })
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
      })
    );

    if (!result.Item) {
      return null;
    }

    return result.Item as Reservation;
  },

  async update(
    id: string,
    input: ReservationUpdateInput
  ): Promise<Reservation | null> {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const updatedAt = new Date().toISOString();

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: getTableName(),
        Key: {
          id,
        },
        UpdateExpression:
          "SET #status = :status, adminMemo = :adminMemo, experienceTime = :experienceTime, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": input.status ?? current.status,
          ":adminMemo": input.adminMemo ?? current.adminMemo ?? "",
          ":experienceTime":
            input.experienceTime ?? current.experienceTime ?? "",
          ":updatedAt": updatedAt,
        },
        ReturnValues: "ALL_NEW",
      })
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
      })
    );

    return true;
  },
};