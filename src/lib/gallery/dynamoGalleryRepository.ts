import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";
import type {
  GalleryImage,
  GalleryImageInput,
  GalleryImageUpdateInput,
  GalleryRepository,
} from "./types";

const tableName = process.env.DYNAMODB_GALLERY_TABLE;

if (!tableName) {
  throw new Error("DYNAMODB_GALLERY_TABLE 환경변수가 설정되지 않았습니다.");
}

function sortGalleryImages(images: GalleryImage[]) {
  return [...images].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function normalizeGalleryImage(item: Record<string, unknown>): GalleryImage {
  return {
    id: String(item.id ?? ""),
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    imageUrl: String(item.imageUrl ?? ""),
    sortOrder: Number(item.sortOrder ?? 999),
    isVisible: Boolean(item.isVisible),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? new Date().toISOString()),
  };
}

export class DynamoGalleryRepository implements GalleryRepository {
  async listAll(): Promise<GalleryImage[]> {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: tableName,
      }),
    );

    const items = result.Items ?? [];

    return sortGalleryImages(items.map(normalizeGalleryImage));
  }

  async listVisible(): Promise<GalleryImage[]> {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "isVisible = :isVisible",
        ExpressionAttributeValues: {
          ":isVisible": true,
        },
      }),
    );

    const items = result.Items ?? [];

    return sortGalleryImages(items.map(normalizeGalleryImage));
  }

  async getById(id: string): Promise<GalleryImage | null> {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          id,
        },
      }),
    );

    if (!result.Item) {
      return null;
    }

    return normalizeGalleryImage(result.Item);
  }

  async create(input: GalleryImageInput): Promise<GalleryImage> {
    const now = new Date().toISOString();

    const image: GalleryImage = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      imageUrl: input.imageUrl.trim(),
      sortOrder:
        typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
          ? input.sortOrder
          : 999,
      isVisible: input.isVisible ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: tableName,
        Item: image,
      }),
    );

    return image;
  }

  async update(
    id: string,
    input: GalleryImageUpdateInput,
  ): Promise<GalleryImage | null> {
    const current = await this.getById(id);

    if (!current) {
      return null;
    }

    const updated: GalleryImage = {
      ...current,
      title:
        typeof input.title === "string" ? input.title.trim() : current.title,
      description:
        typeof input.description === "string"
          ? input.description.trim()
          : current.description,
      imageUrl:
        typeof input.imageUrl === "string"
          ? input.imageUrl.trim()
          : current.imageUrl,
      sortOrder:
        typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
          ? input.sortOrder
          : current.sortOrder,
      isVisible:
        typeof input.isVisible === "boolean"
          ? input.isVisible
          : current.isVisible,
      updatedAt: new Date().toISOString(),
    };

    await dynamoDb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          id,
        },
        UpdateExpression:
          "SET title = :title, description = :description, imageUrl = :imageUrl, sortOrder = :sortOrder, isVisible = :isVisible, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":title": updated.title,
          ":description": updated.description,
          ":imageUrl": updated.imageUrl,
          ":sortOrder": updated.sortOrder,
          ":isVisible": updated.isVisible,
          ":updatedAt": updated.updatedAt,
        },
      }),
    );

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const current = await this.getById(id);

    if (!current) {
      return false;
    }

    await dynamoDb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: {
          id,
        },
      }),
    );

    return true;
  }
}