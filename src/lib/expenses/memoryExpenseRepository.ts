import type {
  Expense,
  ExpenseInput,
  ExpenseListOptions,
  ExpenseRepository,
  ExpenseUpdateInput,
} from "./types";

const expenses: Expense[] = [];

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
  return typeof value === "string"
    ? value.trim()
    : "";
}

function sortExpenses(items: Expense[]) {
  return [...items].sort((a, b) => {
    const dateCompare =
      b.expenseDate.localeCompare(a.expenseDate);

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
      (expense) =>
        expense.category === options.category,
    );
  }

  if (
    options?.paymentMethod &&
    options.paymentMethod !== "ALL"
  ) {
    result = result.filter(
      (expense) =>
        expense.paymentMethod ===
        options.paymentMethod,
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

export const memoryExpenseRepository: ExpenseRepository =
  {
    async create(
      input: ExpenseInput,
    ): Promise<Expense> {
      const now = new Date().toISOString();

      const receiptKey = normalizeText(
        input.receiptKey,
      );

      const hasReceipt =
        input.hasReceipt === true &&
        Boolean(receiptKey);

      const expense: Expense = {
        id: createId(),

        expenseDate: input.expenseDate,
        category: input.category,

        title: normalizeText(input.title),
        amount: normalizeAmount(input.amount),

        paymentMethod:
          input.paymentMethod ?? "CARD",

        vendor: normalizeText(input.vendor),

        memo: normalizeText(input.memo),
        hasReceipt,

        receiptKey: hasReceipt
          ? receiptKey
          : "",

        receiptUrl: hasReceipt
          ? normalizeText(input.receiptUrl)
          : "",

        receiptFileName: hasReceipt
          ? normalizeText(
              input.receiptFileName,
            )
          : "",

        receiptMimeType: hasReceipt
          ? normalizeText(
              input.receiptMimeType,
            )
          : "",

        receiptSize: hasReceipt
          ? normalizeAmount(input.receiptSize)
          : 0,

        createdById: normalizeText(
          input.createdById,
        ),

        createdByName: normalizeText(
          input.createdByName,
        ),

        createdAt: now,
        updatedAt: now,
      };

      expenses.push(expense);

      return expense;
    },

    async findAll(
      options?: ExpenseListOptions,
    ): Promise<Expense[]> {
      return sortExpenses(
        filterExpenses(expenses, options),
      );
    },

    async findById(
      id: string,
    ): Promise<Expense | null> {
      return (
        expenses.find(
          (expense) => expense.id === id,
        ) ?? null
      );
    },

    async update(
      id: string,
      input: ExpenseUpdateInput,
    ): Promise<Expense | null> {
      const index = expenses.findIndex(
        (expense) => expense.id === id,
      );

      if (index === -1) {
        return null;
      }

      const current = expenses[index];

      const nextHasReceipt =
        typeof input.hasReceipt === "boolean"
          ? input.hasReceipt
          : current.hasReceipt;

      const nextReceiptKey =
        typeof input.receiptKey !== "undefined"
          ? normalizeText(input.receiptKey)
          : current.receiptKey;

      const hasReceipt =
        nextHasReceipt &&
        Boolean(nextReceiptKey);

      const updated: Expense = {
        ...current,

        expenseDate:
          input.expenseDate ??
          current.expenseDate,

        category:
          input.category ??
          current.category,

        title:
          typeof input.title !== "undefined"
            ? normalizeText(input.title)
            : current.title,

        amount:
          typeof input.amount !== "undefined"
            ? normalizeAmount(input.amount)
            : current.amount,

        paymentMethod:
          input.paymentMethod ??
          current.paymentMethod,

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
          ? typeof input.receiptUrl !==
            "undefined"
            ? normalizeText(
                input.receiptUrl,
              )
            : current.receiptUrl
          : "",

        receiptFileName: hasReceipt
          ? typeof input.receiptFileName !==
            "undefined"
            ? normalizeText(
                input.receiptFileName,
              )
            : current.receiptFileName
          : "",

        receiptMimeType: hasReceipt
          ? typeof input.receiptMimeType !==
            "undefined"
            ? normalizeText(
                input.receiptMimeType,
              )
            : current.receiptMimeType
          : "",

        receiptSize: hasReceipt
          ? typeof input.receiptSize !==
            "undefined"
            ? normalizeAmount(
                input.receiptSize,
              )
            : current.receiptSize
          : 0,

        updatedAt: new Date().toISOString(),
      };

      expenses[index] = updated;

      return updated;
    },

    async delete(id: string): Promise<boolean> {
      const index = expenses.findIndex(
        (expense) => expense.id === id,
      );

      if (index === -1) {
        return false;
      }

      expenses.splice(index, 1);

      return true;
    },
  };