import { NextResponse } from "next/server";

import { reviewRepository } from "@/lib/reviews/reviewRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await reviewRepository.listVisible();

    return NextResponse.json(
      {
        ok: true,
        reviews,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[PUBLIC_REVIEWS_GET_ERROR]", error);

    const message =
      error instanceof Error
        ? error.message
        : "리뷰 목록을 불러오지 못했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
        reviews: [],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}