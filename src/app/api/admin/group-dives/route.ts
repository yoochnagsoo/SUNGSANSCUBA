import { NextRequest, NextResponse } from "next/server";

import { getGroupDiveRepository } from "@/lib/groupDives/groupDiveRepository";
import type {
  GroupDiveBillingType,
  GroupDiveInput,
  GroupDiveStatus,
} from "@/lib/groupDives/types";

const VALID_BILLING_TYPES: GroupDiveBillingType[] = [
  "GROUP",
  "INDIVIDUAL",
];

const VALID_STATUSES: GroupDiveStatus[] = [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeExpectedPeople(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
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

export async function GET() {
  try {
    const repository = getGroupDiveRepository();
    const groupDives = await repository.findAll();

    return NextResponse.json({
      ok: true,
      groupDives,
    });
  } catch (error) {
    console.error("Failed to fetch group dives:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙 목록을 불러오는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const groupName = normalizeText(body.groupName);
    const representativeName = normalizeText(
      body.representativeName,
    );
    const representativePhone = normalizeText(
      body.representativePhone,
    );

    const startDate = normalizeText(body.startDate);
    const endDate = normalizeText(body.endDate);

    const expectedPeople = normalizeExpectedPeople(
      body.expectedPeople,
    );

    const defaultDiveUnitPrice = normalizeUnitPrice(
      body.defaultDiveUnitPrice,
    );

    const memo = normalizeText(body.memo);

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

    if (endDate < startDate) {
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

    if (expectedPeople < 1) {
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

    const billingType: GroupDiveBillingType =
      isBillingType(body.billingType)
        ? body.billingType
        : "GROUP";

    const status: GroupDiveStatus =
      isGroupDiveStatus(body.status)
        ? body.status
        : "ACTIVE";

    const input: GroupDiveInput = {
      groupName,
      representativeName,
      representativePhone,
      startDate,
      endDate,
      expectedPeople,
      billingType,
      defaultDiveUnitPrice,
      status,
      memo,
    };

    const repository = getGroupDiveRepository();
    const groupDive = await repository.create(input);

    return NextResponse.json(
      {
        ok: true,
        groupDive,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Failed to create group dive:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "그룹 다이빙을 등록하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}