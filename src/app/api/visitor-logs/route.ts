import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { visitorLogRepository } from "@/lib/visitorLogs/visitorLogRepository";
import type { VisitorDeviceType } from "@/lib/visitorLogs/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VisitorLogRequestBody = {
  path?: unknown;
  referrer?: unknown;
};

function getHashSecret() {
  const secret = process.env.VISITOR_LOG_HASH_SECRET;

  if (!secret) {
    throw new Error("VISITOR_LOG_HASH_SECRET is not set.");
  }

  return secret;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function createVisitorHash(params: {
  ip: string;
  userAgent: string;
  secret: string;
}) {
  return createHash("sha256")
    .update(`${params.ip}|${params.userAgent}|${params.secret}`)
    .digest("hex");
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

function detectDeviceType(userAgent: string): VisitorDeviceType {
  const normalized = userAgent.toLowerCase();

  if (!normalized) {
    return "UNKNOWN";
  }

  if (/ipad|tablet|galaxy tab|sm-t|kindle|silk/.test(normalized)) {
    return "TABLET";
  }

  if (/mobi|iphone|android|phone|ipod/.test(normalized)) {
    return "MOBILE";
  }

  if (/windows|macintosh|linux|x11/.test(normalized)) {
    return "DESKTOP";
  }

  return "UNKNOWN";
}

function normalizePath(value: unknown) {
  if (typeof value !== "string") {
    return "/";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "/";
  }

  if (!trimmed.startsWith("/")) {
    return "/";
  }

  return trimmed.split("?")[0].slice(0, 300) || "/";
}

function normalizeReferrer(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);

    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return trimmed.split("?")[0].slice(0, 500);
  }
}

function shouldIgnorePath(path: string) {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.includes(".")
  );
}

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VisitorLogRequestBody;

    const path = normalizePath(body.path);

    if (shouldIgnorePath(path)) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ip = getClientIp(request);
    const secret = getHashSecret();

    const visitorHash = createVisitorHash({
      ip,
      userAgent,
      secret,
    });

    const now = new Date();

    const visitorLog = await visitorLogRepository.create({
      visitorHash,
      path,
      referrer: normalizeReferrer(body.referrer),
      deviceType: detectDeviceType(userAgent),
      visitedAt: now.toISOString(),
      visitedDate: getKoreanDateKey(now),
    });

    return NextResponse.json(
      {
        ok: true,
        visitorLog: {
          id: visitorLog.id,
          path: visitorLog.path,
          deviceType: visitorLog.deviceType,
          visitedAt: visitorLog.visitedAt,
          visitedDate: visitorLog.visitedDate,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    console.error("방문 로그 저장 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "방문 로그를 저장하지 못했습니다.",
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}