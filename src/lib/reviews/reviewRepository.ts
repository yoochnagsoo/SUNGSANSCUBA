import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

import type { Review, ReviewInput } from "./types";

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

const dynamoDb = new DynamoDBClient({
  region,
});

function getReviewsTableName() {
  const tableName =
    process.env.REVIEWS_TABLE_NAME ||
    process.env.DYNAMODB_REVIEWS_TABLE_NAME ||
    "sungsanscuba-reviews";

  return tableName;
}

function createNow() {
  return new Date().toISOString();
}

function normalizeImages(images: string[]) {
  return images
    .map((image) => image.trim())
    .filter(Boolean)
    .filter((image, index, array) => array.indexOf(image) === index);
}

function itemToReview(item: Record<string, any>): Review {
  return {
    id: item.id?.S || "",
    userId: item.userId?.S || "",
    program: item.program?.S || "",
    comment: item.comment?.S || "",
    images: Array.isArray(item.images?.L)
      ? item.images.L.map((image: any) => image.S || "").filter(Boolean)
      : [],
    isVisible: item.isVisible?.BOOL ?? true,
    sortOrder: Number(item.sortOrder?.N || 0),
    createdAt: item.createdAt?.S || "",
    updatedAt: item.updatedAt?.S || "",
  };
}

function reviewToItem(review: Review) {
  return {
    id: {
      S: review.id,
    },
    userId: {
      S: review.userId,
    },
    program: {
      S: review.program,
    },
    comment: {
      S: review.comment,
    },
    images: {
      L: review.images.map((image) => ({
        S: image,
      })),
    },
    isVisible: {
      BOOL: review.isVisible,
    },
    sortOrder: {
      N: String(review.sortOrder),
    },
    createdAt: {
      S: review.createdAt,
    },
    updatedAt: {
      S: review.updatedAt,
    },
  };
}

function sortReviews(reviews: Review[]) {
  return reviews.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const reviewRepository = {
  async listAll() {
    const command = new ScanCommand({
      TableName: getReviewsTableName(),
    });

    const result = await dynamoDb.send(command);

    const reviews = (result.Items || []).map(itemToReview);

    return sortReviews(reviews);
  },

  async listVisible() {
    const reviews = await this.listAll();

    return reviews.filter((review) => review.isVisible);
  },

  async findById(id: string) {
    const reviews = await this.listAll();

    return reviews.find((review) => review.id === id) || null;
  },

  async create(input: ReviewInput) {
    const now = createNow();

    const review: Review = {
      id: crypto.randomUUID(),
      userId: input.userId.trim(),
      program: input.program.trim(),
      comment: input.comment.trim(),
      images: normalizeImages(input.images),
      isVisible: input.isVisible,
      sortOrder: Number(input.sortOrder || 0),
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutItemCommand({
      TableName: getReviewsTableName(),
      Item: reviewToItem(review),
    });

    await dynamoDb.send(command);

    return review;
  },

  async update(id: string, input: ReviewInput) {
    const existing = await this.findById(id);

    if (!existing) {
      return null;
    }

    const review: Review = {
      ...existing,
      userId: input.userId.trim(),
      program: input.program.trim(),
      comment: input.comment.trim(),
      images: normalizeImages(input.images),
      isVisible: input.isVisible,
      sortOrder: Number(input.sortOrder || 0),
      updatedAt: createNow(),
    };

    const command = new PutItemCommand({
      TableName: getReviewsTableName(),
      Item: reviewToItem(review),
    });

    await dynamoDb.send(command);

    return review;
  },

  async delete(id: string) {
    const command = new DeleteItemCommand({
      TableName: getReviewsTableName(),
      Key: {
        id: {
          S: id,
        },
      },
    });

    await dynamoDb.send(command);

    return true;
  },
};