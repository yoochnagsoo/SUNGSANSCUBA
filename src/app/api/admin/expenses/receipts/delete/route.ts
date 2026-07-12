import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import {
  s3Client,
  s3GalleryBucket,
} from "@/lib/aws/s3";

export const runtime = "nodejs";

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isExpenseReceiptKey(key: string) {
  return key.startsWith("expenses/receipts/");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
}

export async function POST(request: NextRequest) {
  try {
    if (!s3GalleryBucket) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "S3_GALLERY_BUCKET 환경변수가 설정되지 않았습니다.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const receiptKey = normalizeText(
      body.receiptKey,
    );

    if (!receiptKey) {
      return NextResponse.json(
        {
          ok: false,
          message: "삭제할 영수증 키가 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isExpenseReceiptKey(receiptKey)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "삭제할 수 없는 영수증 경로입니다.",
        },
        {
          status: 400,
        },
      );
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: s3GalleryBucket,
        Key: receiptKey,
      }),
    );

    return NextResponse.json({
      ok: true,
      message: "영수증 파일이 삭제되었습니다.",
    });
  } catch (error) {
    console.error(
      "Expense receipt delete failed:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message: `영수증 삭제 중 오류가 발생했습니다. ${getErrorMessage(
          error,
        )}`,
      },
      {
        status: 500,
      },
    );
  }
}