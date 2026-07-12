import { NextRequest, NextResponse } from "next/server";

import {
  requireAdmin,
  requireAdminMutation,
} from "@/lib/adminAuth";
import { galleryRepository } from "@/lib/gallery/galleryRepository";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get("admin") === "1";

  if (admin) {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }
  }

  const images = admin
    ? await galleryRepository.listAll()
    : await galleryRepository.listVisible();

  return NextResponse.json({
    ok: true,
    images,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const imageUrl = String(body.imageUrl ?? "").trim();
    const sortOrder = Number(body.sortOrder ?? 999);
    const isVisible =
      typeof body.isVisible === "boolean" ? body.isVisible : true;

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          message: "제목을 입력해주세요.",
        },
        { status: 400 },
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          ok: false,
          message: "이미지 URL을 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const image = await galleryRepository.create({
      title,
      description,
      imageUrl,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
      isVisible,
    });

    return NextResponse.json({
      ok: true,
      image,
    });
  } catch (error) {
    console.error("Failed to create gallery image:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "갤러리 이미지를 등록하는 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
