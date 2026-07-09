import { randomUUID } from "crypto";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";
import type {
  DiveDestination,
  DiveDestinationInput,
  DiveDestinationRepository,
  DiveDestinationWaterTemperature,
} from "./types";

const tableName = process.env.DYNAMODB_DIVE_DESTINATIONS_TABLE;

const defaultWaterTemperatures: DiveDestinationWaterTemperature[] = [
  {
    season: "봄",
    months: "3~5월",
    temperature: "14~18°C",
  },
  {
    season: "여름",
    months: "6~8월",
    temperature: "20~27°C",
  },
  {
    season: "가을",
    months: "9~11월",
    temperature: "19~25°C",
  },
  {
    season: "겨울",
    months: "12~2월",
    temperature: "13~16°C",
  },
];

function assertTableName() {
  if (!tableName) {
    throw new Error(
      "DYNAMODB_DIVE_DESTINATIONS_TABLE 환경변수가 설정되지 않았습니다."
    );
  }

  return tableName;
}

function normalizeWaterTemperatures(
  value: unknown
): DiveDestinationWaterTemperature[] {
  if (!Array.isArray(value)) {
    return defaultWaterTemperatures;
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;

      return {
        season: String(data.season ?? "").trim(),
        months: String(data.months ?? "").trim(),
        temperature: String(data.temperature ?? "").trim(),
      };
    })
    .filter(
      (item): item is DiveDestinationWaterTemperature =>
        !!item && !!item.season && !!item.temperature
    );

  return items.length > 0 ? items : defaultWaterTemperatures;
}

function normalizeDestination(item: Partial<DiveDestination>): DiveDestination {
  const now = new Date().toISOString();

  return {
    id: String(item.id ?? randomUUID()),
    title: String(item.title ?? ""),
    subtitle: String(item.subtitle ?? ""),
    description: String(item.description ?? ""),
    imageUrls: Array.isArray(item.imageUrls)
      ? item.imageUrls.map(String).filter(Boolean)
      : [],
    depth: String(item.depth ?? ""),
    level: String(item.level ?? ""),
    highlights: Array.isArray(item.highlights)
      ? item.highlights.map(String).filter(Boolean)
      : [],
    waterTemperatures: normalizeWaterTemperatures(item.waterTemperatures),
    sortOrder:
      typeof item.sortOrder === "number"
        ? item.sortOrder
        : Number(item.sortOrder ?? 0),
    isActive: item.isActive !== false,
    createdAt: String(item.createdAt ?? now),
    updatedAt: String(item.updatedAt ?? now),
  };
}

function sortDestinations(items: DiveDestination[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export const diveDestinationRepository: DiveDestinationRepository = {
  async list() {
    const response = await dynamoDb.send(
      new ScanCommand({
        TableName: assertTableName(),
      })
    );

    const items = (response.Items ?? []).map((item) =>
      normalizeDestination(item as Partial<DiveDestination>)
    );

    return sortDestinations(items);
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
      })
    );

    if (!response.Item) {
      return null;
    }

    return normalizeDestination(response.Item as Partial<DiveDestination>);
  },

  async create(input: DiveDestinationInput) {
    const now = new Date().toISOString();

    const destination: DiveDestination = {
      id: randomUUID(),
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      imageUrls: input.imageUrls,
      depth: input.depth,
      level: input.level,
      highlights: input.highlights,
      waterTemperatures: input.waterTemperatures,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: assertTableName(),
        Item: destination,
      })
    );

    return destination;
  },

  async update(id: string, input: Partial<DiveDestinationInput>) {
    const current = await this.getById(id);

    if (!current) {
      return null;
    }

    const updated: DiveDestination = {
      ...current,
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      imageUrls: Array.isArray(input.imageUrls)
        ? input.imageUrls
        : current.imageUrls,
      highlights: Array.isArray(input.highlights)
        ? input.highlights
        : current.highlights,
      waterTemperatures: Array.isArray(input.waterTemperatures)
        ? input.waterTemperatures
        : current.waterTemperatures,
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
      })
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
      })
    );

    return true;
  },
};