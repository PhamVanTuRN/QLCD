"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/Sidebar";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
    }
  }, [isAuthenticated, pathname, router]);

  // Login page → render without sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Not authenticated and not on login → show nothing (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated → render with sidebar shell
  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md sticky top-0 z-10">
          <div className="text-sm font-semibold text-slate-300">Hệ thống Quản lý Công tác Công đoàn</div>
          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              Phần mềm Công đoàn số
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString("vi-VN")}
            </span>
          </div>
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
