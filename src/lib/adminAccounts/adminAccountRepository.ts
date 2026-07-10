import {
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import type {
  AdminAccountRecord,
  AdminRole,
} from "@/lib/adminAccounts";
import { dynamoDb } from "@/lib/aws/dynamodb";
import { normalizeAdminMenuPermissions } from "@/lib/adminPermissions";

function getTableName() {
  const tableName =
    process.env.DYNAMODB_ADMIN_ACCOUNTS_TABLE;

  if (!tableName) {
    throw new Error(
      "DYNAMODB_ADMIN_ACCOUNTS_TABLE 환경변수가 설정되지 않았습니다.",
    );
  }

  return tableName;
}

function normalizeAdminId(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isAdminRole(
  value: unknown,
): value is AdminRole {
  return (
    value === "OWNER" ||
    value === "MANAGER" ||
    value === "STAFF"
  );
}

function normalizeRecord(
  value: unknown,
): AdminAccountRecord | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Partial<AdminAccountRecord>;

  const id = normalizeAdminId(item.id);
  const name = String(item.name ?? "").trim();
  const passwordHash = String(item.passwordHash ?? "");

  const role = isAdminRole(item.role)
    ? item.role
    : null;

  const active =
    typeof item.active === "boolean"
      ? item.active
      : true;

  if (!id || !name || !passwordHash || !role) {
    return null;
  }

  return {
    id,
    name,
    passwordHash,
    role,
    active,
    menuPermissions: normalizeAdminMenuPermissions(
      item.menuPermissions,
      role,
    ),
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : undefined,
    updatedAt:
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : undefined,
  };
}

export async function listAdminAccountRecords(): Promise<
  AdminAccountRecord[]
> {
  const records: AdminAccountRecord[] = [];

  let exclusiveStartKey:
    | Record<string, unknown>
    | undefined;

  do {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: getTableName(),
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    for (const item of result.Items || []) {
      const account = normalizeRecord(item);

      if (account) {
        records.push(account);
      }
    }

    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return records.sort((a, b) => {
    if (a.role !== b.role) {
      const roleOrder: Record<AdminRole, number> = {
        OWNER: 0,
        MANAGER: 1,
        STAFF: 2,
      };

      return roleOrder[a.role] - roleOrder[b.role];
    }

    return a.name.localeCompare(b.name, "ko");
  });
}

export async function getAdminAccountRecordById(
  adminId: unknown,
): Promise<AdminAccountRecord | null> {
  const id = normalizeAdminId(adminId);

  if (!id) {
    return null;
  }

  const result = await dynamoDb.send(
    new GetCommand({
      TableName: getTableName(),
      Key: {
        id,
      },
      ConsistentRead: true,
    }),
  );

  return normalizeRecord(result.Item);
}

export async function putAdminAccountRecord(
  account: AdminAccountRecord,
  options?: {
    onlyIfNotExists?: boolean;
    onlyIfExists?: boolean;
  },
) {
  let conditionExpression: string | undefined;

  if (options?.onlyIfNotExists) {
    conditionExpression = "attribute_not_exists(id)";
  }

  if (options?.onlyIfExists) {
    conditionExpression = "attribute_exists(id)";
  }

  await dynamoDb.send(
    new PutCommand({
      TableName: getTableName(),
      Item: account,
      ConditionExpression: conditionExpression,
    }),
  );

  return account;
}