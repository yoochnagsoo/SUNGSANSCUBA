import { NextRequest, NextResponse } from "next/server";

import { diveDestinationRepository } from "@/lib/diveDestinations/diveDestinationRepository";
import type {
  DiveDestinationInput,
  DiveDestinationWaterTemperature,
} from "@/lib/diveDestinations/types";

const defaultWaterTemperatures: DiveDestinationWaterTemperature[] = [
  {
    season: "봄",
    months: "3~5월",
    temperature: "14~18°C",
  },
  {
    season: "여름",
    months: "6~8월",
    temperature: "20~27°C",
  },
  {
    season: "가을",
    months: "9~11월",
    temperature: "19~25°C",
  },
  {
    season: "겨울",
    months: "12~2월",
    temperature: "13~16°C",
  },
];

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeWaterTemperatures(
  value: unknown
): DiveDestinationWaterTemperature[] {
  if (!Array.isArray(value)) {
    return defaultWaterTemperatures;
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;

      return {
        season: normalizeString(data.season),
        months: normalizeString(data.months),
        temperature: normalizeString(data.temperature),
      };
    })
    .filter(
      (item): item is DiveDestinationWaterTemperature =>
        !!item && !!item.season && !!item.temperature
    );

  return items.length > 0 ? items : defaultWaterTemperatures;
}

function normalizeInput(body: Record<string, unknown>): DiveDestinationInput {
  return {
    title: normalizeString(body.title),
    subtitle: normalizeString(body.subtitle),
    description: normalizeString(body.description),
    imageUrls: normalizeStringArray(body.imageUrls),
    depth: normalizeString(body.depth),
    level: normalizeString(body.level),
    highlights: normalizeStringArray(body.highlights),
    waterTemperatures: normalizeWaterTemperatures(body.waterTemperatures),
    sortOrder: Number(body.sortOrder ?? 0),
    isActive: body.isActive !== false,
  };
}

export async function GET() {
  try {
    const destinations = await diveDestinationRepository.list();

    return NextResponse.json({
      ok: true,
      destinations,
    });
  } catch (error) {
    console.error("[GET /api/admin/dive-destinations]", error);

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = normalizeInput(body);

    if (!input.title) {
      return NextResponse.json(
        {
          ok: false,
          message: "제목을 입력해주세요.",
        },
        {
          status: 400,
        }
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
        }
      );
    }

    if (input.imageUrls.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "이미지를 1장 이상 등록해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const destination = await diveDestinationRepository.create(input);

    return NextResponse.json({
      ok: true,
      destination,
    });
  } catch (error) {
    console.error("[POST /api/admin/dive-destinations]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "다이빙 포인트 등록 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}