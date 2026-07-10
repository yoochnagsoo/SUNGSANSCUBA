import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDiveParticipant,
  GroupDiveParticipantInput,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function createId() {
  return crypto.randomUUID();
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value: unknown, defaultValue: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  return defaultValue;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function hasDuplicateParticipantName(
  participants: GroupDiveParticipant[],
  name: string,
) {
  const normalizedName = name.trim().toLowerCase();

  return participants.some(
    (participant) =>
      participant.active &&
      participant.name.trim().toLowerCase() === normalizedName,
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const repository = getGroupDiveRepository();
    const groupDive = await repository.findById(id);

    if (!groupDive) {
      return NextResponse.json(
        {
          ok: false,
          message: "그룹 다이빙 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const participants = [...groupDive.participants].sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }

      return a.createdAt.localeCompare(b.createdAt);
    });

    return NextResponse.json({
      ok: true,
      participants,
      totalCount: participants.length,
      activeCount: participants.filter(
        (participant) => participant.active,
      ).length,
    });
  } catch (error) {
    console.error(
      "Failed to fetch group dive participants:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 참가자 목록을 불러오는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const repository = getGroupDiveRepository();
    const groupDive = await repository.findById(id);

    if (!groupDive) {
      return NextResponse.json(
        {
          ok: false,
          message: "그룹 다이빙 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const input: GroupDiveParticipantInput = {
      name: normalizeText(body.name),
      phone: normalizeText(body.phone),
      certification: normalizeText(body.certification),
      rentalItems: normalizeStringArray(body.rentalItems),
      nitroxDefault: normalizeBoolean(
        body.nitroxDefault,
        false,
      ),
      memo: normalizeText(body.memo),
      active: normalizeBoolean(body.active, true),
    };

    if (!input.name) {
      return NextResponse.json(
        {
          ok: false,
          message: "참가자 이름을 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      hasDuplicateParticipantName(
        groupDive.participants,
        input.name,
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "같은 이름의 활성 참가자가 이미 등록되어 있습니다.",
        },
        {
          status: 409,
        },
      );
    }

    const now = new Date().toISOString();

    const participant: GroupDiveParticipant = {
      id: createId(),
      groupDiveId: groupDive.id,

      name: input.name,
      phone: input.phone ?? "",
      certification: input.certification ?? "",

      rentalItems: input.rentalItems ?? [],
      nitroxDefault: input.nitroxDefault ?? false,

      memo: input.memo ?? "",
      active: input.active ?? true,

      createdAt: now,
      updatedAt: now,
    };

    const participants = [
      ...groupDive.participants,
      participant,
    ];

    const updated = await repository.update(groupDive.id, {
      participants,
    });

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "그룹 다이빙 정보를 수정할 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        participant,
        participants: updated.participants,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Failed to create group dive participant:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 참가자를 등록하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}