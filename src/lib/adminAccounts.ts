import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import {
  getAdminAccountRecordById,
  listAdminAccountRecords,
  putAdminAccountRecord,
} from "@/lib/adminAccounts/adminAccountRepository";
import {
  getDefaultAdminMenuPermissions,
  normalizeAdminMenuPermissions,
  type AdminMenuKey,
} from "@/lib/adminPermissions";

const scrypt = promisify(scryptCallback);

export type AdminRole = "OWNER" | "MANAGER" | "STAFF";

export type AdminAccount = {
  id: string;
  name: string;
  role: AdminRole;
  active: boolean;
  menuPermissions: AdminMenuKey[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminAccountRecord = AdminAccount & {
  passwordHash: string;
};

export type CreateAdminAccountInput = {
  id: string;
  name: string;
  password: string;
  role: AdminRole;
  active?: boolean;
  menuPermissions?: AdminMenuKey[];
};

export type UpdateAdminAccountInput = {
  name?: string;
  password?: string;
  role?: AdminRole;
  active?: boolean;
  menuPermissions?: AdminMenuKey[];
};

type EnvironmentAdminAccount = AdminAccount & {
  password: string;
};

type EnvironmentAdminAccountInput = {
  id?: unknown;
  name?: unknown;
  password?: unknown;
  role?: unknown;
  active?: unknown;
  menuPermissions?: unknown;
};

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  OWNER: "최고 관리자",
  MANAGER: "매니저",
  STAFF: "직원",
};

const VALID_ADMIN_ROLES: AdminRole[] = [
  "OWNER",
  "MANAGER",
  "STAFF",
];

let initializePromise: Promise<void> | null = null;

function hasDynamoAdminAccountsTable() {
  return Boolean(process.env.DYNAMODB_ADMIN_ACCOUNTS_TABLE);
}

export function isAdminRole(
  value: unknown,
): value is AdminRole {
  return VALID_ADMIN_ROLES.includes(value as AdminRole);
}

export function normalizeAdminId(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeEnvironmentAccount(
  input: EnvironmentAdminAccountInput,
): EnvironmentAdminAccount | null {
  const id = normalizeAdminId(input.id);
  const name = String(input.name ?? "").trim();
  const password = String(input.password ?? "");

  const role = isAdminRole(input.role)
    ? input.role
    : "STAFF";

  const active =
    typeof input.active === "boolean" ? input.active : true;

  if (!id || !name || !password) {
    return null;
  }

  return {
    id,
    name,
    password,
    role,
    active,
    menuPermissions: normalizeAdminMenuPermissions(
      input.menuPermissions,
      role,
    ),
  };
}

function getAccountsFromJsonEnvironment() {
  const rawValue = process.env.ADMIN_ACCOUNTS;

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      console.error(
        "[adminAccounts] ADMIN_ACCOUNTS는 JSON 배열이어야 합니다.",
      );

      return [];
    }

    const accounts = parsed
      .map((item) =>
        normalizeEnvironmentAccount(
          typeof item === "object" && item !== null
            ? (item as EnvironmentAdminAccountInput)
            : {},
        ),
      )
      .filter(
        (
          account,
        ): account is EnvironmentAdminAccount =>
          account !== null,
      );

    const uniqueAccounts = new Map<
      string,
      EnvironmentAdminAccount
    >();

    for (const account of accounts) {
      if (uniqueAccounts.has(account.id)) {
        console.warn(
          `[adminAccounts] 중복 관리자 아이디가 제외되었습니다: ${account.id}`,
        );

        continue;
      }

      uniqueAccounts.set(account.id, account);
    }

    return Array.from(uniqueAccounts.values());
  } catch (error) {
    console.error(
      "[adminAccounts] ADMIN_ACCOUNTS JSON 파싱 오류:",
      error,
    );

    return [];
  }
}

function getLegacyAdminAccount(): EnvironmentAdminAccount {
  if (
    process.env.NODE_ENV === "production" &&
    !hasDynamoAdminAccountsTable() &&
    !process.env.ADMIN_PASSWORD
  ) {
    throw new Error(
      "ADMIN_PASSWORD or ADMIN_ACCOUNTS environment variable is required in production.",
    );
  }

  return {
    id: normalizeAdminId(process.env.ADMIN_ID || "admin"),
    name: String(
      process.env.ADMIN_NAME || "최고 관리자",
    ).trim(),
    password: process.env.ADMIN_PASSWORD || "admin1234",
    role: "OWNER",
    active: true,
    menuPermissions: getDefaultAdminMenuPermissions("OWNER"),
  };
}

function getEnvironmentAdminAccounts() {
  if (
    process.env.NODE_ENV === "production" &&
    hasDynamoAdminAccountsTable() &&
    !process.env.ADMIN_ACCOUNTS
  ) {
    return [];
  }

  const accounts = getAccountsFromJsonEnvironment();

  if (accounts.length > 0) {
    return accounts;
  }

  return [getLegacyAdminAccount()];
}

function toPublicAdminAccount(
  account: AdminAccountRecord | EnvironmentAdminAccount,
): AdminAccount {
  return {
    id: account.id,
    name: account.name,
    role: account.role,
    active: account.active,
    menuPermissions: normalizeAdminMenuPermissions(
      account.menuPermissions,
      account.role,
    ),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function validateAdminId(adminId: string) {
  if (!adminId) {
    throw new Error("아이디를 입력해주세요.");
  }

  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(adminId)) {
    throw new Error(
      "아이디는 영문 소문자, 숫자, 점, 밑줄, 하이픈을 사용해 3~30자로 입력해주세요.",
    );
  }
}

function validateAdminName(name: string) {
  if (!name) {
    throw new Error("직원명을 입력해주세요.");
  }

  if (name.length > 30) {
    throw new Error("직원명은 30자 이하로 입력해주세요.");
  }
}

function validateAdminPassword(password: string) {
  if (password.length < 8) {
    throw new Error("비밀번호는 8자 이상이어야 합니다.");
  }

  if (password.length > 100) {
    throw new Error(
      "비밀번호는 100자 이하로 입력해주세요.",
    );
  }
}

export async function hashAdminPassword(password: string) {
  const normalizedPassword = String(password ?? "");

  validateAdminPassword(normalizedPassword);

  const salt = randomBytes(16).toString("hex");

  const derivedKey = (await scrypt(
    normalizedPassword,
    salt,
    64,
  )) as Buffer;

  return [
    "scrypt",
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyAdminPassword(
  password: string,
  passwordHash: string,
) {
  try {
    const [algorithm, salt, storedHash] =
      String(passwordHash).split("$");

    if (
      algorithm !== "scrypt" ||
      !salt ||
      !storedHash
    ) {
      return false;
    }

    const storedBuffer = Buffer.from(storedHash, "hex");

    const derivedKey = (await scrypt(
      String(password ?? ""),
      salt,
      storedBuffer.length,
    )) as Buffer;

    if (storedBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedBuffer, derivedKey);
  } catch {
    return false;
  }
}

async function initializeDynamoAccounts() {
  const existingAccounts = await listAdminAccountRecords();

  if (existingAccounts.length > 0) {
    return;
  }

  const environmentAccounts = getEnvironmentAdminAccounts();

  if (environmentAccounts.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  for (const account of environmentAccounts) {
    const passwordHash = await hashAdminPassword(
      account.password,
    );

    try {
      await putAdminAccountRecord(
        {
          id: account.id,
          name: account.name,
          passwordHash,
          role: account.role,
          active: account.active,
          menuPermissions: normalizeAdminMenuPermissions(
            account.menuPermissions,
            account.role,
          ),
          createdAt: now,
          updatedAt: now,
        },
        {
          onlyIfNotExists: true,
        },
      );
    } catch (error) {
      const errorName =
        error instanceof Error ? error.name : "";

      if (
        errorName !== "ConditionalCheckFailedException"
      ) {
        throw error;
      }
    }
  }
}

async function ensureDynamoAccountsInitialized() {
  if (!initializePromise) {
    initializePromise = initializeDynamoAccounts().catch(
      (error) => {
        initializePromise = null;
        throw error;
      },
    );
  }

  await initializePromise;
}

export async function getAdminAccounts(): Promise<
  AdminAccount[]
> {
  try {
    await ensureDynamoAccountsInitialized();

    const accounts = await listAdminAccountRecords();

    return accounts.map(toPublicAdminAccount);
  } catch (error) {
    console.error(
      "[adminAccounts] DynamoDB 관리자 계정 조회 실패. 환경변수 계정으로 대체합니다.",
      error,
    );

    if (hasDynamoAdminAccountsTable()) {
      throw error;
    }

    return getEnvironmentAdminAccounts().map(
      toPublicAdminAccount,
    );
  }
}

export async function getAdminAccountById(
  adminId: unknown,
): Promise<AdminAccount | null> {
  const normalizedAdminId = normalizeAdminId(adminId);

  if (!normalizedAdminId) {
    return null;
  }

  try {
    await ensureDynamoAccountsInitialized();

    const account = await getAdminAccountRecordById(
      normalizedAdminId,
    );

    return account ? toPublicAdminAccount(account) : null;
  } catch (error) {
    console.error(
      "[adminAccounts] DynamoDB 관리자 계정 단건 조회 실패. 환경변수 계정으로 대체합니다.",
      error,
    );

    if (hasDynamoAdminAccountsTable()) {
      throw error;
    }

    const fallbackAccount =
      getEnvironmentAdminAccounts().find(
        (account) => account.id === normalizedAdminId,
      );

    return fallbackAccount
      ? toPublicAdminAccount(fallbackAccount)
      : null;
  }
}

export async function authenticateAdminAccount(
  adminId: unknown,
  password: unknown,
): Promise<AdminAccount | null> {
  const normalizedAdminId = normalizeAdminId(adminId);
  const inputPassword = String(password ?? "");

  if (!normalizedAdminId || !inputPassword) {
    return null;
  }

  try {
    await ensureDynamoAccountsInitialized();

    const account = await getAdminAccountRecordById(
      normalizedAdminId,
    );

    if (!account || !account.active) {
      return null;
    }

    const passwordMatches = await verifyAdminPassword(
      inputPassword,
      account.passwordHash,
    );

    if (!passwordMatches) {
      return null;
    }

    return toPublicAdminAccount(account);
  } catch (error) {
    console.error(
      "[adminAccounts] DynamoDB 로그인 실패. 환경변수 계정으로 대체합니다.",
      error,
    );

    if (hasDynamoAdminAccountsTable()) {
      throw error;
    }

    const fallbackAccount =
      getEnvironmentAdminAccounts().find(
        (account) =>
          account.id === normalizedAdminId &&
          account.active &&
          account.password === inputPassword,
      );

    return fallbackAccount
      ? toPublicAdminAccount(fallbackAccount)
      : null;
  }
}

export async function createAdminAccount(
  input: CreateAdminAccountInput,
): Promise<AdminAccount> {
  await ensureDynamoAccountsInitialized();

  const id = normalizeAdminId(input.id);
  const name = String(input.name ?? "").trim();
  const password = String(input.password ?? "");

  validateAdminId(id);
  validateAdminName(name);
  validateAdminPassword(password);

  if (!isAdminRole(input.role)) {
    throw new Error(
      "올바른 계정 권한을 선택해주세요.",
    );
  }

  const existing = await getAdminAccountRecordById(id);

  if (existing) {
    throw new Error("이미 사용 중인 아이디입니다.");
  }

  const now = new Date().toISOString();

  const account: AdminAccountRecord = {
    id,
    name,
    passwordHash: await hashAdminPassword(password),
    role: input.role,
    active:
      typeof input.active === "boolean"
        ? input.active
        : true,
    menuPermissions: normalizeAdminMenuPermissions(
      input.menuPermissions,
      input.role,
    ),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await putAdminAccountRecord(account, {
      onlyIfNotExists: true,
    });
  } catch (error) {
    const errorName =
      error instanceof Error ? error.name : "";

    if (
      errorName === "ConditionalCheckFailedException"
    ) {
      throw new Error("이미 사용 중인 아이디입니다.");
    }

    throw error;
  }

  return toPublicAdminAccount(account);
}

export async function updateAdminAccount(
  adminId: unknown,
  input: UpdateAdminAccountInput,
): Promise<AdminAccount> {
  await ensureDynamoAccountsInitialized();

  const id = normalizeAdminId(adminId);

  if (!id) {
    throw new Error(
      "수정할 계정 아이디가 없습니다.",
    );
  }

  const current = await getAdminAccountRecordById(id);

  if (!current) {
    throw new Error(
      "수정할 계정을 찾을 수 없습니다.",
    );
  }

  const nextName =
    typeof input.name === "string"
      ? input.name.trim()
      : current.name;

  const nextRole =
    typeof input.role === "string"
      ? input.role
      : current.role;

  const nextActive =
    typeof input.active === "boolean"
      ? input.active
      : current.active;

  validateAdminName(nextName);

  if (!isAdminRole(nextRole)) {
    throw new Error(
      "올바른 계정 권한을 선택해주세요.",
    );
  }

  const removesActiveOwner =
    current.role === "OWNER" &&
    current.active &&
    (nextRole !== "OWNER" || !nextActive);

  if (removesActiveOwner) {
    const allAccounts = await listAdminAccountRecords();

    const otherActiveOwnerExists = allAccounts.some(
      (account) =>
        account.id !== current.id &&
        account.role === "OWNER" &&
        account.active,
    );

    if (!otherActiveOwnerExists) {
      throw new Error(
        "마지막 최고 관리자 계정은 권한을 변경하거나 비활성화할 수 없습니다.",
      );
    }
  }

  let passwordHash = current.passwordHash;

  if (
    typeof input.password === "string" &&
    input.password.length > 0
  ) {
    validateAdminPassword(input.password);

    passwordHash = await hashAdminPassword(
      input.password,
    );
  }

  const requestedPermissions =
    typeof input.menuPermissions === "undefined"
      ? current.menuPermissions
      : input.menuPermissions;

  const updated: AdminAccountRecord = {
    ...current,
    name: nextName,
    role: nextRole,
    active: nextActive,
    menuPermissions: normalizeAdminMenuPermissions(
      requestedPermissions,
      nextRole,
    ),
    passwordHash,
    updatedAt: new Date().toISOString(),
  };

  try {
    await putAdminAccountRecord(updated, {
      onlyIfExists: true,
    });
  } catch (error) {
    const errorName =
      error instanceof Error ? error.name : "";

    if (
      errorName === "ConditionalCheckFailedException"
    ) {
      throw new Error(
        "수정할 계정을 찾을 수 없습니다.",
      );
    }

    throw error;
  }

  return toPublicAdminAccount(updated);
}
