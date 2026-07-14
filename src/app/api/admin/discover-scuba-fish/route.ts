import { NextRequest, NextResponse } from "next/server";

import {
  discoverScubaFishRepository,
  getDefaultDiscoverScubaFish,
  isDiscoverScubaFishTableConfigured,
} from "@/lib/discoverScubaFish/discoverScubaFishRepository";
import type { DiscoverScubaFishInput } from "@/lib/discoverScubaFish/types";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInput(body: Record<string, unknown>): DiscoverScubaFishInput {
  return {
    name: normalizeString(body.name),
    description: normalizeString(body.description),
    imageUrl: normalizeString(body.imageUrl),
    sortOrder: Number(body.sortOrder ?? 0),
    isActive: body.isActive !== false,
  };
}

export async function GET() {
  try {
    if (!isDiscoverScubaFishTableConfigured()) {
      return NextResponse.json({
        ok: true,
        fish: getDefaultDiscoverScubaFish(),
        isFallback: true,
        message:
          "DYNAMODB_DISCOVER_SCUBA_FISH_TABLE 환경변수가 없어 기본 데이터가 표시됩니다.",
      });
    }

    const fish = await discoverScubaFishRepository.list();

    return NextResponse.json({
      ok: true,
      fish: fish.length > 0 ? fish : getDefaultDiscoverScubaFish(),
      isFallback: fish.length === 0,
    });
  } catch (error) {
    console.error("[GET /api/admin/discover-scuba-fish]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "체험 바다 생물 목록을 불러오지 못했습니다.",
        fish: [],
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = normalizeInput(body);

    if (!input.name) {
      return NextResponse.json(
        {
          ok: false,
          message: "이름을 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!input.description) {
      return NextResponse.json(
        {
          ok: false,
          message: "설명을 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const fish = await discoverScubaFishRepository.create(input);

    return NextResponse.json({
      ok: true,
      fish,
    });
  } catch (error) {
    console.error("[POST /api/admin/discover-scuba-fish]", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "체험 바다 생물을 등록하지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
