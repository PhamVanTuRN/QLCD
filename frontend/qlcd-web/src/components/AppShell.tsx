"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Building2, Menu, ShieldAlert, X } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Sidebar, { canOpenPage } from "@/components/Sidebar";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const menu = useRef<HTMLDialogElement>(null);

  const restricted = !isAuthenticated || user?.mustChangePassword || user?.needsAuthenticator;
  const destination = user?.needsAuthenticator ? "/account-security" : "/login";
  useEffect(() => {
    if (restricted && pathname !== destination) router.replace(destination);
  }, [restricted, pathname, destination, router]);

  // Login page → render without sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }
  if (user?.needsAuthenticator && pathname === "/account-security") {
    return <main className="min-h-dvh bg-background">{children}</main>;
  }

  // Not authenticated and not on login → show nothing (redirect will happen)
  if (restricted) {
    return <main className="grid min-h-dvh place-items-center" role="status">Đang chuyển đến bước xác thực…</main>;
  }

  // Authenticated → render with sidebar shell
  return (
    <div className="min-h-dvh lg:flex">
      <a className="sr-only z-50 rounded bg-surface p-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3" href="#main-content">
        Đến nội dung chính
      </a>
      <div className="sticky top-0 hidden h-dvh w-[15.75rem] shrink-0 lg:block"><Sidebar /></div>
      <dialog ref={menu} aria-label="Menu công đoàn" className="mobile-navigation">
        <button type="button" className="absolute top-5 right-3 z-10 rounded-lg p-2 text-white hover:bg-white/15"
          aria-label="Đóng điều hướng" onClick={() => menu.current?.close()}>
          <X size={20} aria-hidden="true" />
        </button>
        <Sidebar onNavigate={() => menu.current?.close()} />
      </dialog>
      <div className="min-w-0 flex-1 bg-background">
        <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-line border-t-3 border-t-brand bg-surface px-4 sm:px-6 lg:px-8">
          <button type="button" aria-label="Mở điều hướng" aria-haspopup="dialog"
            className="-ml-1 rounded-lg p-2 text-brand hover:bg-brand-soft lg:hidden" onClick={() => menu.current?.showModal()}>
            <Menu size={22} aria-hidden="true" />
          </button>
          <Building2 size={18} className="hidden shrink-0 text-brand lg:block" aria-hidden="true" />
          <div className="min-w-0 grow truncate text-sm font-semibold text-ink">{user?.donViTen ?? "Công đoàn Bệnh viện TWQĐ 108"}</div>
          <span className="hidden shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong sm:block">{user?.vaiTro}</span>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-[100rem] p-4 sm:p-6 lg:p-8">
          {canOpenPage(pathname, user?.role) ? children :
            <section className="panel space-y-3 p-6">
              <ShieldAlert size={24} className="text-gold-ink" aria-hidden="true" />
              <h1 className="text-xl font-semibold">Bạn chưa có quyền mở trang này</h1>
              <Link href="/" className="inline-block text-sm font-semibold text-brand-hover underline">Về tổng quan</Link>
            </section>}
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
