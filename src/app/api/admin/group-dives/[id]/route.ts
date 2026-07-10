import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDiveBillingType,
  GroupDiveStatus,
  GroupDiveUpdateInput,
} from "@/lib/groupDives/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_BILLING_TYPES: GroupDiveBillingType[] = [
  "GROUP",
  "INDIVIDUAL",
];

const VALID_STATUSES: GroupDiveStatus[] = [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function normalizeExpectedPeople(value: unknown) {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(Math.floor(parsed), 0);
}

function normalizeUnitPrice(value: unknown) {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function isBillingType(
  value: unknown,
): value is GroupDiveBillingType {
  return VALID_BILLING_TYPES.includes(
    value as GroupDiveBillingType,
  );
}

function isGroupDiveStatus(
  value: unknown,
): value is GroupDiveStatus {
  return VALID_STATUSES.includes(
    value as GroupDiveStatus,
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

    return NextResponse.json({
      ok: true,
      groupDive,
    });
  } catch (error) {
    console.error("Failed to fetch group dive:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙 정보를 불러오는 중 오류가 발생했습니다.",
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
    const { id } = await context.params;

    const repository = getGroupDiveRepository();
    const current = await repository.findById(id);

    if (!current) {
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

    const input: GroupDiveUpdateInput = {};

    if (typeof body.groupName !== "undefined") {
      const groupName = normalizeText(body.groupName);

      if (!groupName) {
        return NextResponse.json(
          {
            ok: false,
            message: "팀명을 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.groupName = groupName;
    }

    if (typeof body.representativeName !== "undefined") {
      const representativeName = normalizeText(
        body.representativeName,
      );

      if (!representativeName) {
        return NextResponse.json(
          {
            ok: false,
            message: "대표자 이름을 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.representativeName = representativeName;
    }

    if (typeof body.representativePhone !== "undefined") {
      input.representativePhone = normalizeText(
        body.representativePhone,
      );
    }

    if (typeof body.startDate !== "undefined") {
      const startDate = normalizeText(body.startDate);

      if (!isValidDate(startDate)) {
        return NextResponse.json(
          {
            ok: false,
            message: "시작일을 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.startDate = startDate;
    }

    if (typeof body.endDate !== "undefined") {
      const endDate = normalizeText(body.endDate);

      if (!isValidDate(endDate)) {
        return NextResponse.json(
          {
            ok: false,
            message: "종료일을 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.endDate = endDate;
    }

    const nextStartDate =
      input.startDate ?? current.startDate;

    const nextEndDate =
      input.endDate ?? current.endDate;

    if (nextEndDate < nextStartDate) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "종료일은 시작일보다 빠를 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof body.expectedPeople !== "undefined") {
      const expectedPeople = normalizeExpectedPeople(
        body.expectedPeople,
      );

      if (
        typeof expectedPeople === "undefined" ||
        expectedPeople < 1
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "예상 인원은 1명 이상이어야 합니다.",
          },
          {
            status: 400,
          },
        );
      }

      input.expectedPeople = expectedPeople;
    }

    if (typeof body.billingType !== "undefined") {
      if (!isBillingType(body.billingType)) {
        return NextResponse.json(
          {
            ok: false,
            message: "정산 방식을 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.billingType = body.billingType;
    }

    if (
      typeof body.defaultDiveUnitPrice !== "undefined"
    ) {
      const defaultDiveUnitPrice = normalizeUnitPrice(
        body.defaultDiveUnitPrice,
      );

      if (
        body.defaultDiveUnitPrice !== "" &&
        body.defaultDiveUnitPrice !== null &&
        typeof defaultDiveUnitPrice === "undefined"
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "기본 다이빙 단가를 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.defaultDiveUnitPrice =
        defaultDiveUnitPrice;
    }

    if (typeof body.status !== "undefined") {
      if (!isGroupDiveStatus(body.status)) {
        return NextResponse.json(
          {
            ok: false,
            message: "상태값을 확인해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.status = body.status;
    }

    if (typeof body.memo !== "undefined") {
      input.memo = normalizeText(body.memo);
    }

    const groupDive = await repository.update(id, input);

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

    return NextResponse.json({
      ok: true,
      groupDive,
    });
  } catch (error) {
    console.error("Failed to update group dive:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙 정보를 수정하는 중 오류가 발생했습니다.",
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
    const { id } = await context.params;

    const repository = getGroupDiveRepository();
    const deleted = await repository.delete(id);

    if (!deleted) {
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

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Failed to delete group dive:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙 정보를 삭제하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}