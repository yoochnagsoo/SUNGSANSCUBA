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
        hasReceipt: input.hasReceipt ?? false,

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

      const updated: Expense = {
        ...current,

        expenseDate:
          input.expenseDate ??
          current.expenseDate,

        category:
          input.category ?? current.category,

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

        hasReceipt:
          typeof input.hasReceipt !== "undefined"
            ? input.hasReceipt
            : current.hasReceipt,

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