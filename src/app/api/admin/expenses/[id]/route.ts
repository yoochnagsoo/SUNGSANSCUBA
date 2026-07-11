import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import {
  s3Client,
  s3GalleryBucket,
} from "@/lib/aws/s3";

import { getExpenseRepository } from "@/lib/expenses/expenseRepository";

import type {
  ExpenseCategory,
  ExpensePaymentMethod,
  ExpenseUpdateInput,
} from "@/lib/expenses/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "RENT",
  "UTILITIES",
  "BOAT",
  "FUEL",
  "EQUIPMENT",
  "SUPPLIES",
  "MAINTENANCE",
  "TRANSPORTATION",
  "MEAL",
  "SALARY",
  "INSURANCE",
  "TAX",
  "MARKETING",
  "EDUCATION",
  "FEE",
  "OTHER",
];

const VALID_PAYMENT_METHODS: ExpensePaymentMethod[] = [
  "CASH",
  "CARD",
  "TRANSFER",
  "NAVER_PAY",
  "KAKAO_PAY",
  "OTHER",
];

const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  "image/webp",
  "application/pdf",
]);

function isValidDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function isExpenseCategory(
  value: unknown,
): value is ExpenseCategory {
  return VALID_EXPENSE_CATEGORIES.includes(
    value as ExpenseCategory,
  );
}

function isPaymentMethod(
  value: unknown,
): value is ExpensePaymentMethod {
  return VALID_PAYMENT_METHODS.includes(
    value as ExpensePaymentMethod,
  );
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseAmount(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const amount = Math.round(parsed);

  if (amount <= 0) {
    return null;
  }

  return amount;
}

function parseNonNegativeNumber(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function isValidReceiptKey(key: string) {
  return key.startsWith("expenses/receipts/");
}

async function deleteReceiptFromS3(receiptKey: string) {
  if (
    !receiptKey ||
    !isValidReceiptKey(receiptKey) ||
    !s3GalleryBucket
  ) {
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: s3GalleryBucket,
      Key: receiptKey,
    }),
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "경비 ID가 필요합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const repository = getExpenseRepository();
    const expense = await repository.findById(id);

    if (!expense) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "경비 내역을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      expense,
    });
  } catch (error) {
    console.error("경비 상세 조회 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "경비 내역을 불러오는 중 오류가 발생했습니다.",
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

    if (!id?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "경비 ID가 필요합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const repository = getExpenseRepository();
    const currentExpense =
      await repository.findById(id);

    if (!currentExpense) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "경비 내역을 찾을 수 없습니다.",
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

    const input: ExpenseUpdateInput = {};

    if (typeof body.expenseDate !== "undefined") {
      const expenseDate = normalizeText(
        body.expenseDate,
      );

      if (!isValidDate(expenseDate)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "지출일을 올바르게 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.expenseDate = expenseDate;
    }

    if (typeof body.category !== "undefined") {
      if (!isExpenseCategory(body.category)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "유효하지 않은 지출 분류입니다.",
          },
          {
            status: 400,
          },
        );
      }

      input.category = body.category;
    }

    if (typeof body.title !== "undefined") {
      const title = normalizeText(body.title);

      if (!title) {
        return NextResponse.json(
          {
            ok: false,
            message: "지출명을 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      if (title.length > 100) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "지출명은 100자 이하로 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.title = title;
    }

    if (typeof body.amount !== "undefined") {
      const amount = parseAmount(body.amount);

      if (amount === null) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "지출 금액은 0원보다 큰 숫자로 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.amount = amount;
    }

    if (
      typeof body.paymentMethod !== "undefined"
    ) {
      if (!isPaymentMethod(body.paymentMethod)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "유효하지 않은 결제수단입니다.",
          },
          {
            status: 400,
          },
        );
      }

      input.paymentMethod = body.paymentMethod;
    }

    if (typeof body.vendor !== "undefined") {
      const vendor = normalizeText(body.vendor);

      if (vendor.length > 100) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "거래처는 100자 이하로 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.vendor = vendor;
    }

    if (typeof body.memo !== "undefined") {
      const memo = normalizeText(body.memo);

      if (memo.length > 1000) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "메모는 1,000자 이하로 입력해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      input.memo = memo;
    }

    let nextHasReceipt = currentExpense.hasReceipt;

    if (typeof body.hasReceipt !== "undefined") {
      const hasReceipt = parseBoolean(
        body.hasReceipt,
      );

      if (hasReceipt === null) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "증빙 여부 값이 올바르지 않습니다.",
          },
          {
            status: 400,
          },
        );
      }

      nextHasReceipt = hasReceipt;
      input.hasReceipt = hasReceipt;
    }

    const hasReceiptFields =
      typeof body.receiptKey !== "undefined" ||
      typeof body.receiptUrl !== "undefined" ||
      typeof body.receiptFileName !== "undefined" ||
      typeof body.receiptMimeType !== "undefined" ||
      typeof body.receiptSize !== "undefined";

    if (nextHasReceipt) {
      const receiptKey =
        typeof body.receiptKey !== "undefined"
          ? normalizeText(body.receiptKey)
          : currentExpense.receiptKey;

      const receiptUrl =
        typeof body.receiptUrl !== "undefined"
          ? normalizeText(body.receiptUrl)
          : currentExpense.receiptUrl;

      const receiptFileName =
        typeof body.receiptFileName !== "undefined"
          ? normalizeText(body.receiptFileName)
          : currentExpense.receiptFileName;

      const receiptMimeType =
        typeof body.receiptMimeType !== "undefined"
          ? normalizeText(body.receiptMimeType)
          : currentExpense.receiptMimeType;

      const receiptSize =
        typeof body.receiptSize !== "undefined"
          ? parseNonNegativeNumber(body.receiptSize)
          : currentExpense.receiptSize;

      if (
        !receiptKey ||
        !receiptUrl ||
        !receiptFileName ||
        !receiptMimeType
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "증빙 자료를 선택한 경우 영수증 파일을 등록해주세요.",
          },
          {
            status: 400,
          },
        );
      }

      if (!isValidReceiptKey(receiptKey)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "영수증 파일 경로가 올바르지 않습니다.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        !ALLOWED_RECEIPT_MIME_TYPES.has(
          receiptMimeType,
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "영수증 파일 형식이 올바르지 않습니다.",
          },
          {
            status: 400,
          },
        );
      }

      if (hasReceiptFields) {
        input.receiptKey = receiptKey;
        input.receiptUrl = receiptUrl;
        input.receiptFileName = receiptFileName;
        input.receiptMimeType = receiptMimeType;
        input.receiptSize = receiptSize;
      }
    } else {
      input.receiptKey = "";
      input.receiptUrl = "";
      input.receiptFileName = "";
      input.receiptMimeType = "";
      input.receiptSize = 0;
    }

    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "수정할 항목이 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const expense = await repository.update(
      id,
      input,
    );

    if (!expense) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "경비 내역을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const oldReceiptShouldBeDeleted =
      Boolean(currentExpense.receiptKey) &&
      (
        !expense.hasReceipt ||
        currentExpense.receiptKey !==
          expense.receiptKey
      );

    if (oldReceiptShouldBeDeleted) {
      try {
        await deleteReceiptFromS3(
          currentExpense.receiptKey,
        );
      } catch (error) {
        console.error(
          "기존 영수증 S3 삭제 오류:",
          error,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      expense,
      message: "경비 내역이 수정되었습니다.",
    });
  } catch (error) {
    console.error("경비 수정 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "경비 내역을 수정하는 중 오류가 발생했습니다.",
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

    if (!id?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "경비 ID가 필요합니다.",
        },
        {
          status: 400,
        },
      );
    }

    const repository = getExpenseRepository();
    const expense = await repository.findById(id);

    if (!expense) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "경비 내역을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    const deleted = await repository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "경비 내역을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    if (expense.receiptKey) {
      try {
        await deleteReceiptFromS3(
          expense.receiptKey,
        );
      } catch (error) {
        console.error(
          "경비 삭제 후 영수증 S3 삭제 오류:",
          error,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "경비 내역이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("경비 삭제 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "경비 내역을 삭제하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}