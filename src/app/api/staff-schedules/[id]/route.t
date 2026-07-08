import { NextRequest, NextResponse } from "next/server";

import { staffScheduleRepository } from "@/lib/staffSchedules/staffScheduleRepository";
import type {
  StaffScheduleType,
  StaffScheduleUpdateInput,
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const staffSchedule = await staffScheduleRepository.findById(id);

    if (!staffSchedule) {
      return NextResponse.json(
        {
          ok: false,
          message: "직원 일정을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      staffSchedule,
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as StaffScheduleUpdateInput;

    const previousStaffSchedule = await staffScheduleRepository.findById(id);

    if (!previousStaffSchedule) {
      return NextResponse.json(
        {
          ok: false,
          message: "직원 일정을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    const updateInput: StaffScheduleUpdateInput = {};

    if (typeof body.staffName === "string") {
      const staffName = body.staffName.trim();

      if (!staffName) {
        return NextResponse.json(
          {
            ok: false,
            message: "직원명을 입력해주세요.",
          },
          { status: 400 },
        );
      }

      updateInput.staffName = staffName;
    }

    if (typeof body.type !== "undefined") {
      if (!VALID_STAFF_SCHEDULE_TYPES.includes(body.type)) {
        return NextResponse.json(
          {
            ok: false,
            message: "올바른 직원 일정 구분이 아닙니다.",
          },
          { status: 400 },
        );
      }

      updateInput.type = body.type;
    }

    if (typeof body.date === "string") {
      const date = body.date.trim();

      if (!date || !isValidDate(date)) {
        return NextResponse.json(
          {
            ok: false,
            message: "시작일을 올바르게 입력해주세요.",
          },
          { status: 400 },
        );
      }

      updateInput.date = date;
    }

    if (typeof body.endDate === "string") {
      const endDate = body.endDate.trim();

      if (endDate && !isValidDate(endDate)) {
        return NextResponse.json(
          {
            ok: false,
            message: "종료일을 올바르게 입력해주세요.",
          },
          { status: 400 },
        );
      }

      updateInput.endDate = endDate || undefined;
    }

    if (typeof body.memo === "string") {
      updateInput.memo = body.memo.trim();
    }

    const nextDate = updateInput.date || previousStaffSchedule.date;
    const nextEndDate =
      typeof updateInput.endDate !== "undefined"
        ? updateInput.endDate
        : previousStaffSchedule.endDate;

    if (isEndDateBeforeStartDate(nextDate, nextEndDate)) {
      return NextResponse.json(
        {
          ok: false,
          message: "종료일은 시작일보다 빠를 수 없습니다.",
        },
        { status: 400 },
      );
    }

    const staffSchedule = await staffScheduleRepository.update(id, updateInput);

    if (!staffSchedule) {
      return NextResponse.json(
        {
          ok: false,
          message: "직원 일정을 수정하지 못했습니다.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      staffSchedule,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "직원 일정을 수정하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const deleted = await staffScheduleRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          message: "직원 일정을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "직원 일정을 삭제하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}