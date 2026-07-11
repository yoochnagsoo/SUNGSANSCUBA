import { NextRequest, NextResponse } from "next/server";

import { getExpenseRepository } from "@/lib/expenses/expenseRepository";
import type {
  ExpenseCategory,
  ExpenseInput,
  ExpensePaymentMethod,
} from "@/lib/expenses/types";

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

  return false;
}

function isValidReceiptKey(value: string) {
  return value.startsWith("expenses/receipts/");
}

export async function GET(request: NextRequest) {
  try {
    const repository = getExpenseRepository();
    const searchParams = request.nextUrl.searchParams;

    const startDate =
      searchParams.get("startDate")?.trim() || undefined;

    const endDate =
      searchParams.get("endDate")?.trim() || undefined;

    const categoryValue =
      searchParams.get("category")?.trim() || "ALL";

    const paymentMethodValue =
      searchParams.get("paymentMethod")?.trim() || "ALL";

    const keyword =
      searchParams.get("keyword")?.trim() || undefined;

    if (startDate && !isValidDate(startDate)) {
      return NextResponse.json(
        {
          ok: false,
          message: "시작일 형식이 올바르지 않습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json(
        {
          ok: false,
          message: "종료일 형식이 올바르지 않습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "시작일은 종료일보다 늦을 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      categoryValue !== "ALL" &&
      !isExpenseCategory(categoryValue)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "유효하지 않은 지출 분류입니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      paymentMethodValue !== "ALL" &&
      !isPaymentMethod(paymentMethodValue)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "유효하지 않은 결제수단입니다.",
        },
        {
          status: 400,
        },
      );
    }

    const expenses = await repository.findAll({
      startDate,
      endDate,
      category:
        categoryValue === "ALL"
          ? "ALL"
          : categoryValue,
      paymentMethod:
        paymentMethodValue === "ALL"
          ? "ALL"
          : paymentMethodValue,
      keyword,
    });

    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    return NextResponse.json({
      ok: true,
      expenses,
      summary: {
        count: expenses.length,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("경비 목록 조회 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "경비 목록을 불러오는 중 오류가 발생했습니다.",
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

    const expenseDate = normalizeText(
      body.expenseDate,
    );

    const title = normalizeText(body.title);
    const vendor = normalizeText(body.vendor);
    const memo = normalizeText(body.memo);

    const amount = parseAmount(body.amount);
    const hasReceipt = parseBoolean(body.hasReceipt);

    const receiptKey = normalizeText(body.receiptKey);
    const receiptUrl = normalizeText(body.receiptUrl);

    const receiptFileName = normalizeText(
      body.receiptFileName,
    );

    const receiptMimeType = normalizeText(
      body.receiptMimeType,
    );

    const receiptSize = parseNonNegativeNumber(
      body.receiptSize,
    );

    if (!isValidDate(expenseDate)) {
      return NextResponse.json(
        {
          ok: false,
          message: "지출일을 올바르게 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isExpenseCategory(body.category)) {
      return NextResponse.json(
        {
          ok: false,
          message: "지출 분류를 선택해주세요.",
        },
        {
          status: 400,
        },
      );
    }

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

    const paymentMethod =
      typeof body.paymentMethod === "undefined"
        ? "CARD"
        : body.paymentMethod;

    if (!isPaymentMethod(paymentMethod)) {
      return NextResponse.json(
        {
          ok: false,
          message: "결제수단을 선택해주세요.",
        },
        {
          status: 400,
        },
      );
    }

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

    if (hasReceipt) {
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
    }

    const input: ExpenseInput = {
      expenseDate,
      category: body.category,

      title,
      amount,

      paymentMethod,
      vendor,

      memo,
      hasReceipt,

      receiptKey: hasReceipt ? receiptKey : "",
      receiptUrl: hasReceipt ? receiptUrl : "",
      receiptFileName: hasReceipt
        ? receiptFileName
        : "",
      receiptMimeType: hasReceipt
        ? receiptMimeType
        : "",
      receiptSize: hasReceipt ? receiptSize : 0,

      createdById: normalizeText(body.createdById),
      createdByName: normalizeText(
        body.createdByName,
      ),
    };

    const repository = getExpenseRepository();
    const expense = await repository.create(input);

    return NextResponse.json(
      {
        ok: true,
        expense,
        message: "경비 내역이 등록되었습니다.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("경비 등록 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "경비 내역을 등록하는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}