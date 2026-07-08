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
  ReservationRepository,
  ReservationStatus,
} from "./types";

const TABLE_NAME =
  process.env.DYNAMODB_RESERVATIONS_TABLE || "sungsan-reservations";

function nowIso() {
  return new Date().toISOString();
}

export class DynamoReservationRepository implements ReservationRepository {
  async listReservations(): Promise<Reservation[]> {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    return ((result.Items || []) as Reservation[]).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    return (result.Item as Reservation) || null;
  }

  async createReservation(input: ReservationInput): Promise<Reservation> {
    const now = nowIso();

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      ...input,
      status: "pending",
      adminMemo: "",
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: reservation,
      })
    );

    return reservation;
  }

  async updateReservation(
    id: string,
    patch: Partial<Reservation>
  ): Promise<Reservation | null> {
    const current = await this.getReservationById(id);

    if (!current) {
      return null;
    }

    const updated: Reservation = {
      ...current,
      ...patch,
      id,
      updatedAt: nowIso(),
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updated,
      })
    );

    return updated;
  }

  async updateStatus(
    id: string,
    status: ReservationStatus
  ): Promise<Reservation | null> {
    return this.updateReservation(id, { status });
  }

  async updateAdminMemo(
    id: string,
    adminMemo: string
  ): Promise<Reservation | null> {
    return this.updateReservation(id, { adminMemo });
  }

  async deleteReservation(id: string): Promise<void> {
    await dynamoDb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );
  }
}