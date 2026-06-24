"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/Sidebar";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login" || pathname === "/login/";

  useEffect(() => {
    if (!isAuthenticated && !isLoginPage) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoginPage, router]);

  // Login page → render without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Not authenticated and not on login → show nothing (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated → render with sidebar shell
  return (
    <div className="h-full flex bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100/40 overflow-y-auto relative">
        {/* Soft glowing ambient details */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
        
        <header className="h-16 flex items-center justify-between px-8 bg-[#155a27] sticky top-0 z-10 shadow-md text-white">
          <div className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span>🏥</span> Hệ thống Quản lý Công tác Công đoàn
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-semibold border border-white/20 shadow-xs">
              Phần mềm Công đoàn số
            </span>
            <span className="text-xs text-emerald-200/85 font-medium">
              {new Date().toLocaleDateString("vi-VN")}
            </span>
          </div>
        </header>
        <main className="flex-1 p-8 relative z-10">
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
