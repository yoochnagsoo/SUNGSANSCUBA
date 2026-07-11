import { dynamoExpenseRepository } from "./dynamoExpenseRepository";

import type { ExpenseRepository } from "./types";

export const expenseRepository: ExpenseRepository =
  dynamoExpenseRepository;

export function getExpenseRepository(): ExpenseRepository {
  return expenseRepository;
}

export type {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseListOptions,
  ExpensePaymentMethod,
  ExpenseRepository,
  ExpenseUpdateInput,
} from "./types";