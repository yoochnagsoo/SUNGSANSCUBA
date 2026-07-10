import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDiveParticipant,
  GroupDiveParticipantUpdateInput,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
    participantId: string;
  }>;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  participantId: string,
  name: string,
) {
  const normalizedName = name.trim().toLowerCase();

  return participants.some(
    (participant) =>
      participant.id !== participantId &&
      participant.active &&
      participant.name.trim().toLowerCase() === normalizedName,
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id, participantId } = await context.params;

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

    const participant = groupDive.participants.find(
      (item) => item.id === participantId,
    );

    if (!participant) {
      return NextResponse.json(
        {
          ok: false,
          message: "참가자 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      participant,
    });
  } catch (error) {
    console.error(
      "Failed to fetch group dive participant:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "참가자 정보를 불러오는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id, participantId } = await context.params;

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

    const participantIndex =
      groupDive.participants.findIndex(
        (item) => item.id === participantId,
      );

    if (participantIndex === -1) {
      return NextResponse.json(
        {
          ok: false,
          message: "참가자 정보를 찾을 수 없습니다.",
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

    const input: GroupDiveParticipantUpdateInput = {};

    if (typeof body.name !== "undefined") {
      const name = normalizeText(body.name);

      if (!name) {
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
          participantId,
          name,
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

      input.name = name;
    }

    if (typeof body.phone !== "undefined") {
      input.phone = normalizeText(body.phone);
    }

    if (typeof body.certification !== "undefined") {
      input.certification = normalizeText(
        body.certification,
      );
    }

    if (typeof body.rentalItems !== "undefined") {
      if (!Array.isArray(body.rentalItems)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "장비 대여 항목 형식을 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.rentalItems = normalizeStringArray(
        body.rentalItems,
      );
    }

    if (typeof body.nitroxDefault !== "undefined") {
      if (typeof body.nitroxDefault !== "boolean") {
        return NextResponse.json(
          {
            ok: false,
            message:
              "나이트록스 기본 사용 여부를 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.nitroxDefault = body.nitroxDefault;
    }

    if (typeof body.memo !== "undefined") {
      input.memo = normalizeText(body.memo);
    }

    if (typeof body.active !== "undefined") {
      if (typeof body.active !== "boolean") {
        return NextResponse.json(
          {
            ok: false,
            message:
              "참가자 활성 상태를 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.active = body.active;
    }

    const previous =
      groupDive.participants[participantIndex];

    const participant: GroupDiveParticipant = {
      ...previous,

      name: input.name ?? previous.name,
      phone: input.phone ?? previous.phone,
      certification:
        input.certification ?? previous.certification,

      rentalItems:
        input.rentalItems ?? previous.rentalItems,

      nitroxDefault:
        input.nitroxDefault ?? previous.nitroxDefault,

      memo: input.memo ?? previous.memo,
      active: input.active ?? previous.active,

      updatedAt: new Date().toISOString(),
    };

    const participants = [...groupDive.participants];
    participants[participantIndex] = participant;

    const trips = groupDive.trips.map((trip) => ({
      ...trip,

      participants: trip.participants.map(
        (tripParticipant) =>
          tripParticipant.participantId === participantId
            ? {
                ...tripParticipant,
                participantName: participant.name,
              }
            : tripParticipant,
      ),

      updatedAt:
        trip.participants.some(
          (tripParticipant) =>
            tripParticipant.participantId === participantId,
        )
          ? new Date().toISOString()
          : trip.updatedAt,
    }));

    const updated = await repository.update(groupDive.id, {
      participants,
      trips,
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

    return NextResponse.json({
      ok: true,
      participant,
      participants: updated.participants,
    });
  } catch (error) {
    console.error(
      "Failed to update group dive participant:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "참가자 정보를 수정하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id, participantId } = await context.params;

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

    const participant = groupDive.participants.find(
      (item) => item.id === participantId,
    );

    if (!participant) {
      return NextResponse.json(
        {
          ok: false,
          message: "참가자 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const participants = groupDive.participants.filter(
      (item) => item.id !== participantId,
    );

    const now = new Date().toISOString();

    const trips = groupDive.trips.map((trip) => {
      const containsParticipant = trip.participants.some(
        (item) => item.participantId === participantId,
      );

      if (!containsParticipant) {
        return trip;
      }

      return {
        ...trip,

        participants: trip.participants.filter(
          (item) =>
            item.participantId !== participantId,
        ),

        updatedAt: now,
      };
    });

    const updated = await repository.update(groupDive.id, {
      participants,
      trips,
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

    return NextResponse.json({
      ok: true,
      deletedParticipantId: participantId,
      participants: updated.participants,
    });
  } catch (error) {
    console.error(
      "Failed to delete group dive participant:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "참가자를 삭제하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}