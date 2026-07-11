export type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "BOAT"
  | "FUEL"
  | "EQUIPMENT"
  | "SUPPLIES"
  | "MAINTENANCE"
  | "TRANSPORTATION"
  | "MEAL"
  | "SALARY"
  | "INSURANCE"
  | "TAX"
  | "MARKETING"
  | "EDUCATION"
  | "FEE"
  | "OTHER";

export type ExpensePaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "OTHER";

export type Expense = {
  id: string;

  expenseDate: string;
  category: ExpenseCategory;

  title: string;
  amount: number;

  paymentMethod: ExpensePaymentMethod;
  vendor: string;

  memo: string;
  hasReceipt: boolean;

  receiptKey: string;
  receiptUrl: string;
  receiptFileName: string;
  receiptMimeType: string;
  receiptSize: number;

  createdById: string;
  createdByName: string;

  createdAt: string;
  updatedAt: string;
};

export type ExpenseInput = {
  expenseDate: string;
  category: ExpenseCategory;

  title: string;
  amount: number;

  paymentMethod?: ExpensePaymentMethod;
  vendor?: string;

  memo?: string;
  hasReceipt?: boolean;

  receiptKey?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptMimeType?: string;
  receiptSize?: number;

  createdById?: string;
  createdByName?: string;
};

export type ExpenseUpdateInput = {
  expenseDate?: string;
  category?: ExpenseCategory;

  title?: string;
  amount?: number;

  paymentMethod?: ExpensePaymentMethod;
  vendor?: string;

  memo?: string;
  hasReceipt?: boolean;

  receiptKey?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptMimeType?: string;
  receiptSize?: number;
};

export type ExpenseListOptions = {
  startDate?: string;
  endDate?: string;

  category?: ExpenseCategory | "ALL";
  paymentMethod?: ExpensePaymentMethod | "ALL";

  keyword?: string;
};

export type ExpenseRepository = {
  create(input: ExpenseInput): Promise<Expense>;

  findAll(
    options?: ExpenseListOptions,
  ): Promise<Expense[]>;

  findById(id: string): Promise<Expense | null>;

  update(
    id: string,
    input: ExpenseUpdateInput,
  ): Promise<Expense | null>;

  delete(id: string): Promise<boolean>;
};