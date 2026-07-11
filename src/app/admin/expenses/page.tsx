"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  FileX2,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";

import type {
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
} from "@/lib/expenses/types";

type ExpenseFormState = {
  expenseDate: string;
  category: ExpenseCategory;
  title: string;
  amount: string;
  paymentMethod: ExpensePaymentMethod;
  vendor: string;
  memo: string;
  hasReceipt: boolean;
};

type UploadedReceipt = {
  receiptKey: string;
  receiptUrl: string;
  receiptFileName: string;
  receiptMimeType: string;
  receiptSize: number;
};

type ReceiptViewerItem = {
  url: string;
  fileName: string;
  mimeType: string;
};

type ExpenseListResponse = {
  ok: boolean;
  expenses?: Expense[];
  summary?: {
    count: number;
    totalAmount: number;
  };
  message?: string;
};

type ExpenseMutationResponse = {
  ok: boolean;
  expense?: Expense;
  message?: string;
};

type ReceiptUploadResponse = {
  ok: boolean;
  receiptKey?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptMimeType?: string;
  receiptSize?: number;
  message?: string;
};

type CategoryOption = {
  value: ExpenseCategory;
  label: string;
};

type PaymentMethodOption = {
  value: ExpensePaymentMethod;
  label: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "RENT", label: "임대료" },
  { value: "UTILITIES", label: "공과금" },
  { value: "BOAT", label: "선박 관련" },
  { value: "FUEL", label: "유류비" },
  { value: "EQUIPMENT", label: "장비 구입" },
  { value: "SUPPLIES", label: "소모품" },
  { value: "MAINTENANCE", label: "수리·정비" },
  { value: "TRANSPORTATION", label: "교통비" },
  { value: "MEAL", label: "식비" },
  { value: "SALARY", label: "급여" },
  { value: "INSURANCE", label: "보험료" },
  { value: "TAX", label: "세금" },
  { value: "MARKETING", label: "광고·마케팅" },
  { value: "EDUCATION", label: "교육비" },
  { value: "FEE", label: "수수료" },
  { value: "OTHER", label: "기타" },
];

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: "CARD", label: "카드" },
  { value: "CASH", label: "현금" },
  { value: "TRANSFER", label: "계좌이체" },
  { value: "NAVER_PAY", label: "네이버페이" },
  { value: "KAKAO_PAY", label: "카카오페이" },
  { value: "OTHER", label: "기타" },
];

const PAGE_SIZE = 20;
const MAX_RECEIPT_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_RECEIPT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

function getToday() {
  return formatLocalDate(new Date());
}

function getCurrentMonthRange() {
  const now = new Date();

  return {
    startDate: formatLocalDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
    ),
    endDate: formatLocalDate(
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ),
    ),
  };
}

function getEmptyForm(): ExpenseFormState {
  return {
    expenseDate: getToday(),
    category: "OTHER",
    title: "",
    amount: "",
    paymentMethod: "CARD",
    vendor: "",
    memo: "",
    hasReceipt: false,
  };
}

function getCategoryLabel(category: ExpenseCategory) {
  return (
    CATEGORY_OPTIONS.find(
      (option) => option.value === category,
    )?.label ?? category
  );
}

function getPaymentMethodLabel(
  paymentMethod: ExpensePaymentMethod,
) {
  return (
    PAYMENT_METHOD_OPTIONS.find(
      (option) => option.value === paymentMethod,
    )?.label ?? paymentMethod
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatFileSize(value: number) {
  if (!value) {
    return "-";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeCsvValue(
  value: string | number | boolean,
) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function expenseToReceipt(
  expense: Expense,
): UploadedReceipt | null {
  if (
    !expense.hasReceipt ||
    !expense.receiptKey ||
    !expense.receiptUrl
  ) {
    return null;
  }

  return {
    receiptKey: expense.receiptKey,
    receiptUrl: expense.receiptUrl,
    receiptFileName: expense.receiptFileName,
    receiptMimeType: expense.receiptMimeType,
    receiptSize: expense.receiptSize,
  };
}

function isPdfMimeType(mimeType: string) {
  return mimeType === "application/pdf";
}

function isImageMimeType(mimeType: string) {
  return mimeType.startsWith("image/");
}

export default function AdminExpensesPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(
    null,
  );

  const currentMonthRange = useMemo(
    () => getCurrentMonthRange(),
    [],
  );

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [startDate, setStartDate] = useState(
    currentMonthRange.startDate,
  );

  const [endDate, setEndDate] = useState(
    currentMonthRange.endDate,
  );

  const [category, setCategory] = useState<
    ExpenseCategory | "ALL"
  >("ALL");

  const [paymentMethod, setPaymentMethod] = useState<
    ExpensePaymentMethod | "ALL"
  >("ALL");

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingReceipt, setUploadingReceipt] =
    useState(false);

  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const [form, setForm] = useState<ExpenseFormState>(
    getEmptyForm(),
  );

  const [receiptFile, setReceiptFile] =
    useState<File | null>(null);

  const [receiptFilePreviewUrl, setReceiptFilePreviewUrl] =
    useState("");

  const [existingReceipt, setExistingReceipt] =
    useState<UploadedReceipt | null>(null);

  const [receiptViewer, setReceiptViewer] =
    useState<ReceiptViewerItem | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const searchParams = new URLSearchParams();

      if (startDate) {
        searchParams.set("startDate", startDate);
      }

      if (endDate) {
        searchParams.set("endDate", endDate);
      }

      if (category !== "ALL") {
        searchParams.set("category", category);
      }

      if (paymentMethod !== "ALL") {
        searchParams.set(
          "paymentMethod",
          paymentMethod,
        );
      }

      if (appliedKeyword) {
        searchParams.set("keyword", appliedKeyword);
      }

      const response = await fetch(
        `/api/admin/expenses?${searchParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as ExpenseListResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "경비 내역을 불러오지 못했습니다.",
        );
      }

      setExpenses(data.expenses ?? []);
      setCurrentPage(1);
    } catch (error) {
      setExpenses([]);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "경비 내역을 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    appliedKeyword,
    category,
    endDate,
    paymentMethod,
    startDate,
  ]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    return () => {
      if (receiptFilePreviewUrl) {
        URL.revokeObjectURL(receiptFilePreviewUrl);
      }
    };
  }, [receiptFilePreviewUrl]);

  useEffect(() => {
    if (!receiptViewer) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setReceiptViewer(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow = "";
    };
  }, [receiptViewer]);

  const totalAmount = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      ),
    [expenses],
  );

  const receiptCount = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          expense.hasReceipt &&
          Boolean(expense.receiptKey),
      ).length,
    [expenses],
  );

  const noReceiptCount =
    expenses.length - receiptCount;

  const categorySummary = useMemo(() => {
    const summary = new Map<
      ExpenseCategory,
      {
        count: number;
        amount: number;
      }
    >();

    for (const expense of expenses) {
      const current = summary.get(expense.category) ?? {
        count: 0,
        amount: 0,
      };

      summary.set(expense.category, {
        count: current.count + 1,
        amount: current.amount + expense.amount,
      });
    }

    return [...summary.entries()]
      .map(([summaryCategory, value]) => ({
        category: summaryCategory,
        count: value.count,
        amount: value.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const totalPages = Math.max(
    1,
    Math.ceil(expenses.length / PAGE_SIZE),
  );

  const paginatedExpenses = useMemo(() => {
    const startIndex =
      (currentPage - 1) * PAGE_SIZE;

    return expenses.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [currentPage, expenses]);

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function clearReceiptPreviewUrl() {
    if (receiptFilePreviewUrl) {
      URL.revokeObjectURL(receiptFilePreviewUrl);
      setReceiptFilePreviewUrl("");
    }
  }

  function resetReceiptSelection() {
    clearReceiptPreviewUrl();
    setReceiptFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openCreateForm() {
    clearMessages();

    setEditingExpense(null);
    setForm(getEmptyForm());
    setExistingReceipt(null);
    resetReceiptSelection();
    setFormOpen(true);
  }

  function openEditForm(expense: Expense) {
    clearMessages();

    setEditingExpense(expense);

    setForm({
      expenseDate: expense.expenseDate,
      category: expense.category,
      title: expense.title,
      amount: String(expense.amount),
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor,
      memo: expense.memo,
      hasReceipt:
        expense.hasReceipt &&
        Boolean(expense.receiptKey),
    });

    setExistingReceipt(
      expenseToReceipt(expense),
    );

    resetReceiptSelection();
    setFormOpen(true);
  }

  function closeForm() {
    if (saving || uploadingReceipt) {
      return;
    }

    setFormOpen(false);
    setEditingExpense(null);
    setForm(getEmptyForm());
    setExistingReceipt(null);
    resetReceiptSelection();
  }

  function updateForm<K extends keyof ExpenseFormState>(
    key: K,
    value: ExpenseFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleReceiptToggle(checked: boolean) {
    updateForm("hasReceipt", checked);

    if (!checked) {
      resetReceiptSelection();
    }
  }

  function handleReceiptFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      resetReceiptSelection();
      return;
    }

    if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
      setErrorMessage(
        "영수증은 JPG, PNG, WEBP, GIF 또는 PDF 파일만 등록할 수 있습니다.",
      );

      event.target.value = "";
      resetReceiptSelection();
      return;
    }

    if (file.size > MAX_RECEIPT_FILE_SIZE) {
      setErrorMessage(
        "영수증 파일은 최대 20MB까지만 등록할 수 있습니다.",
      );

      event.target.value = "";
      resetReceiptSelection();
      return;
    }

    clearMessages();
    clearReceiptPreviewUrl();

    const previewUrl = URL.createObjectURL(file);

    setReceiptFile(file);
    setReceiptFilePreviewUrl(previewUrl);
  }

  function openExpenseReceipt(expense: Expense) {
    if (!expense.receiptUrl) {
      return;
    }

    setReceiptViewer({
      url: expense.receiptUrl,
      fileName:
        expense.receiptFileName || "영수증",
      mimeType: expense.receiptMimeType,
    });
  }

  function openExistingReceipt() {
    if (!existingReceipt) {
      return;
    }

    setReceiptViewer({
      url: existingReceipt.receiptUrl,
      fileName:
        existingReceipt.receiptFileName ||
        "영수증",
      mimeType: existingReceipt.receiptMimeType,
    });
  }

  function openSelectedReceipt() {
    if (!receiptFile || !receiptFilePreviewUrl) {
      return;
    }

    setReceiptViewer({
      url: receiptFilePreviewUrl,
      fileName: receiptFile.name,
      mimeType: receiptFile.type,
    });
  }

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    clearMessages();

    const nextKeyword = keyword.trim();

    setAppliedKeyword(nextKeyword);

    if (nextKeyword === appliedKeyword) {
      void loadExpenses();
    }
  }

  function handleResetFilters() {
    const range = getCurrentMonthRange();

    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setCategory("ALL");
    setPaymentMethod("ALL");
    setKeyword("");
    setAppliedKeyword("");
    setCurrentPage(1);
    clearMessages();
  }

  async function uploadReceipt(
    file: File,
  ): Promise<UploadedReceipt> {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      "/api/admin/expenses/receipts/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    const data =
      (await response.json()) as ReceiptUploadResponse;

    if (
      !response.ok ||
      !data.ok ||
      !data.receiptKey ||
      !data.receiptUrl ||
      !data.receiptFileName ||
      !data.receiptMimeType
    ) {
      throw new Error(
        data.message ??
          "영수증 파일을 업로드하지 못했습니다.",
      );
    }

    return {
      receiptKey: data.receiptKey,
      receiptUrl: data.receiptUrl,
      receiptFileName: data.receiptFileName,
      receiptMimeType: data.receiptMimeType,
      receiptSize: data.receiptSize ?? 0,
    };
  }

  async function deleteOrphanReceipt(
    receiptKey: string,
  ) {
    try {
      await fetch(
        "/api/admin/expenses/receipts/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiptKey,
          }),
        },
      );
    } catch (error) {
      console.error(
        "미사용 영수증 삭제 오류:",
        error,
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    clearMessages();

    const parsedAmount = Number(
      form.amount.replaceAll(",", ""),
    );

    if (!form.expenseDate) {
      setErrorMessage("지출일을 입력해주세요.");
      return;
    }

    if (!form.title.trim()) {
      setErrorMessage("지출명을 입력해주세요.");
      return;
    }

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setErrorMessage(
        "지출 금액은 0원보다 큰 숫자로 입력해주세요.",
      );
      return;
    }

    if (
      form.hasReceipt &&
      !receiptFile &&
      !existingReceipt
    ) {
      setErrorMessage(
        "증빙 자료 있음으로 선택한 경우 영수증 파일을 등록해주세요.",
      );
      return;
    }

    setSaving(true);

    let uploadedReceipt: UploadedReceipt | null =
      null;

    try {
      if (form.hasReceipt && receiptFile) {
        setUploadingReceipt(true);

        uploadedReceipt = await uploadReceipt(
          receiptFile,
        );

        setUploadingReceipt(false);
      }

      const receipt = form.hasReceipt
        ? uploadedReceipt ?? existingReceipt
        : null;

      const editing = editingExpense !== null;

      const response = await fetch(
        editing
          ? `/api/admin/expenses/${editingExpense.id}`
          : "/api/admin/expenses",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expenseDate: form.expenseDate,
            category: form.category,
            title: form.title.trim(),
            amount: Math.round(parsedAmount),
            paymentMethod: form.paymentMethod,
            vendor: form.vendor.trim(),
            memo: form.memo.trim(),

            hasReceipt: form.hasReceipt,

            receiptKey: receipt?.receiptKey ?? "",
            receiptUrl: receipt?.receiptUrl ?? "",
            receiptFileName:
              receipt?.receiptFileName ?? "",
            receiptMimeType:
              receipt?.receiptMimeType ?? "",
            receiptSize: receipt?.receiptSize ?? 0,
          }),
        },
      );

      const data =
        (await response.json()) as ExpenseMutationResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            `경비 내역을 ${
              editing ? "수정" : "등록"
            }하지 못했습니다.`,
        );
      }

      setFormOpen(false);
      setEditingExpense(null);
      setForm(getEmptyForm());
      setExistingReceipt(null);
      resetReceiptSelection();

      setSuccessMessage(
        data.message ??
          `경비 내역이 ${
            editing ? "수정" : "등록"
          }되었습니다.`,
      );

      await loadExpenses();
    } catch (error) {
      if (uploadedReceipt?.receiptKey) {
        await deleteOrphanReceipt(
          uploadedReceipt.receiptKey,
        );
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "경비 내역을 저장하는 중 오류가 발생했습니다.",
      );
    } finally {
      setSaving(false);
      setUploadingReceipt(false);
    }
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(
      [
        `"${expense.title}" 경비 내역을 삭제하시겠습니까?`,
        "",
        `금액: ${formatCurrency(expense.amount)}원`,
        expense.hasReceipt
          ? "등록된 영수증 파일도 함께 삭제됩니다."
          : "",
        "삭제한 내역은 복구할 수 없습니다.",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    if (!confirmed) {
      return;
    }

    clearMessages();
    setDeletingId(expense.id);

    try {
      const response = await fetch(
        `/api/admin/expenses/${expense.id}`,
        {
          method: "DELETE",
        },
      );

      const data =
        (await response.json()) as ExpenseMutationResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "경비 내역을 삭제하지 못했습니다.",
        );
      }

      setSuccessMessage(
        data.message ??
          "경비 내역이 삭제되었습니다.",
      );

      await loadExpenses();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "경비 내역을 삭제하는 중 오류가 발생했습니다.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCsv() {
    if (expenses.length === 0) {
      setErrorMessage(
        "다운로드할 경비 내역이 없습니다.",
      );
      return;
    }

    clearMessages();

    const rows = [
      [
        "지출일",
        "분류",
        "지출명",
        "금액",
        "결제수단",
        "거래처",
        "증빙",
        "영수증 파일명",
        "영수증 주소",
        "메모",
        "등록자",
        "등록일시",
      ],
      ...expenses.map((expense) => [
        expense.expenseDate,
        getCategoryLabel(expense.category),
        expense.title,
        expense.amount,
        getPaymentMethodLabel(
          expense.paymentMethod,
        ),
        expense.vendor,
        expense.hasReceipt ? "있음" : "없음",
        expense.receiptFileName,
        expense.receiptUrl,
        expense.memo,
        expense.createdByName,
        formatDateTime(expense.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => escapeCsvValue(value))
          .join(","),
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      [
        "sungsan-scuba-expenses",
        startDate || "all",
        endDate || "all",
      ].join("_") + ".csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-bold text-cyan-600">
              SUNGSAN SCUBA
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              경비·지출 관리
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              다이빙샵 운영 경비와 영수증 증빙 자료를
              함께 관리합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <Download className="h-4 w-4" />
              CSV 다운로드
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus className="h-5 w-5" />
              경비 등록
            </button>
          </div>
        </div>

        {errorMessage ? (
          <MessageBox
            type="error"
            onClose={() => setErrorMessage("")}
          >
            {errorMessage}
          </MessageBox>
        ) : null}

        {successMessage ? (
          <MessageBox
            type="success"
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </MessageBox>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="조회 지출 합계"
            value={`${formatCurrency(totalAmount)}원`}
            description="현재 검색 조건 기준"
            icon={CircleDollarSign}
          />

          <SummaryCard
            title="지출 건수"
            value={`${formatCurrency(expenses.length)}건`}
            description="현재 조회된 전체 내역"
            icon={ReceiptText}
          />

          <SummaryCard
            title="영수증 등록"
            value={`${formatCurrency(receiptCount)}건`}
            description="실제 파일이 등록된 증빙"
            icon={FileCheck2}
          />

          <SummaryCard
            title="영수증 미등록"
            value={`${formatCurrency(noReceiptCount)}건`}
            description="증빙 파일 확인 필요"
            icon={FileX2}
            warning={noReceiptCount > 0}
          />
        </div>

        <form
          onSubmit={handleSearch}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[160px_160px_180px_180px_minmax(220px,1fr)_auto]">
            <FilterDate
              label="시작일"
              value={startDate}
              onChange={setStartDate}
            />

            <FilterDate
              label="종료일"
              value={endDate}
              onChange={setEndDate}
            />

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">
                지출 분류
              </span>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value as
                      | ExpenseCategory
                      | "ALL",
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="ALL">전체 분류</option>

                {CATEGORY_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">
                결제수단
              </span>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value as
                      | ExpensePaymentMethod
                      | "ALL",
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="ALL">
                  전체 결제수단
                </option>

                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">
                검색
              </span>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={keyword}
                  onChange={(event) =>
                    setKeyword(event.target.value)
                  }
                  placeholder="지출명, 거래처, 메모 검색"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </label>

            <div className="flex items-end gap-2 md:col-span-2 xl:col-span-1">
              <button
                type="submit"
                className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-700 xl:flex-none"
              >
                <Search className="h-4 w-4" />
                조회
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                aria-label="검색 조건 초기화"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {categorySummary.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-950">
              분류별 지출
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categorySummary.map((item) => (
                <div
                  key={item.category}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-700">
                      {getCategoryLabel(item.category)}
                    </p>

                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">
                      {item.count}건
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-black text-slate-950">
                    {formatCurrency(item.amount)}원
                  </p>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{
                        width:
                          totalAmount > 0
                            ? `${Math.max(
                                (item.amount /
                                  totalAmount) *
                                  100,
                                2,
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">
                경비 내역
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                총 {formatCurrency(expenses.length)}건
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadExpenses()}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                className={[
                  "h-3.5 w-3.5",
                  loading ? "animate-spin" : "",
                ].join(" ")}
              />
              새로고침
            </button>
          </div>

          {loading ? (
            <LoadingState />
          ) : expenses.length === 0 ? (
            <EmptyState onCreate={openCreateForm} />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1180px] border-collapse">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <TableHeader>지출일</TableHeader>
                      <TableHeader>분류</TableHeader>
                      <TableHeader>지출명</TableHeader>
                      <TableHeader>거래처</TableHeader>
                      <TableHeader>결제수단</TableHeader>
                      <TableHeader>영수증</TableHeader>
                      <TableHeader align="right">
                        금액
                      </TableHeader>
                      <TableHeader align="right">
                        관리
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <TableCell>
                          <span className="whitespace-nowrap font-bold text-slate-700">
                            {expense.expenseDate}
                          </span>
                        </TableCell>

                        <TableCell>
                          <CategoryBadge
                            category={expense.category}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="max-w-[280px]">
                            <p className="truncate font-bold text-slate-950">
                              {expense.title}
                            </p>

                            {expense.memo ? (
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {expense.memo}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell>
                          {expense.vendor || "-"}
                        </TableCell>

                        <TableCell>
                          {getPaymentMethodLabel(
                            expense.paymentMethod,
                          )}
                        </TableCell>

                        <TableCell>
                          <ReceiptButton
                            expense={expense}
                            onClick={() =>
                              openExpenseReceipt(expense)
                            }
                          />
                        </TableCell>

                        <TableCell align="right">
                          <span className="whitespace-nowrap text-base font-black text-slate-950">
                            {formatCurrency(expense.amount)}원
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(expense)
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                              aria-label="경비 수정"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDelete(expense)
                              }
                              disabled={
                                deletingId === expense.id
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                              aria-label="경비 삭제"
                            >
                              {deletingId === expense.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {paginatedExpenses.map((expense) => (
                  <article
                    key={expense.id}
                    className="p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge
                            category={expense.category}
                          />

                          <span className="text-xs font-bold text-slate-500">
                            {expense.expenseDate}
                          </span>
                        </div>

                        <h3 className="mt-3 break-words text-base font-black text-slate-950">
                          {expense.title}
                        </h3>

                        <p className="mt-2 text-xl font-black text-cyan-700">
                          {formatCurrency(expense.amount)}원
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(expense)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                          aria-label="경비 수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(expense)
                          }
                          disabled={
                            deletingId === expense.id
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-rose-600 disabled:opacity-50"
                          aria-label="경비 삭제"
                        >
                          {deletingId === expense.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                      <InfoItem
                        label="결제수단"
                        value={getPaymentMethodLabel(
                          expense.paymentMethod,
                        )}
                      />

                      <InfoItem
                        label="거래처"
                        value={expense.vendor || "-"}
                      />

                      <div className="col-span-2">
                        <p className="text-xs font-bold text-slate-400">
                          영수증
                        </p>

                        <div className="mt-1">
                          <ReceiptButton
                            expense={expense}
                            onClick={() =>
                              openExpenseReceipt(expense)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {expense.memo ? (
                      <p className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 p-3 text-sm leading-6 text-slate-600">
                        {expense.memo}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>

              {totalPages > 1 ? (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onChange={setCurrentPage}
                />
              ) : null}
            </>
          )}
        </section>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-[9000] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            onClick={closeForm}
            className="absolute inset-0"
            aria-label="입력창 닫기"
          />

          <div className="relative z-10 flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {editingExpense
                    ? "경비 내역 수정"
                    : "경비 내역 등록"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  영수증은 이미지 또는 PDF로 등록할 수
                  있습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50"
                aria-label="경비 입력창 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="min-h-0 overflow-y-auto"
            >
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <FormField label="지출일" required>
                  <input
                    type="date"
                    required
                    value={form.expenseDate}
                    onChange={(event) =>
                      updateForm(
                        "expenseDate",
                        event.target.value,
                      )
                    }
                    className="form-input"
                  />
                </FormField>

                <FormField label="지출 분류" required>
                  <select
                    required
                    value={form.category}
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target
                          .value as ExpenseCategory,
                      )
                    }
                    className="form-input"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="지출명" required>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={form.title}
                      onChange={(event) =>
                        updateForm(
                          "title",
                          event.target.value,
                        )
                      }
                      placeholder="예: 보트 경유 주유"
                      className="form-input"
                    />
                  </FormField>
                </div>

                <FormField label="지출 금액" required>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={form.amount}
                      onChange={(event) =>
                        updateForm(
                          "amount",
                          event.target.value,
                        )
                      }
                      className="form-input pr-10 text-right font-black"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                      원
                    </span>
                  </div>
                </FormField>

                <FormField label="결제수단" required>
                  <select
                    required
                    value={form.paymentMethod}
                    onChange={(event) =>
                      updateForm(
                        "paymentMethod",
                        event.target
                          .value as ExpensePaymentMethod,
                      )
                    }
                    className="form-input"
                  >
                    {PAYMENT_METHOD_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="거래처">
                    <input
                      type="text"
                      maxLength={100}
                      value={form.vendor}
                      onChange={(event) =>
                        updateForm(
                          "vendor",
                          event.target.value,
                        )
                      }
                      className="form-input"
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <FormField label="메모">
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={form.memo}
                      onChange={(event) =>
                        updateForm(
                          "memo",
                          event.target.value,
                        )
                      }
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </FormField>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      증빙 자료 있음
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      선택하면 영수증 이미지 또는 PDF를
                      등록해야 합니다.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.hasReceipt}
                    onChange={(event) =>
                      handleReceiptToggle(
                        event.target.checked,
                      )
                    }
                    className="h-5 w-5 shrink-0 rounded border-slate-300 text-cyan-600"
                  />
                </label>

                {form.hasReceipt ? (
                  <div className="sm:col-span-2">
                    <FormField
                      label="영수증 파일"
                      required
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        onChange={
                          handleReceiptFileChange
                        }
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        disabled={saving}
                        className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition hover:border-cyan-400 hover:bg-cyan-50 disabled:opacity-50"
                      >
                        <Upload className="h-8 w-8 text-cyan-600" />

                        <span className="mt-3 text-sm font-black text-slate-800">
                          {existingReceipt
                            ? "영수증 파일 교체"
                            : "영수증 파일 선택"}
                        </span>

                        <span className="mt-1 text-xs text-slate-500">
                          JPG, PNG, WEBP, GIF, PDF · 최대
                          20MB
                        </span>
                      </button>

                      {receiptFile &&
                      receiptFilePreviewUrl ? (
                        <SelectedReceiptPreview
                          file={receiptFile}
                          previewUrl={
                            receiptFilePreviewUrl
                          }
                          onPreview={
                            openSelectedReceipt
                          }
                          onRemove={
                            resetReceiptSelection
                          }
                        />
                      ) : existingReceipt ? (
                        <ExistingReceiptPreview
                          receipt={existingReceipt}
                          onPreview={
                            openExistingReceipt
                          }
                        />
                      ) : null}

                      {editingExpense &&
                      existingReceipt &&
                      !receiptFile ? (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          현재 등록된 영수증입니다. 위
                          미리보기를 누르면 크게 볼 수
                          있습니다.
                        </p>
                      ) : null}

                      {editingExpense &&
                      existingReceipt &&
                      receiptFile ? (
                        <p className="mt-2 text-xs font-semibold text-amber-600">
                          수정 저장 시 기존 영수증은 삭제되고
                          새 파일로 교체됩니다.
                        </p>
                      ) : null}
                    </FormField>
                  </div>
                ) : null}
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 disabled:opacity-50"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      {uploadingReceipt
                        ? "영수증 업로드 중"
                        : "저장 중"}
                    </>
                  ) : editingExpense ? (
                    "수정 저장"
                  ) : (
                    "경비 등록"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {receiptViewer ? (
        <ReceiptViewerModal
          receipt={receiptViewer}
          onClose={() => setReceiptViewer(null)}
        />
      ) : null}

      <style jsx global>{`
        .form-input {
          height: 2.75rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgb(15 23 42);
          outline: none;
        }

        .form-input:focus {
          border-color: rgb(6 182 212);
          box-shadow: 0 0 0 2px rgb(207 250 254);
        }
      `}</style>
    </div>
  );
}

function ReceiptButton({
  expense,
  onClick,
}: {
  expense: Expense;
  onClick: () => void;
}) {
  if (
    !expense.hasReceipt ||
    !expense.receiptUrl
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
        <FileX2 className="h-3.5 w-3.5" />
        미등록
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex max-w-[190px] items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
    >
      <FileCheck2 className="h-3.5 w-3.5 shrink-0" />

      <span className="truncate">
        {expense.receiptFileName || "영수증 보기"}
      </span>

      <ZoomIn className="h-3.5 w-3.5 shrink-0" />
    </button>
  );
}

function ExistingReceiptPreview({
  receipt,
  onPreview,
}: {
  receipt: UploadedReceipt;
  onPreview: () => void;
}) {
  const isPdf = isPdfMimeType(
    receipt.receiptMimeType,
  );

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-200 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-800">
            {receipt.receiptFileName}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatFileSize(receipt.receiptSize)}
          </p>
        </div>

        <button
          type="button"
          onClick={onPreview}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
        >
          <ZoomIn className="h-4 w-4" />
          크게 보기
        </button>
      </div>

      <button
        type="button"
        onClick={onPreview}
        className="flex min-h-[220px] w-full items-center justify-center bg-white p-3"
      >
        {isPdf ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <FileText className="h-8 w-8" />
            </div>

            <p className="mt-4 text-sm font-black text-slate-800">
              PDF 영수증
            </p>

            <p className="mt-1 text-xs text-slate-500">
              클릭하면 모달에서 확인할 수 있습니다.
            </p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={receipt.receiptUrl}
            alt={receipt.receiptFileName}
            className="max-h-[360px] max-w-full rounded-xl object-contain"
          />
        )}
      </button>
    </div>
  );
}

function SelectedReceiptPreview({
  file,
  previewUrl,
  onPreview,
  onRemove,
}: {
  file: File;
  previewUrl: string;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const isPdf = isPdfMimeType(file.type);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50">
      <div className="flex items-center gap-3 border-b border-cyan-200 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600">
          {isPdf ? (
            <FileText className="h-5 w-5" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-800">
            {file.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatFileSize(file.size)}
          </p>
        </div>

        <button
          type="button"
          onClick={onPreview}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-3 text-xs font-bold text-white hover:bg-cyan-700"
        >
          <ZoomIn className="h-4 w-4" />
          미리보기
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label="선택한 영수증 제거"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 hover:text-rose-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onPreview}
        className="flex min-h-[220px] w-full items-center justify-center bg-white p-3"
      >
        {isPdf ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <FileText className="h-8 w-8" />
            </div>

            <p className="mt-4 text-sm font-black text-slate-800">
              선택한 PDF 영수증
            </p>

            <p className="mt-1 text-xs text-slate-500">
              클릭하면 모달에서 확인할 수 있습니다.
            </p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-[360px] max-w-full rounded-xl object-contain"
          />
        )}
      </button>
    </div>
  );
}

function ReceiptViewerModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptViewerItem;
  onClose: () => void;
}) {
  const isPdf = isPdfMimeType(receipt.mimeType);
  const isImage = isImageMimeType(receipt.mimeType);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm sm:p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="영수증 닫기"
      />

      <div className="relative z-10 flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-bold text-cyan-600">
              영수증 증빙
            </p>

            <h2 className="mt-1 truncate text-sm font-black text-slate-950 sm:text-base">
              {receipt.fileName}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={receipt.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              <ExternalLink className="h-4 w-4" />

              <span className="hidden sm:inline">
                원본 열기
              </span>
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="영수증 모달 닫기"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100">
          {isPdf ? (
            <iframe
              src={receipt.url}
              title={receipt.fileName}
              className="h-full min-h-[600px] w-full border-0 bg-white"
            />
          ) : isImage ? (
            <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receipt.url}
                alt={receipt.fileName}
                className="max-h-full max-w-full rounded-xl bg-white object-contain shadow-lg"
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center px-6 text-center">
              <FileText className="h-12 w-12 text-slate-400" />

              <p className="mt-4 text-sm font-black text-slate-700">
                미리보기를 지원하지 않는 파일입니다.
              </p>

              <a
                href={receipt.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"
              >
                <ExternalLink className="h-4 w-4" />
                원본 파일 열기
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBox({
  type,
  onClose,
  children,
}: {
  type: "error" | "success";
  onClose: () => void;
  children: ReactNode;
}) {
  const success = type === "success";

  return (
    <div
      className={[
        "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm font-semibold",
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        {success ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : null}

        <span>{children}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  warning = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof ReceiptText;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">
            {title}
          </p>

          <p
            className={[
              "mt-3 truncate text-2xl font-black",
              warning
                ? "text-amber-600"
                : "text-slate-950",
            ].join(" ")}
          >
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            warning
              ? "bg-amber-50 text-amber-600"
              : "bg-cyan-50 text-cyan-600",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FilterDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </span>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required ? (
          <span className="ml-1 text-rose-500">*</span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={[
        "whitespace-nowrap px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500",
        align === "right"
          ? "text-right"
          : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={[
        "px-5 py-4 text-sm text-slate-600",
        align === "right"
          ? "text-right"
          : "text-left",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function CategoryBadge({
  category,
}: {
  category: ExpenseCategory;
}) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-700">
      {getCategoryLabel(category)}
    </span>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-600" />

        <p className="mt-3 text-sm font-semibold text-slate-500">
          경비 내역을 불러오는 중입니다.
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <ReceiptText className="h-7 w-7 text-slate-400" />
      </div>

      <h3 className="mt-4 text-base font-black text-slate-900">
        조회된 경비 내역이 없습니다.
      </h3>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white"
      >
        <Plus className="h-4 w-4" />
        경비 등록
      </button>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-4 sm:px-5">
      <p className="text-xs font-semibold text-slate-500">
        {currentPage} / {totalPages} 페이지
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onChange(Math.max(currentPage - 1, 1))
          }
          disabled={currentPage <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </button>

        <button
          type="button"
          onClick={() =>
            onChange(
              Math.min(currentPage + 1, totalPages),
            )
          }
          disabled={currentPage >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
        >
          다음
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}