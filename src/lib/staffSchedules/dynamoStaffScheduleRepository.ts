import {
  DeleteCommand,
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

const TABLE_NAME =
  process.env.DYNAMODB_STAFF_SCHEDULES_TABLE;

function getTableName() {
  if (!TABLE_NAME) {
    throw new Error(
      "DYNAMODB_STAFF_SCHEDULES_TABLE is not set.",
    );
  }

  return TABLE_NAME;
}

function createId() {
  return crypto.randomUUID();
}

function sortStaffSchedules(
  items: StaffSchedule[],
) {
  return [...items].sort((a, b) => {
    const dateCompare =
      a.date.localeCompare(b.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const nameCompare =
      a.staffName.localeCompare(
        b.staffName,
      );

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return a.createdAt.localeCompare(
      b.createdAt,
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

function normalizeStaffSchedule(
  item: StaffSchedule,
): StaffSchedule {
  return {
    id: item.id,

    /*
     * 기존 데이터에는 staffId가 없을 수 있습니다.
     * 없는 경우 undefined로 유지해서 staffName 기반
     * 호환 처리가 가능하도록 합니다.
     */
    staffId:
      typeof item.staffId === "string" &&
      item.staffId.trim()
        ? item.staffId
            .trim()
            .toLowerCase()
        : undefined,

    staffName: item.staffName,
    type: item.type,
    date: item.date,
    endDate:
      item.endDate || undefined,
    memo: item.memo ?? "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function scanStaffScheduleById(
  id: string,
): Promise<StaffSchedule | null> {
  let lastEvaluatedKey:
    | Record<string, unknown>
    | undefined;

  do {
    const result =
      await dynamoDb.send(
        new ScanCommand({
          TableName: getTableName(),
          FilterExpression:
            "#id = :id",
          ExpressionAttributeNames: {
            "#id": "id",
          },
          ExpressionAttributeValues: {
            ":id": id,
          },
          ExclusiveStartKey:
            lastEvaluatedKey,
        }),
      );

    const item = result.Items?.[0] as
      | StaffSchedule
      | undefined;

    if (item) {
      return normalizeStaffSchedule(
        item,
      );
    }

    lastEvaluatedKey =
      result.LastEvaluatedKey as
        | Record<string, unknown>
        | undefined;
  } while (lastEvaluatedKey);

  return null;
}

export const dynamoStaffScheduleRepository: StaffScheduleRepository =
  {
    async list(): Promise<
      StaffSchedule[]
    > {
      const staffSchedules: StaffSchedule[] =
        [];

      let lastEvaluatedKey:
        | Record<string, unknown>
        | undefined;

      do {
        const result =
          await dynamoDb.send(
            new ScanCommand({
              TableName:
                getTableName(),
              ExclusiveStartKey:
                lastEvaluatedKey,
            }),
          );

        const items = (
          (result.Items ??
            []) as StaffSchedule[]
        ).map(
          normalizeStaffSchedule,
        );

        staffSchedules.push(
          ...items,
        );

        lastEvaluatedKey =
          result.LastEvaluatedKey as
            | Record<string, unknown>
            | undefined;
      } while (lastEvaluatedKey);

      return sortStaffSchedules(
        staffSchedules,
      );
    },

    async create(
      input: StaffScheduleInput,
    ): Promise<StaffSchedule> {
      const now =
        new Date().toISOString();

      const staffSchedule: StaffSchedule =
        {
          id: createId(),
          staffId:
            input.staffId
              .trim()
              .toLowerCase(),
          staffName:
            input.staffName.trim(),
          type: input.type,
          date: input.date,
          endDate:
            input.endDate ||
            undefined,
          memo: input.memo ?? "",
          createdAt: now,
          updatedAt: now,
        };

      const item =
        removeUndefinedValues(
          staffSchedule as unknown as Record<
            string,
            unknown
          >,
        );

      await dynamoDb.send(
        new PutCommand({
          TableName: getTableName(),
          Item: item,
        }),
      );

      return staffSchedule;
    },

    async update(
      id: string,
      input: StaffScheduleUpdateInput,
    ): Promise<StaffSchedule | null> {
      const current =
        await scanStaffScheduleById(
          id,
        );

      if (!current) {
        return null;
      }

      const updatedAt =
        new Date().toISOString();

      const updateValues =
        removeUndefinedValues({
          staffId:
            typeof input.staffId ===
              "string" &&
            input.staffId.trim()
              ? input.staffId
                  .trim()
                  .toLowerCase()
              : undefined,

          staffName:
            typeof input.staffName ===
              "string" &&
            input.staffName.trim()
              ? input.staffName.trim()
              : undefined,

          type: input.type,
          date: input.date,

          endDate:
            typeof input.endDate ===
              "string" &&
            input.endDate.trim() !==
              ""
              ? input.endDate
              : undefined,

          memo:
            typeof input.memo ===
            "string"
              ? input.memo
              : current.memo,

          updatedAt,
        });

      const expressionAttributeNames: Record<
        string,
        string
      > = {};

      const expressionAttributeValues: Record<
        string,
        unknown
      > = {};

      const setExpressionParts: string[] =
        [];

      const removeExpressionParts: string[] =
        [];

      for (const [
        key,
        value,
      ] of Object.entries(
        updateValues,
      )) {
        expressionAttributeNames[
          `#${key}`
        ] = key;

        expressionAttributeValues[
          `:${key}`
        ] = value;

        setExpressionParts.push(
          `#${key} = :${key}`,
        );
      }

      if (
        typeof input.endDate ===
          "string" &&
        input.endDate.trim() === ""
      ) {
        expressionAttributeNames[
          "#endDate"
        ] = "endDate";

        removeExpressionParts.push(
          "#endDate",
        );
      }

      const updateExpression = [
        setExpressionParts.length > 0
          ? `SET ${setExpressionParts.join(
              ", ",
            )}`
          : "",

        removeExpressionParts.length >
        0
          ? `REMOVE ${removeExpressionParts.join(
              ", ",
            )}`
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      if (!updateExpression) {
        return current;
      }

      const result =
        await dynamoDb.send(
          new UpdateCommand({
            TableName:
              getTableName(),

            Key: {
              id,
            },

            UpdateExpression:
              updateExpression,

            ExpressionAttributeNames:
              Object.keys(
                expressionAttributeNames,
              ).length > 0
                ? expressionAttributeNames
                : undefined,

            ExpressionAttributeValues:
              Object.keys(
                expressionAttributeValues,
              ).length > 0
                ? expressionAttributeValues
                : undefined,

            ReturnValues: "ALL_NEW",
          }),
        );

      if (!result.Attributes) {
        return null;
      }

      return normalizeStaffSchedule(
        result.Attributes as StaffSchedule,
      );
    },

    async delete(
      id: string,
    ): Promise<boolean> {
      const current =
        await scanStaffScheduleById(
          id,
        );

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