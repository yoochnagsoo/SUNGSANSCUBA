import { NextRequest, NextResponse } from "next/server";

import { reviewRepository } from "@/lib/reviews/reviewRepository";
import type { ReviewInput } from "@/lib/reviews/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function validateReviewInput(input: Partial<ReviewInput>) {
  if (!input.userId || !input.userId.trim()) {
    return "작성자 아이디를 입력해 주세요.";
  }

  if (!input.program || !input.program.trim()) {
    return "체험 종류를 입력해 주세요.";
  }

  if (!input.comment || !input.comment.trim()) {
    return "리뷰 코멘트를 입력해 주세요.";
  }

  if (!Array.isArray(input.images) || input.images.length === 0) {
    return "이미지를 1개 이상 등록해 주세요.";
  }

  return null;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Partial<ReviewInput>;

    const errorMessage = validateReviewInput(body);

    if (errorMessage) {
      return NextResponse.json(
        {
          ok: false,
          message: errorMessage,
        },
        {
          status: 400,
        }
      );
    }

    const review = await reviewRepository.update(id, {
      userId: body.userId || "",
      program: body.program || "",
      comment: body.comment || "",
      images: body.images || [],
      isVisible: body.isVisible ?? true,
      sortOrder: Number(body.sortOrder || 0),
    });

    if (!review) {
      return NextResponse.json(
        {
          ok: false,
          message: "리뷰를 찾을 수 없습니다.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "리뷰가 수정되었습니다.",
      review,
    });
  } catch (error) {
    console.error("[ADMIN_REVIEWS_PUT_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "리뷰 수정 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await reviewRepository.delete(id);

    return NextResponse.json({
      ok: true,
      message: "리뷰가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("[ADMIN_REVIEWS_DELETE_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "리뷰 삭제 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}