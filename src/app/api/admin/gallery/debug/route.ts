import { NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tableName = process.env.DYNAMODB_GALLERY_TABLE;

    if (!tableName) {
      return NextResponse.json(
        {
          ok: false,
          message: "DYNAMODB_GALLERY_TABLE 환경변수가 없습니다.",
          env: {
            NODE_ENV: process.env.NODE_ENV,
            AWS_REGION: process.env.AWS_REGION ?? null,
            DYNAMODB_GALLERY_TABLE: null,
            S3_GALLERY_BUCKET: process.env.S3_GALLERY_BUCKET ?? null,
            S3_GALLERY_PUBLIC_BASE_URL:
              process.env.S3_GALLERY_PUBLIC_BASE_URL ?? null,
          },
        },
        { status: 500 },
      );
    }

    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: tableName,
        Limit: 20,
      }),
    );

    return NextResponse.json({
      ok: true,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        AWS_REGION: process.env.AWS_REGION ?? null,
        DYNAMODB_GALLERY_TABLE: tableName,
        S3_GALLERY_BUCKET: process.env.S3_GALLERY_BUCKET ?? null,
        S3_GALLERY_PUBLIC_BASE_URL:
          process.env.S3_GALLERY_PUBLIC_BASE_URL ?? null,
      },
      countInThisScan: result.Count ?? 0,
      scannedCount: result.ScannedCount ?? 0,
      items:
        result.Items?.map((item) => ({
          id: item.id,
          title: item.title,
          imageUrl: item.imageUrl,
          sortOrder: item.sortOrder,
          isVisible: item.isVisible,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })) ?? [],
    });
  } catch (error) {
    console.error("Gallery debug failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "갤러리 디버그 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}