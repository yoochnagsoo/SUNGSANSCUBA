import { NextResponse } from "next/server";

import {
  discoverScubaFishRepository,
  getDefaultDiscoverScubaFish,
  isDiscoverScubaFishTableConfigured,
} from "@/lib/discoverScubaFish/discoverScubaFishRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isDiscoverScubaFishTableConfigured()) {
      return NextResponse.json(
        {
          ok: true,
          fish: getDefaultDiscoverScubaFish().filter((item) => item.isActive),
          source: "fallback",
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const fish = await discoverScubaFishRepository.listActive();

    return NextResponse.json(
      {
        ok: true,
        fish: fish.length > 0 ? fish : getDefaultDiscoverScubaFish(),
        source: fish.length > 0 ? "dynamodb" : "fallback",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[GET /api/discover-scuba-fish]", error);

    return NextResponse.json(
      {
        ok: true,
        fish: getDefaultDiscoverScubaFish().filter((item) => item.isActive),
        source: "fallback",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
