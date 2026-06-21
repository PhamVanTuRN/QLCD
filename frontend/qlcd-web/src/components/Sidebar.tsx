"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const mainNavItems = [
  { href: "/", label: "Dashboard Tổng quan", icon: "📊" },
  { href: "/organizations", label: "Cây Tổ chức", icon: "🌿" },
  { href: "/members", label: "Quản lý Đoàn viên", icon: "👥" },
  { href: "/quality", label: "Chất lượng Công đoàn", icon: "📋" },
];

const extraNavItems = [
  { href: "/activities", label: "Hoạt động Công đoàn", icon: "📅" },
  { href: "/finance", label: "Tài chính & Đoàn phí", icon: "💰" },
  { href: "/welfare", label: "Phúc lợi & Cứu trợ", icon: "🏥" },
  { href: "/initiatives", label: "Sáng kiến & Đề tài", icon: "💡" },
  { href: "/emulations", label: "Thi đua Trực tuyến", icon: "🏆" },
];

const adminNavItems = [
  { href: "/catalogs", label: "Quản lý Danh mục", icon: "🗂️" },
  { href: "/accounts", label: "Tài khoản Tổ chức", icon: "🔑" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case "CDCS": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "CDBP": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "TOCD": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const showAdminMenu = user?.phamVi === "CDCS";

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/50 text-[10px]">
          108
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white">QLCD SỐ 108</h1>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Bệnh viện TWQĐ 108</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                  : "text-slate-300 hover:bg-slate-900 hover:text-emerald-400"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-slate-800/50 my-4">
          <span className="px-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Phân hệ nghiệp vụ</span>
        </div>

        {extraNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          );
        })}

        {showAdminMenu && (
          <>
            <div className="pt-4 border-t border-slate-800/50 my-4">
              <span className="px-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cấu hình hệ thống</span>
            </div>
            {adminNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User panel */}
      {user && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center font-semibold text-white text-xs">
              {user.hoTen.split(" ").map(w => w[0]).slice(-2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.hoTen}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getScopeBadgeColor(user.phamVi)}`}>
                  {user.phamVi}
                </span>
                <span className="text-[10px] text-emerald-500 font-medium truncate">{user.vaiTro}</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full text-center bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 text-[10px] font-semibold py-2 rounded-lg border border-slate-800 transition-all"
          >
            🚪 Đăng xuất
          </button>
        </div>
      )}
    </aside>
  );
}
