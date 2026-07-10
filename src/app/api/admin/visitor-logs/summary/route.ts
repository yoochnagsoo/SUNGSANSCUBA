import { NextResponse } from "next/server";

import { visitorLogRepository } from "@/lib/visitorLogs/visitorLogRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function GET() {
  try {
    const summary = await visitorLogRepository.getSummary();

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    console.error("방문 로그 요약 조회 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "방문 로그 요약을 불러오지 못했습니다.",
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}