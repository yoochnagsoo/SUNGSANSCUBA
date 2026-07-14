import { NextRequest, NextResponse } from "next/server";

import { discoverScubaFishRepository } from "@/lib/discoverScubaFish/discoverScubaFishRepository";
import type { DiscoverScubaFishInput } from "@/lib/discoverScubaFish/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePartialInput(
  body: Record<string, unknown>,
): Partial<DiscoverScubaFishInput> {
  const input: Partial<DiscoverScubaFishInput> = {};

  if ("name" in body) {
    input.name = normalizeString(body.name);
  }

  if ("description" in body) {
    input.description = normalizeString(body.description);
  }

  if ("imageUrl" in body) {
    input.imageUrl = normalizeString(body.imageUrl);
  }

  if ("sortOrder" in body) {
    input.sortOrder = Number(body.sortOrder ?? 0);
  }

  if ("isActive" in body) {
    input.isActive = body.isActive !== false;
  }

  return input;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const input = normalizePartialInput(body);

    if ("name" in input && !input.name) {
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

    if ("description" in input && !input.description) {
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

    const fish = await discoverScubaFishRepository.update(id, input);

    if (!fish) {
      return NextResponse.json(
        {
          ok: false,
          message: "체험 바다 생물을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      fish,
    });
  } catch (error) {
    console.error("[PUT /api/admin/discover-scuba-fish/[id]]", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "체험 바다 생물을 수정하지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await discoverScubaFishRepository.delete(id);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("[DELETE /api/admin/discover-scuba-fish/[id]]", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "체험 바다 생물을 삭제하지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
