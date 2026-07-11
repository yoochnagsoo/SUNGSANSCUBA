import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "@/lib/aws/dynamodb";

import type {
  Expense,
  ExpenseInput,
  ExpenseListOptions,
  ExpenseRepository,
  ExpenseUpdateInput,
} from "./types";

function getTableName() {
  const tableName = process.env.EXPENSES_TABLE_NAME;

  if (!tableName) {
    throw new Error(
      "EXPENSES_TABLE_NAME 환경변수가 설정되지 않았습니다.",
    );
  }

  return tableName;
}

function createId() {
  return crypto.randomUUID();
}

function normalizeAmount(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(Math.round(parsed), 0);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeExpense(
  value: Partial<Expense>,
): Expense {
  return {
    id: normalizeText(value.id),

    expenseDate: normalizeText(value.expenseDate),
    category: value.category ?? "OTHER",

    title: normalizeText(value.title),
    amount: normalizeAmount(value.amount),

    paymentMethod: value.paymentMethod ?? "CARD",
    vendor: normalizeText(value.vendor),

    memo: normalizeText(value.memo),
    hasReceipt: value.hasReceipt === true,

    receiptKey: normalizeText(value.receiptKey),
    receiptUrl: normalizeText(value.receiptUrl),
    receiptFileName: normalizeText(
      value.receiptFileName,
    ),
    receiptMimeType: normalizeText(
      value.receiptMimeType,
    ),
    receiptSize: normalizeAmount(value.receiptSize),

    createdById: normalizeText(value.createdById),
    createdByName: normalizeText(value.createdByName),

    createdAt: normalizeText(value.createdAt),
    updatedAt: normalizeText(value.updatedAt),
  };
}

function sortExpenses(items: Expense[]) {
  return [...items].sort((a, b) => {
    const dateCompare = b.expenseDate.localeCompare(
      a.expenseDate,
    );

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function filterExpenses(
  items: Expense[],
  options?: ExpenseListOptions,
) {
  let result = [...items];

  if (options?.startDate) {
    result = result.filter(
      (expense) =>
        expense.expenseDate >= options.startDate!,
    );
  }

  if (options?.endDate) {
    result = result.filter(
      (expense) =>
        expense.expenseDate <= options.endDate!,
    );
  }

  if (
    options?.category &&
    options.category !== "ALL"
  ) {
    result = result.filter(
      (expense) => expense.category === options.category,
    );
  }

  if (
    options?.paymentMethod &&
    options.paymentMethod !== "ALL"
  ) {
    result = result.filter(
      (expense) =>
        expense.paymentMethod === options.paymentMethod,
    );
  }

  const keyword =
    options?.keyword?.trim().toLowerCase() ?? "";

  if (keyword) {
    result = result.filter((expense) =>
      [
        expense.title,
        expense.vendor,
        expense.memo,
        expense.createdByName,
        expense.receiptFileName,
        expense.category,
        expense.paymentMethod,
      ].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }

  return result;
}

async function findExpenseById(
  id: string,
): Promise<Expense | null> {
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: getTableName(),
      Key: {
        id,
      },
    }),
  );

  if (!result.Item) {
    return null;
  }

  return normalizeExpense(
    result.Item as Partial<Expense>,
  );
}

export const dynamoExpenseRepository: ExpenseRepository = {
  async create(
    input: ExpenseInput,
  ): Promise<Expense> {
    const now = new Date().toISOString();

    const hasReceipt =
      input.hasReceipt === true &&
      Boolean(normalizeText(input.receiptKey));

    const expense: Expense = {
      id: createId(),

      expenseDate: input.expenseDate,
      category: input.category,

      title: normalizeText(input.title),
      amount: normalizeAmount(input.amount),

      paymentMethod: input.paymentMethod ?? "CARD",
      vendor: normalizeText(input.vendor),

      memo: normalizeText(input.memo),
      hasReceipt,

      receiptKey: hasReceipt
        ? normalizeText(input.receiptKey)
        : "",
      receiptUrl: hasReceipt
        ? normalizeText(input.receiptUrl)
        : "",
      receiptFileName: hasReceipt
        ? normalizeText(input.receiptFileName)
        : "",
      receiptMimeType: hasReceipt
        ? normalizeText(input.receiptMimeType)
        : "",
      receiptSize: hasReceipt
        ? normalizeAmount(input.receiptSize)
        : 0,

      createdById: normalizeText(input.createdById),
      createdByName: normalizeText(input.createdByName),

      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: getTableName(),
        Item: expense,
        ConditionExpression: "attribute_not_exists(id)",
      }),
    );

    return expense;
  },

  async findAll(
    options?: ExpenseListOptions,
  ): Promise<Expense[]> {
    const items: Expense[] = [];

    let lastEvaluatedKey:
      | Record<string, unknown>
      | undefined;

    do {
      const result = await dynamoDb.send(
        new ScanCommand({
          TableName: getTableName(),
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );

      for (const item of result.Items ?? []) {
        items.push(
          normalizeExpense(item as Partial<Expense>),
        );
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return sortExpenses(
      filterExpenses(items, options),
    );
  },

  async findById(
    id: string,
  ): Promise<Expense | null> {
    return findExpenseById(id);
  },

  async update(
    id: string,
    input: ExpenseUpdateInput,
  ): Promise<Expense | null> {
    const current = await findExpenseById(id);

    if (!current) {
      return null;
    }

    const nextHasReceipt =
      typeof input.hasReceipt === "boolean"
        ? input.hasReceipt
        : current.hasReceipt;

    const nextReceiptKey =
      typeof input.receiptKey !== "undefined"
        ? normalizeText(input.receiptKey)
        : current.receiptKey;

    const hasReceipt =
      nextHasReceipt && Boolean(nextReceiptKey);

    const updated: Expense = {
      ...current,

      expenseDate:
        input.expenseDate ?? current.expenseDate,

      category: input.category ?? current.category,

      title:
        typeof input.title !== "undefined"
          ? normalizeText(input.title)
          : current.title,

      amount:
        typeof input.amount !== "undefined"
          ? normalizeAmount(input.amount)
          : current.amount,

      paymentMethod:
        input.paymentMethod ?? current.paymentMethod,

      vendor:
        typeof input.vendor !== "undefined"
          ? normalizeText(input.vendor)
          : current.vendor,

      memo:
        typeof input.memo !== "undefined"
          ? normalizeText(input.memo)
          : current.memo,

      hasReceipt,

      receiptKey: hasReceipt
        ? nextReceiptKey
        : "",

      receiptUrl: hasReceipt
        ? typeof input.receiptUrl !== "undefined"
          ? normalizeText(input.receiptUrl)
          : current.receiptUrl
        : "",

      receiptFileName: hasReceipt
        ? typeof input.receiptFileName !== "undefined"
          ? normalizeText(input.receiptFileName)
          : current.receiptFileName
        : "",

      receiptMimeType: hasReceipt
        ? typeof input.receiptMimeType !== "undefined"
          ? normalizeText(input.receiptMimeType)
          : current.receiptMimeType
        : "",

      receiptSize: hasReceipt
        ? typeof input.receiptSize !== "undefined"
          ? normalizeAmount(input.receiptSize)
          : current.receiptSize
        : 0,

      updatedAt: new Date().toISOString(),
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: getTableName(),
        Item: updated,
        ConditionExpression: "attribute_exists(id)",
      }),
    );

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const current = await findExpenseById(id);

    if (!current) {
      return false;
    }

    await dynamoDb.send(
      new DeleteCommand({
        TableName: getTableName(),
        Key: {
          id,
        },
        ConditionExpression: "attribute_exists(id)",
      }),
    );

    return true;
  },
};