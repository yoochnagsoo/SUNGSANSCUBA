import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";
import type {
  VisitorLog,
  VisitorLogInput,
  VisitorLogRepository,
  VisitorLogSummary,
  VisitorLogSummaryRecentLog,
} from "./types";

const TABLE_NAME = process.env.DYNAMODB_VISITOR_LOGS_TABLE;

function getTableName() {
  if (!TABLE_NAME) {
    throw new Error("DYNAMODB_VISITOR_LOGS_TABLE is not set.");
  }

  return TABLE_NAME;
}

function createId() {
  return crypto.randomUUID();
}

function getKoreanDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function getKoreanMonthKey(date = new Date()) {
  return getKoreanDateKey(date).slice(0, 7);
}

function normalizeVisitorLog(item: VisitorLog): VisitorLog {
  return {
    id: item.id,
    visitorHash: item.visitorHash,
    path: item.path,
    referrer: item.referrer || undefined,
    deviceType: item.deviceType || "UNKNOWN",
    visitedAt: item.visitedAt,
    visitedDate: item.visitedDate,
    createdAt: item.createdAt,
  };
}

function toSummaryRecentLog(item: VisitorLog): VisitorLogSummaryRecentLog {
  return {
    id: item.id,
    path: item.path,
    referrer: item.referrer,
    deviceType: item.deviceType,
    visitedAt: item.visitedAt,
    visitedDate: item.visitedDate,
    createdAt: item.createdAt,
  };
}

function sortRecentLogs(items: VisitorLog[]) {
  return [...items].sort((a, b) => {
    return b.visitedAt.localeCompare(a.visitedAt);
  });
}

function getTopPages(items: VisitorLog[]) {
  const pageMap = new Map<string, number>();

  for (const item of items) {
    pageMap.set(item.path, (pageMap.get(item.path) || 0) + 1);
  }

  return [...pageMap.entries()]
    .map(([path, count]) => ({
      path,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function scanAllVisitorLogs() {
  const visitorLogs: VisitorLog[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: getTableName(),
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );

    const items = ((result.Items ?? []) as VisitorLog[]).map(
      normalizeVisitorLog,
    );

    visitorLogs.push(...items);

    lastEvaluatedKey = result.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined;
  } while (lastEvaluatedKey);

  return visitorLogs;
}

export const dynamoVisitorLogRepository: VisitorLogRepository = {
  async create(input: VisitorLogInput): Promise<VisitorLog> {
    const now = new Date().toISOString();

    const visitorLog: VisitorLog = {
      id: createId(),
      visitorHash: input.visitorHash,
      path: input.path,
      referrer: input.referrer || undefined,
      deviceType: input.deviceType,
      visitedAt: input.visitedAt,
      visitedDate: input.visitedDate,
      createdAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: getTableName(),
        Item: visitorLog,
      }),
    );

    return visitorLog;
  },

  async list(): Promise<VisitorLog[]> {
    const visitorLogs = await scanAllVisitorLogs();

    return sortRecentLogs(visitorLogs);
  },

  async getSummary(): Promise<VisitorLogSummary> {
    const visitorLogs = await scanAllVisitorLogs();

    const todayKey = getKoreanDateKey();
    const monthKey = getKoreanMonthKey();

    const todayLogs = visitorLogs.filter(
      (item) => item.visitedDate === todayKey,
    );

    const monthLogs = visitorLogs.filter((item) =>
      item.visitedDate.startsWith(monthKey),
    );

    const todayUniqueVisitors = new Set(
      todayLogs.map((item) => item.visitorHash),
    );

    const monthUniqueVisitors = new Set(
      monthLogs.map((item) => item.visitorHash),
    );

    const reservationPageVisits = visitorLogs.filter((item) =>
      item.path.startsWith("/reservation"),
    ).length;

    const mobileVisits = visitorLogs.filter(
      (item) => item.deviceType === "MOBILE",
    ).length;

    const tabletVisits = visitorLogs.filter(
      (item) => item.deviceType === "TABLET",
    ).length;

    const desktopVisits = visitorLogs.filter(
      (item) => item.deviceType === "DESKTOP",
    ).length;

    const unknownDeviceVisits = visitorLogs.filter(
      (item) => item.deviceType === "UNKNOWN",
    ).length;

    return {
      totalVisits: visitorLogs.length,
      todayVisits: todayLogs.length,
      todayUniqueVisitors: todayUniqueVisitors.size,
      monthVisits: monthLogs.length,
      monthUniqueVisitors: monthUniqueVisitors.size,
      reservationPageVisits,
      mobileVisits,
      tabletVisits,
      desktopVisits,
      unknownDeviceVisits,
      topPages: getTopPages(visitorLogs),
      recentLogs: sortRecentLogs(visitorLogs)
        .slice(0, 30)
        .map(toSummaryRecentLog),
    };
  },
};