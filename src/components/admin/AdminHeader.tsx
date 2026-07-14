import AdminMobileMenu from "./AdminMobileMenu";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import {
  ADMIN_ROLE_LABEL,
  type AdminRole,
} from "@/lib/adminAccounts";
import type { AdminMenuKey } from "@/lib/adminPermissions";

type AdminHeaderProps = {
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  menuPermissions: AdminMenuKey[];
};

export default function AdminHeader({
  adminId,
  adminName,
  adminRole,
  menuPermissions,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AdminMobileMenu
            adminRole={adminRole}
            adminName={adminName}
            menuPermissions={menuPermissions}
          />

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500">
              관리자 페이지
            </p>

            <h2 className="truncate text-sm font-bold text-slate-900 sm:text-lg">
              SEONG SAN SCUBA Dive Center
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden min-w-0 rounded-xl bg-slate-100 px-4 py-2 sm:block">
            <p className="max-w-[160px] truncate text-sm font-bold text-slate-900">
              {adminName}
            </p>

            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              {ADMIN_ROLE_LABEL[adminRole]} · {adminId}
            </p>
          </div>

          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}