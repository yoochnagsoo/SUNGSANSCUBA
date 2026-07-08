import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";
import type {
  StaffSchedule,
  StaffScheduleInput,
  StaffScheduleRepository,
  StaffScheduleUpdateInput,
} from "./types";

const TABLE_NAME = process.env.DYNAMODB_STAFF_SCHEDULES_TABLE;

function getTableName() {
  if (!TABLE_NAME) {
    throw new Error("DYNAMODB_STAFF_SCHEDULES_TABLE is not set.");
  }

  return TABLE_NAME;
}

function createId() {
  return crypto.randomUUID();
}

function sortStaffSchedules(items: StaffSchedule[]) {
  return [...items].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const nameCompare = a.staffName.localeCompare(b.staffName);

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

function removeUndefinedValues(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value !== "undefined"),
  );
}

export const dynamoStaffScheduleRepository: StaffScheduleRepository = {
  async create(input: StaffScheduleInput): Promise<StaffSchedule> {
    const now = new Date().toISOString();

    const staffSchedule: StaffSchedule = {
      id: createId(),
      staffName: input.staffName,
      type: input.type,
      date: input.date,
      endDate: input.endDate || undefined,
      memo: input.memo ?? "",
      createdAt: now,
      updatedAt: now,
    };

    const item = removeUndefinedValues(
      staffSchedule as unknown as Record<string, unknown>,
    );

    await dynamoDb.send(
      new PutCommand({
        TableName: getTableName(),
        Item: item,
      }),
    );

    return staffSchedule;
  },

  async findAll(): Promise<StaffSchedule[]> {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: getTableName(),
      }),
    );

    const staffSchedules = (result.Items ?? []) as StaffSchedule[];

    return sortStaffSchedules(staffSchedules);
  },

  async findById(id: string): Promise<StaffSchedule | null> {
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

    return result.Item as StaffSchedule;
  },

  async update(
    id: string,
    input: StaffScheduleUpdateInput,
  ): Promise<StaffSchedule | null> {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const updatedAt = new Date().toISOString();

    const updateValues = removeUndefinedValues({
      staffName: input.staffName,
      type: input.type,
      date: input.date,
      endDate: input.endDate || undefined,
      memo: typeof input.memo === "string" ? input.memo : current.memo,
      updatedAt,
    });

    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};
    const setExpressionParts: string[] = [];
    const removeExpressionParts: string[] = [];

    for (const [key, value] of Object.entries(updateValues)) {
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
      setExpressionParts.push(`#${key} = :${key}`);
    }

    if (typeof input.endDate === "string" && input.endDate.trim() === "") {
      expressionAttributeNames["#endDate"] = "endDate";
      removeExpressionParts.push("#endDate");
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

    return result.Attributes as StaffSchedule;
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