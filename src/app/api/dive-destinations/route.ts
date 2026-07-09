import { NextResponse } from "next/server";

import { diveDestinationRepository } from "@/lib/diveDestinations/diveDestinationRepository";

export async function GET() {
  try {
    const destinations = await diveDestinationRepository.listActive();

    return NextResponse.json({
      ok: true,
      destinations,
    });
  } catch (error) {
    console.error("[GET /api/dive-destinations]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "다이빙 포인트 목록을 불러오지 못했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}