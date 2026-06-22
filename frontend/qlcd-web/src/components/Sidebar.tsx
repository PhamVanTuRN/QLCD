"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  LayoutDashboard, 
  Network, 
  Users, 
  ClipboardList, 
  Calendar, 
  DollarSign, 
  Heart, 
  Lightbulb, 
  Award, 
  Folder, 
  Key,
  LogOut
} from "lucide-react";

const mainNavItems = [
  { href: "/", label: "Dashboard Tổng quan", icon: LayoutDashboard },
  { href: "/organizations", label: "Cây Tổ chức", icon: Network },
  { href: "/members", label: "Quản lý Đoàn viên", icon: Users },
  { href: "/quality", label: "Chất lượng Công đoàn", icon: ClipboardList },
];

const extraNavItems = [
  { href: "/activities", label: "Hoạt động Công đoàn", icon: Calendar },
  { href: "/finance", label: "Tài chính & Đoàn phí", icon: DollarSign },
  { href: "/welfare", label: "Phúc lợi & Cứu trợ", icon: Heart },
  { href: "/initiatives", label: "Sáng kiến & Đề tài", icon: Lightbulb },
  { href: "/emulations", label: "Thi đua Trực tuyến", icon: Award },
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

  const isSystemAdmin = user?.vaiTro === "Administrator";
  const isCdcsUser = user?.phamVi === "CDCS";

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
      {/* Brand Header with Hospital 108 Logo */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-lg p-0.5 border border-slate-700/50">
          <img src="/logo_108.png?v=3" className="w-full h-full object-contain rounded-full" alt="Logo Bệnh viện 108" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white">QLCD SỐ 108</h1>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Bệnh viện TWQĐ 108</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
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
              <Icon className="w-4 h-4 shrink-0" /> {item.label}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-slate-800/50 my-4">
          <span className="px-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Phân hệ nghiệp vụ</span>
        </div>

        {extraNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
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
              <Icon className="w-4 h-4 shrink-0" /> {item.label}
            </Link>
          );
        })}

        {isCdcsUser && (
          <>
            <div className="pt-4 border-t border-slate-800/50 my-4">
              <span className="px-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cấu hình hệ thống</span>
            </div>
            
            <Link
              href="/catalogs"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                pathname.startsWith("/catalogs")
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Folder className="w-4 h-4 shrink-0" /> Quản lý Danh mục
            </Link>

            {isSystemAdmin && (
              <Link
                href="/accounts"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  pathname.startsWith("/accounts")
                    ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Key className="w-4 h-4 shrink-0" /> Tài khoản Tổ chức
              </Link>
            )}
          </>
        )}
      </nav>

      {/* User panel */}
      {user && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs border border-emerald-400/20 shadow-md">
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
            className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 text-[10px] font-bold py-2 rounded-lg border border-slate-800 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng xuất
          </button>
        </div>
      )}
    </aside>
  );
}
