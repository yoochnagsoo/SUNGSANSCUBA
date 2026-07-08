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

    return reservations.sort((a, b) => {
      return b.createdAt.localeCompare(a.createdAt);
    });
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
          "SET #status = :status, adminMemo = :adminMemo, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": input.status ?? current.status,
          ":adminMemo": input.adminMemo ?? current.adminMemo ?? "",
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