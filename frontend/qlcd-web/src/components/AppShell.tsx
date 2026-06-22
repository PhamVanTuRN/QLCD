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
    <div className="h-full flex bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/60 overflow-y-auto relative">
        {/* Soft glowing ambient details */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
        
        <header className="h-16 border-b border-slate-800/80 flex items-center justify-between px-8 bg-slate-950/30 backdrop-blur-md sticky top-0 z-10">
          <div className="text-sm font-bold text-white tracking-wide">Hệ thống Quản lý Công tác Công đoàn</div>
          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 shadow-sm">
              Phần mềm Công đoàn số
            </span>
            <span className="text-xs text-slate-400 font-medium">
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
