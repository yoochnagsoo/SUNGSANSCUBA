import { NextRequest, NextResponse } from "next/server";

import { staffScheduleRepository } from "@/lib/staffSchedules/staffScheduleRepository";
import type {
  StaffScheduleInput,
  StaffScheduleType,
} from "@/lib/staffSchedules/types";

const VALID_STAFF_SCHEDULE_TYPES: StaffScheduleType[] = [
  "VACATION",
  "HALF_DAY_AM",
  "HALF_DAY_PM",
  "SICK_LEAVE",
  "UNAVAILABLE",
  "TRAINING",
  "BUSINESS_TRIP",
];

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function isEndDateBeforeStartDate(startDate: string, endDate?: string) {
  if (!endDate) {
    return false;
  }

  return new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`);
}

export async function GET() {
  try {
    const staffSchedules = await staffScheduleRepository.findAll();

    return NextResponse.json({
      ok: true,
      staffSchedules,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "직원 일정을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<StaffScheduleInput>;

    const staffName = body.staffName?.trim() || "";
    const type = body.type;
    const date = body.date?.trim() || "";
    const endDate = body.endDate?.trim() || "";
    const memo = body.memo?.trim() || "";

    if (!staffName) {
      return NextResponse.json(
        {
          ok: false,
          message: "직원명을 입력해주세요.",
        },
        { status: 400 },
      );
    }

    if (!type || !VALID_STAFF_SCHEDULE_TYPES.includes(type)) {
      return NextResponse.json(
        {
          ok: false,
          message: "올바른 직원 일정 구분이 아닙니다.",
        },
        { status: 400 },
      );
    }

    if (!date || !isValidDate(date)) {
      return NextResponse.json(
        {
          ok: false,
          message: "시작일을 올바르게 입력해주세요.",
        },
        { status: 400 },
      );
    }

    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json(
        {
          ok: false,
          message: "종료일을 올바르게 입력해주세요.",
        },
        { status: 400 },
      );
    }

    if (isEndDateBeforeStartDate(date, endDate)) {
      return NextResponse.json(
        {
          ok: false,
          message: "종료일은 시작일보다 빠를 수 없습니다.",
        },
        { status: 400 },
      );
    }

    const staffSchedule = await staffScheduleRepository.create({
      staffName,
      type,
      date,
      endDate: endDate || undefined,
      memo,
    });

    return NextResponse.json({
      ok: true,
      staffSchedule,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "직원 일정을 등록하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}