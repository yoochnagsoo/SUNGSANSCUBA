"use client";

import { useState } from "react";

export default function AdminLogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await fetch("/api/admin/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch (error) {
      console.error(error);
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loggingOut ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}