"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import type {
  AdminAccount,
  AdminRole,
} from "@/lib/adminAccounts";
import {
  ADMIN_MENU_DEFINITIONS,
  getDefaultAdminMenuPermissions,
  normalizeAdminMenuPermissions,
  type AdminMenuKey,
} from "@/lib/adminPermissions";

type AccountsApiResponse = {
  ok: boolean;
  accounts?: AdminAccount[];
  account?: AdminAccount;
  currentAdminId?: string;
  currentAccountChanged?: boolean;
  message?: string;
  error?: string;
};

type AccountForm = {
  id: string;
  name: string;
  password: string;
  passwordConfirm: string;
  role: AdminRole;
  active: boolean;
  menuPermissions: AdminMenuKey[];
};

const ADMIN_ROLE_OPTIONS: Array<{
  value: AdminRole;
  label: string;
  description: string;
}> = [
  {
    value: "OWNER",
    label: "OWNER",
    description:
      "모든 관리자 메뉴와 계정관리 기능을 사용할 수 있습니다.",
  },
  {
    value: "MANAGER",
    label: "MANAGER",
    description:
      "운영 관리자입니다. 메뉴별 권한을 직접 지정할 수 있습니다.",
  },
  {
    value: "STAFF",
    label: "STAFF",
    description:
      "일반 직원입니다. 필요한 메뉴만 선택해 허용할 수 있습니다.",
  },
];

function createInitialForm(): AccountForm {
  return {
    id: "",
    name: "",
    password: "",
    passwordConfirm: "",
    role: "STAFF",
    active: true,
    menuPermissions:
      getDefaultAdminMenuPermissions("STAFF"),
  };
}

function getApiErrorMessage(
  response: AccountsApiResponse,
  fallbackMessage: string,
) {
  return (
    response.message ||
    response.error ||
    fallbackMessage
  );
}

function formatDateTime(value?: string) {
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
    hour12: false,
  }).format(date);
}

function getRoleBadgeClassName(role: AdminRole) {
  if (role === "OWNER") {
    return "bg-violet-100 text-violet-700 ring-violet-200";
  }

  if (role === "MANAGER") {
    return "bg-cyan-100 text-cyan-700 ring-cyan-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function sortAccounts(accounts: AdminAccount[]) {
  const roleOrder: Record<AdminRole, number> = {
    OWNER: 0,
    MANAGER: 1,
    STAFF: 2,
  };

  return [...accounts].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }

    if (roleOrder[a.role] !== roleOrder[b.role]) {
      return roleOrder[a.role] - roleOrder[b.role];
    }

    return a.name.localeCompare(b.name, "ko");
  });
}

function MenuPermissionSelector({
  role,
  permissions,
  onChange,
}: {
  role: AdminRole;
  permissions: AdminMenuKey[];
  onChange: (permissions: AdminMenuKey[]) => void;
}) {
  const normalizedPermissions =
    normalizeAdminMenuPermissions(
      permissions,
      role,
    );

  function toggleMenu(key: AdminMenuKey) {
    if (
      role === "OWNER" ||
      key === "DASHBOARD" ||
      key === "ACCOUNTS"
    ) {
      return;
    }

    const nextPermissions =
      normalizedPermissions.includes(key)
        ? normalizedPermissions.filter(
            (item) => item !== key,
          )
        : [...normalizedPermissions, key];

    onChange(
      normalizeAdminMenuPermissions(
        nextPermissions,
        role,
      ),
    );
  }

  function selectAll() {
    onChange(
      normalizeAdminMenuPermissions(
        ADMIN_MENU_DEFINITIONS.map(
          (menu) => menu.key,
        ),
        role,
      ),
    );
  }

  function resetByRole() {
    onChange(
      getDefaultAdminMenuPermissions(role),
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700">
            메뉴별 접근 권한
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            체크한 메뉴만 사이드바에 표시되며 URL 직접
            접근도 차단됩니다.
          </p>
        </div>

        {role !== "OWNER" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetByRole}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              역할 기본값
            </button>

            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100"
            >
              전체 선택
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {ADMIN_MENU_DEFINITIONS.map((menu) => {
          const checked =
            normalizedPermissions.includes(menu.key);

          const locked =
            role === "OWNER" ||
            menu.key === "DASHBOARD" ||
            menu.key === "ACCOUNTS";

          const unavailable =
            role !== "OWNER" &&
            menu.key === "ACCOUNTS";

          return (
            <button
              key={menu.key}
              type="button"
              disabled={locked}
              onClick={() => toggleMenu(menu.key)}
              className={[
                "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                checked
                  ? "border-cyan-400 bg-cyan-50"
                  : "border-slate-200 bg-white",
                locked
                  ? "cursor-not-allowed opacity-70"
                  : "hover:border-cyan-300 hover:bg-cyan-50/60",
                unavailable
                  ? "border-slate-200 bg-slate-100"
                  : "",
              ].join(" ")}
            >
              <span
                className={[
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                  checked
                    ? "border-cyan-600 bg-cyan-600 text-white"
                    : "border-slate-300 bg-white",
                ].join(" ")}
              >
                {checked ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-black text-slate-900">
                  {menu.name}
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {unavailable
                    ? "관리자 계정관리는 OWNER만 사용할 수 있습니다."
                    : menu.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>(
    [],
  );
  const [currentAdminId, setCurrentAdminId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [createFormOpen, setCreateFormOpen] =
    useState(false);
  const [createForm, setCreateForm] =
    useState<AccountForm>(createInitialForm);

  const [editingAccount, setEditingAccount] =
    useState<AdminAccount | null>(null);
  const [editForm, setEditForm] =
    useState<AccountForm | null>(null);

  const sortedAccounts = useMemo(
    () => sortAccounts(accounts),
    [accounts],
  );

  const activeAccountCount = useMemo(
    () =>
      accounts.filter((account) => account.active)
        .length,
    [accounts],
  );

  const ownerCount = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.role === "OWNER" &&
          account.active,
      ).length,
    [accounts],
  );

  const loadAccounts = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      try {
        const response = await fetch(
          "/api/admin/accounts",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as AccountsApiResponse;

        if (!response.ok || !result.ok) {
          throw new Error(
            getApiErrorMessage(
              result,
              "관리자 계정 목록을 불러오지 못했습니다.",
            ),
          );
        }

        setAccounts(result.accounts ?? []);
        setCurrentAdminId(
          result.currentAdminId ?? "",
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "관리자 계정 목록을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  function resetMessages() {
    setPageError("");
    setSuccessMessage("");
  }

  function changeCreateRole(role: AdminRole) {
    setCreateForm((current) => ({
      ...current,
      role,
      menuPermissions:
        getDefaultAdminMenuPermissions(role),
    }));
  }

  function changeEditRole(role: AdminRole) {
    setEditForm((current) =>
      current
        ? {
            ...current,
            role,
            menuPermissions:
              getDefaultAdminMenuPermissions(role),
          }
        : current,
    );
  }

  function openCreateForm() {
    resetMessages();
    setCreateForm(createInitialForm());
    setCreateFormOpen(true);
  }

  function openEditForm(account: AdminAccount) {
    resetMessages();

    setEditingAccount(account);
    setEditForm({
      id: account.id,
      name: account.name,
      password: "",
      passwordConfirm: "",
      role: account.role,
      active: account.active,
      menuPermissions:
        normalizeAdminMenuPermissions(
          account.menuPermissions,
          account.role,
        ),
    });
  }

  async function handleCreate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    resetMessages();

    const id = createForm.id.trim().toLowerCase();
    const name = createForm.name.trim();

    if (!id) {
      setPageError("로그인 아이디를 입력해주세요.");
      return;
    }

    if (
      !/^[a-z0-9][a-z0-9._-]{2,29}$/.test(id)
    ) {
      setPageError(
        "아이디는 영문 소문자, 숫자, 점, 밑줄, 하이픈을 사용해 3~30자로 입력해주세요.",
      );
      return;
    }

    if (!name) {
      setPageError("관리자 이름을 입력해주세요.");
      return;
    }

    if (createForm.password.length < 8) {
      setPageError(
        "비밀번호는 8자 이상 입력해주세요.",
      );
      return;
    }

    if (
      createForm.password !==
      createForm.passwordConfirm
    ) {
      setPageError(
        "비밀번호 확인이 일치하지 않습니다.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/accounts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            name,
            password: createForm.password,
            role: createForm.role,
            active: createForm.active,
            menuPermissions:
              createForm.menuPermissions,
          }),
        },
      );

      const result =
        (await response.json()) as AccountsApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(
          getApiErrorMessage(
            result,
            "관리자 계정을 생성하지 못했습니다.",
          ),
        );
      }

      setCreateFormOpen(false);
      setCreateForm(createInitialForm());
      setSuccessMessage(
        `${name} 계정이 생성되었습니다.`,
      );

      await loadAccounts(true);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "관리자 계정을 생성하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingAccount || !editForm) {
      return;
    }

    resetMessages();

    const name = editForm.name.trim();

    if (!name) {
      setPageError("관리자 이름을 입력해주세요.");
      return;
    }

    if (
      editForm.password &&
      editForm.password.length < 8
    ) {
      setPageError(
        "새 비밀번호는 8자 이상 입력해주세요.",
      );
      return;
    }

    if (
      editForm.password !==
      editForm.passwordConfirm
    ) {
      setPageError(
        "비밀번호 확인이 일치하지 않습니다.",
      );
      return;
    }

    if (
      editingAccount.id === currentAdminId &&
      !editForm.active
    ) {
      setPageError(
        "현재 로그인 중인 계정은 비활성화할 수 없습니다.",
      );
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        id: editForm.id,
        name,
        role: editForm.role,
        active: editForm.active,
        menuPermissions:
          editForm.menuPermissions,
      };

      if (editForm.password) {
        body.password = editForm.password;
      }

      const response = await fetch(
        "/api/admin/accounts",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const result =
        (await response.json()) as AccountsApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(
          getApiErrorMessage(
            result,
            "관리자 계정을 수정하지 못했습니다.",
          ),
        );
      }

      setEditingAccount(null);
      setEditForm(null);
      setSuccessMessage(
        result.message ||
          `${name} 계정이 수정되었습니다.`,
      );

      await loadAccounts(true);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "관리자 계정을 수정하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  const formContent = (
    form: AccountForm,
    setForm: React.Dispatch<
      React.SetStateAction<AccountForm>
    >,
    editing: boolean,
  ) => (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="text-sm font-bold text-slate-700">
            로그인 아이디
          </span>

          <input
            type="text"
            value={form.id}
            disabled={editing}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                id: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
          />
        </label>

        <label>
          <span className="text-sm font-bold text-slate-700">
            관리자 이름
          </span>

          <input
            type="text"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />
        </label>

        <label>
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <KeyRound className="h-4 w-4" />
            {editing ? "새 비밀번호" : "비밀번호"}
          </span>

          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder={
              editing
                ? "변경할 때만 입력"
                : "8자 이상"
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />
        </label>

        <label>
          <span className="text-sm font-bold text-slate-700">
            비밀번호 확인
          </span>

          <input
            type="password"
            value={form.passwordConfirm}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                passwordConfirm:
                  event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700">
          관리자 역할
        </p>

        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {ADMIN_ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (editing) {
                  changeEditRole(option.value);
                } else {
                  changeCreateRole(option.value);
                }
              }}
              className={[
                "rounded-2xl border p-4 text-left transition",
                form.role === option.value
                  ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-100"
                  : "border-slate-200 hover:border-slate-300",
              ].join(" ")}
            >
              <p className="text-sm font-black text-slate-900">
                {option.label}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <MenuPermissionSelector
        role={form.role}
        permissions={form.menuPermissions}
        onChange={(permissions) =>
          setForm((current) => ({
            ...current,
            menuPermissions: permissions,
          }))
        }
      />

      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            계정 활성화
          </p>

          <p className="mt-1 text-xs text-slate-500">
            비활성 계정은 관리자 로그인을 할 수 없습니다.
          </p>
        </div>

        <input
          type="checkbox"
          checked={form.active}
          disabled={
            editing &&
            form.id === currentAdminId
          }
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              active: event.target.checked,
            }))
          }
          className="h-5 w-5 accent-cyan-600"
        />
      </label>
    </>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-300">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-bold">
                  OWNER 전용 관리
                </p>
              </div>

              <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                관리자 계정관리
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                관리자별로 사용할 수 있는 메뉴를 직접
                지정합니다.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void loadAccounts(true)}
                disabled={refreshing || saving}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20 disabled:opacity-50"
              >
                <RefreshCw
                  className={[
                    "h-4 w-4",
                    refreshing ? "animate-spin" : "",
                  ].join(" ")}
                />
                새로고침
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400"
              >
                <Plus className="h-4 w-4" />
                계정 추가
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3">
          <div className="border-b border-slate-200 p-5 sm:border-b-0 sm:border-r">
            <p className="text-sm font-semibold text-slate-500">
              전체 계정
            </p>
            <p className="mt-2 text-3xl font-black">
              {accounts.length}
            </p>
          </div>

          <div className="border-b border-slate-200 p-5 sm:border-b-0 sm:border-r">
            <p className="text-sm font-semibold text-slate-500">
              활성 계정
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-600">
              {activeAccountCount}
            </p>
          </div>

          <div className="p-5">
            <p className="text-sm font-semibold text-slate-500">
              활성 OWNER
            </p>
            <p className="mt-2 text-3xl font-black text-violet-600">
              {ownerCount}
            </p>
          </div>
        </div>
      </section>

      {pageError ? (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <XCircle className="h-5 w-5 shrink-0" />
          {pageError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      ) : null}

      {createFormOpen ? (
        <section className="rounded-3xl border border-cyan-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="text-lg font-black">
                신규 관리자 계정
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                계정 정보와 메뉴별 접근 권한을 설정합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateFormOpen(false)}
              disabled={saving}
              className="rounded-xl p-2 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleCreate}
            className="space-y-6 p-5 sm:p-6"
          >
            {formContent(
              createForm,
              setCreateForm,
              false,
            )}

            <div className="flex justify-end gap-2 border-t pt-5">
              <button
                type="button"
                onClick={() =>
                  setCreateFormOpen(false)
                }
                className="rounded-xl border px-5 py-3 text-sm font-bold"
              >
                취소
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                계정 생성
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-5 py-5">
          <h2 className="text-lg font-black">
            관리자 계정 목록
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            권한 수는 해당 계정이 접근할 수 있는 메뉴
            개수입니다.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        ) : (
          <div className="divide-y">
            {sortedAccounts.map((account) => {
              const permissionCount =
                normalizeAdminMenuPermissions(
                  account.menuPermissions,
                  account.role,
                ).length;

              return (
                <article
                  key={account.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <UserRound className="h-5 w-5 text-slate-600" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-900">
                          {account.name}
                        </p>

                        {account.id === currentAdminId ? (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-700">
                            현재 계정
                          </span>
                        ) : null}

                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-xs font-black ring-1 ring-inset",
                            getRoleBadgeClassName(
                              account.role,
                            ),
                          ].join(" ")}
                        >
                          {account.role}
                        </span>

                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-xs font-bold",
                            account.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          {account.active
                            ? "활성"
                            : "비활성"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {account.id} · 허용 메뉴{" "}
                        {permissionCount}개
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        수정{" "}
                        {formatDateTime(
                          account.updatedAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(account)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" />
                    수정
                  </button>
                </article>
              );
            })}

            {sortedAccounts.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center">
                <UserCog className="h-12 w-12 text-slate-300" />
                <p className="mt-3 font-bold text-slate-600">
                  등록된 계정이 없습니다.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {editingAccount && editForm ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-6">
          <div className="max-h-[95dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-4xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-lg font-black">
                  관리자 계정 수정
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingAccount.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAccount(null);
                  setEditForm(null);
                }}
                disabled={saving}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-6 p-5 sm:p-6"
            >
              {formContent(
                editForm,
                setEditForm as React.Dispatch<
                  React.SetStateAction<AccountForm>
                >,
                true,
              )}

              <div className="flex justify-end gap-2 border-t pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccount(null);
                    setEditForm(null);
                  }}
                  className="rounded-xl border px-5 py-3 text-sm font-bold"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  변경사항 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}