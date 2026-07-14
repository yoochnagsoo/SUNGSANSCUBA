import { randomUUID } from "crypto";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import { discoverScubaFish } from "@/data/discoverScuba";
import { dynamoDb } from "@/lib/aws/dynamodb";
import type {
  DiscoverScubaFish,
  DiscoverScubaFishInput,
  DiscoverScubaFishRepository,
} from "./types";

const tableName = process.env.DYNAMODB_DISCOVER_SCUBA_FISH_TABLE;

export function isDiscoverScubaFishTableConfigured() {
  return Boolean(tableName);
}

function assertTableName() {
  if (!tableName) {
    throw new Error(
      "DYNAMODB_DISCOVER_SCUBA_FISH_TABLE 환경변수가 설정되지 않았습니다.",
    );
  }

  return tableName;
}

function normalizeFish(item: Partial<DiscoverScubaFish>): DiscoverScubaFish {
  const now = new Date().toISOString();

  return {
    id: String(item.id ?? randomUUID()),
    name: String(item.name ?? ""),
    description: String(item.description ?? ""),
    imageUrl: String(item.imageUrl ?? ""),
    sortOrder:
      typeof item.sortOrder === "number"
        ? item.sortOrder
        : Number(item.sortOrder ?? 0),
    isActive: item.isActive !== false,
    createdAt: String(item.createdAt ?? now),
    updatedAt: String(item.updatedAt ?? now),
  };
}

function sortFish(items: DiscoverScubaFish[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name);
  });
}

export function getDefaultDiscoverScubaFish(): DiscoverScubaFish[] {
  const now = new Date().toISOString();

  return sortFish(
    discoverScubaFish.map((fish, index) => ({
      id: fish.id,
      name: fish.name,
      description: fish.description,
      imageUrl: fish.imageUrl ?? "",
      sortOrder: fish.sortOrder ?? (index + 1) * 10,
      isActive: fish.isActive !== false,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export const discoverScubaFishRepository: DiscoverScubaFishRepository = {
  async list() {
    const response = await dynamoDb.send(
      new ScanCommand({
        TableName: assertTableName(),
      }),
    );

    const items = (response.Items ?? []).map((item) =>
      normalizeFish(item as Partial<DiscoverScubaFish>),
    );

    return sortFish(items);
  },

  async listActive() {
    const items = await this.list();

    return items.filter((item) => item.isActive);
  },

  async getById(id: string) {
    const response = await dynamoDb.send(
      new GetCommand({
        TableName: assertTableName(),
        Key: {
          id,
        },
      }),
    );

    if (!response.Item) {
      return null;
    }

    return normalizeFish(response.Item as Partial<DiscoverScubaFish>);
  },

  async create(input: DiscoverScubaFishInput) {
    const now = new Date().toISOString();

    const fish: DiscoverScubaFish = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: assertTableName(),
        Item: fish,
      }),
    );

    return fish;
  },

  async update(id: string, input: Partial<DiscoverScubaFishInput>) {
    const current = await this.getById(id);

    if (!current) {
      return null;
    }

    const updated: DiscoverScubaFish = {
      ...current,
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      sortOrder:
        typeof input.sortOrder === "number"
          ? input.sortOrder
          : current.sortOrder,
      isActive:
        typeof input.isActive === "boolean" ? input.isActive : current.isActive,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: assertTableName(),
        Item: updated,
      }),
    );

    return updated;
  },

  async delete(id: string) {
    await dynamoDb.send(
      new DeleteCommand({
        TableName: assertTableName(),
        Key: {
          id,
        },
      }),
    );

    return true;
  },
};
