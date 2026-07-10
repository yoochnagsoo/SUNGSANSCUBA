import {
  SignJWT,
  jwtVerify,
  type JWTPayload,
} from "jose";

import type {
  AdminAccount,
  AdminRole,
} from "@/lib/adminAccounts";
import {
  normalizeAdminMenuPermissions,
  type AdminMenuKey,
} from "@/lib/adminPermissions";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "dev-secret-change-me",
);

export interface AdminTokenPayload extends JWTPayload {
  role: "admin";
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  menuPermissions: AdminMenuKey[];
}

function isAdminRole(
  value: unknown,
): value is AdminRole {
  return (
    value === "OWNER" ||
    value === "MANAGER" ||
    value === "STAFF"
  );
}

function normalizeAdminTokenPayload(
  payload: JWTPayload,
): AdminTokenPayload | null {
  if (
    payload.role !== "admin" ||
    typeof payload.adminId !== "string" ||
    payload.adminId.length === 0 ||
    typeof payload.adminName !== "string" ||
    payload.adminName.length === 0 ||
    !isAdminRole(payload.adminRole)
  ) {
    return null;
  }

  return {
    ...payload,
    role: "admin",
    adminId: payload.adminId,
    adminName: payload.adminName,
    adminRole: payload.adminRole,
    menuPermissions: normalizeAdminMenuPermissions(
      payload.menuPermissions,
      payload.adminRole,
    ),
  };
}

export async function createAdminToken(
  account: AdminAccount,
) {
  return new SignJWT({
    role: "admin",
    adminId: account.id,
    adminName: account.name,
    adminRole: account.role,
    menuPermissions: normalizeAdminMenuPermissions(
      account.menuPermissions,
      account.role,
    ),
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(account.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAdminToken(
  token: string,
): Promise<AdminTokenPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);

    return normalizeAdminTokenPayload(
      verified.payload,
    );
  } catch {
    return null;
  }
}