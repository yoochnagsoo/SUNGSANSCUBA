import { NextRequest, NextResponse } from "next/server";

import { diveDestinationRepository } from "@/lib/diveDestinations/diveDestinationRepository";
import type {
  DiveDestinationInput,
  DiveDestinationWaterTemperature,
} from "@/lib/diveDestinations/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
    return [];
  }

  return value
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
}

function normalizePartialInput(
  body: Record<string, unknown>
): Partial<DiveDestinationInput> {
  const input: Partial<DiveDestinationInput> = {};

  if ("title" in body) {
    input.title = normalizeString(body.title);
  }

  if ("subtitle" in body) {
    input.subtitle = normalizeString(body.subtitle);
  }

  if ("description" in body) {
    input.description = normalizeString(body.description);
  }

  if ("imageUrls" in body) {
    input.imageUrls = normalizeStringArray(body.imageUrls);
  }

  if ("depth" in body) {
    input.depth = normalizeString(body.depth);
  }

  if ("level" in body) {
    input.level = normalizeString(body.level);
  }

  if ("highlights" in body) {
    input.highlights = normalizeStringArray(body.highlights);
  }

  if ("waterTemperatures" in body) {
    input.waterTemperatures = normalizeWaterTemperatures(body.waterTemperatures);
  }

  if ("sortOrder" in body) {
    input.sortOrder = Number(body.sortOrder ?? 0);
  }

  if ("isActive" in body) {
    input.isActive = body.isActive !== false;
  }

  return input;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const destination = await diveDestinationRepository.getById(id);

    if (!destination) {
      return NextResponse.json(
        {
          ok: false,
          message: "다이빙 포인트를 찾을 수 없습니다.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      destination,
    });
  } catch (error) {
    console.error("[GET /api/admin/dive-destinations/[id]]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "다이빙 포인트 정보를 불러오지 못했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const input = normalizePartialInput(body);

    if ("title" in input && !input.title) {
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

    if ("description" in input && !input.description) {
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

    if ("imageUrls" in input && (!input.imageUrls || input.imageUrls.length === 0)) {
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

    const destination = await diveDestinationRepository.update(id, input);

    if (!destination) {
      return NextResponse.json(
        {
          ok: false,
          message: "다이빙 포인트를 찾을 수 없습니다.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      destination,
    });
  } catch (error) {
    console.error("[PUT /api/admin/dive-destinations/[id]]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "다이빙 포인트 수정 중 오류가 발생했습니다.",
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
    await diveDestinationRepository.delete(id);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("[DELETE /api/admin/dive-destinations/[id]]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "다이빙 포인트 삭제 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}