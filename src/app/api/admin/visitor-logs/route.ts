import { NextResponse } from "next/server";

import { visitorLogRepository } from "@/lib/visitorLogs/visitorLogRepository";
import type { VisitorDeviceType } from "@/lib/visitorLogs/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SafeVisitorLog = {
  id: string;
  path: string;
  referrer?: string;
  deviceType: VisitorDeviceType;
  visitedAt: string;
  visitedDate: string;
  createdAt: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "알 수 없는 오류가 발생했습니다.";
  }
}

function toSafeVisitorLog(log: {
  id: string;
  path: string;
  referrer?: string;
  deviceType: VisitorDeviceType;
  visitedAt: string;
  visitedDate: string;
  createdAt: string;
}): SafeVisitorLog {
  return {
    id: log.id,
    path: log.path,
    referrer: log.referrer,
    deviceType: log.deviceType,
    visitedAt: log.visitedAt,
    visitedDate: log.visitedDate,
    createdAt: log.createdAt,
  };
}

export async function GET() {
  try {
    const visitorLogs = await visitorLogRepository.list();

    return NextResponse.json({
      ok: true,
      visitorLogs: visitorLogs.map(toSafeVisitorLog),
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    console.error("방문 로그 목록 조회 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "방문 로그 목록을 불러오지 못했습니다.",
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}