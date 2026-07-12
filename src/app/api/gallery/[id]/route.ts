import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import {
  requireAdmin,
  requireAdminMutation,
} from "@/lib/adminAuth";
import {
  s3Client,
  s3GalleryBucket,
  s3GalleryPublicBaseUrl,
} from "@/lib/aws/s3";
import { galleryRepository } from "@/lib/gallery/galleryRepository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getS3KeyFromImageUrl(imageUrl: string) {
  const baseUrl = s3GalleryPublicBaseUrl?.replace(/\/$/, "");

  if (!baseUrl) {
    return null;
  }

  if (!imageUrl.startsWith(baseUrl)) {
    return null;
  }

  const key = imageUrl.replace(`${baseUrl}/`, "").trim();

  if (!key || !key.startsWith("gallery/")) {
    return null;
  }

  return decodeURIComponent(key);
}

async function deleteS3ObjectByImageUrl(imageUrl: string) {
  if (!s3GalleryBucket) {
    return {
      ok: false,
      skipped: true,
      message: "S3_GALLERY_BUCKET 환경변수가 없습니다.",
    };
  }

  const key = getS3KeyFromImageUrl(imageUrl);

  if (!key) {
    return {
      ok: false,
      skipped: true,
      message: "S3 key를 이미지 URL에서 찾을 수 없습니다.",
    };
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: s3GalleryBucket,
      Key: key,
    }),
  );

  return {
    ok: true,
    skipped: false,
    key,
  };
}

function isSameImageUrl(a: string, b: string) {
  return a.trim() === b.trim();
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(_request);

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  const image = await galleryRepository.getById(id);

  if (!image) {
    return NextResponse.json(
      {
        ok: false,
        message: "갤러리 이미지를 찾을 수 없습니다.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    image,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const current = await galleryRepository.getById(id);

    if (!current) {
      return NextResponse.json(
        {
          ok: false,
          message: "갤러리 이미지를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    const nextImageUrl =
      typeof body.imageUrl === "string" ? body.imageUrl.trim() : undefined;

    const shouldDeletePreviousS3Image =
      typeof nextImageUrl === "string" &&
      nextImageUrl.length > 0 &&
      !isSameImageUrl(current.imageUrl, nextImageUrl);

    const updated = await galleryRepository.update(id, {
      title: typeof body.title === "string" ? body.title.trim() : undefined,
      description:
        typeof body.description === "string"
          ? body.description.trim()
          : undefined,
      imageUrl: nextImageUrl,
      sortOrder:
        typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      isVisible:
        typeof body.isVisible === "boolean" ? body.isVisible : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message: "갤러리 이미지를 수정하지 못했습니다.",
        },
        { status: 500 },
      );
    }

    let previousS3DeleteResult:
      | {
          ok: boolean;
          skipped: boolean;
          message?: string;
          key?: string;
        }
      | null = null;

    if (shouldDeletePreviousS3Image) {
      try {
        previousS3DeleteResult = await deleteS3ObjectByImageUrl(
          current.imageUrl,
        );
      } catch (error) {
        console.error("Failed to delete previous S3 gallery object:", error);

        previousS3DeleteResult = {
          ok: false,
          skipped: false,
          message:
            "기존 S3 이미지 파일 삭제에 실패했습니다. 갤러리 정보 수정은 완료되었습니다.",
        };
      }
    }

    return NextResponse.json({
      ok: true,
      image: updated,
      previousS3DeleteResult,
    });
  } catch (error) {
    console.error("Failed to update gallery image:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "갤러리 이미지를 수정하는 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const image = await galleryRepository.getById(id);

    if (!image) {
      return NextResponse.json(
        {
          ok: false,
          message: "갤러리 이미지를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    let s3DeleteResult:
      | {
          ok: boolean;
          skipped: boolean;
          message?: string;
          key?: string;
        }
      | null = null;

    try {
      s3DeleteResult = await deleteS3ObjectByImageUrl(image.imageUrl);
    } catch (error) {
      console.error("Failed to delete S3 gallery object:", error);

      return NextResponse.json(
        {
          ok: false,
          message:
            "S3 이미지 파일을 삭제하지 못했습니다. 갤러리 등록 정보는 삭제하지 않았습니다.",
        },
        { status: 500 },
      );
    }

    const deleted = await galleryRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          message: "갤러리 이미지를 삭제하지 못했습니다.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      s3DeleteResult,
    });
  } catch (error) {
    console.error("Failed to delete gallery image:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "갤러리 이미지를 삭제하는 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
