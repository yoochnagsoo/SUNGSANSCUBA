import {
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";

import type {
  GoogleCalendarSourceType,
  GoogleCalendarSyncMapping,
  GoogleCalendarSyncMappingInput,
  GoogleCalendarSyncMappingRepository,
} from "./types";

const TABLE_NAME =
  process.env.DYNAMODB_GOOGLE_CALENDAR_SYNC_TABLE;

function getMappingKey(
  sourceType: GoogleCalendarSourceType,
  sourceId: string,
) {
  return `${sourceType}#${sourceId}`;
}

function getTableName() {
  if (!TABLE_NAME) {
    throw new Error(
      "DYNAMODB_GOOGLE_CALENDAR_SYNC_TABLE is not set.",
    );
  }

  return TABLE_NAME;
}

function normalizeMapping(
  item: Partial<GoogleCalendarSyncMapping>,
): GoogleCalendarSyncMapping {
  return {
    sourceType: item.sourceType as GoogleCalendarSourceType,
    sourceId: String(item.sourceId ?? ""),
    eventId: String(item.eventId ?? ""),
    checksum: String(item.checksum ?? ""),
    syncedAt: String(item.syncedAt ?? ""),
  };
}

export const googleCalendarMappingRepository: GoogleCalendarSyncMappingRepository =
  {
    async findBySource(sourceType, sourceId) {
      const result = await dynamoDb.send(
        new GetCommand({
          TableName: getTableName(),
          Key: {
            id: getMappingKey(sourceType, sourceId),
          },
        }),
      );

      if (!result.Item) {
        return null;
      }

      return normalizeMapping(
        result.Item as Partial<GoogleCalendarSyncMapping>,
      );
    },

    async upsert(input: GoogleCalendarSyncMappingInput) {
      const mapping: GoogleCalendarSyncMapping & {
        id: string;
      } = {
        id: getMappingKey(input.sourceType, input.sourceId),
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        eventId: input.eventId,
        checksum: input.checksum,
        syncedAt: new Date().toISOString(),
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: getTableName(),
          Item: mapping,
        }),
      );

      return mapping;
    },
  };
