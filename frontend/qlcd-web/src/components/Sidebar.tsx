"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, ChartNoAxesColumn, CircleUserRound, ClipboardCheck, KeyRound, LayoutDashboard,
  Lightbulb, ListTree, LogOut, Settings, Shield, Trophy, Users, Wallet,
} from "lucide-react";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import BrandMark from "@/components/BrandMark";

const nav = [
  { name: "Tổ chức", items: [
    { href: "/", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/organizations", label: "Cây tổ chức", icon: ListTree },
    { href: "/members", label: "Đoàn viên", icon: Users },
  ] },
  { name: "Nghiệp vụ", items: [
    { href: "/activities", label: "Hoạt động", icon: Activity },
    { href: "/finance", label: "Tài chính và đoàn phí", icon: Wallet },
    { href: "/welfare", label: "Phúc lợi và cứu trợ", icon: ClipboardCheck },
    { href: "/initiatives", label: "Sáng kiến và đề tài", icon: Lightbulb },
    { href: "/emulations", label: "Thi đua", icon: Trophy },
    { href: "/quality", label: "Tổng hợp thi đua", icon: ChartNoAxesColumn },
  ] },
  { name: "Quản trị", items: [
    { href: "/catalogs", label: "Danh mục", icon: Settings },
    { href: "/accounts", label: "Tài khoản", icon: KeyRound },
  ] },
];

export function canOpenPage(pathname: string, role: UserProfile["role"] | undefined) {
  const route = pathname.split("/")[1];
  if (["finance", "welfare", "initiatives", "emulations", "quality"].includes(route)) return Boolean(role && role !== "ADMIN");
  if (route === "accounts") return role === "ADMIN";
  if (route === "catalogs") return role === "ADMIN" || role === "CDCS";
  return true;
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function signOut() {
    setLoggingOut(true);
    setLogoutError(false);
    if (await logout()) onNavigate?.();
    else setLogoutError(true);
    setLoggingOut(false);
  }

  return (
    <aside className="sidebar flex h-full min-h-0 flex-col">
      <Link href="/" onClick={onNavigate} className="mx-4 flex min-h-20 items-center gap-3 border-b border-white/15 px-1 py-4 pr-10 lg:pr-1">
        <BrandMark />
        <span>
          <span className="block text-base leading-tight font-bold tracking-tight text-white">Công đoàn số 108</span>
          <span className="mt-1 block text-xs text-blue-100">Bệnh viện TWQĐ 108</span>
        </span>
      </Link>
      <nav aria-label="Điều hướng chính" className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {nav.map(group => {
          const items = group.items.filter(item => canOpenPage(item.href, user?.role));
          if (!items.length) return null;
          return <div key={group.name} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-blue-100 uppercase">{group.name}</p>
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
              return <Link key={href} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${active
                  ? "border-gold bg-white/15 font-semibold text-white" : "border-transparent font-medium text-blue-50 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={17} className="shrink-0" aria-hidden="true" /> {label}
              </Link>;
            })}
          </div>;
        })}
      </nav>
      {user && <div className="space-y-1 border-t border-white/15 px-4 py-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-white/8 px-2.5 py-2.5">
          <CircleUserRound size={22} className="shrink-0 text-blue-100" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white" title={user.hoTen}>{user.hoTen}</p>
            <p className="text-xs text-blue-100">{user.vaiTro}</p>
          </div>
        </div>
        <Link href="/login?change=1" onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-50 hover:bg-white/10">
          <KeyRound size={16} aria-hidden="true" /> Đổi mật khẩu
        </Link>
        <Link href="/account-security" onClick={onNavigate} aria-current={pathname === "/account-security" ? "page" : undefined}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-50 hover:bg-white/10 aria-[current=page]:bg-white/15">
          <Shield size={16} aria-hidden="true" /> Bảo mật tài khoản
        </Link>
        <button type="button" onClick={signOut} disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-50 hover:bg-white/10 disabled:opacity-60">
          <LogOut size={17} aria-hidden="true" /> {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
        </button>
        {logoutError && <p role="alert" className="px-2 text-sm text-rose-100">Không thể đăng xuất. Vui lòng thử lại.</p>}
      </div>}
    </aside>
  );
}
