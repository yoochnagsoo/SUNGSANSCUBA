import { cookies } from "next/headers";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { verifyAdminToken } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("admin_token")?.value;

  /*
   * /admin/login 역시 이 레이아웃을 통과합니다.
   *
   * 로그인 전에는 관리자 UI를 표시하지 않고
   * 로그인 페이지 콘텐츠만 그대로 렌더링합니다.
   *
   * 보호된 관리자 페이지의 인증 차단은 middleware에서 처리합니다.
   */
  if (!token) {
    return <>{children}</>;
  }

  const payload =
    await verifyAdminToken(token);

  /*
   * 만료되었거나 잘못된 토큰도 여기서 다시 리디렉션하지 않습니다.
   * middleware가 쿠키 삭제 및 로그인 페이지 이동을 담당합니다.
   *
   * 레이아웃에서 /admin/login으로 리디렉션하면
   * 로그인 페이지도 같은 레이아웃을 통과하므로
   * 무한 리디렉션이 발생할 수 있습니다.
   */
  if (!payload) {
    return <>{children}</>;
  }

  return (
    <div className="admin-ui min-h-dvh overflow-x-hidden bg-slate-50">
      <AdminSidebar
        adminRole={payload.adminRole}
        adminName={payload.adminName}
        menuPermissions={
          payload.menuPermissions
        }
      />

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-72">
        <AdminHeader
          adminId={payload.adminId}
          adminName={payload.adminName}
          adminRole={payload.adminRole}
          menuPermissions={
            payload.menuPermissions
          }
        />

        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}